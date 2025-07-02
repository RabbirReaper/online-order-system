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
 * @param {String} brandId - 品牌ID（用於權限驗證）
 * @returns {Promise<Object>} Bundle 實例
 */
export const getInstanceById = async (instanceId, brandId = null) => {
  const query = { _id: instanceId };

  // 如果提供了 brandId，加入品牌驗證
  if (brandId) {
    query.brand = brandId;
  }

  const instance = await BundleInstance.findOne(query)
    .populate('templateId')
    .populate('bundleItems.voucherTemplate', 'name description validityPeriod exchangeDishTemplate')
    .populate({
      path: 'bundleItems.voucherTemplate',
      populate: {
        path: 'exchangeDishTemplate',
        select: 'name basePrice image'
      }
    });

  if (!instance) {
    throw new AppError('Bundle 實例不存在或無權訪問', 404);
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

  if (!instanceData.brand) {
    throw new AppError('品牌ID為必填欄位', 400);
  }

  // 查找對應的 Bundle 模板
  const template = await Bundle.findOne({
    _id: instanceData.templateId,
    brand: instanceData.brand
  }).populate('bundleItems.voucherTemplate');

  if (!template) {
    throw new AppError('Bundle 模板不存在或無權訪問', 404);
  }

  // 檢查模板是否啟用
  if (!template.isActive) {
    throw new AppError('Bundle 模板已停用，無法創建實例', 400);
  }

  // 添加冗餘模板信息
  instanceData.name = template.name;
  instanceData.description = template.description;

  // 使用新的價格結構
  instanceData.cashPrice = template.cashPrice;
  instanceData.pointPrice = template.pointPrice;
  instanceData.voucherValidityDays = template.voucherValidityDays;

  // 複製 Bundle 項目資訊
  instanceData.bundleItems = template.bundleItems.map(item => ({
    voucherTemplate: item.voucherTemplate._id,
    quantity: item.quantity,
    voucherName: item.voucherName
  }));

  // Bundle 的最終價格根據付款方式決定
  // 這裡需要根據實際的購買方式來設定
  if (instanceData.paymentMethod === 'points' && template.pointPrice) {
    instanceData.finalPrice = template.pointPrice.selling || template.pointPrice.original || 0;
  } else if (template.cashPrice) {
    instanceData.finalPrice = template.cashPrice.selling || template.cashPrice.original || 0;
  } else if (template.pointPrice) {
    instanceData.finalPrice = template.pointPrice.selling || template.pointPrice.original || 0;
  } else {
    throw new AppError('Bundle 模板沒有設定有效的價格', 400);
  }

  // 創建 Bundle 實例
  const newInstance = new BundleInstance(instanceData);
  await newInstance.save();

  // 返回完整的實例資料
  const populatedInstance = await BundleInstance.findById(newInstance._id)
    .populate('templateId')
    .populate('bundleItems.voucherTemplate', 'name description validityPeriod exchangeDishTemplate')
    .populate({
      path: 'bundleItems.voucherTemplate',
      populate: {
        path: 'exchangeDishTemplate',
        select: 'name basePrice image'
      }
    });

  return populatedInstance;
};

/**
 * 獲取用戶的 Bundle 實例列表
 * @param {String} userId - 用戶ID
 * @param {String} brandId - 品牌ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} Bundle 實例列表與分頁資訊
 */
export const getUserBundleInstances = async (userId, brandId, options = {}) => {
  const { page = 1, limit = 20 } = options;

  // 計算分頁
  const skip = (page - 1) * limit;

  // 查詢條件
  const query = {
    user: userId,
    brand: brandId
  };

  // 查詢總數
  const total = await BundleInstance.countDocuments(query);

  // 查詢實例
  const instances = await BundleInstance.find(query)
    .populate('templateId', 'name')
    .populate('bundleItems.voucherTemplate', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

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
    brand: brandId
  });

  if (!instance) {
    throw new AppError('Bundle 實例不存在或無權訪問', 404);
  }

  // 防止更改關鍵欄位
  delete updateData.brand;
  delete updateData.templateId;
  delete updateData.bundleItems;
  delete updateData.finalPrice;

  // 更新實例
  Object.keys(updateData).forEach(key => {
    instance[key] = updateData[key];
  });

  await instance.save();

  return instance;
};

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
    brand: brandId
  });

  if (!instance) {
    throw new AppError('Bundle 實例不存在或無權訪問', 404);
  }

  // TODO: 檢查是否有關聯的兌換券，如果有則拒絕刪除
  // 或者處理相關的兌換券狀態

  await instance.deleteOne();

  return { success: true, message: 'Bundle 實例已刪除' };
};
