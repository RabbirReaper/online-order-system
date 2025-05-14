import express from 'express';
import * as userController from '../controllers/User/user.js';
import * as adminController from '../controllers/User/admin.js';
import { authMiddleware } from '../middlewares/auth/authentication.js';
import { permissionMiddleware, roleMiddleware, brandMiddleware } from '../middlewares/permission.js';
import { userAuthMiddleware } from '../middlewares/userAuth.js';

const router = express.Router();

// 用戶註冊和認證路由
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// 用戶資料管理路由
router.get('/profile', userAuthMiddleware, userController.getUserProfile);
router.put('/profile', userAuthMiddleware, userController.updateUserProfile);
router.post('/profile/password', userAuthMiddleware, userController.changePassword);
router.post('/profile/address', userAuthMiddleware, userController.addAddress);
router.put('/profile/address/:addressId', userAuthMiddleware, userController.updateAddress);
router.delete('/profile/address/:addressId', userAuthMiddleware, userController.deleteAddress);

// 管理員管理路由 (後台) - 老闆管理所有管理員，品牌管理員只管理所屬品牌的店鋪管理員
router.get('/admin', authMiddleware, roleMiddleware(['boss', 'brand_admin']), adminController.getAllAdmins);
router.get('/admin/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), adminController.getAdminById);
router.put('/admin/:id', authMiddleware, roleMiddleware(['boss']), adminController.updateAdmin); // 只有老闆可以更新管理員基本資料
router.put('/admin/:id/status', authMiddleware, roleMiddleware(['boss']), adminController.toggleAdminStatus); // 只有老闆可以停用管理員
router.put('/admin/:id/permissions', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, adminController.updateAdminPermissions); // 品牌管理員可以修改所屬店鋪管理員的權限

// 用戶管理路由 (後台)
router.get('/all', authMiddleware, permissionMiddleware(['view_reports']), userController.getAllUsers);
router.get('/:id', authMiddleware, permissionMiddleware(['view_reports']), userController.getUserById);
router.put('/:id/status', authMiddleware, permissionMiddleware(['edit_backend']), userController.toggleUserStatus);

export default router;
