/**
 * 平台店鋪服務
 * 處理外送平台店鋪配置相關業務邏輯
 */

import PlatformStore from '../../../models/DeliverPlatform/platformStore.js'
import Store from '../../../models/Store/Store.js'
import Brand from '../../../models/Brand/Brand.js'
import { AppError } from '../../../middlewares/error.js'

/**
 * 獲取所有平台店鋪配置
 * @param {Object} options - 查詢選項
 * @param {String} options.brandId - 品牌ID
 * @param {String} options.storeId - 店鋪ID
 * @param {String} options.platform - 平台類型
 * @param {String} options.status - 營運狀態
 * @returns {Promise<Array>} 平台店鋪配置列表
 */
export const getAllPlatformStores = async (options = {}) => {
  const { brandId, storeId, platform, status } = options

  // 構建查詢條件
  const queryConditions = {}

  if (brandId) {
    queryConditions.brand = brandId
  }

  if (storeId) {
    queryConditions.store = storeId
  }

  if (platform) {
    queryConditions.platform = platform
  }

  if (status) {
    queryConditions.status = status
  }

  // 查詢平台店鋪配置
  const platformStores = await PlatformStore.find(queryConditions)
    .populate('brand', 'name')
    .populate('store', 'name address')
    .sort({ platform: 1, createdAt: -1 })

  return platformStores
}

/**
 * 根據店鋪ID和平台獲取配置
 * @param {String} storeId - 店鋪ID
 * @param {String} platform - 平台類型
 * @returns {Promise<Object>} 平台店鋪配置
 */
export const getPlatformStoreByStoreAndPlatform = async (storeId, platform) => {
  const platformStore = await PlatformStore.findOne({
    store: storeId,
    platform: platform,
  })
    .populate('brand', 'name')
    .populate('store', 'name address')

  if (!platformStore) {
    throw new AppError('該店鋪在此平台的配置不存在', 404)
  }

  return platformStore
}

/**
 * 創建平台店鋪配置
 * @param {Object} platformStoreData - 平台店鋪配置數據
 * @returns {Promise<Object>} 創建的平台店鋪配置
 */
export const createPlatformStore = async (platformStoreData) => {
  // 基本驗證
  if (!platformStoreData.brand) {
    throw new AppError('品牌ID為必填欄位', 400)
  }

  if (!platformStoreData.store) {
    throw new AppError('店鋪ID為必填欄位', 400)
  }

  if (!platformStoreData.platform) {
    throw new AppError('平台類型為必填欄位', 400)
  }

  if (!platformStoreData.platformStoreId) {
    throw new AppError('平台店鋪ID為必填欄位', 400)
  }

  // 驗證平台類型
  const validPlatforms = ['foodpanda', 'ubereats']
  if (!validPlatforms.includes(platformStoreData.platform)) {
    throw new AppError('不支援的平台類型', 400)
  }

  // 驗證品牌是否存在
  const brand = await Brand.findById(platformStoreData.brand)
  if (!brand) {
    throw new AppError('品牌不存在', 404)
  }

  // 驗證店鋪是否存在
  const store = await Store.findById(platformStoreData.store)
  if (!store) {
    throw new AppError('店鋪不存在', 404)
  }

  // 驗證店鋪是否屬於指定品牌
  if (store.brand.toString() !== platformStoreData.brand) {
    throw new AppError('店鋪不屬於指定品牌', 400)
  }

  // 檢查是否已存在相同配置
  const existingConfig = await PlatformStore.findOne({
    brand: platformStoreData.brand,
    store: platformStoreData.store,
    platform: platformStoreData.platform,
  })

  if (existingConfig) {
    throw new AppError('該店鋪在此平台的配置已存在', 400)
  }

  // 設置預設值
  if (platformStoreData.status === undefined) {
    platformStoreData.status = 'OFFLINE'
  }

  if (platformStoreData.prepTime === undefined) {
    platformStoreData.prepTime = 30
  }

  if (platformStoreData.busyPrepTime === undefined) {
    platformStoreData.busyPrepTime = 45
  }

  if (platformStoreData.autoAccept === undefined) {
    platformStoreData.autoAccept = true
  }

  if (!platformStoreData.platformSpecific) {
    platformStoreData.platformSpecific = {}
  }

  // 創建平台店鋪配置
  const newPlatformStore = new PlatformStore(platformStoreData)
  await newPlatformStore.save()

  // 返回包含關聯資料的配置
  return newPlatformStore
}

/**
 * 更新平台店鋪配置
 * @param {String} platformStoreId - 平台店鋪配置ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的平台店鋪配置
 */
export const updatePlatformStore = async (platformStoreId, updateData) => {
  // 檢查配置是否存在
  const platformStore = await PlatformStore.findById(platformStoreId)

  if (!platformStore) {
    throw new AppError('平台店鋪配置不存在', 404)
  }

  // 如果更新品牌，檢查品牌是否存在
  if (updateData.brand) {
    const brand = await Brand.findById(updateData.brand)
    if (!brand) {
      throw new AppError('品牌不存在', 404)
    }
  }

  // 如果更新店鋪，檢查店鋪是否存在
  if (updateData.store) {
    const store = await Store.findById(updateData.store)
    if (!store) {
      throw new AppError('店鋪不存在', 404)
    }

    // 檢查店鋪是否屬於指定品牌
    const brandId = updateData.brand || platformStore.brand
    if (store.brand.toString() !== brandId.toString()) {
      throw new AppError('店鋪不屬於指定品牌', 400)
    }
  }

  // 如果更新平台類型，檢查是否有效
  if (updateData.platform) {
    const validPlatforms = ['foodpanda', 'ubereats']
    if (!validPlatforms.includes(updateData.platform)) {
      throw new AppError('不支援的平台類型', 400)
    }

    // 檢查是否會產生重複配置
    const existingConfig = await PlatformStore.findOne({
      brand: updateData.brand || platformStore.brand,
      store: updateData.store || platformStore.store,
      platform: updateData.platform,
      _id: { $ne: platformStoreId },
    })

    if (existingConfig) {
      throw new AppError('該店鋪在此平台的配置已存在', 400)
    }
  }

  // 驗證狀態
  if (updateData.status) {
    const validStatuses = ['ONLINE', 'BUSY', 'OFFLINE']
    if (!validStatuses.includes(updateData.status)) {
      throw new AppError('不支援的營運狀態', 400)
    }
  }

  // 驗證準備時間
  if (updateData.prepTime !== undefined && updateData.prepTime < 0) {
    throw new AppError('準備時間不能小於0', 400)
  }

  if (updateData.busyPrepTime !== undefined && updateData.busyPrepTime < 0) {
    throw new AppError('忙碌時準備時間不能小於0', 400)
  }

  // 更新配置
  Object.keys(updateData).forEach((key) => {
    platformStore[key] = updateData[key]
  })

  await platformStore.save()

  // 返回包含關聯資料的配置
  return platformStore
}

/**
 * 刪除平台店鋪配置
 * @param {String} platformStoreId - 平台店鋪配置ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deletePlatformStore = async (platformStoreId) => {
  // 檢查配置是否存在
  const platformStore = await PlatformStore.findById(platformStoreId)

  if (!platformStore) {
    throw new AppError('平台店鋪配置不存在', 404)
  }

  // TODO: 檢查是否有關聯的訂單，如果有則拒絕刪除或提示用戶

  await platformStore.deleteOne()

  return { success: true, message: '平台店鋪配置已刪除' }
}

/**
 * 切換平台店鋪營運狀態
 * @param {String} platformStoreId - 平台店鋪配置ID
 * @param {String} status - 營運狀態 (ONLINE, BUSY, OFFLINE)
 * @returns {Promise<Object>} 更新後的平台店鋪配置
 */
export const togglePlatformStoreStatus = async (platformStoreId, status) => {
  // 檢查配置是否存在
  const platformStore = await PlatformStore.findById(platformStoreId)

  if (!platformStore) {
    throw new AppError('平台店鋪配置不存在', 404)
  }

  // 驗證狀態
  const validStatuses = ['ONLINE', 'BUSY', 'OFFLINE']
  if (!validStatuses.includes(status)) {
    throw new AppError('不支援的營運狀態', 400)
  }

  platformStore.status = status
  await platformStore.save()

  // 返回包含關聯資料的配置
  return platformStore
}

/**
 * 更新菜單同步時間
 * @param {String} platformStoreId - 平台店鋪配置ID
 * @returns {Promise<Object>} 更新後的平台店鋪配置
 */
export const updateMenuSyncTime = async (platformStoreId) => {
  // 檢查配置是否存在
  const platformStore = await PlatformStore.findById(platformStoreId)

  if (!platformStore) {
    throw new AppError('平台店鋪配置不存在', 404)
  }

  platformStore.menuLastSync = new Date()
  await platformStore.save()

  // 返回包含關聯資料的配置
  return platformStore
}
