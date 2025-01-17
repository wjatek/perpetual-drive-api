import bcrypt from 'bcryptjs'
import express, { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../prisma/client'
import { ApiError } from '../utils/ApiError'

const router = express.Router()

const jwtSign = (userId: string, secret?: string, expiresIn?: string) =>
  jwt.sign(
    { userId },
    secret || process.env.ACCESS_TOKEN_SECRET || 'default_secret',
    {
      expiresIn: expiresIn || '15m',
    }
  )

router.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, password } = req.body
    try {
      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = await prisma.user.create({
        data: {
          name,
          password: hashedPassword,
        },
      })

      res
        .status(201)
        .json({ message: 'User created successfully', userId: newUser.id })
    } catch (err) {
      next(err)
    }
  }
)

router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, password } = req.body

    if (!name || !password) {
      throw new ApiError('Missing credentials', 401)
    }

    try {
      const user = await prisma.user.findFirst({ where: { name } })

      if (!user) {
        throw ApiError.notFound('User not found')
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        throw new ApiError('Invalid credentials', 401)
      }

      const accessToken = jwtSign(user.id)

      const refreshToken = jwtSign(
        user.id,
        process.env.REFRESH_TOKEN_SECRET,
        '30d'
      )
      const thirtyDays = 30 * 24 * 60 * 60 * 1000
      const expiresAt = new Date(Date.now() + thirtyDays)

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      })

      res.cookie('refreshToken', refreshToken, {
        path: process.env.NODE_ENV === 'prod' ? '/refresh-token' : '/',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'prod' ? 'none' : 'strict',
        secure: process.env.NODE_ENV === 'prod',
        maxAge: thirtyDays,
      })

      res.json({ user: { id: user.id, name: user.name }, accessToken })
    } catch (err) {
      next(err)
    }
  }
)

router.post(
  '/refresh-token',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const refreshToken: string = req.cookies.refreshToken

    if (!refreshToken) {
      throw new ApiError('Refresh token required', 401)
    }

    try {
      const storedToken = await prisma.refreshToken.findFirst({
        where: { token: refreshToken },
      })

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new ApiError('Invalid or expired refresh token', 401)
      }

      const userId = storedToken.userId

      const user = await prisma.user.findFirst({
        where: { id: userId },
      })

      if (!user) {
        throw ApiError.notFound('User not found')
      }

      const accessToken = jwtSign(userId)

      res.json({ user: { id: user.id, name: user.name }, accessToken })
    } catch (err) {
      next(err)
    }
  }
)

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    res.clearCookie('refreshToken')
  }

  res.status(200).json({ message: 'Logged out successfully' })
})

export default router
