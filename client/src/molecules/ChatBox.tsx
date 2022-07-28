import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import produce from 'immer'

import { Button, Button2 } from '../atoms/Buttons/Buttons'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import { DOMAIN } from '../utils/utilVariables'
import { socket } from '../SocketIO'
import {
  UsernameWithImage,
  UsernameWithImageGroup,
} from '../atoms/layouts/UsernameWithImage'
import MessageStatusC from '../atoms/MessageStatus/MessageStatus'

const ChatBox = ({
  chats,
  inboxAndParticipantData,
  setChats,
  userDetails,
  setInboxes,
}: any) => {
  const messageInputRef = useRef<any>()
  const chatsRef = useRef<any>()

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
    if (chatsRef.current) {
      chatsRef.current.scrollTo(0, chatsRef.current.scrollHeight)
    }
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
    const message = messageInputRef.current.value
    e.preventDefault()
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
    // setInboxes((inboxes: any) => {
    //   return produce(inboxes, (draft: any) => {
    //     const inboxLastActivityObj = {
    //       chat_id: tempChatId,
    //       message,
    //       // TODO: use Enums in message status
    //       messageStatus: 'pending',
    //       sentBy: userDetails._id,
    //     }
    //     // if (!params.inboxId) return
    //     const inboxIndex = draft.findIndex((v) => v._id === params.inboxId)
    //     const tempInbox = draft.splice(inboxIndex, 1)
    //     tempInbox.lastActivity = inboxLastActivityObj
    //     draft.unshift(tempInbox)
    //   })
    // })
    socket.emit(
      'message',
      {
        message,
        inboxId: params.inboxId,
        tempChatId: tempChatId,
      },
      (response: any) => {
        if (response.status === 'ok') {
          console.log('message sent confirmed')
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
                // chat._id === response.chat.tempChatId
                if (v._id === response.chat.sentTo) {
                  // if the response is coming from the last sent message, update inbox's lastActivity
                  // if (v.lastActivity.chat_id !== response.chat.tempChatId)
                  //   return false
                  const temp = {
                    chat_id: response.chat._id,
                    message: response.chat.message,
                    timeStamp: response.chat.timeStamp,
                    messageStatus: response.chat.messageStatus,
                    sentBy: response.chat.sentBy,
                  }
                  v.lastActivity = temp
                  console.log('set inboxes 2', v)
                  return false
                }
                console.log('set inboxes', v)
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
  console.log(inboxAndParticipantData)
  const firstParticipant =
    inboxAndParticipantData.participantData?.[
      Object.keys(inboxAndParticipantData.participantData)[0]
    ]
  const secondParticipant =
    inboxAndParticipantData.participantData?.[
      Object.keys(inboxAndParticipantData.participantData)[1]
    ]
  const isGroup = inboxAndParticipantData.inboxData?.group.isGroup

  return (
    <>
      {params.inboxId === undefined || chats[params.inboxId] === undefined ? (
        <h3>Loading...</h3>
      ) : (
        <>
          <Heading>
            {firstParticipant ? (
              <>
                {isGroup ? (
                  <button
                    onClick={() => {
                      const arr: any = []
                      Object.keys(
                        inboxAndParticipantData.participantData
                      ).forEach((v) => {
                        arr.push(
                          inboxAndParticipantData.participantData[v].username
                        )
                      })
                      console.log(arr)
                      // alert()
                    }}
                  >
                    <UsernameWithImageGroup
                      image1={firstParticipant?.profilePicture}
                      image2={secondParticipant?.profilePicture}
                      groupName={
                        inboxAndParticipantData.inboxData.group.groupName
                      }
                    />
                  </button>
                ) : (
                  <Link to={'/' + firstParticipant?.username}>
                    <UsernameWithImage
                      image={transformCloudinaryImage(
                        firstParticipant.profilePicture,
                        'w_24'
                      )}
                      username={firstParticipant.name}
                    />
                  </Link>
                )}
              </>
            ) : (
              <div>Loading...</div>
            )}
          </Heading>

          <Chats ref={chatsRef}>
            {chats[params.inboxId].map((chat: any, i: number) => {
              const chatSentByUser =
                chat.sentBy === userDetails._id ? true : false
              const chatsArr = chats[params.inboxId || 0]
              return (
                <Chat key={chat._id} {...{ chatSentByUser }}>
                  {!chatSentByUser && (
                    <>
                      {chatsArr[i + 1]?.sentBy !== chat.sentBy ? (
                        <Link
                          to={
                            '/' +
                            inboxAndParticipantData.participantData[chat.sentBy]
                              ?.username
                          }
                        >
                          <img
                            className="profile-pic"
                            src={
                              inboxAndParticipantData.participantData?.[
                                chat.sentBy
                              ]?.profilePicture
                                ? transformCloudinaryImage(
                                    inboxAndParticipantData.participantData?.[
                                      chat.sentBy
                                    ]?.profilePicture,
                                    'w_24'
                                  )
                                : ''
                            }
                            alt={
                              inboxAndParticipantData.participantData?.[
                                chat.sentBy
                              ]?.name
                            }
                          />
                        </Link>
                      ) : (
                        <EmptyBox width="24px"></EmptyBox>
                      )}
                    </>
                  )}
                  <div className="chat-wrapper">
                    <p>{chat.message}</p>
                    {chatSentByUser && (
                      <MessageStatusC messageStatus={chat.messageStatus} />
                    )}
                  </div>
                </Chat>
              )
            })}
          </Chats>
          <SendMessageBox {...{ sendMessage, messageInputRef }} />
        </>
      )}
    </>
  )
}

export default ChatBox

// TODO: learn forward ref
const SendMessageBox = ({ sendMessage, messageInputRef }: any) => {
  const [inputValue, setInputValue] = useState('')
  const submitButtonRef = useRef<any>()
  const pressed = (e: any) => {
    console.log('pressed', messageInputRef.current.scrollHeight)
    // Has the enter key been pressed?
    if (e.which === 13) {
      e.preventDefault()
      // If it has been so, manually submit the <form>
      submitButtonRef.current.click()
    }
  }
  useEffect(() => {
    // textarea auto grow
    messageInputRef.current.style.height = '20px'
    messageInputRef.current.style.height =
      messageInputRef.current.scrollHeight + 'px'
  }, [inputValue, messageInputRef])
  return (
    <StyledSendMessageBox>
      <SendMessageForm
        onSubmit={(e: any) => {
          sendMessage(e)
          setInputValue('')
        }}
      >
        {/* <button onClick={() => }>print</button> */}
        <SendMessageTextarea
          placeholder="Message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          ref={messageInputRef}
          onKeyDown={pressed}
        />
        <SendMessageButton ref={submitButtonRef} disabled={!inputValue}>
          Send
        </SendMessageButton>
      </SendMessageForm>
    </StyledSendMessageBox>
  )
}

const StyledSendMessageBox = styled.div`
  grid-area: sendMessageBox;
  padding: 20px;
`
const SendMessageForm = styled.form`
  border: 1px solid rgb(219, 219, 219);
  border-radius: 22px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  width: 100%;
`
const SendMessageButton = styled.button`
  color: rgb(0, 149, 246);
  font-size: 14px;
  font-weight: 600;
`
const SendMessageTextarea = styled.textarea`
  border: none;
  outline: none;
  resize: none;
  height: 20px;
  max-height: 100px !important;
  overflow-y: auto;
  font-size: 14px;
  width: 100%;
  padding: 0 12px 0 0;
`
const Heading = styled.div`
  border-bottom: 1px solid rgb(219, 219, 219);
  grid-area: chatBoxHeading;
  padding: 20px 20px 20px 40px;
`
const Chats = styled.div`
  display: flex;
  flex-flow: column nowrap;
  grid-area: chats;
  overflow-y: scroll;
  padding: 20px 20px 0px 20px;
`
const EmptyBox: any = styled.div`
  width: ${({ width }: any) => width};
`
const Chat: any = styled.div`
  display: flex;
  align-items: flex-end;
  margin-bottom: 8px;
  align-self: ${({ chatSentByUser }: any) =>
    chatSentByUser ? 'flex-end' : 'flex-start'};
  .profile-pic,
  ${EmptyBox} {
    margin-right: 8px;
  }
  .chat-wrapper {
    background: ${({ chatSentByUser }: any) =>
      chatSentByUser ? 'rgb(239, 239, 239)' : 'transparent'};
    border: 1px solid rgb(239, 239, 239);
    border-radius: 22px;
    box-sizing: border-box;
    display: flex;
    align-items: flex-end;
    font-size: 14px;
    padding: 16px;
    max-width: 234px;
    p {
      box-sizing: border-box;
      max-width: ${({ chatSentByUser }: any) =>
        chatSentByUser ? 'calc(100% - 16px)' : '100%'};
      padding-right: ${({ chatSentByUser }: any) =>
        chatSentByUser ? '7px' : '0px'};
      word-wrap: break-word;
    }
  }
`
