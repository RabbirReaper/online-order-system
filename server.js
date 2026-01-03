import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import mongoose from 'mongoose'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { fileURLToPath } from 'url'
import apiRoutes from './server/routes/index.js'
import webhookRoutes from './server/routes/webhooks.js'
import { dynamicMetaTags } from './server/middlewares/dynamicMetaTags.js'

dotenv.config()
const app = express()
const port = process.env.PORT || 80

// CORS 設定
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)

app.use('/api/delivery/webhooks', webhookRoutes)
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ limit: '2mb', extended: true }))
app.use(express.static('dist'))

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
      mongoUrl: process.env.MongoDB_url,
      touchAfter: 24 * 3600, // 24 小時內不更新 session
      crypto: {
        secret: process.env.SESSION_SECRET || 'your-secret-key',
      },
    }),
    cookie: {
      maxAge: 60 * 60 * 1000, // 1 小時
      sameSite: 'strict',
      httpOnly: true,
      secure: true,
    },
  }),
)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const options = {
  maxPoolSize: 20,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  bufferTimeoutMS: 30000,
  retryWrites: true,
  retryReads: true,
}

// 🔧 監聽連接錯誤
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected! Will attempt to reconnect...')
})

// 等 MongoDB 連好再啟動伺服器
async function startServer() {
  try {
    await mongoose.connect(`${process.env.MongoDB_url}`, options)
    console.log('✅ MongoDB connected successfully')

    // MongoDB 連接成功後，才註冊路由和啟動伺服器
    app.use('/api', apiRoutes)

    // 動態 Meta Tags 中間件（必須在靜態文件路由之前）
    app.get(/^\/(?!api).*/, dynamicMetaTags, (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'))
    })

    app.listen(port, () => {
      console.log(`✅ Server listening at http://localhost:${port}`)
    })
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err)
    console.error('❌ Server not started. Exiting...')
    process.exit(1) // 🔧 連接失敗就退出，讓 Cloud Run 重啟
  }
}

startServer()
