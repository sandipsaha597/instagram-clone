import styled from 'styled-components'
import { BorderedBox } from '../atoms/Boxes/Boxes'
import { SubHeading } from '../atoms/Text/Texts'

const Account = ({ username, image, password, onClick }: any) => {
  return (
    <StyledAccount as="button" onClick={() => onClick(username, password)}>
      <img src={image} alt={username} />
      <SubHeading>{username}</SubHeading>
    </StyledAccount>
  )
}

export default Account

const StyledAccount = styled(BorderedBox)`
  display: flex;
  align-items: center;
  padding: 10px 20px;
  width: 100%;
  img {
    border-radius: 10px;
    margin-right: 10px;
  }
`
