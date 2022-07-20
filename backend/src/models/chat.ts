import mongoose from 'mongoose'
import {
  newDate,
  objectIdRequired,
  stringRequired,
} from '../utils/utilVariables'

const chatSchema = new mongoose.Schema({
  sentBy: objectIdRequired,
  sentTo: objectIdRequired,
  message: stringRequired,
  timeStamp: newDate,
  messageStatus: stringRequired,
})

export default mongoose.model('Chat', chatSchema)
