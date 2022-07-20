import { Request, Response } from 'express'
import Post from '../models/post'
import User from '../models/user'

export const profilePage = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ username: req.params.username })
    let posts
    if (user) {
      posts = await Post.find({
        postBy: { username: req.params.username },
      }).limit(20)
    }
    const userData = { ...user }
    delete userData.email
    delete userData.password
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
