import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/api'
import { useAuthStore } from '@/stores/customerAuth'

export const useCartStore = defineStore('cart', () => {
  // 狀態
  const items = ref([]) // 購物車內的餐點項目陣列
  const orderType = ref('takeout') // 'dine_in', 'takeout', 'delivery' - 預設為外帶
  const customerInfo = ref({
    name: '',
    phone: '',
    lineUniqueId: '', // LINE 用戶的 userId
  }) // 顧客基本資訊
  const deliveryInfo = ref({
    address: '',
    estimatedTime: null,
    deliveryFee: 0,
  }) // 外送資訊
  const dineInInfo = ref({
    tableNumber: '',
  }) // 內用資訊
  const pickupInfo = ref({
    pickupTime: 'asap', // 'asap' 或 'scheduled'
    scheduledTime: '', // ISO datetime string
  }) // 取餐資訊
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

  // 券相關狀態
  const availableVouchers = ref([]) // 可用兌換券（含匹配資訊）
  const usedVouchers = ref([]) // 已選用的兌換券
  const availableCoupons = ref([]) // 可用折價券
  const userVouchers = ref([]) // 用戶所有兌換券（原始資料）
  const userCoupons = ref([]) // 用戶所有折價券（原始資料）
  const activePointRules = ref([]) // 啟用的點數規則

  // 店鋪資訊
  const storeInfo = ref(null) // 店鋪資訊

  // 訂單備註（從 CartView 遷移）
  const orderRemarks = ref('') // 訂單備註

  // 移除自動設置支付類型的 watch
  // paymentType 會由以下方式設定：
  // 1. 前端用戶選擇時：透過 setPaymentType 直接設定 'On-site' 或 'Online'
  // 2. Counter 端：手動設定
  // 3. 線上付款：在後端藍新金流回傳後設定

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

  // 計算可用兌換券（含匹配邏輯）- 從 CartView line 456-524 遷移
  const matchedVouchers = computed(() => {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn || !userVouchers.value.length) {
      return []
    }

    // 1. 統計購物車中每種餐點的總數量
    const dishCounts = {}
    items.value.forEach((cartItem) => {
      if (cartItem.dishInstance) {
        const templateId = cartItem.dishInstance.templateId
        const dishName = cartItem.dishInstance.name
        const price = cartItem.dishInstance.finalPrice || cartItem.dishInstance.basePrice

        if (!dishCounts[templateId]) {
          dishCounts[templateId] = {
            templateId,
            dishName,
            price,
            totalQuantity: 0,
            cartItems: [],
          }
        }

        dishCounts[templateId].totalQuantity += cartItem.quantity
        dishCounts[templateId].cartItems.push({
          index: items.value.indexOf(cartItem),
          quantity: cartItem.quantity,
        })
      }
    })

    // 2. 獲取所有兌換券（包含已選擇和未選擇的）
    const selectedVoucherIds = new Set(usedVouchers.value.map((v) => v.voucherId))
    const availableVoucherPool = userVouchers.value.filter(
      (voucher) => !voucher.isUsed && new Date(voucher.expiryDate) > new Date(),
    )

    // 3. 為每種餐點匹配對應數量的券
    const matchedVouchersList = []

    Object.values(dishCounts).forEach((dishInfo) => {
      // 找出可以用於該餐點的所有券
      const applicableVouchers = availableVoucherPool.filter(
        (voucher) => voucher.exchangeDishTemplate?._id === dishInfo.templateId,
      )

      // 根據餐點數量限制券的數量
      const vouchersToShow = applicableVouchers.slice(0, dishInfo.totalQuantity)

      // 為每個券添加匹配信息和選擇狀態
      vouchersToShow.forEach((voucher, index) => {
        const isSelected = selectedVoucherIds.has(voucher._id)

        matchedVouchersList.push({
          ...voucher,
          isSelected, // 添加選擇狀態
          matchedItem: {
            templateId: dishInfo.templateId,
            dishName: dishInfo.dishName,
            originalPrice: dishInfo.price,
            availableQuantity: dishInfo.totalQuantity,
            voucherIndex: index, // 用於區分同樣餐點的不同券
          },
        })
      })
    })

    return matchedVouchersList
  })

  // 計算可用折價券 - 從 CartView line 527-538 遷移
  const usableCoupons = computed(() => {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn || !userCoupons.value.length) {
      return []
    }

    return userCoupons.value.filter(
      (coupon) =>
        !coupon.isUsed &&
        new Date(coupon.expiryDate) > new Date() &&
        subtotal.value >= (coupon.discountInfo?.minPurchaseAmount || 0),
    )
  })

  // 計算兌換券折扣總額
  const voucherSavingsAmount = computed(() => {
    return usedVouchers.value.reduce((sum, v) => sum + (v.savedAmount || 0), 0)
  })

  // 計算折價券折扣總額
  const couponDiscountAmount = computed(() => {
    return appliedCoupons.value.reduce((sum, c) => sum + (c.amount || 0), 0)
  })

  // 計算預估點數 - 從 CartView line 551-585 遷移
  const estimatedPoints = computed(() => {
    const authStore = useAuthStore()
    // 只有登入用戶才顯示點數預覽
    if (!authStore.isLoggedIn || activePointRules.value.length === 0) {
      return null
    }

    // 找到消費金額類型的規則
    const purchaseRule = activePointRules.value.find((rule) => rule.type === 'purchase_amount')

    if (!purchaseRule) {
      return null
    }

    // 計算實際付款金額（扣除優惠後）
    const finalAmount = total.value

    // 檢查是否達到最低消費金額
    if (finalAmount < purchaseRule.minimumAmount) {
      return {
        points: 0,
        rule: purchaseRule,
        insufficientAmount: true,
        shortfall: purchaseRule.minimumAmount - finalAmount,
      }
    }

    // 計算點數（向下取整）
    const points = Math.floor(finalAmount / purchaseRule.conversionRate)

    return {
      points,
      rule: purchaseRule,
      insufficientAmount: false,
    }
  })

  // 根據 voucherId 查找兌換券
  const getVoucherById = computed(() => (voucherId) => {
    return matchedVouchers.value.find((v) => v._id === voucherId)
  })

  // 根據 couponId 查找折價券
  const getCouponById = computed(() => (couponId) => {
    return usableCoupons.value.find((c) => c._id === couponId)
  })

  // 根據 index 查找購物車項目
  const getCartItemByIndex = computed(() => (index) => {
    return items.value[index]
  })

  // 檢查折價券是否可用
  const canUseCoupon = computed(() => (couponId) => {
    const coupon = usableCoupons.value.find((c) => c._id === couponId)
    if (!coupon) return false

    const minAmount = coupon.discountInfo?.minPurchaseAmount || 0
    return (
      subtotal.value >= minAmount && !appliedCoupons.value.some((c) => c.refId === couponId)
    )
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
    orderType.value = 'takeout' // 重設為預設訂單類型

    if (!isStaffMode.value) {
      customerInfo.value = {
        name: '',
        phone: '',
        lineUniqueId: '',
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

    pickupInfo.value = {
      pickupTime: 'asap',
      scheduledTime: '',
    }

    estimatedPickupTime.value = null
    validationErrors.value = {}

    // 清空券相關資料
    clearPromotions()
  }

  // 清空券相關資料
  function clearPromotions() {
    usedVouchers.value = []
    userVouchers.value = []
    userCoupons.value = []
    availableVouchers.value = []
    availableCoupons.value = []
    activePointRules.value = []
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

  // 新增：設定 LINE 用戶資訊
  function setLineUserInfo(lineUserData) {
    customerInfo.value = {
      ...customerInfo.value,
      name: lineUserData.displayName || customerInfo.value.name,
      lineUniqueId: lineUserData.userId || '',
    }
  }

  function setDeliveryInfo(info) {
    deliveryInfo.value = { ...deliveryInfo.value, ...info }
  }

  function setDineInInfo(info) {
    dineInInfo.value = { ...dineInInfo.value, ...info }
  }

  function setPickupInfo(info) {
    pickupInfo.value = { ...pickupInfo.value, ...info }
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

  function setPaymentType(type) {
    // 明確設定 paymentType
    // 'On-site' 或 'Online'
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
            return {
              itemType: 'bundle',
              templateId: item.bundleInstance.templateId,
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
        // 處理取餐時間
        if (pickupInfo.value.pickupTime === 'scheduled' && pickupInfo.value.scheduledTime) {
          orderData.estimatedPickupTime = new Date(pickupInfo.value.scheduledTime)
        } else {
          orderData.estimatedPickupTime = estimatedPickupTime.value
        }
      }

      console.log('=== Pinia 提交訂單資料 ===')
      console.log('品牌ID:', currentBrand.value)
      console.log('店鋪ID:', currentStore.value)
      console.log('用戶登入狀態:', authStore.isLoggedIn)
      console.log('付款方式:', paymentMethod.value)
      console.log('付款類型:', paymentType.value)
      console.log('訂單資料:', JSON.stringify(orderData, null, 2))
      console.log('========================')

      // 提交訂單 (使用統一API架構)
      const response = await api.orderCustomer.createOrder({
        brandId: currentBrand.value,
        storeId: currentStore.value,
        orderData,
        paymentType: paymentType.value,
        paymentMethod: paymentMethod.value,
      })

      console.log('=== API 回應 ===')
      console.log('Response:', response)
      console.log('===============')

      if (response && response.success) {
        // 將訂單 ID 和資料存儲到 sessionStorage
        sessionStorage.setItem('lastOrderId', response.order._id)
        sessionStorage.setItem('lastOrderData', JSON.stringify(response.order))

        // 判斷是否為線上付款
        const isOnlinePayment = response.payment && response.payment.formData

        if (isOnlinePayment) {
          // ✅ 線上付款：暫存購物車資料到 sessionStorage，不立即清空
          console.log('💾 線上付款：暫存購物車資料')
          sessionStorage.setItem(
            'pendingCartData',
            JSON.stringify({
              items: items.value,
              orderType: orderType.value,
              customerInfo: customerInfo.value,
              deliveryInfo: deliveryInfo.value,
              dineInInfo: dineInInfo.value,
              pickupInfo: pickupInfo.value,
              estimatedPickupTime: estimatedPickupTime.value,
              notes: notes.value,
              appliedCoupons: appliedCoupons.value,
              paymentType: paymentType.value,
              paymentMethod: paymentMethod.value,
              currentBrand: currentBrand.value,
              currentStore: currentStore.value,
              timestamp: Date.now(),
              orderId: response.order._id, // 記錄對應的訂單ID
            }),
          )
        } else {
          // ✅ 現場付款：立即清空購物車
          console.log('💵 現場付款：立即清空購物車')
          clearCart()
        }

        return {
          success: true,
          order: response.order,
          orderId: response.order._id,
          pointsAwarded: response.pointsAwarded || null,
          payment: response.payment || null, // ✅ 保留 payment 資訊（線上付款需要）
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

  /**
   * 恢復暫存的購物車資料（用於線上付款失敗後）
   * @returns {boolean} 是否成功恢復
   */
  function restorePendingCart() {
    const pendingData = sessionStorage.getItem('pendingCartData')
    if (!pendingData) {
      console.log('沒有暫存的購物車資料')
      return false
    }

    try {
      const data = JSON.parse(pendingData)

      // 檢查資料是否過期（24 小時）
      const MAX_AGE = 24 * 60 * 60 * 1000
      if (Date.now() - data.timestamp > MAX_AGE) {
        console.log('暫存的購物車資料已過期')
        sessionStorage.removeItem('pendingCartData')
        return false
      }

      console.log('🔄 恢復暫存的購物車資料:', data.orderId)

      // 恢復購物車資料
      items.value = data.items || []
      orderType.value = data.orderType || ''
      customerInfo.value = data.customerInfo || { name: '', phone: '', lineUniqueId: '' }
      deliveryInfo.value = data.deliveryInfo || { address: '', estimatedTime: null, deliveryFee: 0 }
      dineInInfo.value = data.dineInInfo || { tableNumber: '' }
      pickupInfo.value = data.pickupInfo || { pickupTime: 'asap', scheduledTime: '' }
      estimatedPickupTime.value = data.estimatedPickupTime || null
      notes.value = data.notes || ''
      appliedCoupons.value = data.appliedCoupons || []
      paymentType.value = data.paymentType || 'On-site'
      paymentMethod.value = data.paymentMethod || 'cash'
      currentBrand.value = data.currentBrand || null
      currentStore.value = data.currentStore || null

      console.log('✅ 購物車資料恢復成功')
      return true
    } catch (error) {
      console.error('恢復購物車資料失敗:', error)
      sessionStorage.removeItem('pendingCartData')
      return false
    }
  }

  /**
   * 清除暫存的購物車資料（付款成功後調用）
   */
  function clearPendingCart() {
    sessionStorage.removeItem('pendingCartData')
    console.log('🗑️ 已清除暫存的購物車資料')
  }

  /**
   * 檢查是否有暫存的購物車資料
   * @returns {Object|null} 暫存的購物車資料（包含 orderId）
   */
  function getPendingCartInfo() {
    const pendingData = sessionStorage.getItem('pendingCartData')
    if (!pendingData) return null

    try {
      const data = JSON.parse(pendingData)
      // 檢查是否過期
      const MAX_AGE = 24 * 60 * 60 * 1000
      if (Date.now() - data.timestamp > MAX_AGE) {
        sessionStorage.removeItem('pendingCartData')
        return null
      }

      return {
        orderId: data.orderId,
        timestamp: data.timestamp,
        itemCount: data.items?.length || 0,
      }
    } catch (error) {
      return null
    }
  }

  // ========== 券相關 Actions ==========

  // 獲取用戶兌換券
  async function fetchUserVouchers(brandId) {
    if (!brandId) {
      console.warn('fetchUserVouchers: 缺少 brandId')
      return
    }

    try {
      const response = await api.promotion.getUserVouchers(brandId, {
        includeUsed: false,
        includeExpired: false,
      })

      if (response.success) {
        userVouchers.value = response.vouchers || []
        console.log(`已載入 ${userVouchers.value.length} 張兌換券`)
      }
    } catch (error) {
      console.error('獲取用戶兌換券失敗:', error)
    }
  }

  // 選用兌換券 - 從 CartView line 750-786 遷移
  function useVoucher(voucherId, matchedItem) {
    try {
      // 檢查是否已經選擇過這個券
      const alreadySelected = usedVouchers.value.some((v) => v.voucherId === voucherId)
      if (alreadySelected) {
        throw new Error('此兌換券已被選用')
      }

      // 檢查該餐點類型還能使用幾個券
      const sameTemplateUsed = usedVouchers.value.filter(
        (v) => v.templateId === matchedItem.templateId,
      ).length

      if (sameTemplateUsed >= matchedItem.availableQuantity) {
        throw new Error('該餐點的兌換券使用數量已達上限')
      }

      // 計算兌換券節省金額 - 只計算餐點基本價格，不包含加點費用
      const baseDishPrice = getBaseDishPrice(matchedItem.templateId)
      const savedAmount = baseDishPrice || matchedItem.originalPrice

      // 添加到已選擇券列表
      usedVouchers.value.push({
        voucherId: voucherId,
        voucherInstanceId: voucherId,
        dishName: matchedItem.dishName,
        savedAmount: savedAmount,
        templateId: matchedItem.templateId,
        voucherIndex: matchedItem.voucherIndex,
      })

      console.log('兌換券已選用:', { voucherId, savedAmount })
    } catch (error) {
      console.error('選用兌換券失敗:', error)
      throw error // 重新拋出錯誤供 UI 處理
    }
  }

  // 取消選擇兌換券 - 從 CartView line 803-808 遷移
  function cancelVoucher(voucherId) {
    const index = usedVouchers.value.findIndex((v) => v.voucherId === voucherId)
    if (index !== -1) {
      usedVouchers.value.splice(index, 1)
      console.log('兌換券已取消:', voucherId)
    }
  }

  // 獲取餐點基本價格（不含加點）- 從 CartView line 789-801 遷移
  function getBaseDishPrice(templateId) {
    // 從購物車中找到對應的餐點，獲取其基本價格
    const cartItem = items.value.find(
      (item) => item.dishInstance && item.dishInstance.templateId === templateId,
    )

    if (cartItem && cartItem.dishInstance) {
      // 返回餐點基本價格，不包含選項加價
      return cartItem.dishInstance.basePrice || cartItem.dishInstance.finalPrice
    }

    return 0
  }

  // 獲取用戶折價券
  async function fetchUserCoupons(brandId) {
    if (!brandId) {
      console.warn('fetchUserCoupons: 缺少 brandId')
      return
    }

    try {
      const response = await api.promotion.getUserCoupons(brandId, {
        includeUsed: false,
        includeExpired: false,
      })

      if (response.success) {
        userCoupons.value = response.coupons || []
        console.log(`已載入 ${userCoupons.value.length} 張折價券`)
      }
    } catch (error) {
      console.error('獲取用戶折價券失敗:', error)
    }
  }

  // 應用折價券 - 從 CartView line 838-852 遷移（重命名避免衝突）
  function applyStoreCoupon(couponId) {
    const coupon = usableCoupons.value.find((c) => c._id === couponId)
    if (!coupon || !canUseCoupon.value(couponId)) {
      throw new Error('無法使用此折價券')
    }

    const discountAmount = calculateCouponDiscount(coupon)

    appliedCoupons.value.push({
      discountModel: 'CouponInstance',
      refId: coupon._id,
      amount: discountAmount,
      name: coupon.name,
      discountInfo: coupon.discountInfo,
    })

    console.log('折價券已應用:', { couponId, discountAmount })
  }

  // 移除折價券 - 從 CartView line 855-861 遷移
  function removeStoreCoupon(couponId) {
    const index = appliedCoupons.value.findIndex((c) => c.refId === couponId)
    if (index !== -1) {
      appliedCoupons.value.splice(index, 1)
      console.log('折價券已移除:', couponId)
    }
  }

  // 計算折價券折扣金額 - 從 CartView line 820-835 遷移
  function calculateCouponDiscount(coupon) {
    const currentSubtotal = subtotal.value
    const discountInfo = coupon.discountInfo

    if (discountInfo.discountType === 'percentage') {
      let discount = Math.floor(currentSubtotal * (discountInfo.discountValue / 100))
      if (discountInfo.maxDiscountAmount) {
        discount = Math.min(discount, discountInfo.maxDiscountAmount)
      }
      return discount
    } else if (discountInfo.discountType === 'fixed') {
      return Math.min(discountInfo.discountValue, currentSubtotal)
    }

    return 0
  }

  // 獲取啟用的點數規則 - 從 CartView line 700-718 遷移
  async function fetchActivePointRules(brandId) {
    if (!brandId) {
      console.warn('fetchActivePointRules: 缺少 brandId')
      return
    }

    try {
      const response = await api.promotion.getActivePointRules(brandId)

      if (response.success) {
        activePointRules.value = response.rules || []
        console.log(`已載入 ${activePointRules.value.length} 條點數規則`)
      }
    } catch (error) {
      console.error('獲取點數規則失敗:', error)
    }
  }

  // 獲取店家公開資訊 - 從 CartView line 721-747 遷移
  async function fetchStoreInfo(brandId, storeId) {
    if (!brandId || !storeId) {
      console.warn('fetchStoreInfo: 缺少 brandId 或 storeId')
      return
    }

    try {
      const response = await api.store.getStorePublicInfo({
        brandId: brandId,
        id: storeId,
      })

      if (response && response.store) {
        storeInfo.value = response.store
        console.log('店家資訊已載入:', {
          storeName: response.store.name,
          isOnlinePaymentEnabled: response.store.isActiveCustomerOnlinePayment,
        })
      }
    } catch (error) {
      console.error('獲取店家資訊失敗:', error)
    }
  }

  return {
    // 狀態
    items,
    orderType,
    customerInfo,
    deliveryInfo,
    dineInInfo,
    pickupInfo,
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
    serviceChargeRate,
    // 券相關狀態
    availableVouchers,
    usedVouchers,
    availableCoupons,
    userVouchers,
    userCoupons,
    activePointRules,
    storeInfo,
    orderRemarks,

    // 計算屬性
    subtotal,
    serviceCharge,
    discountAmount,
    total,
    itemCount,
    isCartEmpty,
    isValid,
    currentBrandId,
    currentStoreId,
    // 券相關計算屬性
    matchedVouchers,
    usableCoupons,
    voucherSavingsAmount,
    couponDiscountAmount,
    estimatedPoints,
    getVoucherById,
    getCouponById,
    getCartItemByIndex,
    canUseCoupon,

    // 方法
    setBrandAndStore,
    initializeBrandAndStore,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    clearPromotions,
    resetOrderTypeSpecificInfo,
    setOrderType,
    setCustomerInfo,
    setLineUserInfo,
    setDeliveryInfo,
    setDineInInfo,
    setPickupInfo,
    setPickupTime,
    setNotes,
    applyCoupon,
    removeCoupon,
    setPaymentType,
    toggleStaffMode,
    validateOrder,
    submitOrder,
    restorePendingCart,
    clearPendingCart,
    getPendingCartInfo,
    // 券相關方法
    fetchUserVouchers,
    useVoucher,
    cancelVoucher,
    getBaseDishPrice,
    fetchUserCoupons,
    applyStoreCoupon,
    removeStoreCoupon,
    calculateCouponDiscount,
    fetchActivePointRules,
    fetchStoreInfo,
  }
})
