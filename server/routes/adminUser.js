import express from 'express';
import * as adminUserController from '../controllers/User/adminUser.js';
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requirePermission
} from '../middlewares/auth/index.js';

const router = express.Router();

// 確保所有路由都需要管理員認證
router.use(authenticate('admin'));

// 獲取特定品牌下的所有用戶
router.get('/brands/:brandId/users',
  requireRole('boss', 'brand_admin', 'store_admin'),
  requireBrandAccess,
  requirePermission('view_reports'),
  adminUserController.getAllUsers
);

// 獲取特定用戶詳情
router.get('/brands/:brandId/users/:id',
  requireRole('boss', 'brand_admin', 'store_admin'),
  requireBrandAccess,
  requirePermission('view_reports'),
  adminUserController.getUserById
);

// 切換用戶啟用狀態
router.patch('/brands/:brandId/users/:id/status',
  requireRole('boss', 'brand_admin'),
  requireBrandAccess,
  requirePermission('edit_backend'),
  adminUserController.toggleUserStatus
);

export default router;
