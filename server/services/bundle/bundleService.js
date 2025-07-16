/**
 * Bundle 服務
 * 處理兌換券綑綁相關的業務邏輯（只處理 Voucher，不涉及 Coupon）
 */

import Bundle from '../../models/Promotion/Bundle.js'
import BundleInstance from '../../models/Promotion/BundleInstance.js'
import VoucherTemplate from '../../models/Promotion/VoucherTemplate.js'
import Order from '../../models/Order/Order.js'
import { AppError } from '../../middlewares/error.js'
import * as imageHelper from '../imageHelper.js'

/**
 * 獲取所有 Bundle
 * @param {String} brandId - 品牌ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Array>} Bundle 列表
 */
export const getAllBundles = async (brandId, options = {}) => {
  const { includeInactive = false, page = 1, limit = 20 } = options

  // 構建查詢條件
  const query = { brand: brandId }

  if (!includeInactive) {
    query.isActive = true
  }

  // 計算分頁
  const skip = (page - 1) * limit

  // 查詢總數
  const total = await Bundle.countDocuments(query)

  // 查詢 Bundle - 只包含 Voucher
  const bundles = await Bundle.find(query)
    .populate({
      path: 'bundleItems.voucherTemplate',
      select: 'name description validityPeriod exchangeDishTemplate',
      populate: {
        path: 'exchangeDishTemplate',
        select: 'name basePrice image',
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    bundles,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage,
    },
  }
}

/**
 * 根據ID獲取 Bundle
 * @param {String} bundleId - Bundle ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} Bundle
 */
export const getBundleById = async (bundleId, brandId) => {
  const bundle = await Bundle.findOne({
    _id: bundleId,
    brand: brandId,
  }).populate({
    path: 'bundleItems.voucherTemplate',
    select: 'name description validityPeriod exchangeDishTemplate',
    populate: {
      path: 'exchangeDishTemplate',
      select: 'name basePrice image description tags',
    },
  })

  if (!bundle) {
    throw new AppError('Bundle 不存在或無權訪問', 404)
  }

  return bundle
}

/**
 * 創建 Bundle
 * @param {Object} bundleData - Bundle 數據
 * @returns {Promise<Object>} 創建的 Bundle
 */
export const createBundle = async (bundleData) => {
  // === 第一階段：基本驗證 ===
  if (!bundleData.name || !bundleData.description) {
    throw new AppError('名稱和描述為必填欄位', 400)
  }

  if (!bundleData.bundleItems || bundleData.bundleItems.length === 0) {
    throw new AppError('至少需要一個兌換券項目', 400)
  }

  // 驗證至少有一種價格設定
  const hasCashPrice =
    bundleData.cashPrice && (bundleData.cashPrice.selling || bundleData.cashPrice.original)
  const hasPointPrice =
    bundleData.pointPrice && (bundleData.pointPrice.selling || bundleData.pointPrice.original)

  if (!hasCashPrice && !hasPointPrice) {
    throw new AppError('至少需要設定現金價格或點數價格其中一種', 400)
  }

  // 圖片驗證邏輯 - 圖片為必需
  const hasImageData = bundleData.imageData
  const hasExistingImage = bundleData.image && bundleData.image.url && bundleData.image.key

  if (!hasImageData && !hasExistingImage) {
    throw new AppError('請提供圖片', 400)
  }

  // === 第二階段：資料庫驗證 ===
  // 檢查兌換券模板
  for (const item of bundleData.bundleItems) {
    if (!item.voucherTemplate) {
      throw new AppError('兌換券模板ID為必填欄位', 400)
    }

    const voucherTemplate = await VoucherTemplate.findOne({
      _id: item.voucherTemplate,
      brand: bundleData.brand,
    }).populate('exchangeDishTemplate', 'name basePrice')

    if (!voucherTemplate) {
      throw new AppError(`兌換券模板 ${item.voucherTemplate} 不存在或不屬於此品牌`, 404)
    }

    if (!voucherTemplate.isActive) {
      throw new AppError(`兌換券模板 ${voucherTemplate.name} 已停用，無法使用`, 400)
    }

    // 設置冗餘的券名稱
    item.voucherName = voucherTemplate.name

    // 驗證數量
    if (!item.quantity || item.quantity < 1) {
      throw new AppError(`兌換券 ${voucherTemplate.name} 的數量必須大於 0`, 400)
    }
  }

  // === 第三階段：圖片上傳 ===
  if (bundleData.imageData) {
    try {
      const imageInfo = await imageHelper.uploadAndProcessImage(
        bundleData.imageData,
        `bundles/${bundleData.brand}`,
      )

      bundleData.image = imageInfo
      delete bundleData.imageData
    } catch (error) {
      throw new AppError(`圖片處理失敗: ${error.message}`, 400)
    }
  }

  // === 第四階段：創建 Bundle ===
  try {
    const newBundle = new Bundle(bundleData)
    await newBundle.save()

    // populate 完整資訊後返回
    const populatedBundle = await Bundle.findById(newBundle._id).populate({
      path: 'bundleItems.voucherTemplate',
      select: 'name description validityPeriod exchangeDishTemplate',
      populate: {
        path: 'exchangeDishTemplate',
        select: 'name basePrice image',
      },
    })

    return populatedBundle
  } catch (error) {
    // 清理失敗時產生的圖片
    if (bundleData.image && bundleData.image.key && bundleData.imageData !== undefined) {
      try {
        await imageHelper.deleteImage(bundleData.image.key)
      } catch (cleanupError) {
        console.error(`清理孤兒圖片失敗: ${cleanupError.message}`)
      }
    }
    throw error
  }
}

/**
 * 更新 Bundle
 * @param {String} bundleId - Bundle ID
 * @param {Object} updateData - 更新數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 更新後的 Bundle
 */
export const updateBundle = async (bundleId, updateData, brandId) => {
  // 檢查 Bundle 是否存在且屬於該品牌，並預載入相關的 dish 圖片資訊
  const bundle = await Bundle.findOne({
    _id: bundleId,
    brand: brandId,
  }).populate({
    path: 'bundleItems.voucherTemplate',
    populate: {
      path: 'exchangeDishTemplate',
      select: 'image',
    },
  })

  if (!bundle) {
    throw new AppError('Bundle 不存在或無權訪問', 404)
  }

  // 處理圖片更新
  if (updateData.imageData) {
    try {
      let currentImageKey = bundle.image?.key

      // 檢查當前圖片是否與任何 dish 圖片共享同一個 key
      const isSharedWithDish = bundle.bundleItems.some(
        (item) => item.voucherTemplate?.exchangeDishTemplate?.image?.key === currentImageKey,
      )

      if (isSharedWithDish && currentImageKey) {
        // 如果與 dish 共享圖片，直接創建新的獨立圖片，不刪除舊圖片
        console.log(
          `Bundle ${bundle.name} 的圖片與 dish 共享 (key: ${currentImageKey})，創建獨立的新圖片`,
        )

        const imageInfo = await imageHelper.uploadAndProcessImage(
          updateData.imageData,
          `bundles/${brandId}`,
        )
        updateData.image = imageInfo

        console.log(`為 Bundle ${bundle.name} 創建了新的獨立圖片 (key: ${imageInfo.key})`)
      } else {
        // Bundle 有獨立圖片或沒有圖片，使用正常的更新邏輯
        if (bundle.image && bundle.image.key) {
          console.log(`Bundle ${bundle.name} 使用獨立圖片，進行正常更新`)
          const imageInfo = await imageHelper.updateImage(
            updateData.imageData,
            bundle.image.key,
            `bundles/${brandId}`,
          )
          updateData.image = imageInfo
        } else {
          // 如果不存在舊圖片，則上傳新圖片
          console.log(`Bundle ${bundle.name} 沒有現有圖片，上傳新圖片`)
          const imageInfo = await imageHelper.uploadAndProcessImage(
            updateData.imageData,
            `bundles/${brandId}`,
          )
          updateData.image = imageInfo
        }
      }

      // 刪除原始圖片數據
      delete updateData.imageData
    } catch (error) {
      throw new AppError(`圖片處理失敗: ${error.message}`, 400)
    }
  }

  if (updateData.hasOwnProperty('cashPrice')) {
    if (updateData.cashPrice === null) {
      // 前端明確要求清除現金價格
      bundle.cashPrice = undefined
      delete updateData.cashPrice // 避免後續被覆蓋
    }
  }

  if (updateData.hasOwnProperty('pointPrice')) {
    if (updateData.pointPrice === null) {
      // 前端明確要求清除點數價格
      bundle.pointPrice = undefined
      delete updateData.pointPrice // 避免後續被覆蓋
    }
  }

  // 如果更新了價格，驗證至少有一種價格
  if (updateData.cashPrice !== undefined || updateData.pointPrice !== undefined) {
    const finalCashPrice = updateData.cashPrice || bundle.cashPrice
    const finalPointPrice = updateData.pointPrice || bundle.pointPrice

    const hasCashPrice = finalCashPrice && (finalCashPrice.selling || finalCashPrice.original)
    const hasPointPrice = finalPointPrice && (finalPointPrice.selling || finalPointPrice.original)

    if (!hasCashPrice && !hasPointPrice) {
      throw new AppError('至少需要設定現金價格或點數價格其中一種', 400)
    }
  }

  // 如果更新了 bundleItems，驗證券模板
  if (updateData.bundleItems) {
    for (const item of updateData.bundleItems) {
      if (!item.voucherTemplate) {
        throw new AppError('兌換券模板ID為必填欄位', 400)
      }

      const voucherTemplate = await VoucherTemplate.findOne({
        _id: item.voucherTemplate,
        brand: brandId,
      })

      if (!voucherTemplate) {
        throw new AppError(`兌換券模板 ${item.voucherTemplate} 不存在或不屬於此品牌`, 404)
      }

      // 設置冗餘的券名稱
      item.voucherName = voucherTemplate.name

      // 驗證數量
      if (!item.quantity || item.quantity < 1) {
        throw new AppError(`兌換券 ${voucherTemplate.name} 的數量必須大於 0`, 400)
      }
    }
  }

  // 更新 Bundle
  Object.keys(updateData).forEach((key) => {
    bundle[key] = updateData[key]
  })

  await bundle.save()

  return bundle
}

/**
 * 刪除 Bundle
 * @param {String} bundleId - Bundle ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteBundle = async (bundleId, brandId) => {
  // 預載入相關的 dish 圖片資訊，以便檢查圖片共享
  const bundle = await Bundle.findOne({
    _id: bundleId,
    brand: brandId,
  }).populate({
    path: 'bundleItems.voucherTemplate',
    populate: {
      path: 'exchangeDishTemplate',
      select: 'image',
    },
  })

  if (!bundle) {
    throw new AppError('Bundle 不存在或無權訪問', 404)
  }

  // 檢查是否有關聯的訂單
  const relatedOrders = await Order.countDocuments({
    'items.bundle': bundleId,
  })

  if (relatedOrders > 0) {
    throw new AppError('此Bundle已有相關訂單，無法刪除', 400)
  }

  // 智慧圖片刪除邏輯
  if (bundle.image && bundle.image.key) {
    try {
      const currentImageKey = bundle.image.key

      // 檢查當前圖片是否與任何 dish 圖片共享同一個 key
      const isSharedWithDish = bundle.bundleItems.some(
        (item) => item.voucherTemplate?.exchangeDishTemplate?.image?.key === currentImageKey,
      )

      if (!isSharedWithDish) {
        await imageHelper.deleteImage(bundle.image.key)
      }
    } catch (error) {
      // 圖片刪除失敗不影響 Bundle 刪除，只記錄警告
      console.warn(`刪除 Bundle ${bundle.name} 的圖片時發生錯誤:`, error)
    }
  }

  // 刪除 Bundle 記錄
  await bundle.deleteOne()

  return { success: true, message: 'Bundle已刪除' }
}

/**
 * 檢查用戶購買限制
 * @param {String} bundleId - Bundle ID
 * @param {String} userId - 用戶 ID
 * @returns {Promise<Object>} 購買限制檢查結果
 */
export const checkPurchaseLimit = async (bundleId, userId) => {
  try {
    // 1. 查找 Bundle 模板
    const bundle = await Bundle.findById(bundleId)

    if (!bundle) {
      throw new AppError('包裝商品不存在', 404)
    }

    // 2. 如果沒有購買限制，直接返回可購買
    if (!bundle.purchaseLimitPerUser) {
      return {
        canPurchase: true,
        remainingLimit: null,
        purchasedCount: 0,
        totalLimit: null,
        message: '無購買限制',
      }
    }

    // 3. 查詢用戶已購買的該 Bundle 實例數量
    const purchasedCount = await BundleInstance.countDocuments({
      templateId: bundleId,
      user: userId,
    })

    // 4. 計算剩餘可購買數量
    const remainingLimit = Math.max(0, bundle.purchaseLimitPerUser - purchasedCount)
    const canPurchase = remainingLimit > 0

    return {
      canPurchase,
      remainingLimit,
      purchasedCount,
      totalLimit: bundle.purchaseLimitPerUser,
    }
  } catch (error) {
    console.error('檢查購買限制時發生錯誤:', error)
    throw new AppError(`檢查購買限制失敗: ${error.message}`, 500)
  }
}

/**
 * 自動為沒有Bundle包裝的兌換券模板創建單一Bundle包裝
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 創建結果統計
 */
export const autoCreateBundlesForVouchers = async (brandId) => {
  try {
    // 1. 獲取所有該品牌的兌換券模板
    const allVoucherTemplates = await VoucherTemplate.find({
      brand: brandId,
      isActive: true,
    }).populate('exchangeDishTemplate', 'name basePrice image')

    // 2. 獲取已經有Bundle包裝的兌換券模板ID列表
    const existingBundles = await Bundle.find({
      brand: brandId,
      'bundleItems.quantity': 1, // 只有一個兌換券的Bundle
      bundleItems: { $size: 1 }, // 只有一個bundleItem
    }).select('bundleItems.voucherTemplate')

    const existingVoucherIds = new Set(
      existingBundles.flatMap((bundle) =>
        bundle.bundleItems.map((item) => item.voucherTemplate.toString()),
      ),
    )

    // 3. 找出沒有Bundle包裝的兌換券模板
    const vouchersWithoutBundles = allVoucherTemplates.filter(
      (voucher) => !existingVoucherIds.has(voucher._id.toString()),
    )

    // 4. 為沒有Bundle的兌換券創建單一Bundle包裝
    const newBundles = []
    const skippedVouchers = [] // 記錄跳過的兌換券

    for (const voucher of vouchersWithoutBundles) {
      const dish = voucher.exchangeDishTemplate
      if (!dish) {
        console.warn(`兌換券 ${voucher.name} 沒有關聯的餐點模板，跳過`)
        skippedVouchers.push({
          voucherName: voucher.name,
          reason: '沒有關聯的餐點模板',
        })
        continue
      }

      // 處理Bundle圖片
      let bundleImageInfo = null

      if (dish.image && dish.image.url && dish.image.key) {
        // 方法1：直接重複使用餐點圖片的URL和key（共享圖片）
        bundleImageInfo = {
          url: dish.image.url,
          key: dish.image.key,
          alt: `${voucher.name} bundle image`,
        }
      } else {
        // 沒有圖片的情況下跳過這個兌換券
        console.warn(`兌換券 ${voucher.name} 對應的餐點沒有圖片，跳過`)
        skippedVouchers.push({
          voucherName: voucher.name,
          reason: '餐點沒有圖片',
        })
        continue
      }

      const bundleData = {
        brand: brandId,
        name: voucher.name,
        description: `單個 ${voucher.name}`,
        image: bundleImageInfo, // 確保圖片資訊存在
        bundleItems: [
          {
            voucherTemplate: voucher._id,
            quantity: 1,
            voucherName: voucher.name,
          },
        ],
        // 設定價格，基於餐點價格
        cashPrice: {
          original: dish.basePrice,
        },
        pointPrice: {
          original: Math.ceil(dish.basePrice / 100), // 假設10元=1點的轉換率
        },
        voucherValidityDays: 30, // 預設30天有效期
        isActive: true,
      }

      try {
        const newBundle = new Bundle(bundleData)
        await newBundle.save()
        newBundles.push(newBundle)
      } catch (saveError) {
        console.error(`創建Bundle失敗 - 兌換券: ${voucher.name}`, saveError)
        skippedVouchers.push({
          voucherName: voucher.name,
          reason: `創建失敗: ${saveError.message}`,
        })
      }
    }

    // 5. 準備回傳的統計資訊
    const statistics = {
      totalVouchers: allVoucherTemplates.length, // 總兌換券數量
      existingCount: existingBundles.length, // 已有Bundle的數量
      createdCount: newBundles.length, // 成功建立的數量
      skippedCount: skippedVouchers.length, // 跳過的數量
      finalTotal: existingBundles.length + newBundles.length, // 處理後的總數量
    }

    const createdBundlesInfo = newBundles.map((bundle) => {
      const voucher = vouchersWithoutBundles.find(
        (v) => bundle.bundleItems[0].voucherTemplate.toString() === v._id.toString(),
      )
      return {
        id: bundle._id,
        name: bundle.name,
        voucherName: voucher?.name,
        dishName: voucher?.exchangeDishTemplate?.name,
        cashPrice: bundle.cashPrice?.selling || bundle.cashPrice?.original,
        pointPrice: bundle.pointPrice?.selling || bundle.pointPrice?.original,
      }
    })

    return {
      success: true,
      statistics,
      createdBundles: createdBundlesInfo,
      skippedVouchers, // 新增：回傳跳過的兌換券資訊
    }
  } catch (error) {
    console.error('自動創建Bundle包裝時發生錯誤:', error)
    throw new AppError(`自動創建Bundle包裝失敗: ${error.message}`, 500)
  }
}

/**
 * 驗證 Bundle 購買資格
 * @param {String} bundleId - Bundle ID
 * @param {String} userId - 用戶 ID
 * @param {Number} quantity - 購買數量
 * @param {String} storeId - 店鋪 ID
 * @returns {Promise<void>} 驗證通過或拋出錯誤
 */
export const validateBundlePurchase = async (bundleId, userId, quantity, storeId) => {
  // 1. 查找 Bundle 模板
  const bundle = await Bundle.findById(bundleId)

  if (!bundle) {
    throw new AppError('Bundle 不存在', 404)
  }

  if (!bundle.isActive) {
    throw new AppError('Bundle 已停用', 400)
  }

  // 2. 檢查購買數量限制
  if (bundle.purchaseLimitPerUser && userId) {
    const purchasedCount = await BundleInstance.countDocuments({
      templateId: bundleId,
      user: userId,
    })

    const remainingLimit = Math.max(0, bundle.purchaseLimitPerUser - purchasedCount)

    if (quantity > remainingLimit) {
      throw new AppError(`購買數量超過限制，您還可以購買 ${remainingLimit} 個`, 400)
    }
  }

  return true
}
