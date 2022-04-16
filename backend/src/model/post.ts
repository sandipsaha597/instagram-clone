import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
  text: String,
  likes: {
    type: Number,
    default: 0,
  },
  postBy: {
    username: String,
  },
})

export default mongoose.model('Post', postSchema)
