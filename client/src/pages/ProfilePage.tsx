import { Box, Modal } from '@mui/material'
import axios from 'axios'
import produce from 'immer'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, Button2 } from '../atoms/Buttons/Buttons'
import {
  getAndSetInbox,
  transformCloudinaryImage,
} from '../utils/utilFunctions'
import { DOMAIN } from '../utils/utilVariables'
import { Container } from './../atoms/Boxes/Container'

const getDataUrlOfFile = async (inputRef: any) => {
  const blobFiles = inputRef.current.files[0]
  const readDataURL = async (file: any) => {
    const reader = new FileReader()
    const loadedFile = new Promise((resolve, reject) => {
      reader.addEventListener('load', () => {
        resolve(reader.result)
      })
    })
    reader.readAsDataURL(file)
    const result = await loadedFile
    return result
  }

  if (blobFiles) {
    const file = await readDataURL(blobFiles)
    return file
  }
}

const changeProfilePicture = async (
  profilePicture: string,
  setProfileDetails: any
) => {
  try {
    const response = await axios.post(`${DOMAIN}/profilePicture/change`, {
      profilePicture,
    })
    console.log('success', response)
    setProfileDetails((profileDetails: any) => {
      if (profileDetails._id !== response.data._id) return profileDetails
      return produce(profileDetails, (draft: any) => {
        draft.profilePicture = response.data.profilePicture
      })
    })
  } catch (err) {
    console.error(err)
    alert('failed')
  }
}
const removeCurrentPhoto = async (setProfileDetails: any) => {
  try {
    const response = await axios.post(`${DOMAIN}/profilePicture/remove`)
    console.log('success', response)
    setProfileDetails((profileDetails: any) => {
      if (profileDetails._id !== response.data._id) return profileDetails
      return produce(profileDetails, (draft: any) => {
        draft.profilePicture = response.data.profilePicture
      })
    })
  } catch (err) {
    console.error(err)
    alert('failed')
  }
}

const ProfilePage = ({ userDetails, setChats, inboxes, setInboxes }: any) => {
  const [profileDetails, setProfileDetails] = useState<any>()
  const [messageButtonDisabled, setMessageButtonDisabled] = useState(false)
  const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false)

  const inputRef = useRef<any>()

  console.log('profileDetails', profileDetails)
  const params = useParams()
  const navigate = useNavigate()
  useEffect(() => {
    ;(async () => {
      try {
        const response = await axios.get(`${DOMAIN}/${params.username}`)
        setProfileDetails(response.data)
      } catch (error) {
        console.error(error)
      }
    })()
  }, [params.username])

  if (!profileDetails?.username) return <h1>Loading...</h1>
  return (
    <div>
      <StyledContainer as="header">
        <button
          className="img-box"
          onClick={() => {
            if (profileDetails._id === userDetails._id) {
              setProfilePictureModalOpen(true)
            }
          }}
        >
          <img
            src={transformCloudinaryImage(
              profileDetails.profilePicture.withVersion,
              'w_320'
            )}
            alt={profileDetails.username}
          />
        </button>
        <section>
          <div className="flex username-and-edit-profile">
            <h2>{profileDetails.username}</h2>
            {userDetails.username !== profileDetails.username && (
              <>
                <Button2
                  disabled={messageButtonDisabled}
                  onClick={() => {
                    setMessageButtonDisabled(true)
                    getAndSetInbox(
                      [profileDetails._id],
                      userDetails,
                      inboxes,
                      setInboxes,
                      setChats,
                      navigate
                    )
                  }}
                >
                  Message
                </Button2>
                <Button disabled widthAuto>
                  Follow
                </Button>
              </>
            )}
          </div>
          <ul className="flex posts-followers-following">
            <li>
              <strong>{profileDetails.postCount || 0}</strong> posts
            </li>
            <li>
              <strong>{profileDetails.followerCount || 0}</strong> followers
            </li>
            <li>
              <strong>{profileDetails.followingCount || 0}</strong> following
            </li>
          </ul>
          <div>
            <h3>{profileDetails.name}</h3>
            <p className="bio">{profileDetails.bio}</p>
          </div>
        </section>
      </StyledContainer>
      <Posts as="section">
        {profileDetails.posts.length === 0 ? (
          <h2>No Posts Yet</h2>
        ) : (
          profileDetails.posts.map((v: any, i: number) => (
            <div key={v._id}>
              <img
                src={transformCloudinaryImage(v.images[0].url, 'w_293')}
                alt={`post ${i}`}
              />
            </div>
          ))
        )}
      </Posts>
      <Modal
        open={profilePictureModalOpen}
        onClose={() => setProfilePictureModalOpen(false)}
      >
        <StyledBox>
          <h2>Change Profile Photo</h2>
          <button
            className="upload-photo"
            onClick={() => inputRef.current.click()}
          >
            Upload Photo
          </button>
          <button
            className="remove-photo"
            onClick={() => {
              setProfilePictureModalOpen(false)
              removeCurrentPhoto(setProfileDetails)
            }}
          >
            Remove Current Photo
          </button>
          <button
            className="cancel"
            onClick={() => setProfilePictureModalOpen(false)}
          >
            Cancel
          </button>
          <FileInput
            type="file"
            ref={inputRef}
            onChange={async () => {
              setProfilePictureModalOpen(false)
              const profilePicture: any = await getDataUrlOfFile(inputRef)
              changeProfilePicture(profilePicture, setProfileDetails)
            }}
          />
        </StyledBox>
      </Modal>
    </div>
  )
}

export default ProfilePage

const FileInput = styled.input`
  display: hidden;
  position: absolute;
  left: -10000px;
`

const StyledContainer = styled(Container)`
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  padding: 30px 20px 60px 94px;
  .img-box {
    border-radius: 50%;
    margin-right: 98px;
    width: 150px;
    height: 150px;
    overflow: hidden;
    text-align: center;
    img {
      object-fit: cover;
      object-position: center center;
      width: 100%;
      height: 100%;
    }
  }
  .flex {
    display: flex;
    align-items: center;
  }
  h2 {
    font-weight: 300;
    color: rgb(38, 38, 38);
    font-size: 28px;
    margin: 0;
    margin-right: 20px;
  }
  .posts-followers-following li {
    margin-right: 50px;
  }
  section .username-and-edit-profile,
  section ul {
    margin-bottom: 20px;
  }
  section .username-and-edit-profile {
    ${Button2} {
      margin-right: 8px;
    }
    ${Button} {
      padding-left: 24px;
      padding-right: 24px;
    }
  }
  section > div:last-child {
    margin-bottom: 0px;
  }
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  p {
    font-size: 16px;
    margin: 0;
  }
  strong {
    font-weight: 600;
  }
`
const Posts = styled(Container)`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  text-align: center;
  h2 {
    color: rgb(38, 38, 38);
    font-weight: 300;
    font-size: 46px;
  }
  div {
    width: 293px;
    height: 293px;
    margin-right: 28px;
    margin-bottom: 28px;
  }
  div:nth-child(3n + 0) {
    margin-right: 0;
  }
  img {
    object-fit: contain;
    height: 100%;
  }
`
const StyledBox = styled(Box)`
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  flex-flow: column;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 400px;
  &:focus {
    border: none;
    outline: none;
  }
  h2 {
    color: rgb(38, 38, 38);
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    padding: 32px 0;
  }
  button {
    border-top: 1px solid rgb(219, 219, 219);
    font-size: 14px;
    padding: 15px 0;
    font-weight: 700;
  }
  .upload-photo {
    color: rgb(0, 149, 246);
  }
  .remove-photo {
    color: rgb(237, 73, 86);
  }
  .cancel {
    font-weight: 400;
  }
`
