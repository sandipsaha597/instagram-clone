import mongoose from 'mongoose'
import {
  newDate,
  numberRequiredDefaultZero,
  objectIdRequired,
  stringRequired,
} from '../utils/utilVariables'

const inboxSchema = new mongoose.Schema({
  inboxOwner: objectIdRequired,
  otherParticipantData: {
    name: stringRequired,
    profilePicture: stringRequired,
    otherParticipant: objectIdRequired,
  },
  lastActivity: {
    message: stringRequired,
    timestamp: newDate,
    messageStatus: stringRequired,
  },
  unseenNumber: numberRequiredDefaultZero,
})

export default mongoose.model('Inbox', inboxSchema)
