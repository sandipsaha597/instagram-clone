import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, Button2 } from '../atoms/Buttons/Buttons'
import {
  getAndSetInbox,
  transformCloudinaryImage,
} from '../utils/utilFunctions'
import { DOMAIN } from '../utils/utilVariables'
import { Container } from './../atoms/Boxes/Container'
const ProfilePage = ({ userDetails, setChats, inboxes, setInboxes }: any) => {
  const [profileDetails, setProfileDetails] = useState<any>()
  const [messageButtonDisabled, setMessageButtonDisabled] = useState(false)

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
    <>
      <StyledContainer as="header">
        <div className="img-box">
          <img
            src={transformCloudinaryImage(
              profileDetails.profilePicture.withVersion,
              'w_150'
            )}
            alt={profileDetails.username}
          />
        </div>
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
        {profileDetails.posts.map((v: any, i: number) => (
          <div>
            <img src={v.images[0].url} alt={`post ${i}`} />
          </div>
        ))}
      </Posts>
    </>
  )
}

export default ProfilePage

const StyledContainer = styled(Container)`
  display: flex;
  padding: 30px 20px;
  .img-box {
    width: 292px;
    margin-right: 30px;
    text-align: center;
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
  text-align: center;
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
    object-fit: cover;
    height: 100%;
  }
`
