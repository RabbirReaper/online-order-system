/**
 * Uber Eats OAuth Composable
 * 處理前端 OAuth 流程的可重用邏輯
 *
 * 功能：
 * - 開啟授權 popup 視窗
 * - 監聽 postMessage 事件
 * - 查詢授權狀態
 * - 撤銷授權
 */

import { ref } from 'vue'
import axios from 'axios'

export function useUberEatsOAuth() {
  // ========================================
  // 🔧 狀態
  // ========================================
  const isLoading = ref(false)
  const error = ref(null)
  const oauthStatus = ref({
    isAuthorized: false,
    authorizedAt: null,
    discoveredStores: [],
    hasExpired: false,
  })

  // ========================================
  // 🚀 OAuth 流程
  // ========================================

  /**
   * 發起 OAuth 授權（開啟 popup 視窗）
   * @param {String} brandId - 品牌 ID
   * @param {String} storeId - 店舖 ID
   * @returns {Promise<Object>} 授權結果
   */
  const initiateOAuth = (brandId, storeId) => {
    return new Promise((resolve, reject) => {
      error.value = null

      // 計算 popup 視窗位置（螢幕中央）
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      // 開啟授權 popup
      const popup = window.open(
        `/api/delivery/ubereats/oauth/authorize?brandId=${brandId}&storeId=${storeId}`,
        'uber-oauth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`,
      )

      if (!popup) {
        error.value = '無法開啟授權視窗，請檢查瀏覽器設定是否封鎖彈出視窗'
        reject(new Error(error.value))
        return
      }

      // 監聽 postMessage 事件
      const messageHandler = (event) => {
        // 驗證來源（安全性考量）
        if (event.origin !== window.location.origin) {
          return
        }

        // 處理 OAuth 成功
        if (event.data.type === 'uber-oauth-success') {
          console.log('✅ OAuth 授權成功:', event.data.data)

          // 清除監聽器
          window.removeEventListener('message', messageHandler)

          // 關閉 popup（如果還開著）
          if (popup && !popup.closed) {
            popup.close()
          }

          resolve(event.data.data)
        }

        // 處理 OAuth 錯誤
        if (event.data.type === 'uber-oauth-error') {
          console.error('❌ OAuth 授權失敗:', event.data.error)

          error.value = event.data.error

          // 清除監聽器
          window.removeEventListener('message', messageHandler)

          // 關閉 popup（如果還開著）
          if (popup && !popup.closed) {
            popup.close()
          }

          reject(new Error(event.data.error))
        }
      }

      // 註冊 postMessage 監聽器
      window.addEventListener('message', messageHandler)

      // 檢查 popup 是否被關閉（用戶手動關閉）
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed)
          window.removeEventListener('message', messageHandler)

          // 如果 popup 被關閉但沒有收到成功或錯誤訊息，視為取消
          if (!error.value) {
            error.value = '授權流程已取消'
            reject(new Error(error.value))
          }
        }
      }, 500)
    })
  }

  // ========================================
  // 📊 狀態查詢
  // ========================================

  /**
   * 查詢 OAuth 授權狀態
   * @param {String} brandId - 品牌 ID
   * @param {String} storeId - 店舖 ID
   * @returns {Promise<Object>} 授權狀態
   */
  const checkOAuthStatus = async (brandId, storeId) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await axios.get(
        `/api/delivery/ubereats/oauth/status/${brandId}/${storeId}`,
      )

      if (response.data.success) {
        oauthStatus.value = response.data.data
        return response.data.data
      } else {
        throw new Error('查詢授權狀態失敗')
      }
    } catch (err) {
      console.error('❌ 查詢 OAuth 狀態失敗:', err)
      error.value = err.response?.data?.message || err.message || '查詢失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ========================================
  // 🗑️ 撤銷授權
  // ========================================

  /**
   * 撤銷 OAuth 授權（解除連接）
   * @param {String} brandId - 品牌 ID
   * @param {String} storeId - 店舖 ID
   * @returns {Promise<void>}
   */
  const revokeOAuth = async (brandId, storeId) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await axios.delete(
        `/api/delivery/ubereats/oauth/revoke/${brandId}/${storeId}`,
      )

      if (response.data.success) {
        // 清空本地狀態
        oauthStatus.value = {
          isAuthorized: false,
          authorizedAt: null,
          discoveredStores: [],
          hasExpired: false,
        }

        return response.data
      } else {
        throw new Error('撤銷授權失敗')
      }
    } catch (err) {
      console.error('❌ 撤銷 OAuth 授權失敗:', err)
      error.value = err.response?.data?.message || err.message || '撤銷失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ========================================
  // 🏪 選擇店舖
  // ========================================

  /**
   * 更新選擇的店舖 ID
   * @param {String} brandId - 品牌 ID
   * @param {String} storeId - 店舖 ID
   * @param {String} platformStoreId - Uber Eats 店舖 ID
   * @returns {Promise<Object>}
   */
  const selectStore = async (brandId, storeId, platformStoreId) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await axios.patch(
        `/api/delivery/ubereats/oauth/select-store/${brandId}/${storeId}`,
        {
          platformStoreId,
        },
      )

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error('選擇店舖失敗')
      }
    } catch (err) {
      console.error('❌ 選擇店舖失敗:', err)
      error.value = err.response?.data?.message || err.message || '選擇失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ========================================
  // 🔄 輔助函數
  // ========================================

  /**
   * 重置錯誤狀態
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 取得 discovered stores 的下拉選單選項
   * @returns {Array} 選項陣列
   */
  const getStoreOptions = () => {
    if (!oauthStatus.value.discoveredStores || oauthStatus.value.discoveredStores.length === 0) {
      return []
    }

    return oauthStatus.value.discoveredStores.map((store) => ({
      value: store.id,
      text: store.name,
    }))
  }

  // ========================================
  // 🎁 回傳
  // ========================================
  return {
    // 狀態
    isLoading,
    error,
    oauthStatus,

    // 方法
    initiateOAuth,
    checkOAuthStatus,
    revokeOAuth,
    selectStore,
    clearError,
    getStoreOptions,
  }
}
