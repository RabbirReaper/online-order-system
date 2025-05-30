import express from 'express';
import * as userController from '../controllers/User/user.js';
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requirePermission
} from '../middlewares/auth/index.js';

const router = express.Router();

// 用戶個人資料管理（需要用戶認證）
router.get('/brands/:brandId/profile',
  authenticate('user'),
  userController.getUserProfile
);

router.put('/brands/:brandId/profile',
  authenticate('user'),
  userController.updateUserProfile
);

// 地址管理（需要用戶認證）
router.post('/brands/:brandId/addresses',
  authenticate('user'),
  userController.addAddress
);

router.put('/brands/:brandId/addresses/:addressId',
  authenticate('user'),
  userController.updateAddress
);

router.delete('/brands/:brandId/addresses/:addressId',
  authenticate('user'),
  userController.deleteAddress
);

// 用戶管理路由（後台管理員功能）
// 按品牌獲取用戶
router.get('/brands/:brandId/users',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requirePermission('manage_customers'),
  userController.getAllUsers
);

// 獲取特定用戶
router.get('/brands/:brandId/users/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requirePermission('manage_customers'),
  userController.getUserById
);

// 切換用戶狀態
router.patch('/brands/:brandId/users/:id/status',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requirePermission('manage_customers'),
  userController.toggleUserStatus
);

export default router;
