import express, { NextFunction, Request, Response } from 'express'
import prisma from '../prisma/client'

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
        res.status(404).json({ error: 'User not found' })
        return
      }

      res.json(user)
    } catch (err) {
      next(err)
    }
  }
)

export default router
