import express from 'express';
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus
} from '../controllers/User/admin.js';
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requirePermission
} from '../middlewares/auth/index.js';

const router = express.Router();

// 所有管理員路由都需要驗證
router.use(authenticate('admin'));

// 獲取所有管理員（特殊情況：不帶brandId參數）
router.get('/', requireRole('boss'), getAllAdmins);

// 獲取品牌下的管理員
router.get('/brands/:brandId', requireRole('boss', 'brand_admin'), requireBrandAccess, getAllAdmins);

// 獲取單個管理員
router.get('/:id', requireRole('boss', 'brand_admin', 'store_admin'), getAdminById);

// 創建管理員（特殊情況：不帶brandId參數，僅限boss）
router.post('/', requireRole('boss'), createAdmin);

// 創建品牌下的管理員
router.post('/brands/:brandId', requireRole('boss', 'brand_admin'), requireBrandAccess, requirePermission('manage_staff'), createAdmin);

// 更新管理員（僅限boss）
router.put('/:id', requireRole('boss'), updateAdmin);

// 刪除管理員（僅限boss）
router.delete('/:id', requireRole('boss'), deleteAdmin);

// 切換管理員狀態
router.patch('/:id/status', requireRole('boss', 'brand_admin'), requirePermission('manage_staff'), toggleAdminStatus);

// 更新管理員權限（品牌管理員可以修改所屬店鋪管理員的權限）
// router.put('/brands/:brandId/:id/permissions', requireRole('boss', 'brand_admin'), requireBrandAccess, requirePermission('manage_staff'), updateAdminPermissions);

export default router;
