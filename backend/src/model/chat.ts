import mongoose from 'mongoose'
import {
  newDate,
  objectIdRequired,
  stringRequired,
} from '../utils/utilVariables'

const chatSchema = new mongoose.Schema({
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  sentTo: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  message: stringRequired,
  timeStamp: newDate,
  messageStatus: stringRequired,
})

export default mongoose.model('Chat', chatSchema)
