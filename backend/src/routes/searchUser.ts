import express from 'express'
import {
  chat,
  inboxAndChatsByUserId,
} from '../controllers/chatSystemController'
import { searchUserController } from '../controllers/searchUserController'
import { auth } from '../middleware/auth'
const searchRoute = express.Router()

// messaging from profile page
searchRoute.route('/searchUser/:searchString').get(searchUserController)

export default searchRoute
