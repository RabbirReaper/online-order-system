/**
 * Bundle 實例服務
 * 處理 Bundle 實例相關業務邏輯
 */

import BundleInstance from '../../models/Promotion/BundleInstance.js'
import Bundle from '../../models/Promotion/Bundle.js'
import VoucherTemplate from '../../models/Promotion/VoucherTemplate.js'
import VoucherInstance from '../../models/Promotion/VoucherInstance.js'
import { AppError } from '../../middlewares/error.js'
import * as pointService from '../promotion/pointService.js'

/**
 * 根據ID獲取 Bundle 實例
 * @param {String} instanceId - 實例ID
 * @param {String} brandId - 品牌ID（用於權限驗證）
 * @returns {Promise<Object>} Bundle 實例
 */
export const getInstanceById = async (instanceId, brandId = null) => {
  const query = { _id: instanceId }

  // 如果提供了 brandId，加入品牌驗證
  if (brandId) {
    query.brand = brandId
  }

  const instance = await BundleInstance.findOne(query).populate('templateId', 'name description')

  if (!instance) {
    throw new AppError('Bundle 實例不存在或無權訪問', 404)
  }

  return instance
}

/**
 * 創建 Bundle 實例
 * @param {Object} instanceData - 實例數據
 * @returns {Promise<Object>} 創建的 Bundle 實例
 */
export const createInstance = async (instanceData) => {
  // 基本驗證
  if (!instanceData.templateId) {
    throw new AppError('Bundle 模板ID為必填欄位', 400)
  }

  if (!instanceData.brand) {
    throw new AppError('品牌ID為必填欄位', 400)
  }

  // 查找對應的 Bundle 模板
  const template = await Bundle.findOne({
    _id: instanceData.templateId,
    brand: instanceData.brand,
  }).populate('bundleItems.voucherTemplate')

  if (!template) {
    throw new AppError('Bundle 模板不存在或無權訪問', 404)
  }

  // 檢查模板是否啟用
  if (!template.isActive) {
    throw new AppError('Bundle 模板已停用，無法創建實例', 400)
  }

  // 添加冗餘模板信息
  instanceData.name = template.name
  instanceData.description = template.description

  // 使用新的價格結構
  instanceData.cashPrice = template.cashPrice
  instanceData.pointPrice = template.pointPrice
  instanceData.voucherValidityDays = template.voucherValidityDays

  // 複製 Bundle 項目資訊（只保留快照，不保留引用）
  instanceData.bundleItems = template.bundleItems.map((item) => ({
    quantity: item.quantity,
    voucherName: item.voucherName,
  }))

  // Bundle 的最終價格根據付款方式決定
  // 這裡需要根據實際的購買方式來設定
  if (instanceData.paymentMethod === 'points' && template.pointPrice) {
    instanceData.finalPrice = template.pointPrice.selling || template.pointPrice.original || 0
  } else if (template.cashPrice) {
    instanceData.finalPrice = template.cashPrice.selling || template.cashPrice.original || 0
  } else if (template.pointPrice) {
    instanceData.finalPrice = template.pointPrice.selling || template.pointPrice.original || 0
  } else {
    throw new AppError('Bundle 模板沒有設定有效的價格', 400)
  }

  // 創建 Bundle 實例
  const newInstance = new BundleInstance(instanceData)
  await newInstance.save()

  // 返回完整的實例資料
  const populatedInstance = await BundleInstance.findById(newInstance._id).populate(
    'templateId',
    'name description',
  )

  return populatedInstance
}

/**
 * 使用點數兌換 Bundle
 * @param {String} bundleId - Bundle ID
 * @param {String} userId - 用戶 ID
 * @param {String} brandId - 品牌 ID
 * @returns {Promise<Object>} 兌換結果
 */
export const redeemBundleWithPoints = async (bundleId, userId, brandId) => {
  try {
    console.log(
      `Starting bundle redemption: bundleId=${bundleId}, userId=${userId}, brandId=${brandId}`,
    )

    // 1. 檢查 Bundle 是否存在且可用點數兌換
    const bundle = await Bundle.findOne({
      _id: bundleId,
      brand: brandId,
      isActive: true,
    }).populate('bundleItems.voucherTemplate')

    if (!bundle) {
      throw new AppError('Bundle 不存在、已停用或無權訪問', 404)
    }

    // 檢查是否有設定點數價格
    const pointsRequired = bundle.pointPrice?.selling || bundle.pointPrice?.original
    if (!pointsRequired || pointsRequired <= 0) {
      throw new AppError('此 Bundle 不支援點數兌換', 400)
    }

    console.log(`Points required: ${pointsRequired}`)

    // 2. 檢查用戶點數餘額
    const userPointsBalance = await pointService.getUserPointsBalance(userId, brandId)
    console.log(`User points balance: ${userPointsBalance}`)

    if (userPointsBalance < pointsRequired) {
      throw new AppError(
        `點數不足，需要 ${pointsRequired} 點，您目前有 ${userPointsBalance} 點`,
        400,
      )
    }

    // 3. 檢查購買限制
    if (bundle.purchaseLimitPerUser) {
      const purchasedCount = await BundleInstance.countDocuments({
        templateId: bundleId,
        user: userId,
      })

      if (purchasedCount >= bundle.purchaseLimitPerUser) {
        throw new AppError(`已達到購買限制，每人限購 ${bundle.purchaseLimitPerUser} 個`, 400)
      }
    }

    // 4. 創建 BundleInstance (需要先創建才能獲得 ID)
    const bundleInstanceData = {
      templateId: bundleId,
      brand: brandId,
      user: userId,
      paymentMethod: 'points',
      finalPrice: pointsRequired,
      purchasedAt: new Date(),
    }

    const bundleInstance = await createInstance(bundleInstanceData)
    console.log(`BundleInstance created: ${bundleInstance._id}`)

    // 5. 扣除點數 (使用新的 usageInfo 格式)
    const usageInfo = {
      model: 'BundleRedemption',
      id: bundleInstance._id,
    }

    try {
      const pointsResult = await pointService.usePoints(userId, brandId, pointsRequired, usageInfo)
      console.log(`Points deducted: ${pointsResult.pointsUsed}`)
    } catch (pointsError) {
      // 如果扣除點數失敗，需要清理已創建的 BundleInstance
      console.error('Points deduction failed, cleaning up BundleInstance:', pointsError)
      await BundleInstance.findByIdAndDelete(bundleInstance._id)
      throw pointsError
    }

    // TODO: 新增交易記錄表 (PointTransaction) 來記錄 brand, user, 點數兌換 bundleInstance 的詳細資訊
    // 包含：交易類型、交易金額(點數)、關聯的 bundleInstance、交易時間等
    // 表結構建議：
    // - brand: ObjectId
    // - user: ObjectId
    // - transactionType: String (enum: ['earn', 'redeem'])
    // - amount: Number (點數數量)
    // - relatedModel: String (例如: 'BundleInstance', 'Order')
    // - relatedId: ObjectId
    // - description: String
    // - createdAt: Date

    // 6. 生成 VoucherInstance
    await generateVouchersForBundle(bundleInstance._id, brandId, userId)
    console.log('VoucherInstances generated')

    // 7. 更新 Bundle 統計
    await Bundle.findByIdAndUpdate(bundleId, {
      $inc: { totalSold: 1 },
    })
    console.log('Bundle statistics updated')

    // 返回兌換結果
    const result = {
      success: true,
      message: '點數兌換成功',
      bundleInstance: bundleInstance,
      pointsUsed: pointsRequired,
      remainingPoints: userPointsBalance - pointsRequired,
    }

    console.log('Bundle redemption completed successfully')
    return result
  } catch (error) {
    console.error('Bundle redemption failed:', error)
    throw error
  }
}

/**
 * 拆解 Bundle 生成 VoucherInstance
 * @param {String} bundleInstanceId - Bundle 實例 ID
 * @param {String} brandId - 品牌 ID
 * @param {String} userId - 用戶 ID
 */
export const generateVouchersForBundle = async (bundleInstanceId, brandId, userId) => {
  const bundleInstance = await BundleInstance.findById(bundleInstanceId)

  if (!bundleInstance) {
    throw new AppError('Bundle 實例不存在', 404)
  }

  // 取得 Bundle 模板資訊
  const bundleTemplate = await Bundle.findById(bundleInstance.templateId).populate(
    'bundleItems.voucherTemplate',
  )

  if (!bundleTemplate) {
    throw new AppError('Bundle 模板不存在', 404)
  }

  // 🔧 記錄每個模板生成的數量，用於批量更新
  const templateIssueCount = new Map()

  console.log(`Generating vouchers for bundle: ${bundleInstance.name}`)

  // 拆解 Bundle 中的每個 VoucherTemplate
  for (const bundleVoucherItem of bundleTemplate.bundleItems) {
    // 根據兌換券模板生成兌換券實例
    for (let j = 0; j < bundleVoucherItem.quantity; j++) {
      const voucherInstance = new VoucherInstance({
        brand: brandId,
        template: bundleVoucherItem.voucherTemplate._id,
        voucherName: bundleVoucherItem.voucherTemplate.name,
        exchangeDishTemplate: bundleVoucherItem.voucherTemplate.exchangeDishTemplate,
        user: userId,
        acquiredAt: new Date(),
        createdBy: bundleInstance._id, // 設定創建來源
      })

      // 設置過期日期（購買時間 + Bundle 設定的有效期天數）
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + bundleInstance.voucherValidityDays)
      voucherInstance.expiryDate = expiryDate

      await voucherInstance.save()

      // 🔧 記錄該模板的發行數量
      const templateId = bundleVoucherItem.voucherTemplate._id.toString()
      templateIssueCount.set(templateId, (templateIssueCount.get(templateId) || 0) + 1)
    }
  }

  // 🔧 批量更新 VoucherTemplate 的 totalIssued 欄位
  for (const [templateId, count] of templateIssueCount) {
    try {
      await VoucherTemplate.findByIdAndUpdate(
        templateId,
        { $inc: { totalIssued: count } },
        { new: true },
      )
      console.log(`✅ Updated VoucherTemplate ${templateId} totalIssued by +${count}`)
    } catch (updateError) {
      console.error(`❌ Failed to update VoucherTemplate ${templateId} totalIssued:`, updateError)
      // 不拋出錯誤，避免影響主要流程，但記錄錯誤
    }
  }

  console.log(`✅ Generated vouchers and updated ${templateIssueCount.size} voucher templates`)
}

/**
 * 獲取用戶的 Bundle 實例列表
 * @param {String} userId - 用戶ID
 * @param {String} brandId - 品牌ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} Bundle 實例列表與分頁資訊
 */
export const getUserBundleInstances = async (userId, brandId, options = {}) => {
  const { page = 1, limit = 20 } = options

  // 計算分頁
  const skip = (page - 1) * limit

  // 查詢條件
  const query = {
    user: userId,
    brand: brandId,
  }

  // 查詢總數
  const total = await BundleInstance.countDocuments(query)

  // 查詢實例
  const instances = await BundleInstance.find(query)
    .populate('templateId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    instances,
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
 * 更新 Bundle 實例
 * @param {String} instanceId - 實例ID
 * @param {Object} updateData - 更新數據
 * @param {String} brandId - 品牌ID（用於權限驗證）
 * @returns {Promise<Object>} 更新後的 Bundle 實例
 */
export const updateInstance = async (instanceId, updateData, brandId) => {
  // 檢查實例是否存在且屬於該品牌
  const instance = await BundleInstance.findOne({
    _id: instanceId,
    brand: brandId,
  })

  if (!instance) {
    throw new AppError('Bundle 實例不存在或無權訪問', 404)
  }

  // 防止更改關鍵欄位
  delete updateData.brand
  delete updateData.templateId
  delete updateData.finalPrice

  // 更新實例
  Object.keys(updateData).forEach((key) => {
    instance[key] = updateData[key]
  })

  await instance.save()

  return instance
}

/**
 * 刪除 Bundle 實例
 * @param {String} instanceId - 實例ID
 * @param {String} brandId - 品牌ID（用於權限驗證）
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteInstance = async (instanceId, brandId) => {
  // 檢查實例是否存在且屬於該品牌
  const instance = await BundleInstance.findOne({
    _id: instanceId,
    brand: brandId,
  })

  if (!instance) {
    throw new AppError('Bundle 實例不存在或無權訪問', 404)
  }

  // 檢查是否有關聯的兌換券，如果有則拒絕刪除
  const relatedVouchers = await VoucherInstance.countDocuments({
    createdBy: instanceId,
  })

  if (relatedVouchers > 0) {
    throw new AppError('此 Bundle 實例已生成兌換券，無法刪除', 400)
  }

  await instance.deleteOne()

  return { success: true, message: 'Bundle 實例已刪除' }
}
