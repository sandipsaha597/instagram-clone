import { Request, Response } from 'express'
import Follow from '../models/follow'

export const followUnfollow = async (req: Request, res: Response) => {
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
}
