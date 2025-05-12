/**
 * 優惠券服務
 * 處理優惠券相關的業務邏輯
 */

import mongoose from 'mongoose';
import CouponTemplate from '../../models/Promotion/CouponTemplate.js';
import CouponInstance from '../../models/Promotion/CouponInstance.js';
import { AppError } from '../../middlewares/error.js';
import * as pointService from './pointService.js';

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
  if (!templateData.name || !templateData.couponType || !templateData.pointCost || !templateData.validityPeriod) {
    throw new AppError('名稱、類型、點數成本和有效期為必填欄位', 400);
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

  await template.deleteOne();

  return { success: true, message: '優惠券模板已刪除' };
};

/**
 * 獲取可用的優惠券模板
 * @param {String} brandId - 品牌ID
 * @param {String} storeId - 店鋪ID (可選)
 * @returns {Promise<Array>} 可用的優惠券模板
 */
export const getAvailableCouponTemplates = async (brandId, storeId = null) => {
  const now = new Date();

  // 基本查詢條件
  const query = {
    brand: brandId,
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: { $gte: now } },
      { endDate: { $exists: false } }
    ]
  };

  // 如果有指定店鋪，添加店鋪條件
  if (storeId) {
    query.$or = [
      { stores: { $in: [storeId] } },
      { stores: { $size: 0 } } // 空陣列表示適用於所有店鋪
    ];
  }

  // 如果有最大發行數量限制，檢查是否已達到限制
  const templates = await CouponTemplate.find(query);

  // 過濾掉已達到發行上限的模板
  return templates.filter(template => {
    if (template.maxIssuance && template.totalIssued >= template.maxIssuance) {
      return false;
    }
    return true;
  });
};
