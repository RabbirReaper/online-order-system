import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import { generateItemKey, generateBundleKey, generateUniqueItemId } from './utils.js'

export const useCounterCartStore = defineStore('counterCart', () => {
  // 購物車相關狀態
  const cart = ref([])
  const currentItem = ref(null)
  const currentItemIndex = ref(null)
  const manualAdjustment = ref(0) // 與 schema 保持一致
  const totalDiscount = ref(0) // 與 schema 保持一致
  const isCheckingOut = ref(false)
  const isEditMode = ref(false)

  // 計算屬性 - 購物車
  const subtotal = computed(() => {
    return cart.value.reduce((total, item) => {
      return total + (item.subtotal || 0)
    }, 0)
  })

  const total = computed(() => {
    return Math.max(0, subtotal.value + manualAdjustment.value - totalDiscount.value)
  })

  // 快速添加餐點到購物車（需要從外部傳入 defaultOptions）
  const quickAddDishToCart = (dishTemplate, defaultOptions = []) => {
    addDishToCart(dishTemplate, defaultOptions, '')
  }

  // 添加餐點到購物車
  const addDishToCart = (dishTemplate, options = [], note = '') => {
    let finalPrice = dishTemplate.basePrice

    options.forEach((category) => {
      category.selections.forEach((selection) => {
        finalPrice += selection.price || 0
      })
    })

    const uniqueId = generateUniqueItemId()
    const itemKey = generateItemKey(dishTemplate._id, options, note)

    const cartItem = {
      id: uniqueId,
      key: itemKey,
      dishInstance: {
        templateId: dishTemplate._id,
        name: dishTemplate.name,
        basePrice: dishTemplate.basePrice,
        finalPrice: finalPrice,
        options: options,
      },
      quantity: 1,
      note: note || '',
      subtotal: finalPrice,
    }

    cart.value.push(cartItem)
  }

  // 添加套餐到購物車
  const addBundleToCart = (bundle, note = '') => {
    const finalPrice = bundle.sellingPrice || 0
    const uniqueId = generateUniqueItemId()
    const itemKey = generateBundleKey(bundle._id, note)

    const cartItem = {
      id: uniqueId,
      key: itemKey,
      bundleInstance: {
        bundleId: bundle._id,
        name: bundle.name,
        sellingPrice: bundle.sellingPrice || 0,
        originalPrice: bundle.originalPrice || 0,
        sellingPoint: bundle.sellingPoint || 0,
        originalPoint: bundle.originalPoint || 0,
        bundleItems: bundle.bundleItems || [],
      },
      quantity: 1,
      note: note || '',
      subtotal: finalPrice,
    }

    cart.value.push(cartItem)
  }

  // 移除購物車項目
  const removeFromCart = (index) => {
    if (index >= 0 && index < cart.value.length) {
      cart.value.splice(index, 1)
      if (currentItemIndex.value === index) {
        clearCurrentItem()
      } else if (currentItemIndex.value > index) {
        currentItemIndex.value--
      }
    }
  }

  // 更新數量
  const updateQuantity = (index, change) => {
    if (index >= 0 && index < cart.value.length) {
      const item = cart.value[index]
      const newQuantity = item.quantity + change

      if (newQuantity <= 0) {
        removeFromCart(index)
      } else {
        item.quantity = newQuantity
        item.subtotal = item.dishInstance.finalPrice * newQuantity
      }
    }
  }

  // 選擇當前編輯項目
  const selectCurrentItem = (item, index) => {
    currentItem.value = { ...item }
    currentItemIndex.value = index
    isEditMode.value = true
  }

  // 清空當前項目
  const clearCurrentItem = () => {
    currentItem.value = null
    currentItemIndex.value = null
    isEditMode.value = false
  }

  // 即時更新購物車項目（需要從外部傳入 getDishTemplate 函數）
  const updateCartItemRealtime = (options, note = '', getDishTemplate) => {
    if (currentItemIndex.value === null || !currentItem.value || !getDishTemplate) return

    const dishTemplate = getDishTemplate(currentItem.value.dishInstance.templateId)
    if (!dishTemplate) return

    let finalPrice = dishTemplate.basePrice
    options.forEach((category) => {
      category.selections.forEach((selection) => {
        finalPrice += selection.price || 0
      })
    })

    const newKey = generateItemKey(dishTemplate._id, options, note)
    const currentQuantity = cart.value[currentItemIndex.value].quantity

    cart.value[currentItemIndex.value] = {
      ...cart.value[currentItemIndex.value],
      key: newKey,
      dishInstance: {
        templateId: dishTemplate._id,
        name: dishTemplate.name,
        basePrice: dishTemplate.basePrice,
        finalPrice: finalPrice,
        options: options,
      },
      quantity: currentQuantity,
      note: note || '',
      subtotal: finalPrice * currentQuantity,
    }

    currentItem.value = { ...cart.value[currentItemIndex.value] }
  }

  // 更新當前項目
  const updateCurrentItem = (updatedItem) => {
    if (currentItemIndex.value !== null) {
      cart.value[currentItemIndex.value] = { ...updatedItem }
      clearCurrentItem()
    }
  }

  // 設置調帳
  const setManualAdjustment = (amount) => {
    manualAdjustment.value = amount
  }

  // 設置折扣
  const setTotalDiscount = (amount) => {
    totalDiscount.value = amount
  }

  // 清空購物車
  const clearCart = () => {
    cart.value = []
    currentItem.value = null
    currentItemIndex.value = null
    manualAdjustment.value = 0
    totalDiscount.value = 0
    isEditMode.value = false
  }

  // 取消訂單
  const cancelOrder = () => {
    if (confirm('確定要取消當前訂單嗎？')) {
      clearCart()
    }
  }

  // 合併相同配置的購物車項目
  const mergeCartItems = (cartItems) => {
    const mergedItems = {}

    cartItems.forEach((item) => {
      const key = item.key

      if (mergedItems[key]) {
        mergedItems[key].quantity += item.quantity
        mergedItems[key].subtotal += item.subtotal
      } else {
        // 判斷是餐點還是套餐
        if (item.dishInstance) {
          // 餐點項目
          mergedItems[key] = {
            itemType: 'dish', // ✅ 加入這行
            templateId: item.dishInstance.templateId,
            name: item.dishInstance.name,
            basePrice: item.dishInstance.basePrice,
            finalPrice: item.dishInstance.finalPrice,
            options: item.dishInstance.options,
            quantity: item.quantity,
            subtotal: item.subtotal,
            note: item.note || '',
          }
        } else if (item.bundleInstance) {
          // 套餐項目
          mergedItems[key] = {
            itemType: 'bundle', // ✅ 加入這行
            bundleId: item.bundleInstance.bundleId,
            name: item.bundleInstance.name,
            sellingPrice: item.bundleInstance.sellingPrice,
            originalPrice: item.bundleInstance.originalPrice,
            sellingPoint: item.bundleInstance.sellingPoint,
            originalPoint: item.bundleInstance.originalPoint,
            bundleItems: item.bundleInstance.bundleItems,
            quantity: item.quantity,
            subtotal: item.subtotal,
            note: item.note || '',
          }
        }
      }
    })
    return Object.values(mergedItems)
  }

  // 提交訂單（簡化版，實際邏輯移到 index.js）
  const checkout = async (orderType, customerInfo = {}, brandId, storeId, onSuccess) => {
    if (cart.value.length === 0) {
      throw new Error('購物車是空的')
    }

    isCheckingOut.value = true

    try {
      const mergedItems = mergeCartItems(cart.value)

      const orderData = {
        orderType: orderType,
        paymentType: 'On-site',
        paymentMethod: '',
        items: mergedItems,
        customerInfo: customerInfo,
        notes: '',
        manualAdjustment: manualAdjustment.value,
        discounts: totalDiscount.value > 0 ? [{ amount: totalDiscount.value }] : [],
      }

      if (orderType === 'dine_in' && customerInfo.tableNumber) {
        orderData.dineInInfo = {
          tableNumber: customerInfo.tableNumber,
        }
      }

      console.log('提交訂單數據:', orderData)
      const response = await api.orderCustomer.createOrder({
        brandId,
        storeId,
        orderData,
      })

      if (response.success) {
        clearCart()

        // 執行成功回調
        if (onSuccess) {
          await onSuccess()
        }

        console.log('訂單提交成功:', response.order)
        return response.order
      } else {
        console.error('訂單提交失敗:', response)
        throw new Error(response.message || '訂單提交失敗')
      }
    } catch (error) {
      console.error('提交訂單失敗:', error)
      throw error
    } finally {
      isCheckingOut.value = false
    }
  }

  return {
    // 狀態
    cart,
    currentItem,
    currentItemIndex,
    manualAdjustment,
    totalDiscount,
    isCheckingOut,
    isEditMode,

    // 計算屬性
    subtotal,
    total,

    // 方法
    quickAddDishToCart,
    addDishToCart,
    addBundleToCart,
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
  }
})
