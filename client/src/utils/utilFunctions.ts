
export const transformCloudinaryImage = (
  image: string,
  transformString: string
) => {
  const transformedImage = image
    .split('/image/upload/')
    .join(`/image/upload/${transformString}/`)
  return transformedImage
}
