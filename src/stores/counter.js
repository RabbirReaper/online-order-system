import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api';

export const useCounterStore = defineStore('counter', () => {
  // 狀態
  const activeComponent = ref('DineIn'); // 'DineIn', 'TakeOut', 'Orders'
  const currentBrand = ref(null);
  const currentStore = ref(null);
  const storeData = ref(null);
  const menuData = ref(null);
  const dishTemplates = ref([]);
  const optionCategories = ref([]);

  // 購物車相關 - 統一資料結構與 cart.js
  const cart = ref([]);
  const currentItem = ref(null);
  const currentItemIndex = ref(null);
  const manualAdjustment = ref(0); // 與 schema 保持一致
  const totalDiscount = ref(0); // 與 schema 保持一致
  const isCheckingOut = ref(false);
  const isEditMode = ref(false);

  // 訂單相關
  const todayOrders = ref([]);
  const selectedOrder = ref(null);
  const currentDate = ref('');

  // 模態框狀態管理
  const modals = ref({
    adjustment: {
      show: false,
      tempAdjustment: 0,
      adjustmentType: 'add', // 'add' 或 'subtract'
      editingOrder: null
    },
    checkout: {
      show: false,
      total: 0,
      orderId: null
    },
    cashCalculator: {
      show: false,
      total: 0
    },
    tableNumber: {
      show: false
    }
  });

  // 計算屬性 - 購物車
  const subtotal = computed(() => {
    return cart.value.reduce((total, item) => {
      return total + (item.subtotal || 0);
    }, 0);
  });

  const total = computed(() => {
    return Math.max(0, subtotal.value + manualAdjustment.value - totalDiscount.value);
  });

  // 計算屬性 - 訂單相關（與 schema 命名一致）
  const calculateOrderSubtotal = (order) => {
    if (!order || !order.items) return 0;
    return order.items.reduce((total, item) => total + (item.subtotal || 0), 0);
  };

  const calculateOrderTotalDiscount = (order) => {
    if (!order || !order.discounts) return 0;
    return order.discounts.reduce((total, discount) => total + (discount.amount || 0), 0);
  };

  const calculateOrderTotal = (order) => {
    if (!order) return 0;
    const itemsSubtotal = calculateOrderSubtotal(order);
    const adjustment = order.manualAdjustment || 0;
    const discounts = calculateOrderTotalDiscount(order);
    return Math.max(0, itemsSubtotal + adjustment - discounts);
  };

  // 台灣時區日期處理工具函數
  const getTaiwanDate = (date = null) => {
    if (date) {
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
      const targetDate = new Date(date);
      return targetDate.toISOString().split('T')[0];
    }
    const now = new Date();
    const taiwanTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000));
    return taiwanTime.toISOString().split('T')[0];
  };

  const getTaiwanDateTime = (date = null) => {
    const targetDate = date ? new Date(date) : new Date();
    const taiwanTime = new Date(targetDate.getTime() + (targetDate.getTimezoneOffset() * 60000) + (8 * 3600000));
    return taiwanTime;
  };

  // 模態框管理方法
  const openAdjustmentModal = (order = null) => {
    if (order) {
      modals.value.adjustment.editingOrder = order;
      modals.value.adjustment.tempAdjustment = Math.abs(order.manualAdjustment || 0);
      modals.value.adjustment.adjustmentType = (order.manualAdjustment || 0) >= 0 ? 'add' : 'subtract';
    } else {
      modals.value.adjustment.editingOrder = null;
      modals.value.adjustment.tempAdjustment = Math.abs(manualAdjustment.value);
      modals.value.adjustment.adjustmentType = manualAdjustment.value >= 0 ? 'add' : 'subtract';
    }
    modals.value.adjustment.show = true;
  };

  const openCheckoutModal = (orderId, total) => {
    modals.value.checkout.orderId = orderId;
    modals.value.checkout.total = total;
    modals.value.checkout.show = true;
  };

  const openCashCalculatorModal = (total) => {
    modals.value.cashCalculator.total = total;
    modals.value.cashCalculator.show = true;
  };

  const openTableNumberModal = () => {
    modals.value.tableNumber.show = true;
  };

  const closeModal = (modalName) => {
    if (modals.value[modalName]) {
      modals.value[modalName].show = false;
      // 重置相關狀態
      if (modalName === 'adjustment') {
        modals.value.adjustment.editingOrder = null;
        modals.value.adjustment.tempAdjustment = 0;
      } else if (modalName === 'checkout') {
        modals.value.checkout.orderId = null;
        modals.value.checkout.total = 0;
      }
    }
  };

  // 調帳相關方法
  const setAdjustmentType = (type) => {
    modals.value.adjustment.adjustmentType = type;
    modals.value.adjustment.tempAdjustment = 0;
  };

  const appendToAdjustment = (num) => {
    modals.value.adjustment.tempAdjustment = parseInt(`${modals.value.adjustment.tempAdjustment}${num}`);
  };

  const clearAdjustment = () => {
    modals.value.adjustment.tempAdjustment = 0;
  };

  const confirmAdjustment = async () => {
    const newAdjustment = modals.value.adjustment.adjustmentType === 'add'
      ? modals.value.adjustment.tempAdjustment
      : -modals.value.adjustment.tempAdjustment;

    if (modals.value.adjustment.editingOrder) {
      // 更新訂單調帳
      try {
        const response = await api.orderAdmin.updateOrder({
          brandId: currentBrand.value,
          storeId: currentStore.value,
          orderId: modals.value.adjustment.editingOrder._id,
          updateData: { manualAdjustment: newAdjustment }
        });

        if (response.success) {
          await fetchTodayOrders(currentBrand.value, currentStore.value);
          if (selectedOrder.value && selectedOrder.value._id === modals.value.adjustment.editingOrder._id) {
            const updatedOrder = await api.orderAdmin.getOrderById({
              brandId: currentBrand.value,
              storeId: currentStore.value,
              orderId: modals.value.adjustment.editingOrder._id
            });
            if (updatedOrder.success) {
              selectOrder(updatedOrder.order);
            }
          }
        }
      } catch (error) {
        console.error('更新訂單調帳失敗:', error);
        throw new Error('調整訂單失敗');
      }
    } else {
      // 更新購物車調帳
      manualAdjustment.value = newAdjustment;
    }

    closeModal('adjustment');
  };

  // 方法
  function setBrandAndStore(brandId, storeId) {
    currentBrand.value = brandId;
    currentStore.value = storeId;
  }

  function setActiveComponent(component) {
    activeComponent.value = component;
    if (component === 'Orders') {
      fetchTodayOrders(currentBrand.value, currentStore.value);
    }
  }

  // 載入店鋪資料
  async function fetchStoreData(brandId, storeId) {
    try {
      const response = await api.store.getStoreById({ brandId, id: storeId });
      if (response.success) {
        storeData.value = response.store;
      }
    } catch (error) {
      console.error('載入店鋪資料失敗:', error);
      throw error;
    }
  }

  // 載入菜單資料
  async function fetchMenuData(brandId, storeId) {
    try {
      const response = await api.menu.getStoreMenu({
        brandId,
        storeId,
        includeUnpublished: false
      });

      if (response.success) {
        menuData.value = response.menu;
        await fetchDishTemplates(brandId);
        await fetchOptionCategoriesWithOptions(brandId);
      }
    } catch (error) {
      console.error('載入菜單資料失敗:', error);
      throw error;
    }
  }

  // 載入餐點模板
  async function fetchDishTemplates(brandId) {
    try {
      const response = await api.dish.getAllDishTemplates({ brandId });
      if (response.success) {
        dishTemplates.value = response.templates;
      }
    } catch (error) {
      console.error('載入餐點模板失敗:', error);
    }
  }

  // 載入選項類別
  async function fetchOptionCategoriesWithOptions(brandId) {
    try {
      const response = await api.dish.getAllOptionCategories(brandId);
      if (response.success) {
        optionCategories.value = response.categories;
      }
    } catch (error) {
      console.error('載入選項類別失敗:', error);
    }
  }

  // 載入當日訂單
  async function fetchTodayOrders(brandId, storeId) {
    const taiwanToday = getTaiwanDate();
    return await fetchOrdersByDate(brandId, storeId, taiwanToday);
  }

  // 按日期載入訂單
  async function fetchOrdersByDate(brandId, storeId, dateString) {
    try {
      const normalizedDate = getTaiwanDate(dateString);
      const response = await api.orderAdmin.getStoreOrders({
        brandId,
        storeId,
        fromDate: normalizedDate,
        toDate: normalizedDate
      });

      if (response.success) {
        todayOrders.value = response.orders;
        const displayDate = new Date(normalizedDate + 'T00:00:00');
        currentDate.value = displayDate.toLocaleDateString('zh-TW');
        return response;
      } else {
        console.error('API 回應失敗:', response);
        throw new Error(response.message || '獲取訂單失敗');
      }
    } catch (error) {
      console.error('載入訂單失敗:', error);
      throw error;
    }
  }

  // 獲取餐點模板詳細資料
  function getDishTemplate(templateId) {
    return dishTemplates.value.find(template => template._id === templateId);
  }

  // 生成購物車項目的唯一鍵值
  function generateItemKey(templateId, options, note = '') {
    let optionsKey = '';
    if (options && options.length > 0) {
      optionsKey = options.map(category => {
        const selections = category.selections.map(s => s.optionId).sort().join('-');
        return `${category.optionCategoryId}:${selections}`;
      }).sort().join('|');
    }
    const noteKey = note ? `:${note}` : '';
    return `${templateId}:${optionsKey}${noteKey}`;
  }

  // 生成唯一的購物車項目 ID
  function generateUniqueItemId() {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 獲取餐點的預設選項
  function getDefaultOptionsForDish(dishTemplate) {
    const defaultOptions = [];

    if (dishTemplate.optionCategories && dishTemplate.optionCategories.length > 0) {
      dishTemplate.optionCategories.forEach(categoryRef => {
        const category = optionCategories.value.find(cat => cat._id === categoryRef.categoryId);

        if (category && category.inputType === 'single' && category.options && category.options.length > 0) {
          const firstOption = category.options[0];
          const optionId = firstOption.refOption ? firstOption.refOption._id : firstOption._id;
          const optionName = firstOption.refOption ? firstOption.refOption.name : firstOption.name;
          const optionPrice = firstOption.refOption ? (firstOption.refOption.price || 0) : (firstOption.price || 0);

          defaultOptions.push({
            optionCategoryId: category._id,
            optionCategoryName: category.name,
            selections: [{
              optionId: optionId,
              name: optionName,
              price: optionPrice
            }]
          });
        }
      });
    }

    return defaultOptions;
  }

  // 快速添加餐點到購物車
  function quickAddDishToCart(dishTemplate) {
    const defaultOptions = getDefaultOptionsForDish(dishTemplate);
    addDishToCart(dishTemplate, defaultOptions, '');
  }

  // 添加餐點到購物車
  function addDishToCart(dishTemplate, options = [], note = '') {
    let finalPrice = dishTemplate.basePrice;

    options.forEach(category => {
      category.selections.forEach(selection => {
        finalPrice += selection.price || 0;
      });
    });

    const uniqueId = generateUniqueItemId();
    const itemKey = generateItemKey(dishTemplate._id, options, note);

    const cartItem = {
      id: uniqueId,
      key: itemKey,
      dishInstance: {
        templateId: dishTemplate._id,
        name: dishTemplate.name,
        basePrice: dishTemplate.basePrice,
        finalPrice: finalPrice,
        options: options
      },
      quantity: 1,
      note: note || '',
      subtotal: finalPrice
    };

    cart.value.push(cartItem);
  }

  // 移除購物車項目
  function removeFromCart(index) {
    if (index >= 0 && index < cart.value.length) {
      cart.value.splice(index, 1);
      if (currentItemIndex.value === index) {
        clearCurrentItem();
      } else if (currentItemIndex.value > index) {
        currentItemIndex.value--;
      }
    }
  }

  // 更新數量
  function updateQuantity(index, change) {
    if (index >= 0 && index < cart.value.length) {
      const item = cart.value[index];
      const newQuantity = item.quantity + change;

      if (newQuantity <= 0) {
        removeFromCart(index);
      } else {
        item.quantity = newQuantity;
        item.subtotal = item.dishInstance.finalPrice * newQuantity;
      }
    }
  }

  // 選擇當前編輯項目
  function selectCurrentItem(item, index) {
    currentItem.value = { ...item };
    currentItemIndex.value = index;
    isEditMode.value = true;
  }

  // 清空當前項目
  function clearCurrentItem() {
    currentItem.value = null;
    currentItemIndex.value = null;
    isEditMode.value = false;
  }

  // 即時更新購物車項目
  function updateCartItemRealtime(options, note = '') {
    if (currentItemIndex.value === null || !currentItem.value) return;

    const dishTemplate = getDishTemplate(currentItem.value.dishInstance.templateId);
    if (!dishTemplate) return;

    let finalPrice = dishTemplate.basePrice;
    options.forEach(category => {
      category.selections.forEach(selection => {
        finalPrice += selection.price || 0;
      });
    });

    const newKey = generateItemKey(dishTemplate._id, options, note);
    const currentQuantity = cart.value[currentItemIndex.value].quantity;

    cart.value[currentItemIndex.value] = {
      ...cart.value[currentItemIndex.value],
      key: newKey,
      dishInstance: {
        templateId: dishTemplate._id,
        name: dishTemplate.name,
        basePrice: dishTemplate.basePrice,
        finalPrice: finalPrice,
        options: options
      },
      quantity: currentQuantity,
      note: note || '',
      subtotal: finalPrice * currentQuantity
    };

    currentItem.value = { ...cart.value[currentItemIndex.value] };
  }

  // 更新當前項目
  function updateCurrentItem(updatedItem) {
    if (currentItemIndex.value !== null) {
      cart.value[currentItemIndex.value] = { ...updatedItem };
      clearCurrentItem();
    }
  }

  // 設置調帳
  function setManualAdjustment(amount) {
    manualAdjustment.value = amount;
  }

  // 設置折扣
  function setTotalDiscount(amount) {
    totalDiscount.value = amount;
  }

  // 清空購物車
  function clearCart() {
    cart.value = [];
    currentItem.value = null;
    currentItemIndex.value = null;
    manualAdjustment.value = 0;
    totalDiscount.value = 0;
    isEditMode.value = false;
  }

  // 取消訂單
  function cancelOrder() {
    if (confirm('確定要取消當前訂單嗎？')) {
      clearCart();
    }
  }

  // 合併相同配置的購物車項目
  function mergeCartItems(cartItems) {
    const mergedItems = {};

    cartItems.forEach(item => {
      const key = item.key;

      if (mergedItems[key]) {
        mergedItems[key].quantity += item.quantity;
        mergedItems[key].subtotal += item.subtotal;
      } else {
        mergedItems[key] = {
          templateId: item.dishInstance.templateId,
          name: item.dishInstance.name,
          basePrice: item.dishInstance.basePrice,
          finalPrice: item.dishInstance.finalPrice,
          options: item.dishInstance.options,
          quantity: item.quantity,
          subtotal: item.subtotal,
          note: item.note || ''
        };
      }
    });

    return Object.values(mergedItems);
  }

  // 提交訂單
  async function checkout(orderType, customerInfo = {}) {
    if (cart.value.length === 0) {
      throw new Error('購物車是空的');
    }

    isCheckingOut.value = true;

    try {
      const mergedItems = mergeCartItems(cart.value);

      const orderData = {
        orderType: orderType,
        paymentType: 'On-site',
        paymentMethod: 'cash',
        items: mergedItems,
        customerInfo: customerInfo,
        notes: '',
        manualAdjustment: manualAdjustment.value,
        discounts: totalDiscount.value > 0 ? [{ amount: totalDiscount.value }] : []
      };

      if (orderType === 'dine_in' && customerInfo.tableNumber) {
        orderData.dineInInfo = {
          tableNumber: customerInfo.tableNumber
        };
      }

      const response = await api.orderCustomer.createOrder({
        brandId: currentBrand.value,
        storeId: currentStore.value,
        orderData
      });

      if (response.success) {
        clearCart();
        await fetchTodayOrders(currentBrand.value, currentStore.value);
        return response.order;
      } else {
        throw new Error(response.message || '訂單提交失敗');
      }
    } catch (error) {
      console.error('提交訂單失敗:', error);
      throw error;
    } finally {
      isCheckingOut.value = false;
    }
  }

  // 選擇訂單
  function selectOrder(order) {
    selectedOrder.value = order;
  }

  // 格式化時間
  function formatTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Taipei'
    });
  }

  // 格式化日期時間
  function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei'
    });
  }

  // 獲取取餐方式樣式
  function getPickupMethodClass(method) {
    const classMap = {
      '內用': 'badge bg-primary',
      '外帶': 'badge bg-success',
      '外送': 'badge bg-warning text-dark'
    };
    return classMap[method] || 'badge bg-secondary';
  }

  // 獲取訂單狀態樣式
  function getStatusClass(status) {
    const classMap = {
      'unpaid': 'badge bg-warning text-dark',
      'paid': 'badge bg-success',
      'cancelled': 'badge bg-danger'
    };
    return classMap[status] || 'badge bg-secondary';
  }

  // 格式化訂單狀態
  function formatStatus(status) {
    const statusMap = {
      'unpaid': '未結帳',
      'paid': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  }

  // 刷新資料
  async function refreshData(brandId, storeId) {
    try {
      await Promise.all([
        fetchStoreData(brandId, storeId),
        fetchMenuData(brandId, storeId),
        fetchTodayOrders(brandId, storeId)
      ]);
    } catch (error) {
      console.error('刷新資料失敗:', error);
    }
  }

  return {
    // 狀態
    activeComponent,
    currentBrand,
    currentStore,
    storeData,
    menuData,
    dishTemplates,
    optionCategories,
    cart,
    currentItem,
    currentItemIndex,
    manualAdjustment,
    totalDiscount,
    isCheckingOut,
    isEditMode,
    todayOrders,
    selectedOrder,
    currentDate,
    modals,

    // 計算屬性
    subtotal,
    total,

    // 訂單計算方法
    calculateOrderSubtotal,
    calculateOrderTotalDiscount,
    calculateOrderTotal,

    // 模態框管理
    openAdjustmentModal,
    openCheckoutModal,
    openCashCalculatorModal,
    openTableNumberModal,
    closeModal,
    setAdjustmentType,
    appendToAdjustment,
    clearAdjustment,
    confirmAdjustment,

    // 方法
    setBrandAndStore,
    setActiveComponent,
    fetchStoreData,
    fetchMenuData,
    fetchDishTemplates,
    fetchOptionCategoriesWithOptions,
    fetchTodayOrders,
    fetchOrdersByDate,
    getTaiwanDate,
    getTaiwanDateTime,
    getDishTemplate,
    getDefaultOptionsForDish,
    quickAddDishToCart,
    addDishToCart,
    removeFromCart,
    updateQuantity,
    selectCurrentItem,
    clearCurrentItem,
    updateCartItemRealtime,
    updateCurrentItem,
    setManualAdjustment,
    setTotalDiscount,
    clearCart,
    cancelOrder,
    mergeCartItems,
    checkout,
    selectOrder,
    formatTime,
    formatDateTime,
    getPickupMethodClass,
    getStatusClass,
    formatStatus,
    refreshData
  };
});
