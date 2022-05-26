import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import styled from 'styled-components'
import { Container } from '../atoms/Boxes/Container'
import { Button2 } from '../atoms/Buttons/Buttons'
import UsernameWithImage from '../atoms/layouts/UsernameWithImage'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import { DOMAIN, SOCKET_IO_DOMAIN } from '../utils/utilVariables'

const DirectMessagePage = ({
  userDetails,
  chatFetched,
  chats,
  setChats,
}: any) => {
  const socketIO = useRef<any>({})
  const messageInputRef = useRef<any>()

  useEffect(() => {
    socketIO.current = io(`${SOCKET_IO_DOMAIN}`, {
      withCredentials: true,
    })
    let socket = socketIO.current
    socket.on('chat', (arg: any) => console.log(arg))
    socket.on('notLoggedIn', () => {
      alert('not logged In')
    })

    socket.on('message', (data: any) => {
      console.log(data)
      setChats((chats: any) => {
        const temp = [...chats]
        temp.push(data.chat)
        return temp
      })
    })

    socket.on('error', (error: any) => {
      console.error(error)
    })
  }, [])

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    let socket = socketIO.current
    socket.emit('message', {
      message: messageInputRef.current.value,
      inboxId: params.inboxId,
    })
    messageInputRef.current.value = ''

    // const message = await axios.post(`${DOMAIN}/message`, {
    //   message: messageInputRef.current.value,
    //   inboxId: params.inboxId,
    // })
  }

  const [inboxes, setInboxes] = useState([])
  const [chatUserDetails, setChatUserDetails] = useState<any>({})

  const params = useParams()
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
  useEffect(() => {
    ;(async () => {
      if (!params.inboxId) return
      if (chatFetched.current[params.inboxId]) return
      const fetchedChats = await axios.get(`${DOMAIN}/chat/${params.inboxId}`)
      setChats(fetchedChats.data)
    })()
  }, [params.inboxId, chatFetched, setChats])

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
      <div>
        {chats.map((v: any) =>
          chats.length !== 0 ? (
            <div key={v._id}>
              <img
                src={
                  chatUserDetails[v.sentBy]?.profilePicture
                    ? transformCloudinaryImage(
                        chatUserDetails[v.sentBy]?.profilePicture,
                        'w_24'
                      )
                    : ''
                }
                alt={chatUserDetails[v.sentBy]?.name}
              />
              <strong>{chatUserDetails[v.sentBy]?.name}</strong>
              <p>{v.message}</p>
            </div>
          ) : (
            <h3>Loading...</h3>
          )
        )}
        <form onSubmit={sendMessage}>
          <input type="text" ref={messageInputRef} />
          <Button2>send</Button2>
        </form>
      </div>
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
