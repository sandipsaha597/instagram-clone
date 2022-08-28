import mongoose, { ConnectOptions } from 'mongoose'
const { MONGODB_URL } = process.env

exports.connect = () => {
  mongoose
    .connect(MONGODB_URL || '', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useFindAndModify: false,
      dbName: 'instagram-clone',
    } as ConnectOptions)
    .then(() => {
      console.log('Connected to MongoDB')
    })
    .catch((err) => {
      console.error('Error connecting to database')
      console.error(err)
      process.exit(1)
    })
}
