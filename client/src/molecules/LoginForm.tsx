import axios from 'axios'
import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Or } from '../App'
import { BorderedBox } from '../atoms/Boxes/Boxes'
import { Button } from '../atoms/Buttons/Buttons'
import Logo from '../atoms/IconsAndImages/Logo'
import Input from '../atoms/Input/Input'
import { LinkText, Text1 } from '../atoms/Text/Texts'
import { DOMAIN } from '../utils/utilVariables'

//@ts-ignore
const LoginForm = ({ setUserLoggedIn }) => {
  const loginFormValues = useRef({
    usernameOrEmail: '',
    password: '',
    email: '',
    username: '',
  })
  const navigate = useNavigate()
  const login = async (e: any) => {
    e.preventDefault()
    try {
      if (loginFormValues.current.usernameOrEmail.indexOf('@') !== -1) {
        loginFormValues.current.email = loginFormValues.current.usernameOrEmail
      } else {
        loginFormValues.current.username =
          loginFormValues.current.usernameOrEmail
      }
      const response = await axios.post(
        `${DOMAIN}/login`,
        loginFormValues.current
      )
      console.log(response)
      if (response.data._id) {
        setUserLoggedIn(true)
        navigate('/')
      }
    } catch (err) {
      console.log(err)
    }
  }
  return (
    <LoginPage>
      <StyledBorderedBox>
        <Logo />
        <StyledLoginForm>
          <Input
            label="Username or email"
            name="usernameOrEmail"
            values={loginFormValues}
          />
          <Input label="Password" name="password" values={loginFormValues} />
          <Button onClick={login}>Log in</Button>
        </StyledLoginForm>
        <Or />
      </StyledBorderedBox>
      {/* <Button>facebook logo Log in with Facebook</Button> */}
      <StyledBorderedBox>
        <Text1>
          Don't have an account?{' '}
          <LinkText href="#" bold>
            Sign up
          </LinkText>
        </Text1>
      </StyledBorderedBox>
    </LoginPage>
  )
}

export default LoginForm

const LoginPage = styled.div`
  margin-top: 33px;
`

const StyledBorderedBox = styled(BorderedBox)`
  max-width: 350px;
  margin: 0 auto 10px;
  .logo {
    margin-top: 21px;
    margin-bottom: 12px;
  }
`

const StyledLoginForm = styled.form`
  .input-box {
    margin-bottom: 6px;
  }
  button {
    margin: 14px 0;
  }
`
