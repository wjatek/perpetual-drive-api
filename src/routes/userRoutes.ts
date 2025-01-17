import express, { NextFunction, Request, Response } from 'express'
import prisma from '../prisma/client'
import { ApiError } from '../utils/ApiError'

const router = express.Router()

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        omit: {
          password: true,
        },
      })
      res.json(users)
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params
      const user = await prisma.user.findUnique({
        where: { id: id },
        omit: {
          password: true,
        },
      })

      if (!user) {
        throw ApiError.notFound('User not found')
      }

      res.json(user)
    } catch (err) {
      next(err)
    }
  }
)

export default router
