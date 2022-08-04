import styled from 'styled-components'

export const UsernameWithImage = ({ image, username, className }: any) => {
  return (
    <StyledUsernameWithImage className={className}>
      <img src={image} alt={username} />
      <Username>{username}</Username>
    </StyledUsernameWithImage>
  )
}

export const UsernameWithImageGroup = ({
  image1,
  image2,
  groupName,
  className,
}: any) => {
  return (
    <StyledUsernameWithImage className={className}>
      <Username>{groupName}</Username>
    </StyledUsernameWithImage>
  )
}

export const NameUsernameWithImage = ({
  image,
  username,
  name,
  className,
  onClick,
}: any) => {
  return (
    <StyledUsernameWithImage className={className} onClick={onClick}>
      <img src={image} alt={username} />
      <Right>
        <Username>{username}</Username>
        <Name>{name}</Name>
      </Right>
    </StyledUsernameWithImage>
  )
}

export const ImageGroup = ({ image1, image2, imageWidth }: any) => {
  return (
    <StyledImageGroup imageWidth={imageWidth}>
      <Image1 src={image1} alt="" />
      <Image2 src={image2} alt="" />
    </StyledImageGroup>
  )
}

const StyledUsernameWithImage = styled.div`
  display: flex;
  align-items: center;
  > * {
    margin-right: 12px;
  }
`
const Right = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
`
const Username = styled.div`
  color: rgb(38, 38, 38);
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
`
const Name = styled.div`
  color: rgb(142, 142, 142);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
`
const Image1 = styled.img``
const Image2 = styled.img``
const StyledImageGroup: any = styled.div`
  position: relative;
  img {
    aspect-ratio: 1/1;
    border-radius: 50%;
    width: ${({ imageWidth }: any) => imageWidth};
  }
  aspect-ratio: 1/1;
  width: 56px;
  ${Image2} {
    border: 2px solid #fff;
    position: absolute;
    bottom: 0;
    right: 0;
  }
`
