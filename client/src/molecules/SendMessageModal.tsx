import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Modal from '@mui/material/Modal'
import axios from 'axios'
import produce from 'immer'
import { useCallback, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import Chip from '../atoms/Chip/Chip'
import {
  CircleNotSelectedIcon,
  CircleSelectedIcon,
  CloseIcon,
} from '../atoms/Icons/Icons'
import { NameUsernameWithImage } from '../atoms/layouts/UsernameWithImage'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import { DOMAIN } from '../utils/utilVariables'

const SendMessageModal = ({ suggestedUsers }: any) => {
  const [open, setOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<
    'loading' | 'no results' | any[]
  >([])
  const [selected, setSelected] = useState<any>([])

  const inputRef = useRef<any>()

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleChange = async (e: any) => {
    const value = e.target.value
    if (value.trim() === '') return setSearchResults([])
    setSearchResults('loading')
    const getSearchResults = await axios.get(`${DOMAIN}/searchUser/${value}`)
    if (getSearchResults.data.length === 0)
      return setSearchResults('no results')

    const modifiedResults = getSearchResults.data.map((v: any) => {
      return {
        ...v,
        profilePicture: v.profilePicture.withVersion,
      }
    })
    setSearchResults(modifiedResults)
  }

  const unselectThisUser = (username: any) => {
    setSelected((selected: any) => {
      let temp = [...selected]
      temp = temp.filter((v) => v !== username)
      return temp
    })
  }
  const handleUserClick = useCallback(
    (username: any) => {
      console.log('click', username, selected)
      const isThisUserSelected = selected.find((v: any) => v === username)
      if (isThisUserSelected) {
        unselectThisUser(username)
        return
      }
      // setSelected([username])
      setSelected((selected: any) => {
        return produce(selected, (draft: any) => {
          draft.push(username)
        })
      })
      inputRef.current.value = ''
      setSearchResults([])
    },
    [selected, setSelected, setSearchResults]
  )

  const userList: any = useMemo(
    () =>
      searchResults.length === 0
        ? { listType: 'suggestedUsers', data: suggestedUsers }
        : { listType: 'searchResults', data: searchResults },
    [searchResults, suggestedUsers]
  )

  return (
    <div>
      <Button onClick={handleOpen}>Open modal</Button>
      <Modal
        open={true}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <StyledBox>
          <SendMessageModalHeader>
            <CloseButton>
              <CloseIcon color="#000" widthAndHeight="18px" />
            </CloseButton>
            <HeadingText>New Message</HeadingText>
            <NextButton>Next</NextButton>
          </SendMessageModalHeader>

          <SearchAndSelectedArea>
            <To>To:</To>
            <SearchAndSelectedContainer>
              <ChipsWrapper>
                {selected.map((v: any) => (
                  // <span>{v}</span>
                  <Chip
                    key={v}
                    uniqueValue={v}
                    text={v}
                    onClose={unselectThisUser}
                  />
                ))}
              </ChipsWrapper>
              <SearchInput
                type="text"
                placeholder="Search..."
                onChange={handleChange}
                ref={inputRef}
              />
            </SearchAndSelectedContainer>
          </SearchAndSelectedArea>
          {searchResults === 'loading' ? (
            <h1>Loading...</h1>
          ) : searchResults === 'no results' ? (
            <h1>No account found</h1>
          ) : (
            <UserList>
              {userList.listType === 'suggestedUsers' && (
                <SuggestedHeading>Suggested</SuggestedHeading>
              )}
              {userList.data.map((v: any) => (
                <User
                  key={v.username}
                  info={v}
                  {...{ selected, setSelected }}
                  onClick={(info: any) => handleUserClick(info.username)}
                />
              ))}
            </UserList>
          )}
        </StyledBox>
      </Modal>
    </div>
  )
}

export default SendMessageModal

const StyledBox = styled(Box)`
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 63vh;
  width: 400px;
  &:focus {
    border: none;
    outline: none;
  }
`
const HeadingText = styled.div``
const CloseButton = styled.button``
const NextButton = styled.button``
const SendMessageModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  ${CloseButton} {
    line-height: 1;
    margin: 0 16px;
    position: absolute;
    left: 0;
  }
  ${HeadingText} {
    color: rgb(38, 38, 38);
    font-size: 16px;
    font-weight: 600;
  }
  ${NextButton} {
    color: rgb(0, 149, 246);
    font-size: 14px;
    font-weight: 600;
    margin: 0 16px;
    position: absolute;
    right: 0;
  }
`

const SearchAndSelectedArea = styled.div`
  display: flex;
  padding: 8px 0;
  border-top: 1px solid rgb(219, 219, 219);
  border-bottom: 1px solid rgb(219, 219, 219);
`
const To = styled.div`
  font-weight: 600;
  padding: 4px 12px;
`
const SearchAndSelectedContainer = styled.div`
  flex-grow: 1;
`
const ChipsWrapper = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-flow: row wrap;
  max-height: 20vh;
  padding: 0 8px;
  width: 100%;
`
const SearchInput = styled.input`
  border: none;
  box-sizing: border-box;
  caret-color: #000000;
  font-size: 14px;
  height: 30px;
  padding: 0 20px;
  &:focus {
    outline: none;
  }
  width: 84%;
`
const SuggestedHeading = styled.div`
  color: rgb(38, 38, 38);
  font-size: 14px;
  font-weight: 600;
  padding: 16px;
`
const UserList = styled.div`
  /* background: #000; */
  flex-grow: 1;
  overflow-y: auto;
`

const User = ({ info, selected, onClick }: any) => {
  console.log(info)
  const isThisUserSelected = useMemo(
    () => selected.find((v: any) => v === info.username),
    [selected, info]
  )
  return (
    <StyledUser onClick={() => onClick(info)} key={info.username}>
      <NameUsernameWithImage
        image={transformCloudinaryImage(info.profilePicture, 'w_44')}
        name={info.name}
        username={info.username}
      />
      {isThisUserSelected ? <CircleSelectedIcon /> : <CircleNotSelectedIcon />}
    </StyledUser>
  )
}

const StyledUser = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  width: 100%;
`
