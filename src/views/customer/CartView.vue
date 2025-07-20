<template>
  <div class="cart-page">
    <div class="container-wrapper">
      <!-- Header -->
      <div class="cart-header p-3 d-flex align-items-center bg-white shadow-sm">
        <button class="btn btn-link text-dark p-0" @click="goBack">
          <i class="bi bi-arrow-left fs-4"></i>
        </button>
        <h5 class="mb-0 mx-auto">購物車</h5>
      </div>

      <div class="divider"></div>

      <!-- Empty Cart Message -->
      <div v-if="cartItems.length === 0" class="text-center p-5 text-muted">
        <i class="bi bi-cart-x fs-1"></i>
        <p class="mt-3">購物車是空的</p>
        <button class="btn btn-primary mt-3" @click="goBack">返回菜單</button>
      </div>

      <!-- Cart Content -->
      <div v-else class="cart-content p-3">
        <!-- Order Items -->
        <div class="order-items mb-4">
          <h6 class="mb-3 fw-bold">訂單內容</h6>
          <CartItem
            v-for="(item, index) in cartItems"
            :key="index"
            :item="item"
            :index="index"
            @remove="removeFromCart"
            @edit="editItem"
            @quantity-change="updateCartItemQuantity"
          />
        </div>

        <div class="divider"></div>

        <!-- Order Notes -->
        <div class="order-notes mb-4">
          <h6 class="mb-3 fw-bold">訂單備註</h6>
          <textarea
            class="form-control"
            rows="2"
            placeholder="有特殊需求嗎？請告訴我們"
            v-model="orderRemarks"
          ></textarea>
        </div>

        <div class="divider"></div>

        <!-- 兌換券區塊 -->
        <div class="voucher-section mb-4" v-if="availableVouchers.length > 0">
          <h6 class="mb-3 fw-bold">
            <i class="bi bi-ticket-perforated me-2 text-warning"></i>
            可用兌換券
          </h6>
          <div class="voucher-cards">
            <VoucherCard
              v-for="voucher in availableVouchers"
              :key="voucher._id"
              :voucher="voucher"
              :matchedItem="voucher.matchedItem"
              :isSelected="voucher.isSelected"
              @use="useVoucher"
              @cancel="cancelVoucher"
            />
          </div>
        </div>

        <!-- 折價券區塊 -->
        <div class="coupon-section mb-4" v-if="availableCoupons.length > 0">
          <h6 class="mb-3 fw-bold">
            <i class="bi bi-percent me-2 text-primary"></i>
            會員折價券
          </h6>
          <div class="coupon-cards">
            <CouponCard
              v-for="coupon in availableCoupons"
              :key="coupon._id"
              :coupon="coupon"
              :isApplied="appliedCoupons.some((c) => c.couponId === coupon._id)"
              :canUse="canUseCoupon(coupon)"
              :currentSubtotal="calculateSubtotal()"
              @apply="applyCoupon"
              @remove="removeCoupon"
            />
          </div>
        </div>

        <!-- 如果用戶已登入但沒有可用券的提示 -->
        <div
          v-if="
            authStore.isLoggedIn && availableVouchers.length === 0 && availableCoupons.length === 0
          "
          class="no-coupons mb-4"
        >
          <div class="text-center py-3 text-muted">
            <i class="bi bi-gift fs-4"></i>
            <p class="mt-2">目前沒有可用的優惠券</p>
            <small>購買套餐或參與活動可獲得優惠券</small>
          </div>
        </div>

        <!-- 如果用戶未登入的提示 -->
        <div v-if="!authStore.isLoggedIn" class="login-prompt mb-4">
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            <span>登入會員享有兌換券和折價券優惠！</span>
            <button class="btn btn-sm btn-outline-primary ms-2" @click="goToLogin">立即登入</button>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Order Type Selection -->
        <OrderTypeSelector
          v-model:order-type="orderType"
          v-model:table-number="tableNumber"
          v-model:delivery-address="deliveryAddress"
          v-model:pickup-time="pickupTime"
          v-model:scheduled-time="scheduledTime"
          @update:delivery-fee="updateDeliveryFee"
        />

        <div class="divider"></div>

        <!-- Customer Information -->
        <CustomerInfoForm
          v-model:customer-info="customerInfo"
          v-model:payment-method="paymentMethod"
          :order-type="orderType"
        />

        <div class="divider"></div>

        <!-- Order Total -->
        <div class="order-total mb-4">
          <div class="d-flex justify-content-between mb-2">
            <span>小計</span>
            <span>${{ calculateSubtotal() }}</span>
          </div>

          <!-- 兌換券節省顯示 -->
          <div class="d-flex justify-content-between mb-2 text-success" v-if="voucherSavings > 0">
            <span>
              <i class="bi bi-ticket-perforated me-1"></i>
              兌換券節省
            </span>
            <span>-${{ voucherSavings }}</span>
          </div>

          <!-- 折價券折扣顯示 -->
          <div class="d-flex justify-content-between mb-2 text-primary" v-if="couponDiscount > 0">
            <span>
              <i class="bi bi-percent me-1"></i>
              優惠折扣
            </span>
            <span>-${{ couponDiscount }}</span>
          </div>

          <div class="d-flex justify-content-between mb-2" v-if="deliveryFee > 0">
            <span>外送費</span>
            <span>${{ deliveryFee }}</span>
          </div>

          <div class="d-flex justify-content-between fw-bold fs-5">
            <span>總計</span>
            <span>${{ calculateTotal() }}</span>
          </div>
        </div>
      </div>

      <!-- Error Message Display -->
      <div
        v-if="errorMsg"
        class="error-message-container position-fixed w-100 p-3"
        style="
          bottom: 80px;
          max-width: 540px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1050;
        "
      >
        <div class="alert alert-danger alert-dismissible fade show mb-0" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ errorMsg }}
          <button type="button" class="btn-close" aria-label="Close" @click="clearError"></button>
        </div>
      </div>

      <!-- Success Message Display -->
      <div
        v-if="successMsg"
        class="success-message-container position-fixed w-100 p-3"
        style="
          bottom: 80px;
          max-width: 540px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1050;
        "
      >
        <div class="alert alert-success alert-dismissible fade show mb-0" role="alert">
          <i class="bi bi-check-circle-fill me-2"></i>
          {{ successMsg }}
          <button type="button" class="btn-close" aria-label="Close" @click="clearSuccess"></button>
        </div>
      </div>

      <!-- Fixed Bottom Button -->
      <div
        v-if="cartItems.length > 0"
        class="checkout-button position-fixed bottom-0 start-50 translate-middle-x w-100 bg-white p-3 shadow-lg d-flex justify-content-center"
        style="max-width: 540px"
      >
        <div class="container-button" style="max-width: 540px">
          <button class="btn w-100 py-2 checkout-btn" @click="checkout" :disabled="!isFormValid">
            前往結帳 - ${{ calculateTotal() }}
          </button>
        </div>
      </div>

      <!-- Modal Components -->
      <!-- 結帳確認框 -->
      <div
        class="modal fade"
        id="confirmOrderModal"
        tabindex="-1"
        aria-labelledby="confirmOrderModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="confirmOrderModalLabel">確認訂單</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">
              <p>請確認您的訂單資訊</p>
              <!-- 訂單摘要 -->
              <div class="order-summary">
                <h6>訂單項目：</h6>
                <ul class="list-unstyled">
                  <li v-for="item in cartItems" :key="item.key" class="mb-1">
                    {{ item.dishInstance?.name || item.bundleInstance?.name }} x{{ item.quantity }}
                  </li>
                </ul>

                <div v-if="usedVouchers.length > 0">
                  <h6 class="text-success">使用的兌換券：</h6>
                  <ul class="list-unstyled text-success">
                    <li v-for="voucher in usedVouchers" :key="voucher.voucherId">
                      {{ voucher.dishName }} (省下 ${{ voucher.savedAmount }})
                    </li>
                  </ul>
                </div>

                <div v-if="appliedCoupons.length > 0">
                  <h6 class="text-primary">使用的折價券：</h6>
                  <ul class="list-unstyled text-primary">
                    <li v-for="coupon in appliedCoupons" :key="coupon.couponId">
                      {{ coupon.name }} (折抵 ${{ coupon.amount }})
                    </li>
                  </ul>
                </div>

                <hr />
                <div class="d-flex justify-content-between fw-bold">
                  <span>總計：</span>
                  <span>${{ calculateTotal() }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                返回修改
              </button>
              <button type="button" class="btn btn-primary" @click="submitOrder">確認送出</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/customerAuth'
import CartItem from '@/components/customer/cart/CartItem.vue'
import OrderTypeSelector from '@/components/customer/cart/OrderTypeSelector.vue'
import CustomerInfoForm from '@/components/customer/cart/CustomerInfoForm.vue'
import VoucherCard from '@/components/customer/cart/VoucherCard.vue'
import CouponCard from '@/components/customer/cart/CouponCard.vue'
import api from '@/api'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

// 購物車內容
const cartItems = computed(() => cartStore.items)

// 訊息狀態
const errorMsg = ref('')
const successMsg = ref('')

// 表單資料
const orderRemarks = ref('')
const orderType = ref('selfPickup')
const tableNumber = ref('')
const deliveryAddress = ref('')
const pickupTime = ref('asap')
const scheduledTime = ref('')
const deliveryFee = ref(0)
const paymentMethod = ref('現金')
const customerInfo = ref({
  name: '',
  phone: '',
})

// 券相關狀態
const userVouchers = ref([])
const userCoupons = ref([])
const usedVouchers = ref([]) // 已選擇的兌換券
const appliedCoupons = ref([]) // 已應用的折價券
const isLoadingCoupons = ref(false)

let confirmModal = null

// 計算屬性
const isFormValid = computed(() => {
  if (orderType.value === 'dineIn') {
    return tableNumber.value && tableNumber.value.trim() !== ''
  }

  const name = customerInfo.value?.name || ''
  const phone = customerInfo.value?.phone || ''

  if (!name.trim() || !phone.trim()) {
    return false
  }

  if (orderType.value === 'delivery' && (!deliveryAddress.value || !deliveryAddress.value.trim())) {
    return false
  }

  if (pickupTime.value === 'scheduled' && (!scheduledTime.value || !scheduledTime.value.trim())) {
    return false
  }

  return true
})

// 計算可用兌換券 - 重新設計的簡潔邏輯
const availableVouchers = computed(() => {
  if (!authStore.isLoggedIn || !userVouchers.value.length) {
    return []
  }

  // 1. 統計購物車中每種餐點的總數量
  const dishCounts = {}
  cartItems.value.forEach((cartItem) => {
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
        index: cartItems.value.indexOf(cartItem),
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
  const matchedVouchers = []

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

      matchedVouchers.push({
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

  return matchedVouchers
})

// 可用折價券
const availableCoupons = computed(() => {
  if (!authStore.isLoggedIn || !userCoupons.value.length) {
    return []
  }

  return userCoupons.value.filter(
    (coupon) =>
      !coupon.isUsed &&
      new Date(coupon.expiryDate) > new Date() &&
      calculateSubtotal() >= (coupon.discountInfo?.minPurchaseAmount || 0),
  )
})

// 計算兌換券節省金額
const voucherSavings = computed(() => {
  return usedVouchers.value.reduce((total, voucher) => total + voucher.savedAmount, 0)
})

// 計算折價券折扣
const couponDiscount = computed(() => {
  return appliedCoupons.value.reduce((total, coupon) => total + coupon.amount, 0)
})

// 方法
const clearError = () => {
  errorMsg.value = ''
}

const clearSuccess = () => {
  successMsg.value = ''
}

const showError = (message) => {
  errorMsg.value = message
  setTimeout(() => {
    if (errorMsg.value === message) {
      clearError()
    }
  }, 5000)
}

const showSuccess = (message) => {
  successMsg.value = message
  setTimeout(() => {
    if (successMsg.value === message) {
      clearSuccess()
    }
  }, 3000)
}

const goBack = () => {
  router.go(-1)
}

const goToLogin = () => {
  router.push({
    name: 'login',
    query: {
      redirect: router.currentRoute.value.fullPath,
    },
  })
}

const removeFromCart = (index) => {
  cartStore.removeItem(index)
}

const editItem = (index) => {
  const item = cartItems.value[index]

  if (!cartStore.currentBrand || !cartStore.currentStore) {
    console.error('缺少品牌或店鋪ID:', {
      brandId: cartStore.currentBrand,
      storeId: cartStore.currentStore,
    })
    showError('無法編輯商品：缺少必要資訊')
    return
  }

  router.push({
    name: 'dish-detail',
    params: {
      brandId: cartStore.currentBrand,
      storeId: cartStore.currentStore,
      dishId: item.dishInstance.templateId || item.dishInstance._id,
    },
  })
}

const updateCartItemQuantity = (index, change) => {
  const item = cartItems.value[index]
  const newQuantity = item.quantity + change
  cartStore.updateItemQuantity(index, newQuantity)
}

const updateDeliveryFee = (fee) => {
  deliveryFee.value = fee
}

const calculateSubtotal = () => {
  return cartStore.subtotal - voucherSavings.value
}

const calculateTotal = () => {
  return Math.max(0, calculateSubtotal() - couponDiscount.value + deliveryFee.value)
}

// 獲取用戶券資料
const fetchUserCoupons = async () => {
  if (!authStore.isLoggedIn || !authStore.currentBrandId) {
    return
  }

  try {
    isLoadingCoupons.value = true

    // 並行獲取兌換券和折價券
    const [vouchersResponse, couponsResponse] = await Promise.all([
      api.promotion.getUserVouchers(authStore.currentBrandId, {
        includeUsed: false,
        includeExpired: false,
      }),
      api.promotion.getUserCoupons(authStore.currentBrandId, {
        includeUsed: false,
        includeExpired: false,
      }),
    ])

    if (vouchersResponse.success) {
      userVouchers.value = vouchersResponse.vouchers || []
    }

    if (couponsResponse.success) {
      userCoupons.value = couponsResponse.coupons || []
    }
  } catch (error) {
    console.error('獲取用戶券資料失敗:', error)
  } finally {
    isLoadingCoupons.value = false
  }
}

// 使用兌換券的簡化邏輯
const useVoucher = async (voucher, matchedItem) => {
  try {
    // 檢查是否已經選擇過這個券
    const alreadySelected = usedVouchers.value.some((v) => v.voucherId === voucher._id)
    if (alreadySelected) {
      showError('此兌換券已被選用')
      return
    }

    // 檢查該餐點類型還能使用幾個券
    const sameTemplateUsed = usedVouchers.value.filter(
      (v) => v.templateId === matchedItem.templateId,
    ).length

    if (sameTemplateUsed >= matchedItem.availableQuantity) {
      showError('該餐點的兌換券使用數量已達上限')
      return
    }

    // 添加到已選擇券列表
    usedVouchers.value.push({
      voucherId: voucher._id,
      voucherInstanceId: voucher._id,
      dishName: matchedItem.dishName,
      savedAmount: matchedItem.originalPrice,
      templateId: matchedItem.templateId,
      voucherIndex: matchedItem.voucherIndex,
    })

    showSuccess(`成功選用 ${voucher.voucherName}！`)
  } catch (error) {
    console.error('選用兌換券失敗:', error)
    showError('選用兌換券失敗：' + error.message)
  }
}

// 取消選擇兌換券
const cancelVoucher = (voucherId) => {
  const index = usedVouchers.value.findIndex((v) => v.voucherId === voucherId)
  if (index !== -1) {
    const voucher = usedVouchers.value[index]
    usedVouchers.value.splice(index, 1)
    showSuccess(`已取消選用 ${voucher.dishName} 兌換券`)
  }
}

// 檢查是否可以使用折價券
const canUseCoupon = (coupon) => {
  const currentSubtotal = calculateSubtotal()
  const minAmount = coupon.discountInfo?.minPurchaseAmount || 0
  return (
    currentSubtotal >= minAmount && !appliedCoupons.value.some((c) => c.couponId === coupon._id)
  )
}

// 計算折價券折扣金額
const calculateCouponDiscount = (coupon) => {
  const subtotal = calculateSubtotal()
  const discountInfo = coupon.discountInfo

  if (discountInfo.discountType === 'percentage') {
    let discount = Math.floor(subtotal * (discountInfo.discountValue / 100))
    if (discountInfo.maxDiscountAmount) {
      discount = Math.min(discount, discountInfo.maxDiscountAmount)
    }
    return discount
  } else if (discountInfo.discountType === 'fixed') {
    return Math.min(discountInfo.discountValue, subtotal)
  }

  return 0
}

// 應用折價券
const applyCoupon = (coupon) => {
  if (!canUseCoupon(coupon)) {
    showError('無法使用此折價券')
    return
  }

  const discountAmount = calculateCouponDiscount(coupon)

  appliedCoupons.value.push({
    couponId: coupon._id,
    name: coupon.name,
    amount: discountAmount,
    discountInfo: coupon.discountInfo,
  })

  showSuccess(`已套用 ${coupon.name}！`)
}

// 移除折價券
const removeCoupon = (couponId) => {
  const index = appliedCoupons.value.findIndex((c) => c.couponId === couponId)
  if (index !== -1) {
    const coupon = appliedCoupons.value[index]
    appliedCoupons.value.splice(index, 1)
    showSuccess(`已移除 ${coupon.name}`)
  }
}

const checkout = () => {
  if (!isFormValid.value) {
    showError('請填寫所有必要資訊')
    return
  }

  clearError()

  if (confirmModal) {
    confirmModal.show()
  }
}

// 提交訂單
const submitOrder = async () => {
  try {
    clearError()

    const mappedOrderType = (() => {
      switch (orderType.value) {
        case 'dineIn':
          return 'dine_in'
        case 'selfPickup':
          return 'takeout'
        case 'delivery':
          return 'delivery'
        default:
          return 'takeout'
      }
    })()

    cartStore.setOrderType(mappedOrderType)

    const mappedPaymentMethod = (() => {
      switch (paymentMethod.value) {
        case '現金':
          return 'cash'
        case '信用卡':
          return 'credit_card'
        case 'Line Pay':
          return 'line_pay'
        default:
          return 'cash'
      }
    })()

    cartStore.setPaymentMethod(mappedPaymentMethod)
    cartStore.setNotes(orderRemarks.value)

    // 根據訂單類型設置相應數據
    if (orderType.value === 'dineIn') {
      cartStore.setDineInInfo({
        tableNumber: tableNumber.value,
      })
      cartStore.setCustomerInfo({ name: '', phone: '' })
    } else if (orderType.value === 'selfPickup') {
      cartStore.setCustomerInfo(customerInfo.value)
      if (pickupTime.value === 'scheduled') {
        cartStore.setPickupTime(new Date(scheduledTime.value))
      }
    } else if (orderType.value === 'delivery') {
      cartStore.setCustomerInfo(customerInfo.value)
      cartStore.setDeliveryInfo({
        address: deliveryAddress.value,
        deliveryFee: deliveryFee.value,
        estimatedTime: pickupTime.value === 'scheduled' ? new Date(scheduledTime.value) : null,
      })
    }

    // 處理折價券
    if (appliedCoupons.value.length > 0) {
      appliedCoupons.value.forEach((coupon) => {
        cartStore.applyCoupon({
          couponId: coupon.couponId,
          amount: coupon.amount,
        })
      })
    }

    // 提交訂單
    const result = await cartStore.submitOrder()

    if (result.success) {
      if (confirmModal) {
        confirmModal.hide()
      }

      // 如果有使用兌換券，需要調用API標記為已使用
      if (usedVouchers.value.length > 0) {
        try {
          for (const voucher of usedVouchers.value) {
            await api.promotion.useVoucher({
              brandId: authStore.currentBrandId,
              data: {
                voucherId: voucher.voucherId,
                orderId: result.orderId,
              },
            })
          }
        } catch (voucherError) {
          console.error('標記兌換券使用狀態失敗:', voucherError)
        }
      }

      router.push({
        name: 'order-confirm',
        params: {
          brandId: cartStore.currentBrand,
          storeId: cartStore.currentStore,
          orderId: result.orderId,
        },
      })
    } else {
      console.log('訂單提交失敗:', result)
      throw new Error(result.error || '訂單提交失敗')
    }
  } catch (error) {
    console.error('提交訂單失敗:', error)

    if (confirmModal) {
      confirmModal.hide()
    }

    let errorMessage = '訂單提交失敗，請稍後再試'

    if (error.errors) {
      const errorMessages = Object.values(error.errors).join('\n')
      errorMessage = `請檢查以下資訊：\n${errorMessages}`
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error.message) {
      errorMessage = error.message
    }

    showError(errorMessage)
  }
}

// 監聽用戶登入狀態變化
watch(
  () => authStore.isLoggedIn,
  (newValue) => {
    if (newValue) {
      fetchUserCoupons()
    } else {
      userVouchers.value = []
      userCoupons.value = []
      appliedCoupons.value = []
      usedVouchers.value = []
    }
  },
)

// 生命週期
onMounted(() => {
  window.scrollTo(0, 0)

  // 設置默認預約時間
  const date = new Date()
  date.setMinutes(date.getMinutes() + 30)
  scheduledTime.value = date.toISOString().slice(0, 16)

  // 初始化模態框
  import('bootstrap/js/dist/modal').then((module) => {
    const Modal = module.default
    const modalElement = document.getElementById('confirmOrderModal')
    if (modalElement) {
      confirmModal = new Modal(modalElement)
    }
  })

  // 如果用戶已登入，獲取券資料
  if (authStore.isLoggedIn) {
    fetchUserCoupons()
  }
})
</script>

<style scoped>
.cart-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 80px;
  display: flex;
  justify-content: center;
}

.container-wrapper {
  max-width: 540px;
  width: 100%;
  background-color: white;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  min-height: 100vh;
  position: relative;
}

.cart-header {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.divider {
  height: 8px;
  background-color: #f0f0f0;
  margin-bottom: 15px;
  width: 100%;
}

.checkout-btn {
  border-radius: 8px;
  background-color: #7a5b0c;
  color: white;
  transition: background-color 0.3s;
}

.checkout-btn:hover:not(:disabled) {
  background-color: #4a7dde;
}

.checkout-btn:disabled {
  background-color: #b9cdf2;
  color: #ffffff;
}

.container-button {
  width: 100%;
  padding: 0 15px;
}

.error-message-container,
.success-message-container {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.no-coupons {
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

.login-prompt .alert {
  border-radius: 8px;
}

input[type='datetime-local'] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

@media (max-width: 576px) {
  .container-wrapper {
    max-width: 100%;
  }

  .error-message-container,
  .success-message-container {
    left: 0 !important;
    right: 0;
    transform: none !important;
    max-width: 100% !important;
  }
}
</style>
