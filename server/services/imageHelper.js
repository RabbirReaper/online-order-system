/**
 * 圖片處理輔助函數
 * 統一處理圖片上傳相關的共用邏輯
 */

import * as r2Service from './image/r2Service.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middlewares/error.js';


/**
 * 上傳圖片並返回圖片資訊
 * @param {Buffer|String} imageData - 圖片數據（Base64或Buffer）
 * @param {String} folder - 存儲路徑前綴（如 'dish', 'store'）
 * @param {String} fileName - 檔名（如未提供將生成UUID）
 * @param {String} contentType - 圖片類型（默認 'image/jpeg'）
 * @returns {Promise<Object>} 圖片資訊物件 {url, key, alt}
 */
export const uploadAndProcessImage = async (imageData, folder, fileName = null, contentType = 'image/jpeg') => {
  try {
    // 檢查圖片數據
    if (!imageData) {
      throw new AppError('未提供圖片數據', 400);
    }

    // 處理Base64圖片
    let imageBuffer = imageData;
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      // 從 Base64 字串取得 content type 和圖片資料
      const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

      if (!matches || matches.length !== 3) {
        throw new AppError('無效的Base64圖片格式', 400);
      }

      contentType = matches[1];
      const base64Data = matches[2];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (!(imageData instanceof Buffer)) {
      throw new AppError('圖片格式不支援', 400);
    }

    // 生成檔名（如果沒有提供）
    const finalFileName = fileName || `${uuidv4()}.${contentType.split('/')[1] || 'jpg'}`;

    // 生成存儲路徑
    const key = `${folder}/${finalFileName}`;

    // 上傳圖片
    await r2Service.uploadImage(imageBuffer, key, contentType);

    // 生成公開URL
    const url = r2Service.getImageUrl(key, process.env.R2_PUBLIC_URL);

    // 返回圖片資訊物件
    return {
      url,
      key,
      alt: 'picture' // 默認使用檔名作為替代文字
    };
  } catch (error) {
    console.error('圖片上傳處理錯誤:', error);
    throw new AppError(`圖片上傳失敗: ${error.message}`, 500);
  }
};

/**
 * 更新圖片
 * @param {Buffer|String} newImageData - 新圖片數據
 * @param {String} existingKey - 現有圖片的存儲鍵值
 * @param {String} folder - 存儲路徑前綴
 * @param {String} contentType - 圖片類型（默認 'image/jpeg'）
 * @returns {Promise<Object>} 更新後的圖片資訊物件 {url, key, alt}
 */
export const updateImage = async (newImageData, existingKey, folder, contentType = 'image/jpeg') => {
  try {
    // 如果有新圖片
    if (newImageData) {
      // 檢查舊圖片是否存在
      const oldImageExists = await r2Service.imageExists(existingKey);

      // 上傳新圖片 - 傳入 null 作為 fileName 參數讓 uploadAndProcessImage 自動生成 UUID
      const newImageInfo = await uploadAndProcessImage(newImageData, folder, null, contentType);

      // 只有在上傳成功且舊圖片存在且新舊key不同時才刪除舊圖片
      if (oldImageExists && newImageInfo.key !== existingKey) {
        await r2Service.deleteImage(existingKey);
      }

      // 返回新圖片資訊
      return newImageInfo;
    }

    // 如果沒有新圖片，返回現有圖片資訊
    return {
      url: r2Service.getImageUrl(existingKey, process.env.R2_PUBLIC_URL),
      key: existingKey,
      alt: existingKey.split('/').pop()
    };
  } catch (error) {
    console.error('圖片更新錯誤:', error);
    throw new AppError(`圖片更新失敗: ${error.message}`, 500);
  }
};

/**
 * 刪除圖片
 * @param {String} key - 圖片存儲鍵值
 * @returns {Promise<Boolean>} 刪除結果
 */
export const deleteImage = async (key) => {
  try {
    // 檢查圖片是否存在
    const imageExists = await r2Service.imageExists(key);

    if (!imageExists) {
      console.warn(`圖片不存在: ${key}`);
      return false;
    }

    // 刪除圖片
    await r2Service.deleteImage(key);
    return true;
  } catch (error) {
    console.error('圖片刪除錯誤:', error);
    throw new AppError(`圖片刪除失敗: ${error.message}`, 500);
  }
};

/**
 * 複製圖片給Bundle使用（需要在imageHelper.js中新增）
 * @param {String} sourceKey - 來源圖片的存儲鍵值
 * @param {String} targetFolder - 目標存儲路徑前綴
 * @param {String} fileName - 檔名
 * @returns {Promise<Object>} 圖片資訊物件 {url, key, alt}
 */
export const copyImageForBundle = async (sourceKey, targetFolder, fileName = null) => {
  try {
    // 檢查來源圖片是否存在
    const sourceExists = await r2Service.imageExists(sourceKey);
    if (!sourceExists) {
      throw new AppError('來源圖片不存在', 404);
    }

    // 下載來源圖片
    const imageBuffer = await r2Service.downloadImage(sourceKey);

    // 生成新的檔名
    const finalFileName = fileName || `${uuidv4()}.jpg`;
    const newKey = `${targetFolder}/${finalFileName}`;

    // 上傳到新位置
    await r2Service.uploadImage(imageBuffer, newKey, 'image/jpeg');

    // 生成公開URL
    const url = r2Service.getImageUrl(newKey, process.env.R2_PUBLIC_URL);

    return {
      url,
      key: newKey,
      alt: fileName || 'bundle image'
    };
  } catch (error) {
    console.error('複製圖片錯誤:', error);
    throw new AppError(`圖片複製失敗: ${error.message}`, 500);
  }
};

