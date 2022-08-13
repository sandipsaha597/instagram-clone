import axios from 'axios'
import { forwardRef, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Button } from '../atoms/Buttons/Buttons'
import { CropIcon, UploadImageVideoIcon } from '../atoms/Icons/Icons'
import { UsernameWithImage } from '../atoms/layouts/UsernameWithImage'
import { transformCloudinaryImage } from '../utils/utilFunctions'
import { DOMAIN } from '../utils/utilVariables'

const AddPost = forwardRef(({ userDetails }: any) => {
  const inputRef = useRef<any>(null)
  const captionRef = useRef<any>(null)
  const [files, setFiles] = useState<string[]>([])
  const [headingText, setHeadingText] = useState('Create new post')
  // useEffect(() => {
  //   return () => {
  //     console.log('unmounted')
  //     setFiles([])
  //   }
  // }, [])
  useEffect(() => {
    alert('PLEASE NOTE: this feature is incomplete')
  }, [])
  const getDataUrlsOfFiles = () => {
    const blobFiles = inputRef.current.files
    let tempFiles = new Array(blobFiles.length).fill('')
    const readAndSetDataURLs = (file: any, index: number) => {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        tempFiles[index] = reader.result
        const imagesLoading = tempFiles.includes('')
        if (!imagesLoading) {
          setFiles(tempFiles)
        }
      })
      reader.readAsDataURL(file)
    }

    if (blobFiles) {
      for (let i = 0; i < inputRef.current.files.length; i++) {
        readAndSetDataURLs(blobFiles[i], i)
      }
    }
  }
  const sharePost = async () => {
    setHeadingText('Sharing')
    try {
      const response = await axios.post(`${DOMAIN}/createPost`, {
        caption: captionRef?.current?.value,
        images: files,
      })
      setHeadingText('Post shared')
    } catch (err) {
      console.log(err)
      alert('Failed to share post')
      setHeadingText('Create new post')
    }
  }
  return (
    <StyledAddPost>
      {files.length ? (
        <Head>
          <Heading>{headingText}</Heading>
          <button onClick={sharePost}>Share</button>
        </Head>
      ) : (
        <Heading>{headingText}</Heading>
      )}
      <Body haveFiles={files.length}>
        <FileInput
          type="file"
          ref={inputRef}
          // multiple
          onChange={() => getDataUrlsOfFiles()}
        />
        {files.length ? (
          <>
            {files.map((v, i) => (
              <>
                <PostImage src={v} alt="" key={i} />
                <CropButton>
                  <CropIcon />
                </CropButton>
              </>
            ))}
            <WriteACaption>
              <UsernameWithImage
                image={transformCloudinaryImage(
                  userDetails.profilePicture.withVersion,
                  'w_28'
                )}
                username={userDetails.username}
              />
              <textarea
                ref={captionRef}
                placeholder="Write a caption..."
              ></textarea>
            </WriteACaption>
          </>
        ) : (
          <>
            <UploadImageVideoIcon />
            <p>Drag photos and videos here</p>
            <Button widthAuto onClick={() => inputRef?.current?.click()}>
              Select from computer
            </Button>
          </>
        )}
      </Body>
    </StyledAddPost>
  )
})

export default AddPost
const PostImage = styled.img`
  width: 523px;
  height: 523px;
  object-fit: cover;
`
const ImageAndCaption = styled.div`
  display: flex;
`
const WriteACaption = styled.div`
  margin: 18px 0 14px 0;
  padding: 0 16px;
  width: 307px;
  textarea {
    border: none;
    font-size: 16px;
    margin-top: 14px;
    resize: none;
    width: 100%;
    &:focus {
      outline: none;
    }
  }
`
const CropButton = styled.button`
  background: rgba(26, 26, 26, 0.8);
  border-radius: 50%;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  bottom: 16px;
  left: 16px;
`
const FileInput = styled.input`
  display: hidden;
  position: absolute;
  left: -10000px;
`
const Head = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  button {
    position: absolute;
    right: 16px;
    color: rgba(0, 149, 246, 1);
    font-size: 14px;
    font-weight: 600;
  }
`
const StyledAddPost = styled.div`
  background-color: #fff;
  border-radius: 12px;
  text-align: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  overflow: hidden;
`
const Heading = styled.div`
  border-bottom: 1px solid rgba(219, 219, 219, 1);
  color: rgb(38, 38, 38);
  font-size: 16px;
  font-weight: 600;
  padding: 10px 0;
`
const Body = styled.div<any>`
  box-sizing: border-box;
  font-size: 22px;
  display: flex;
  justify-content: center;
  align-items: ${({ haveFiles }) => (haveFiles ? 'flex-start' : 'center')};
  flex-direction: ${({ haveFiles }) => (haveFiles ? 'row' : 'column')};
  width: ${({ haveFiles }) => (haveFiles ? 'auto' : '523px')};
  height: ${({ haveFiles }) => (haveFiles ? 'auto' : '523px')};
  /* height: 71vh; */
  font-weight: 300;
  padding: ${({ haveFiles }) => (haveFiles ? '0' : '0 24px')};
  p {
    margin-top: 9px;
    margin-bottom: 24px;
  }
`
