import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const SubHeading = styled.div`
  color: rgb(142, 142, 142);
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 10px;
  text-align: center;
`
export const LinkText = styled(Link)<any>`
  font-size: inherit;
  font-weight: ${({ $bold }) => ($bold ? 'bold' : 'normal')};
`

export const Text1 = styled.p`
  color: rgb(38, 38, 38);
  font-size: 14px;
  margin: 0;
  text-align: center;
`
