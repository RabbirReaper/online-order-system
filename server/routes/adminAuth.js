import express from 'express'
import {
  adminLogin,
  adminLogout,
  changeAdminPassword,
  checkAdminStatus,
  getProfile,
  updateProfile,
} from '../controllers/User/adminAuth.js'
import { authenticate } from '../middlewares/auth/index.js'

const router = express.Router()

// 管理員登入（公開）
router.post('/login', adminLogin)

// 管理員登出（需要認證）
router.post('/logout', authenticate('admin'), adminLogout)

// 檢查管理員登入狀態（公開）
router.get('/check-status', checkAdminStatus)

// 修改管理員密碼（需要認證）
router.post('/change-password', authenticate('admin'), changeAdminPassword)

// 獲取當前管理員資料（需要認證）
router.get('/profile', authenticate('admin'), getProfile)

router.put('/profile', authenticate('admin'), updateProfile)

export default router
