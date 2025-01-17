import { ErrorRequestHandler } from 'express'
import { ApiError } from '../utils/ApiError'

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    const { message, status, details } = err

    const response: Record<string, any> = { message }
    if (details) {
      response.details = details
    }

    res.status(status).json(response)
    return
  }

  console.error(err)
  res.status(500).json({ message: 'Internal Server Error' })
}

export default errorHandler
