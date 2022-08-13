import { Modal } from '@mui/material'
import axios from 'axios'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Backdrop from '../atoms/Backdrop/Backdrop'
import { Container } from '../atoms/Boxes/Container'
import { Button, Button2 } from '../atoms/Buttons/Buttons'
import {
  AddPostIcon,
  DirectMessageIcon,
  DirectMessageIconActive,
  HomeIcon,
  HomeIconActive,
  ProfileImg,
} from '../atoms/Icons/Icons'
import Logo from '../atoms/IconsAndImages/Logo'
import { LinkText } from '../atoms/Text/Texts'
import { socket } from '../SocketIO'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import { DOMAIN } from '../utils/utilVariables'
import AddPost from './AddPost'

const Navbar = ({ userDetails, emptyAllStates }: any) => {
  const [modalHidden, setModalHidden] = useState(true)
  const [addPostModalOpen, setAddPostModalOpen] = useState(false)
  return (
    <StyledNavbar>
      <StyledContainer>
        <Logo />
        <Right>
          <ul>
            {!userDetails ? (
              <>
                <li>
                  <Link to="/accounts/login">
                    <Button widthAuto>Log In</Button>
                  </Link>
                </li>
                <li>
                  <Link to="/accounts/signup">
                    <Button2>Sign Up</Button2>
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink to="/">
                    {({ isActive }) =>
                      isActive ? <HomeIconActive /> : <HomeIcon />
                    }
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/inbox">
                    {({ isActive }) =>
                      isActive ? (
                        <DirectMessageIconActive />
                      ) : (
                        <DirectMessageIcon />
                      )
                    }
                  </NavLink>
                </li>
                <li>
                  <button
                    onClick={() => setAddPostModalOpen((state) => !state)}
                  >
                    <AddPostIcon />
                  </button>
                </li>
                <ModalButtonWrapper
                  as="li"
                  className="modal-button"
                  active={modalHidden}
                >
                  <button
                    type="button"
                    onClick={() => setModalHidden((state) => !state)}
                  >
                    <ProfileImg
                      src={transformCloudinaryImage(
                        userDetails.profilePicture.withVersion,
                        'w_24'
                      )}
                    />
                  </button>
                  <ProfilePopOver
                    hidden={modalHidden}
                    {...{ userDetails, emptyAllStates }}
                  />
                </ModalButtonWrapper>
              </>
            )}
            {/* <li>Explore</li>
          <li>notifications</li> */}
          </ul>
        </Right>
      </StyledContainer>
      {/* {addPostModalOpen && ( */}
      {/* //{' '}
      <Backdrop close={() => setAddPostModalOpen(false)}>
        // <AddPost userDetails={userDetails} />
        //{' '} */}
      {/* </Backdrop> */}
      <Modal
        open={addPostModalOpen}
        // open={true}
        onClose={() => setAddPostModalOpen(false)}
      >
        <AddPost userDetails={userDetails} />
      </Modal>
      {/* )} */}
    </StyledNavbar>
  )
}

export default Navbar
const ModalButtonWrapper = styled.li<any>`
  > button {
    border: ${({ active }) => (active ? '1px solid #fff' : '1px solid #000')};
  }
`
const StyledNavbar = styled.nav`
  background: #fff;
  border-bottom: 1px solid rgb(219, 219, 219);
  /* grid-area: navbar; */
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
      width: 24px;
      height: 24px;
    }
  }
`

const ProfilePopOver = ({ hidden, userDetails, emptyAllStates }: any) => {
  const navigate = useNavigate()
  const logout = async (e: any) => {
    e.preventDefault()
    try {
      await axios.get(`${DOMAIN}/logout`)
      emptyAllStates()
      socket.disconnect()
      navigate('/')
    } catch (err) {
      console.error(err)
      alert('failed to logout')
    }
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
    /* box-shadow: 0 0 5px 1px rgba(0, 0, 0, 0.0975); */
    width: 14px;
    height: 14px;
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
