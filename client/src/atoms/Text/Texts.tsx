import styled from 'styled-components'

export const SubHeading = styled.div`
  color: rgb(142, 142, 142);
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 10px;
  text-align: center;
`
export const LinkText = styled.a<any>`
  font-size: inherit;
  font-weight: ${({ bold }) => (bold ? 'bold' : 'normal')};
`

export const Text1 = styled.p`
  color: hsl(0, 0%, 14.901960784313726%);
  font-size: 14px;
  margin: 0;
  text-align: center;
`