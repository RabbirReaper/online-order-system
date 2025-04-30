/**
 * 圖片處理 API 模組
 * @param {Object} apiClient - Axios 實例
 * @returns {Object} - 圖片處理相關方法
 */
export default function (apiClient) {
  return {
    /**
     * 將文件轉換為 Base64 格式
     * @param {File} file - 檔案對象
     * @returns {Promise<string>} - Base64 編碼的圖片數據
     */
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  };
}
