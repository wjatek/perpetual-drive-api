import express, { NextFunction, Request, Response } from 'express'
import { body, param, validationResult } from 'express-validator'
import prisma from '../prisma/client'
import { basicUser } from '../utils/selectors'

const router = express.Router()

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const posts = await prisma.post.findMany({
        include: {
          likedBy: {
            select: basicUser,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      res.json(posts)
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  '/:id',
  param('id').isUUID().withMessage('Invalid ID'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() })
        return
      }

      const { id } = req.params
      const post = await prisma.post.findUnique({
        where: { id: id },
        include: {
          likedBy: {
            select: basicUser,
          },
        },
      })

      if (!post) {
        res.status(404).json({ error: 'Post not found' })
        return
      }

      res.json(post)
    } catch (err) {
      next(err)
    }
  }
)

router.post(
  '/',
  body('content').trim().escape().notEmpty().withMessage('Content is required'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    try {
      const { content } = req.body
      const authorId = req.user.id

      const newPost = await prisma.post.create({
        data: {
          content,
          authorId,
        },
      })

      res.status(201).json(newPost)
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  '/:id/comments',
  param('id').isUUID().withMessage('Invalid ID'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() })
        return
      }

      const { id } = req.params
      const comments = await prisma.comment.findMany({ where: { postId: id } })

      res.json(comments)
    } catch (err) {
      next(err)
    }
  }
)

router.post(
  '/:id/comments',
  param('id').isUUID().withMessage('Invalid ID'),
  body('content').trim().escape().notEmpty().withMessage('Content is required'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    try {
      const { content } = req.body
      const authorId = req.user.id
      const postId = req.params.id

      const newComment = await prisma.comment.create({
        data: {
          content,
          authorId,
          postId,
        },
      })

      res.status(201).json(newComment)
    } catch (err) {
      next(err)
    }
  }
)

router.post(
  '/:id/like',
  param('id').isUUID().withMessage('Invalid ID'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    try {
      const userId = req.user.id
      const postId = req.params.id

      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          likedBy: true,
        },
      })

      if (!post) {
        res.status(404).json({ message: 'Post not found' })
        return
      }

      const hasLiked = post.likedBy.some((user) => user.id === userId)

      let updatedPost

      if (hasLiked) {
        updatedPost = await prisma.post.update({
          where: { id: postId },
          data: {
            likedBy: {
              disconnect: { id: userId },
            },
          },
        })
      } else {
        updatedPost = await prisma.post.update({
          where: { id: postId },
          data: {
            likedBy: {
              connect: { id: userId },
            },
          },
        })
      }

      res.status(201).json(updatedPost)
    } catch (err) {
      next(err)
    }
  }
)

export default router
