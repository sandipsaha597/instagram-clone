import produce from 'immer'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Container } from '../atoms/Boxes/Container'
import UsernameWithImage from '../atoms/layouts/UsernameWithImage'
import ChatBox from '../molecules/ChatBox'
import { socket } from '../SocketIO'
import { transformCloudinaryImage } from '../utils/utilFunctions'

const DirectMessagePage = ({ userDetails, chats, setChats }: any) => {
  const [inboxes, setInboxes] = useState<any>([])
  const [chatUserDetails, setChatUserDetails] = useState<any>({})

  useEffect(() => {
    console.log('connect to socket')
    socket.connect()
    socket.emit('get-inboxes', {}, (fetchedInboxes: any) => {
      console.log('get-inboxes', fetchedInboxes)
      let temp: any = {}
      fetchedInboxes.data.forEach((inbox: any) => {
        inbox.participants.forEach((participant: any) => {
          temp[participant._id] = {}
          temp[participant._id].name = participant.name
          temp[participant._id].profilePicture = participant.profilePicture
          temp[participant._id].username = participant.username
        })
      })
      setChatUserDetails(temp)
      let modifiedInboxes = []
      if (fetchedInboxes.data.length) {
        modifiedInboxes = fetchedInboxes.data.map((inbox: any) => {
          const userExcludedFromParticipants = inbox.participants.filter(
            (v: any) => v._id !== userDetails._id
          )

          inbox.participants = userExcludedFromParticipants
          return inbox
        })
      }
      setInboxes(modifiedInboxes)
    })
  }, [userDetails._id, setInboxes, setChats])
  useEffect(() => {
    socket.off('online-status')
    socket.on('online-status', (data: any) => {
      // in online-status data._id should never be user's own id
      if (data._id === userDetails._id) {
        console.error("in online-status data._id should never be user's own id")
        return
      }
      // private chat inbox._id of this user and data._id
      const inboxId = inboxes.find((inbox: any) => {
        // console.log(inbox.participants[0]._id, data._id)
        if (inbox.participants.length === 1) {
          return inbox.participants[0]._id === data._id
        }
        return false
      })?._id
      if (!inboxId) return
      // update onlineStatus and inbox's lastActivity
      setInboxes((inboxes: any) => {
        return produce(inboxes, (draft: any) => {
          draft.every((inbox: any) => {
            if (inbox._id === inboxId) {
              inbox.participants[0].online = data.online
              // update inbox lastActivity
              if (data.online && inbox.lastActivity.messageStatus === 'sent') {
                inbox.lastActivity.messageStatus = 'delivered'
              }
              return false
            }
            return true
          })
        })
      })

      // all messages this user sent to data._id got delivered so update chats' messageStatus
      if (data.online) {
        setChats((chats: any) => {
          return produce(chats, (draft: any) => {
            draft?.[inboxId]?.forEach((chat: any) => {
              if (chat.messageStatus === 'sent') {
                chat.messageStatus = 'delivered'
              }
            })
          })
        })
      }
    })
  }, [inboxes, setInboxes, setChats, userDetails._id])
  return (
    <StyledContainer>
      <Inbox>
        {inboxes.map((v: any) => (
          <Link to={'/inbox/' + v._id} key={v._id}>
            <Temp
              image={transformCloudinaryImage(
                v.participants[0].profilePicture,
                'w_56'
              )}
              username={v.participants[0].name}
              online={v.participants[0].online}
            />
          </Link>
        ))}
      </Inbox>

      {Object.keys(socket).length > 0 && (
        <ChatBox
          {...{
            chats,
            chatUserDetails,
            setChats,
            userDetails,
            setInboxes,
          }}
        />
      )}
    </StyledContainer>
  )
}

export default DirectMessagePage

const Temp = styled(UsernameWithImage)`
  position: relative;
  &::after {
    content: ${({ online }) => (online ? '"online"' : '"offline"')};
    position: absolute;
    top: 100%;
    left: 10px;
  }
`
const StyledContainer = styled(Container)`
  display: flex;
  width: 100%;
`
const Inbox = styled.div`
  width: 30%;
`
