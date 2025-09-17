import express from 'express'
import * as menuController from '../controllers/Store/menu.js'
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
} from '../middlewares/auth/index.js'

const router = express.Router()

// =============================================================================
// 菜單路由 - 支援多菜單邏輯
// =============================================================================

// 🆕 獲取店鋪的所有菜單
router.get('/brands/:brandId/:storeId/menus', menuController.getAllStoreMenus)

// 🆕 根據ID獲取特定菜單
router.get('/brands/:brandId/:storeId/menu/:menuId', menuController.getMenuById)

// 🆕 根據ID獲取菜單且完整填充商品與選項 - 用於外送平台上傳Menu
router.get('/brands/:brandId/:storeId/menu/:menuId/full-populate', menuController.getMenuAllPopulateById)

// 創建菜單（系統級和品牌級）
router.post(
  '/brands/:brandId/:storeId/menu',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.createMenu,
)

// 更新菜單（系統級和品牌級）
router.put(
  '/brands/:brandId/:storeId/menu/:menuId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.updateMenu,
)

// 刪除菜單（系統級和品牌級）
router.delete(
  '/brands/:brandId/:storeId/menu/:menuId',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  requireStoreAccess,
  menuController.deleteMenu,
)

export default router
