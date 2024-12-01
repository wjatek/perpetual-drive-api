import express, { Request, Response, NextFunction } from 'express'
import prisma from '../prisma/client'

const router = express.Router()

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = await prisma.file.findMany()
      res.json(files)
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
      const file = await prisma.file.findUnique({ where: { id: id } })

      if (!file) {
        res.status(404).json({ error: 'File not found' })
        return
      }

      res.json(file)
    } catch (err) {
      next(err)
    }
  }
)

export default router
