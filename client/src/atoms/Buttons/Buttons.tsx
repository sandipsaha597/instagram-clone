import styled from 'styled-components'

export const Button = styled.button<{ widthAuto?: boolean }>`
  background-color: rgb(0, 149, 246);
  border-radius: 4px;
  color: #fff;
  display: block;
  font-size: 14px;
  font-weight: 600;
  padding: 5px 9px;
  line-height: 18px;
  width: ${({ widthAuto }) => (widthAuto ? 'auto' : '100%')};
`

export const Button2 = styled.button`
  border: 1px solid rgb(219, 219, 219);
  border-radius: 4px;
  color: rgb(38, 38, 38);
  font-size: 14px;
  font-weight: 600;
  padding: 5px 9px;
`
