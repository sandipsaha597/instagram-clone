import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { Socket } from 'socket.io'
import Chat from '../models/chat'
import Inbox from '../models/inbox'
import User from '../models/user'
import { validateRequestBody } from '../utils/utilFunctions'

export const inboxByUserId = async (req: Request, res: Response) => {
  const user = await User.findOne({ _id: req.params.userId })
  if (!user) throw new Error('user does not exist')
  let inbox = await Inbox.findOne({
    //@ts-ignore
    'participants._id': { $all: [req.jwtPayload._id, req.params.userId] },
    participants: { $size: 2 },
  })
  if (inbox === null) {
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
        {
          name: user.name,
          profilePicture: user.profilePicture.withoutVersion,
          _id: req.params.userId,
          username: user.username,
        },
      ],
      lastActivity: {
        chat_id: new Types.ObjectId(),
        message: '',
        messageStatus: 'sent',
        //@ts-ignore
        sentBy: req.jwtPayload._id,
      },
    })
    return res.send({ inboxDetails: inbox, chats: [] })
  }

  const chats = await Chat.find({ sentTo: inbox._id })
  res.send({ inboxDetails: inbox, chats })
}

export const chat = async (req: Request, res: Response) => {
  try {
    const inboxId = req.params.inboxId
    const inbox = await Inbox.findOne({ _id: inboxId })
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
    res.send(chats)
  } catch (error) {
    console.log(error)
    res.status(500).send(error)
  }
}

export const getInboxes = async (socket: Socket, io: any, callback: any) => {
  // @ts-ignore
  const userId = socket.jwtPayload._id
  let inboxes: any = await Inbox.find({
    participants: { $elemMatch: { _id: userId } },
  })
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
  Object.keys(uniqueIds).forEach((v) => {
    socket.join('online-status_' + v)
  })
}

export const message = async (
  socket: Socket,
  io: any,
  data: any,
  callback: any
) => {
  console.log('message event')
  // @ts-ignore
  const userId = socket.jwtPayload._id
  try {
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
        //@ts-ignore
        sentBy: userId,
        sentTo: inboxId,
        message,
        messageStatus: 'sent',
      }
      let chat: any
      try {
        chat = await Chat.create(chatObj)
        // tell sender that the message is sent
        callback({ status: 'ok', chat: { ...chat.toObject(), tempChatId } })
      } catch (error) {
        console.error(error)
        callback({ status: 'error', chat: { ...chatObj, tempChatId } })
        return
      }

      //TODO: update inbox lastActivities
      // when the chat is created successfully

      // check: use room for groups
      // update inbox lastActivities
      Inbox.updateOne({ lastActivity: { chat_id: chat._id } }, {
        $set: {
          chat_id: chat._id,
          message: chat.message,
          messageStatus: 'sent',
          sentBy: chat.sentBy,
        },
      } as any)
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
          type: 'messageReceived',
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
  // TODO: update only if message status in sent
  // TODO: make sure that the user have right to do these changes
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
      lastActivity: {
        chat_id: chatId,
        messageStatus: 'sent',
      },
    },
    {
      $set: { lastActivity: { messageStatus: 'delivered' } },
    } as any
  )
}
