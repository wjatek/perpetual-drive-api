import { Request } from 'express'
import fs from 'fs'
import multer, { StorageEngine } from 'multer'
import stream from 'stream'
import { promisify } from 'util'

export const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH || './storage'
if (!fs.existsSync(FILE_STORAGE_PATH)) {
  fs.mkdirSync(FILE_STORAGE_PATH, { recursive: true })
}

export const storage: StorageEngine = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, destination: string) => void
  ) => {
    callback(null, FILE_STORAGE_PATH)
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void
  ) => {
    callback(null, file.originalname)
  },
})

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 * 1024,
  },
}).single('file')

export const pipeStream = promisify(stream.pipeline)
