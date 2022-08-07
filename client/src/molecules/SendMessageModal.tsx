import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Modal from '@mui/material/Modal'
import axios from 'axios'
import produce from 'immer'
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import styled from 'styled-components'
import Chip from '../atoms/Chip/Chip'
import {
  CircleNotSelectedIcon,
  CircleSelectedIcon,
  CloseIcon,
} from '../atoms/Icons/Icons'
import Input from '../atoms/Input/Input'
import { NameUsernameWithImage } from '../atoms/layouts/UsernameWithImage'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import { DOMAIN } from '../utils/utilVariables'

const SendMessageModal = ({
  suggestedUsers,
  open,
  setOpen,
  handleNextClick,
}: any) => {
  const [searchResults, setSearchResults] = useState<
    'loading' | 'no results' | any[]
  >([])
  const [selected, setSelected] = useState<any>([])
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false)

  const inputRef = useRef<any>()

  useEffect(() => {
    setNextButtonDisabled(false)
  }, [open])

  const handleChange = async (e: any) => {
    const value = e.target.value
    if (value.trim() === '') return setSearchResults([])
    setSearchResults('loading')

    // TODO: implement debouncing
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

  const unselectThisUser = (info: any) => {
    setSelected((selected: any) => {
      let temp = [...selected]
      temp = temp.filter((v) => v.username !== info.username)
      return temp
    })
  }
  const handleUserClick = (info: any) => {
    const isThisUserSelected = selected.find(
      (v: any) => v.username === info.username
    )
    if (isThisUserSelected) {
      unselectThisUser(info)
      return
    }
    // setSelected([username])
    setSelected((selected: any) => {
      return produce(selected, (draft: any) => {
        draft.push(info)
      })
    })
    inputRef.current.value = ''
    setSearchResults([])
  }

  const userList: any = useMemo(
    () =>
      searchResults.length === 0
        ? { listType: 'suggestedUsers', data: suggestedUsers }
        : { listType: 'searchResults', data: searchResults },
    [searchResults, suggestedUsers]
  )

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <StyledBox>
        <SendMessageModalHeader>
          <CloseButton onClick={() => setOpen(false)}>
            <CloseIcon color="#000" widthAndHeight="18px" />
          </CloseButton>
          <HeadingText>New Message</HeadingText>
          <NextButton
            disabled={!selected.length || nextButtonDisabled}
            onClick={() => {
              setNextButtonDisabled(true)
              handleNextClick(selected)
            }}
          >
            Next
          </NextButton>
        </SendMessageModalHeader>

        <SearchAndSelectedArea>
          <To>To:</To>
          <SearchAndSelectedContainer>
            <ChipsWrapper>
              {selected.map((v: any) => (
                // <span>{v}</span>
                <Chip
                  key={v.username}
                  text={v.username}
                  onClose={() => unselectThisUser(v)}
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
                onClick={() => handleUserClick(v)}
              />
            ))}
          </UserList>
        )}
      </StyledBox>
    </Modal>
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
  flex-shrink: 0;
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
  max-height: 17vh;
  overflow-y: auto;
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
  const isThisUserSelected = useMemo(
    () => selected.find((v: any) => v.username === info.username),
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
