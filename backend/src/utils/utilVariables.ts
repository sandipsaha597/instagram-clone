import mongoose from 'mongoose'

export const stringRequired = {
  type: String,
  required: true,
}

export const objectIdRequired = {
  type: mongoose.Schema.Types.ObjectId,
  required: true,
}

export const numberRequiredDefaultZero = {
  type: Number,
  required: true,
  default: 0,
}

export const newDate = {
  type: Date,
  default: () => new Date(),
  required: true,
}

export const defaultProfilePicture =
  'https://res.cloudinary.com/dbevmtl8a/image/upload/v1650475415/users/instagram-clone-default-dp_qilu7c'

export const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
}
