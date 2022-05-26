import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../model/user'

interface ModifiedRequest extends Request {
  searchUserBy: {
    username?: string
    email?: string
  }
}

const getCookie = (cookieName: string, cookies: string) => {
  try {
    let name = cookieName + '='
    let cookieArray = cookies.split(';')

    for (let i = 0; i < cookieArray.length; i++) {
      let cookieWithValue = cookieArray[i]
      while (cookieWithValue.charAt(0) === ' ') {
        cookieWithValue = cookieWithValue.substring(1)
      }

      if (cookieWithValue.indexOf(name) === 0) {
        return cookieWithValue.substring(name.length, cookieWithValue.length)
      }
    }
    return ''
  } catch (err) {
    console.error(err)
    return ''
  }
}
const { JWT_SECRET } = process.env

export const authInSocketIO = (socket: any, next: any) => {
  try {
    const cookies = socket.handshake.headers.cookie
    const token = getCookie('token', cookies || '')
    if (!token) {
      return socket.emit('notLoggedIn')
    }
    const jwtPayload = jwt.verify(token, JWT_SECRET as string)
    socket.jwtPayload = jwtPayload
    next()
  } catch (error) {
    console.error(error)
    return socket.emit('invalid token')
  }
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).send('Unauthorized')
    }

    const jwtPayload = jwt.verify(token, JWT_SECRET as string)
    // @ts-expect-error
    const { username, email } = jwtPayload

    const searchUserBy = username ? { username } : { email }
    // @ts-expect-error
    req.searchUserBy = searchUserBy
    //@ts-expect-error
    req.jwtPayload = jwtPayload

    next()
  } catch (e) {
    console.log(e)
    res.status(401).send('invalid token')
  }
}
