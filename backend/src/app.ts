require('dotenv').config()
require('./config/database').connect()
import express, { Application, Request, Response } from 'express'
import cloudinary from 'cloudinary'
const cloudinaryV2 = cloudinary.v2
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import User from './model/user'
import Post from './model/post'
import auth from './middleware/auth'
import { cookieOptions } from './utils/utilVariables'
import { writeFile } from 'fs'
import { getFileSize, getFileType } from './utils/utilFunctions'
const app: Application = express()
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

cloudinaryV2.config({
  cloud_name: 'dbevmtl8a',
  api_key: '361927556573343',
  api_secret: 'TvCwLE-aYy9lWo1VQRbEgX86Cmk',
})

app.get('/', auth, async (req: Request, res: Response) => {
  // @ts-ignore
  if (!!req.searchUserBy && Object.keys(req.searchUserBy)) {
    //@ts-ignore
    const user = await User.findOne(req.searchUserBy)
    if (user) {
      res.send(user)
      return
    }
    res.status(204).clearCookie('token').send()
  } else {
    res.send('wrong credentials')
  }
})

app.get('/logout', async (req: Request, res: Response) => {
  res.status(204).clearCookie('token').send()
})

app.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, profilePicture } = req.body
    if (!(name && username && email && password)) {
      res.status(400).send('All fields are required')
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] })

    if (existingUser) {
      res.status(400).send('User already exists')
      return
    }

    let encryptedPassword = await bcrypt.hash(password, 10)
    const tempUserObj: {
      name: string
      username: string
      email: string
      password: string
      profilePicture?: string
    } = {
      name,
      username,
      email,
      password: encryptedPassword,
    }
    if (profilePicture && typeof profilePicture === 'string') {
      const supportedFileTypes = ['jpg/jpeg', 'png', 'webp']
      if (!supportedFileTypes.includes(getFileType(profilePicture))) {
        return res
          .status(400)
          .send(
            `File type not supported. Please send ${supportedFileTypes.join(
              ' or '
            )}`
          )
      }
      if (!(getFileSize(profilePicture) < 1024 * 2)) {
        return res
          .status(400)
          .send(`Your file size is over 2mb. Please send a smaller file`)
      }
      let result = await cloudinaryV2.uploader.upload(profilePicture, {
        folder: 'users',
      })
      tempUserObj.profilePicture = result.secure_url
    }
    const user = await User.create(tempUserObj)

    const { JWT_SECRET } = process.env
    const token = jwt.sign({ username, email }, JWT_SECRET as string, {
      expiresIn: '2h',
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
})

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
        expiresIn: '2h',
      })
      user.token = token
      user.password = undefined

      res.status(200).cookie('token', token, cookieOptions).send(user)
      return
    }
    return res.status(401).send('Invalid credentials')
  } catch (e) {
    console.log(e)
    res.status(500).send('failed to login')
  }
})

app.post('/createPost', auth, async (req: Request, res: Response) => {
  try {
    // @ts-expect-error
    console.log(req.searchUserBy.username)
    // @ts-expect-error
    if (req?.searchUserBy.username) {
      const { caption } = req.body
      const post = await Post.create({
        //@ts-ignore
        postBy: { username: req.searchUserBy.username },
        caption,
        // hashtags: ,
      })
      console.log(post)
      res.status(201).send(post)
      return
    }

    res.status(400).send('failed to create post')
  } catch (e) {
    console.log(e)
    res.status(500).send('failed to create post')
  }
})

// app.post('/post', async (req: Request, res: Response) => {
//   try {
//     const {
//       text,
//       postBy: { username },
//     } = req.body
//     if (!(text && username)) {
//       res.status(400).send('text is required')
//       return
//     }

//     const post = await Post.create({
//       text,
//       postBy: { username },
//     })
//     res.send(post)
//   } catch (e) {
//     console.log(e)
//     res.send('failed to post')
//   }
// })

export default app

// get the size of base64 encoded string
// base64String = 'data:image/jpeg;base64......'

// var stringLength = base64String.length - 'data:image/png;base64,'.length

// var sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812
// var sizeInKb = sizeInBytes / 1024

// know the file type
// I wrote here for anyone who encounters with this quest, you can read the first character of content content.charAt(0). By base64 image content if the first char is:

// '/' : jpg

// 'i' : png

// 'R' : gif

// 'U' : webp

// 'A' : video/mp4 (maybe)
