import mongoose, { ConnectOptions } from 'mongoose'
const { MONGODB_URL } = process.env

exports.connect = () => {
  mongoose
    .connect(MONGODB_URL || '', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions)
    .then(() => {
      console.log('Connected to MongoDB')
    })
    .catch((err) => {
      console.log('Error connecting to database')
      console.log(err)
      process.exit(1)
    })
}
