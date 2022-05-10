import axios from 'axios'
import { useRef } from 'react'
import styled from 'styled-components'
import { Button } from '../atoms/Buttons/Buttons'
import Input from '../atoms/Input/Input'
import { DOMAIN } from '../utils/utilVariables'

const signUpFormInputData = [
  {
    label: 'Email',
    name: 'email',
  },
  {
    label: 'Full Name',
    name: 'name',
  },
  {
    label: 'Username',
    name: 'username',
  },
  {
    label: 'Password',
    name: 'password',
  },
]

const SignUpForm = () => {
  const signUpFormValues = useRef<any>({
    name: '',
    username: '',
    email: '',
    password: '',
  })
  const signup = async () => {
    try {
      const response = await axios.post(
        `${DOMAIN}/signup`,
        signUpFormValues.current
      )
      console.log(response)
    } catch (err) {
      console.log(err)
    }
  }
  return (
    <StyledSignUpForm>
      {signUpFormInputData.map((v) => {
        return (
          <Input
            key={v.name}
            label={v.label}
            name={v.name}
            values={signUpFormValues}
          />
        )
      })}
      <Button
        onClick={(e) => {
          e.preventDefault()
          console.log(signUpFormValues.current)
        }}
      >
        Sign up
      </Button>
    </StyledSignUpForm>
  )
}

export default SignUpForm

const StyledSignUpForm = styled.form`
  .input-box {
    margin-bottom: 6px;
  }
  button {
    margin: 14px 0;
  }
`
