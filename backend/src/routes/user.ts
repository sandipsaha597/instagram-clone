import express from 'express'
import {
  changeProfilePicture,
  login,
  logout,
  removeProfilePicture,
  signup,
  userDetails,
} from '../controllers/userController'
import { auth } from '../middleware/auth'
const userRoute = express.Router()

userRoute.route('/').get(auth, userDetails)
userRoute
  .route('/profilePicture/change')
  .post(express.json({ limit: '5mb' }), auth, changeProfilePicture)
userRoute.route('/profilePicture/remove').post(auth, removeProfilePicture)

userRoute.route('/signup').post(signup)
userRoute.route('/login').post(login)
userRoute.route('/logout').get(logout)

export default userRoute
