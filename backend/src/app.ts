require('dotenv').config()
require('./config/database').connect()
import express, { Application, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import User from './model/user'
import Post from './model/post'
import auth from './middleware/auth'
import { cookieOptions } from './utils/utilVariables'
const app: Application = express()
app.use(express.json())
app.use(cookieParser())

app.get('/', auth, async (req: Request, res: Response) => {
  // @ts-ignore
  if (!!req.searchUserBy && Object.keys(req.searchUserBy)) {
    //@ts-ignore
    const user = await User.findOne(req.searchUserBy)
    res.send(user)
  } else {
    res.send('wrong credentials')
  }
})

app.get('/logout', async (req: Request, res: Response) => {
  res.status(204).clearCookie('token').send()
})

app.post('/signup', async (req: Request, res: Response) => {
  try {
    const { fullName, username, email, password } = req.body
    if (!(fullName && username && email && password)) {
      res.status(400).send('All fields are required')
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] })

    console.log('existingUser', existingUser)
    if (existingUser) {
      res.status(400).send('User already exists')
      return
    }

    let encryptedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      fullName,
      username,
      email,
      password: encryptedPassword,
    })

    const { JWT_SECRET } = process.env
    const token = jwt.sign({ username, email }, JWT_SECRET as string, {
      expiresIn: '2h',
    })
    user.token = token
    user.password = undefined
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
    console.log(searchUserBy)
    const user = await User.findOne(searchUserBy)
    if (user && bcrypt.compare(password, user.password)) {
      const { JWT_SECRET } = process.env
      const token = jwt.sign({ username, email }, JWT_SECRET as string, {
        expiresIn: '2h',
      })
      user.token = token
      user.password = undefined

      console.log(user)
      res.status(200).cookie('token', token, cookieOptions).send(user)
      return
    }
    return res.status(401).send('Invalid credentials')
  } catch (e) {
    console.log(e)
    res.status(500).send('failed to login')
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
