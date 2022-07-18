require('dotenv').config()
require('./config/database').connect()
import express, { Application, Request, Response } from 'express'
import cloudinary from 'cloudinary'
const cloudinaryV2 = cloudinary.v2
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import User from './models/user'
import Post from './models/post'
import { auth, authInSocketIO } from './middleware/auth'
import { cookieOptions, corsOptions } from './utils/utilVariables'
import Comment from './models/comment'
import Like from './models/like'
import { isValidObjectId, Types } from 'mongoose'
import Chat from './models/chat'
import Follow from './models/follow'
import Inbox from './models/inbox'
import { validateRequestBody } from './utils/utilFunctions'
import { Server } from 'socket.io'
import {
  login,
  logout,
  signup,
  userDetails,
} from './controllers/userController'
import { comment, createPost, like } from './controllers/postController'
const app: Application = express()
app.use(cors(corsOptions))
app.use(express.json({ limit: '20mb' }))
app.use(cookieParser())

cloudinaryV2.config({
  cloud_name: 'dbevmtl8a',
  api_key: '361927556573343',
  api_secret: 'TvCwLE-aYy9lWo1VQRbEgX86Cmk',
})

//socket.io
const io = new Server(4001, { cors: corsOptions })
io.use(authInSocketIO)

io.on('connection', async (socket) => {
  // @ts-ignore
  const userId = socket.jwtPayload._id
  socket.join(userId)
  const userSockets = await io.in(userId).allSockets()
  if (userSockets.size === 1) {
    // @ts-ignore
    console.log('connect', socket.jwtPayload.username + ' came online')
    // @ts-ignore
    socket.to('online-status_' + userId).emit('online-status', {
      online: true,
      // @ts-ignore
      _id: socket.jwtPayload._id,
    })
  }
  socket.on('disconnect', async () => {
    const userSockets = await io.in(userId).allSockets()
    if (userSockets.size === 0) {
      //@ts-ignore
      console.log('disconnect', socket.jwtPayload.username + ' went offline')
      socket
        // @ts-ignore
        .to('online-status_' + userId)
        .emit('online-status', {
          online: false,
          // @ts-ignore
          _id: socket.jwtPayload._id,
        })
    }
  })
  socket.on('get-inboxes', async (data, callback) => {
    let inboxes: any = await Inbox.find({
      //@ts-ignore
      participants: { $elemMatch: { _id: userId } },
    })
    const uniqueIds: any = {}
    const rooms = io.of('/').adapter.rooms
    inboxes = inboxes.map((inbox: any) => {
      if (inbox.participants.length > 2) {
        return inbox
      }
      // TODO: fix it for groups
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
    callback({ data: inboxes })
    Object.keys(uniqueIds).forEach((v) => {
      socket.join('online-status_' + v)
    })
  })
  socket.on('message', async (data, callback) => {
    console.log('message event')
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
  })
  socket.on('message-delivered', async (data) => {
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
  })
  socket.on('message-seen', async (data) => {})
})
// socket.io - end

app.get('/', auth, userDetails)

app.get('/logout', logout)

app.delete('/deleteImage', async (req: Request, res: Response) => {
  const destroyAll = () => {
    // if (destroyImagesUponFail.count === images.length) {
    // @ts-ignore
    cloudinary.uploader
      .destroy('images/wjkyahqruhabtctugxsc')
      .then((v: any) => {
        console.log(v)
      })
      .catch((err: any) => console.log(err))
  }
  // }
  destroyAll()
})

// /signup
app.post('/signup', express.json({ limit: '2mb' }), signup)

app.post('/login', login)
// create post
app.post('/createPost', express.json({ limit: '8mb' }), auth, createPost)

app.post('/like', auth, like)

app.post('/comment', auth, comment)

app.get('/inbox/:userId', auth, async (req: Request, res: Response) => {
  const user = await User.findOne({ _id: req.params.userId })
  if (!user) throw new Error('user does not exist')
  let inbox = await Inbox.findOne({
    //@ts-ignore
    'participants._id': { $all: [req.jwtPayload._id, req.params.userId] },
    participants: { $size: 2 },
  })
  //@ts-ignore
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
})
app.get('/inboxes', auth, async (req: Request, res: Response) => {
  let inboxes: any = await Inbox.find({
    //@ts-ignore
    participants: { $elemMatch: { _id: req.jwtPayload._id } },
  })
  const rooms = io.of('/').adapter.rooms
  inboxes = inboxes.map((inbox: any) => {
    // TODO: fix it for groups
    const participants = inbox.participants.map((participant: any) => {
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
  res.send(inboxes)
})
app.get('/chat/:inboxId', auth, async (req: Request, res: Response) => {
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
})
app.post('/message', auth, async (req: Request, res: Response) => {
  try {
    const { inboxId, message } = req.body
    const fieldsValid = validateRequestBody({
      _id: inboxId,
      message,
    })
    if (fieldsValid !== true) {
      return res.status(400).send(fieldsValid)
    }

    const inbox = await Inbox.findOne({ _id: inboxId })

    if (inbox === null) {
      return res.status(404).send(`Invalid inboxId ${inboxId}`)
    }
    const isUserAParticipant = inbox.participants.find(
      // @ts-ignore
      (participant: any) => participant._id.toString() === req.jwtPayload._id
    )

    if (isUserAParticipant) {
      const chat = await Chat.create({
        //@ts-ignore
        sentBy: req.jwtPayload._id,
        sentTo: inboxId,
        message,
      })
      return res.send(chat)
    }
    return res.status(401).send('you are unauthorized to send this message')
  } catch (error) {
    console.error(error)
    res.status(500).send('failed')
  }
})

app.post('/follow-unfollow', auth, async (req: Request, res: Response) => {
  const follow = await Follow.create({
    follower: {
      // @ts-ignore
      username: req.searchUserBy.username,
    },
    followee: {
      username: req.body.followeeUsername,
    },
  })
  console.log(follow)
})

app.get('/:username', async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ username: req.params.username })
    let posts
    if (user) {
      posts = await Post.find({
        postBy: { username: req.params.username },
      }).limit(20)
    }
    const userData = { ...user }
    delete userData.email
    delete userData.password
    const userDetails = {
      ...userData._doc,
      posts,
    }
    res.send(userDetails)
  } catch (err) {
    console.log(err)
    res.send('failed')
  }
})

export default app
