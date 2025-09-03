/**
 * 庫存服務入口文件
 * 匯總並導出所有庫存相關服務
 */

// 導入庫存相關服務
import * as stockManagement from './stockManagement.js'
import * as stockStats from './stockStats.js'

// 導出所有庫存服務
export const management = stockManagement
export const stats = stockStats

// 簡單導出，方便直接調用
export const {
  getStoreInventory,
  getInventoryItem,
  getInventoryItemByDishTemplate,
  createInventory,
  updateInventory,
  reduceStock,
  reduceInventoryForOrder,
  addStock,
  setAvailableStock,
  processDamage,
  restoreInventoryForCancelledOrder,
  bulkUpdateInventory,
  toggleSoldOut,
  initializeDishInventory,
} = stockManagement

export const {
  getInventoryLogs,
  getItemInventoryStats,
  getInventoryHealthReport,
  getStockChangeSummary,
} = stockStats
