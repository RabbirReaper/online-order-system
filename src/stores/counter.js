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
  const adjustment = ref(0);
  const discount = ref(0);
  const isCheckingOut = ref(false);

  // 訂單相關
  const todayOrders = ref([]);
  const selectedOrder = ref(null);
  const currentDate = ref('');

  // 計算屬性
  const subtotal = computed(() => {
    return cart.value.reduce((total, item) => {
      // 統一使用 subtotal 計算，與 cart.js 保持一致
      return total + (item.subtotal || 0);
    }, 0);
  });

  const total = computed(() => {
    return Math.max(0, subtotal.value + adjustment.value - discount.value);
  });

  // 台灣時區日期處理工具函數 - 修復版
  const getTaiwanDate = (date = null) => {
    if (date) {
      // 如果提供了日期，直接返回 YYYY-MM-DD 格式
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
      const targetDate = new Date(date);
      return targetDate.toISOString().split('T')[0];
    }

    // 獲取當前台灣時間的日期
    const now = new Date();
    // 台灣時區是 UTC+8
    const taiwanTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000));
    return taiwanTime.toISOString().split('T')[0];
  };

  const getTaiwanDateTime = (date = null) => {
    const targetDate = date ? new Date(date) : new Date();
    // 台灣時區是 UTC+8
    const taiwanTime = new Date(targetDate.getTime() + (targetDate.getTimezoneOffset() * 60000) + (8 * 3600000));
    return taiwanTime;
  };

  // 方法
  function setBrandAndStore(brandId, storeId) {
    currentBrand.value = brandId;
    currentStore.value = storeId;
  }

  function setActiveComponent(component) {
    activeComponent.value = component;

    // 切換到訂單頁面時載入當日訂單
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

        // 載入餐點模板詳細資料
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

  // 載入選項類別（使用統一的 API，確保資料結構一致）
  async function fetchOptionCategoriesWithOptions(brandId) {
    try {
      // 使用 getAllOptionCategories，它會 populate 完整的選項資料
      const response = await api.dish.getAllOptionCategories(brandId);
      if (response.success) {
        optionCategories.value = response.categories;
      }
    } catch (error) {
      console.error('載入選項類別失敗:', error);
    }
  }

  // 改善當日訂單載入，正確處理台灣時區
  async function fetchTodayOrders(brandId, storeId) {
    const taiwanToday = getTaiwanDate();
    return await fetchOrdersByDate(brandId, storeId, taiwanToday);
  }

  // 新增按日期載入訂單的方法 - 修復版
  async function fetchOrdersByDate(brandId, storeId, dateString) {
    try {
      // 確保日期格式正確 (YYYY-MM-DD)
      const normalizedDate = getTaiwanDate(dateString);

      const response = await api.orderAdmin.getStoreOrders({
        brandId,
        storeId,
        fromDate: normalizedDate,
        toDate: normalizedDate
      });

      if (response.success) {
        todayOrders.value = response.orders;
        // 更新當前日期顯示
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

  // 添加餐點到購物車 - 統一資料結構
  function addDishToCart(dishTemplate, options = [], note = '') {
    // 計算最終價格
    let finalPrice = dishTemplate.basePrice;

    // 加上選項價格
    options.forEach(category => {
      category.selections.forEach(selection => {
        finalPrice += selection.price || 0;
      });
    });

    // 生成唯一鍵值
    const itemKey = generateItemKey(dishTemplate._id, options, note);

    // 檢查是否已存在相同配置的項目
    const existingIndex = cart.value.findIndex(item => item.key === itemKey);

    if (existingIndex !== -1) {
      // 如果存在，增加數量
      const existingItem = cart.value[existingIndex];
      existingItem.quantity += 1;
      existingItem.subtotal = finalPrice * existingItem.quantity;
    } else {
      // 創建新的購物車項目 - 使用與 cart.js 一致的結構
      const cartItem = {
        key: itemKey,
        dishInstance: {
          templateId: dishTemplate._id,
          name: dishTemplate.name,
          basePrice: dishTemplate.basePrice,
          finalPrice: finalPrice,
          options: options // 完整的選項資料，包含 name 和 price
        },
        quantity: 1,
        note: note || '',
        subtotal: finalPrice
      };

      cart.value.push(cartItem);
    }

  }

  // 移除購物車項目
  function removeFromCart(index) {
    if (index >= 0 && index < cart.value.length) {
      cart.value.splice(index, 1);
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
  }

  // 清空當前項目
  function clearCurrentItem() {
    currentItem.value = null;
    currentItemIndex.value = null;
  }

  // 更新當前項目
  function updateCurrentItem(updatedItem) {
    if (currentItemIndex.value !== null) {
      cart.value[currentItemIndex.value] = { ...updatedItem };
      clearCurrentItem();
    }
  }

  // 設置調帳
  function setAdjustment(amount) {
    adjustment.value = amount;
  }

  // 設置折扣
  function setDiscount(amount) {
    discount.value = amount;
  }

  // 清空購物車
  function clearCart() {
    cart.value = [];
    currentItem.value = null;
    currentItemIndex.value = null;
    adjustment.value = 0;
    discount.value = 0;
  }

  // 取消訂單
  function cancelOrder() {
    if (confirm('確定要取消當前訂單嗎？')) {
      clearCart();
    }
  }

  // 提交訂單 - 使用客戶訂單 API
  async function checkout(orderType, customerInfo = {}) {
    if (cart.value.length === 0) {
      throw new Error('購物車是空的');
    }

    isCheckingOut.value = true;

    try {
      // 準備訂單資料 - 轉換為後端期望的格式
      const orderData = {
        orderType: orderType, // 'dine_in', 'takeout'
        paymentType: 'On-site',
        paymentMethod: 'cash',
        items: cart.value.map(item => ({
          templateId: item.dishInstance.templateId,
          name: item.dishInstance.name,
          basePrice: item.dishInstance.basePrice,
          finalPrice: item.dishInstance.finalPrice,
          options: item.dishInstance.options,
          quantity: item.quantity,
          subtotal: item.subtotal,
          note: item.note || ''
        })),
        customerInfo: customerInfo,
        notes: '',
        manualAdjustment: adjustment.value,
        discounts: discount.value > 0 ? [{ amount: discount.value }] : []
      };

      // 根據訂單類型添加特定資訊
      if (orderType === 'dine_in' && customerInfo.tableNumber) {
        orderData.dineInInfo = {
          tableNumber: customerInfo.tableNumber
        };
      }

      // 使用客戶訂單 API 創建訂單
      const response = await api.orderCustomer.createOrder({
        brandId: currentBrand.value,
        storeId: currentStore.value,
        orderData
      });

      if (response.success) {
        // 清空購物車
        clearCart();

        // 重新載入訂單列表
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

  // 格式化時間 - 使用台灣時區
  function formatTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Taipei'
    });
  }

  // 格式化日期時間 - 使用台灣時區
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
    adjustment,
    discount,
    isCheckingOut,
    todayOrders,
    selectedOrder,
    currentDate,

    // 計算屬性
    subtotal,
    total,

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
    addDishToCart,
    removeFromCart,
    updateQuantity,
    selectCurrentItem,
    clearCurrentItem,
    updateCurrentItem,
    setAdjustment,
    setDiscount,
    clearCart,
    cancelOrder,
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
