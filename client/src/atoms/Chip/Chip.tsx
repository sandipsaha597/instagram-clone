import styled from 'styled-components'
import { CloseIcon } from '../Icons/Icons'

const Chip = ({ text, onClose }: any) => {
  return (
    <StyledChip>
      <ChipText>{text}</ChipText>
      <CloseIconButton onClick={() => onClose(text)}>
        <CloseIcon widthAndHeight={12} color="#0095f6" />
      </CloseIconButton>
    </StyledChip>
  )
}

export default Chip

const StyledChip = styled.div`
  background: rgb(224, 241, 255);
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  display: flex;
  align-items: center;
  height: 35px;
  margin: 4px;
  padding: 0 12px;
`
const ChipText = styled.div`
  color: rgb(0, 149, 246);
`
const CloseIconButton = styled.button`
  margin-left: 8px;
`
