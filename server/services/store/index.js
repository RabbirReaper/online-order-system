/**
 * 店鋪服務入口文件
 * 匯總並導出所有店鋪相關服務
 */

// 導入店鋪相關服務
import * as storeManagementService from './storeManagement.js'
import * as menuService from './menuService.js'
import * as brandService from './brandService.js'

// 導出所有店鋪服務
export const management = storeManagementService
export const menu = menuService
export const brand = brandService

// 簡單導出，方便直接調用
export const {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  toggleStoreActive,
  getStoreBusinessHours,
  updateStoreBusinessHours,
} = storeManagementService

// 菜單服務導出 - 精簡版，只保留核心 CRUD 操作
export const {
  getAllStoreMenus, // 🆕 獲取店鋪的所有菜單
  getMenuById, // 🆕 根據ID獲取特定菜單
  createMenu, // 創建菜單
  updateMenu, // 更新菜單 (統一更新接口)
  deleteMenu, // 刪除菜單
} = menuService

export const { getAllBrands, getBrandById, createBrand, updateBrand, deleteBrand, getBrandStores } =
  brandService
