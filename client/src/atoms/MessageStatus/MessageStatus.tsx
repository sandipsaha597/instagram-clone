import styled from 'styled-components'
import {
  DeliveredIcon,
  PendingIcon,
  SeenIcon,
  SentIcon,
} from '../IconsAndImages/ReadReceipts'

// TODO: make it messageStatus
const MessageStatus = ({ messageStatus, className }: any) => {
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
export default MessageStatus
const StyledMessageStatus = styled.div`
  width: 16px;
`
