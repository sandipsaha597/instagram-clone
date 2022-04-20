import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  by: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
})

const postSchema = new mongoose.Schema({
  postBy: {
    username: String,
  },
  caption: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  hashtags: [String],
  image: {
    type: String,
    default: '',
  },
  comments: [
    {
      data: commentSchema,
      replies: [commentSchema],
    },
  ],
})
export default mongoose.model('Post', postSchema)
