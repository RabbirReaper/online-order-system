/**
 * Uber Eats PlatformStore OAuth 服務
 * 負責管理 PlatformStore 的 OAuth 資料
 *
 * 主要功能：
 * - 更新 OAuth 授權資料
 * - 查詢授權狀態
 * - 清除授權資料（解除連接）
 */

import PlatformStore from '../../../../../models/DeliverPlatform/platformStore.js'
import { AppError } from '../../../../../middlewares/error.js'
import { activateStoreIntegration } from './ubereatsOAuth.js'

/**
 * 計算 token 過期時間
 * @param {Number} expiresIn - 過期時間（秒）
 * @returns {Date} 過期時間點
 */
const calculateExpiresAt = (expiresIn) => {
  return new Date(Date.now() + expiresIn * 1000)
}

/**
 * 更新 PlatformStore 的 OAuth 資料
 *
 * @param {String} brandId - 品牌 ID
 * @param {String} storeId - 店舖 ID
 * @param {Object} tokenData - Token 資料（來自 exchangeCodeForToken）
 * @param {String} tokenData.access_token - User access token
 * @param {String} tokenData.refresh_token - Refresh token
 * @param {Number} tokenData.expires_in - 過期時間（秒）
 * @param {Array} discoveredStores - Store Discovery 取得的店舖列表
 * @param {String} discoveredStores[].id - 店舖 ID
 * @param {String} discoveredStores[].name - 店舖名稱
 * @param {Object} discoveredStores[].location - 店舖位置
 * @returns {Promise<Object>} 更新後的 PlatformStore
 *
 * @throws {AppError} PlatformStore 不存在
 */
export const updatePlatformStoreWithOAuth = async (brandId, storeId, tokenData, discoveredStores) => {
  try {
    // 查找對應的 PlatformStore（Uber Eats 平台）
    const platformStore = await PlatformStore.findOne({
      brand: brandId,
      store: storeId,
      platform: 'ubereats',
    })

    if (!platformStore) {
      throw new AppError(
        '找不到對應的 PlatformStore 配置，請先建立 Uber Eats 平台店舖',
        404,
      )
    }

    // 更新 OAuth 資料
    platformStore.oauth = {
      userAccessToken: tokenData.access_token,
      userRefreshToken: tokenData.refresh_token,
      userTokenExpiresAt: calculateExpiresAt(tokenData.expires_in),
      isAuthorized: true,
      authorizedAt: new Date(),
      discoveredStores: discoveredStores,
    }

    // 🆕 自動記錄店舖 ID（如果只有一家店或有 ID）
    if (discoveredStores.length > 0) {
      const firstStore = discoveredStores[0]
      if (firstStore.id) {
        platformStore.platformStoreId = firstStore.id
        console.log(`✅ 自動記錄店舖 ID: ${firstStore.id}`)

        // 🔧 關鍵步驟：調用 POS Provisioning API 激活店舖整合
        // 這是建立真正 POS 連接的必要步驟
        try {
          await activateStoreIntegration(
            tokenData.access_token,
            firstStore.id,
            storeId, // 使用我們系統的 storeId 作為 external_reference_id
          )
          console.log(`✅ 成功激活店舖整合: ${firstStore.id}`)
        } catch (activationError) {
          console.error(`⚠️ 激活店舖整合失敗: ${activationError.message}`)
          // 即使激活失敗，也保存 OAuth 資料，讓用戶可以手動重試
          // 但將 isActive 設為 false
          platformStore.isActive = false
          await platformStore.save()
          throw new AppError(
            `OAuth 授權成功，但無法激活店舖整合: ${activationError.message}。請確認您的 Uber Eats 帳號有此店舖的管理權限。`,
            500,
          )
        }
      } else {
        console.log('⚠️ 警告: Store Discovery API 未返回店舖 ID，platformStoreId 保持不變')
      }
    }

    // 🔧 修復：授權成功後啟用 PlatformStore
    platformStore.isActive = true

    await platformStore.save()

    console.log(`✅ 已更新 PlatformStore OAuth 資料並啟用: ${platformStore._id}`)

    return platformStore
  } catch (error) {
    console.error('❌ 更新 PlatformStore OAuth 資料失敗:', error.message)
    throw error
  }
}

/**
 * 查詢授權狀態
 *
 * @param {String} brandId - 品牌 ID
 * @param {String} storeId - 店舖 ID
 * @returns {Promise<Object>} 授權狀態
 * @returns {Boolean} return.isAuthorized - 是否已授權
 * @returns {Date} return.authorizedAt - 授權時間
 * @returns {Array} return.discoveredStores - 已發現的店舖列表
 * @returns {Boolean} return.hasExpired - Token 是否已過期
 *
 * @throws {AppError} PlatformStore 不存在
 */
export const getOAuthStatus = async (brandId, storeId) => {
  try {
    const platformStore = await PlatformStore.findOne({
      brand: brandId,
      store: storeId,
      platform: 'ubereats',
    })

    if (!platformStore) {
      throw new AppError('找不到對應的 PlatformStore 配置', 404)
    }

    // 如果未授權，回傳基本狀態
    if (!platformStore.oauth || !platformStore.oauth.isAuthorized) {
      return {
        isAuthorized: false,
        authorizedAt: null,
        discoveredStores: [],
        hasExpired: false,
      }
    }

    // 檢查 token 是否過期
    const hasExpired =
      platformStore.oauth.userTokenExpiresAt &&
      new Date() > platformStore.oauth.userTokenExpiresAt

    return {
      isAuthorized: platformStore.oauth.isAuthorized,
      authorizedAt: platformStore.oauth.authorizedAt,
      discoveredStores: platformStore.oauth.discoveredStores || [],
      hasExpired: hasExpired,
      tokenExpiresAt: platformStore.oauth.userTokenExpiresAt,
    }
  } catch (error) {
    console.error('❌ 查詢 OAuth 狀態失敗:', error.message)
    throw error
  }
}

/**
 * 清除 OAuth 資料（解除連接）
 *
 * @param {String} brandId - 品牌 ID
 * @param {String} storeId - 店舖 ID
 * @returns {Promise<Object>} 更新後的 PlatformStore
 *
 * @throws {AppError} PlatformStore 不存在
 */
export const clearOAuthData = async (brandId, storeId) => {
  try {
    const platformStore = await PlatformStore.findOne({
      brand: brandId,
      store: storeId,
      platform: 'ubereats',
    })

    if (!platformStore) {
      throw new AppError('找不到對應的 PlatformStore 配置', 404)
    }

    // 清除 OAuth 資料
    platformStore.oauth = {
      userAccessToken: null,
      userRefreshToken: null,
      userTokenExpiresAt: null,
      isAuthorized: false,
      authorizedAt: null,
      discoveredStores: [],
    }

    // 🔧 修復：解除授權時設置 isActive = false，避免 webhook 找到錯誤的店鋪
    // 這樣可以確保當 platformStoreId 被重複使用時，只有當前授權的店鋪會收到訂單
    platformStore.isActive = false

    await platformStore.save()

    console.log(`✅ 已清除 PlatformStore OAuth 資料並停用: ${platformStore._id}`)

    return platformStore
  } catch (error) {
    console.error('❌ 清除 OAuth 資料失敗:', error.message)
    throw error
  }
}

/**
 * 更新選擇的店舖 ID（從 discovered stores 中選擇）
 *
 * @param {String} brandId - 品牌 ID
 * @param {String} storeId - 店舖 ID
 * @param {String} selectedStoreId - 選擇的 Uber Eats 店舖 ID
 * @returns {Promise<Object>} 更新後的 PlatformStore
 *
 * @throws {AppError} 店舖 ID 不在 discovered stores 中
 */
export const updateSelectedStore = async (brandId, storeId, selectedStoreId) => {
  try {
    const platformStore = await PlatformStore.findOne({
      brand: brandId,
      store: storeId,
      platform: 'ubereats',
    })

    if (!platformStore) {
      throw new AppError('找不到對應的 PlatformStore 配置', 404)
    }

    // 驗證是否已授權
    if (!platformStore.oauth || !platformStore.oauth.isAuthorized) {
      throw new AppError('尚未完成 OAuth 授權', 400)
    }

    // 驗證選擇的店舖是否在 discovered stores 中
    const discoveredStores = platformStore.oauth.discoveredStores || []
    const isValidStore = discoveredStores.some((store) => store.id === selectedStoreId)

    if (!isValidStore) {
      throw new AppError('選擇的店舖 ID 不在授權的店舖列表中', 400)
    }

    // 🔧 關鍵步驟：調用 POS Provisioning API 激活店舖整合
    try {
      await activateStoreIntegration(
        platformStore.oauth.userAccessToken,
        selectedStoreId,
        storeId, // 使用我們系統的 storeId 作為 external_reference_id
      )
      console.log(`✅ 成功激活店舖整合: ${selectedStoreId}`)
    } catch (activationError) {
      console.error(`⚠️ 激活店舖整合失敗: ${activationError.message}`)
      throw new AppError(
        `無法激活店舖整合: ${activationError.message}。請確認您的 Uber Eats 帳號有此店舖的管理權限。`,
        500,
      )
    }

    // 更新 platformStoreId
    platformStore.platformStoreId = selectedStoreId

    // 🔧 修復：選擇店舖後啟用 PlatformStore
    platformStore.isActive = true

    await platformStore.save()

    console.log(`✅ 已更新選擇的店舖並啟用: ${selectedStoreId}`)

    return platformStore
  } catch (error) {
    console.error('❌ 更新選擇的店舖 ID 失敗:', error.message)
    throw error
  }
}
