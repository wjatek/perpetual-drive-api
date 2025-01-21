import { User } from '@prisma/client'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import authMiddleware from '../../src/middlewares/authMiddleware'
import prisma from '../../src/prisma/client'
import { ApiError } from '../../src/utils/ApiError'

jest.mock('../../src/prisma/client', () => ({
  user: {
    findUnique: jest.fn(),
  },
}))

describe('authMiddleware', () => {
  let mockReq: Partial<Request> & { user?: User }
  let mockRes: Partial<Response>
  let mockNext: jest.Mock

  beforeEach(() => {
    mockReq = {
      header: jest.fn(),
    }
    mockRes = {}
    mockNext = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should set user on the request object if the token is valid', async () => {
    const mockUser: User = {
      id: 'test-user-id',
      name: 'Test User',
      password: 'hashedpassword',
    }

    const validToken = 'valid.jwt.token'
    ;(mockReq.header as jest.Mock).mockReturnValue(`Bearer ${validToken}`)

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      return { userId: mockUser.id } as unknown as jwt.JwtPayload
    })
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as User)

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockReq.user).toEqual(mockUser)
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('should call next with an ApiError if token is missing', async () => {
    ;(mockReq.header as jest.Mock).mockReturnValue(undefined)

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalledWith(
      new ApiError('Authentication required', 401)
    )
  })

  it('should call next with an ApiError if token is invalid', async () => {
    const invalidToken = 'invalid.jwt.token'
    ;(mockReq.header as jest.Mock).mockReturnValue(`Bearer ${invalidToken}`)

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Invalid token')
    })

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalledWith(
      new ApiError('Invalid or expired token', 401)
    )
  })

  it('should call next with an ApiError if user is not found', async () => {
    const validToken = 'valid.jwt.token'
    ;(mockReq.header as jest.Mock).mockReturnValue(`Bearer ${validToken}`)

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      return { userId: 'nonexistent-user-id' } as unknown as jwt.JwtPayload
    })
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null)

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalledWith(new ApiError('User not found', 401))
  })

  it('should call next with an ApiError on unexpected errors', async () => {
    const validToken = 'valid.jwt.token'
    ;(mockReq.header as jest.Mock).mockReturnValue(`Bearer ${validToken}`)

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Unexpected error')
    })

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalledWith(
      new ApiError('Invalid or expired token', 401)
    )
  })
})
