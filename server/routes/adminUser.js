import express from 'express';
import * as adminUserController from '../controllers/User/adminUser.js';
import {
  authenticate,
  requireRole,
  requireBrandAccess
} from '../middlewares/auth/index.js';

const router = express.Router();

// 確保所有路由都需要管理員認證
router.use(authenticate('admin'));

// 獲取特定品牌下的所有用戶
router.get('/brands/:brandId/users',
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  adminUserController.getAllUsers
);

// 獲取指定日期範圍內新加入的用戶
router.get('/brands/:brandId/users/new-in-range',
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  adminUserController.getNewUsersInRange
);

// 獲取特定用戶詳情
router.get('/brands/:brandId/users/:id',
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  adminUserController.getUserById
);

// 切換用戶啟用狀態
router.patch('/brands/:brandId/users/:id/status',
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  adminUserController.toggleUserStatus
);

export default router;
