import express from 'express';
import { authLogin, createAdmin, logout, changePassword } from '../controllers/User/auth.js';
import { authMiddleware } from '../middlewares/auth.js';
import { permissionMiddleware } from '../middlewares/permission.js';

const router = express.Router();

// 管理員登入
router.post('/login', authLogin);

// 建立管理員帳號 (需要高級權限)
router.post('/admin', authMiddleware, permissionMiddleware(['manage_staff']), createAdmin);

// 登出
router.post('/logout', logout);

// 修改密碼
router.post('/change-password', authMiddleware, changePassword);

export default router;
