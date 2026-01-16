/**
 * Uber Eats OAuth 路由
 * 處理 Authorization Code Flow 的所有端點
 */

import express from 'express'
import * as ubereatsOAuthController from '../controllers/Delivery/ubereatsOAuth.js'
import {
  authenticate,
  requireRole,
  requireBrandAccess,
  requireStoreAccess,
} from '../middlewares/auth/index.js'

const router = express.Router()

// ========================================
// 🔐 OAuth 流程端點
// ========================================

/**
 * 發起 OAuth 授權
 * GET /api/delivery/ubereats/oauth/authorize?brandId=xxx&storeId=xxx
 *
 * 功能：生成授權 URL 並重新導向到 Uber 授權頁面
 * 權限：需要登入的管理員（品牌或店舖管理員）
 *
 * Query 參數：
 * - brandId: 品牌 ID
 * - storeId: 店舖 ID
 */
router.get(
  '/authorize',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
  ),
  // 注意：這裡不加 requireBrandAccess 和 requireStoreAccess
  // 因為在 query string 中，middleware 無法正確處理
  // 授權檢查會在 controller 中進行
  ubereatsOAuthController.initiateOAuth,
)

/**
 * OAuth Callback
 * GET /api/delivery/ubereats/oauth/callback?code=xxx&state=xxx
 *
 * 功能：處理 Uber 的 callback，換取 tokens 並更新資料
 * 權限：無需登入驗證（state 參數提供 CSRF 防護）
 *
 * 安全性說明：
 * - state 參數在 initiate 階段已存入 session，綁定了 brandId 和 storeId
 * - callback 會驗證 state 是否匹配，確保請求合法性
 * - 不能使用 authenticate 中間件，因為 popup 視窗沒有主視窗的 session
 *
 * Query 參數：
 * - code: 授權碼（Uber 提供）
 * - state: CSRF 防護參數
 * - error: 錯誤代碼（如果用戶拒絕授權）
 * - error_description: 錯誤描述
 */
router.get(
  '/callback',
  // 注意：不使用 authenticate 中間件
  // OAuth callback 是從 Uber 伺服器直接重定向過來的，無法攜帶用戶 session
  // 安全性由 state 參數驗證保證
  ubereatsOAuthController.handleCallback,
)

// ========================================
// 📊 授權狀態查詢
// ========================================

/**
 * 查詢 OAuth 授權狀態
 * GET /api/delivery/ubereats/oauth/status/:brandId/:storeId
 *
 * 功能：查詢店舖的 OAuth 授權狀態和 discovered stores
 * 權限：需要品牌或店舖存取權限
 *
 * 回應：
 * {
 *   success: true,
 *   data: {
 *     isAuthorized: boolean,
 *     authorizedAt: Date,
 *     discoveredStores: Array,
 *     hasExpired: boolean
 *   }
 * }
 */
router.get(
  '/status/:brandId/:storeId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
    'store_admin',
  ),
  requireBrandAccess,
  requireStoreAccess,
  ubereatsOAuthController.getOAuthStatus,
)

// ========================================
// 🗑️ 撤銷授權
// ========================================

/**
 * 撤銷 OAuth 授權（解除連接）
 * DELETE /api/delivery/ubereats/oauth/revoke/:brandId/:storeId
 *
 * 功能：清除 OAuth 資料，解除與 Uber Eats 的連接
 * 權限：需要高級權限（primary_store_admin 以上）
 */
router.delete(
  '/revoke/:brandId/:storeId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
  ),
  requireBrandAccess,
  requireStoreAccess,
  ubereatsOAuthController.revokeOAuth,
)

// ========================================
// 🏪 店舖選擇
// ========================================

/**
 * 更新選擇的店舖 ID
 * PATCH /api/delivery/ubereats/oauth/select-store/:brandId/:storeId
 *
 * 功能：從 discovered stores 中選擇要整合的店舖
 * 權限：需要高級權限（primary_store_admin 以上）
 *
 * Body:
 * {
 *   platformStoreId: string  // Uber Eats 店舖 ID
 * }
 */
router.patch(
  '/select-store/:brandId/:storeId',
  authenticate('admin'),
  requireRole(
    'primary_system_admin',
    'system_admin',
    'primary_brand_admin',
    'brand_admin',
    'primary_store_admin',
  ),
  requireBrandAccess,
  requireStoreAccess,
  ubereatsOAuthController.updateSelectedStore,
)

export default router
