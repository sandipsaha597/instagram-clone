import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/user'

const { JWT_SECRET } = process.env
export const searchUserController = async (req: Request, res: Response) => {
  let requestedBy = ''
  try {
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header('Authorization')?.replace('Bearer ', '')

    if (token) {
      const jwtPayload: any = jwt.verify(token, JWT_SECRET as string)
      requestedBy = jwtPayload.username || ''
    }
  } catch (error) {}
  try {
    let pattern = new RegExp(req.params.searchString, 'i')
    const users = await User.find(
      {
        username: { $ne: requestedBy },
        $or: [{ username: { $regex: pattern } }, { name: { $regex: pattern } }],
      },
      { name: 1, username: 1, profilePicture: 1 }
    ).limit(10)
    res.send(users)
  } catch (err) {
    console.log(err)
    res.status(500).send('failed')
  }
}
