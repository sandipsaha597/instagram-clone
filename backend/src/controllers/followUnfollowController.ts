import { Request, Response } from 'express'
import Follow from '../models/follow'

export const followUnfollow = async (req: Request, res: Response) => {
  try {
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
  } catch (err) {
    console.error(err)
  }
}
