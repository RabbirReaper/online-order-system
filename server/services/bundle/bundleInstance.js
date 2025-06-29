/**
 * Bundle 實例服務
 * 處理 Bundle 實例相關業務邏輯
 */

import BundleInstance from '../../models/Promotion/BundleInstance.js';
import Bundle from '../../models/Promotion/Bundle.js';
import VoucherTemplate from '../../models/Promotion/VoucherTemplate.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 根據ID獲取 Bundle 實例
 * @param {String} instanceId - 實例ID
 * @returns {Promise<Object>} Bundle 實例
 */
export const getInstanceById = async (instanceId) => {
  const instance = await BundleInstance.findById(instanceId)
    .populate('templateId')
    .populate('bundleItems.voucherTemplate', 'name description voucherType');

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
    .populate('bundleItems.voucherTemplate');

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
  instanceData.voucherValidityDays = template.voucherValidityDays;

  // 複製 Bundle 項目資訊
  instanceData.bundleItems = template.bundleItems.map(item => ({
    voucherTemplate: item.voucherTemplate._id,
    quantity: item.quantity,
    voucherName: item.voucherName
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

