import express, { NextFunction, Request, Response } from 'express'
import { param, query, validationResult } from 'express-validator'
import prisma from '../prisma/client'

const router = express.Router()

router.get(
  '/',
  [query('directoryId').optional().isUUID().trim().escape()],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    try {
      const directoryId = req.query.directoryId as string

      const files = await prisma.file.findMany({
        where: {
          directoryId: directoryId === '' ? null : directoryId,
        },
      })
      res.json(files)
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
