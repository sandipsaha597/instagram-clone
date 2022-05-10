import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
  postBy: {
    username: { type: String, required: true },
  },
  caption: {
    type: String,
    // required: true,
    default: '',
  },
  likes: {
    type: Number,
    default: 0,
  },
  hashtags: [String],
  images: [
    {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },
  ],
  commentCount: {
    type: Number,
    default: 0,
  },
})
export default mongoose.model('Post', postSchema)
