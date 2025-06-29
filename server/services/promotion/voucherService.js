/**
 * 兌換券服務
 * 處理單一餐點兌換券相關邏輯
 * VoucherTemplate 用於 Bundle 包裝販賣
 */

import mongoose from 'mongoose';
import VoucherTemplate from '../../models/Promotion/VoucherTemplate.js';
import VoucherInstance from '../../models/Promotion/VoucherInstance.js';
import Bundle from '../../models/Promotion/Bundle.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取所有兌換券模板
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Array>} 所有兌換券模板
 */
export const getAllVoucherTemplates = async (brandId) => {
  const templates = await VoucherTemplate.find({ brand: brandId })
    .populate('exchangeInfo.items.dishTemplate')
    .sort({ createdAt: -1 });

  return templates;
};

/**
 * 根據ID獲取兌換券模板
 * @param {String} templateId - 模板ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 兌換券模板
 */
export const getVoucherTemplateById = async (templateId, brandId) => {
  const template = await VoucherTemplate.findOne({
    _id: templateId,
    brand: brandId
  }).populate('exchangeInfo.items.dishTemplate');

  if (!template) {
    throw new AppError('兌換券模板不存在或無權訪問', 404);
  }

  return template;
};

/**
 * 創建兌換券模板
 * @param {Object} templateData - 模板數據
 * @returns {Promise<Object>} 創建的兌換券模板
 */
export const createVoucherTemplate = async (templateData) => {
  // 驗證必要欄位
  if (!templateData.name || !templateData.voucherType || !templateData.validityPeriod) {
    throw new AppError('名稱、類型和有效期為必填欄位', 400);
  }

  // 兌換券通常是 exchange 類型
  if (templateData.voucherType === 'exchange') {
    if (!templateData.exchangeInfo || !templateData.exchangeInfo.items || templateData.exchangeInfo.items.length === 0) {
      throw new AppError('兌換券必須提供可兌換的項目', 400);
    }
  }

  const newTemplate = new VoucherTemplate(templateData);
  await newTemplate.save();

  return newTemplate;
};

/**
 * 更新兌換券模板
 * @param {String} templateId - 模板ID
 * @param {Object} updateData - 更新數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 更新後的兌換券模板
 */
export const updateVoucherTemplate = async (templateId, updateData, brandId) => {
  const template = await VoucherTemplate.findOne({
    _id: templateId,
    brand: brandId
  });

  if (!template) {
    throw new AppError('兌換券模板不存在或無權訪問', 404);
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
 * 刪除兌換券模板
 * @param {String} templateId - 模板ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteVoucherTemplate = async (templateId, brandId) => {
  const template = await VoucherTemplate.findOne({
    _id: templateId,
    brand: brandId
  });

  if (!template) {
    throw new AppError('兌換券模板不存在或無權訪問', 404);
  }

  // 檢查是否有已發放的兌換券實例
  const activeInstances = await VoucherInstance.countDocuments({
    template: templateId,
    isUsed: false
  });

  if (activeInstances > 0) {
    throw new AppError('還有未使用的兌換券實例，無法刪除模板', 400);
  }

  // 檢查是否有 Bundle 使用此兌換券模板
  const relatedBundles = await Bundle.countDocuments({
    'bundleItems.voucherTemplate': templateId
  });

  if (relatedBundles > 0) {
    throw new AppError('此兌換券模板已被 Bundle 使用，無法刪除', 400);
  }

  await template.deleteOne();

  return { success: true, message: '兌換券模板已刪除' };
};

/**
 * 獲取可用的兌換券模板（供 Bundle 創建時選擇）
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Array>} 可用的兌換券模板列表
 */
export const getAvailableVoucherTemplates = async (brandId) => {
  const templates = await VoucherTemplate.find({
    brand: brandId,
    isActive: true
  })
    .select('name description voucherType validityPeriod')
    .sort({ createdAt: -1 });

  return templates;
};

/**
 * 獲取用戶兌換券
 * @param {String} userId - 用戶ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Array>} 用戶的兌換券列表
 */
export const getUserVouchers = async (userId, options = {}) => {
  const { includeUsed = false, includeExpired = false } = options;

  const query = { user: userId };

  if (!includeUsed) {
    query.isUsed = false;
  }

  if (!includeExpired) {
    query.expiryDate = { $gt: new Date() };
  }

  const vouchers = await VoucherInstance.find(query)
    .populate('template', 'name description voucherType exchangeInfo')
    .populate('sourceBundle', 'name') // populate 來源 Bundle
    .sort({ createdAt: -1 });

  return vouchers;
};

/**
 * 使用兌換券
 * @param {String} voucherId - 兌換券ID
 * @param {String} userId - 用戶ID
 * @param {String} orderId - 訂單ID（可選）
 * @returns {Promise<Object>} 使用結果
 */
export const useVoucher = async (voucherId, userId, orderId = null) => {
  const voucher = await VoucherInstance.findOne({
    _id: voucherId,
    user: userId
  });

  if (!voucher) {
    throw new AppError('兌換券不存在或無權使用', 404);
  }

  if (voucher.isUsed) {
    throw new AppError('兌換券已使用', 400);
  }

  if (voucher.expiryDate < new Date()) {
    throw new AppError('兌換券已過期', 400);
  }

  // 標記為已使用
  voucher.isUsed = true;
  voucher.usedAt = new Date();
  if (orderId) {
    voucher.usedInOrder = orderId;
  }

  await voucher.save();

  return {
    success: true,
    message: '兌換券使用成功',
    voucher
  };
};

/**
 * 驗證兌換券
 * @param {String} voucherId - 兌換券ID
 * @param {String} userId - 用戶ID
 * @returns {Promise<Object>} 驗證結果
 */
export const validateVoucher = async (voucherId, userId) => {
  const voucher = await VoucherInstance.findOne({
    _id: voucherId,
    user: userId
  }).populate('template');

  if (!voucher) {
    return {
      isValid: false,
      message: '兌換券不存在或無權使用',
      voucher: null
    };
  }

  if (voucher.isUsed) {
    return {
      isValid: false,
      message: '兌換券已使用',
      voucher
    };
  }

  if (voucher.expiryDate < new Date()) {
    return {
      isValid: false,
      message: '兌換券已過期',
      voucher
    };
  }

  return {
    isValid: true,
    message: '兌換券有效',
    voucher
  };
};
