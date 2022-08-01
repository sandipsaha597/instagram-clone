import mongoose from 'mongoose'
import {
  newDate,
  objectIdRequired,
  stringRequired,
} from '../utils/utilVariables'

const inboxSchema = new mongoose.Schema({
  participants: [
    {
      name: stringRequired,
      profilePicture: stringRequired,
      _id: objectIdRequired,
      username: stringRequired,
    },
  ],
  lastActivity: {
    chat_id: objectIdRequired,
    message: String,
    timestamp: newDate,
    // TODO: use Enums in message status
    messageStatus: stringRequired,
    sentBy: objectIdRequired,
  },
})

export default mongoose.model('Inbox', inboxSchema)
