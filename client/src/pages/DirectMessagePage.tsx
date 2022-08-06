import produce from 'immer'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Container } from '../atoms/Boxes/Container'
import { NewChatIcon } from '../atoms/Icons/Icons'
import { ImageGroup } from '../atoms/layouts/UsernameWithImage'
import MessageStatus from '../atoms/MessageStatus/MessageStatus'
import ChatBox from '../molecules/ChatBox'
import SendMessageModal from '../molecules/SendMessageModal'
import { socket } from '../SocketIO'
import {
  getAndSetInbox,
  modifyInboxes,
  removeDuplicates,
  transformCloudinaryImage,
} from '../utils/utilFunctions'

const DirectMessagePage = ({
  userDetails,
  chats,
  setChats,
  inboxes,
  setInboxes,
}: any) => {
  const params = useParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [chatUserDetails, setChatUserDetails] = useState<any>({})
  const navigate = useNavigate()
  useEffect(() => {
    let temp: any = {}
    inboxes.forEach((inbox: any) => {
      inbox.participants.forEach((participant: any) => {
        temp[participant._id] = {}
        temp[participant._id].name = participant.name
        temp[participant._id].profilePicture = participant.profilePicture
        temp[participant._id].username = participant.username
      })
    })
    setChatUserDetails(temp)
  }, [inboxes])
  useEffect(() => {
    socket.connect()
  }, [])
  useEffect(() => {
    socket.emit('get-inboxes', {}, (fetchedInboxes: any) => {
      const modifiedInboxes = modifyInboxes(
        fetchedInboxes.data,
        userDetails._id
      )
      setInboxes((inboxes: any) => {
        return removeDuplicates([...inboxes, ...modifiedInboxes])
      })
    })
  }, [userDetails._id, setInboxes])
  console.log(inboxes)
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
        if (inbox.participants.length === 1) {
          return inbox.participants[0]._id === data._id
        }
        return false
      })?._id
      if (!inboxId) return
      // update onlineStatus and inbox's lastActivity
      setInboxes((inboxes: any) => {
        return produce(inboxes, (draft: any) => {
          const inboxIndex = draft.findIndex((v: any) => v._id === inboxId)
          const inbox = draft[inboxIndex]
          inbox.participants[0].online = data.online
          // update inbox lastActivity
          if (data.online && inbox.lastActivity.messageStatus === 'sent') {
            inbox.lastActivity.messageStatus = 'delivered'
          }
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

  const inboxAndParticipantData = useMemo(() => {
    const temp: any = {
      participantData: {},
      inboxData: {
        group: {},
      },
    }
    try {
      if (!params.inboxId || inboxes.length === 0) return temp
      const inboxIndex = inboxes.findIndex((v: any) => v._id === params.inboxId)
      if (inboxes[inboxIndex].group.isGroup) {
        temp.inboxData.group = {
          isGroup: true,
          groupName: inboxes[inboxIndex].group.groupName,
        }
      }
      inboxes[inboxIndex].participants.forEach((v: any) => {
        temp.participantData[v._id] = chatUserDetails[v._id]
      })
      return temp
    } catch (err) {
      console.log(err)
      navigate('/inbox', { replace: true })
    }
    return temp
  }, [params.inboxId, chatUserDetails, inboxes, navigate])
  const suggestedUsers = useMemo(() => {
    const temp = []
    const keys = Object.keys(chatUserDetails)
    for (let i = 0; i < Math.min(11, keys.length); i++) {
      const { name, username, profilePicture } = chatUserDetails[keys[i]]
      temp.push({
        _id: keys[i],
        name,
        username,
        profilePicture,
      })
    }
    return temp
  }, [chatUserDetails])
  return (
    <StyledContainer activeInbox={!!params.inboxId}>
      <UsernameAndNewChat>
        <Username>{userDetails.username}</Username>
        <NewChatButton onClick={() => setModalOpen(true)}>
          <NewChatIcon />
        </NewChatButton>
      </UsernameAndNewChat>
      <InboxList>
        {inboxes.map((inbox: any) => {
          const isGroup = inbox.group.isGroup
          return (
            <Inbox
              to={'/inbox/' + inbox._id}
              key={inbox._id}
              $group={isGroup}
              $lastMessage={inbox.lastActivity.message}
              $online={inbox.participants[0].online}
              className={({ isActive }: any) =>
                isActive ? 'active' : undefined
              }
            >
              <ProfilePic>
                {isGroup ? (
                  <ImageGroup
                    image1={inbox.participants[0].profilePicture}
                    image2={inbox.participants[1].profilePicture}
                    imageWidth="40px"
                    containerWidth="56px"
                  />
                ) : (
                  <img
                    src={transformCloudinaryImage(
                      inbox.participants[0].profilePicture,
                      'w_56'
                    )}
                    alt={inbox.participants[0].username}
                  />
                )}
              </ProfilePic>
              <InboxName>
                {isGroup ? inbox.group.groupName : inbox.participants[0].name}
              </InboxName>

              {inbox.lastActivity.message !== '' && (
                <>
                  {inbox.lastActivity.sentBy === userDetails._id && (
                    <StyledMessageStatus
                      messageStatus={inbox.lastActivity.messageStatus}
                    />
                  )}
                  <Message>{inbox.lastActivity.message}</Message>
                </>
              )}
              {/* TODO: message sent or received secs/mins/days/weeks ago */}
              {/* </LastActivity> */}
            </Inbox>
          )
        })}
      </InboxList>
      <ChatBox
        {...{
          chats,
          inboxAndParticipantData,
          setChats,
          userDetails,
          inboxes,
          setInboxes,
          setModalOpen,
        }}
      />
      <SendMessageModal
        open={modalOpen}
        setOpen={setModalOpen}
        handleNextClick={(selected: any[]) => {
          getAndSetInbox(
            selected.map((v: any) => v._id),
            userDetails,
            inboxes,
            setInboxes,
            setChats,
            navigate,
            () => setModalOpen(false)
          )
        }}
        {...{ suggestedUsers }}
      />
    </StyledContainer>
  )
}

export default DirectMessagePage

const Username = styled.div``
const InboxName = styled.div``
const ProfilePic = styled.div``
const StyledMessageStatus = styled(MessageStatus)``
const Message = styled.div``
const Inbox: any = styled(NavLink)`
  display: grid;
  grid-template-columns: auto auto 1fr;
  grid-template-rows: auto auto;
  grid-template-areas: ${({ $lastMessage }: any) =>
    !!$lastMessage
      ? `'profilePic username username'
    'profilePic messageStatus message'`
      : `'profilePic username username'
    'profilePic username username'`};

  padding: 8px 20px;
  text-decoration: none;
  &.active {
    background: rgb(239, 239, 239);
  }
  ${ProfilePic} {
    grid-area: profilePic;
    height: 56px;
    position: relative;
    margin-right: 12px;
    img {
      border-radius: 50%;
    }
    &::after {
      aspect-ratio: 1/1;
      background: ${({ $online }: any) => ($online ? '#78de45' : '#c4c4c4')};
      border: 4px solid #fff;
      border-radius: 50%;
      content: '';
      display: ${({ $group }: any) => ($group ? 'none' : 'block')};
      position: absolute;
      bottom: 0;
      right: 0;
      width: 13px;
    }
  }
  ${InboxName} {
    align-self: ${({ $lastMessage }: any) =>
      !!$lastMessage ? 'end' : 'center'};
    color: rgb(38, 38, 38);
    font-size: 16px;
    grid-area: username;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  ${StyledMessageStatus} {
    grid-area: messageStatus;
    margin-right: 2px;
    margin-top: 1px;
  }
  ${Message} {
    color: rgb(142, 142, 142);
    font-size: 14px;
    grid-area: message;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`
const StyledContainer: any = styled(Container)`
  background: #fff;
  border: 1px solid rgb(219, 219, 219);
  border-radius: 4px;
  display: grid;
  grid-template-columns: 350px;
  grid-template-rows: 60px 1fr auto;
  grid-template-areas: ${({ activeInbox }: any) =>
    activeInbox
      ? `'usernameAndChat chatBoxHeading'
          'inboxList chats'
          'inboxList sendMessageBox'`
      : `'usernameAndChat noActiveInbox'
          'inboxList noActiveInbox'
          'inboxList noActiveInbox'`};
  margin: 20px auto;
  overflow: auto;
  width: 100%;
`
const InboxList = styled.div`
  border-right: 1px solid rgb(219, 219, 219);
  grid-area: inboxList;
  padding: 10px 0;
  overflow: auto;
`
const NewChatButton = styled.button``
const UsernameAndNewChat = styled.div`
  border-right: 1px solid rgb(219, 219, 219);
  border-bottom: 1px solid rgb(219, 219, 219);
  display: flex;
  align-items: center;
  justify-content: center;
  grid-area: usernameAndChat;
  position: relative;
  ${Username} {
    text-align: center;
    color: rgb(38, 38, 38);
    font-size: 16px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 65%;
  }
  ${NewChatButton} {
    position: absolute;
    right: 20px;
  }
`
