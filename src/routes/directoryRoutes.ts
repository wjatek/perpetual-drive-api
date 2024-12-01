import express, { NextFunction, Request, Response } from 'express'
import prisma from '../prisma/client'
import { Directory } from '@prisma/client'

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

router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, parentId } = req.body
      const authorId = req.user.id

      if (!name) {
        res.status(400).json({ error: 'Name is required' })
        return
      }

      const parent = await prisma.directory.findUnique({
        where: { id: parentId },
        include: {
          subdirectories: true,
        },
      })

      if (!parent) {
        res.status(400).json({ error: 'Parent directory does not exist' })
        return
      }

      if (parent.subdirectories.find(subdirectory => subdirectory.name === name)) {
        res.status(400).json({ error: 'Directory already exists' })
        return
      }

      const newDirectory = await prisma.directory.create({
        data: {
          name,
          authorId,
          parentId,
        },
      })

      res.status(201).json(newDirectory)
    } catch (err) {
      next(err)
    }
  }
)

export default router
