/**
 * 優惠券服務 - 完全獨立的 Coupon 系統
 * 只處理折價券相關邏輯，與 Bundle/Voucher 系統完全分離
 * Coupon 只送不賣，用於活動獎勵
 */

import mongoose from 'mongoose'
import CouponTemplate from '../../models/Promotion/CouponTemplate.js'
import CouponInstance from '../../models/Promotion/CouponInstance.js'
import { AppError } from '../../middlewares/error.js'

/**
 * 獲取所有優惠券模板
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Array>} 所有優惠券模板
 */
export const getAllCouponTemplates = async (brandId) => {
  const templates = await CouponTemplate.find({ brand: brandId }).sort({ createdAt: -1 })
  return templates
}

/**
 * 根據ID獲取優惠券模板
 * @param {String} templateId - 模板ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 優惠券模板
 */
export const getCouponTemplateById = async (templateId, brandId) => {
  const template = await CouponTemplate.findOne({
    _id: templateId,
    brand: brandId,
  })

  if (!template) {
    throw new AppError('優惠券模板不存在或無權訪問', 404)
  }

  return template
}

/**
 * 創建優惠券模板
 * @param {Object} templateData - 模板數據
 * @returns {Promise<Object>} 創建的優惠券模板
 */
export const createCouponTemplate = async (templateData) => {
  // 驗證必要欄位
  if (!templateData.name || !templateData.validityPeriod) {
    throw new AppError('名稱和有效期為必填欄位', 400)
  }

  // 驗證折扣資訊 (Coupon 系統只處理折扣，不處理兌換)
  if (
    !templateData.discountInfo ||
    !templateData.discountInfo.discountType ||
    !templateData.discountInfo.discountValue
  ) {
    throw new AppError('折扣券必須提供折扣類型和折扣值', 400)
  }

  const newTemplate = new CouponTemplate(templateData)
  await newTemplate.save()

  return newTemplate
}

/**
 * 更新優惠券模板
 * @param {String} templateId - 模板ID
 * @param {Object} updateData - 更新數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 更新後的優惠券模板
 */
export const updateCouponTemplate = async (templateId, updateData, brandId) => {
  const template = await CouponTemplate.findOne({
    _id: templateId,
    brand: brandId,
  })

  if (!template) {
    throw new AppError('優惠券模板不存在或無權訪問', 404)
  }

  // 防止更改品牌
  delete updateData.brand

  // 更新模板
  Object.keys(updateData).forEach((key) => {
    template[key] = updateData[key]
  })

  await template.save()

  return template
}

/**
 * 刪除優惠券模板
 * @param {String} templateId - 模板ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteCouponTemplate = async (templateId, brandId) => {
  const template = await CouponTemplate.findOne({
    _id: templateId,
    brand: brandId,
  })

  if (!template) {
    throw new AppError('優惠券模板不存在或無權訪問', 404)
  }

  // 檢查是否有已發放的優惠券實例
  const activeInstances = await CouponInstance.countDocuments({
    template: templateId,
    isUsed: false,
  })

  if (activeInstances > 0) {
    throw new AppError('還有未使用的優惠券實例，無法刪除模板', 400)
  }

  await template.deleteOne()

  return { success: true, message: '優惠券模板已刪除' }
}

/**
 * 🆕 獲取所有優惠券實例（管理員功能）
 * @param {String} brandId - 品牌ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 優惠券實例列表和分頁資訊
 */
export const getAllCouponInstances = async (brandId, options = {}) => {
  const { page = 1, limit = 20, status, templateId, userId, includeExpired = true } = options

  const query = { brand: brandId }

  // 狀態篩選
  if (status) {
    if (status === 'used') {
      query.isUsed = true
    } else if (status === 'active') {
      query.isUsed = false
      query.expiryDate = { $gt: new Date() }
    } else if (status === 'expired') {
      query.isUsed = false
      query.expiryDate = { $lte: new Date() }
    }
  } else if (!includeExpired) {
    // 如果不包含過期的，則只顯示未使用且未過期的
    query.$or = [
      { isUsed: true }, // 已使用的
      { isUsed: false, expiryDate: { $gt: new Date() } }, // 未使用且未過期的
    ]
  }

  if (templateId) {
    query.template = templateId
  }

  if (userId) {
    query.user = userId
  }

  const skip = (page - 1) * limit

  const instances = await CouponInstance.find(query)
    .populate('template', 'name description')
    .populate('user', 'name phone')
    .populate('issuedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const total = await CouponInstance.countDocuments(query)

  return {
    instances,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * 獲取用戶優惠券
 * @param {String} userId - 用戶ID
 * @param {String} brandId - 品牌ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Array>} 用戶的優惠券列表
 */
export const getUserCoupons = async (userId, brandId, options = {}) => {
  const { includeUsed = false, includeExpired = false } = options

  const query = { user: userId, brand: brandId }

  if (!includeUsed) {
    query.isUsed = false
  }

  if (!includeExpired) {
    query.expiryDate = { $gt: new Date() }
  }

  const coupons = await CouponInstance.find(query)
    .populate('template', 'name description discountInfo')
    .sort({ createdAt: -1 })

  return coupons
}

/**
 * 發放優惠券給用戶（活動獎勵用）
 * @param {String} userId - 用戶ID
 * @param {String} templateId - 模板ID
 * @param {String} adminId - 管理員ID
 * @param {String} reason - 發放原因
 * @returns {Promise<Object>} 發放結果
 */
export const issueCouponToUser = async (userId, templateId, adminId, reason = '活動獎勵') => {
  const template = await CouponTemplate.findById(templateId)

  if (!template) {
    throw new AppError('優惠券模板不存在', 404)
  }

  if (!template.isActive) {
    throw new AppError('優惠券模板已停用', 400)
  }

  // 計算過期日期
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + template.validityPeriod)

  const couponInstance = new CouponInstance({
    brand: template.brand,
    template: templateId,
    user: userId,
    couponName: template.name,
    discountInfo: template.discountInfo, // 複製折扣資訊
    acquiredAt: new Date(),
    expiryDate,
    issuedBy: adminId,
    issueReason: reason,
  })

  await couponInstance.save()

  // 更新模板發放數量
  template.totalIssued += 1
  await template.save()

  return {
    success: true,
    message: '優惠券發放成功',
    coupon: couponInstance,
  }
}

/**
 * 使用優惠券
 * @param {String} couponId - 優惠券ID
 * @param {String} userId - 用戶ID
 * @param {String} brandId - 品牌ID
 * @param {String} orderId - 訂單ID（可選）
 * @returns {Promise<Object>} 使用結果
 */
export const useCoupon = async (couponId, userId, brandId, orderId = null) => {
  const coupon = await CouponInstance.findOne({
    _id: couponId,
    user: userId,
    brand: brandId,
  })

  if (!coupon) {
    throw new AppError('優惠券不存在或無權使用', 404)
  }

  if (coupon.isUsed) {
    throw new AppError('優惠券已使用', 400)
  }

  if (coupon.expiryDate < new Date()) {
    throw new AppError('優惠券已過期', 400)
  }

  // 標記為已使用
  coupon.isUsed = true
  coupon.usedAt = new Date()
  if (orderId) {
    coupon.order = orderId
  }

  await coupon.save()

  return {
    success: true,
    message: '優惠券使用成功',
    coupon,
  }
}
