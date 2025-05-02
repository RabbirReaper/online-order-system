/**
 * 圖片處理 API 模組
 * 提供前端圖片處理相關功能
 */
export default function () {
  return {
    /**
     * 將 File 對象轉換為 Base64 字符串
     * @param {File} file - 文件對象
     * @returns {Promise<string>} - Base64 編碼的圖片字符串
     */
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    },

    /**
     * 壓縮圖片
     * @param {string} base64 - Base64 編碼的圖片字符串
     * @param {Object} options - 壓縮選項
     * @param {number} options.maxWidth - 最大寬度
     * @param {number} options.maxHeight - 最大高度
     * @param {number} options.quality - 壓縮質量 (0-1)
     * @returns {Promise<string>} - 壓縮後的 Base64 編碼圖片字符串
     */
    compressImage(base64, options = {}) {
      const { maxWidth = 800, maxHeight = 800, quality = 0.8 } = options;

      return new Promise((resolve) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
          // 計算新尺寸
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }

          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }

          // 創建畫布並繪製圖像
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // 轉換為 Base64
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
      });
    }
  };
}
