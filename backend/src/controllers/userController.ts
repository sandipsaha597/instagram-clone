import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cloudinary, { UploadApiOptions } from 'cloudinary'
const cloudinaryV2 = cloudinary.v2
import User from '../models/user'
import { defaultProfilePicture } from '../utils/utilVariables'
import { cookieOptions } from '../utils/utilFunctions'

const instagramDefaultDP =
  'https://res.cloudinary.com/dbevmtl8a/image/upload/v1660379523/users/instagram-clone-default-dp'

export const userDetails = async (req: Request, res: Response) => {
  try {
    // TODO: don't send back sensitive info
    // TODO: sent back news feed and unread msg count as well
    // @ts-ignore
    if (!!req.searchUserBy && Object.keys(req.searchUserBy)) {
      //@ts-ignore
      const user = await User.findOne(req.searchUserBy, {
        password: 0,
        email: 0,
      })
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

export const changeProfilePicture = async (req: Request, res: Response) => {
  console.log('change profile picture')
  try {
    // @ts-ignore
    const userId = req.jwtPayload._id
    const incomingProfilePicture = req.body.profilePicture

    if (!(incomingProfilePicture && typeof incomingProfilePicture === 'string'))
      return res.status(400).send({ message: 'invalid profile picture' })

    const { _id, profilePicture: userCurrentProfilePicture } =
      await User.findOne({ _id: userId }, { profilePicture: 1 })

    if (!_id) return res.status(400).send({ message: 'user does not exist' })

    const uploadOptions: UploadApiOptions = {
      public_id: userCurrentProfilePicture.cloudinaryImagePublicId,
      folder: 'users',
      allowed_formats: ['jpg', 'png', 'webp'],
      transformation: { width: 320, height: 320, crop: 'fill' },
      invalidate: true,
    }

    const result = await cloudinaryV2.uploader.upload(
      incomingProfilePicture,
      uploadOptions
    )

    console.log(result)
    // update profile picture details of the user
    const updated = await User.findOneAndUpdate(
      { _id },
      {
        $set: {
          'profilePicture.withVersion': result.secure_url,
        } as any,
      },
      { returnDocument: 'after', projection: { profilePicture: 1 } }
    )
    console.log(updated)
    res.send(updated)
  } catch (err) {
    console.error(err)
  }
}

export const removeProfilePicture = async (req: Request, res: Response) => {
  console.log('remove profile picture')
  try {
    // @ts-ignore
    const userId = req.jwtPayload._id
    const { _id, profilePicture: userCurrentProfilePicture } =
      await User.findOne({ _id: userId }, { profilePicture: 1 })
    if (!_id) return res.status(400).send('user does not exist')
    const uploadOptions: UploadApiOptions = {
      public_id: userCurrentProfilePicture.cloudinaryImagePublicId,
      folder: 'users',
      allowed_formats: ['jpg', 'png', 'webp'],
      invalidate: true,
    }
    let result = await cloudinaryV2.uploader.upload(
      instagramDefaultDP,
      uploadOptions
    )
    const updated = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          'profilePicture.withVersion': result.secure_url,
        } as any,
      },
      { returnDocument: 'after', projection: { profilePicture: 1 } }
    )
    res.send(updated)
  } catch (err) {
    console.error(err)
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { username: rawUsername, email, password } = req.body
    const username = rawUsername.toLowerCase()
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
      user.email = undefined

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
    const { name, username: rawUsername, email, password } = req.body
    if (!(name && rawUsername && email && password)) {
      return res.status(400).send({ message: 'All fields are required' })
    }
    const username = rawUsername.toLowerCase()

    const existingUser = await User.findOne(
      {
        $or: [{ email }, { username }],
      },
      { _id: 1 }
    )

    if (existingUser) {
      return res.status(400).send({ message: 'User already exists' })
    }

    // TODO: use joi or some other schema validation

    let encryptedPassword = await bcrypt.hash(password, 10)
    const tempUserObj: {
      name: string
      username: string
      email: string
      password: string
      profilePicture?: {
        withVersion: string
        withoutVersion: string
        cloudinaryImagePublicId: string
      }
    } = {
      name,
      username,
      email,
      password: encryptedPassword,
    }
    let result = await cloudinaryV2.uploader.upload(instagramDefaultDP, {
      folder: 'users',
      allowed_formats: ['jpg', 'png', 'webp'],
    })
    const withoutVersion = removeVersionFromCloudinaryImage(result)
    const cloudinaryImagePublicId = getPublicId(result.public_id)
    tempUserObj.profilePicture = {
      withVersion: result.secure_url,
      withoutVersion,
      cloudinaryImagePublicId,
    }

    const user = await User.create(tempUserObj)

    const { JWT_SECRET } = process.env
    const token = jwt.sign(
      {
        username,
        email,
        _id: user._id,
        name,
        // storing profile picture without version
        profilePicture: withoutVersion,
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

const getPublicId = (str: string) => {
  const splittedArr = str.split('/')
  return splittedArr[splittedArr.length - 1]
}
const removeVersionFromCloudinaryImage = (result: any) =>
  result.secure_url.replace(`v${result.version}/`, '')
