/**
 * 店鋪服務入口文件
 * 匯總並導出所有店鋪相關服務
 */

// 導入店鋪相關服務
import * as storeManagementService from './storeManagement.js';
import * as menuService from './menuService.js';
import * as brandService from './brandService.js';

// 導出所有店鋪服務
export const management = storeManagementService;
export const menu = menuService;
export const brand = brandService;

// 簡單導出，方便直接調用
export const {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  toggleStoreActive,
  getStoreBusinessHours,
  updateStoreBusinessHours
} = storeManagementService;

// 更新菜單服務導出 - 支援多菜單邏輯
export const {
  getAllStoreMenus,        // 🆕 獲取店鋪的所有菜單
  getStoreMenu,           // 獲取店鋪菜單（向後兼容）
  getMenuById,            // 🆕 根據ID獲取特定菜單
  createMenu,
  updateMenu,
  deleteMenu,
  toggleMenuActive,       // 🆕 切換菜單啟用狀態
  toggleMenuItem,
  addItemToMenu,          // 🆕 添加商品到菜單
  removeItemFromMenu      // 🆕 從菜單移除商品
} = menuService;

export const {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandStores
} = brandService;
