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

      const { originalname, size: fileSize, path: filePath } = req.file

      try {
        const newFile = await prisma.$transaction(async (transaction) => {
          const directory = await prisma.directory.findFirst({
            where: { id: directoryId },
          })

          if (directoryId && !directory) {
            await fs.promises
              .unlink(filePath)
              .catch((error) => console.error('Failed to unlink', error))
            throw new Error('Directory does not exist')
          }

          const createdFile = await transaction.file.create({
            data: {
              name: originalname,
              authorId,
              directoryId: directory?.id || null,
              size: fileSize,
            },
          })

          const storagePath = path.join(FILE_STORAGE_PATH, createdFile.id)
          const writeStream = fs.createWriteStream(storagePath)
          const readStream = fs.createReadStream(filePath)
          await pipeStream(readStream, writeStream)
          await fs.promises.unlink(filePath)
          return createdFile
        })
        res.status(201).json(newFile)
      } catch (err: any) {
        await fs.promises.unlink(filePath)
        if (err.message === 'Directory does not exist') {
          return res.status(400).json({ error: err.message })
        }
        res
          .status(500)
          .json({ error: 'Error saving file', details: JSON.stringify(err) })
      }
    })
  }
)

export default router
