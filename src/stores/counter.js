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

  // 購物車相關
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
    return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0);
  });

  const total = computed(() => {
    return Math.max(0, subtotal.value + adjustment.value - discount.value);
  });

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
        await fetchOptionCategories(brandId);
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
  async function fetchOptionCategories(brandId) {
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
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const response = await api.orderAdmin.getStoreOrders({
        brandId,
        storeId,
        fromDate: startDate.toISOString().split('T')[0],
        toDate: endDate.toISOString().split('T')[0]
      });

      if (response.success) {
        todayOrders.value = response.orders;
        currentDate.value = today.toLocaleDateString('zh-TW');
      }
    } catch (error) {
      console.error('載入當日訂單失敗:', error);
      throw error;
    }
  }

  // 獲取餐點模板詳細資料
  function getDishTemplate(templateId) {
    return dishTemplates.value.find(template => template._id === templateId);
  }

  // 添加餐點到購物車
  function addDishToCart(dishTemplate, options = [], note = '') {
    // 計算價格
    let finalPrice = dishTemplate.basePrice;

    // 加上選項價格
    options.forEach(category => {
      category.selections.forEach(selection => {
        finalPrice += selection.price || 0;
      });
    });

    // 生成購物車項目
    const cartItem = {
      id: Date.now(),
      templateId: dishTemplate._id,
      name: dishTemplate.name,
      basePrice: dishTemplate.basePrice,
      finalPrice: finalPrice,
      price: finalPrice,
      options: options,
      note: note,
      quantity: 1
    };

    // 檢查是否已存在相同配置的項目
    const existingIndex = cart.value.findIndex(item =>
      item.templateId === cartItem.templateId &&
      JSON.stringify(item.options) === JSON.stringify(cartItem.options) &&
      item.note === cartItem.note
    );

    if (existingIndex !== -1) {
      // 如果存在，增加數量
      cart.value[existingIndex].quantity += 1;
    } else {
      // 如果不存在，添加新項目
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
      const newQuantity = cart.value[index].quantity + change;
      if (newQuantity <= 0) {
        removeFromCart(index);
      } else {
        cart.value[index].quantity = newQuantity;
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

  // 提交訂單
  async function checkout(orderType, customerInfo = {}) {
    if (cart.value.length === 0) {
      throw new Error('購物車是空的');
    }

    isCheckingOut.value = true;

    try {
      // 準備訂單資料
      const orderData = {
        orderType: orderType, // 'dine_in', 'takeout'
        paymentType: 'On-site',
        paymentMethod: 'cash',
        items: cart.value.map(item => ({
          templateId: item.templateId,
          name: item.name,
          basePrice: item.basePrice,
          finalPrice: item.finalPrice,
          options: item.options,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
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

      const response = await api.orderAdmin.createOrder({
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

  // 格式化時間
  function formatTime(dateTime) {
    return new Date(dateTime).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 格式化日期時間
  function formatDateTime(dateTime) {
    return new Date(dateTime).toLocaleString('zh-TW');
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
      'Unpaid': 'badge bg-warning text-dark',
      'Completed': 'badge bg-success',
      'Canceled': 'badge bg-danger'
    };
    return classMap[status] || 'badge bg-secondary';
  }

  // 格式化訂單狀態
  function formatStatus(status) {
    const statusMap = {
      'Unpaid': '未結帳',
      'Completed': '已完成',
      'Canceled': '已取消'
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
    fetchOptionCategories,
    fetchTodayOrders,
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
