import express from 'express'
import {
  chat,
  inboxAndChatsByUserId,
} from '../controllers/chatSystemController'
import { auth } from '../middleware/auth'
const chatRoute = express.Router()

// messaging from profile page
chatRoute.route('/inbox/:userId').get(auth, inboxAndChatsByUserId)

chatRoute.route('/chat/:inboxId').get(auth, chat)

export default chatRoute
