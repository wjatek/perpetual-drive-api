import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import express, { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../prisma/client'

const router = express.Router()

const jwtSign = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'default_secret', {
    expiresIn: '1h',
  })

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
      res.status(401).json({ error: 'Missing credentials' })
      return
    }

    try {
      const user = await prisma.user.findFirst({ where: { name } })

      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }

      const accessToken = jwtSign(user.id)

      const refreshToken = crypto.randomBytes(40).toString('hex')
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
        sameSite: 'none',
        domain: 'onrender.com',
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
      res.status(401).json({ error: 'Refresh token required' })
      return
    }

    try {
      const storedToken = await prisma.refreshToken.findFirst({
        where: { token: refreshToken },
      })

      if (!storedToken || storedToken.expiresAt < new Date()) {
        res.status(401).json({ error: 'Invalid or expired refresh token' })
        return
      }

      const userId = storedToken.userId

      const user = await prisma.user.findFirst({
        where: { id: userId },
      })

      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
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
