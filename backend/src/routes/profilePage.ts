import express from 'express'
import { profilePage } from '../controllers/profilePageController'
const profilePageRoute = express.Router()

profilePageRoute.route('/:username').get(profilePage)

export default profilePageRoute
