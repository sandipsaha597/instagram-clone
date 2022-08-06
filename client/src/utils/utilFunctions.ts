import axios from 'axios'
import produce from 'immer'
import { NavigateFunction } from 'react-router-dom'
import { socket } from '../SocketIO'
import { DOMAIN } from './utilVariables'

export const transformCloudinaryImage = (
  image: string,
  transformString: string
) => {
  const transformedImage = image
    .split('/image/upload/')
    .join(`/image/upload/${transformString}/`)
  return transformedImage
}

export const modifyInboxes = (inboxes: any[], userId: string): any[] => {
  if (inboxes.length) {
    const modifiedInboxes = inboxes.map((inbox: any) => {
      const userExcludedFromParticipants = inbox.participants.filter(
        (v: any) => v._id !== userId
      )
      inbox.participants = userExcludedFromParticipants
      return inbox
    })
    return modifiedInboxes
  }
  return []
}

export const removeDuplicates = (arr: any[]) => {
  const temp: any = []
  arr.forEach((v: any) => {
    const idExistInTemp = temp.find((v2: any) => v2._id === v._id)
    if (!idExistInTemp) {
      temp.push(v)
    }
  })
  return temp
}

export const getAndSetInbox = async (
  userIds: string[],
  userDetails: any,
  inboxes: any,
  setInboxes: any,
  setChats: any,
  navigate: NavigateFunction,
  callback?: any
) => {
  const doesInboxParticipantsMatchUserIds = (inbox: any) => {
    const participantsUserIds = inbox.participants.map((v: any) => v._id)
    console.log(participantsUserIds, userIds)

    if (participantsUserIds.length !== userIds.length) return false

    participantsUserIds.sort()
    userIds.sort()

    for (let i = 0; i < userIds.length; i++) {
      if (userIds[i] !== participantsUserIds[i]) {
        return false
      }
    }
    return true
  }
  // if the inbox already exist in the inboxes state... then just splice it from there
  const existingInbox = inboxes.find((inbox: any) => {
    return doesInboxParticipantsMatchUserIds(inbox)
  })

  let inboxId = existingInbox?._id
  if (existingInbox) {
    setInboxes((inboxes: any) => {
      return produce(inboxes, (draft: any) => {
        const inboxIndex = draft.findIndex((v: any) => v._id === inboxId)
        draft.splice(inboxIndex, 1)
        draft.unshift(existingInbox)
      })
    })
  } else {
    // get inbox and chats by userId
    const response = await axios.get(`${DOMAIN}/inbox/inboxAndChatsByUserIds`, {
      params: {
        userIds,
      },
    })
    const { inbox, chats: fetchedChats } = response.data
    // subscribe to online status if inbox is not group
    if (!inbox.group.isGroup) {
      socket.emit(
        'subscribe-online-status',
        {
          userId: userIds[0],
        },
        () => false
      )
    }
    inboxId = inbox._id
    setInboxes((inboxes: any) => {
      return produce(inboxes, (draft: any) => {
        const modifiedInbox = modifyInboxes([inbox], userDetails._id)[0]
        draft.unshift(modifiedInbox)
      })
    })
    setChats((chats: any) => {
      return produce(chats, (draft: any) => {
        draft.loading = false
        draft[inboxId] = fetchedChats
      })
    })
  }
  navigate(`/inbox/${inboxId}`)
  if (callback) {
    callback()
  }
}
