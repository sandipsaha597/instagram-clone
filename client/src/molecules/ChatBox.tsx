import axios from 'axios'
import { useEffect, useId, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import styled from 'styled-components'
import produce from 'immer'

import { Button, Button2 } from '../atoms/Buttons/Buttons'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import { DOMAIN, SOCKET_IO_DOMAIN } from '../utils/utilVariables'

const ChatBox = ({ chats, chatUserDetails, setChats, userDetails }: any) => {
  const socketIO = useRef<any>({})
  const messageInputRef = useRef<any>()
  const chatBoxRef = useRef<any>()

  const params = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    socketIO.current = io(`${SOCKET_IO_DOMAIN}`, {
      withCredentials: true,
    })
    let socket = socketIO.current
    socket.on('notLoggedIn', () => {
      alert('not logged In')
    })

    socket.on('message', (data: any, callback: any) => {
      callback({ status: 'ok' })
      setChats((chats: any) => {
        return produce(chats, (draft: any) => {
          if (draft[data.chat.sentTo]) {
            draft[data.chat.sentTo].push(data.chat)
          } else {
            draft[data.chat.sentTo] = [data.chat]
          }
        })
      })
    })

    socket.on('message delivered', (data: any) => {
      console.log('message delivered event')
      console.log(data)
      setChats((chats: any) => {
        return produce(chats, (draft: any) => {})
      })
    })

    socket.on('error', (error: any) => {
      console.error(error)
    })
  }, [setChats])
  console.log(chats)
  useEffect(() => {
    console.log(chatBoxRef.current.scrollHeight)
    chatBoxRef.current.scrollTo(0, chatBoxRef.current.scrollHeight)
    ;(async () => {
      if (!params.inboxId) return
      if (chats[params.inboxId]) return
      try {
        const fetchedChats = await axios.get(`${DOMAIN}/chat/${params.inboxId}`)
        setChats((chats: any) => {
          // TODO: use immer for setting chats
          const temp = { ...chats }
          if (params.inboxId && temp[params.inboxId]) {
            return temp[params.inboxId].concat(fetchedChats.data)
          }
          temp[params.inboxId || 'unknown'] = fetchedChats.data
          return temp
        })
      } catch (error) {
        console.error(error)
        navigate('/inbox')
      }
    })()
  }, [params.inboxId, chats, setChats, navigate])

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!params.inboxId) return
    let socket = socketIO.current
    setChats((chats: any) => {
      return produce(chats, (draft: any) => {
        const messageObj = {
          _id: `temp-`,
          sentBy: userDetails._id,
          sentTo: params.inboxId,
          message: messageInputRef.current.value,
          messageStatus: 'pending',
        }
        if (!params.inboxId) return
        if (draft[params.inboxId]) {
          draft[params.inboxId].push(messageObj)
        } else {
          draft[params.inboxId] = [messageObj]
        }
      })
    })
    socket.emit(
      'message',
      {
        message: messageInputRef.current.value,
        inboxId: params.inboxId,
        tempChatId: 'temp',
      },
      (response: any) => {
        if (response.status === 'ok') {
          setChats((chats: any) => {
            return produce(chats, (draft: any) => {
              draft[response.chat.sentTo].find((chat: any) => {
                // if(chat.)
              })
            })
          })
        }
        if (response.status === 'error') {
        }
      }
    )

    messageInputRef.current.value = ''
  }
  return (
    <StyledChatBox ref={chatBoxRef}>
      {params.inboxId === undefined ? (
        <Button>Send Message</Button>
      ) : chats[params.inboxId] === undefined ? (
        <h3>Loading...</h3>
      ) : (
        <>
          {chats[params.inboxId].map((chat: any) => (
            <Chat key={chat._id}>
              <img
                src={
                  chatUserDetails[chat.sentBy]?.profilePicture
                    ? transformCloudinaryImage(
                        chatUserDetails[chat.sentBy]?.profilePicture,
                        'w_24'
                      )
                    : ''
                }
                alt={chatUserDetails[chat.sentBy]?.name}
              />
              <strong>{chatUserDetails[chat.sentBy]?.name}</strong>
              <p>
                {chat.message} <b>{chat.messageStatus}</b>
              </p>
            </Chat>
          ))}
          <form onSubmit={sendMessage}>
            <input type="text" ref={messageInputRef} />
            <Button2>send</Button2>
          </form>
        </>
      )}
    </StyledChatBox>
  )
}

export default ChatBox

const StyledChatBox = styled.div`
  height: 100vh;
  overflow: auto;
  width: 100%;
  form {
    position: fixed;
    bottom: 0;
  }
`
const Chat = styled.div``
