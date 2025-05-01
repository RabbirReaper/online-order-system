import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import mongoose from 'mongoose'
import session from 'express-session'
import { fileURLToPath } from 'url';
import apiRoutes from './server/routes/index.js'

dotenv.config()
const app = express()
const port = process.env.PORT || 8700

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(cors())
app.use(express.static('dist'))

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000 // 30 分鐘後過期
  }
}));



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



mongoose.connect(`${process.env.MongoDB_url}`)
  .then(() => {
    console.log("MongoDB connected")
  })
  .catch((err) => {
    console.log("MongoDB connection failed")
    console.log(err)
  })


app.use('/api', apiRoutes)


app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'))
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
