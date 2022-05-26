import app from './app'

const { PORT } = process.env

const server = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})
