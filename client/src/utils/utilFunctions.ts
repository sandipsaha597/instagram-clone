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
