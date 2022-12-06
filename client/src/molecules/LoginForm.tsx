import axios from 'axios'
import { useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Or } from '../App'
import { BorderedBox } from '../atoms/Boxes/Boxes'
import { Button } from '../atoms/Buttons/Buttons'
import Logo from '../atoms/IconsAndImages/Logo'
import Input from '../atoms/Input/Input'
import { NameUsernameWithImage } from '../atoms/layouts/UsernameWithImage'
import { LinkText, SubHeading, Text1 } from '../atoms/Text/Texts'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import { DOMAIN } from '../utils/utilVariables'
import DemoAccounts from './DemoAccounts'

//@ts-ignore
const LoginForm = ({ setUserDetails }) => {
  const loginFormValues = useRef({
    usernameOrEmail: '',
    password: '',
    email: '',
    username: '',
  })
  const navigate = useNavigate()
  const location: any = useLocation()
  const from = location.state?.from?.pathname || '/'

  const login = async (e?: any) => {
    e?.preventDefault()
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
      if (response.data._id) {
        setUserDetails(response.data)
        // console.log('from', from)
        // navigate(from, { replace: true })
        navigate('/inbox', { replace: true })
      }
    } catch (err) {
      console.log(err)
      alert('invalid credentials')
    }
  }
  return (
    <LoginPage>
      <div>
        <StyledBorderedBox>
          <Logo />
          <StyledLoginForm onSubmit={login}>
            <Input
              label="Username or email"
              name="usernameOrEmail"
              values={loginFormValues}
            />
            <Input label="Password" name="password" values={loginFormValues} />
            <Button type="submit">Log in</Button>
          </StyledLoginForm>
          <Or />
        </StyledBorderedBox>
        {/* <Button>facebook logo Log in with Facebook</Button> */}
        <StyledBorderedBox>
          <Text1>
            Don't have an account?{' '}
            <LinkText to="/accounts/signup" $bold>
              Sign up
            </LinkText>
          </Text1>
        </StyledBorderedBox>
      </div>

      <DemoAccounts
        login={(usernameOrEmail: string, password: string) => {
          console.log('usernameOrEmail, password', usernameOrEmail, password)
          loginFormValues.current.usernameOrEmail = usernameOrEmail
          loginFormValues.current.password = password
          login()
        }}
      />
    </LoginPage>
  )
}

export default LoginForm

const LoginPage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 33px;
`

const StyledBorderedBox = styled(BorderedBox)`
  max-width: 350px;
  margin: 0 100px 10px 0;
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
