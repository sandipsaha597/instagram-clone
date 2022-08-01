import { isValidObjectId } from 'mongoose'

export const cookieOptions = () => {
  return {
    expires: new Date(Date.now() * 3 * 24 * 60 * 60 * 1000), // 3 days
    httpOnly: true,
  }
}
export const getFileSize = (file: string) => {
  try {
    const base64String = file.split(',')[1]
    const stringLength = base64String.length - 'data:image/png;base64,'.length
    const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812
    const sizeInKb = sizeInBytes / 1024
    return sizeInKb
  } catch (err) {
    console.log(err)
    return 1000000000000000
  }
}
export const validateRequestBody = (requestBody: any) => {
  if (requestBody._id) {
    if (!isValidObjectId(requestBody._id)) return 'Invalid objectId'
  }
  const fields = Object.keys(requestBody)
  for (let i = 0; i < fields.length; i++) {
    if (!requestBody[fields[i]]) {
      console.log('all fields required', requestBody)
      return 'All fields are required'
    }
  }
  return true
}
