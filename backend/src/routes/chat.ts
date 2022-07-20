import express from 'express'
import { chat, inboxByUserId } from '../controllers/chatSystemController'
import { auth } from '../middleware/auth'
const chatRoute = express.Router()

// messaging from profile page
chatRoute.route('/inbox/:userId').get(auth, inboxByUserId)

chatRoute.route('/chat/:inboxId').get(auth, chat)

export default chatRoute
