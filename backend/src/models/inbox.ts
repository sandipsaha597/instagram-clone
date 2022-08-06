import mongoose from 'mongoose'
import {
  newDate,
  objectIdRequired,
  stringRequired,
} from '../utils/utilVariables'

const inboxSchema = new mongoose.Schema({
  // all participants._id should be unique
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
  group: {
    isGroup: {
      type: Boolean,
      required: true,
    },
    groupName: String,
  },
})

export default mongoose.model('Inbox', inboxSchema)
