import express from 'express'
import {
  chat,
  inboxAndChatsByUserIds,
} from '../controllers/chatSystemController'
import { searchUserController } from '../controllers/searchUserController'
import { auth } from '../middleware/auth'
const searchRoute = express.Router()

// messaging from profile page
searchRoute.route('/searchUser/:searchString').get(searchUserController)

export default searchRoute
