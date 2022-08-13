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
    },
    withoutVersion: {
      type: String,
      required: true,
      immutable: true,
    },
    cloudinaryImagePublicId: {
      type: String,
      required: true,
      immutable: true,
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
