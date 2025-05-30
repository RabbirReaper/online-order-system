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
  requireSystemLevel,
  requireBrandAccess,
  requireStoreAccess,
  requirePermission,
  requireMemberManagement,
  requireScopeMatch
} from '../middlewares/auth/index.js';

const router = express.Router();

// 所有管理員路由都需要驗證
router.use(authenticate('admin'));

// 獲取所有管理員 (系統級 - 不帶brandId參數)
router.get('/',
  requireSystemLevel,
  requirePermission('manage_system_admins'),
  getAllAdmins
);

// 獲取品牌下的管理員
router.get('/brands/:brandId',
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin'),
  requireBrandAccess,
  requirePermission('manage_brand_admins', 'manage_system_admins'),
  getAllAdmins
);

// 獲取店鋪下的管理員
router.get('/brands/:brandId/stores/:storeId',
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'primary_store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  requirePermission('manage_store_admins', 'manage_brand_admins', 'manage_system_admins'),
  getAllAdmins
);

// 獲取單個管理員
router.get('/:id',
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'primary_store_admin'),
  requireScopeMatch,
  getAdminById
);

// 創建系統級管理員 (僅限primary_system_admin)
router.post('/',
  requireRole('primary_system_admin'),
  requirePermission('manage_system_admins'),
  createAdmin
);

// 創建品牌級管理員
router.post('/brands/:brandId',
  requireRole('primary_system_admin', 'primary_brand_admin'),
  requireBrandAccess,
  requireMemberManagement,
  requirePermission('manage_brand_admins', 'manage_system_admins'),
  createAdmin
);

// 創建店鋪級管理員
router.post('/brands/:brandId/stores/:storeId',
  requireRole('primary_system_admin', 'primary_brand_admin', 'primary_store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  requireMemberManagement,
  requirePermission('manage_store_admins', 'manage_brand_admins', 'manage_system_admins'),
  createAdmin
);

// 更新管理員 (根據管理員層級限制)
router.put('/:id',
  requireRole('primary_system_admin', 'primary_brand_admin', 'primary_store_admin'),
  requireMemberManagement,
  requireScopeMatch,
  updateAdmin
);

// 刪除管理員 (根據管理員層級限制)
router.delete('/:id',
  requireRole('primary_system_admin', 'primary_brand_admin', 'primary_store_admin'),
  requireMemberManagement,
  requireScopeMatch,
  deleteAdmin
);

// 切換管理員狀態
router.patch('/:id/status',
  requireRole('primary_system_admin', 'primary_brand_admin', 'primary_store_admin'),
  requireMemberManagement,
  requireScopeMatch,
  toggleAdminStatus
);

export default router;
