/**
 * Bundle 實例服務
 * 處理 Bundle 實例相關業務邏輯
 */

import BundleInstance from '../../models/Promotion/BundleInstance.js';
import Bundle from '../../models/Promotion/Bundle.js';
import CouponTemplate from '../../models/Promotion/CouponTemplate.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取所有 Bundle 實例
 * @param {Object} options - 查詢選項
 * @param {Number} options.page - 頁碼
 * @param {Number} options.limit - 每頁數量
 * @returns {Promise<Object>} Bundle 實例列表與分頁資訊
 */
export const getAllInstances = async (options = {}) => {
  const { page = 1, limit = 20 } = options;

  // 計算分頁
  const skip = (page - 1) * limit;

  // 查詢總數
  const total = await BundleInstance.countDocuments();

  // 查詢 Bundle 實例
  const instances = await BundleInstance.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('templateId')
    .populate('bundleItems.couponTemplate', 'name description couponType');

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    instances,
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
 * 根據ID獲取 Bundle 實例
 * @param {String} instanceId - 實例ID
 * @returns {Promise<Object>} Bundle 實例
 */
export const getInstanceById = async (instanceId) => {
  const instance = await BundleInstance.findById(instanceId)
    .populate('templateId')
    .populate('bundleItems.couponTemplate', 'name description couponType');

  if (!instance) {
    throw new AppError('Bundle 實例不存在', 404);
  }

  return instance;
};

/**
 * 創建 Bundle 實例
 * @param {Object} instanceData - 實例數據
 * @returns {Promise<Object>} 創建的 Bundle 實例
 */
export const createInstance = async (instanceData) => {
  // 基本驗證
  if (!instanceData.templateId) {
    throw new AppError('Bundle 模板ID為必填欄位', 400);
  }

  // 查找對應的 Bundle 模板
  const template = await Bundle.findById(instanceData.templateId)
    .populate('bundleItems.couponTemplate');

  if (!template) {
    throw new AppError('Bundle 模板不存在', 404);
  }

  // 添加冗餘模板信息
  instanceData.name = template.name;
  instanceData.description = template.description;

  // 使用新的價格結構
  instanceData.cashPrice = template.cashPrice;
  instanceData.pointPrice = template.pointPrice;
  instanceData.sellingPoint = template.sellingPoint;
  instanceData.couponValidityDays = template.couponValidityDays;

  // 複製 Bundle 項目資訊
  instanceData.bundleItems = template.bundleItems.map(item => ({
    couponTemplate: item.couponTemplate._id,
    quantity: item.quantity,
    couponName: item.couponName
  }));

  // Bundle 的最終價格根據付款方式決定
  // 預設使用現金價格的 selling 或 original
  if (template.cashPrice) {
    instanceData.finalPrice = template.cashPrice.selling || template.cashPrice.original || 0;
  } else if (template.pointPrice) {
    instanceData.finalPrice = template.pointPrice.selling || template.pointPrice.original || 0;
  } else {
    instanceData.finalPrice = 0;
  }

  // 創建 Bundle 實例
  const newInstance = new BundleInstance(instanceData);
  await newInstance.save();

  return newInstance;
};

/**
 * 更新 Bundle 實例
 * @param {String} instanceId - 實例ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的 Bundle 實例
 */
export const updateInstance = async (instanceId, updateData) => {
  // 檢查實例是否存在
  const instance = await BundleInstance.findById(instanceId);

  if (!instance) {
    throw new AppError('Bundle 實例不存在', 404);
  }

  // Bundle 實例一旦創建就不需要更新，因為沒有客製化選項
  // 如果真的需要更新，主要是價格相關的調整
  if (updateData.cashPrice !== undefined) {
    instance.cashPrice = updateData.cashPrice;
    instance.finalPrice = updateData.cashPrice.selling || updateData.cashPrice.original || 0;
  }

  if (updateData.pointPrice !== undefined) {
    instance.pointPrice = updateData.pointPrice;
  }

  await instance.save();

  return instance;
};

/**
 * 刪除 Bundle 實例
 * @param {String} instanceId - 實例ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteInstance = async (instanceId) => {
  // 檢查實例是否存在
  const instance = await BundleInstance.findById(instanceId);

  if (!instance) {
    throw new AppError('Bundle 實例不存在', 404);
  }

  // TODO: 檢查是否有關聯的訂單，如果有則拒絕刪除

  await instance.deleteOne();

  return { success: true, message: 'Bundle 實例已刪除' };
};

/**
 * 計算 Bundle 最終價格
 * @param {Object} instance - Bundle 實例對象
 * @param {String} paymentType - 付款方式 ('cash' | 'point')
 * @returns {Number} 最終價格
 */
export const calculateFinalPrice = (instance, paymentType = 'cash') => {
  if (paymentType === 'cash' && instance.cashPrice) {
    return instance.cashPrice.selling || instance.cashPrice.original || 0;
  } else if (paymentType === 'point' && instance.pointPrice) {
    return instance.pointPrice.selling || instance.pointPrice.original || 0;
  }

  // 預設回傳 finalPrice 欄位
  return instance.finalPrice || 0;
};
