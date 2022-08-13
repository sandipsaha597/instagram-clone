import axios from 'axios'
import { FormEvent, useRef } from 'react'
import styled from 'styled-components'
import { Button } from '../atoms/Buttons/Buttons'
import Input from '../atoms/Input/Input'
import { DOMAIN } from '../utils/utilVariables'

const signUpFormInputData = [
  {
    label: 'Email',
    name: 'email',
    type: 'email',
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
    type: 'password',
  },
]

const SignUpForm = ({ setUserDetails }: any) => {
  const signUpFormValues = useRef<any>({
    name: '',
    username: '',
    email: '',
    password: '',
  })
  const signup = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()
      const response = await axios.post(
        `${DOMAIN}/signup`,
        signUpFormValues.current
      )
      console.log(response)
      setUserDetails(response.data)
    } catch (err: any) {
      console.error(err)
      alert(err?.response?.data?.message)
    }
  }
  return (
    <StyledSignUpForm onSubmit={signup}>
      {signUpFormInputData.map((v) => {
        return (
          <Input
            key={v.name}
            label={v.label}
            name={v.name}
            type={v.type}
            values={signUpFormValues}
            required
          />
        )
      })}
      <Button>Sign up</Button>
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
