/**
 * 店鋪管理服務
 * 處理店鋪相關業務邏輯
 */

import Store from '../../models/Store/Store.js';
import Brand from '../../models/Brand/Brand.js';
import Menu from '../../models/Menu/Menu.js';
import { AppError } from '../../middlewares/error.js';
import * as imageHelper from '../imageHelper.js';
import { DateTime } from 'luxon';

/**
 * 獲取所有店鋪
 * @param {Object} options - 查詢選項
 * @param {String} options.brandId - 按品牌篩選
 * @param {Boolean} options.activeOnly - 是否只顯示啟用的店鋪
 * @returns {Promise<Array>} 店鋪列表
 */
export const getAllStores = async (options = {}) => {
  const { brandId, activeOnly = false } = options;

  // 構建查詢條件
  const queryConditions = {};

  if (brandId) {
    queryConditions.brand = brandId;
  }

  if (activeOnly) {
    queryConditions.isActive = true;
  }

  // 查詢店鋪，移除分頁
  const stores = await Store.find(queryConditions)
    .populate('brand', 'name')
    .populate('menuId', 'name')
    .sort({ name: 1 });

  return stores;
};

/**
 * 根據ID獲取店鋪
 * @param {String} storeId - 店鋪ID
 * @returns {Promise<Object>} 店鋪
 */
export const getStoreById = async (storeId) => {
  const store = await Store.findById(storeId)
    .populate('menuId', 'name');

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  return store;
};

/**
 * 創建店鋪
 * @param {Object} storeData - 店鋪數據
 * @returns {Promise<Object>} 創建的店鋪
 */
export const createStore = async (storeData) => {
  // 基本驗證
  if (!storeData.name || !storeData.brand) {
    throw new AppError('店鋪名稱和品牌為必填欄位', 400);
  }

  // 驗證品牌是否存在
  const brand = await Brand.findById(storeData.brand);
  if (!brand) {
    throw new AppError('品牌不存在', 404);
  }

  // 處理圖片上傳
  if (storeData.imageData) {
    try {
      // 上傳圖片並獲取圖片資訊
      const imageInfo = await imageHelper.uploadAndProcessImage(
        storeData.imageData,
        `stores/${storeData.brand}` // 使用品牌ID組織圖片路徑
      );

      // 設置圖片資訊到店鋪數據
      storeData.image = imageInfo;

      // 刪除原始圖片數據以避免儲存過大的文件
      delete storeData.imageData;
    } catch (error) {
      throw new AppError(`圖片處理失敗: ${error.message}`, 400);
    }
  } else if (!storeData.image || !storeData.image.url || !storeData.image.key) {
    throw new AppError('圖片資訊不完整，請提供圖片', 400);
  }

  // 創建店鋪
  const newStore = new Store(storeData);
  await newStore.save();

  // 如果提供了菜單ID，檢查並關聯
  if (storeData.menuId) {
    const menu = await Menu.findById(storeData.menuId);
    if (!menu) {
      throw new AppError('菜單不存在', 404);
    }
  }

  return newStore;
};

/**
 * 更新店鋪
 * @param {String} storeId - 店鋪ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的店鋪
 */
export const updateStore = async (storeId, updateData) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 如果更新品牌，檢查品牌是否存在
  if (updateData.brand) {
    const brand = await Brand.findById(updateData.brand);
    if (!brand) {
      throw new AppError('品牌不存在', 404);
    }
  }

  // 處理圖片更新
  if (updateData.imageData) {
    try {
      // 如果存在舊圖片，則更新圖片
      if (store.image && store.image.key) {
        const brandId = updateData.brand || store.brand;
        const imageInfo = await imageHelper.updateImage(
          updateData.imageData,
          store.image.key,
          `stores/${brandId}`
        );
        updateData.image = imageInfo;
      } else {
        // 如果不存在舊圖片，則上傳新圖片
        const brandId = updateData.brand || store.brand;
        const imageInfo = await imageHelper.uploadAndProcessImage(
          updateData.imageData,
          `stores/${brandId}`
        );
        updateData.image = imageInfo;
      }

      // 刪除原始圖片數據
      delete updateData.imageData;
    } catch (error) {
      throw new AppError(`圖片處理失敗: ${error.message}`, 400);
    }
  }

  // 如果更新菜單，檢查菜單是否存在
  if (updateData.menuId) {
    const menu = await Menu.findById(updateData.menuId);
    if (!menu) {
      throw new AppError('菜單不存在', 404);
    }
  }

  // 更新店鋪
  Object.keys(updateData).forEach(key => {
    store[key] = updateData[key];
  });

  await store.save();

  return store;
};

/**
 * 刪除店鋪
 * @param {String} storeId - 店鋪ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteStore = async (storeId) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // TODO: 檢查是否有關聯訂單、庫存、員工等，如果有則拒絕刪除

  // 刪除關聯圖片
  if (store.image && store.image.key) {
    try {
      await imageHelper.deleteImage(store.image.key);
    } catch (error) {
      console.error(`刪除店鋪圖片失敗: ${error.message}`);
      // 繼續刪除店鋪，不因圖片刪除失敗而中斷流程
    }
  }

  await store.deleteOne();

  return { success: true, message: '店鋪已刪除' };
};

/**
 * 切換店鋪啟用狀態
 * @param {String} storeId - 店鋪ID
 * @param {Boolean} isActive - 啟用狀態
 * @returns {Promise<Object>} 更新後的店鋪
 */
export const toggleStoreActive = async (storeId, isActive) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  store.isActive = isActive;
  await store.save();

  return store;
};

/**
 * 獲取店鋪營業時間
 * @param {String} storeId - 店鋪ID
 * @returns {Promise<Array>} 營業時間
 */
export const getStoreBusinessHours = async (storeId) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  return store.businessHours || [];
};

/**
 * 更新店鋪營業時間
 * @param {String} storeId - 店鋪ID
 * @param {Array} businessHours - 營業時間
 * @returns {Promise<Object>} 更新後的店鋪
 */
export const updateStoreBusinessHours = async (storeId, businessHours) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 驗證營業時間格式
  if (!Array.isArray(businessHours)) {
    throw new AppError('營業時間必須是陣列', 400);
  }

  // 檢查每個營業日資料
  for (const dayInfo of businessHours) {
    if (dayInfo.day < 0 || dayInfo.day > 6) {
      throw new AppError('日期必須在 0-6 之間（0=星期日，6=星期六）', 400);
    }

    if (!dayInfo.isClosed && (!Array.isArray(dayInfo.periods) || dayInfo.periods.length === 0)) {
      throw new AppError(`星期 ${dayInfo.day} 未設置為關閉但未提供營業時段`, 400);
    }

    // 檢查時段格式
    if (dayInfo.periods) {
      for (const period of dayInfo.periods) {
        if (!period.open || !period.close) {
          throw new AppError('每個時段必須包含開始和結束時間', 400);
        }

        // 檢查時間格式 (HH:MM)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(period.open) || !timeRegex.test(period.close)) {
          throw new AppError('時間必須是 HH:MM 格式（24小時制）', 400);
        }
      }
    }
  }

  // 更新營業時間
  store.businessHours = businessHours;
  await store.save();

  return store;
};

/**
 * 更新店鋪公告
 * @param {String} storeId - 店鋪ID
 * @param {Array} announcements - 公告
 * @returns {Promise<Object>} 更新後的店鋪
 */
export const updateStoreAnnouncements = async (storeId, announcements) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 驗證公告格式
  if (!Array.isArray(announcements)) {
    throw new AppError('公告必須是陣列', 400);
  }

  // 檢查每個公告
  for (const announcement of announcements) {
    if (!announcement.title || !announcement.content) {
      throw new AppError('每個公告必須包含標題和內容', 400);
    }
  }

  // 更新公告
  store.announcements = announcements;
  await store.save();

  return store;
};

/**
 * 獲取店鋪當前狀態（營業中、休息中等）
 * @param {String} storeId - 店鋪ID
 * @returns {Promise<Object>} 店鋪狀態
 */
export const getStoreCurrentStatus = async (storeId) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 檢查店鋪是否啟用
  if (!store.isActive) {
    return { isOpen: false, status: 'closed', message: '店鋪已停業' };
  }

  // 獲取當前時間（使用台灣時區）
  const now = DateTime.now().setZone('Asia/Taipei');
  const currentTimeStr = now.toFormat('HH:mm');

  // 獲取當前星期幾（0=星期日，6=星期六）
  const currentDay = now.weekday % 7; // DateTime 使用 1-7，轉為 0-6

  // 查找今天的營業時間
  const todayHours = store.businessHours?.find(day => day.day === currentDay);

  // 如果沒有今天的營業時間或今天休息
  if (!todayHours || todayHours.isClosed) {
    return { isOpen: false, status: 'dayOff', message: '今日休息' };
  }

  // 檢查是否在營業時間內
  for (const period of todayHours.periods) {
    if (currentTimeStr >= period.open && currentTimeStr < period.close) {
      return { isOpen: true, status: 'open', message: '營業中' };
    }
  }

  // 不在營業時間內
  return { isOpen: false, status: 'closed', message: '非營業時間' };
};
