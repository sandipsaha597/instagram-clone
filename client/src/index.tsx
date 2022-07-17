import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import App from './App'
import LoginForm from './molecules/LoginForm'
import DirectMessagePage from './pages/DirectMessagePage'
import ProfilePage from './pages/ProfilePage'
import SignUpPage from './pages/SignUpPage'
import reportWebVitals from './reportWebVitals'
import { DOMAIN } from './utils/utilVariables'
axios.defaults.withCredentials = true

const Index = () => {
  const [userDetails, setUserDetails] = useState<{} | false | 'loading'>(
    'loading'
  )
  const [chats, setChats] = useState<any>({})
  const chatFetched = useRef<any>({})
  useEffect(() => {
    ;(async () => {
      try {
        const response = await axios.get(`${DOMAIN}/`)
        if (response.data._id) {
          setUserDetails(response.data)
        } else {
        }
      } catch (err) {
        console.error('error2', err)
        setUserDetails(false)
      }
    })()
  }, [])
  if (userDetails === 'loading') {
    return <h1>Loading...</h1>
  }
  console.log('running', userDetails)
  return (
    <Routes>
      {/* public routes
          /:username
          /somepost */}
      {/* if not loggedIn
          / => <Login />
          /login
          /signup */}
      {/* if loggedIn
          / => <NewsFeed /> 
          /inbox
          /inbox/:inboxId
          /etc */}
      {userDetails === false && (
        <Route
          index
          element={
            <LoginForm
              setUserDetails={(details: any) => setUserDetails(details)}
            />
          }
        />
      )}
      <Route
        element={
          <NoAuth {...{ userDetails }}>
            <Outlet />
          </NoAuth>
        }
      >
        {/* can't visit these routes if logged in */}
        <Route
          path="accounts/login"
          element={
            <LoginForm
              setUserDetails={(details: any) => setUserDetails(details)}
            />
          }
        />
        <Route path="accounts/signup" element={<SignUpPage />} />
      </Route>
      <Route
        element={
          <App userDetails={userDetails} setUserDetails={setUserDetails} />
        }
      >
        <Route
          path=":username"
          element={
            <ProfilePage
              userDetails={userDetails}
              chatFetched={chatFetched}
              setChats={setChats}
            />
          }
        />
        <Route path="/somepost" element={<>post some</>} />

        <Route
          element={
            <RequireAuth userDetails={userDetails}>
              <Outlet />
            </RequireAuth>
          }
        >
          {/* Protected routes */}
          <Route index element={<h1>News Feed</h1>} />
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
        </Route>
      </Route>
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

const NoAuth = ({ children, userDetails }: any) => {
  console.log('noauth', userDetails)
  if (userDetails) {
    return <Navigate to="/" replace />
  }

  return children
}

function RequireAuth({ children, userDetails }: any) {
  let location = useLocation()

  if (!userDetails) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/accounts/login" state={{ from: location }} replace />
  }

  return children
}
