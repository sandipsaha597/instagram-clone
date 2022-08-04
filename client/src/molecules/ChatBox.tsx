import axios from 'axios'
import produce from 'immer'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { flushSync } from 'react-dom'
import {
  UsernameWithImage,
  UsernameWithImageGroup,
} from '../atoms/layouts/UsernameWithImage'
import MessageStatus from '../atoms/MessageStatus/MessageStatus'
import { socket } from '../SocketIO'
import { modifyInboxes, transformCloudinaryImage } from '../utils/utilFunctions'
import { DOMAIN } from '../utils/utilVariables'
import SendMessageBox from './SendMessageBox'
import { Button } from '../atoms/Buttons/Buttons'
import { DirectMessageIconCircled } from '../atoms/Icons/Icons'

const ChatBox = ({
  chats,
  inboxAndParticipantData,
  setChats,
  userDetails,
  inboxes,
  setInboxes,
}: any) => {
  const messageInputRef = useRef<any>()
  const chatsRef = useRef<any>()
  console.log(messageInputRef)

  const params = useParams()
  const navigate = useNavigate()

  const onlineStatusSub = useCallback(
    (modifiedInbox: any) => {
      // subscribe to online status if it's a new inbox
      if (modifiedInbox.participants.length !== 1) return
      const inbox = inboxes.find((v: any) => v._id === modifiedInbox._id)
      if (!inbox) {
        socket.emit(
          'subscribe-online-status',
          {
            userId: modifiedInbox.participants[0]._id,
          },
          ({ online }: any) => {
            setInboxes((inboxes: any) => {
              return produce(inboxes, (draft: any) => {
                const inboxIndex = inboxes.findIndex(
                  (v: any) => v._id === modifiedInbox._id
                )
                if (inboxIndex === -1) {
                  console.error('BUG:', 'no index found')
                  return
                }
                draft[inboxIndex].participants[0].online = online
              })
            })
          }
        )
      }
    },
    [inboxes, setInboxes]
  )

  useEffect(() => {
    if (!params.inboxId) return
    socket.emit('message-seen-all', { inboxId: params.inboxId })
  }, [params.inboxId])
  useEffect(() => {
    // TODO: use useCallback hook
    socket.off('notLoggedIn')
    socket.on('notLoggedIn', () => {
      alert('not logged In')
    })

    socket.off('message')
    socket.on('message', (data: any) => {
      const { chat, inbox } = data
      // message delivered/seen emit:
      // - don't emit if it's a group
      // - don't emit if it's sent by the user itself
      // TODO: use group.isGroup instead of participants.length
      if (inbox.participants.length === 2 && chat.sentBy !== userDetails._id) {
        if (params.inboxId === inbox._id) {
          socket.emit('message-seen', {
            chat: chat,
            inbox: inbox,
          })
        } else {
          socket.emit('message-delivered', {
            chat: chat,
            inbox: inbox,
          })
        }
      }

      // update chats of the inboxId/sentTo if fetched already
      setChats((chats: any) => {
        return produce(chats, (draft: any) => {
          draft[chat.sentTo]?.push(chat)
        })
      })
      // scroll to bottom only if this inbox(inbox._id) is opened
      if (chatsRef.current && params.inboxId === inbox._id) {
        chatsRef.current.scrollTo(0, chatsRef.current.scrollHeight)
      }
      // update inbox's lastActivity and put the inbox on top
      const modifiedInbox: {} = modifyInboxes([inbox], userDetails._id)[0]
      onlineStatusSub(modifiedInbox)
      setInboxes((inboxes: any) => {
        return produce(inboxes, (draft: any) => {
          const inboxIndex = draft.findIndex((v: any) => v._id === chat.sentTo)
          if (inboxIndex === -1) {
            draft.unshift(modifiedInbox)
            return
          }
          draft[inboxIndex].lastActivity = inbox.lastActivity
          const updatedInbox = draft.splice(inboxIndex, 1)
          draft.unshift(updatedInbox[0])
        })
      })
    })

    socket.off('message-delivered')
    socket.on('message-delivered', (data: any) => {
      setChats((chats: any) => {
        return produce(chats, (draft: any) => {
          draft[data.chat.sentTo]?.every((v: any) => {
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
      setChats((chats: any) => {
        return produce(chats, (draft: any) => {
          draft[data.chat.sentTo]?.every((v: any) => {
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
      const { inboxId } = data
      setChats((chats: any) => {
        return produce(chats, (draft: any) => {
          draft[inboxId]?.forEach((v: any) => {
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
  }, [userDetails._id, params.inboxId, setChats, setInboxes, onlineStatusSub])
  useEffect(() => {
    ;(async () => {
      if (!params.inboxId) return
      if (chats[params.inboxId]) return
      try {
        const fetchedChats = await axios.get(`${DOMAIN}/chat/${params.inboxId}`)
        if (fetchedChats.data.length === 0) {
          navigate('/inbox')
          return
        }
        setChats((chats: any) => {
          return produce(chats, (draft: any) => {
            draft[fetchedChats.data[0].sentTo] = fetchedChats.data
          })
        })
        // scroll to bottom
        if (
          chatsRef.current &&
          fetchedChats.data[0].sentTo === params.inboxId
        ) {
          chatsRef.current.scrollTo(0, chatsRef.current.scrollHeight)
        }
      } catch (error) {
        console.error(error)
        navigate('/inbox')
      }
    })()
  }, [params.inboxId, chats, setChats, navigate])

  useEffect(() => {
    // chatBox scrolled to bottom every time user opens another inbox
    if (chatsRef.current) {
      chatsRef.current.scrollTo(0, chatsRef.current.scrollHeight)
    }
  }, [params.inboxId])
  const sendMessage = (e: React.FormEvent<HTMLFormElement>, inboxId: any) => {
    e.preventDefault()
    const message = messageInputRef.current.value
    if (message.trim() === '') return
    const randomNumber = Math.floor(Math.random() * 8999999 + 1000000)
    let tempChatId = 'temp-' + randomNumber
    flushSync(() => {
      setChats((chats: any) => {
        return produce(chats, (draft: any) => {
          const messageObj = {
            _id: tempChatId,
            sentBy: userDetails._id,
            sentTo: inboxId,
            message,
            messageStatus: 'pending',
          }
          draft[inboxId].push(messageObj)
        })
      })
    })
    // scroll chatbox to bottom when user is sending a message
    if (chatsRef.current) {
      chatsRef.current.scrollTo(0, chatsRef.current.scrollHeight)
    }

    // update the inbox's lastActivity and put it on top
    setInboxes((inboxes: any) => {
      return produce(inboxes, (draft: any) => {
        const inboxLastActivityObj = {
          chat_id: tempChatId,
          message,
          // TODO: use Enums in message status and maybe and timestamp property
          messageStatus: 'pending',
          sentBy: userDetails._id,
        }
        const inboxIndex = draft.findIndex((v: any) => v._id === inboxId)
        draft[inboxIndex].lastActivity = inboxLastActivityObj
        const updatedInbox = draft.splice(inboxIndex, 1)
        draft.unshift(updatedInbox[0])
      })
    })
    socket.emit(
      'message',
      {
        message,
        inboxId,
        tempChatId,
      },
      (response: any) => {
        if (response.status === 'ok') {
          const { chat, inbox } = response
          // update chat _id and messageStatus
          setChats((chats: any) => {
            return produce(chats, (draft: any) => {
              draft[chat.sentTo].every((chat: any) => {
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
              const inboxIndex = draft.findIndex(
                (v: any) => v._id === chat.sentTo
              )
              // if the response is coming from the last sent message, update inbox's lastActivity
              if (draft[inboxIndex].lastActivity.chat_id !== chat.tempChatId)
                return

              draft[inboxIndex].lastActivity = inbox.lastActivity
            })
          })
        }
        if (response.status === 'error') {
          console.error('failed to send message')
        }
      }
    )

    messageInputRef.current.value = ''
  }

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
      {params.inboxId === undefined ? (
        <NoActiveChatBox>
          <DirectMessageIconCircled />
          <h1>Your Messages</h1>
          <p>Send private messages to a friend or group.</p>
          <Button widthAuto>Send Message</Button>
        </NoActiveChatBox>
      ) : chats[params.inboxId] === undefined ? (
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

          <ChatsWrapper ref={chatsRef}>
            <Chats>
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
                              inboxAndParticipantData.participantData[
                                chat.sentBy
                              ]?.username
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
                        <MessageStatus messageStatus={chat.messageStatus} />
                      )}
                    </div>
                  </Chat>
                )
              })}
            </Chats>
          </ChatsWrapper>
          <SendMessageBox {...{ sendMessage, messageInputRef }} />
        </>
      )}
    </>
  )
}

export default ChatBox

const NoActiveChatBox = styled.div`
  grid-area: noActiveInbox;
  align-self: center;
  justify-self: center;
  text-align: center;
  h1 {
    font-size: 22px;
    font-weight: 300;
    margin-top: 7px;
  }
  p {
    color: rgb(142, 142, 142);
    font-size: 14px;
    margin-top: 6px;
    margin-bottom: 25px;
  }
  ${Button} {
    margin: auto;
  }
`

const Heading = styled.div`
  border-bottom: 1px solid rgb(219, 219, 219);
  grid-area: chatBoxHeading;
  padding: 20px 20px 20px 40px;
`
const ChatsWrapper = styled.div`
  display: flex;
  grid-area: chats;
  overflow-y: auto;
`
const Chats = styled.div`
  display: flex;
  flex-flow: column nowrap;
  margin-top: auto;
  padding: 20px 20px 0px 20px;
  width: 100%;
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
