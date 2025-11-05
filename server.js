import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import mongoose from 'mongoose'
import session from 'express-session'
import { fileURLToPath } from 'url'
import apiRoutes from './server/routes/index.js'
import webhookRoutes from './server/routes/webhooks.js'

dotenv.config()
const app = express()
const port = process.env.PORT || 80

// CORS 設定 (需要在所有路由之前)
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)

// ⚠️ 重要: Webhook 路由必須在 express.json() 之前註冊
// 因為簽名驗證需要原始的 request body (Buffer)
// 如果先經過 express.json() 解析,會變成物件,導致簽名驗證失敗
app.use('/api/delivery/webhooks', webhookRoutes)

// 全局 JSON 和 URL 編碼解析中間件
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ limit: '2mb', extended: true }))

app.use(express.static('dist'))

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 30 * 60 * 1000, // 30 分鐘後過期
      sameSite: 'strict',
      httpOnly: true,
    },
  }),
)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

mongoose
  .connect(`${process.env.MongoDB_url}`)
  .then(() => {
    console.log('MongoDB connected')
  })
  .catch((err) => {
    console.log('MongoDB connection failed')
    console.log(err)
  })

app.use('/api', apiRoutes)

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'))
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
