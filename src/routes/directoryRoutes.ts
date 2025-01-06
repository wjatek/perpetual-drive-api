import { Directory } from '@prisma/client'
import express, { NextFunction, Request, Response } from 'express'
import { param, query, validationResult } from 'express-validator'
import prisma from '../prisma/client'

const router = express.Router()

router.get(
  '/',
  [query('parentId').optional().isString().trim().escape()],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    try {
      const parentId = req.query.parentId as string

      const directories = await prisma.directory.findMany({
        where: {
          parentId: parentId === '' ? null : parentId,
        },
      })
      res.json(directories)
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  '/:id',
  param('id').isUUID().withMessage('Invalid ID'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

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

      if (parentId) {
        const parent = await prisma.directory.findFirst({
          where: { id: parentId },
        })

        if (!parent) {
          res.status(400).json({ error: 'Parent directory does not exist' })
          return
        }
      }

      const siblings = await prisma.directory.findMany({
        where: { parentId: parentId || null },
      })

      if (siblings.find((dir) => dir.name === name)) {
        res.status(400).json({ error: 'Directory already exists' })
        return
      }

      const newDirectory = await prisma.directory.create({
        data: {
          name,
          authorId,
          parentId: parentId || null,
        },
      })

      res.status(201).json(newDirectory)
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  '/:id/path',
  param('id').isUUID().withMessage('Invalid ID'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    try {
      const { id } = req.params
      const path: Partial<Directory>[] = []

      const getDirectoryPath = async (directoryId: string): Promise<void> => {
        const directory = await prisma.directory.findUnique({
          where: { id: directoryId },
        })

        if (!directory) {
          throw new Error('Directory not found')
        }

        path.unshift({ id: directory.id, name: directory.name })

        if (directory.parentId) {
          await getDirectoryPath(directory.parentId)
        }
      }

      await getDirectoryPath(id)

      res.json({ path })
    } catch (err) {
      next(err)
    }
  }
)

export default router
