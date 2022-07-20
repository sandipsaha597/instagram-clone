import express from 'express'
import {
  login,
  logout,
  signup,
  userDetails,
} from '../controllers/userController'
import { auth } from '../middleware/auth'
const userRoute = express.Router()

userRoute.route('/').get(auth, userDetails)
userRoute.route('/signup').post(express.json({ limit: '2mb' }), signup)
userRoute.route('/login').post(login)
userRoute.route('/logout').get(logout)

export default userRoute
