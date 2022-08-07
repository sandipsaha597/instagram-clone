import React from 'react'
import styled from 'styled-components'
import './App.css'
import { Outlet } from 'react-router-dom'
import Navbar from './molecules/Navbar'
//@ts-ignore
const App: any = ({ userDetails, setUserDetails, emptyAllStates }) => {
  return (
    <StyledApp>
      {/* <div className="nav">home</div>
      <div className="main">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui tenetur
        animi illo harum quia accusantium quas eum? At quisquam doloribus
        voluptatem excepturi harum dolor porro quibusdam fugiat eligendi non,
        numquam nam, temporibus quidem! Provident deserunt aliquid explicabo ea
        illum perferendis sequi suscipit itaque dolorum quasi. Nihil rem natus
        eos hic! lorem1000
      </div> */}
      <Navbar {...{ userDetails, setUserDetails, emptyAllStates }} />
      <UserData>
        <h1>{userDetails.username}</h1>
        <p>{userDetails._id}</p>
      </UserData>
      <Outlet />
    </StyledApp>
  )
}

export default App

const StyledApp = styled.div`
  height: 100vh;
  overflow-y: scroll;
  display: grid;
  grid-template-rows: auto 1fr;
  .main {
    background: tomato;
  }
`
const UserData = styled.div`
  position: fixed;
  top: 0;
  left: 0;
`

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
