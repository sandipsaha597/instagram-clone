import express from 'express'
import { comment, createPost, like } from '../controllers/postController'
import { auth } from '../middleware/auth'
const postRoute = express.Router()

postRoute
  .route('/createPost')
  .post(express.json({ limit: '8mb' }), auth, createPost)

postRoute.route('/like').post(auth, like)

postRoute.route('/comment').post(auth, comment)

export default postRoute
