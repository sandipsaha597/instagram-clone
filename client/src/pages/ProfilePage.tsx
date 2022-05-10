import { useEffect, useState } from 'react'
import axios from 'axios'
import styled from 'styled-components'
import { Button2 } from '../atoms/Buttons/Buttons'
import Navbar from '../molecules/Navbar'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import { DOMAIN } from '../utils/utilVariables'
import { Container } from './../atoms/Boxes/Container'
import { useParams } from 'react-router-dom'
const ProfilePage = ({ userDetails }: any) => {
  const [pageDetails, setPageDetails] = useState<any>()
  const params = useParams()
  useEffect(() => {
    ;(async () => {
      try {
        const response = await axios.get(`${DOMAIN}/${params.username}`)
        setPageDetails(response.data)
      } catch (error) {
        console.log(error)
      }
    })()
  }, [params.username])

  if (!pageDetails?.username) return <h1>Loading...</h1>
  return (
    <>
      <Navbar userDetails={userDetails} />
      <StyledContainer as="header">
        <div className="img-box">
          <img
            src={transformCloudinaryImage(
              pageDetails.profilePicture.withVersion,
              'w_150'
            )}
            alt={pageDetails.username}
          />
        </div>
        <section>
          <div className="flex username-and-edit-profile">
            <h2>{pageDetails.username}</h2>
            <Button2>Edit Profile</Button2>
          </div>
          <ul className="flex posts-followers-following">
            <li>
              <strong>{pageDetails.postCount || 0}</strong> posts
            </li>
            <li>
              <strong>{pageDetails.followerCount || 0}</strong> followers
            </li>
            <li>
              <strong>{pageDetails.followingCount || 0}</strong> following
            </li>
          </ul>
          <div>
            <h3>{pageDetails.name}</h3>
            <p className="bio">{pageDetails.bio}</p>
          </div>
        </section>
      </StyledContainer>
      <Posts as="section">
        {pageDetails.posts.map((v: any, i: number) => (
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
  div {
    aspect-ratio: 1/1;
    width: 293px;
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
