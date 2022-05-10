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
import auth from './middleware/auth'
import { cookieOptions } from './utils/utilVariables'
import Comment from './model/comment'
import Like from './model/like'
import { isValidObjectId } from 'mongoose'
import Chat from './model/chat'
import Follow from './model/follow'
const app: Application = express()

app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
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
    console.log(userData._doc)
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
      const token = jwt.sign({ username, email }, JWT_SECRET as string, {
        expiresIn: '5d',
      })
      user.token = token
      user.password = undefined
      console.log(user)
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
    if (user && bcrypt.compare(password, user.password)) {
      const { JWT_SECRET } = process.env
      const token = jwt.sign({ username, email }, JWT_SECRET as string, {
        expiresIn: '5d',
      })
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
        profilePicture: 'fawe',
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
      profilePicture: 'fda',
    },
  }
  if (resultType === 'comment') {
    tempCommentObj.replyCount = 0
  }
  const commentResult = await Comment.create(tempCommentObj)
  console.log(commentResult)
  res.send(commentResult)
})

app.post('/message', async (req: Request, res: Response) => {
  const chat = await Chat.create({
    sentBy: '6268f188adae94c27fe9fdc7',
    sentTo: '62604742278fcc13683c6055',
    message: 'keep working hard and dedicate yourself. Give your 100% always.',
  })
  console.log(chat)
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

export default app
