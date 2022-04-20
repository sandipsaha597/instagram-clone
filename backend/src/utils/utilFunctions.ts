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

export const getFileType = (file: string) => {
  try {
    const firstLetterAfterComma = file[file.indexOf(',') + 1]
    switch (firstLetterAfterComma) {
      case '/':
        return 'jpg/jpeg'
      case 'i':
        return 'png'
      case 'R':
        return 'gif'
      case 'U':
        return 'webp'
      case 'A':
        return 'mp4'
      case 'P':
        return 'svg'
      case 'J':
        return 'pdf'
      default:
        return 'unknown'
    }
  } catch (err) {
    return 'unknown'
  }
}
