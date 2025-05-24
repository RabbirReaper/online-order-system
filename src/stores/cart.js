// src/stores/cart.js - 修正版本
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
  const paymentType = ref('On-site'); // 'On-site', 'Online'
  const paymentMethod = ref('cash'); // 'cash', 'credit_card', 'line_pay', 'other'
  const isStaffMode = ref(false); // true=員工點餐模式, false=顧客模式
  const currentBrand = ref(null); // 當前品牌ID
  const currentStore = ref(null); // 當前店鋪ID
  const serviceChargeRate = ref(0.1); // 服務費率，0.1 表示 10%
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

  // 修正後的 addItem 方法，使資料結構符合 DishInstance Model
  function addItem(cartItem) {
    // cartItem 結構：{ dishInstance, quantity, note, subtotal }
    if (!cartItem || !cartItem.dishInstance || !cartItem.dishInstance.templateId) {
      console.error('無效的購物車項目:', cartItem);
      return;
    }

    if (cartItem.quantity <= 0) {
      console.error('無效的數量:', cartItem.quantity);
      return;
    }

    // 生成購物車項目的唯一鍵值 (包含 note)
    const itemKey = generateItemKey(cartItem.dishInstance.templateId, cartItem.dishInstance.options, cartItem.note);

    // 檢查購物車中是否已有相同的餐點及選項
    const existingItemIndex = items.value.findIndex(item => item.key === itemKey);

    if (existingItemIndex !== -1) {
      // 如果餐點已存在，更新數量
      const newQuantity = items.value[existingItemIndex].quantity + cartItem.quantity;
      updateItemQuantity(existingItemIndex, newQuantity);
    } else {
      // 添加新餐點到購物車，結構符合前端需求
      const newItem = {
        key: itemKey,
        dishInstance: {
          templateId: cartItem.dishInstance.templateId,
          name: cartItem.dishInstance.name,
          basePrice: cartItem.dishInstance.basePrice,
          finalPrice: cartItem.dishInstance.finalPrice,
          options: cartItem.dishInstance.options
          // 注意：移除了 note，因為它屬於訂單項目層級
        },
        quantity: cartItem.quantity,
        note: cartItem.note || '', // note 在訂單項目層級
        subtotal: cartItem.subtotal
      };

      items.value.push(newItem);
    }

    // console.log('添加到購物車:', { itemKey, totalItems: items.value.length });
  }


  // 生成基於餐點ID、選項和特殊要求的唯一鍵值
  function generateItemKey(templateId, options, note = '') {
    // 將選項轉換為字符串以生成唯一鍵值
    let optionsKey = '';
    if (options && options.length > 0) {
      optionsKey = options.map(category => {
        const selections = category.selections.map(s => s.optionId).sort().join('-');
        return `${category.optionCategoryId}:${selections}`;
      }).sort().join('|');
    }

    // 包含備註在鍵值中，確保不同備註的相同餐點被視為不同項目
    const noteKey = note ? `:${note}` : '';
    return `${templateId}:${optionsKey}${noteKey}`;
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
      const finalPrice = item.dishInstance.finalPrice || item.dishInstance.basePrice;

      item.quantity = quantity;
      item.subtotal = finalPrice * quantity;
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

    // 根據訂單類型進行不同的驗證
    switch (orderType.value) {
      case 'dine_in':
        // 內用：只需要桌號
        if (!dineInInfo.value.tableNumber) {
          errors.tableNumber = '請填寫桌號';
        }
        break;

      case 'takeout':
        // 外帶：需要顾客資訊
        if (!customerInfo.value.name) {
          errors.customerName = '請填寫姓名';
        }
        if (!customerInfo.value.phone) {
          errors.customerPhone = '請填寫電話號碼';
        }
        // 注意：外帶不需要驗證 estimatedPickupTime，因為可以是 null（代表盡快取餐）
        break;

      case 'delivery':
        // 外送：需要顾客資訊和配送地址
        if (!customerInfo.value.name) {
          errors.customerName = '請填寫姓名';
        }
        if (!customerInfo.value.phone) {
          errors.customerPhone = '請填寫電話號碼';
        }
        if (!deliveryInfo.value.address) {
          errors.deliveryAddress = '請填寫配送地址';
        }
        break;

      default:
        errors.orderType = '請選擇訂單類型';
    }

    validationErrors.value = errors;
    return Object.keys(errors).length === 0;
  }

  async function submitOrder() {
    if (isSubmitting.value) {
      return { success: false, message: '訂單正在處理中...' };
    }

    if (!validateOrder()) {
      return { success: false, errors: validationErrors.value };
    }

    if (!currentBrand.value || !currentStore.value) {
      validationErrors.value.store = '請選擇店鋪';
      console.error('缺少品牌或店鋪ID:', {
        brandId: currentBrand.value,
        storeId: currentStore.value
      });
      return { success: false, errors: validationErrors.value };
    }

    try {
      isSubmitting.value = true;

      // 準備訂單資料，符合後端 API 期望的格式
      const orderData = {
        // 訂單項目 - 轉換為後端期望的格式
        items: items.value.map(item => ({
          templateId: item.dishInstance.templateId,
          name: item.dishInstance.name,
          price: item.dishInstance.finalPrice || item.dishInstance.basePrice,
          options: item.dishInstance.options || [],
          quantity: item.quantity,
          subtotal: item.subtotal,
          note: item.note || '',
          specialInstructions: item.note || '' // 備用欄位
        })),

        // 訂單基本資訊
        orderType: orderType.value,
        subtotal: subtotal.value,
        serviceCharge: serviceCharge.value,
        totalDiscount: discountAmount.value,
        total: total.value,
        manualAdjustment: 0,

        // 付款資訊
        paymentType: paymentType.value,
        paymentMethod: paymentMethod.value,

        // 客戶資訊
        customerInfo: customerInfo.value,

        // 訂單備註
        notes: notes.value,

        // 折扣資訊
        discounts: appliedCoupons.value.map(coupon => ({
          couponId: coupon.couponId,
          amount: coupon.amount
        }))
      };

      // 根據訂單類型添加特定資訊
      if (orderType.value === 'delivery') {
        orderData.deliveryInfo = deliveryInfo.value;
      } else if (orderType.value === 'dine_in') {
        orderData.dineInInfo = dineInInfo.value;
      } else if (orderType.value === 'takeout') {
        orderData.estimatedPickupTime = estimatedPickupTime.value;
      }

      console.log('=== Pinia 提交訂單資料 ===');
      console.log('品牌ID:', currentBrand.value);
      console.log('店鋪ID:', currentStore.value);
      console.log('訂單資料:', JSON.stringify(orderData, null, 2));
      console.log('========================');

      // 檢查 API 是否存在
      if (!api.orderCustomer || !api.orderCustomer.createOrder) {
        throw new Error('API orderCustomer.createOrder 未定義');
      }

      // 提交訂單
      const response = await api.orderCustomer.createOrder({
        brandId: currentBrand.value,
        storeId: currentStore.value,
        orderData
      });

      console.log('=== API 回應 ===');
      console.log('Response:', response);
      console.log('===============');

      if (response && response.success) {
        // 將訂單 ID 和資料存儲到 sessionStorage
        sessionStorage.setItem('lastOrderId', response.order._id);
        sessionStorage.setItem('lastOrderData', JSON.stringify(response.order));

        // 成功後清空購物車
        clearCart();

        return {
          success: true,
          order: response.order,
          orderId: response.order._id
        };
      } else {
        console.error('API 回應失敗:', response);
        throw new Error(response?.message || '訂單創建失敗');
      }

    } catch (error) {
      console.error('提交訂單錯誤 - 詳細資訊:', {
        error: error,
        message: error.message,
        stack: error.stack,
        response: error.response
      });

      let errorMessage = '訂單提交失敗';

      if (error.response) {
        // API 回應錯誤
        errorMessage = error.response.data?.message || `API 錯誤: ${error.response.status}`;
      } else if (error.message) {
        // 其他錯誤
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
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
