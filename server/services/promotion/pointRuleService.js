/**
 * 點數規則服務
 * 處理點數規則相關的業務邏輯
 */

import PointRule from '../../models/Promotion/PointRule.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取所有點數規則（按品牌過濾）
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Array>} 點數規則列表
 */
export const getAllPointRules = async (brandId) => {
  if (!brandId) {
    throw new AppError('品牌ID為必填欄位', 400);
  }

  const rules = await PointRule.find({ brand: brandId })
    .sort({ createdAt: -1 });

  return rules;
};

/**
 * 根據ID獲取點數規則（驗證品牌）
 * @param {String} ruleId - 規則ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 點數規則
 */
export const getPointRuleById = async (ruleId, brandId) => {
  const rule = await PointRule.findOne({
    _id: ruleId,
    brand: brandId
  });

  if (!rule) {
    throw new AppError('點數規則不存在或無權訪問', 404);
  }

  return rule;
};

/**
 * 創建點數規則
 * @param {Object} ruleData - 規則數據
 * @returns {Promise<Object>} 創建的點數規則
 */
export const createPointRule = async (ruleData) => {
  // 驗證必要欄位
  if (!ruleData.name || !ruleData.type || ruleData.conversionRate === undefined) {
    throw new AppError('名稱、類型和轉換率為必填欄位', 400);
  }

  // 檢查同一品牌下是否已存在相同類型的啟用規則
  if (ruleData.isActive) {
    const existingActiveRule = await PointRule.findOne({
      brand: ruleData.brand,
      type: ruleData.type,
      isActive: true
    });

    if (existingActiveRule) {
      throw new AppError(`已存在啟用的 ${ruleData.type} 類型規則，請先停用現有規則`, 400);
    }
  }

  const newRule = new PointRule(ruleData);
  await newRule.save();

  return newRule;
};

/**
 * 更新點數規則
 * @param {String} ruleId - 規則ID
 * @param {Object} updateData - 更新數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 更新後的點數規則
 */
export const updatePointRule = async (ruleId, updateData, brandId) => {
  const rule = await PointRule.findOne({
    _id: ruleId,
    brand: brandId
  });

  if (!rule) {
    throw new AppError('點數規則不存在或無權訪問', 404);
  }

  // 如果要啟用此規則，檢查是否已有同類型的啟用規則
  if (updateData.isActive && !rule.isActive) {
    const existingActiveRule = await PointRule.findOne({
      brand: brandId,
      type: rule.type,
      isActive: true,
      _id: { $ne: ruleId }
    });

    if (existingActiveRule) {
      throw new AppError(`已存在啟用的 ${rule.type} 類型規則，請先停用現有規則`, 400);
    }
  }

  // 防止更改品牌
  delete updateData.brand;

  // 更新規則
  Object.keys(updateData).forEach(key => {
    rule[key] = updateData[key];
  });

  await rule.save();

  return rule;
};

/**
 * 刪除點數規則
 * @param {String} ruleId - 規則ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deletePointRule = async (ruleId, brandId) => {
  const rule = await PointRule.findOne({
    _id: ruleId,
    brand: brandId
  });

  if (!rule) {
    throw new AppError('點數規則不存在或無權訪問', 404);
  }

  // 檢查規則是否正在使用中
  if (rule.isActive) {
    throw new AppError('無法刪除啟用中的規則，請先停用規則', 400);
  }

  await rule.deleteOne();

  return { success: true, message: '點數規則已刪除' };
};

/**
 * 獲取品牌的啟用點數規則
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Array>} 啟用的點數規則列表
 */
export const getActivePointRules = async (brandId) => {
  const rules = await PointRule.find({
    brand: brandId,
    isActive: true
  });

  return rules;
};

/**
 * 計算訂單應獲得的點數
 * @param {String} brandId - 品牌ID
 * @param {Number} orderAmount - 訂單金額
 * @returns {Promise<Number>} 應獲得的點數
 */
export const calculateOrderPoints = async (brandId, orderAmount) => {
  // 查找購買金額類型的啟用規則
  const rule = await PointRule.findOne({
    brand: brandId,
    type: 'purchase_amount',
    isActive: true
  });

  if (!rule) {
    return 0; // 沒有啟用的規則，不給予點數
  }

  // 檢查是否達到最低消費金額
  if (orderAmount < rule.minimumAmount) {
    return 0;
  }

  // 計算點數（向下取整）
  const points = Math.floor(orderAmount / rule.conversionRate);

  return {
    points,
    rule: rule
  };
};
