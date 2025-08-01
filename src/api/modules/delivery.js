/**
 * 外送平台管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 外送平台相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 獲取支援的外送平台列表
     * GET /api/delivery/platforms
     * @returns {Promise} - API 回應，包含支援的平台列表
     */
    getSupportedPlatforms() {
      return apiClient.get('/delivery/platforms')
    },

    /**
     * 檢查 UberEats 配置狀態
     * GET /api/delivery/ubereats/config
     * @returns {Promise} - API 回應，包含配置狀態資訊
     */
    checkUberEatsConfig() {
      return apiClient.get('/delivery/ubereats/config')
    },

    /**
     * 驗證平台設定
     * POST /api/delivery/validate-settings
     * @param {Object} params - 驗證參數
     * @param {string} params.platform - 平台名稱 ('ubereats' | 'foodpanda')
     * @param {Object} params.settings - 平台設定物件
     * @param {string} [params.settings.clientId] - 客戶端 ID
     * @param {string} [params.settings.clientSecret] - 客戶端密鑰
     * @param {string} [params.settings.storeId] - 店鋪 ID
     * @param {string} [params.settings.webhookUrl] - Webhook URL
     * @returns {Promise} - API 回應，包含驗證結果
     */
    validatePlatformSettings({ platform, settings }) {
      return apiClient.post('/delivery/validate-settings', {
        platform,
        settings,
      })
    },

    /**
     * 測試單一平台連接狀態
     * GET /api/delivery/test-connection/:platform
     * @param {string} platform - 平台名稱 ('ubereats' | 'foodpanda')
     * @returns {Promise} - API 回應，包含連接測試結果
     */
    testPlatformConnection(platform) {
      return apiClient.get(`/delivery/test-connection/${platform}`)
    },

    /**
     * 測試所有平台連接狀態
     * GET /api/delivery/test-connections
     * @returns {Promise} - API 回應，包含所有平台的連接測試結果
     */
    testAllConnections() {
      return apiClient.get('/delivery/test-connections')
    },

    /**
     * 創建測試 webhook 資料（開發環境專用）
     * POST /api/delivery/test-webhook/:platform
     * @param {Object} params - 測試參數
     * @param {string} params.platform - 平台名稱 ('ubereats' | 'foodpanda')
     * @param {string} [params.orderId] - 測試用的訂單 ID，若不提供會自動生成
     * @returns {Promise} - API 回應，包含生成的測試 webhook 資料
     */
    createTestWebhook({ platform, orderId }) {
      return apiClient.post(`/delivery/test-webhook/${platform}`, {
        orderId,
      })
    },

    /**
     * 手動觸發 webhook 處理（開發測試用）
     * POST /api/delivery/webhook/:platform
     * 注意：這個方法直接呼叫 webhook 端點，主要用於開發階段測試
     * @param {Object} params - Webhook 參數
     * @param {string} params.platform - 平台名稱
     * @param {Object} params.webhookData - 模擬的 webhook 資料
     * @param {string} [params.signature] - 模擬的簽名（可選）
     * @returns {Promise} - API 回應
     */
    simulateWebhook({ platform, webhookData, signature }) {
      const headers = {}
      if (signature) {
        // 根據不同平台設定對應的簽名標頭
        if (platform === 'ubereats') {
          headers['x-uber-signature'] = signature
        } else if (platform === 'foodpanda') {
          headers['x-foodpanda-signature'] = signature
        }
      }

      return apiClient.post(`/delivery/webhook/${platform}`, webhookData, {
        headers,
      })
    },
  }
}
