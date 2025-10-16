/**
 * 列印機管理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 列印機相關 API 方法
 */
export default function (apiClient) {
  return {
    /**
     * 列印訂單
     * @param {Object} params - 列印參數
     * @param {string} params.brandId - 品牌ID（必填）
     * @param {string} params.storeId - 店鋪ID（必填）
     * @param {string} params.orderId - 訂單ID（必填）
     * @returns {Promise} - API 回應
     * @example
     * await api.printer.printOrder({
     *   brandId: '507f1f77bcf86cd799439011',
     *   storeId: '507f1f77bcf86cd799439012',
     *   orderId: '507f1f77bcf86cd799439013'
     * })
     */
    printOrder({ brandId, storeId, orderId }) {
      return apiClient.post(`/printer/brands/${brandId}/stores/${storeId}/orders/${orderId}/print`)
    },
  }
}
