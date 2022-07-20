import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  commentedBy: {
    username: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: true,
    },
  },
  likes: {
    type: Number,
    default: 0,
  },
  replyCount: Number,
})

export default mongoose.model('Comment', commentSchema)
