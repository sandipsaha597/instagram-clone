import express from 'express'
import {
  chat,
  inboxAndChatsByUserIds,
} from '../controllers/chatSystemController'
import { auth } from '../middleware/auth'
const chatRoute = express.Router()

// messaging from profile page
chatRoute
  .route('/inbox/inboxAndChatsByUserIds')
  .get(auth, inboxAndChatsByUserIds)

chatRoute.route('/chat/:inboxId').get(auth, chat)

export default chatRoute
