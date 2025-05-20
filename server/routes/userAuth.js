import express from 'express';
import {
  register,
  login,
  logout,
  sendVerificationCode,
  verifyCode,
  forgotPassword,
  resetPassword,
  changePassword,
  checkUserStatus
} from '../controllers/User/userAuth.js';
import {
  authenticate
} from '../middlewares/auth/index.js';

const router = express.Router();

// 用戶註冊相關（公開）
router.post('/brands/:brandId/send-verification', sendVerificationCode);
router.post('/brands/:brandId/verify-code', verifyCode);
router.post('/brands/:brandId/register', register);

// 用戶登入登出（公開）
router.post('/brands/:brandId/login', login);
router.post('/brands/:brandId/logout', authenticate('user'), logout);

// 忘記密碼流程（公開）
router.post('/brands/:brandId/forgot-password', forgotPassword);
router.post('/brands/:brandId/reset-password', resetPassword);

// 修改密碼（需要認證）
router.post('/brands/:brandId/change-password', authenticate('user'), changePassword);

// 檢查用戶登入狀態（公開）
router.get('/brands/:brandId/check-status', checkUserStatus);

export default router;
