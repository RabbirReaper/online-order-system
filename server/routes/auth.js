import express from 'express';
import { authLogin, createAdmin, logout, changePassword, checkAdminLoginStatus, checkUserLoginStatus } from '../controllers/User/auth.js';
import { authMiddleware } from '../middlewares/auth.js';
import { permissionMiddleware } from '../middlewares/permission.js';

const router = express.Router();

// 保留管理員登入功能
router.post('/login', authLogin);

// 保留登出功能
router.post('/logout', logout);

// 檢查登入狀態
router.get('/check-admin-status', checkAdminLoginStatus);
// router.get('/check-user-status', checkUserLoginStatus);

// 暫時不需要的功能註解掉
/*
// 建立管理員帳號 (需要高級權限)
router.post('/admin', authMiddleware, permissionMiddleware(['manage_staff']), createAdmin);

// 修改密碼
router.post('/change-password', authMiddleware, changePassword);
*/

export default router;
