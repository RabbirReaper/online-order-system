/**
 * 價格計算相關工具函數
 */

/**
 * 計算餐點實例的最終價格
 * @param {Number} basePrice - 基本價格
 * @param {Array} options - 選擇的選項陣列
 * @returns {Number} 計算後的最終價格
 */
export const calculateDishFinalPrice = (basePrice, options = []) => {
  if (!basePrice || typeof basePrice !== 'number') {
    throw new Error('基本價格必須為有效數字');
  }

  // 如果沒有選項，直接返回基本價格
  if (!Array.isArray(options) || options.length === 0) {
    return basePrice;
  }

  // 計算所有選項的額外費用總和
  const optionsTotal = options.reduce((total, optionCategory) => {
    // 如果選項類別無效或沒有選擇項目，直接返回當前總和
    if (!optionCategory || !Array.isArray(optionCategory.selections)) {
      return total;
    }

    // 計算此類別內所有選擇項目的價格總和
    const categoryTotal = optionCategory.selections.reduce((catTotal, selection) => {
      // 如果選擇項目有效且有價格，加到類別總和
      if (selection && typeof selection.price === 'number') {
        return catTotal + selection.price;
      }
      return catTotal;
    }, 0);

    return total + categoryTotal;
  }, 0);

  // 計算最終價格
  const finalPrice = basePrice + optionsTotal;

  // 確保價格為正數，最少為 0
  return Math.max(0, finalPrice);
};

/**
 * 計算訂單小計金額
 * @param {Array} items - 訂單項目陣列
 * @returns {Number} 計算後的小計金額
 */
export const calculateOrderSubtotal = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }

  // 計算所有項目的小計金額總和
  return items.reduce((total, item) => {
    // 如果項目無效或缺少必要屬性，直接返回當前總和
    if (!item || typeof item.subtotal !== 'number' || typeof item.quantity !== 'number') {
      return total;
    }

    return total + item.subtotal;
  }, 0);
};

/**
 * 計算訂單服務費
 * @param {Number} subtotal - 訂單小計金額
 * @param {Number} serviceChargeRate - 服務費率 (如: 0.1 表示 10%)
 * @returns {Number} 計算後的服務費
 */
export const calculateServiceCharge = (subtotal, serviceChargeRate = 0.1) => {
  if (typeof subtotal !== 'number' || subtotal < 0) {
    return 0;
  }

  if (typeof serviceChargeRate !== 'number' || serviceChargeRate <= 0) {
    return 0;
  }

  // 計算服務費 (四捨五入到整數)
  return Math.round(subtotal * serviceChargeRate);
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
 * 計算餐點項目小計
 * @param {Number} price - 餐點價格
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

  // 根據折扣類型計算折扣金額
  if (discountType === 'percentage') {
    // 百分比折扣 (例: 20 表示 20%)
    const percentage = Math.min(100, discountValue) / 100;
    discountAmount = subtotal * percentage;

    // 檢查是否超過最大折扣金額
    if (maxDiscountAmount !== null && typeof maxDiscountAmount === 'number' && maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, maxDiscountAmount);
    }
  } else if (discountType === 'fixed') {
    // 固定金額折扣
    discountAmount = Math.min(discountValue, subtotal); // 折扣不能超過小計金額
  }

  return Math.round(discountAmount); // 四捨五入到整數
};
