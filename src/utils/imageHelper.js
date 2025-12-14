/**
 * 圖片處理工具
 * 用於統一處理商品圖片的顯示邏輯
 */

/**
 * 獲取圖片資訊
 * @param {Object} imageObj - 圖片物件 { url, key, alt }
 * @returns {Object} { hasImage: boolean, url: string | null }
 */
export function getImageInfo(imageObj) {
  if (imageObj && imageObj.url && imageObj.url.trim() !== '') {
    return {
      hasImage: true,
      url: imageObj.url
    }
  }
  return {
    hasImage: false,
    url: null
  }
}

/**
 * 獲取圖片 URL，如果沒有則返回 null
 * @param {Object} imageObj - 圖片物件
 * @returns {string | null}
 */
export function getImageUrl(imageObj) {
  return getImageInfo(imageObj).url
}

/**
 * 檢查是否有圖片
 * @param {Object} imageObj - 圖片物件
 * @returns {boolean}
 */
export function hasImage(imageObj) {
  return getImageInfo(imageObj).hasImage
}
