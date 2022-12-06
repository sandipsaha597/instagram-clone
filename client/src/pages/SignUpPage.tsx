import React from 'react'
import styled from 'styled-components'
import { Or } from '../App'
import Logo from '../atoms/IconsAndImages/Logo'
import { LinkText, SubHeading, Text1 } from '../atoms/Text/Texts'
import SignUpForm from '../molecules/SignUpForm'

const SignUpPage = ({ setUserDetails }: any) => {
  return (
    <StyledSignUpPage>
      {/* <ScreenSlideShow></ScreenSlideShow> */}
      <Right>
        <BorderedBox className="right">
          <Logo />
          <SubHeading>
            Sign up to see photos and videos from your friends.
          </SubHeading>
          {/* <Button>facebook logo Log in with Facebook</Button> */}
          <Or />
          <SignUpForm {...{ setUserDetails }} />
        </BorderedBox>
        <BorderedBox className="bottom">
          <Text1>
            Have an account? <LinkText to="/accounts/login">Log in</LinkText>
          </Text1>
        </BorderedBox>
      </Right>
    </StyledSignUpPage>
  )
}

export default SignUpPage

const Right = styled.div`
  display: flex;
  flex-flow: column;
`

const ScreenSlideShow = styled.div``
const StyledSignUpPage = styled.div`
  display: flex;
  justify-content: center;
  max-width: 1080px;
  margin: 33px auto;
`
const BorderedBox = styled.div`
  background: #fff;
  border: 1px solid rgb(219, 219, 219);
  padding: 25px 40px;
  &.right {
    box-sizing: border-box;
    max-width: 350px;
    margin-bottom: 10px;
    .logo {
      margin-top: 21px;
      margin-bottom: 12px;
    }
  }
`
