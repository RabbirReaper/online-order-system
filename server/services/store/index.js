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

export const {
  getStoreMenu,
  createMenu,
  updateMenu,
  deleteMenu,
  toggleMenuItem,
  updateCategoryOrder,
  updateDishOrder
} = menuService;

export const {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandStores
} = brandService;
