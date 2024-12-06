import express, { NextFunction, Request, Response } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import fs from 'fs'
import multer from 'multer'
import path from 'path'
import prisma from '../prisma/client'
import { FILE_STORAGE_PATH, pipeStream, upload } from '../services/fileService'

const router = express.Router()

router.get(
  '/',
  [query('directoryId').optional().isString().trim().escape()],
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

router.delete(
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
      const file = await prisma.file.findUnique({ where: { id } })

      if (!file) {
        res.status(404).json({ error: 'File not found' })
        return
      }

      const filePath = path.join(FILE_STORAGE_PATH, id)

      try {
        await fs.promises.access(filePath)
        await fs.promises.unlink(filePath)
      } catch {
        console.error('Error deleting file from storage') //TODO better logging
      }

      await prisma.file.delete({ where: { id } })

      res.status(200).json({ message: 'File deleted' })
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  '/download/:id',
  param('id').isUUID().withMessage('Invalid ID'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    try {
      const { id } = req.params
      const filePath = path.join(FILE_STORAGE_PATH, `${id}`)
      const file = await prisma.file.findUnique({ where: { id: id } })

      if (file || fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath)

        res.setHeader('Content-Type', 'application/octet-stream')
        res.setHeader('Content-Length', stat.size)
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${file?.name}"`
        )

        const readStream = fs.createReadStream(filePath)
        readStream.pipe(res)

        readStream.on('error', (err) => {
          res
            .status(500)
            .json({ error: 'Error streaming the file', details: err.message })
        })
      } else {
        res.status(404).json({ error: 'File not found' })
      }
    } catch (err) {
      next(err)
    }
  }
)

router.post(
  '/upload',
  body('directoryId').isUUID().withMessage('Invalid ID'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    upload(req, res, async (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res
            .status(400)
            .json({ error: 'File upload error', details: err.message })
        }
        return res
          .status(500)
          .json({ error: 'Internal server error', details: err.message })
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const { directoryId } = req.body
      const authorId = req.user.id

      const directory = await prisma.directory.findUnique({
        where: { id: directoryId },
      })

      if (!directory) {
        res.status(400).json({ error: 'Directory does not exist' })
        await fs.promises.unlink(req.file.path)
        return
      }

      const filename = req.file.originalname

      const newFile = await prisma.file.create({
        data: {
          name: filename,
          authorId,
          directoryId: directory.id,
        },
      })

      const filePath = path.join(FILE_STORAGE_PATH, newFile.id)
      const writeStream = fs.createWriteStream(filePath)
      const readStream = fs.createReadStream(req.file.path)

      try {
        await pipeStream(readStream, writeStream)

        await fs.promises.unlink(req.file.path)

        res.status(201).json(newFile)
      } catch (err) {
        await prisma.file.delete({
          where: { id: newFile.id },
        })
        await fs.promises.unlink(filePath)

        res
          .status(500)
          .json({ error: 'Error saving file', details: JSON.stringify(err) })
      }
    })
  }
)

export default router
