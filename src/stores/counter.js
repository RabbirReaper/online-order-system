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
  const isEditMode = ref(false); // 新增編輯模式狀態

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

  // 生成購物車項目的唯一鍵值（僅用於比較，不用於合併）
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

  // 生成唯一的購物車項目 ID（每次都不同）
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
          // 單選類型：選擇第一個選項作為預設
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
        // 多選類型：不預設選擇任何選項
      });
    }

    return defaultOptions;
  }

  // 快速添加餐點到購物車（使用預設選項）
  function quickAddDishToCart(dishTemplate) {
    const defaultOptions = getDefaultOptionsForDish(dishTemplate);
    addDishToCart(dishTemplate, defaultOptions, '');
  }

  // 添加餐點到購物車 - 移除合併邏輯，每次都新增獨立項目
  function addDishToCart(dishTemplate, options = [], note = '') {
    // 計算最終價格
    let finalPrice = dishTemplate.basePrice;

    // 加上選項價格
    options.forEach(category => {
      category.selections.forEach(selection => {
        finalPrice += selection.price || 0;
      });
    });

    // 生成唯一的項目 ID（每次都不同）
    const uniqueId = generateUniqueItemId();

    // 生成鍵值（用於後續合併比較）
    const itemKey = generateItemKey(dishTemplate._id, options, note);

    // 創建新的購物車項目 - 每次都新增，不再檢查重複
    const cartItem = {
      id: uniqueId, // 唯一 ID
      key: itemKey, // 用於合併比較的鍵值
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

  // 移除購物車項目
  function removeFromCart(index) {
    if (index >= 0 && index < cart.value.length) {
      cart.value.splice(index, 1);
      // 如果刪除的是正在編輯的項目，清空編輯狀態
      if (currentItemIndex.value === index) {
        clearCurrentItem();
      } else if (currentItemIndex.value > index) {
        // 如果刪除的項目在當前編輯項目之前，調整索引
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

  // 即時更新購物車項目（編輯模式專用）
  function updateCartItemRealtime(options, note = '') {
    if (currentItemIndex.value === null || !currentItem.value) return;

    const dishTemplate = getDishTemplate(currentItem.value.dishInstance.templateId);
    if (!dishTemplate) return;

    // 計算新的最終價格
    let finalPrice = dishTemplate.basePrice;
    options.forEach(category => {
      category.selections.forEach(selection => {
        finalPrice += selection.price || 0;
      });
    });

    // 生成新的鍵值
    const newKey = generateItemKey(dishTemplate._id, options, note);

    // 更新當前項目（不再檢查重複，每個項目都是獨立的）
    const currentQuantity = cart.value[currentItemIndex.value].quantity;
    cart.value[currentItemIndex.value] = {
      ...cart.value[currentItemIndex.value], // 保留原有的 id
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

    // 更新當前項目的引用
    currentItem.value = { ...cart.value[currentItemIndex.value] };
  }

  // 更新當前項目（保留原方法以維持兼容性）
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
    isEditMode.value = false;
  }

  // 取消訂單
  function cancelOrder() {
    if (confirm('確定要取消當前訂單嗎？')) {
      clearCart();
    }
  }

  // 合併相同配置的購物車項目（在送出訂單時執行）
  function mergeCartItems(cartItems) {
    const mergedItems = {};

    cartItems.forEach(item => {
      const key = item.key;

      if (mergedItems[key]) {
        // 如果已存在相同配置，合併數量
        mergedItems[key].quantity += item.quantity;
        mergedItems[key].subtotal += item.subtotal;
      } else {
        // 否則新增項目
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

  // 提交訂單 - 使用客戶訂單 API，在這裡執行合併
  async function checkout(orderType, customerInfo = {}) {
    if (cart.value.length === 0) {
      throw new Error('購物車是空的');
    }

    isCheckingOut.value = true;

    try {
      // 在送出訂單時合併相同配置的項目
      const mergedItems = mergeCartItems(cart.value);

      // 準備訂單資料 - 轉換為後端期望的格式
      const orderData = {
        orderType: orderType, // 'dine_in', 'takeout'
        paymentType: 'On-site',
        paymentMethod: 'cash',
        items: mergedItems, // 使用合併後的項目
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
    isEditMode,
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
    getDefaultOptionsForDish,
    quickAddDishToCart,
    addDishToCart,
    removeFromCart,
    updateQuantity,
    selectCurrentItem,
    clearCurrentItem,
    updateCartItemRealtime,
    updateCurrentItem,
    setAdjustment,
    setDiscount,
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
