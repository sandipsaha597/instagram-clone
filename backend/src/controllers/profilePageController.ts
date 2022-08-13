import { Request, Response } from 'express'
import Post from '../models/post'
import User from '../models/user'

export const profilePage = async (req: Request, res: Response) => {
  try {
    console.log('profilePage', req.params.username)
    const user = await User.findOne(
      { username: req.params.username },
      { password: 0, email: 0 }
    )
    if (!user) return res.send('this user does not exist')
    const posts = await Post.find({
      postBy: { username: req.params.username },
    }).limit(20)
    const userData = { ...user }
    const userDetails = {
      ...userData._doc,
      posts,
    }
    res.send(userDetails)
  } catch (err) {
    console.log(err)
    res.send('failed')
  }
}
