/**
 * Bundle 實例服務
 * 處理 Bundle 實例相關業務邏輯
 */

import BundleInstance from '../../models/Dish/BundleInstance.js';
import Bundle from '../../models/Dish/Bundle.js';
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
  instanceData.originalPrice = template.originalPrice;
  instanceData.sellingPrice = template.sellingPrice;
  instanceData.originalPoint = template.originalPoint || 0;
  instanceData.sellingPoint = template.sellingPoint || 0;
  instanceData.couponValidityDays = template.couponValidityDays;

  // 複製 Bundle 項目資訊
  instanceData.bundleItems = template.bundleItems.map(item => ({
    couponTemplate: item.couponTemplate._id,
    quantity: item.quantity,
    couponName: item.couponName
  }));

  // Bundle 的最終價格就是 sellingPrice，無需客製化計算
  instanceData.finalPrice = instanceData.sellingPrice;

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
  if (updateData.sellingPrice !== undefined) {
    instance.sellingPrice = updateData.sellingPrice;
    instance.finalPrice = updateData.sellingPrice;
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
 * @returns {Number} 最終價格
 */
export const calculateFinalPrice = (instance) => {
  // Bundle 沒有客製化選項，最終價格就是 sellingPrice
  return instance.sellingPrice || instance.originalPrice;
};
