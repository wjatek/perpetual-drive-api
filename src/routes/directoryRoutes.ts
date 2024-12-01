import express, { Request, Response, NextFunction } from 'express'
import prisma from '../prisma/client'

const router = express.Router()

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const directorys = await prisma.directory.findMany()
      res.json(directorys)
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
      const directory = await prisma.directory.findUnique({ where: { id: id } })

      if (!directory) {
        res.status(404).json({ error: 'Directory not found' })
        return
      }

      res.json(directory)
    } catch (err) {
      next(err)
    }
  }
)

export default router
