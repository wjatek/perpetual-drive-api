import { User } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../prisma/client'
import { ApiError } from '../utils/ApiError'

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return next(new ApiError('Authentication required', 401))
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || 'default_secret'
    ) as { userId: string }

    const user = (await prisma.user.findUnique({
      where: { id: decoded.userId },
    })) as User

    req.user = user

    next()
  } catch (err) {
    return next(new ApiError('Invalid or expired token', 401))
  }
}

export default authMiddleware
