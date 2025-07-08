import express from 'express';
import * as menuController from '../controllers/Store/menu.js';
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess
} from '../middlewares/auth/index.js';

const router = express.Router();

// =============================================================================
// 菜單路由 - 支援多菜單邏輯
// =============================================================================

// 🆕 獲取店鋪的所有菜單
router.get('/brands/:brandId/:storeId/menus',
  menuController.getAllStoreMenus
);

// 獲取店鋪菜單（單個，向後兼容）
router.get('/brands/:brandId/:storeId/menu',
  menuController.getStoreMenu
);

// 🆕 根據ID獲取特定菜單
router.get('/brands/:brandId/:storeId/menu/:menuId',
  menuController.getMenuById
);

// 創建菜單（系統級和品牌級）
router.post('/brands/:brandId/:storeId/menu',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.createMenu
);

// 更新菜單（系統級和品牌級）
router.put('/brands/:brandId/:storeId/menu/:menuId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.updateMenu
);

// 刪除菜單（系統級和品牌級）
router.delete('/brands/:brandId/:storeId/menu/:menuId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.deleteMenu
);

// 切換菜單啟用狀態
router.put('/brands/:brandId/:storeId/menu/:menuId/toggle',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.toggleMenuActive
);

// 切換菜單項目
router.put('/brands/:brandId/:storeId/menu/:menuId/toggle-item',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.toggleMenuItem
);


// 添加商品到菜單
router.post('/brands/:brandId/:storeId/menu/:menuId/item',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.addItemToMenu
);

// 從菜單移除商品
router.delete('/brands/:brandId/:storeId/menu/:menuId/item',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin', 'primary_store_admin', 'store_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.removeItemFromMenu
);

export default router;
