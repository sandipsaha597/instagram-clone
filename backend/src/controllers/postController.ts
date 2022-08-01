import { Request, Response } from 'express'
import cloudinary from 'cloudinary'
const cloudinaryV2 = cloudinary.v2
import Post from '../models/post'
import Comment from '../models/comment'
import { isValidObjectId } from 'mongoose'
import Like from '../models/like'

export const createPost = async (req: Request, res: Response) => {
  const { caption, images } = req.body
  if (images.length < 1) return res.status(400).send('no image was sent')
  try {
    // @ts-expect-error
    console.log(req.searchUserBy.username)
    // @ts-expect-error
    if (req?.searchUserBy.username) {
      const tempPostObj: any = {
        //@ts-ignore
        postBy: { username: req.searchUserBy.username },
        caption,
        // hashtags: ,
      }
      // folder, images,
      const result = await uploadImages(images)
      if (result.status === 'ok' && result.imageArray) {
        tempPostObj.images = result.imageArray.map((v: any) => {
          const tempArray = v.url.split('.')
          tempArray.pop()
          return { url: tempArray.join('.'), publicId: v.publicId }
        })
      } else {
        return res.status(400).send('failed')
      }
      console.log('running')
      const post = await Post.create(tempPostObj)
      console.log(post)
      res.status(201).send(post)
      return
    }

    res.status(400).send('failed to create post')
  } catch (e) {
    console.log(e)
    res.status(500).send('failed to create post')
  }
}

export const like = async (req: Request, res: Response) => {
  try {
    //@ts-ignore
    if (!req.searchUserBy.username) return res.status(400).send('please log in')
    const { _id, type } = req.body
    if (!(_id && type)) return res.status(400).send('id & type is required')
    if (!isValidObjectId(_id)) return res.status(400).send('invalid objectId')
    if (!(type === 'post' || type === 'comment'))
      return res.status(400).send('invalid type parameter')

    let result
    if (type === 'post') {
      result = await Post.updateOne({ _id }, { $inc: { likes: 1 } } as any)
    }
    if (type === 'comment') {
      result = await Comment.updateOne({ _id }, { $inc: { likes: 1 } } as any)
    }
    if (!result) return res.status(400).send('failed')
    if (result.modifiedCount === 0 && result.matchedCount === 0)
      return res.status(400).send('id does not exist')
    if (result.modifiedCount === 0) return res.status(500).send('failed')
    const like = await Like.create({
      parentId: _id,
      type,
      likedBy: {
        //@ts-ignore
        username: req.searchUserBy.username,
        //@ts-ignore
        profilePicture: req.jwtPayload.profilePicture,
      },
    })
    console.log(like)
    return res.status(201).send('liked')
  } catch (err) {
    console.log(err)
    res.status(500).send('failed')
  }
}

export const comment = async (req: Request, res: Response) => {
  try {
    //@ts-ignore
    if (!req.searchUserBy.username) return res.status(400).send('please log in')

    const { _id, type, comment } = req.body
    if (!(_id && type && comment)) return res.status(400).send('missing fields')
    if (!isValidObjectId(_id)) return res.status(400).send('invalid objectId')
    if (!(type === 'post' || type === 'comment' || type === 'reply'))
      return res.status(400).send('invalid type')

    let result: any
    let parentId: string = ''
    let resultType: 'comment' | 'reply' = 'comment'
    if (type === 'post') {
      result = await Post.findOneAndUpdate(
        { _id },
        { $inc: { commentCount: 1 } as any }
      )
      if (!result) return res.status(400).send(`post does not exist`)
      parentId = result._id
      resultType = 'comment'
    }
    if (type === 'comment' || type === 'reply') {
      result = await Comment.findOne({ _id })
      if (!result) return res.status(400).send(`comment does not exist`)
      if (result.type === 'comment') {
        parentId = result._id
        const incrementReplyCount = await Comment.updateOne({ _id }, {
          $inc: { replyCount: 1 },
        } as any)
      }
      if (result.type === 'reply') {
        parentId = result.parentId
        const incrementReplyCount = await Comment.updateOne(
          { _id: result.parentId },
          {
            $inc: { replyCount: 1 },
          } as any
        )
      }
      resultType = 'reply'
    }
    // @ts-ignore
    console.log(parentId)
    const tempCommentObj: any = {
      parentId,
      type: resultType,
      comment,
      commentedBy: {
        // @ts-ignore
        username: req.searchUserBy.username,
        // @ts-ignore
        profilePicture: req.jwtPayload.profilePicture,
      },
    }
    if (resultType === 'comment') {
      tempCommentObj.replyCount = 0
    }
    const commentResult = await Comment.create(tempCommentObj)
    console.log(commentResult)
    res.send(commentResult)
  } catch (err) {
    console.error(err)
  }
}

const uploadImages = async (images: string[]) => {
  try {
    console.log('uploadImages')
    const promiseArray: any[] = new Array(images.length)
    const imageArray: Array<{ url: string; publicId: string }> = []
    let imageUploadErrorOccurred = false
    let responseCount = 0
    const destroyAll = () => {
      if (responseCount >= imageArray.length) {
        imageArray.forEach((v) => {
          if (v.url === '') return
          console.log(v)
          // @ts-ignore
          cloudinary.uploader
            .destroy(v.publicId)
            .then((v: any) => {
              console.log(v)
            })
            .catch((err: any) =>
              console.log(`failed to destroy image ${v} ${err}`)
            )
        })
      }
    }
    images.forEach((image: string, i: number) => {
      imageArray.push({ url: '', publicId: '' })
      promiseArray.push(
        cloudinaryV2.uploader
          .upload(image, {
            folder: 'images',
            allowed_formats: ['jpg', 'png', 'webp'],
          })
          .then((v: cloudinary.UploadApiResponse) => {
            imageArray[i].url = v.secure_url
            imageArray[i].publicId = v.public_id
            responseCount++
            if (imageUploadErrorOccurred) {
              destroyAll()
            }
          })
          .catch((err: cloudinary.UploadApiErrorResponse) => {
            // res.status(400).send('failed')
            console.log('image upload failed', err)
            imageUploadErrorOccurred = true
            responseCount++
            destroyAll()
          })
      )
    })
    await Promise.all(promiseArray)
    if (imageUploadErrorOccurred) {
      return { status: 'failed' }
    }
    return { status: 'ok', imageArray }
  } catch (error) {
    console.log(error)
    return { status: 'failed' }

    // res.send('error')
  }
}
