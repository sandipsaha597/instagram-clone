import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import App from './App'
import LoginForm from './molecules/LoginForm'
import DirectMessagePage from './pages/DirectMessagePage'
import ProfilePage from './pages/ProfilePage'
import SignUpPage from './pages/SignUpPage'
import reportWebVitals from './reportWebVitals'
import { DOMAIN } from './utils/utilVariables'
axios.defaults.withCredentials = true

const Index = () => {
  const [userLoggedIn, setUserLoggedIn] = useState<'unknown' | boolean>(
    'unknown'
  )
  const [userDetails, setUserDetails] = useState<any>({})
  const [chats, setChats] = useState<any>({})
  const chatFetched = useRef<any>({})
  const navigate = useNavigate()
  useEffect(() => {
    ;(async () => {
      try {
        const response = await axios.get(`${DOMAIN}/`)
        if (response.data._id) {
          setUserDetails(response.data)
          setUserLoggedIn(true)
        } else {
          setUserLoggedIn(false)
        }
      } catch (err) {
        console.error(err)
        setUserLoggedIn(false)
        navigate('/')
      }
    })()
  }, [navigate])
  if (!userDetails._id && userLoggedIn === 'unknown') {
    return <h1>Loading...</h1>
  }
  return (
    <Routes>
      <Route
        path="/"
        element={
          userLoggedIn ? (
            <App
              setUserLoggedIn={setUserLoggedIn}
              userDetails={userDetails}
              setUserDetails={setUserDetails}
            />
          ) : (
            <LoginForm
              setUserLoggedIn={setUserLoggedIn}
              setUserDetails={(details: any) => setUserDetails(details)}
            />
          )
        }
      ></Route>
      <Route
        path="/login"
        element={
          <LoginForm
            setUserLoggedIn={setUserLoggedIn}
            setUserDetails={(details: any) => setUserDetails(details)}
          />
        }
      />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/somepost" element={<>post some</>} />
      <Route
        path="/:username"
        element={
          <ProfilePage
            userDetails={userDetails}
            chatFetched={chatFetched}
            chats={chats}
            setChats={setChats}
          />
        }
      />
      <Route
        path="/inbox"
        element={
          <DirectMessagePage
            userDetails={userDetails}
            chatFetched={chatFetched}
            chats={chats}
            setChats={setChats}
          />
        }
      />
      <Route
        path="/inbox/:inboxId"
        element={
          <DirectMessagePage
            userDetails={userDetails}
            chatFetched={chatFetched}
            chats={chats}
            setChats={setChats}
          />
        }
      />
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
