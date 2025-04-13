/**
 * 訂單金額計算服務
 * 集中處理所有與訂單金額計算相關的業務邏輯
 */

/**
 * 計算項目小計
 * @param {Number} price - 單價
 * @param {Number} quantity - 數量
 * @returns {Number} 小計金額
 */
export const calculateItemSubtotal = (price, quantity) => {
  if (typeof price !== 'number' || price < 0 || typeof quantity !== 'number' || quantity <= 0) {
    return 0;
  }
  return price * quantity;
};

/**
 * 計算訂單小計金額（所有項目的總和）
 * @param {Array} items - 訂單項目陣列
 * @returns {Number} 小計金額
 */
export const calculateOrderSubtotal = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }

  return items.reduce((total, item) => {
    if (!item || typeof item.subtotal !== 'number' || typeof item.quantity !== 'number') {
      return total;
    }
    return total + item.subtotal;
  }, 0);
};

/**
 * 計算服務費
 * @param {Number} subtotal - 小計金額
 * @param {Number} serviceChargeRate - 服務費率 (如: 0.1 表示 10%)
 * @returns {Number} 服務費金額
 */
export const calculateServiceCharge = (subtotal, serviceChargeRate = 0.1) => {
  if (typeof subtotal !== 'number' || subtotal < 0) {
    return 0;
  }

  if (typeof serviceChargeRate !== 'number' || serviceChargeRate <= 0) {
    return 0;
  }

  return Math.round(subtotal * serviceChargeRate);
};

/**
 * 計算折扣金額 (根據折扣類型)
 * @param {String} discountType - 折扣類型 ('percentage' 或 'fixed')
 * @param {Number} discountValue - 折扣值 (百分比或固定金額)
 * @param {Number} subtotal - 訂單小計金額
 * @param {Number} maxDiscountAmount - 最大折扣金額 (僅對百分比折扣有效)
 * @returns {Number} 計算後的折扣金額
 */
export const calculateDiscountAmount = (discountType, discountValue, subtotal, maxDiscountAmount = null) => {
  if (typeof subtotal !== 'number' || subtotal <= 0) {
    return 0;
  }

  if (typeof discountValue !== 'number' || discountValue <= 0) {
    return 0;
  }

  let discountAmount = 0;

  if (discountType === 'percentage') {
    const percentage = Math.min(100, discountValue) / 100;
    discountAmount = subtotal * percentage;

    if (maxDiscountAmount !== null && typeof maxDiscountAmount === 'number' && maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, maxDiscountAmount);
    }
  } else if (discountType === 'fixed') {
    discountAmount = Math.min(discountValue, subtotal);
  }

  return Math.round(discountAmount);
};

/**
 * 計算訂單全部折扣總額
 * @param {Array} discounts - 折扣列表
 * @returns {Number} 折扣總額
 */
export const calculateTotalDiscount = (discounts = []) => {
  if (!Array.isArray(discounts) || discounts.length === 0) {
    return 0;
  }

  return discounts.reduce((total, discount) => {
    if (!discount || typeof discount.amount !== 'number') {
      return total;
    }
    return total + discount.amount;
  }, 0);
};

/**
 * 計算訂單總金額
 * @param {Number} subtotal - 訂單小計金額
 * @param {Number} serviceCharge - 服務費
 * @param {Number} deliveryFee - 外送費用
 * @param {Number} totalDiscount - 折扣總額
 * @returns {Number} 計算後的訂單總金額
 */
export const calculateOrderTotal = (subtotal, serviceCharge = 0, deliveryFee = 0, totalDiscount = 0) => {
  const total = subtotal + serviceCharge + deliveryFee - totalDiscount;
  return Math.max(0, total); // 確保總金額至少為 0
};

/**
 * 計算訂單所有金額 (給控制器和模型調用的主要方法)
 * @param {Object} order - 訂單對象或訂單數據
 * @returns {Object} 包含所有計算結果的對象
 */
export const calculateAllOrderAmounts = (order) => {
  // 防止空訂單
  if (!order || !Array.isArray(order.items)) {
    return {
      subtotal: 0,
      serviceCharge: 0,
      deliveryFee: 0,
      totalDiscount: 0,
      total: 0
    };
  }

  // 計算訂單小計
  const subtotal = calculateOrderSubtotal(order.items);

  // 計算服務費 (預設10%)
  // const serviceCharge = calculateServiceCharge(subtotal, 0.1);

  // 計算外送費
  const deliveryFee = order.orderType === 'delivery' && order.deliveryInfo ?
    (order.deliveryInfo.deliveryFee || 0) : 0;

  // 計算折扣總額
  const totalDiscount = calculateTotalDiscount(order.discounts);

  // 計算最終總額
  const total = calculateOrderTotal(subtotal, serviceCharge, deliveryFee, totalDiscount);

  return {
    subtotal,
    serviceCharge,
    deliveryFee,
    totalDiscount,
    total
  };
};

/**
 * 訂單金額計算服務 (用於 Order 模型)
 * @param {Object} order - Order 模型實例
 */
export const updateOrderAmounts = (order) => {
  // 確保是有效的訂單對象
  if (!order || !Array.isArray(order.items)) {
    return false;
  }

  // 計算所有金額
  const { subtotal, serviceCharge, deliveryFee, totalDiscount, total } = calculateAllOrderAmounts(order);

  // 更新訂單對象
  order.subtotal = subtotal;
  order.serviceCharge = serviceCharge;

  // 如果是外送訂單，更新運費
  if (order.orderType === 'delivery' && order.deliveryInfo) {
    order.deliveryInfo.deliveryFee = deliveryFee;
  }

  order.totalDiscount = totalDiscount;
  order.total = total;

  return true;
};
