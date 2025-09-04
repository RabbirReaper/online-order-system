/**
 * 店鋪管理服務
 * 處理店鋪相關業務邏輯
 */

import Store from '../../models/Store/Store.js'
import Brand from '../../models/Brand/Brand.js'
import Menu from '../../models/Menu/Menu.js'
import { AppError } from '../../middlewares/error.js'
import * as imageHelper from '../imageHelper.js'
import { DateTime } from 'luxon'

/**
 * 獲取所有店鋪（支援基於權限的過濾）
 * @param {Object} options - 查詢選項
 * @param {Object} adminInfo - 管理員資訊，用於權限過濾
 * @returns {Promise<Array>} 店鋪列表
 */
export const getAllStores = async (options = {}, adminInfo = null) => {
  const { brandId, activeOnly = false, search } = options

  // 構建基本查詢條件
  const queryConditions = {}

  if (brandId) {
    queryConditions.brand = brandId
  }

  if (activeOnly) {
    queryConditions.isActive = true
  }

  if (search) {
    queryConditions.name = { $regex: search, $options: 'i' }
  }

  // ✅ 新增：基於管理員權限的過濾
  if (adminInfo) {
    const permissionFilters = buildStorePermissionFilters(adminInfo, brandId)

    if (permissionFilters === false) {
      throw new AppError('沒有權限查看店鋪資料', 403)
    }

    // 合併權限過濾條件
    Object.assign(queryConditions, permissionFilters)
  }

  // console.log('🔍 Store 查詢條件 (包含權限過濾):', queryConditions)

  // 查詢店鋪
  const stores = await Store.find(queryConditions)
    .populate('brand', 'name')
    .populate('menuId', 'name')
    .sort({ name: 1 })

  // console.log(`📊 權限過濾後查詢到 ${stores.length} 個店鋪`)

  return stores
}

/**
 * 建立店鋪權限過濾條件
 * @param {Object} adminInfo - 管理員資訊
 * @param {String} requestedBrandId - 請求的品牌ID
 * @returns {Object|false} 過濾條件或 false（無權限）
 */
function buildStorePermissionFilters(adminInfo, requestedBrandId) {
  const { role, brand, store } = adminInfo

  switch (role) {
    case 'primary_system_admin':
    case 'system_admin':
      // 系統管理員可以看所有品牌的店鋪
      return requestedBrandId ? { brand: requestedBrandId } : {}

    case 'primary_brand_admin':
    case 'brand_admin':
      // 品牌管理員只能看自己品牌的店鋪
      if (brand.toString() !== requestedBrandId) {
        return false // 沒有權限
      }
      return { brand: brand }

    case 'primary_store_admin':
    case 'store_admin':
      // 店鋪管理員只能看自己管理的店鋪
      if (brand.toString() !== requestedBrandId) {
        return false
      }
      return {
        brand: brand,
        _id: store, // ✅ 關鍵：只能看自己的店鋪
      }

    default:
      return false
  }
}

/**
 * 根據ID獲取店鋪
 * @param {String} storeId - 店鋪ID
 * @returns {Promise<Object>} 店鋪
 */
export const getStoreById = async (storeId) => {
  const store = await Store.findById(storeId).populate('menuId', 'name')

  if (!store) {
    throw new AppError('店鋪不存在', 404)
  }

  return store
}

/**
 * 創建店鋪
 * @param {Object} storeData - 店鋪數據
 * @returns {Promise<Object>} 創建的店鋪
 */
export const createStore = async (storeData) => {
  // 基本驗證
  if (!storeData.name || !storeData.brand) {
    throw new AppError('店鋪名稱和品牌為必填欄位', 400)
  }

  if (!storeData.address) {
    throw new AppError('店鋪地址為必填欄位', 400)
  }

  if (!storeData.phone) {
    throw new AppError('店鋪電話為必填欄位', 400)
  }

  // 驗證品牌是否存在
  const brand = await Brand.findById(storeData.brand)
  if (!brand) {
    throw new AppError('品牌不存在', 404)
  }

  // 處理圖片上傳
  if (storeData.imageData) {
    try {
      // 上傳圖片並獲取圖片資訊
      const imageInfo = await imageHelper.uploadAndProcessImage(
        storeData.imageData,
        `stores/${storeData.brand}`, // 使用品牌ID組織圖片路徑
      )

      // 設置圖片資訊到店鋪數據
      storeData.image = imageInfo

      // 刪除原始圖片數據以避免儲存過大的文件
      delete storeData.imageData
    } catch (error) {
      throw new AppError(`圖片處理失敗: ${error.message}`, 400)
    }
  } else if (!storeData.image || !storeData.image.url || !storeData.image.key) {
    throw new AppError('圖片資訊不完整，請提供圖片', 400)
  }

  // 設置服務相關預設值
  if (storeData.enableLineOrdering === undefined) storeData.enableLineOrdering = false
  if (storeData.showTaxId === undefined) storeData.showTaxId = false
  if (storeData.provideReceipt === undefined) storeData.provideReceipt = true
  if (storeData.enableDineIn === undefined) storeData.enableDineIn = true
  if (storeData.enableTakeOut === undefined) storeData.enableTakeOut = true
  if (storeData.enableDelivery === undefined) storeData.enableDelivery = false

  // 設置準備時間預設值
  if (storeData.dineInPrepTime === undefined) storeData.dineInPrepTime = 15
  if (storeData.takeOutPrepTime === undefined) storeData.takeOutPrepTime = 10
  if (storeData.deliveryPrepTime === undefined) storeData.deliveryPrepTime = 30

  // 設置外送相關預設值
  if (storeData.minDeliveryAmount === undefined) storeData.minDeliveryAmount = 0
  if (storeData.minDeliveryQuantity === undefined) storeData.minDeliveryQuantity = 1
  if (storeData.maxDeliveryDistance === undefined) storeData.maxDeliveryDistance = 5

  // 設置預訂設定預設值
  if (storeData.advanceOrderDays === undefined) storeData.advanceOrderDays = 0

  // 創建店鋪
  const newStore = new Store(storeData)
  await newStore.save()

  // 如果提供了菜單ID，檢查並關聯
  if (storeData.menuId) {
    const menu = await Menu.findById(storeData.menuId)
    if (!menu) {
      throw new AppError('菜單不存在', 404)
    }
  }

  return newStore
}

/**
 * 更新店鋪
 * @param {String} storeId - 店鋪ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的店鋪
 */
export const updateStore = async (storeId, updateData) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId)

  if (!store) {
    throw new AppError('店鋪不存在', 404)
  }

  // 如果更新品牌，檢查品牌是否存在
  if (updateData.brand) {
    const brand = await Brand.findById(updateData.brand)
    if (!brand) {
      throw new AppError('品牌不存在', 404)
    }
  }

  // 處理圖片更新
  if (updateData.imageData) {
    try {
      // 如果存在舊圖片，則更新圖片
      if (store.image && store.image.key) {
        const brandId = updateData.brand || store.brand
        const imageInfo = await imageHelper.updateImage(
          updateData.imageData,
          store.image.key,
          `stores/${brandId}`,
        )
        updateData.image = imageInfo
      } else {
        // 如果不存在舊圖片，則上傳新圖片
        const brandId = updateData.brand || store.brand
        const imageInfo = await imageHelper.uploadAndProcessImage(
          updateData.imageData,
          `stores/${brandId}`,
        )
        updateData.image = imageInfo
      }

      // 刪除原始圖片數據
      delete updateData.imageData
    } catch (error) {
      throw new AppError(`圖片處理失敗: ${error.message}`, 400)
    }
  }

  // 如果更新菜單，檢查菜單是否存在
  if (updateData.menuId) {
    const menu = await Menu.findById(updateData.menuId)
    if (!menu) {
      throw new AppError('菜單不存在', 404)
    }
  }

  // 驗證準備時間設定
  if (updateData.dineInPrepTime !== undefined && updateData.dineInPrepTime < 0) {
    throw new AppError('內用準備時間不能小於0', 400)
  }

  if (updateData.takeOutPrepTime !== undefined && updateData.takeOutPrepTime < 0) {
    throw new AppError('外帶準備時間不能小於0', 400)
  }

  if (updateData.deliveryPrepTime !== undefined && updateData.deliveryPrepTime < 0) {
    throw new AppError('外送準備時間不能小於0', 400)
  }

  // 驗證外送相關設定
  if (updateData.minDeliveryAmount !== undefined && updateData.minDeliveryAmount < 0) {
    throw new AppError('最低外送金額不能小於0', 400)
  }

  if (updateData.minDeliveryQuantity !== undefined && updateData.minDeliveryQuantity < 1) {
    throw new AppError('最少外送數量不能小於1', 400)
  }

  if (updateData.maxDeliveryDistance !== undefined && updateData.maxDeliveryDistance < 0) {
    throw new AppError('最長外送距離不能小於0', 400)
  }

  // 驗證預訂設定
  if (updateData.advanceOrderDays !== undefined && updateData.advanceOrderDays < 0) {
    throw new AppError('可預訂天數不能小於0', 400)
  }

  // 更新店鋪
  Object.keys(updateData).forEach((key) => {
    store[key] = updateData[key]
  })

  await store.save()

  return store
}

/**
 * 刪除店鋪
 * @param {String} storeId - 店鋪ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteStore = async (storeId) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId)

  if (!store) {
    throw new AppError('店鋪不存在', 404)
  }

  // TODO: 檢查是否有關聯訂單、庫存、員工等，如果有則拒絕刪除

  // 刪除關聯圖片
  if (store.image && store.image.key) {
    try {
      await imageHelper.deleteImage(store.image.key)
    } catch (error) {
      console.error(`刪除店鋪圖片失敗: ${error.message}`)
      // 繼續刪除店鋪，不因圖片刪除失敗而中斷流程
    }
  }

  await store.deleteOne()

  return { success: true, message: '店鋪已刪除' }
}

/**
 * 切換店鋪啟用狀態
 * @param {String} storeId - 店鋪ID
 * @param {Boolean} isActive - 啟用狀態
 * @returns {Promise<Object>} 更新後的店鋪
 */
export const toggleStoreActive = async (storeId, isActive) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId)

  if (!store) {
    throw new AppError('店鋪不存在', 404)
  }

  store.isActive = isActive
  await store.save()

  return store
}

/**
 * 獲取店鋪營業時間
 * @param {String} storeId - 店鋪ID
 * @returns {Promise<Array>} 營業時間
 */
export const getStoreBusinessHours = async (storeId) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId)

  if (!store) {
    throw new AppError('店鋪不存在', 404)
  }

  return store.businessHours || []
}

/**
 * 更新店鋪營業時間
 * @param {String} storeId - 店鋪ID
 * @param {Array} businessHours - 營業時間
 * @returns {Promise<Object>} 更新後的店鋪
 */
export const updateStoreBusinessHours = async (storeId, businessHours) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId)

  if (!store) {
    throw new AppError('店鋪不存在', 404)
  }

  // 驗證營業時間格式
  if (!Array.isArray(businessHours)) {
    throw new AppError('營業時間必須是陣列', 400)
  }

  // 檢查每個營業日資料
  for (const dayInfo of businessHours) {
    if (dayInfo.day < 0 || dayInfo.day > 6) {
      throw new AppError('日期必須在 0-6 之間（0=星期日，6=星期六）', 400)
    }

    if (!dayInfo.isClosed && (!Array.isArray(dayInfo.periods) || dayInfo.periods.length === 0)) {
      throw new AppError(`星期 ${dayInfo.day} 未設置為關閉但未提供營業時段`, 400)
    }

    // 檢查時段格式
    if (dayInfo.periods) {
      for (const period of dayInfo.periods) {
        if (!period.open || !period.close) {
          throw new AppError('每個時段必須包含開始和結束時間', 400)
        }

        // 檢查時間格式 (HH:MM)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
        if (!timeRegex.test(period.open) || !timeRegex.test(period.close)) {
          throw new AppError('時間必須是 HH:MM 格式（24小時制）', 400)
        }
      }
    }
  }

  // 更新營業時間
  store.businessHours = businessHours
  await store.save()

  return store
}

/**
 * 更新店鋪公告
 * @param {String} storeId - 店鋪ID
 * @param {Array} announcements - 公告
 * @returns {Promise<Object>} 更新後的店鋪
 */
export const updateStoreAnnouncements = async (storeId, announcements) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId)

  if (!store) {
    throw new AppError('店鋪不存在', 404)
  }

  // 驗證公告格式
  if (!Array.isArray(announcements)) {
    throw new AppError('公告必須是陣列', 400)
  }

  // 檢查每個公告
  for (const announcement of announcements) {
    if (!announcement.title || !announcement.content) {
      throw new AppError('每個公告必須包含標題和內容', 400)
    }
  }

  // 更新公告
  store.announcements = announcements
  await store.save()

  return store
}

/**
 * 獲取店鋪當前狀態（營業中、休息中等）
 * @param {String} storeId - 店鋪ID
 * @returns {Promise<Object>} 店鋪狀態
 */
export const getStoreCurrentStatus = async (storeId) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId)

  if (!store) {
    throw new AppError('店鋪不存在', 404)
  }

  // 檢查店鋪是否啟用
  if (!store.isActive) {
    return { isOpen: false, status: 'closed', message: '店鋪已停業' }
  }

  // 獲取當前時間（使用台灣時區）
  const now = DateTime.now().setZone('Asia/Taipei')
  const currentTimeStr = now.toFormat('HH:mm')

  // 獲取當前星期幾（0=星期日，6=星期六）
  const currentDay = now.weekday % 7 // DateTime 使用 1-7，轉為 0-6

  // 查找今天的營業時間
  const todayHours = store.businessHours?.find((day) => day.day === currentDay)

  // 如果沒有今天的營業時間或今天休息
  if (!todayHours || todayHours.isClosed) {
    return { isOpen: false, status: 'dayOff', message: '今日休息' }
  }

  // 檢查是否在營業時間內
  for (const period of todayHours.periods) {
    if (currentTimeStr >= period.open && currentTimeStr < period.close) {
      return { isOpen: true, status: 'open', message: '營業中' }
    }
  }

  // 不在營業時間內
  return { isOpen: false, status: 'closed', message: '非營業時間' }
}

/**
 * 更新店鋪服務設定
 * @param {String} storeId - 店鋪ID
 * @param {Object} serviceSettings - 服務設定
 * @returns {Promise<Object>} 更新後的店鋪
 */
export const updateStoreServiceSettings = async (storeId, serviceSettings) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId)

  if (!store) {
    throw new AppError('店鋪不存在', 404)
  }

  // 更新服務設定
  const allowedFields = [
    'enableLineOrdering',
    'liffId',
    'showTaxId',
    'provideReceipt',
    'enableDineIn',
    'enableTakeOut',
    'enableDelivery',
    'dineInPrepTime',
    'takeOutPrepTime',
    'deliveryPrepTime',
    'minDeliveryAmount',
    'minDeliveryQuantity',
    'maxDeliveryDistance',
    'advanceOrderDays',
  ]

  allowedFields.forEach((field) => {
    if (serviceSettings[field] !== undefined) {
      store[field] = serviceSettings[field]
    }
  })

  await store.save()

  return store
}
