import axios from 'axios'
import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import produce from 'immer'

import { Button, Button2 } from '../atoms/Buttons/Buttons'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import { DOMAIN } from '../utils/utilVariables'
import { socket } from '../SocketIO'

const ChatBox = ({
  chats,
  chatUserDetails,
  setChats,
  userDetails,
  setInboxes,
}: any) => {
  const messageInputRef = useRef<any>()
  const chatBoxRef = useRef<any>()

  const params = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!params.inboxId) return
    socket.emit('message-seen-all', { inboxId: params.inboxId })
  }, [params.inboxId])
  useEffect(() => {
    console.log('running')
    socket.off('notLoggedIn')
    socket.on('notLoggedIn', () => {
      alert('not logged In')
    })

    socket.off('message')
    socket.on('message', (data: any) => {
      console.log(
        'message received',
        data.chat.message,
        data.chat.sentBy,
        userDetails._id
      )
      if (
        data.inbox.participants.length === 2 &&
        data.chat.sentBy !== userDetails._id
      ) {
        if (params.inboxId === data.inbox._id) {
          console.log('message seen emit')
          socket.emit('message-seen', {
            chat: data.chat,
            inbox: data.inbox,
          })
        } else {
          console.log('message delivered emit')
          socket.emit('message-delivered', {
            chat: data.chat,
            inbox: data.inbox,
          })
        }
      }
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

    socket.off('message-delivered')
    socket.on('message-delivered', (data: any) => {
      console.log('message delivered event')
      setChats((chats: any) => {
        return produce(chats, (draft: any) => {
          draft[data.chat.sentTo].every((v: any) => {
            if (data.chat._id === v._id) {
              v.messageStatus = 'delivered'
              return false
            }
            return true
          })
        })
      })
      setInboxes((inboxes: any) => {
        return produce(inboxes, (draft: any) => {
          draft.every((v: any) => {
            if (v._id === data.chat.sentTo) {
              if (
                v.lastActivity.chat_id === data.chat._id &&
                v.lastActivity.messageStatus === 'sent'
              ) {
                // console.log(v)
                // console.log(v.lastActivity.messageStatus)
                v.lastActivity.messageStatus = 'delivered'
              }
              return false
            }
            return true
          })
        })
      })
    })

    socket.off('message-seen')
    socket.on('message-seen', (data: any) => {
      console.log('message seen event')
      setChats((chats: any) => {
        return produce(chats, (draft: any) => {
          draft[data.chat.sentTo].every((v: any) => {
            if (data.chat._id === v._id) {
              v.messageStatus = 'seen'
              return false
            }
            return true
          })
        })
      })
      setInboxes((inboxes: any) => {
        return produce(inboxes, (draft: any) => {
          draft.every((v: any) => {
            if (v._id === data.chat.sentTo) {
              if (
                v.lastActivity.chat_id === data.chat._id &&
                v.lastActivity.messageStatus !== 'seen'
              ) {
                v.lastActivity.messageStatus = 'seen'
              }
              return false
            }
            return true
          })
        })
      })
    })

    socket.off('message-seen-all')
    socket.on('message-seen-all', (data: any) => {
      console.log('message-seen-all event')
      const { inboxId } = data
      setChats((chats: any) => {
        return produce(chats, (draft: any) => {
          draft[inboxId].forEach((v: any) => {
            if (v.messageStatus === 'delivered') {
              v.messageStatus = 'seen'
            }
          })
        })
      })
      setInboxes((inboxes: any) => {
        return produce(inboxes, (draft: any) => {
          draft.every((inbox: any) => {
            if (inbox._id === inboxId) {
              if (inbox.lastActivity.messageStatus === 'delivered') {
                inbox.lastActivity.messageStatus = 'seen'
              }
              return false
            }
            return true
          })
        })
      })
    })

    socket.off('error')
    socket.on('error', (error: any) => {
      console.error(error)
    })
  }, [userDetails._id, params.inboxId, setChats, setInboxes])
  useEffect(() => {
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
    const message = messageInputRef.current.value
    if (message.trim() === '') return
    console.log('sendMessage()', message)
    if (!params.inboxId) return
    const randomNumber = Math.floor(Math.random() * 8999999 + 1000000)
    let tempChatId = 'temp-' + randomNumber
    setChats((chats: any) => {
      return produce(chats, (draft: any) => {
        const messageObj = {
          _id: tempChatId,
          sentBy: userDetails._id,
          sentTo: params.inboxId,
          message,
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
    console.log('socket', socket)

    socket.emit(
      'message',
      {
        message,
        inboxId: params.inboxId,
        tempChatId: tempChatId,
      },
      (response: any) => {
        if (response.status === 'ok') {
          // console.log('message sent confirmed')
          // update chat _id and messageStatus
          setChats((chats: any) => {
            return produce(chats, (draft: any) => {
              draft[response.chat.sentTo].every((chat: any) => {
                if (chat._id === response.chat.tempChatId) {
                  chat._id = response.chat._id
                  chat.messageStatus = 'sent'
                  return false
                }
                return true
              })
            })
          })
          // update last activities in inbox
          setInboxes((inboxes: any) => {
            return produce(inboxes, (draft: any) => {
              draft.every((v: any) => {
                if (v._id === response.chat.sentTo) {
                  const temp = {
                    message: response.chat.message,
                    timeStamp: response.chat.timeStamp,
                    messageStatus: response.chat.messageStatus,
                    sentBy: response.chat.sentBy,
                  }
                  v.lastActivity = temp
                  return false
                }
                return true
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
