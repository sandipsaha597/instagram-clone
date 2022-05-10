import mongoose from 'mongoose'
import { defaultProfilePicture, stringRequired } from '../utils/utilVariables'

const followSchema = new mongoose.Schema({
  follower: {
    username: stringRequired,
    profilePicture: {
      ...stringRequired,
      default: defaultProfilePicture,
    },
  },
  followee: {
    username: stringRequired,
    profilePicture: {
      ...stringRequired,
      default: defaultProfilePicture,
    },
  },
})

export default mongoose.model('Follow', followSchema)
