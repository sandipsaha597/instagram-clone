import mongoose from 'mongoose'
import { stringRequired } from '../utils/utilVariables'

const userSchema = new mongoose.Schema({
  name: stringRequired,
  username: {
    type: String,
    unique: true,
    required: true,
  },
  bio: String,
  profilePicture: {
    withVersion: {
      type: String,
      required: true,
      default:
        'https://res.cloudinary.com/dbevmtl8a/image/upload/v1650475415/users/instagram-clone-default-dp_qilu7c',
    },
    withoutVersion: {
      type: String,
      required: true,
      default:
        'https://res.cloudinary.com/dbevmtl8a/image/upload/v1650475415/users/instagram-clone-default-dp_qilu7c',
    },
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
  followerCount: {
    type: Number,
    default: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
})

export default mongoose.model('User', userSchema)
