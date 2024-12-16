import express, { NextFunction, Request, Response } from 'express'
import { body, param, validationResult } from 'express-validator'
import prisma from '../prisma/client'

const router = express.Router()

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const posts = await prisma.post.findMany()
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
      const post = await prisma.post.findUnique({ where: { id: id } })

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
      const post = await prisma.comment.findMany({ where: { postId: id } })

      res.json(post)
    } catch (err) {
      next(err)
    }
  }
)

export default router
