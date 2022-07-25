require('dotenv').config()
require('./config/database').connect()
import express, { Application, Request, Response } from 'express'
import cloudinary from 'cloudinary'
const cloudinaryV2 = cloudinary.v2
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authInSocketIO } from './middleware/auth'
import { corsOptions } from './utils/utilVariables'
import { Server } from 'socket.io'
import {
  getInboxes,
  message,
  messageDelivered,
  messageSeen,
  messageSeenAll,
} from './controllers/chatSystemController'
import {
  handleUserConnect,
  handleUserDisconnect,
} from './controllers/onlineStatusController'
import postRoute from './routes/post'
import chatRoute from './routes/chat'
import followUnfollowRoute from './routes/followUnfollow'
import profilePageRoute from './routes/profilePage'
import userRoute from './routes/user'
import Inbox from './models/inbox'
import Chat from './models/chat'
const app: Application = express()
app.use(cors(corsOptions))
app.use(express.json({ limit: '20mb' }))
app.use(cookieParser())

cloudinaryV2.config({
  cloud_name: 'dbevmtl8a',
  api_key: '361927556573343',
  api_secret: 'TvCwLE-aYy9lWo1VQRbEgX86Cmk',
})

// TODO: express server and socket.io server should be served from the same port
//socket.io
const io = new Server(4001, { cors: corsOptions })
io.use(authInSocketIO)

io.on('connection', async (socket) => {
  // @ts-ignore
  const userId = socket.jwtPayload._id
  // online status of users
  handleUserConnect(socket, io)
  socket.on('disconnect', () => handleUserDisconnect(socket, io))
  // online status of users --end
  socket.on('get-inboxes', (data, callback) => getInboxes(socket, io, callback))
  socket.on('message', (data, callback) => message(socket, io, data, callback))
  socket.on('message-delivered', (data) => messageDelivered(socket, io, data))
  socket.on('message-seen', async (data) => messageSeen(socket, io, data))
  socket.on('message-seen-all', async (data) =>
    messageSeenAll(socket, io, data)
  )

  // telling other users that all messages they sent are delivered happens in online-status event
  // TODO: read receipts isn't available for groups
  // $size: 2
  // tell users who are subscribed to online-status of this user that their messages are delivered
  const inboxFilter = {
    participants: { $elemMatch: { _id: userId } },
    'lastActivity.messageStatus': 'sent',
    'lastActivity.sentBy': { $ne: userId },
  }
  const inboxes: any = await Inbox.find(inboxFilter)
  // messages are delivered to this user so update inbox lastActivities and chats
  await Inbox.updateMany(
    { inboxFilter },
    {
      $set: { 'lastActivity.messageStatus': 'delivered' } as any,
    }
  )
  const inboxIds = inboxes.map((v: any) => {
    return {
      sentTo: v._id,
      messageStatus: 'sent',
      sentBy: { $ne: userId },
    }
  })
  if (inboxIds.length === 0) return
  await Chat.updateMany(
    { $or: inboxIds },
    {
      $set: { messageStatus: 'delivered' } as any,
    }
  )
})
// socket.io - end

app.use('/api', userRoute)
app.use('/api', postRoute)
app.use('/api', chatRoute)
app.use('/api', followUnfollowRoute)
app.use('/api', profilePageRoute)

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

export default app
