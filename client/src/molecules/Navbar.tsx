import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Backdrop from '../atoms/Backdrop/Backdrop'
import { Container } from '../atoms/Boxes/Container'
import {
  AddPostIcon,
  DirectMessageIcon,
  HomeIconActive,
  ProfileImg,
} from '../atoms/Icons/Icons'
import Logo from '../atoms/IconsAndImages/Logo'
import { DOMAIN } from '../utils/utilVariables'
import AddPost from './AddPost'

const Navbar = ({ setUserLoggedIn, userDetails }: any) => {
  const [modalHidden, setModalHidden] = useState(true)
  const [sendPostModalHidden, setSendPostModalHidden] = useState(true)
  return (
    <>
      <StyledNavbar as="nav">
        <StyledContainer>
          <Logo />
          <Right>
            <ul>
              <li>
                <HomeIconActive />
              </li>
              <li>
                <Link to="/inbox">
                  <DirectMessageIcon />
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setSendPostModalHidden((state) => !state)}
                >
                  <AddPostIcon />
                </button>
              </li>
              {/* <li>Explore</li>
          <li>notifications</li> */}
              <ModalButtonWrapper className="modal-button" active={modalHidden}>
                <button
                  type="button"
                  onClick={() => setModalHidden((state) => !state)}
                >
                  {/* <ProfileImg src={userDetails.profilePicture.withVersion} /> */}
                  <ProfileImg src="https://res.cloudinary.com/dbevmtl8a/image/upload/w_24/v1650475415/users/instagram-clone-default-dp_qilu7c" />
                </button>
                <Modal
                  setUserLoggedIn={(e: boolean) => setUserLoggedIn(e)}
                  hidden={modalHidden}
                  userDetails={userDetails}
                />
              </ModalButtonWrapper>
            </ul>
          </Right>
        </StyledContainer>
      </StyledNavbar>
      {!sendPostModalHidden && (
        <Backdrop close={() => setSendPostModalHidden(false)}>
          <AddPost userDetails={userDetails} />
        </Backdrop>
      )}
    </>
  )
}

export default Navbar
const ModalButtonWrapper = styled.li<any>`
  > button {
    border: ${({ active }) => (active ? '1px solid #fff' : '1px solid #000')};
  }
`
const StyledNavbar = styled.div`
  border-bottom: 1px solid rgb(219, 219, 219);
`
const StyledContainer = styled(Container)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  .logo {
    height: 29px;
  }
`
const Right = styled.div`
  ul {
    display: flex;
    align-items: center;
    li {
      margin-left: 22px;
    }
  }
  .modal-button {
    position: relative;
    > button {
      border-radius: 50%;
      height: 24px;
      aspect-ratio: 1/1;
    }
  }
`

const Modal = ({ hidden, setUserLoggedIn, userDetails }: any) => {
  const navigate = useNavigate()
  const logout = async (e: any) => {
    e.preventDefault()
    const response = await axios.get(`${DOMAIN}/logout`)
    navigate('/')
    setUserLoggedIn(false)
  }
  return (
    <Card hidden={hidden}>
      <div className="arrow"></div>
      <ul>
        <li>
          <Link to={`/${userDetails.username}`}>Profile</Link>
        </li>
        <li className="logout">
          <button onClick={logout}>Log Out</button>
        </li>
      </ul>
    </Card>
  )
}

const Card = styled.div`
  display: ${({ hidden }) => (hidden ? 'none' : 'block')};
  width: 230px;
  box-sizing: border-box;
  position: absolute;
  top: 34px;
  right: -30px;
  box-shadow: 0 0 5px 1px rgba(0, 0, 0, 0.0975);
  border-radius: 6px;
  background: #ffffff;
  z-index: 3;
  .arrow {
    aspect-ratio: 1/1;
    /* box-shadow: 0 0 5px 1px rgba(0, 0, 0, 0.0975); */
    width: 14px;
    position: absolute;
    background: #fff;
    top: -6px;
    right: 34px;
    transform: rotate(45deg);
    z-index: 1;
  }
  ul {
    display: flex;
    flex-flow: column;
    li {
      box-sizing: border-box;
      margin-left: 0;
      padding: 8px 16px;
      width: 100%;
    }
  }

  .logout {
    border-top: 1px solid rgb(219, 219, 219);
  }
`