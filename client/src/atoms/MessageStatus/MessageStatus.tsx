import styled from 'styled-components'
import {
  DeliveredIcon,
  PendingIcon,
  SeenIcon,
  SentIcon,
} from '../IconsAndImages/ReadReceipts'

// TODO: make it messageStatus
const MessageStatusC = ({ messageStatus, className }: any) => {
  return (
    <StyledMessageStatus {...{ className }}>
      {messageStatus === 'pending' ? (
        <PendingIcon />
      ) : messageStatus === 'sent' ? (
        <SentIcon />
      ) : messageStatus === 'delivered' ? (
        <DeliveredIcon />
      ) : messageStatus === 'seen' ? (
        <SeenIcon />
      ) : (
        'unknown'
      )}
    </StyledMessageStatus>
  )
}
export default MessageStatusC
const StyledMessageStatus = styled.div`
  width: 16px;
`
