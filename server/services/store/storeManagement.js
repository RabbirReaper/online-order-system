/**
 * 店鋪管理服務
 * 處理店鋪相關業務邏輯
 */

import Store from '../../models/Store/Store.js';
import Brand from '../../models/Brand/Brand.js';
import Menu from '../../models/Menu/Menu.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取所有店鋪
 * @param {Object} options - 查詢選項
 * @param {String} options.brandId - 按品牌篩選
 * @param {Boolean} options.activeOnly - 是否只顯示啟用的店鋪
 * @param {Number} options.page - 頁碼
 * @param {Number} options.limit - 每頁數量
 * @returns {Promise<Object>} 店鋪列表與分頁資訊
 */
export const getAllStores = async (options = {}) => {
  const { brandId, activeOnly = false, page = 1, limit = 20 } = options;

  // 構建查詢條件
  const queryConditions = {};

  if (brandId) {
    queryConditions.brand = brandId;
  }

  if (activeOnly) {
    queryConditions.isActive = true;
  }

  // 計算分頁
  const skip = (page - 1) * limit;

  // 查詢總數
  const total = await Store.countDocuments(queryConditions);

  // 查詢店鋪
  const stores = await Store.find(queryConditions)
    .populate('brand', 'name')
    .populate('menuId', 'name')
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    stores,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage
    }
  };
};

/**
 * 根據ID獲取店鋪
 * @param {String} storeId - 店鋪ID
 * @returns {Promise<Object>} 店鋪
 */
export const getStoreById = async (storeId) => {
  const store = await Store.findById(storeId)
    .populate('brand', 'name')
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

  // 驗證圖片欄位
  if (!storeData.image || !storeData.image.url || !storeData.image.key) {
    throw new AppError('圖片資訊不完整', 400);
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
  const now = new Date();
  const taiwanTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);

  // 獲取當前星期幾（0=星期日，6=星期六）
  const currentDay = now.getDay();

  // 查找今天的營業時間
  const todayHours = store.businessHours?.find(day => day.day === currentDay);

  // 如果沒有今天的營業時間或今天休息
  if (!todayHours || todayHours.isClosed) {
    return { isOpen: false, status: 'dayOff', message: '今日休息' };
  }

  // 檢查是否在營業時間內
  const currentTimeStr = taiwanTime.replace(/\s/g, ''); // 移除空格，得到 "HH:MM" 格式

  // 檢查是否在任何一個時段內
  for (const period of todayHours.periods) {
    if (currentTimeStr >= period.open && currentTimeStr < period.close) {
      return { isOpen: true, status: 'open', message: '營業中' };
    }
  }

  // 不在營業時間內
  return { isOpen: false, status: 'closed', message: '非營業時間' };
};
