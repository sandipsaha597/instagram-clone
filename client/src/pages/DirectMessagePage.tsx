import produce from 'immer'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import styled from 'styled-components'
import { Container } from '../atoms/Boxes/Container'
import UsernameWithImage from '../atoms/layouts/UsernameWithImage'
import ChatBox from '../molecules/ChatBox'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import { SOCKET_IO_DOMAIN } from '../utils/utilVariables'

const DirectMessagePage = ({ userDetails, chats, setChats }: any) => {
  const [inboxes, setInboxes] = useState<any>([])
  const [chatUserDetails, setChatUserDetails] = useState<any>({})
  const socketIO = useRef<any>({})
  useEffect(() => {
    socketIO.current = io(`${SOCKET_IO_DOMAIN}`, {
      withCredentials: true,
    })
  }, [])
  useEffect(() => {
    let socket = socketIO.current
    socket.emit('get-inboxes', {}, (fetchedInboxes: any) => {
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
    socket.on('online-status', (data: any) => {
      setInboxes((inboxes: any) => {
        return produce(inboxes, (draft: any) => {
          draft.forEach((v: any) => {
            if (v.participants[0]._id === data._id) {
              v.participants[0].online = data.online
            }
          })
        })
      })
    })
  }, [userDetails._id, setInboxes])

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
      {Object.keys(socketIO.current).length > 0 && (
        <ChatBox
          {...{
            socketIO,
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
