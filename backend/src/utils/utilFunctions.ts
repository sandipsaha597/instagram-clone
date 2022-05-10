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
