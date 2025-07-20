import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/api'
import { useAuthStore } from '@/stores/customerAuth'

export const useCartStore = defineStore('cart', () => {
  // 狀態
  const items = ref([]) // 購物車內的餐點項目陣列
  const orderType = ref('') // 'dine_in', 'takeout', 'delivery'
  const customerInfo = ref({
    name: '',
    phone: '',
  }) // 顧客基本資訊
  const deliveryInfo = ref({
    address: '',
    estimatedTime: null,
    deliveryFee: 0,
  }) // 外送資訊
  const dineInInfo = ref({
    tableNumber: '',
  }) // 內用資訊
  const estimatedPickupTime = ref(null) // Date 對象，預計取餐時間
  const notes = ref('') // 訂單備註
  const appliedCoupons = ref([]) // 已應用的折扣列表（新結構：包含voucher和coupon）
  const paymentType = ref('On-site') // 'On-site', 'Online'
  const paymentMethod = ref('cash') // 'cash', 'credit_card', 'line_pay', 'other'
  const isStaffMode = ref(false) // true=員工點餐模式, false=顧客模式
  const currentBrand = ref(null) // 當前品牌ID
  const currentStore = ref(null) // 當前店鋪ID
  const serviceChargeRate = ref(0) // 服務費率，0.1 表示 10%
  const isSubmitting = ref(false) // 是否正在提交訂單
  const validationErrors = ref({}) // 驗證錯誤信息對象

  // 計算屬性
  const subtotal = computed(() => {
    return items.value.reduce((total, item) => total + item.subtotal, 0)
  })

  const serviceCharge = computed(() => {
    // 僅內用時計算服務費
    return orderType.value === 'dine_in' ? Math.round(subtotal.value * serviceChargeRate.value) : 0
  })

  const discountAmount = computed(() => {
    return appliedCoupons.value.reduce((total, discount) => total + discount.amount, 0)
  })

  const total = computed(() => {
    let finalTotal = subtotal.value + serviceCharge.value - discountAmount.value

    // 如果是外送，加上運費
    if (orderType.value === 'delivery') {
      finalTotal += deliveryInfo.value.deliveryFee
    }

    return finalTotal > 0 ? finalTotal : 0
  })

  const itemCount = computed(() => {
    return items.value.reduce((count, item) => count + item.quantity, 0)
  })

  const isCartEmpty = computed(() => {
    return items.value.length === 0
  })

  const isValid = computed(() => {
    validateOrder()
    return Object.keys(validationErrors.value).length === 0
  })

  // 新增：計算屬性返回當前品牌和店鋪ID
  const currentBrandId = computed(() => {
    return currentBrand.value
  })

  const currentStoreId = computed(() => {
    return currentStore.value
  })

  // 方法 - 完善品牌和店鋪ID管理
  function setBrandAndStore(brandId, storeId) {
    currentBrand.value = brandId
    currentStore.value = storeId

    // 同步到 sessionStorage
    if (brandId) {
      sessionStorage.setItem('currentBrandId', brandId)
    } else {
      sessionStorage.removeItem('currentBrandId')
    }

    if (storeId) {
      sessionStorage.setItem('currentStoreId', storeId)
    } else {
      sessionStorage.removeItem('currentStoreId')
    }
  }

  // 新增：初始化方法，從sessionStorage恢復
  function initializeBrandAndStore() {
    const storedBrandId = sessionStorage.getItem('currentBrandId')
    const storedStoreId = sessionStorage.getItem('currentStoreId')

    if (storedBrandId && !currentBrand.value) {
      currentBrand.value = storedBrandId
    }

    if (storedStoreId && !currentStore.value) {
      currentStore.value = storedStoreId
    }
  }

  function addItem(cartItem) {
    // ✅ 同時支援 dish 和 bundle
    const isValidDish = cartItem?.dishInstance?.templateId
    const isValidBundle = cartItem?.bundleInstance?.templateId

    if (!cartItem || (!isValidDish && !isValidBundle)) {
      console.error('無效的購物車項目:', cartItem)
      return
    }

    if (cartItem.quantity <= 0) {
      console.error('無效的數量:', cartItem.quantity)
      return
    }

    let itemKey
    if (cartItem.dishInstance) {
      itemKey = generateItemKey(
        cartItem.dishInstance.templateId,
        cartItem.dishInstance.options,
        cartItem.note,
      )
    } else if (cartItem.bundleInstance) {
      itemKey = generateBundleKey(
        cartItem.bundleInstance.templateId,
        cartItem.bundleInstance.purchaseType,
        cartItem.note,
      )
    }

    // 檢查是否已存在相同項目
    const existingItemIndex = items.value.findIndex((item) => item.key === itemKey)

    if (existingItemIndex !== -1) {
      const newQuantity = items.value[existingItemIndex].quantity + cartItem.quantity
      updateItemQuantity(existingItemIndex, newQuantity)
    } else {
      const newItem = {
        key: itemKey,
        quantity: cartItem.quantity,
        note: cartItem.note || '',
        subtotal: cartItem.subtotal,
      }

      // 根據類型添加對應的實例
      if (cartItem.dishInstance) {
        newItem.dishInstance = cartItem.dishInstance
      } else if (cartItem.bundleInstance) {
        newItem.bundleInstance = cartItem.bundleInstance
      }

      items.value.push(newItem)
    }
  }

  // 生成基於餐點ID、選項和特殊要求的唯一鍵值
  function generateItemKey(templateId, options, note = '') {
    let optionsKey = ''
    if (options && options.length > 0) {
      optionsKey = options
        .map((category) => {
          const selections = category.selections
            .map((s) => s.optionId)
            .sort()
            .join('-')
          return `${category.optionCategoryId}:${selections}`
        })
        .sort()
        .join('|')
    }

    const noteKey = note ? `:${note}` : ''
    return `${templateId}:${optionsKey}${noteKey}`
  }

  // 新增：生成 bundle 項目的唯一鍵值
  function generateBundleKey(templateId, purchaseType = 'cash', note = '') {
    const noteKey = note ? `:${encodeURIComponent(note)}` : ''
    return `bundle-${templateId}-${purchaseType}${noteKey}`
  }

  function removeItem(index) {
    if (index >= 0 && index < items.value.length) {
      items.value.splice(index, 1)
    }
  }

  function updateItemQuantity(index, quantity) {
    if (index < 0 || index >= items.value.length) {
      console.error('無效的項目索引:', index)
      return
    }

    if (quantity <= 0) {
      removeItem(index)
    } else {
      const item = items.value[index]
      let finalPrice = 0

      // ✅ 根據項目類型獲取價格
      if (item.dishInstance) {
        finalPrice = item.dishInstance.finalPrice || item.dishInstance.basePrice
      } else if (item.bundleInstance) {
        finalPrice = item.bundleInstance.finalPrice
      } else {
        console.error('未知的項目類型:', item)
        return
      }

      item.quantity = quantity
      item.subtotal = finalPrice * quantity

      console.log('更新項目數量:', { index, quantity, finalPrice, subtotal: item.subtotal })
    }
  }

  function clearCart() {
    items.value = []
    appliedCoupons.value = []
    notes.value = ''

    if (!isStaffMode.value) {
      customerInfo.value = {
        name: '',
        phone: '',
      }
    }

    // 清空所有訂單類型相關欄位
    deliveryInfo.value = {
      address: '',
      estimatedTime: null,
      deliveryFee: 0,
    }

    dineInInfo.value = {
      tableNumber: '',
    }

    estimatedPickupTime.value = null
    validationErrors.value = {}
  }

  function resetOrderTypeSpecificInfo() {
    if (orderType.value !== 'delivery') {
      deliveryInfo.value = {
        address: '',
        estimatedTime: null,
        deliveryFee: 0,
      }
    }

    if (orderType.value !== 'dine_in') {
      dineInInfo.value = {
        tableNumber: '',
      }
    }

    if (orderType.value !== 'takeout') {
      estimatedPickupTime.value = null
    }
  }

  function setOrderType(type) {
    if (['dine_in', 'takeout', 'delivery'].includes(type)) {
      orderType.value = type
    } else {
      console.error('無效的訂單類型:', type)
    }
  }

  function setCustomerInfo(info) {
    customerInfo.value = { ...customerInfo.value, ...info }
  }

  function setDeliveryInfo(info) {
    deliveryInfo.value = { ...deliveryInfo.value, ...info }
  }

  function setDineInInfo(info) {
    dineInInfo.value = { ...dineInInfo.value, ...info }
  }

  function setPickupTime(time) {
    estimatedPickupTime.value = time
  }

  function setNotes(text) {
    notes.value = text
  }

  function applyCoupon(couponData) {
    if (!couponData || (!couponData.couponId && !couponData.refId)) {
      console.error('無效的優惠券資料:', couponData)
      return
    }

    // 統一處理新舊格式，支援向後兼容
    const discountItem = {
      discountModel: couponData.discountModel || 'CouponInstance',
      refId: couponData.refId || couponData.couponId,
      amount: couponData.amount,
      // 保留前端顯示需要的額外資訊
      name: couponData.name,
      discountInfo: couponData.discountInfo,
    }

    // 檢查是否已經應用過相同的折扣
    const existingIndex = appliedCoupons.value.findIndex(
      (discount) => discount.refId === discountItem.refId,
    )

    if (existingIndex === -1) {
      appliedCoupons.value.push(discountItem)
    }
  }

  function removeCoupon(refId) {
    appliedCoupons.value = appliedCoupons.value.filter((discount) => discount.refId !== refId)
  }

  function setPaymentMethod(method, type = 'On-site') {
    paymentMethod.value = method
    paymentType.value = type
  }

  function toggleStaffMode() {
    isStaffMode.value = !isStaffMode.value
  }

  function validateOrder() {
    const errors = {}

    // 驗證購物車項目
    if (items.value.length === 0) {
      errors.items = '購物車是空的'
    }

    // 根據訂單類型進行不同的驗證
    switch (orderType.value) {
      case 'dine_in':
        if (!dineInInfo.value.tableNumber) {
          errors.tableNumber = '請填寫桌號'
        }
        break

      case 'takeout':
        if (!customerInfo.value.name) {
          errors.customerName = '請填寫姓名'
        }
        if (!customerInfo.value.phone) {
          errors.customerPhone = '請填寫電話號碼'
        }
        break

      case 'delivery':
        if (!customerInfo.value.name) {
          errors.customerName = '請填寫姓名'
        }
        if (!customerInfo.value.phone) {
          errors.customerPhone = '請填寫電話號碼'
        }
        if (!deliveryInfo.value.address) {
          errors.deliveryAddress = '請填寫配送地址'
        }
        break

      default:
        errors.orderType = '請選擇訂單類型'
    }

    validationErrors.value = errors
    return Object.keys(errors).length === 0
  }

  // 提交訂單
  async function submitOrder() {
    if (isSubmitting.value) {
      return { success: false, message: '訂單正在處理中...' }
    }

    if (!validateOrder()) {
      return { success: false, errors: validationErrors.value }
    }

    if (!currentBrand.value || !currentStore.value) {
      validationErrors.value.store = '請選擇店鋪'
      console.error('缺少品牌或店鋪ID:', {
        brandId: currentBrand.value,
        storeId: currentStore.value,
      })
      return { success: false, errors: validationErrors.value }
    }

    try {
      isSubmitting.value = true

      // 獲取認證store實例並檢查登入狀態
      const authStore = useAuthStore()

      console.log('用戶登入狀態:', {
        isLoggedIn: authStore.isLoggedIn,
        userId: authStore.userId,
        userName: authStore.userName,
      })

      // 準備訂單資料，符合後端 API 期望的格式
      const orderData = {
        // 訂單項目 - 轉換為後端期望的格式
        items: items.value.map((item) => {
          if (item.dishInstance) {
            return {
              itemType: 'dish',
              templateId: item.dishInstance.templateId,
              name: item.dishInstance.name,
              basePrice: item.dishInstance.basePrice,
              finalPrice: item.dishInstance.finalPrice || item.dishInstance.basePrice,
              options: item.dishInstance.options || [],
              quantity: item.quantity,
              subtotal: item.subtotal,
              note: item.note || '',
            }
          } else if (item.bundleInstance) {
            // ✅ 這部分需要修改為符合後端 BundleInstance schema 的格式
            return {
              itemType: 'bundle',
              templateId: item.bundleInstance.templateId, // 使用 templateId 而非 bundleId
              name: item.bundleInstance.name,
              description: item.bundleInstance.description,
              finalPrice: item.bundleInstance.finalPrice,
              cashPrice: item.bundleInstance.cashPrice,
              pointPrice: item.bundleInstance.pointPrice,
              bundleItems: item.bundleInstance.bundleItems,
              voucherValidityDays: item.bundleInstance.voucherValidityDays,
              quantity: item.quantity,
              subtotal: item.subtotal,
              note: item.note || '',
            }
          }
        }),

        // 訂單基本資訊
        orderType: orderType.value,

        // 付款資訊
        paymentType: paymentType.value,
        paymentMethod: paymentMethod.value,

        // 客戶資訊
        customerInfo: customerInfo.value,

        // 訂單備註
        notes: notes.value,

        // 手動調整金額
        manualAdjustment: 0,

        // 折扣資訊 - 使用新的結構
        discounts: appliedCoupons.value.map((discount) => ({
          discountModel: discount.discountModel,
          refId: discount.refId,
          amount: discount.amount,
        })),
      }

      // 如果用戶已登入，添加用戶ID
      if (authStore.isLoggedIn && authStore.userId) {
        orderData.user = authStore.userId
        console.log('用戶已登入，添加用戶ID到訂單:', authStore.userId)
      } else {
        console.log('用戶未登入，建立匿名訂單')
      }

      // 根據訂單類型添加特定資訊
      if (orderType.value === 'delivery') {
        orderData.deliveryInfo = deliveryInfo.value
      } else if (orderType.value === 'dine_in') {
        orderData.dineInInfo = dineInInfo.value
      } else if (orderType.value === 'takeout') {
        orderData.estimatedPickupTime = estimatedPickupTime.value
      }

      console.log('=== Pinia 提交訂單資料 ===')
      console.log('品牌ID:', currentBrand.value)
      console.log('店鋪ID:', currentStore.value)
      console.log('用戶登入狀態:', authStore.isLoggedIn)
      console.log('訂單資料:', JSON.stringify(orderData, null, 2))
      console.log('========================')

      // 提交訂單
      const response = await api.orderCustomer.createOrder({
        brandId: currentBrand.value,
        storeId: currentStore.value,
        orderData,
      })

      console.log('=== API 回應 ===')
      console.log('Response:', response)
      console.log('===============')

      if (response && response.success) {
        // 將訂單 ID 和資料存儲到 sessionStorage
        sessionStorage.setItem('lastOrderId', response.order._id)
        sessionStorage.setItem('lastOrderData', JSON.stringify(response.order))

        // 成功後清空購物車
        clearCart()

        return {
          success: true,
          order: response.order,
          orderId: response.order._id,
          pointsAwarded: response.pointsAwarded || null,
        }
      } else {
        console.error('API 回應失敗:', response)
        throw new Error(response?.message || '訂單創建失敗')
      }
    } catch (error) {
      console.error('提交訂單錯誤 - 詳細資訊:', {
        error: error,
        message: error.message,
        stack: error.stack,
        response: error.response,
      })

      let errorMessage = '訂單提交失敗'

      if (error.response) {
        errorMessage = error.response.data?.message || `API 錯誤: ${error.response.status}`
      } else if (error.message) {
        errorMessage = error.message
      }

      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      isSubmitting.value = false
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
    currentBrandId, // 新增
    currentStoreId, // 新增

    // 方法
    setBrandAndStore,
    initializeBrandAndStore, // 新增
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
    submitOrder,
  }
})
