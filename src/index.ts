import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/authRoutes'
import postRoutes from './routes/postRoutes'
import userRoutes from './routes/userRoutes'
import authMiddleware from './middlewares/authMiddleware'
import bodyParser from 'body-parser'

dotenv.config()

const PORT = process.env.PORT || '3000'

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/users', authMiddleware, userRoutes)
app.use('/posts', authMiddleware, postRoutes)
app.use('/', authRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
