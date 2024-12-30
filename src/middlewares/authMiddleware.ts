import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../prisma/client'
import { User } from '@prisma/client'

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    res.status(401).json({ error: 'Authentication required' })
    return
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
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export default authMiddleware
