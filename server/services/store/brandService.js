/**
 * 品牌服務
 * 處理品牌相關業務邏輯
 */

import Brand from '../../models/Brand/Brand.js'
import Store from '../../models/Store/Store.js'
import { AppError } from '../../middlewares/error.js'
import * as imageHelper from '../imageHelper.js'

/**
 * 獲取所有品牌
 * @returns {Promise<Array>} 品牌列表
 */
export const getAllBrands = async () => {
  // 查詢品牌，移除分頁
  const brands = await Brand.find().sort({ name: 1 })

  return brands
}

/**
 * 根據ID獲取品牌
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 品牌
 */
export const getBrandById = async (brandId) => {
  const brand = await Brand.findById(brandId)

  if (!brand) {
    throw new AppError('品牌不存在', 404)
  }

  return brand
}

/**
 * 創建品牌
 * @param {Object} brandData - 品牌數據
 * @returns {Promise<Object>} 創建的品牌
 */
export const createBrand = async (brandData) => {
  // 基本驗證
  if (!brandData.name) {
    throw new AppError('品牌名稱為必填欄位', 400)
  }

  // 檢查名稱是否已存在
  const existingBrand = await Brand.findOne({ name: brandData.name })
  if (existingBrand) {
    throw new AppError('此品牌名稱已存在', 400)
  }

  // 處理圖片上傳
  if (brandData.imageData) {
    try {
      // 創建臨時ID用於圖片路徑
      const tempId = new Date().getTime()

      // 上傳圖片並獲取圖片資訊
      const imageInfo = await imageHelper.uploadAndProcessImage(
        brandData.imageData,
        `brands/${tempId}`, // 創建品牌時還沒有ID，使用時間戳
      )

      // 設置圖片資訊到品牌數據
      brandData.image = imageInfo

      // 刪除原始圖片數據以避免儲存過大的文件
      delete brandData.imageData
    } catch (error) {
      throw new AppError(`圖片處理失敗: ${error.message}`, 400)
    }
  }

  // 創建品牌
  const newBrand = new Brand(brandData)
  await newBrand.save()

  // 如果有圖片且使用了臨時ID，則更新圖片路徑為實際的品牌ID
  if (newBrand.image && newBrand.image.key) {
    try {
      const oldKey = newBrand.image.key
      const newKey = oldKey.replace(/brands\/\d+/, `brands/${newBrand._id}`)

      // 只有當路徑不同時才需要更新
      if (oldKey !== newKey) {
        const imageInfo = await imageHelper.updateImage(
          null, // 不需要上傳新圖片，只需要更新路徑
          oldKey,
          `brands/${newBrand._id}`,
        )

        newBrand.image = imageInfo
        await newBrand.save()
      }
    } catch (error) {
      console.error(`更新品牌圖片路徑失敗: ${error.message}`)
      // 不影響品牌創建，只記錄錯誤
    }
  }

  return newBrand
}

/**
 * 更新品牌
 * @param {String} brandId - 品牌ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的品牌
 */
export const updateBrand = async (brandId, updateData) => {
  // 檢查品牌是否存在
  const brand = await Brand.findById(brandId)

  if (!brand) {
    throw new AppError('品牌不存在', 404)
  }

  // 檢查名稱是否已存在（如果要更新名稱）
  if (updateData.name && updateData.name !== brand.name) {
    const existingBrand = await Brand.findOne({
      name: updateData.name,
      _id: { $ne: brandId },
    })

    if (existingBrand) {
      throw new AppError('此品牌名稱已存在', 400)
    }
  }

  // 處理圖片更新
  if (updateData.imageData) {
    try {
      // 如果存在舊圖片，則更新圖片
      if (brand.image && brand.image.key) {
        const imageInfo = await imageHelper.updateImage(
          updateData.imageData,
          brand.image.key,
          `brands/${brandId}`,
        )
        updateData.image = imageInfo
      } else {
        // 如果不存在舊圖片，則上傳新圖片
        const imageInfo = await imageHelper.uploadAndProcessImage(
          updateData.imageData,
          `brands/${brandId}`,
        )
        updateData.image = imageInfo
      }

      // 刪除原始圖片數據
      delete updateData.imageData
    } catch (error) {
      throw new AppError(`圖片處理失敗: ${error.message}`, 400)
    }
  }

  // 更新品牌
  Object.keys(updateData).forEach((key) => {
    brand[key] = updateData[key]
  })

  await brand.save()

  return brand
}

/**
 * 刪除品牌
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteBrand = async (brandId) => {
  // 檢查品牌是否存在
  const brand = await Brand.findById(brandId)

  if (!brand) {
    throw new AppError('品牌不存在', 404)
  }

  // 檢查是否有關聯的店鋪
  const storesCount = await Store.countDocuments({ brand: brandId })

  if (storesCount > 0) {
    throw new AppError('此品牌下有關聯的店鋪，無法刪除', 400)
  }

  // 刪除關聯圖片
  if (brand.image && brand.image.key) {
    try {
      await imageHelper.deleteImage(brand.image.key)
    } catch (error) {
      console.error(`刪除品牌圖片失敗: ${error.message}`)
      // 繼續刪除品牌，不因圖片刪除失敗而中斷流程
    }
  }

  await brand.deleteOne()

  return { success: true, message: '品牌已刪除' }
}

/**
 * 獲取品牌下的所有店鋪
 * @param {String} brandId - 品牌ID
 * @param {Object} options - 查詢選項
 * @param {Boolean} options.activeOnly - 是否只顯示啟用的店鋪
 * @returns {Promise<Object>} 店鋪列表與品牌資訊
 */
export const getBrandStores = async (brandId, options = {}) => {
  // 檢查品牌是否存在
  const brand = await Brand.findById(brandId)

  if (!brand) {
    throw new AppError('品牌不存在', 404)
  }

  const { activeOnly = false } = options

  // 構建查詢條件
  const queryConditions = { brand: brandId }

  if (activeOnly) {
    queryConditions.isActive = true
  }

  // 查詢店鋪
  const stores = await Store.find(queryConditions).populate('menuId', 'name').sort({ name: 1 })

  return {
    brand: {
      _id: brand._id,
      name: brand.name,
    },
    stores,
  }
}

/**
 * 獲取品牌統計數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 統計數據
 */
export const getBrandStats = async (brandId) => {
  // 檢查品牌是否存在
  const brand = await Brand.findById(brandId)

  if (!brand) {
    throw new AppError('品牌不存在', 404)
  }

  // 獲取店鋪數量
  const storesCount = await Store.countDocuments({ brand: brandId })

  // 獲取啟用的店鋪數量
  const activeStoresCount = await Store.countDocuments({
    brand: brandId,
    isActive: true,
  })

  // TODO: 其他統計數據（訂單數、銷售額等），根據實際需求添加

  return {
    brand: {
      _id: brand._id,
      name: brand.name,
    },
    stats: {
      storesCount,
      activeStoresCount,
      // 其他統計數據
    },
  }
}

/**
 * 切換品牌啟用狀態
 * @param {String} brandId - 品牌ID
 * @param {Boolean} isActive - 啟用狀態
 * @returns {Promise<Object>} 更新後的品牌
 */
export const toggleBrandActive = async (brandId, isActive) => {
  // 檢查品牌是否存在
  const brand = await Brand.findById(brandId)

  if (!brand) {
    throw new AppError('品牌不存在', 404)
  }

  brand.isActive = isActive
  await brand.save()

  return brand
}
