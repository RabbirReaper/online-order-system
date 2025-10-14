<template>
  <div class="customer-info-container mb-4">
    <!-- 顧客資訊 - 只在非內用模式下顯示 -->
    <div v-if="orderType !== 'dineIn'">
      <h6 class="mb-3 fw-bold">顧客資訊</h6>

      <!-- 登入提示 - 如果未登入且表單為空時顯示 -->
      <div
        v-if="!authStore.isLoggedIn && !localCustomerInfo.name && !localCustomerInfo.phone"
        class="alert alert-info mb-3"
      >
        <div class="d-flex align-items-center">
          <i class="bi bi-info-circle-fill me-2"></i>
          <div class="flex-grow-1">
            <small>已經是會員了嗎？</small>
          </div>
          <button type="button" class="btn btn-sm btn-outline-primary" @click="goToLogin">
            會員登入
          </button>
        </div>
      </div>

      <!-- 已登入用戶提示 -->
      <div v-if="authStore.isLoggedIn && userProfile" class="alert alert-success mb-3">
        <div class="d-flex align-items-center">
          <i class="bi bi-check-circle-fill me-2"></i>
          <small>您好，我們已自動填入您的登入資料</small>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <label for="customerName" class="form-label"
            >姓名 <span class="text-danger">*</span></label
          >
          <input
            type="text"
            class="form-control"
            id="customerName"
            :value="localCustomerInfo.name"
            @input="updateName"
            placeholder="請輸入姓名"
          />
        </div>
        <div class="col-md-6">
          <label for="customerPhone" class="form-label"
            >電話 <span class="text-danger">*</span></label
          >
          <input
            type="tel"
            class="form-control"
            id="customerPhone"
            :value="localCustomerInfo.phone"
            @input="updatePhone"
            placeholder="請輸入聯絡電話"
          />
        </div>
      </div>
    </div>

    <!-- 付款方式 -->
    <h6 class="mb-3 fw-bold">付款方式</h6>
    <div class="d-flex flex-wrap">
      <!-- 現場付款（總是顯示） -->
      <div class="form-check me-4 mb-3">
        <input
          class="form-check-input"
          type="radio"
          name="paymentMethod"
          id="cashPayment"
          value="現金"
          v-model="localPaymentMethod"
        />
        <label class="form-check-label" for="cashPayment">現場付款</label>
      </div>

      <!-- 信用卡付款（根據門市設定顯示） -->
      <div v-if="showCreditCard" class="form-check me-4 mb-3">
        <input
          class="form-check-input"
          type="radio"
          name="paymentMethod"
          id="creditCardPayment"
          value="信用卡"
          v-model="localPaymentMethod"
        />
        <label class="form-check-label" for="creditCardPayment">信用卡付款</label>
      </div>

      <!-- LINE Pay（根據門市設定顯示） -->
      <div v-if="showLinePay" class="form-check mb-3">
        <input
          class="form-check-input"
          type="radio"
          name="paymentMethod"
          id="linePayPayment"
          value="Line Pay"
          v-model="localPaymentMethod"
        />
        <label class="form-check-label" for="linePayPayment">Line Pay</label>
      </div>
    </div>

    <!-- 信用卡資訊（僅在選擇信用卡付款時顯示） -->
    <div v-if="localPaymentMethod === '信用卡'" class="credit-card-form mt-3">
      <p class="text-info mb-3">
        <i class="bi bi-info-circle-fill me-2"></i>
        本網站使用 SSL 加密技術保護您的付款資訊
      </p>
      <div class="row g-3">
        <div class="col-12">
          <label for="card-number" class="form-label">卡號 <span class="text-danger">*</span></label>
          <div class="tpfield" id="card-number"></div>
        </div>
        <div class="col-md-6">
          <label for="card-expiration-date" class="form-label">有效期限 <span class="text-danger">*</span></label>
          <div class="tpfield" id="card-expiration-date"></div>
        </div>
        <div class="col-md-6">
          <label for="card-ccv" class="form-label">安全碼 <span class="text-danger">*</span></label>
          <div class="tpfield" id="card-ccv"></div>
        </div>
        <div class="col-12">
          <label for="cardHolder" class="form-label">持卡人姓名 <span class="text-danger">*</span></label>
          <input
            type="text"
            class="form-control"
            id="cardHolder"
            placeholder="請輸入卡片上的姓名"
            v-model="cardHolderName"
          />
        </div>
      </div>

      <!-- TapPay Fields 錯誤提示 -->
      <div v-if="cardError" class="alert alert-danger mt-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ cardError }}
      </div>
    </div>

    <!-- Line Pay 提示（僅在選擇 Line Pay 時顯示） -->
    <div v-if="localPaymentMethod === 'Line Pay'" class="line-pay-info mt-3">
      <div class="alert alert-warning">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Line Pay 支付功能目前處於開發階段，暫時僅支援現場付款。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/customerAuth'
import { useCartStore } from '@/stores/cart'
import api from '@/api'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const props = defineProps({
  customerInfo: {
    type: Object,
    default: () => ({
      name: '',
      phone: '',
    }),
  },
  paymentMethod: {
    type: String,
    default: '現金',
  },
  orderType: {
    type: String,
    default: 'takeout',
  },
  customerPayments: {
    type: Array,
    default: null,
  },
})

const emit = defineEmits(['update:customerInfo', 'update:paymentMethod'])

const localCustomerInfo = ref({
  name: props.customerInfo.name || '',
  phone: props.customerInfo.phone || '',
})
const localPaymentMethod = ref(props.paymentMethod)

const userProfile = ref(null)
const isLoadingProfile = ref(false)

const storeData = ref(null)

const cardHolderName = ref('')
const cardError = ref('')
const canGetPrime = ref(false)
const tappayInitialized = ref(false)

const availablePayments = computed(() => {
  if (props.customerPayments !== null) {
    return props.customerPayments
  }

  if (storeData.value && storeData.value.customerPayments) {
    return storeData.value.customerPayments
  }

  return []
})

const showCreditCard = computed(() => {
  return availablePayments.value.includes('credit_card')
})

const showLinePay = computed(() => {
  return availablePayments.value.includes('line_pay')
})

const hasOnlinePayment = computed(() => {
  return showCreditCard.value || showLinePay.value
})

const loadStoreData = async () => {
  try {
    const brandId = cartStore.currentBrandId
    const storeId = cartStore.currentStoreId

    if (!brandId || !storeId) {
      console.warn('缺少品牌或門市 ID')
      return
    }

    const response = await api.store.getStorePublicInfo({
      brandId,
      id: storeId,
    })

    if (response && response.success) {
      storeData.value = response.store

      if (availablePayments.value.length === 0) {
        localPaymentMethod.value = '現金'
        emit('update:paymentMethod', '現金')
      }
    }
  } catch (error) {
    console.error('載入門市資料失敗:', error)
  }
}

const loadUserProfile = async () => {
  if (!authStore.isLoggedIn || !authStore.currentBrandId) {
    return
  }

  try {
    isLoadingProfile.value = true
    const profile = await authStore.getUserProfile()
    userProfile.value = profile

    if (!localCustomerInfo.value.name && !localCustomerInfo.value.phone) {
      autoFillUserInfo()
    }
  } catch (error) {
    console.error('載入用戶資料失敗:', error)
  } finally {
    isLoadingProfile.value = false
  }
}

const autoFillUserInfo = () => {
  if (!userProfile.value) return

  localCustomerInfo.value = {
    name: userProfile.value.name || '',
    phone: userProfile.value.phone || '',
  }

  emit('update:customerInfo', { ...localCustomerInfo.value })
}

const goToLogin = () => {
  const currentPath = router.currentRoute.value.fullPath
  router.push({
    path: '/auth/login',
    query: { redirect: currentPath },
  })
}

const updateName = (event) => {
  localCustomerInfo.value.name = event.target.value
  emit('update:customerInfo', { ...localCustomerInfo.value })
}

const updatePhone = (event) => {
  localCustomerInfo.value.phone = event.target.value
  emit('update:customerInfo', { ...localCustomerInfo.value })
}

const initTapPay = () => {
  if (typeof window.TPDirect === 'undefined') {
    console.error('TapPay SDK 未載入')
    cardError.value = '支付系統初始化失敗，請重新整理頁面'
    return
  }

  try {
    const appId = import.meta.env.VITE_TAPPAY_APP_ID
    const appKey = import.meta.env.VITE_TAPPAY_APP_KEY
    const env = import.meta.env.VITE_TAPPAY_ENV || 'sandbox'

    window.TPDirect.setupSDK(appId, appKey, env)

    window.TPDirect.card.setup({
      fields: {
        number: {
          element: '#card-number',
          placeholder: '**** **** **** ****'
        },
        expirationDate: {
          element: '#card-expiration-date',
          placeholder: 'MM / YY'
        },
        ccv: {
          element: '#card-ccv',
          placeholder: 'CVV'
        }
      },
      styles: {
        'input': {
          'color': '#495057',
          'font-size': '16px',
          'line-height': '1.5',
          'padding': '0.375rem 0.75rem'
        },
        'input.ccv': {
          'font-size': '16px'
        },
        'input.expiration-date': {
          'font-size': '16px'
        },
        'input.card-number': {
          'font-size': '16px'
        },
        ':focus': {
          'color': '#495057'
        },
        '.valid': {
          'color': '#198754'
        },
        '.invalid': {
          'color': '#dc3545'
        }
      },
      isMaskCreditCardNumber: true,
      maskCreditCardNumberRange: {
        beginIndex: 6,
        endIndex: 11
      }
    })

    window.TPDirect.card.onUpdate((update) => {
      canGetPrime.value = update.canGetPrime

      if (update.hasError) {
        if (update.status.number === 2) {
          cardError.value = '請輸入正確的卡號'
        } else if (update.status.expiry === 2) {
          cardError.value = '請輸入正確的有效期限'
        } else if (update.status.ccv === 2) {
          cardError.value = '請輸入正確的安全碼'
        }
      } else if (update.canGetPrime) {
        cardError.value = ''
      }
    })

    tappayInitialized.value = true
    console.log('TapPay SDK 初始化成功')
  } catch (error) {
    console.error('TapPay 初始化失敗:', error)
    cardError.value = '支付系統初始化失敗'
  }
}

const getPrime = () => {
  return new Promise((resolve, reject) => {
    if (!tappayInitialized.value) {
      reject(new Error('TapPay 尚未初始化'))
      return
    }

    if (!canGetPrime.value) {
      reject(new Error('請完整填寫信用卡資料'))
      return
    }

    if (!cardHolderName.value || cardHolderName.value.trim() === '') {
      reject(new Error('請輸入持卡人姓名'))
      return
    }

    const tappayStatus = window.TPDirect.card.getTappayFieldsStatus()

    if (!tappayStatus.canGetPrime) {
      reject(new Error('信用卡資料填寫不完整或有誤'))
      return
    }

    window.TPDirect.card.getPrime((result) => {
      if (result.status !== 0) {
        reject(new Error(result.msg || '取得付款資訊失敗'))
        return
      }

      resolve({
        prime: result.card.prime,
        cardHolder: cardHolderName.value,
        cardInfo: result.card
      })
    })
  })
}

watch(
  () => props.orderType,
  (newType) => {
    if (newType === 'dineIn') {
      if (authStore.isLoggedIn && userProfile.value) {
        autoFillUserInfo()
      } else {
        localCustomerInfo.value = { name: '', phone: '' }
        emit('update:customerInfo', { ...localCustomerInfo.value })
      }
    } else {
      if (
        authStore.isLoggedIn &&
        userProfile.value &&
        !localCustomerInfo.value.name &&
        !localCustomerInfo.value.phone
      ) {
        autoFillUserInfo()
      }
    }
  },
)

watch(
  () => props.customerInfo,
  (newVal) => {
    if (
      newVal.name !== localCustomerInfo.value.name ||
      newVal.phone !== localCustomerInfo.value.phone
    ) {
      localCustomerInfo.value = {
        name: newVal.name || '',
        phone: newVal.phone || '',
      }
    }
  },
  { deep: true },
)

watch(
  () => props.paymentMethod,
  (newVal) => {
    if (newVal !== localPaymentMethod.value) {
      localPaymentMethod.value = newVal
    }
  },
)

watch(localPaymentMethod, (newVal) => {
  emit('update:paymentMethod', newVal)

  if (newVal === '信用卡' && showCreditCard.value && !tappayInitialized.value) {
    setTimeout(() => {
      initTapPay()
    }, 100)
  }
})

watch(
  () => authStore.isLoggedIn,
  async (newVal) => {
    if (newVal) {
      await loadUserProfile()
    } else {
      userProfile.value = null
    }
  },
)

onMounted(async () => {
  if (props.customerPayments === null) {
    await loadStoreData()
  }

  if (authStore.isLoggedIn) {
    await loadUserProfile()
  }

  if (localPaymentMethod.value === '信用卡' && showCreditCard.value) {
    setTimeout(() => {
      initTapPay()
    }, 100)
  }
})

defineExpose({
  getPrime
})
</script>

<style scoped>
.form-check-input {
  border: 2px solid #495057;
}

.form-check-input:checked {
  background-color: #d35400;
  border-color: #d35400;
}

.customer-info-container label {
  font-weight: 500;
}

.credit-card-form {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #dee2e6;
}

.tpfield {
  height: 40px;
  width: 100%;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
  background-color: #fff;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.tpfield:focus-within {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.alert {
  margin-bottom: 0;
}

.text-danger {
  color: #dc3545;
}

.alert-info {
  background-color: #e7f3ff;
  border-color: #b8daff;
  color: #31708f;
}

.alert-success {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.btn-outline-primary {
  color: #d35400;
  border-color: #d35400;
}

.btn-outline-primary:hover {
  background-color: #d35400;
  border-color: #d35400;
}
</style>
