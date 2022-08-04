import { Request, Response } from 'express'
import User from '../models/user'

export const searchUserController = async (req: Request, res: Response) => {
  console.log('request')
  try {
    let pattern = new RegExp(req.params.searchString, 'i')
    const users = await User.find(
      {
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
