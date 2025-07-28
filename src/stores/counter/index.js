import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import { useCounterCartStore } from './cart.js'
import { useCounterOrdersStore } from './orders.js'
import { useCounterDishTemplatesStore } from './dishTemplates.js'
import { useCounterModalsStore } from './modals.js'
import { useCounterInventoryStore } from './inventory.js'
import { getTaiwanDate, getTaiwanDateTime } from './utils.js'

// 向後兼容的主要 counter store
export const useCounterStore = defineStore('counter', () => {
  // 基礎狀態
  const activeComponent = ref('DineIn') // 'DineIn', 'TakeOut', 'Orders'
  const currentBrand = ref(null)
  const currentStore = ref(null)
  const storeData = ref(null)

  // 獲取其他 stores 的實例
  const cartStore = useCounterCartStore()
  const ordersStore = useCounterOrdersStore()
  const dishTemplatesStore = useCounterDishTemplatesStore()
  const modalsStore = useCounterModalsStore()
  const inventoryStore = useCounterInventoryStore()

  // 基礎方法
  function setBrandAndStore(brandId, storeId) {
    currentBrand.value = brandId
    currentStore.value = storeId
  }

  function setActiveComponent(component) {
    activeComponent.value = component
    if (component === 'Orders') {
      ordersStore.fetchTodayOrders(currentBrand.value, currentStore.value)
    }
  }

  // 載入店鋪資料
  async function fetchStoreData(brandId, storeId) {
    try {
      const response = await api.store.getStoreById({ brandId, id: storeId })
      if (response.success) {
        storeData.value = response.store
      }
    } catch (error) {
      console.error('載入店鋪資料失敗:', error)
      throw error
    }
  }

  // 刷新資料
  async function refreshData(brandId, storeId) {
    try {
      await Promise.all([
        fetchStoreData(brandId, storeId),
        dishTemplatesStore.fetchMenuData(brandId, storeId),
        ordersStore.fetchTodayOrders(brandId, storeId),
        inventoryStore.loadInventoryData(brandId, storeId),
      ])
    } catch (error) {
      console.error('刷新資料失敗:', error)
    }
  }

  // 調帳確認（需要處理購物車和訂單兩種情況）
  const confirmAdjustment = async () => {
    const newAdjustment =
      modalsStore.modals.adjustment.adjustmentType === 'add'
        ? modalsStore.modals.adjustment.tempAdjustment
        : -modalsStore.modals.adjustment.tempAdjustment

    if (modalsStore.modals.adjustment.editingOrder) {
      // 更新訂單調帳
      try {
        const response = await api.orderAdmin.updateOrder({
          brandId: currentBrand.value,
          storeId: currentStore.value,
          orderId: modalsStore.modals.adjustment.editingOrder._id,
          updateData: { manualAdjustment: newAdjustment },
        })

        if (response.success) {
          await ordersStore.fetchTodayOrders(currentBrand.value, currentStore.value)
          if (
            ordersStore.selectedOrder &&
            ordersStore.selectedOrder._id === modalsStore.modals.adjustment.editingOrder._id
          ) {
            const updatedOrder = await api.orderAdmin.getOrderById({
              brandId: currentBrand.value,
              storeId: currentStore.value,
              orderId: modalsStore.modals.adjustment.editingOrder._id,
            })
            if (updatedOrder.success) {
              ordersStore.selectOrder(updatedOrder.order)
            }
          }
        }
      } catch (error) {
        console.error('更新訂單調帳失敗:', error)
        throw new Error('調整訂單失敗')
      }
    } else {
      // 更新購物車調帳
      cartStore.setManualAdjustment(newAdjustment)
    }

    modalsStore.closeModal('adjustment')
  }

  // 包裝 quickAddDishToCart，提供預設選項
  const quickAddDishToCart = (dishTemplate) => {
    const defaultOptions = dishTemplatesStore.getDefaultOptionsForDish(dishTemplate)
    cartStore.quickAddDishToCart(dishTemplate, defaultOptions)
  }

  // 包裝 updateCartItemRealtime，提供 getDishTemplate 函數
  const updateCartItemRealtime = (options, note = '') => {
    cartStore.updateCartItemRealtime(options, note, dishTemplatesStore.getDishTemplate)
  }

  // 包裝 checkout，提供品牌店鋪資訊和成功回調
  const checkout = async (orderType, customerInfo = {}) => {
    const onSuccess = async () => {
      await ordersStore.fetchTodayOrders(currentBrand.value, currentStore.value)
    }

    return await cartStore.checkout(
      orderType,
      customerInfo,
      currentBrand.value,
      currentStore.value,
      onSuccess,
    )
  }

  // 向後兼容：重新導出所有需要的狀態和方法
  return {
    // === 基礎狀態 ===
    activeComponent,
    currentBrand,
    currentStore,
    storeData,

    // === 購物車狀態（從 cartStore 重新導出）===
    cart: computed(() => cartStore.cart),
    currentItem: computed(() => cartStore.currentItem),
    currentItemIndex: computed(() => cartStore.currentItemIndex),
    manualAdjustment: computed(() => cartStore.manualAdjustment),
    totalDiscount: computed(() => cartStore.totalDiscount),
    isCheckingOut: computed(() => cartStore.isCheckingOut),
    isEditMode: computed(() => cartStore.isEditMode),
    subtotal: computed(() => cartStore.subtotal),
    total: computed(() => cartStore.total),

    // === 訂單狀態（從 ordersStore 重新導出）===
    todayOrders: computed(() => ordersStore.todayOrders),
    selectedOrder: computed(() => ordersStore.selectedOrder),
    currentDate: computed(() => ordersStore.currentDate),

    // === 餐點模板狀態（從 dishTemplatesStore 重新導出）===
    menuData: computed(() => dishTemplatesStore.menuData),
    dishTemplates: computed(() => dishTemplatesStore.dishTemplates),
    optionCategories: computed(() => dishTemplatesStore.optionCategories),

    // === 模態框狀態（從 modalsStore 重新導出）===
    modals: computed(() => modalsStore.modals),

    // === 基礎方法 ===
    setBrandAndStore,
    setActiveComponent,
    fetchStoreData,
    refreshData,
    getTaiwanDate,
    getTaiwanDateTime,

    // === 購物車方法（包裝版本，解決依賴問題）===
    quickAddDishToCart,
    addDishToCart: cartStore.addDishToCart,
    addBundleToCart: cartStore.addBundleToCart,
    removeFromCart: cartStore.removeFromCart,
    updateQuantity: cartStore.updateQuantity,
    selectCurrentItem: cartStore.selectCurrentItem,
    clearCurrentItem: cartStore.clearCurrentItem,
    updateCartItemRealtime,
    updateCurrentItem: cartStore.updateCurrentItem,
    setManualAdjustment: cartStore.setManualAdjustment,
    setTotalDiscount: cartStore.setTotalDiscount,
    clearCart: cartStore.clearCart,
    cancelOrder: cartStore.cancelOrder,
    mergeCartItems: cartStore.mergeCartItems,
    checkout,

    // === 訂單方法（從 ordersStore 重新導出）===
    fetchTodayOrders: ordersStore.fetchTodayOrders,
    fetchOrdersByDate: ordersStore.fetchOrdersByDate,
    selectOrder: ordersStore.selectOrder,
    calculateOrderSubtotal: ordersStore.calculateOrderSubtotal,
    calculateOrderTotalDiscount: ordersStore.calculateOrderTotalDiscount,
    calculateOrderTotal: ordersStore.calculateOrderTotal,
    formatTime: ordersStore.formatTime,
    formatDateTime: ordersStore.formatDateTime,
    getPickupMethodClass: ordersStore.getPickupMethodClass,
    getStatusClass: ordersStore.getStatusClass,
    formatStatus: ordersStore.formatStatus,

    // === 餐點模板方法（從 dishTemplatesStore 重新導出）===
    fetchMenuData: dishTemplatesStore.fetchMenuData,
    fetchDishTemplates: dishTemplatesStore.fetchDishTemplates,
    fetchOptionCategoriesWithOptions: dishTemplatesStore.fetchOptionCategoriesWithOptions,
    getDishTemplate: dishTemplatesStore.getDishTemplate,
    getDefaultOptionsForDish: dishTemplatesStore.getDefaultOptionsForDish,

    // === 模態框方法（包裝版本，解決依賴問題）===
    openAdjustmentModal: (order = null) => {
      modalsStore.openAdjustmentModal(order, cartStore.manualAdjustment)
    },
    openCheckoutModal: modalsStore.openCheckoutModal,
    openCashCalculatorModal: modalsStore.openCashCalculatorModal,
    openTableNumberModal: modalsStore.openTableNumberModal,
    closeModal: modalsStore.closeModal,
    setAdjustmentType: modalsStore.setAdjustmentType,
    appendToAdjustment: modalsStore.appendToAdjustment,
    clearAdjustment: modalsStore.clearAdjustment,
    confirmAdjustment,

    // === 庫存方法（從 inventoryStore 重新導出）===
    getInventoryInfo: inventoryStore.getInventoryInfo,
    isDishSoldOut: inventoryStore.isDishSoldOut,
    getStockBadgeClass: inventoryStore.getStockBadgeClass,
    loadInventoryData: inventoryStore.loadInventoryData,
  }
})

// 為了方便其他模組引入，也導出基礎 store
export const useCounterBaseStore = defineStore('counterBase', () => {
  const activeComponent = ref('DineIn')
  const currentBrand = ref(null)
  const currentStore = ref(null)
  const storeData = ref(null)

  function setBrandAndStore(brandId, storeId) {
    currentBrand.value = brandId
    currentStore.value = storeId
  }

  function setActiveComponent(component) {
    activeComponent.value = component
  }

  return {
    activeComponent,
    currentBrand,
    currentStore,
    storeData,
    setBrandAndStore,
    setActiveComponent,
  }
})
