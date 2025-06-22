/**
 * Bundle 服務入口文件
 * 匯總並導出所有 Bundle 相關服務
 */

// 導入 Bundle 相關服務
import * as bundleService from './bundleService.js';

// 導出所有 Bundle 服務
export const bundle = bundleService;

// 簡單導出，方便直接調用
export const {
  getAllBundles,
  getBundleById,
  createBundle,
  updateBundle,
  deleteBundle,
  getAvailableBundles,
  checkPurchaseLimit,
  autoUpdateBundleStatus,
  validateBundlePurchase
} = bundleService;
