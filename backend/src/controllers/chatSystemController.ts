import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { Socket } from 'socket.io'
import { io } from '../app'
import Chat from '../models/chat'
import Inbox from '../models/inbox'
import User from '../models/user'
import { validateRequestBody } from '../utils/utilFunctions'

export const inboxAndChatsByUserIds = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userOwnId = req.jwtPayload._id
    const userIds: string[] = (req.query.userIds || []) as string[]

    if (!userIds || userIds.length === 0) throw new Error('no userId given')

    // every id should be unique
    const tempSet = new Set(userIds)
    if (tempSet.has(userOwnId) || userIds.length !== tempSet.size) {
      throw new Error(
        "userIds contains user's or own id  every id should be unique"
      )
    }

    let inbox = await Inbox.findOne({
      participants: { $size: userIds.length + 1 },
      //@ts-ignore
      'participants._id': { $all: [req.jwtPayload._id, ...userIds] },
    })
    let chats = []
    if (inbox) {
      chats = await Chat.find({ sentTo: inbox._id })
    }
    if (inbox === null) {
      // every user in userIds should exist
      const users: any = await User.find(
        {
          _id: { $in: userIds },
        },
        { _id: 1, name: 1, username: 1, profilePicture: 1 }
      )

      console.log(users)

      if (users.length !== userIds.length)
        throw new Error('one or more user does not exist')

      const inboxParticipantsArr = users.map((v: any) => {
        return {
          name: v.name,
          profilePicture: v.profilePicture.withoutVersion,
          _id: v._id,
          username: v.username,
        }
      })
      const groupDetails = {
        isGroup: users.length > 1 ? true : false,
        groupName: users.length > 1 ? `group-${Date.now()}` : '',
      }
      console.log(groupDetails)
      inbox = await Inbox.create({
        participants: [
          {
            //@ts-ignore
            name: req.jwtPayload.name,
            //@ts-ignore
            profilePicture: req.jwtPayload.profilePicture,
            //@ts-ignore
            _id: req.jwtPayload._id,
            //@ts-ignore
            username: req.jwtPayload.username,
          },
          ...inboxParticipantsArr,
        ],
        lastActivity: {
          chat_id: new Types.ObjectId(),
          message: '',
          messageStatus: 'sent',
          //@ts-ignore
          sentBy: req.jwtPayload._id,
        },
        group: groupDetails,
      })
    }

    // adding online status of participants
    // no online status if group
    if (!inbox.group.isGroup) {
      const rooms = io.of('/').adapter.rooms
      const participants = inbox.participants.map((participant: any) => {
        return {
          ...participant.toObject(),
          online: rooms.has(participant._id.toString()),
        }
      })
      inbox = {
        ...inbox.toObject(),
        participants,
      }
    }
    res.send({ inbox, chats })
  } catch (err) {
    console.error(err)
  }
}

export const chat = async (req: Request, res: Response) => {
  try {
    console.log('/chat/:inboxId')
    const inboxId = req.params.inboxId
    const inbox = await Inbox.findOne({
      _id: inboxId,
      'lastActivity.message': { $ne: '' },
    })
    if (!inbox) return res.status(404).send(`invalid inboxId ${inboxId}`)
    const isUserAParticipant = inbox.participants.find(
      //@ts-ignore
      (v: any) => v._id.toString() === req.jwtPayload._id
    )
    if (!isUserAParticipant)
      return res
        .status(401)
        .send(
          `you are not authorized to see chats of this inbox. inboxId: ${inboxId}`
        )
    const chats = await Chat.find({ sentTo: req.params.inboxId })
    // if chats is null throw error
    res.send(chats)
  } catch (error) {
    console.error('error', '/chat/:inboxId')
    console.error(error)
    res.status(500).send(error)
  }
}
// {'lastActivity.message': { $ne: '' }, participants: { $elemMatch: { _id: ObjectId('628fb4c699343595e695fc37') } }}).sort({ 'lastActivity.timestamp': -1 })

export const getInboxes = async (socket: Socket, io: any, callback: any) => {
  try {
    console.log('get-inboxes event')
    // @ts-ignore
    const userId = socket.jwtPayload._id
    let inboxes: any = await Inbox.find({
      'lastActivity.message': { $ne: '' },
      participants: { $elemMatch: { _id: userId } },
    }).sort({ 'lastActivity.timestamp': -1 })
    const uniqueIds: any = {}
    const rooms = io.of('/').adapter.rooms
    const inboxesWithOnlineStatus = inboxes.map((inbox: any) => {
      if (inbox.participants.length > 2) {
        return inbox
      }
      // TODO: online status isn't available for groups
      const participants = inbox.participants.map((participant: any) => {
        uniqueIds[participant._id] = true
        return {
          ...participant.toObject(),
          online: rooms.has(participant._id.toString()),
        }
      })
      return {
        ...inbox.toObject(),
        participants,
      }
    })
    callback({ data: inboxesWithOnlineStatus })
    // subscribe to online-status of people in current inbox
    delete uniqueIds[userId]
    Object.keys(uniqueIds).forEach((v) => {
      socket.join('online-status_' + v)
    })
  } catch (err) {
    console.error(err)
    callback({ data: [] })
  }
}

export const message = async (
  socket: Socket,
  io: any,
  data: any,
  callback: any
) => {
  try {
    console.log('message event')
    // @ts-ignore
    const userId = socket.jwtPayload._id
    const { inboxId, message, tempChatId } = data
    const fieldsValid = validateRequestBody({
      _id: inboxId,
      message,
    })
    if (fieldsValid !== true) {
      return socket.emit('error', {
        type: 'messageFailed',
        data,
        errorMessage: fieldsValid,
      })
    }

    const inbox = await Inbox.findOne({ _id: inboxId })

    if (inbox === null) {
      return socket.emit('error', {
        type: 'messageFailed',
        data,
        errorMessage: `Invalid inboxId ${inboxId}`,
      })
    }
    const isUserAParticipant = inbox.participants.find(
      // @ts-ignore
      (participant: any) => participant._id.toString() === userId
    )

    if (isUserAParticipant) {
      const chatObj = {
        sentBy: userId,
        sentTo: inboxId,
        message,
        messageStatus: 'sent',
      }

      let chat: any
      let inboxLastActivityObj: any
      try {
        chat = await Chat.create(chatObj)
        inboxLastActivityObj = {
          chat_id: chat._id,
          message: chat.message,
          timestamp: chat.timeStamp,
          messageStatus: 'sent',
          sentBy: chat.sentBy,
        }
        inbox.lastActivity = inboxLastActivityObj
        console.log(
          'iiiiiiiiiiiiiiiiiiii',
          inbox.lastActivity,
          new Date().toISOString()
        )
        // tell sender that the message is sent
        callback({
          status: 'ok',
          chat: { ...chat.toObject(), tempChatId },
          inbox,
        })
      } catch (error) {
        console.error(error)
        callback({ status: 'error', chat: { ...chatObj, tempChatId } })
        return
      }

      // update inbox lastActivities
      await Inbox.updateOne(
        { _id: inboxId },
        {
          $set: {
            lastActivity: inboxLastActivityObj,
          } as any,
        }
      )
      console.log(
        // @ts-ignore
        socket.jwtPayload.username,
        'is connected from',
        io
          .of('/')
          // @ts-ignore
          .adapter.rooms.get(userId)?.size,
        'devices'
      )
      // send message to every participant
      inbox.participants.forEach((participant: any) => {
        socket.to(participant._id.toString()).emit('message', {
          chat,
          inbox,
        })
      })
      return
    }
    socket.emit('error', {
      type: 'messageFailed',
      errorMessage: 'you are not a participant',
    })
  } catch (error) {
    console.error(error)
    socket.emit('error', {
      type: 'failed',
      errorMessage: error,
    })
  }
}

export const messageDelivered = async (socket: Socket, io: any, data: any) => {
  try {
    // @ts-ignore
    const userId = socket.jwtPayload._id
    console.log('message delivered event')
    const {
      inbox: { _id: inboxId },
      chat: { _id: chatId },
    } = data
    // TODO: make sure that chat.sentBy is different from userId
    const chat = await Chat.findOne({ _id: chatId })
    if (
      !chat ||
      chat.sentBy.toString() === userId ||
      chat.messageStatus !== 'sent'
    )
      return
    const inbox = await Inbox.findOne({ _id: inboxId })
    if (!inbox || inbox.participants.length > 2) return
    if (chat.sentTo.toString() !== inboxId) return
    const isUserAParticipant = inbox.participants.find(
      //@ts-ignore
      (v: any) => v._id.toString() === userId
    )
    if (!isUserAParticipant) return
    const otherParticipant = inbox.participants.filter(
      (v: any) => v._id.toString() !== userId
    )
    // tell the message sender that the message is delivered
    // read receipts are only for private chats not for groups that why otherParticipants[0]
    io.to(otherParticipant[0]._id.toString()).emit('message-delivered', {
      chat: {
        _id: chatId,
        sentTo: inboxId,
      },
    })
    // update chat document and inbox lastActivities
    await Chat.updateOne(
      {
        _id: chatId,
        messageStatus: 'sent',
      },
      {
        $set: { messageStatus: 'delivered' },
      } as any
    )

    if (inbox.lastActivity.messageStatus !== 'sent') return
    await Inbox.updateOne(
      {
        _id: inboxId,
        'lastActivity.chat_id': chatId,
        'lastActivity.messageStatus': 'sent',
      },
      {
        $set: { 'lastActivity.messageStatus': 'delivered' },
      } as any
    )
  } catch (error) {
    console.log(error)
  }
}

export const messageSeen = async (socket: Socket, io: any, data: any) => {
  try {
    // @ts-ignore
    const userId = socket.jwtPayload._id
    console.log('message seen event')
    const {
      inbox: { _id: inboxId },
      chat: { _id: chatId },
    } = data
    // TODO: make sure that chat.sentBy is different from userId
    const chat = await Chat.findOne({ _id: chatId })
    if (
      !chat ||
      chat.sentBy.toString() === userId ||
      chat.messageStatus === 'seen'
    )
      return
    const inbox = await Inbox.findOne({ _id: inboxId })
    if (!inbox || inbox.participants.length > 2) return
    if (chat.sentTo.toString() !== inboxId) return
    const isUserAParticipant = inbox.participants.find(
      (v: any) => v._id.toString() === userId
    )
    if (!isUserAParticipant) return
    // read receipts are only for private chats not for groups that's why otherParticipants[0]
    const otherParticipantId = inbox.participants
      .filter((v: any) => v._id.toString() !== userId)[0]
      ._id.toString()
    // tell the message sender that the message is delivered
    io.to(otherParticipantId).emit('message-seen', {
      chat: {
        _id: chatId,
        sentTo: inboxId,
      },
    })
    // update chat document and inbox lastActivities
    await Chat.updateOne(
      {
        _id: chatId,
        messageStatus: { $ne: 'seen' },
      },
      {
        $set: { messageStatus: 'seen' },
      } as any
    )
    if (inbox.lastActivity.messageStatus === 'seen') return
    await Inbox.updateOne(
      {
        _id: inboxId,
        'lastActivity.chat_Id': chatId,
        'lastActivity.messageStatus': { $ne: 'seen' },
      },
      {
        $set: { 'lastActivity.messageStatus': 'seen' },
      } as any
    )
  } catch (error) {
    console.log(error)
  }
}

export const messageSeenAll = async (socket: Socket, io: any, data: any) => {
  try {
    // tell the other user that all the message they sent are seen
    console.log('messageSeenAll()')
    // @ts-ignore
    const userId = socket.jwtPayload._id
    const { inboxId } = data

    const inbox: any = await Inbox.findOne({ _id: inboxId })
    if (!inbox || inbox.participants > 2) return
    const isUserAParticipant = inbox.participants.find(
      (v: any) => v._id.toString() === userId
    )

    if (!isUserAParticipant) return
    if (
      inbox.lastActivity.messageStatus === 'delivered' &&
      inbox.lastActivity.sentBy.toString() !== userId
    ) {
      // socket emit to user
      const otherParticipantId = inbox.participants
        .filter((v: any) => v._id.toString() !== userId)[0]
        ._id.toString()

      io.to(otherParticipantId).emit('message-seen-all', { inboxId })
      // messages are seen by this user so update inbox lastActivities and chats
      await Inbox.updateOne(
        { _id: inboxId, 'lastActivity.messageStatus': 'delivered' },
        {
          $set: { 'lastActivity.messageStatus': 'seen' } as any,
        }
      )
    } else {
      console.log('was false')
    }

    await Chat.updateMany(
      { sentTo: inboxId, sentBy: { $ne: userId }, messageStatus: 'delivered' },
      {
        $set: { messageStatus: 'seen' } as any,
      }
    )
  } catch (err) {
    console.log(err)
  }
}

// // TODO: make sure that chat.sentBy is different from userId
// const chat = await Chat.findOne({ _id: lastSentChatId })
// if (
//   !chat ||
//   chat.sentBy.toString() === userId ||
//   chat.messageStatus !== 'delivered'
// )
//   return
// const inbox = await Inbox.findOne({ _id: inboxId })
// if (!inbox || inbox.participants.length > 2) return
// if (chat.sentTo.toString() !== inboxId) return
// const isUserAParticipant = inbox.participants.find(
//   //@ts-ignore
//   (v: any) => v._id.toString() === userId
// )
// if (!isUserAParticipant) return
// const otherParticipant = inbox.participants.filter(
//   (v: any) => v._id.toString() !== userId
// )
// // tell the message sender that the message is delivered
// // read receipts are only for private chats not for groups that why otherParticipants[0]
// io.to(otherParticipant[0]._id.toString()).emit('message-seen-all', {
//   chat: {
//     _id: lastSentChatId,
//     sentTo: inboxId,
//   },
// })
// // update chat document and inbox lastActivities
// await Chat.updateMany(
//   {
//     messageStatus: 'delivered',
//   },
//   {
//     $set: { messageStatus: 'delivered' },
//   } as any
// )
// if (inbox.lastActivity.messageStatus !== 'sent') return
// await Inbox.updateOne(
//   {
//     _id: inboxId,
//     lastActivity: {
//       chat_id: chatId,
//       messageStatus: 'sent',
//     },
//   },
//   {
//     $set: { 'lastActivity.messageStatus': 'delivered' },
//   } as any
// )
