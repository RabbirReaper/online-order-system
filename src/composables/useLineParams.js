import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

export function useLineParams() {
  const route = useRoute()
  const parsingError = ref(null)

  // 解析基本 URL 參數
  const rawParams = computed(() => route.query)

  // 解析 liff.state 參數
  const parseLiffState = (liffState) => {
    if (!liffState) return {}

    try {
      // liff.state 通常是 URL 編碼的查詢字符串
      const decoded = decodeURIComponent(liffState)
      const params = new URLSearchParams(decoded)
      const result = {}

      for (const [key, value] of params) {
        result[key] = value
      }

      return result
    } catch (error) {
      console.warn('liff.state 解析失敗:', error)
      return {}
    }
  }

  // 合併所有參數
  const allParams = computed(() => {
    const liffStateParams = parseLiffState(rawParams.value['liff.state'])

    return {
      // 基本參數
      ...rawParams.value,
      // liff.state 中的參數（優先級較低）
      ...liffStateParams,
      // 再次覆蓋基本參數（確保 URL 中的參數優先）
      ...rawParams.value,
    }
  })

  // 驗證必要參數
  const validateParams = (params) => {
    const required = ['storeId', 'brandId']
    const missing = required.filter((key) => !params[key])

    if (missing.length > 0) {
      throw new Error(`缺少必要參數: ${missing.join(', ')}`)
    }

    // 驗證 ObjectId 格式
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    if (!objectIdRegex.test(params.storeId)) {
      throw new Error('storeId 格式錯誤')
    }
    if (!objectIdRegex.test(params.brandId)) {
      throw new Error('brandId 格式錯誤')
    }

    return true
  }

  // 獲取清理後的參數
  const getCleanParams = () => {
    try {
      const params = { ...allParams.value }

      // 驗證參數
      validateParams(params)

      // 清理和標準化
      return {
        // 必要參數
        storeId: params.storeId.trim(),
        brandId: params.brandId.trim(),

        // 可選參數
        source: params.source?.toLowerCase() || 'direct',
        tableNumber: params.tableNumber || params.tableNo, // 支援兩種參數名稱
        area: params.area?.toLowerCase(),
        campaign: params.campaign?.toLowerCase(),
        promo: params.promo?.toUpperCase(),

        // LINE 系統參數
        accessToken: params.access_token,
        liffReferrer: params['liff.referrer'],

        // 元數據
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      }
    } catch (error) {
      parsingError.value = error.message
      throw error
    }
  }

  return {
    rawParams,
    allParams,
    parsingError,
    getCleanParams,
    validateParams,
  }
}
