import axios from 'axios'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Container } from '../atoms/Boxes/Container'
import UsernameWithImage from '../atoms/layouts/UsernameWithImage'
import ChatBox from '../molecules/ChatBox'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import { DOMAIN } from '../utils/utilVariables'

const DirectMessagePage = ({ userDetails, chats, setChats }: any) => {
  const [inboxes, setInboxes] = useState([])
  const [chatUserDetails, setChatUserDetails] = useState<any>({})

  useEffect(() => {
    ;(async () => {
      const fetchedInboxes = await axios.get(`${DOMAIN}/inboxes`)
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
    })()
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
            />
          </Link>
        ))}
      </Inbox>
      <ChatBox {...{ chats, chatUserDetails, setChats, userDetails }} />
    </StyledContainer>
  )
}

export default DirectMessagePage

const Temp = styled(UsernameWithImage)``

const StyledContainer = styled(Container)`
  display: flex;
  width: 100%;
`
const Inbox = styled.div`
  width: 30%;
`
