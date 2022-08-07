import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cloudinary from 'cloudinary'
const cloudinaryV2 = cloudinary.v2
import User from '../models/user'
import { defaultProfilePicture } from '../utils/utilVariables'
import { cookieOptions } from '../utils/utilFunctions'

export const userDetails = async (req: Request, res: Response) => {
  try {
    // TODO: don't send back sensitive info
    // TODO: sent back news feed and unread msg count as well
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
  } catch (err) {
    console.error(err)
  }
}

export const login = async (req: Request, res: Response) => {
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

      return res.status(200).cookie('token', token, cookieOptions()).send(user)
    }
    return res.status(401).send('Invalid credentials')
  } catch (e) {
    console.log(e)
    res.status(500).send('failed to login')
  }
}

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, profilePicture } = req.body
    if (!(name && username && email && password)) {
      return res.status(400).send({ message: 'All fields are required' })
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(400).send({ message: 'User already exists' })
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
    res.status(201).cookie('token', token, cookieOptions()).send(user)
  } catch (e) {
    console.log(e)

    res.status(500).send({ message: 'failed to signup' })
  }

  //create token
}

export const logout = async (req: Request, res: Response) => {
  res.status(204).clearCookie('token').send()
}
