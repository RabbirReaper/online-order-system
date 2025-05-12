// server/routes/admin.js
import express from 'express';
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus
} from '../controllers/User/admin.js';
import { authMiddleware } from '../middlewares/auth.js';
import { roleMiddleware, brandMiddleware, permissionMiddleware } from '../middlewares/permission.js';

const router = express.Router();

// 所有管理員路由都需要驗證
router.use(authMiddleware);

// 獲取所有管理員（boss不需要brandMiddleware，其他角色需要）
router.get('/', roleMiddleware(['boss', 'brand_admin']), brandMiddleware, getAllAdmins);

// 獲取單個管理員（所有角色都可以，但非boss需要brandMiddleware驗證）
router.get('/:id', roleMiddleware(['boss', 'brand_admin', 'store_admin']), brandMiddleware, getAdminById);

// 創建管理員（boss和有manage_staff權限的都可以）
router.post('/', roleMiddleware(['boss', 'brand_admin', 'store_admin']), brandMiddleware, permissionMiddleware(['manage_staff']), createAdmin);

// 更新管理員（boss和有manage_staff權限的都可以）
router.put('/:id', roleMiddleware(['boss', 'brand_admin', 'store_admin']), brandMiddleware, permissionMiddleware(['manage_staff']), updateAdmin);

// 刪除管理員（只有boss可以）
router.delete('/:id', roleMiddleware(['boss']), deleteAdmin);

// 切換管理員狀態（boss和有manage_staff權限的都可以）
router.patch('/:id/status', roleMiddleware(['boss', 'brand_admin', 'store_admin']), brandMiddleware, permissionMiddleware(['manage_staff']), toggleAdminStatus);

export default router;
