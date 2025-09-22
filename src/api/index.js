// API 主入口

import axios from 'axios'
import adminAuthApi from './modules/adminAuth.js'
import userAuthApi from './modules/userAuth.js'
import authApi from './modules/auth.js'
import storeApi from './modules/store.js'
import brandApi from './modules/brand.js'
import inventoryApi from './modules/inventory.js'
import menuApi from './modules/menu.js'
import dishApi from './modules/dish.js'
import imageApi from './modules/image.js'
import userApi from './modules/user.js'
import adminUserApi from './modules/adminUser.js'
import orderCustomerApi from './modules/orderCustomer.js'
import orderAdminApi from './modules/orderAdmin.js'
import promotionApi from './modules/promotion.js'
import pointRulesApi from './modules/pointRules.js'
import adminApi from './modules/admin.js'
import bundleApi from './modules/bundle.js' // 新增 Bundle API 模組
import cashFlowApi from './modules/cashFlow.js' // 新增 現金流記錄 API 模組
import cashFlowCategoryApi from './modules/cashFlowCategory.js' // 新增 現金流分類 API 模組
import platformStoreApi from './modules/platformStore.js' // 新增 平台店鋪配置 API 模組
import deliveryApi from './modules/delivery.js' // 新增 外送平台管理 API 模組

// 獲取 API 基礎 URL，從環境變數或預設值
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 創建基本 axios 實例，用於整個應用程式
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 確保跨域請求能攜帶cookie
})

// 回應攔截器，用於統一處理回應
apiClient.interceptors.response.use(
  (response) => {
    // 只返回實際資料部分，而不是整個回應物件
    return response.data
  },
  (error) => {
    // 統一錯誤處理
    if (error.response && error.response.data) {
      // 處理後端返回的錯誤信息
      const errorMessage = error.response.data.message || '請求失敗'
      console.error('API 請求錯誤:', errorMessage)
    } else {
      console.error('連接服務器失敗:', error.message)
    }
    return Promise.reject(error)
  },
)

// 導出所有 API 模組
export default {
  adminAuth: adminAuthApi(apiClient),
  userAuth: userAuthApi(apiClient),
  auth: authApi(apiClient), // 向後兼容
  store: storeApi(apiClient),
  brand: brandApi(apiClient),
  inventory: inventoryApi(apiClient),
  menu: menuApi(apiClient),
  dish: dishApi(apiClient),
  image: imageApi(apiClient),
  user: userApi(apiClient),
  adminUser: adminUserApi(apiClient),
  // 訂單 API 按權限分離
  orderCustomer: orderCustomerApi(apiClient),
  orderAdmin: orderAdminApi(apiClient),
  promotion: promotionApi(apiClient),
  pointRules: pointRulesApi(apiClient),
  admin: adminApi(apiClient),
  bundle: bundleApi(apiClient), // 新增 Bundle API 實例
  cashFlow: cashFlowApi(apiClient), // 新增 現金流記錄 API 實例
  cashFlowCategory: cashFlowCategoryApi(apiClient), // 新增 現金流分類 API 實例
  platformStore: platformStoreApi(apiClient), // 新增 平台店鋪配置 API 實例
  delivery: deliveryApi(apiClient), // 新增 外送平台管理 API 實例
  // 導出 axios 實例，方便直接使用
  client: apiClient,
}
