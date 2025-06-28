/**
 * 優惠券服務 - 完全獨立的 Coupon 系統
 * 只處理折價券相關邏輯，與 Bundle/Voucher 系統完全分離
 * Coupon 只送不賣，用於活動獎勵
 */

import mongoose from 'mongoose';
import CouponTemplate from '../../models/Promotion/CouponTemplate.js';
import CouponInstance from '../../models/Promotion/CouponInstance.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取所有優惠券模板
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Array>} 所有優惠券模板
 */
export const getAllCouponTemplates = async (brandId) => {
  const templates = await CouponTemplate.find({ brand: brandId })
    .populate('exchangeInfo.items.dishTemplate')
    .sort({ createdAt: -1 });

  return templates;
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
    brand: brandId
  }).populate('exchangeInfo.items.dishTemplate');

  if (!template) {
    throw new AppError('優惠券模板不存在或無權訪問', 404);
  }

  return template;
};

/**
 * 創建優惠券模板
 * @param {Object} templateData - 模板數據
 * @returns {Promise<Object>} 創建的優惠券模板
 */
export const createCouponTemplate = async (templateData) => {
  // 驗證必要欄位
  if (!templateData.name || !templateData.couponType || !templateData.validityPeriod) {
    throw new AppError('名稱、類型和有效期為必填欄位', 400);
  }

  // 根據類型驗證特定欄位
  if (templateData.couponType === 'discount') {
    if (!templateData.discountInfo || !templateData.discountInfo.discountType || !templateData.discountInfo.discountValue) {
      throw new AppError('折扣券必須提供折扣類型和折扣值', 400);
    }
  } else if (templateData.couponType === 'exchange') {
    if (!templateData.exchangeInfo || !templateData.exchangeInfo.items || templateData.exchangeInfo.items.length === 0) {
      throw new AppError('兌換券必須提供可兌換的項目', 400);
    }
  }

  const newTemplate = new CouponTemplate(templateData);
  await newTemplate.save();

  return newTemplate;
};

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
    brand: brandId
  });

  if (!template) {
    throw new AppError('優惠券模板不存在或無權訪問', 404);
  }

  // 防止更改品牌
  delete updateData.brand;

  // 更新模板
  Object.keys(updateData).forEach(key => {
    template[key] = updateData[key];
  });

  await template.save();

  return template;
};

/**
 * 刪除優惠券模板
 * @param {String} templateId - 模板ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteCouponTemplate = async (templateId, brandId) => {
  const template = await CouponTemplate.findOne({
    _id: templateId,
    brand: brandId
  });

  if (!template) {
    throw new AppError('優惠券模板不存在或無權訪問', 404);
  }

  // 檢查是否有已發放的優惠券實例
  const activeInstances = await CouponInstance.countDocuments({
    template: templateId,
    isUsed: false
  });

  if (activeInstances > 0) {
    throw new AppError('還有未使用的優惠券實例，無法刪除模板', 400);
  }

  // 注意：移除了 Bundle 相關檢查
  // Coupon 系統現在完全獨立，不與 Bundle 系統關聯

  await template.deleteOne();

  return { success: true, message: '優惠券模板已刪除' };
};

/**
 * 獲取用戶優惠券
 * @param {String} userId - 用戶ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Array>} 用戶的優惠券列表
 */
export const getUserCoupons = async (userId, options = {}) => {
  const { includeUsed = false, includeExpired = false } = options;

  const query = { user: userId };

  if (!includeUsed) {
    query.isUsed = false;
  }

  if (!includeExpired) {
    query.expiryDate = { $gt: new Date() };
  }

  const coupons = await CouponInstance.find(query)
    .populate('template', 'name description couponType discountInfo exchangeInfo')
    .sort({ createdAt: -1 });

  return coupons;
};

/**
 * 發放優惠券給用戶（活動獎勵用）
 * @param {String} userId - 用戶ID
 * @param {String} templateId - 模板ID
 * @param {String} adminId - 管理員ID
 * @param {String} reason - 發放原因
 * @returns {Promise<Object>} 發放結果
 */
export const issueCouponToUser = async (userId, templateId, adminId, reason = '活動獎勵') => {
  const template = await CouponTemplate.findById(templateId);

  if (!template) {
    throw new AppError('優惠券模板不存在', 404);
  }

  if (!template.isActive) {
    throw new AppError('優惠券模板已停用', 400);
  }

  // 計算過期日期
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + template.validityPeriod);

  const couponInstance = new CouponInstance({
    template: templateId,
    user: userId,
    couponName: template.name,
    couponType: template.couponType,
    acquiredAt: new Date(),
    expiryDate,
    pointsUsed: 0, // Coupon 不消耗點數
    issuedBy: adminId,
    issueReason: reason
  });

  // 根據券類型設置相關資訊
  if (template.couponType === 'discount') {
    couponInstance.discount = template.discountInfo.discountValue;
  } else if (template.couponType === 'exchange') {
    couponInstance.exchangeItems = template.exchangeInfo.items;
  }

  await couponInstance.save();

  return {
    success: true,
    message: '優惠券發放成功',
    coupon: couponInstance
  };
};

/**
 * 使用優惠券
 * @param {String} couponId - 優惠券ID
 * @param {String} orderId - 訂單ID（可選）
 * @returns {Promise<Object>} 使用結果
 */
export const useCoupon = async (couponId, orderId = null) => {
  const coupon = await CouponInstance.findById(couponId);

  if (!coupon) {
    throw new AppError('優惠券不存在', 404);
  }

  if (coupon.isUsed) {
    throw new AppError('優惠券已使用', 400);
  }

  if (coupon.expiryDate < new Date()) {
    throw new AppError('優惠券已過期', 400);
  }

  // 標記為已使用
  coupon.isUsed = true;
  coupon.usedAt = new Date();
  if (orderId) {
    coupon.usedInOrder = orderId;
  }

  await coupon.save();

  return {
    success: true,
    message: '優惠券使用成功',
    coupon
  };
};
