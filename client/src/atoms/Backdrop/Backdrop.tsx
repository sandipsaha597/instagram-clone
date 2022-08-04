import styled from 'styled-components'
import { CloseIcon } from '../Icons/Icons'

const Backdrop = ({ children, close }: any) => {
  return (
    <StyledBackdrop>
      <CloseModalButton onClick={close}>
        <CloseIcon widthAndHeight={24} color="#fff" />
      </CloseModalButton>
      {children}
    </StyledBackdrop>
  )
}

const StyledBackdrop = styled.div<any>`
  display: block;
  background-color: hsla(0, 0%, 0%, 0.85);
  height: 100vh;
  width: 100%;
  position: absolute;
  top: 0;
`

const CloseModalButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
`

export default Backdrop
