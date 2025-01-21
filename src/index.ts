import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authMiddleware from './middlewares/authMiddleware'
import errorHandler from './middlewares/errorHandler'
import authRoutes from './routes/authRoutes'
import directoryRoutes from './routes/directoryRoutes'
import fileRoutes from './routes/fileRoutes'
import postRoutes from './routes/postRoutes'
import userRoutes from './routes/userRoutes'

dotenv.config()

const PORT = process.env.PORT || '3000'
const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN || 'http://localhost:3000'

const app = express()

const corsOptions = {
  origin: FRONTEND_DOMAIN,
  credentials: true,
}
app.use(cors(corsOptions))

app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/', authRoutes)

app.use('/users', authMiddleware, userRoutes)
app.use('/posts', authMiddleware, postRoutes)
app.use('/files', authMiddleware, fileRoutes)
app.use('/directories', authMiddleware, directoryRoutes)

app.use(errorHandler)

export const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app