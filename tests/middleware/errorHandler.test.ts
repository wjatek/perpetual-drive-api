import { NextFunction, Request, Response } from 'express'
import errorHandler from '../../src/middlewares/errorHandler'
import { ApiError } from '../../src/utils/ApiError'

describe('errorHandler', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {}
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    mockNext = jest.fn()
  })

  it('should handle ApiError correctly', () => {
    const error = new ApiError('Not found', 404, {
      message: 'The requested resource was not found.',
    })

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(404)
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Not found',
      details: { message: 'The requested resource was not found.' },
    })
  })

  it('should handle generic errors with status 500', () => {
    const error = new Error('Unexpected error')

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Internal Server Error',
    })
  })

  it('should log errors that are not ApiErrors', () => {
    const error = new Error('Unexpected error')
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext)

    expect(consoleErrorSpy).toHaveBeenCalledWith(error)
    consoleErrorSpy.mockRestore()
  })
})
