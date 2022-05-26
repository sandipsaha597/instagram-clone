import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import './App.css'
import axios from 'axios'
import { Button } from './atoms/Buttons/Buttons'
import { useNavigate } from 'react-router-dom'
import { DOMAIN } from './utils/utilVariables'
import Navbar from './molecules/Navbar'
//@ts-ignore
const App: any = ({ setUserLoggedIn, userDetails, setUserDetails }) => {
  useEffect(() => {
    return () => setUserDetails({})
  }, [])
  console.log(userDetails)
  return (
    <div className="App">
      <Navbar setUserLoggedIn={setUserLoggedIn} userDetails={userDetails} />
      <h1>{userDetails.username}</h1>
      <p>{userDetails._id}</p>
    </div>
  )
}

export default App

export const Or: React.FC = () => {
  return (
    <Wrapper>
      <Line></Line>
      <OrText>OR</OrText>
      <Line></Line>
    </Wrapper>
  )
}
const Line = styled.div`
  border-top: 1px solid rgb(219, 219, 219);
  width: 100%;
`

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  margin: 10px 0 18px;
`
const OrText = styled.div`
  font-size: 13px;
  font-weight: 600;
  margin: 0 18px;
  color: rgb(142, 142, 142);
`
