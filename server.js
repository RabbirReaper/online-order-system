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

// Trust proxy for Cloud Run
app.set('trust proxy', 1)

// Session configuration with MongoDB store
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    rolling: true, // 每次請求都延長 session，只要使用者持續活動就不會過期
    store: MongoStore.create({
      mongoUrl: process.env.MongoDB_url,
      touchAfter: 1 * 3600, // 1 小時內不更新 MongoDB session，減少資料庫寫入（cookie 仍會延長）
      crypto: {
        secret: process.env.SESSION_SECRET || 'your-secret-key',
      },
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: true, // Cloud Run 必須使用 https
      maxAge: 2 * 60 * 60 * 1000, // 預設 2 小時（不記住我的情況），會在登入時根據 rememberMe 動態調整
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
