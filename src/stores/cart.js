// src/stores/cart.js
// 修正版本 - 添加餐點備註傳送

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import api from '@/api';

export const useCartStore = defineStore('cart', () => {
  // 狀態
  const items = ref([]); // 購物車內的餐點項目陣列
  const orderType = ref(''); // 'dine_in', 'takeout', 'delivery'
  const customerInfo = ref({
    name: '',
    phone: '',
  }); // 顧客基本資訊，可能包含 email 等
  const deliveryInfo = ref({
    address: '',
    estimatedTime: null,
    deliveryFee: 0
  }); // 外送資訊，可能包含郵遞區號等
  const dineInInfo = ref({
    tableNumber: '',
    numberOfGuests: 0
  }); // 內用資訊，可能包含座位區域等
  const estimatedPickupTime = ref(null); // Date 對象，預計取餐時間
  const notes = ref(''); // 訂單備註，如餐點特殊要求
  const appliedCoupons = ref([]); // 已應用的優惠券列表
  const paymentType = ref(''); // 'On-site', 'Online'
  const paymentMethod = ref(''); // 'cash', 'credit_card', 'line_pay', 'other'
  const isStaffMode = ref(false); // true=員工點餐模式, false=顧客模式
  const currentBrand = ref(null); // 當前品牌ID
  const currentStore = ref(null); // 當前店鋪ID
  const serviceChargeRate = ref(0); // 服務費率，0.1 表示 10%
  const isSubmitting = ref(false); // 是否正在提交訂單
  const validationErrors = ref({}); // 驗證錯誤信息對象

  // 計算屬性
  const subtotal = computed(() => {
    return items.value.reduce((total, item) => total + item.subtotal, 0);
  });

  const serviceCharge = computed(() => {
    // 僅內用時計算服務費
    return orderType.value === 'dine_in' ? Math.round(subtotal.value * serviceChargeRate.value) : 0;
  });

  const discountAmount = computed(() => {
    return appliedCoupons.value.reduce((total, coupon) => total + coupon.amount, 0);
  });

  const total = computed(() => {
    let finalTotal = subtotal.value + serviceCharge.value - discountAmount.value;

    // 如果是外送，加上運費
    if (orderType.value === 'delivery') {
      finalTotal += deliveryInfo.value.deliveryFee;
    }

    return finalTotal > 0 ? finalTotal : 0;
  });

  const itemCount = computed(() => {
    return items.value.reduce((count, item) => count + item.quantity, 0);
  });

  const isCartEmpty = computed(() => {
    return items.value.length === 0;
  });

  const isValid = computed(() => {
    validateOrder();
    return Object.keys(validationErrors.value).length === 0;
  });

  // 初始化所有欄位，不管當前訂單類型是什麼
  function initializeCartFields() {
    // 初始化所有訂單類型相關的資料結構（如果還未初始化）
    if (!deliveryInfo.value || typeof deliveryInfo.value !== 'object') {
      deliveryInfo.value = {
        address: '',
        estimatedTime: null,
        deliveryFee: 0
      };
    }

    if (!dineInInfo.value || typeof dineInInfo.value !== 'object') {
      dineInInfo.value = {
        tableNumber: '',
        numberOfGuests: 0
      };
    }

    if (estimatedPickupTime.value === undefined) {
      estimatedPickupTime.value = null;
    }
  }

  // 初始化 store
  initializeCartFields();

  // 方法
  function setBrandAndStore(brandId, storeId) {
    currentBrand.value = brandId;
    currentStore.value = storeId;
  }

  function addItem(dishInstance, quantity = 1, options = []) {
    if (!dishInstance || !dishInstance._id) {
      console.error('無效的餐點:', dishInstance);
      return;
    }

    if (quantity <= 0) {
      console.error('無效的數量:', quantity);
      return;
    }

    // 生成帶選項的餐點唯一鍵值
    const itemKey = generateItemKey(dishInstance._id, options);

    // 檢查購物車中是否已有相同的餐點及選項
    const existingItemIndex = items.value.findIndex(
      item => item.key === itemKey
    );

    if (existingItemIndex !== -1) {
      // 如果餐點已存在，更新數量
      const newQuantity = items.value[existingItemIndex].quantity + quantity;
      updateItemQuantity(existingItemIndex, newQuantity);
    } else {
      // 計算基本價格和選項額外費用
      let finalPrice = dishInstance.finalPrice || dishInstance.basePrice;
      let optionsPrice = 0;

      if (options && options.length > 0) {
        optionsPrice = options.reduce((total, option) => total + (option.price || 0), 0);
      }

      // 添加新餐點到購物車
      items.value.push({
        key: itemKey,
        dishInstance: {
          _id: dishInstance._id,
          name: dishInstance.name,
          basePrice: dishInstance.basePrice,
          finalPrice: finalPrice
        },
        options: options,
        optionsPrice: optionsPrice,
        quantity: quantity,
        subtotal: (finalPrice + optionsPrice) * quantity,
        note: dishInstance.note || '' // 修正：添加餐點備註
      });
    }
  }

  function generateItemKey(dishId, options) {
    // 根據餐點ID和選項創建唯一鍵值
    const optionsKey = options && options.length > 0
      ? options.map(o => o._id).sort().join('-')
      : '';
    return `${dishId}:${optionsKey}`;
  }

  function removeItem(index) {
    if (index >= 0 && index < items.value.length) {
      items.value.splice(index, 1);
    }
  }

  function updateItemQuantity(index, quantity) {
    if (index < 0 || index >= items.value.length) {
      console.error('無效的餐點索引:', index);
      return;
    }

    if (quantity <= 0) {
      removeItem(index);
    } else {
      const item = items.value[index];
      const basePrice = item.dishInstance.finalPrice || item.dishInstance.basePrice;
      const totalItemPrice = basePrice + (item.optionsPrice || 0);

      item.quantity = quantity;
      item.subtotal = totalItemPrice * quantity;
    }
  }

  function clearCart() {
    items.value = [];
    appliedCoupons.value = [];
    notes.value = '';

    if (!isStaffMode.value) {
      customerInfo.value = {
        name: '',
        phone: '',
      };
    }

    // 清空所有訂單類型相關欄位
    deliveryInfo.value = {
      address: '',
      estimatedTime: null,
      deliveryFee: 0
    };

    dineInInfo.value = {
      tableNumber: '',
      numberOfGuests: 0
    };

    estimatedPickupTime.value = null;

    validationErrors.value = {};
  }

  // 可選的清空函數，只在用戶主動要求時使用
  function resetOrderTypeSpecificInfo() {
    // 根據用戶確認後，才清空特定訂單類型的資訊
    if (orderType.value !== 'delivery') {
      deliveryInfo.value = {
        address: '',
        estimatedTime: null,
        deliveryFee: 0
      };
    }

    if (orderType.value !== 'dine_in') {
      dineInInfo.value = {
        tableNumber: '',
        numberOfGuests: 0
      };
    }

    if (orderType.value !== 'takeout') {
      estimatedPickupTime.value = null;
    }
  }

  function setOrderType(type) {
    if (['dine_in', 'takeout', 'delivery'].includes(type)) {
      orderType.value = type;
    } else {
      console.error('無效的訂單類型:', type);
    }
  }

  function setCustomerInfo(info) {
    customerInfo.value = { ...customerInfo.value, ...info };
  }

  function setDeliveryInfo(info) {
    deliveryInfo.value = { ...deliveryInfo.value, ...info };
  }

  function setDineInInfo(info) {
    dineInInfo.value = { ...dineInInfo.value, ...info };
  }

  function setPickupTime(time) {
    estimatedPickupTime.value = time;
  }

  function setNotes(text) {
    notes.value = text;
  }

  function applyCoupon(coupon) {
    if (!coupon || !coupon.couponId) {
      console.error('無效的優惠券:', coupon);
      return;
    }

    // 檢查優惠券是否已使用
    const existingCouponIndex = appliedCoupons.value.findIndex(
      c => c.couponId === coupon.couponId
    );

    if (existingCouponIndex === -1) {
      appliedCoupons.value.push(coupon);
    }
  }

  function removeCoupon(couponId) {
    appliedCoupons.value = appliedCoupons.value.filter(
      coupon => coupon.couponId !== couponId
    );
  }

  function setPaymentMethod(method, type = 'On-site') {
    paymentMethod.value = method;
    paymentType.value = type;
  }

  function toggleStaffMode() {
    isStaffMode.value = !isStaffMode.value;
  }

  function validateOrder() {
    const errors = {};

    // 驗證購物車項目
    if (items.value.length === 0) {
      errors.items = '購物車是空的';
    }

    // 驗證顧客資訊
    if (!customerInfo.value.name) {
      errors.customerName = '請填寫姓名';
    }

    if (!customerInfo.value.phone) {
      errors.customerPhone = '請填寫電話號碼';
    }

    // 驗證訂單類型
    if (!orderType.value) {
      errors.orderType = '請選擇訂單類型';
    }

    // 根據訂單類型驗證特定欄位
    if (orderType.value === 'delivery') {
      if (!deliveryInfo.value.address) {
        errors.deliveryAddress = '請填寫配送地址';
      }
    } else if (orderType.value === 'dine_in') {
      if (!dineInInfo.value.tableNumber) {
        errors.tableNumber = '請填寫桌號';
      }
    } else if (orderType.value === 'takeout') {
      if (!estimatedPickupTime.value) {
        errors.pickupTime = '請選擇取餐時間';
      }
    }

    validationErrors.value = errors;
    return Object.keys(errors).length === 0;
  }

  async function submitOrder() {
    if (isSubmitting.value) {
      return;
    }

    if (!validateOrder()) {
      return { success: false, errors: validationErrors.value };
    }

    if (!currentBrand.value || !currentStore.value) {
      validationErrors.value.store = '請選擇店鋪';
      return { success: false, errors: validationErrors.value };
    }

    try {
      isSubmitting.value = true;

      // 準備訂單資料 - 修正：添加餐點備註
      const orderData = {
        items: items.value.map(item => ({
          dishInstance: item.dishInstance._id,
          quantity: item.quantity,
          subtotal: item.subtotal,
          note: item.note || '', // 修正：添加餐點備註
          options: item.options.map(opt => opt._id)
        })),
        orderType: orderType.value,
        subtotal: subtotal.value,
        serviceCharge: serviceCharge.value,
        discounts: appliedCoupons.value.map(coupon => ({
          couponId: coupon.couponId,
          amount: coupon.amount
        })),
        totalDiscount: discountAmount.value,
        total: total.value,
        paymentType: paymentType.value,
        paymentMethod: paymentMethod.value,
        customerInfo: customerInfo.value,
        notes: notes.value
      };

      // 只添加當前訂單類型所需的特定資訊
      if (orderType.value === 'delivery') {
        orderData.deliveryInfo = deliveryInfo.value;
      } else if (orderType.value === 'dine_in') {
        orderData.dineInInfo = dineInInfo.value;
      } else if (orderType.value === 'takeout') {
        orderData.estimatedPickupTime = estimatedPickupTime.value;
      }

      // 提交訂單
      const response = await api.order.createOrder({
        brandId: currentBrand.value,
        storeId: currentStore.value,
        orderData
      });

      // 成功後清空購物車
      clearCart();

      return { success: true, order: response.order };
    } catch (error) {
      console.error('提交訂單錯誤:', error);
      return {
        success: false,
        error: error.message || '訂單提交失敗'
      };
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    // 狀態
    items,
    orderType,
    customerInfo,
    deliveryInfo,
    dineInInfo,
    estimatedPickupTime,
    notes,
    appliedCoupons,
    paymentType,
    paymentMethod,
    isStaffMode,
    currentBrand,
    currentStore,
    isSubmitting,
    validationErrors,

    // 計算屬性
    subtotal,
    serviceCharge,
    discountAmount,
    total,
    itemCount,
    isCartEmpty,
    isValid,

    // 方法
    setBrandAndStore,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    resetOrderTypeSpecificInfo,
    setOrderType,
    setCustomerInfo,
    setDeliveryInfo,
    setDineInInfo,
    setPickupTime,
    setNotes,
    applyCoupon,
    removeCoupon,
    setPaymentMethod,
    toggleStaffMode,
    validateOrder,
    submitOrder
  };
});
