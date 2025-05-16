/**
 * 訂單管理服務
 * 處理訂單狀態變更、取消等操作
 */

import Order from '../../models/Order/Order.js';
import { AppError } from '../../middlewares/error.js';
import { getTaiwanDateTime } from '../../utils/date.js';
import * as inventoryService from '../inventory/stockManagement.js';
import * as pointService from '../promotion/pointService.js';

/**
 * 更新訂單手動調整金額
 * @param {String} orderId - 訂單ID
 * @param {Number} manualAdjustment - 手動調整金額
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 更新後的訂單
 */
export const updateOrderManualAdjustment = async (orderId, manualAdjustment, adminId) => {
  // 查找訂單
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  // 檢查訂單狀態
  if (order.status === 'cancelled') {
    throw new AppError('已取消的訂單無法更改', 400);
  }

  if (order.status === 'completed') {
    throw new AppError('已完成的訂單無法更改', 400);
  }

  // 更新手動調整金額
  order.manualAdjustment = manualAdjustment;

  // 重新計算訂單總額
  const updated = updateOrderAmounts(order);

  if (!updated) {
    throw new AppError('訂單金額計算失敗', 500);
  }

  // 保存訂單
  await order.save();

  return order;
};

/**
 * 取消訂單
 * @param {String} orderId - 訂單ID
 * @param {String} reason - 取消原因
 * @param {String} cancelledBy - 取消者ID
 * @param {String} cancelledByModel - 取消者類型 ('User' 或 'Admin')
 * @returns {Promise<Object>} 取消後的訂單
 */
export const cancelOrder = async (orderId, reason, cancelledBy, cancelledByModel) => {
  // 查找訂單
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  // 檢查訂單狀態
  if (order.status === 'completed') {
    throw new AppError('已完成的訂單無法取消', 400);
  }

  if (order.status === 'cancelled') {
    throw new AppError('訂單已經被取消', 400);
  }

  // 更新訂單狀態
  order.status = 'cancelled';
  order.cancelReason = reason || '未提供取消原因';
  order.cancelledBy = cancelledBy;
  order.cancelledByModel = cancelledByModel;
  order.cancelledAt = new Date();

  // 如果有優惠券使用記錄，進行處理
  if (order.discounts && order.discounts.length > 0) {
    // 這裡可以添加處理優惠券退還的邏輯
  }

  // 如果有使用點數，進行退還
  if (order.user) {
    await pointService.refundPointsForOrder(orderId);
  }

  // 如果已扣除庫存，恢復庫存
  await inventoryService.restoreInventoryForCancelledOrder(order);

  // 保存訂單
  await order.save();

  return order;
};

/**
 * 更新訂單狀態
 * @param {String} orderId - 訂單ID
 * @param {String} newStatus - 新狀態
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 更新後的訂單
 */
export const updateOrderStatus = async (orderId, newStatus, adminId) => {
  // 有效狀態檢查
  const validStatuses = ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'];

  if (!validStatuses.includes(newStatus)) {
    throw new AppError('無效的訂單狀態', 400);
  }

  // 查找訂單
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('訂單不存在', 404);
  }

  // 檢查狀態變更合法性
  if (order.status === 'cancelled') {
    throw new AppError('已取消的訂單無法更改狀態', 400);
  }

  if (order.status === 'completed' && newStatus !== 'cancelled') {
    throw new AppError('已完成的訂單無法更改狀態', 400);
  }

  // 如果是取消訂單的請求，使用專門的取消方法
  if (newStatus === 'cancelled') {
    return await cancelOrder(orderId, '管理員取消', adminId, 'Admin');
  }

  // 更新訂單狀態
  order.status = newStatus;

  // 如果狀態變為已完成，設置完成時間
  if (newStatus === 'completed') {
    order.completedAt = new Date();
  }

  // 保存訂單
  await order.save();

  return order;
};

/**
 * 確認訂單
 * @param {String} orderId - 訂單ID
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 確認後的訂單
 */
export const confirmOrder = async (orderId, adminId) => {
  return await updateOrderStatus(orderId, 'confirmed', adminId);
};

/**
 * 完成訂單
 * @param {String} orderId - 訂單ID
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 完成後的訂單
 */
export const completeOrder = async (orderId, adminId) => {
  return await updateOrderStatus(orderId, 'completed', adminId);
};

/**
 * 產生訂單編號
 * 使用台灣時間（UTC+8）產生年月日 + 序號的訂單編號
 * @returns {Promise<Object>} 訂單日期代碼和序號
 */
export const generateOrderNumber = async () => {
  // 使用台灣時間
  const taiwanNow = getTaiwanDateTime();
  const orderDateCode = taiwanNow.toFormat('yyLLdd'); // e.g. '240410'

  // 查找今天的最後一個訂單（根據相同的 orderDateCode）
  const lastOrder = await Order.findOne({ orderDateCode }).sort({ sequence: -1 });

  // 計算新的序號
  const sequence = lastOrder ? lastOrder.sequence + 1 : 1;

  return {
    orderDateCode,
    sequence
  };
};
