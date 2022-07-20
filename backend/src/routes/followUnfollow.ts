import express from 'express'
import { followUnfollow } from '../controllers/followUnfollowController'
import { auth } from '../middleware/auth'
const followUnfollowRoute = express.Router()

followUnfollowRoute.route('/follow-unfollow').post(auth, followUnfollow)

export default followUnfollowRoute
