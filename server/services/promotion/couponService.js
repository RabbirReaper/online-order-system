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

/**
 * 兌換優惠券
 * @param {String} userId - 用戶ID
 * @param {String} templateId - 優惠券模板ID
 * @returns {Promise<Object>} 兌換結果
 */
export const redeemCoupon = async (userId, templateId) => {
  // 查找優惠券模板
  const template = await CouponTemplate.findById(templateId);

  if (!template) {
    throw new AppError('優惠券模板不存在', 404);
  }

  // 檢查模板是否可用
  const now = new Date();

  if (!template.isActive) {
    throw new AppError('此優惠券已停用', 400);
  }

  if (template.startDate > now) {
    throw new AppError('此優惠券尚未開始發放', 400);
  }

  if (template.endDate && template.endDate < now) {
    throw new AppError('此優惠券已過期', 400);
  }

  // 檢查是否達到發行上限
  if (template.maxIssuance && template.totalIssued >= template.maxIssuance) {
    throw new AppError('此優惠券已達發行上限', 400);
  }

  // 檢查用戶點數是否足夠
  const userPoints = await pointService.getUserPointsBalance(userId, template.brand);

  if (userPoints < template.pointCost) {
    throw new AppError('點數不足，無法兌換此優惠券', 400);
  }

  // 使用點數
  await pointService.usePoints(userId, template.brand, template.pointCost, {
    model: 'CouponTemplate',
    id: template._id
  });

  // 計算優惠券過期日期
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + template.validityPeriod);

  // 創建優惠券實例
  const couponInstance = new CouponInstance({
    template: template._id,
    couponName: template.name,
    couponType: template.couponType,
    user: userId,
    expiryDate,
    pointsUsed: template.pointCost
  });

  // 根據優惠券類型設置特定屬性
  if (template.couponType === 'discount') {
    if (template.discountInfo) {
      couponInstance.discount = template.discountInfo.discountValue;
    }
  } else if (template.couponType === 'exchange') {
    if (template.exchangeInfo && template.exchangeInfo.items) {
      couponInstance.exchangeItems = template.exchangeInfo.items;
    }
  }

  // 保存優惠券實例
  await couponInstance.save();

  // 更新模板發行數量
  template.totalIssued += 1;
  await template.save();

  return {
    success: true,
    message: '優惠券兌換成功',
    coupon: couponInstance
  };
};

/**
 * 檢查優惠券是否可用於訂單
 * @param {String} couponId - 優惠券實例ID
 * @param {Object} order - 訂單數據
 * @returns {Promise<Object>} 驗證結果
 */
export const validateCoupon = async (couponId, order) => {
  // 查找優惠券實例
  const coupon = await CouponInstance.findById(couponId)
    .populate('template');

  if (!coupon) {
    throw new AppError('優惠券不存在', 404);
  }

  // 基本驗證
  if (coupon.isUsed) {
    throw new AppError('此優惠券已使用過', 400);
  }

  if (coupon.expiryDate < new Date()) {
    throw new AppError('此優惠券已過期', 400);
  }

  // 驗證用戶
  if (coupon.user.toString() !== order.user.toString()) {
    throw new AppError('此優惠券不屬於當前用戶', 403);
  }

  // 驗證品牌
  if (coupon.template && coupon.template.brand.toString() !== order.brand.toString()) {
    throw new AppError('此優惠券不適用於當前品牌', 400);
  }

  // 驗證店鋪
  if (coupon.template && coupon.template.stores && coupon.template.stores.length > 0) {
    if (!coupon.template.stores.includes(order.store.toString())) {
      throw new AppError('此優惠券不適用於當前店鋪', 400);
    }
  }

  // 如果是折扣券，驗證最低消費
  if (coupon.couponType === 'discount' && coupon.template && coupon.template.discountInfo) {
    const minPurchaseAmount = coupon.template.discountInfo.minPurchaseAmount || 0;

    if (order.subtotal < minPurchaseAmount) {
      throw new AppError(`訂單金額需滿 ${minPurchaseAmount} 元才能使用此優惠券`, 400);
    }
  }

  return {
    success: true,
    coupon
  };
};

/**
 * 將優惠券應用於訂單
 * @param {String} couponId - 優惠券實例ID
 * @param {Object} order - 訂單對象
 * @returns {Promise<Object>} 應用結果
 */
export const applyCouponToOrder = async (couponId, order) => {
  // 先驗證優惠券
  const { coupon } = await validateCoupon(couponId, order);

  // 初始化折扣金額
  let discountAmount = 0;

  // 根據優惠券類型計算折扣
  if (coupon.couponType === 'discount') {
    // 檢查模板中的折扣信息
    const discountInfo = coupon.template?.discountInfo;

    if (discountInfo) {
      if (discountInfo.discountType === 'percentage') {
        // 百分比折扣
        const percentage = discountInfo.discountValue / 100;
        discountAmount = order.subtotal * percentage;

        // 檢查最大折扣金額
        if (discountInfo.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, discountInfo.maxDiscountAmount);
        }
      } else if (discountInfo.discountType === 'fixed') {
        // 固定金額折扣
        discountAmount = Math.min(discountInfo.discountValue, order.subtotal);
      }
    } else {
      // 如果沒有模板信息，使用實例中的折扣值（只適用於舊系統遷移）
      discountAmount = Math.min(coupon.discount || 0, order.subtotal);
    }
  } else if (coupon.couponType === 'exchange') {
    // 兌換券：檢查訂單中是否包含要兌換的商品
    // 這個邏輯比較複雜，需要根據具體業務需求實現
    // 此處只是示例
    discountAmount = 0; // 兌換券通常不是直接折抵金額，而是改變訂單內容
  }

  // 更新訂單折扣
  if (!order.discounts) {
    order.discounts = [];
  }

  // 添加折扣記錄
  order.discounts.push({
    couponId: coupon._id,
    amount: Math.round(discountAmount) // 四捨五入到整數
  });

  // 更新總折扣金額
  order.totalDiscount = (order.totalDiscount || 0) + Math.round(discountAmount);

  // 更新優惠券狀態
  coupon.isUsed = true;
  coupon.usedAt = new Date();
  coupon.order = order._id;

  // 保存優惠券狀態
  await coupon.save();

  return {
    success: true,
    discountAmount: Math.round(discountAmount),
    updatedOrder: order
  };
};

/**
 * 獲取用戶優惠券
 * @param {String} userId - 用戶ID
 * @param {Object} options - 查詢選項
 * @param {Boolean} options.includeUsed - 是否包含已使用的優惠券 (默認 false)
 * @param {Boolean} options.includeExpired - 是否包含已過期的優惠券 (默認 false)
 * @returns {Promise<Array>} 用戶優惠券列表
 */
export const getUserCoupons = async (userId, options = {}) => {
  const { includeUsed = false, includeExpired = false } = options;

  // 構建查詢條件
  const query = { user: userId };

  // 過濾已使用的優惠券
  if (!includeUsed) {
    query.isUsed = false;
  }

  // 過濾已過期的優惠券
  if (!includeExpired) {
    query.expiryDate = { $gte: new Date() };
  }

  // 查詢優惠券
  const coupons = await CouponInstance.find(query)
    .populate('template')
    .sort({ expiryDate: 1 });

  return coupons;
};

/**
 * 為用戶發放優惠券
 * @param {String} userId - 用戶ID
 * @param {String} templateId - 優惠券模板ID
 * @param {String} adminId - 管理員ID (可選)
 * @returns {Promise<Object>} 發放結果
 */
export const issueCouponToUser = async (userId, templateId, adminId = null) => {
  // 查找優惠券模板
  const template = await CouponTemplate.findById(templateId);

  if (!template) {
    throw new AppError('優惠券模板不存在', 404);
  }

  // 檢查模板是否可用
  const now = new Date();

  if (!template.isActive) {
    throw new AppError('此優惠券已停用', 400);
  }

  // 檢查是否達到發行上限
  if (template.maxIssuance && template.totalIssued >= template.maxIssuance) {
    throw new AppError('此優惠券已達發行上限', 400);
  }

  // 計算優惠券過期日期
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + template.validityPeriod);

  // 創建優惠券實例（管理員發放不需要用戶消耗點數）
  const couponInstance = new CouponInstance({
    template: template._id,
    couponName: template.name,
    couponType: template.couponType,
    user: userId,
    expiryDate,
    pointsUsed: 0 // 管理員發放不消耗點數
  });

  // 根據優惠券類型設置特定屬性
  if (template.couponType === 'discount') {
    if (template.discountInfo) {
      couponInstance.discount = template.discountInfo.discountValue;
    }
  } else if (template.couponType === 'exchange') {
    if (template.exchangeInfo && template.exchangeInfo.items) {
      couponInstance.exchangeItems = template.exchangeInfo.items;
    }
  }

  // 保存優惠券實例
  await couponInstance.save();

  // 更新模板發行數量
  template.totalIssued += 1;
  await template.save();

  return {
    success: true,
    message: '優惠券發放成功',
    coupon: couponInstance
  };
};
