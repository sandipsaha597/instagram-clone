import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

// TODO: learn forward ref
const SendMessageBox = ({ sendMessage, messageInputRef }: any) => {
  const params = useParams()
  const [inputValue, setInputValue] = useState('')
  const submitButtonRef = useRef<any>()
  const pressed = (e: any) => {
    // Has the enter key been pressed?
    if (e.which === 13) {
      e.preventDefault()
      // If it has been so, manually submit the <form>
      submitButtonRef.current.click()
    }
  }
  useEffect(() => {
    // textarea auto grow
    messageInputRef.current.style.height = '20px'
    messageInputRef.current.style.height =
      messageInputRef.current.scrollHeight + 'px'
  }, [inputValue, messageInputRef])
  return (
    <StyledSendMessageBox>
      <SendMessageForm
        onSubmit={(e: any) => {
          sendMessage(e, params.inboxId)
          setInputValue('')
        }}
      >
        <SendMessageTextarea
          placeholder="Message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          ref={messageInputRef}
          onKeyDown={pressed}
        />
        <SendMessageButton ref={submitButtonRef} disabled={!inputValue}>
          Send
        </SendMessageButton>
      </SendMessageForm>
    </StyledSendMessageBox>
  )
}

export default SendMessageBox

const StyledSendMessageBox = styled.div`
  grid-area: sendMessageBox;
  padding: 20px;
`
const SendMessageForm = styled.form`
  border: 1px solid rgb(219, 219, 219);
  border-radius: 22px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  width: 100%;
`
const SendMessageButton = styled.button`
  color: rgb(0, 149, 246);
  font-size: 14px;
  font-weight: 600;
`
const SendMessageTextarea = styled.textarea`
  border: none;
  outline: none;
  resize: none;
  height: 20px;
  max-height: 100px !important;
  overflow-y: auto;
  font-size: 14px;
  width: 100%;
  padding: 0 12px 0 0;
`
