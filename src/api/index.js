// API 主入口

import axios from 'axios'
import { toastSessionExpired } from '@/utils/toast.js'
import router from '@/router'
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
import printerApi from './modules/printer.js' // 新增 列印機管理 API 模組

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

// 請求攔截器，用於在開發環境下記錄 API 請求
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log('API Request:', config.method?.toUpperCase(), config.url)
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 回應攔截器，用於統一處理回應
apiClient.interceptors.response.use(
  (response) => {
    // 只返回實際資料部分，而不是整個回應物件
    return response.data
  },
  (error) => {
    // 統一錯誤處理
    if (error.response && error.response.data) {
      const { status } = error.response
      const errorMessage = error.response.data.message || '請求失敗'

      // 處理 Session 過期 (401 錯誤)
      if (status === 401) {
        // 檢查是否為 session 過期或未登入
        const isSessionExpired =
          errorMessage.includes('未登入') ||
          errorMessage.includes('未授權') ||
          errorMessage.includes('登入')

        if (isSessionExpired) {
          // 顯示 Toast 通知
          toastSessionExpired()

          // 判斷當前路徑是管理員還是用戶
          const currentPath = router.currentRoute.value.path
          const isAdminPath =
            currentPath.includes('/admin/') ||
            currentPath.includes('/boss/') ||
            currentPath.includes('/counter/')

          // 延遲跳轉，確保 Toast 顯示
          setTimeout(() => {
            if (isAdminPath) {
              // 管理員路徑 - 獲取 brandId 並跳轉到對應登入頁
              let brandId = null

              // 嘗試從不同的路徑格式中提取 brandId
              // 格式 1: /admin/:brandId/...
              const adminMatch = currentPath.match(/\/admin\/([^/]+)/)
              // 格式 2: /counter/:brandId/:storeId/...
              const counterMatch = currentPath.match(/\/counter\/([^/]+)/)
              // 格式 3: /boss/ 路徑 (系統管理員)
              const isBossPath = currentPath.includes('/boss/')

              if (counterMatch) {
                brandId = counterMatch[1]
              } else if (adminMatch) {
                brandId = adminMatch[1]
              }

              // 根據提取的 brandId 決定跳轉目標
              if (brandId && brandId !== 'login') {
                router.push({
                  path: `/admin/${brandId}/login`,
                  query: { redirect: currentPath },
                })
              } else if (isBossPath) {
                // Boss 路徑 - 系統管理員登入
                router.push({
                  path: '/boss/login',
                  query: { redirect: currentPath },
                })
              } else {
                // 無法識別的管理員路徑,使用預設管理員登入
                router.push({
                  path: '/admin/login',
                  query: { redirect: currentPath },
                })
              }
            } else {
              // 用戶路徑 - 跳轉到用戶登入頁
              const brandIdMatch = currentPath.match(/\/brands\/([^/]+)/)
              const brandId = brandIdMatch ? brandIdMatch[1] : null

              if (brandId) {
                router.push({
                  path: `/brands/${brandId}/auth/login`,
                  query: { redirect: currentPath },
                })
              } else {
                // 無法識別 brandId，跳轉到首頁或預設登入頁
                router.push('/auth/login')
              }
            }
          }, 500)
        }
      }

      // 處理權限不足 (403 錯誤) - 不跳轉登入頁面
      if (status === 403) {
        console.warn('權限不足:', errorMessage)
        // 403 錯誤由各組件自行處理，不在此統一跳轉
      }

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
  printer: printerApi(apiClient), // 新增 列印機管理 API 實例
  // 導出 axios 實例，方便直接使用
  client: apiClient,
}
