import express from 'express';
import {
  authLogin,
  logout,
  changePassword,
  checkAdminLoginStatus,
  checkUserLoginStatus
} from '../controllers/User/auth.js';
import {
  authenticate,
  requireRole,
  requirePermission
} from '../middlewares/auth/index.js';

const router = express.Router();

// 登入路由（公開）
router.post('/login', authLogin);

// 登出路由（需要認證）
router.post('/logout', logout);

// 檢查登入狀態（公開）
router.get('/check-admin-status', checkAdminLoginStatus);
router.get('/check-user-status', checkUserLoginStatus);

// 修改密碼（需要認證）
router.post('/change-password', authenticate('admin'), changePassword);

export default router;
