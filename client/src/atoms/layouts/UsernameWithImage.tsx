import React from 'react'
import styled from 'styled-components'

const UsernameWithImage = ({ image, username, className }: any) => {
  return (
    <StyledUsernameWithImage className={className}>
      <img src={image} alt="" />
      <Username>{username}</Username>
    </StyledUsernameWithImage>
  )
}

export default UsernameWithImage

const StyledUsernameWithImage = styled.div`
  display: flex;
  align-items: center;
  img {
    margin-right: 12px;
  }
`
const Username = styled.div`
  font-size: 16px;
  font-weight: 600;
`
