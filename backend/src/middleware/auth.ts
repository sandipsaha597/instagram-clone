import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../model/user'

interface ModifiedRequest extends Request {
  searchUserBy: {
    username?: string
    email?: string
  }
}

const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).send('Unauthorized')
    }

    const { JWT_SECRET } = process.env

    // @ts-expect-error
    const { username, email } = jwt.verify(token, JWT_SECRET as string)

    const searchUserBy = username ? { username } : { email }
    // @ts-expect-error
    req.searchUserBy = searchUserBy

    next()
  } catch (e) {
    console.log(e)
    res.send('invalid token')
  }
}

export default auth
