import styled from 'styled-components'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import Account from './Account'

const DemoAccounts = ({ login }: any) => {
  return (
    <StyledDemoAccounts>
      <h2>Demo Accounts:</h2>
      <Account
        username="ronaldo"
        password="a"
        image={transformCloudinaryImage(
          'https://res.cloudinary.com/dbevmtl8a/image/upload/v1660383109/users/vkv2qvtryjgchpdlwjii.jpg',
          'w_40'
        )}
        onClick={login}
      />
      <Account
        username="messi"
        password="a"
        image={transformCloudinaryImage(
          'https://res.cloudinary.com/dbevmtl8a/image/upload/v1667878253/users/qkz76pcen437xua0bdql.jpg',
          'w_40'
        )}
        onClick={login}
      />
    </StyledDemoAccounts>
  )
}

const StyledDemoAccounts = styled.div`
  & > button:not(:last-child) {
    margin-bottom: 15px;
  }
`

export default DemoAccounts
