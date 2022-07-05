const name = 'sam'
require('dotenv').config()
require('./config/database').connect()
import express, { Application, Request, Response } from 'express'
import cloudinary from 'cloudinary'
const cloudinaryV2 = cloudinary.v2
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import User from './model/user'
import Post from './model/post'
import { auth, authInSocketIO } from './middleware/auth'
import {
  cookieOptions,
  corsOptions,
  defaultProfilePicture,
} from './utils/utilVariables'
import Comment from './model/comment'
import Like from './model/like'
import { isValidObjectId, UpdateQuery } from 'mongoose'
import Chat from './model/chat'
import Follow from './model/follow'
import Inbox from './model/inbox'
import { validateRequestBody } from './utils/utilFunctions'
import { Server } from 'socket.io'
const app: Application = express()
app.use(cors(corsOptions))
app.use(express.json({ limit: '20mb' }))
app.use(cookieParser())

cloudinaryV2.config({
  cloud_name: 'dbevmtl8a',
  api_key: '361927556573343',
  api_secret: 'TvCwLE-aYy9lWo1VQRbEgX86Cmk',
})
// app.get('/check-auth', auth, async (req: Request, res: Response) => {
//   if(req.user)
// })

//socket.io
const state: any = {}
const ids: any = []
const io = new Server(4001, { cors: corsOptions })
io.use(authInSocketIO)
io.on('connection', (socket) => {
  // @ts-ignore
  const userId = socket.jwtPayload._id
  state[userId] = socket.id
  socket.on('message', async (data, callback) => {
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
          callback({ status: 'ok', chat: { ...chat, tempChatId } })
        } catch (error) {
          console.error(error)
          callback({ status: 'error', chat: { ...chatObj, tempChatId } })
        }

        //update inbox lastActivities
        // when the chat is created successfully

        // check: use room for groups
        inbox.participants.forEach((participant: any) => {
          if (participant._id.toString() === userId) return
          if (!state[participant.id]) return
          console.log(
            'emit: message',
            participant._id === userId,
            participant._id,
            userId
          )
          io.to(state[participant.id])
            .timeout(5000)
            .emit(
              'message',
              {
                type: 'messageReceived',
                chat,
                inbox,
              },
              async (err: any, response: any) => {
                console.log('err', err)
                console.log('res2', response)
                if (response[0].status === 'ok') {
                  // tell the message sender that the message is delivered
                  io.to(state[userId]).emit('message delivered', {
                    chat,
                  })
                  // update chat document and inbox lastActivities
                  await Chat.updateOne({ _id: chat._id }, {
                    $set: { messageStatus: 'delivered' },
                  } as any)

                  await Inbox.updateOne({ _id: chat.sentTo }, {
                    $set: { messageStatus: 'delivered' },
                  } as any)
                }
              }
            )
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
  socket.on('disconnect', (data) => {})
})
// socket.io - end

app.get('/', auth, async (req: Request, res: Response) => {
  // @ts-ignore
  if (!!req.searchUserBy && Object.keys(req.searchUserBy)) {
    //@ts-ignore
    const user = await User.findOne(req.searchUserBy)
    if (user) {
      return res.send(user)
    }
    res.status(204).clearCookie('token').send('hello')
  } else {
    res.status(401).send('wrong credentials')
  }
})

app.get('/logout', async (req: Request, res: Response) => {
  res.status(204).clearCookie('token').send()
})

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
app.post(
  '/signup',
  express.json({ limit: '2mb' }),
  async (req: Request, res: Response) => {
    try {
      const { name, username, email, password, profilePicture } = req.body
      if (!(name && username && email && password)) {
        return res.status(400).send('All fields are required')
      }

      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      })

      if (existingUser) {
        return res.status(400).send('User already exists')
      }

      let encryptedPassword = await bcrypt.hash(password, 10)
      const tempUserObj: {
        name: string
        username: string
        email: string
        password: string
        profilePicture?: {
          withVersion: string
          withoutVersion: string
        }
      } = {
        name,
        username,
        email,
        password: encryptedPassword,
      }
      if (profilePicture && typeof profilePicture === 'string') {
        let result = await cloudinaryV2.uploader.upload(profilePicture, {
          folder: 'users',
          allowed_formats: ['jpg', 'png', 'webp'],
        })
        const withoutVersion = result.secure_url.replace(
          `v${result.version}/`,
          ''
        )
        tempUserObj.profilePicture = {
          withVersion: result.secure_url,
          withoutVersion,
        }
      }
      const user = await User.create(tempUserObj)

      const { JWT_SECRET } = process.env
      const token = jwt.sign(
        {
          username,
          email,
          _id: user._id,
          name,
          profilePicture: defaultProfilePicture,
        },
        JWT_SECRET as string,
        {
          expiresIn: '5d',
        }
      )
      user.token = token
      user.password = undefined
      res.status(201).cookie('token', token, cookieOptions).send(user)
    } catch (e) {
      console.log(e)

      res.status(500).send('failed to signup')
    }

    //create token
  }
)

app.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body
    if (!((username || email) && password))
      return res.status(400).send('All fields are required')

    const searchUserBy = username ? { username } : { email }
    const user = await User.findOne(searchUserBy)
    if (user && (await bcrypt.compare(password, user.password))) {
      const { JWT_SECRET } = process.env
      const token = jwt.sign(
        {
          username,
          email,
          _id: user._id,
          name: user.name,
          profilePicture: user.profilePicture.withoutVersion,
        },
        JWT_SECRET as string,
        {
          expiresIn: '5d',
        }
      )
      user.password = undefined

      return res.status(200).cookie('token', token, cookieOptions).send(user)
    }
    return res.status(401).send('Invalid credentials')
  } catch (e) {
    console.log(e)
    res.status(500).send('failed to login')
  }
})

app.post(
  '/createPost',
  express.json({ limit: '8mb' }),
  auth,
  async (req: Request, res: Response) => {
    const { caption, images } = req.body
    if (images.length < 1) return res.status(400).send('no image was sent')
    try {
      // @ts-expect-error
      console.log(req.searchUserBy.username)
      // @ts-expect-error
      if (req?.searchUserBy.username) {
        const tempPostObj: any = {
          //@ts-ignore
          postBy: { username: req.searchUserBy.username },
          caption,
          // hashtags: ,
        }
        // folder, images,
        const result = await uploadImages(images)
        if (result.status === 'ok' && result.imageArray) {
          tempPostObj.images = result.imageArray.map((v: any) => {
            const tempArray = v.url.split('.')
            tempArray.pop()
            return { url: tempArray.join('.'), publicId: v.publicId }
          })
        } else {
          return res.status(400).send('failed')
        }
        console.log('running')
        const post = await Post.create(tempPostObj)
        console.log(post)
        res.status(201).send(post)
        return
      }

      res.status(400).send('failed to create post')
    } catch (e) {
      console.log(e)
      res.status(500).send('failed to create post')
    }
  }
)

app.post('/like', auth, async (req: Request, res: Response) => {
  try {
    //@ts-ignore
    if (!req.searchUserBy.username) return res.status(400).send('please log in')
    const { _id, type } = req.body
    if (!(_id && type)) return res.status(400).send('id & type is required')
    if (!isValidObjectId(_id)) return res.status(400).send('invalid objectId')
    if (!(type === 'post' || type === 'comment'))
      return res.status(400).send('invalid type parameter')

    let result
    if (type === 'post') {
      result = await Post.updateOne({ _id }, { $inc: { likes: 1 } } as any)
    }
    if (type === 'comment') {
      result = await Comment.updateOne({ _id }, { $inc: { likes: 1 } } as any)
    }
    if (!result) return res.status(400).send('failed')
    if (result.modifiedCount === 0 && result.matchedCount === 0)
      return res.status(400).send('id does not exist')
    if (result.modifiedCount === 0) return res.status(500).send('failed')
    const like = await Like.create({
      parentId: _id,
      type,
      likedBy: {
        //@ts-ignore
        username: req.searchUserBy.username,
        //@ts-ignore
        profilePicture: req.jwtPayload.profilePicture,
      },
    })
    console.log(like)
    return res.status(201).send('liked')
  } catch (err) {
    console.log(err)
    res.status(500).send('failed')
  }
})

app.post('/comment', auth, async (req: Request, res: Response) => {
  //@ts-ignore
  if (!req.searchUserBy.username) return res.status(400).send('please log in')

  const { _id, type, comment } = req.body
  if (!(_id && type && comment)) return res.status(400).send('missing fields')
  if (!isValidObjectId(_id)) return res.status(400).send('invalid objectId')
  if (!(type === 'post' || type === 'comment' || type === 'reply'))
    return res.status(400).send('invalid type')

  let result: any
  let parentId: string = ''
  let resultType: 'comment' | 'reply' = 'comment'
  if (type === 'post') {
    result = await Post.findOneAndUpdate(
      { _id },
      { $inc: { commentCount: 1 } as any }
    )
    if (!result) return res.status(400).send(`post does not exist`)
    parentId = result._id
    resultType = 'comment'
  }
  if (type === 'comment' || type === 'reply') {
    result = await Comment.findOne({ _id })
    if (!result) return res.status(400).send(`comment does not exist`)
    if (result.type === 'comment') {
      parentId = result._id
      const incrementReplyCount = await Comment.updateOne({ _id }, {
        $inc: { replyCount: 1 },
      } as any)
    }
    if (result.type === 'reply') {
      parentId = result.parentId
      const incrementReplyCount = await Comment.updateOne(
        { _id: result.parentId },
        {
          $inc: { replyCount: 1 },
        } as any
      )
    }
    resultType = 'reply'
  }
  // @ts-ignore
  console.log(parentId)
  const tempCommentObj: any = {
    parentId,
    type: resultType,
    comment,
    commentedBy: {
      // @ts-ignore
      username: req.searchUserBy.username,
      // @ts-ignore
      profilePicture: req.jwtPayload.profilePicture,
    },
  }
  if (resultType === 'comment') {
    tempCommentObj.replyCount = 0
  }
  const commentResult = await Comment.create(tempCommentObj)
  console.log(commentResult)
  res.send(commentResult)
})

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
  const inboxes = await Inbox.find({
    //@ts-ignore
    participants: { $elemMatch: { _id: req.jwtPayload._id } },
  })
  res.send(inboxes)
})
// app.get('/')
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

const uploadImages = async (images: string[]) => {
  try {
    console.log('uploadImages')
    const promiseArray: any[] = new Array(images.length)
    const imageArray: Array<{ url: string; publicId: string }> = []
    let imageUploadErrorOccurred = false
    let responseCount = 0
    const destroyAll = () => {
      if (responseCount >= imageArray.length) {
        imageArray.forEach((v) => {
          if (v.url === '') return
          console.log(v)
          // @ts-ignore
          cloudinary.uploader
            .destroy(v.publicId)
            .then((v: any) => {
              console.log(v)
            })
            .catch((err: any) =>
              console.log(`failed to destroy image ${v} ${err}`)
            )
        })
      }
    }
    images.forEach((image: string, i: number) => {
      imageArray.push({ url: '', publicId: '' })
      promiseArray.push(
        cloudinaryV2.uploader
          .upload(image, {
            folder: 'images',
            allowed_formats: ['jpg', 'png', 'webp'],
          })
          .then((v: cloudinary.UploadApiResponse) => {
            imageArray[i].url = v.secure_url
            imageArray[i].publicId = v.public_id
            responseCount++
            if (imageUploadErrorOccurred) {
              destroyAll()
            }
          })
          .catch((err: cloudinary.UploadApiErrorResponse) => {
            // res.status(400).send('failed')
            console.log('image upload failed', err)
            imageUploadErrorOccurred = true
            responseCount++
            destroyAll()
          })
      )
    })
    await Promise.all(promiseArray)
    if (imageUploadErrorOccurred) {
      return { status: 'failed' }
    }
    return { status: 'ok', imageArray }
  } catch (error) {
    console.log(error)
    return { status: 'failed' }

    // res.send('error')
  }
}

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
