import { useState } from 'react'
import styled from 'styled-components'

//@ts-ignore
const Input: any = ({ label, name, type, values, required }) => {
  const [value, setValue] = useState('')
  return (
    <InputBox className="input-box">
      <Label inputValue={value}>{label}</Label>
      <StyledInput
        value={value}
        type={type || 'text'}
        required={required}
        onChange={(e) => {
          setValue(e.target.value)
          values.current[name] = e.target.value
        }}
      />
    </InputBox>
  )
}

export default Input

const InputBox = styled.div`
  position: relative;
`
const Label = styled.label<{ inputValue: string }>`
  color: rgb(142, 142, 142);
  font-size: 12px;
  left: 9px;
  pointer-events: none;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: 0.1s ease-out;
  ${({ inputValue }) =>
    inputValue &&
    `
    color: rgb(142, 142, 142);
    top: 27%;
    font-size: 10px;
  `}
`
const StyledInput = styled.input`
  background-color: #fafafa;
  border: 1px solid rgb(219, 219, 219);
  &:focus {
    border: 1px solid rgb(0, 0, 0);
  }
  border-radius: 3px;
  box-sizing: border-box;
  font-size: 12px;
  line-height: 18px;
  outline: none;
  padding: ${({ value }) => (value ? '15px 0 3px 8px' : '10px 0 8px 8px')};
  width: 100%;
`
