import axios from 'axios'
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import App from './App'
import LoginForm from './molecules/LoginForm'
import ProfilePage from './pages/ProfilePage'
import SignUpPage from './pages/SignUpPage'
import reportWebVitals from './reportWebVitals'
import { DOMAIN } from './utils/utilVariables'
axios.defaults.withCredentials = true

const Index = () => {
  const [userLoggedIn, setUserLoggedIn] = useState<'unknown' | boolean>(
    'unknown'
  )
  const [userDetails, setUserDetails] = useState({})
  const navigate = useNavigate()
  console.log({ userLoggedIn })
  const getUserDetails = async () => {
    try {
      const response = await axios.get(`${DOMAIN}/`)
      if (response.data._id) {
        setUserLoggedIn(true)
        setUserDetails(response.data)
      } else {
        setUserLoggedIn(false)
      }
      console.log('response', response)
    } catch (err) {
      console.log('err', err)
      setUserLoggedIn(false)
      navigate('/')
    }
  }
  useEffect(() => {
    getUserDetails()
  }, [])
  return (
    <Routes>
      <Route
        path="/"
        element={
          userLoggedIn === 'unknown' ? (
            <h1>Loading...</h1>
          ) : userLoggedIn ? (
            <App setUserLoggedIn={setUserLoggedIn} userDetails={userDetails} />
          ) : (
            <LoginForm setUserLoggedIn={setUserLoggedIn} />
          )
        }
      ></Route>
      <Route
        path="/login"
        element={<LoginForm setUserLoggedIn={setUserLoggedIn} />}
      />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/somepost" element={<>post some</>} />
      <Route
        path="/:username"
        element={<ProfilePage userDetails={userDetails} />}
      />
      <Route path="/inbox" element={<h1>Inbox</h1>} />
      <Route path="*" element={<h1>Page does not exist</h1>} />
    </Routes>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Index />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
