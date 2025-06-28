/**
 * Bundle 服務入口文件
 * 匯總並導出所有 Bundle 相關服務
 */

// 導入 Bundle 相關服務
import * as bundleService from './bundleService.js';
import * as bundleInstanceService from './bundleInstance.js';

// 導出所有 Bundle 服務
export const bundle = bundleService;
export const bundleInstance = bundleInstanceService;

// =============================================================================
// Bundle 模板服務導出
// =============================================================================
export const {
  getAllBundles,
  getBundleById,
  createBundle,
  updateBundle,
  deleteBundle,
  getAvailableBundles,
} = bundleService;

// =============================================================================
// Bundle 實例服務導出
// =============================================================================
export const {
  getAllInstances,
  getInstanceById,
  createInstance,
  updateInstance,
  deleteInstance,
  getInstancesByTemplate
} = bundleInstanceService;
