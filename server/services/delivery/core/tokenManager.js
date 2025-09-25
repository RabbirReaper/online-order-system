/**
 * Token Manager Service
 * 自動管理外送平台的認證 token
 * 根據平台名稱自動選擇對應的認證服務
 */

import PlatformToken from '../../../models/DeliverPlatform/platformToken.js'
import { AppError } from '../../../middlewares/error.js'

// 導入各平台的認證服務
import * as ubereatsAuth from '../platforms/ubereats/ubereatsAuth.js'
import * as foodpandaAuth from '../platforms/foodpanda/foodpandaAuth.js'

// 防止併發請求同時刷新 token 的鎖
const tokenRefreshLocks = new Map()

// ========================================
// 🎯 平台認證服務映射
// ========================================

/**
 * 根據平台名稱獲取對應的認證函數
 */
const getPlatformAuthFunction = (platform) => {
  const authFunctions = {
    ubereats: ubereatsAuth.getAccessToken,
    foodpanda: foodpandaAuth.getAccessToken,
  }

  const authFunction = authFunctions[platform]

  if (!authFunction) {
    throw new AppError(`不支援的平台: ${platform}`, 400)
  }

  return authFunction
}

// ========================================
// 🔧 輔助函數
// ========================================

/**
 * 檢查 token 是否即將過期（剩餘時間小於 5 分鐘）
 */
const isTokenExpiringSoon = (expiresAt) => {
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
  return expiresAt <= fiveMinutesFromNow
}

/**
 * 計算 token 過期時間
 */
const calculateExpiresAt = (expiresIn) => {
  return new Date(Date.now() + expiresIn * 1000)
}

// ========================================
// 🔐 核心 Token 獲取邏輯
// ========================================

/**
 * 獲取有效的 token（自動根據平台選擇認證服務）
 */
const getValidToken = async (platform) => {
  // 如果正在刷新，等待完成
  if (tokenRefreshLocks.has(platform)) {
    await tokenRefreshLocks.get(platform)
  }

  // 檢查現有 token
  let tokenDoc = await PlatformToken.findOne({ platform })

  if (tokenDoc && !isTokenExpiringSoon(tokenDoc.expiresAt)) {
    console.log(`✓ 使用現有的 ${platform} token`)
    return tokenDoc.accessToken
  }

  // 創建刷新鎖
  let resolveLock
  const lockPromise = new Promise((resolve) => {
    resolveLock = resolve
  })
  tokenRefreshLocks.set(platform, lockPromise)

  try {
    // 再次檢查（可能其他請求已刷新）
    tokenDoc = await PlatformToken.findOne({ platform })
    if (tokenDoc && !isTokenExpiringSoon(tokenDoc.expiresAt)) {
      console.log(`✓ ${platform} token 已被其他請求刷新`)
      return tokenDoc.accessToken
    }

    // 🎯 根據平台自動選擇認證函數
    const fetchTokenFunction = getPlatformAuthFunction(platform)

    const newTokenData = await fetchTokenFunction()

    if (!newTokenData || !newTokenData.access_token) {
      throw new AppError(`獲取 ${platform} token 失敗：無效的回應`, 500)
    }

    // 儲存到資料庫（統一格式）
    const expiresAt = calculateExpiresAt(newTokenData.expires_in)
    tokenDoc = await PlatformToken.findOneAndUpdate(
      { platform },
      {
        accessToken: newTokenData.access_token,
        refreshToken: newTokenData.refresh_token,
        expiresAt,
      },
      { upsert: true, new: true },
    )

    return tokenDoc.accessToken
  } catch (error) {
    console.error(`❌ 無法獲取 ${platform} token:`, error.message)
    throw new AppError(`無法獲取 ${platform} token: ${error.message}`, 500)
  } finally {
    resolveLock()
    tokenRefreshLocks.delete(platform)
  }
}

// ========================================
// 🚀 對外 API
// ========================================

/**
 * 核心函數：自動處理 token 並執行業務邏輯
 *
 * @param {String} platform - 平台名稱 ('ubereats' | 'foodpanda')
 * @param {Function} callback - 業務邏輯函數（第一個參數會自動注入 token）
 * @param {...any} args - 傳遞給 callback 的其他參數
 * @returns {Promise<any>} callback 的返回值
 *
 * @example
 * const orders = await withPlatformToken(
 *   'ubereats',
 *   async (token, storeId) => {
 *     return await ubereatsOrders.getOrders(token, storeId)
 *   },
 *   'store-123'
 * )
 */
export const withPlatformToken = async (platform, callback, ...args) => {
  try {
    // 自動獲取有效的 token（內部會根據 platform 選擇認證服務）
    const token = await getValidToken(platform)

    // 執行業務邏輯，token 自動作為第一個參數
    return await callback(token, ...args)
  } catch (error) {
    // 如果是 401 錯誤，token 可能實際已失效，刪除並重試
    if (error.response?.status === 401) {
      console.log(`⚠️ ${platform} token 認證失敗，刪除舊 token 並重新獲取...`)

      await PlatformToken.findOneAndDelete({ platform })
      const newToken = await getValidToken(platform)

      return await callback(newToken, ...args)
    }

    throw error
  }
}
