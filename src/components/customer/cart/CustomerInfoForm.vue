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
        <!-- Email 欄位暫時註解，後續採用手機號碼簡訊或Line訊息通知 -->
        <!--
        <div class="col-12">
          <label for="customerEmail" class="form-label">Email</label>
          <input type="email" class="form-control" id="customerEmail" v-model="localCustomerInfo.email"
            placeholder="選填，訂單確認將發送到您的信箱">
        </div>
        -->
      </div>
    </div>

    <!-- 付款方式 -->
    <h6 class="mb-3 fw-bold">付款方式</h6>
    <div class="d-flex flex-wrap">
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
      <div class="form-check me-4 mb-3">
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
      <div class="form-check mb-3">
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
          <label for="cardNumber" class="form-label">卡號</label>
          <input
            type="text"
            class="form-control"
            id="cardNumber"
            placeholder="請輸入 16 位卡號"
            maxlength="19"
            v-model="creditCardInfo.number"
            @input="formatCardNumber"
          />
        </div>
        <div class="col-md-6">
          <label for="expiryDate" class="form-label">有效期限</label>
          <input
            type="text"
            class="form-control"
            id="expiryDate"
            placeholder="MM/YY"
            maxlength="5"
            v-model="creditCardInfo.expiry"
            @input="formatExpiryDate"
          />
        </div>
        <div class="col-md-6">
          <label for="cvv" class="form-label">安全碼</label>
          <input
            type="password"
            class="form-control"
            id="cvv"
            placeholder="CVV"
            maxlength="3"
            v-model="creditCardInfo.cvv"
          />
        </div>
        <div class="col-12">
          <label for="cardHolder" class="form-label">持卡人姓名</label>
          <input
            type="text"
            class="form-control"
            id="cardHolder"
            placeholder="請輸入卡片上的姓名"
            v-model="creditCardInfo.name"
          />
        </div>
      </div>

      <!-- 暫時隱藏電子支付選項，僅顯示提示 -->
      <div class="alert alert-warning mt-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        信用卡支付功能目前處於開發階段，暫時僅支援現場付款。
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
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/customerAuth'

const router = useRouter()
const authStore = useAuthStore()

const props = defineProps({
  customerInfo: {
    type: Object,
    default: () => ({
      name: '',
      phone: '',
      // email: '' // 暫時註解
    }),
  },
  paymentMethod: {
    type: String,
    default: '現金',
  },
  orderType: {
    type: String,
    default: 'takeout', // 'dine_in', 'takeout', 'delivery'
  },
})

const emit = defineEmits(['update:customerInfo', 'update:paymentMethod'])

// 本地狀態 - 避免直接使用 reactive 物件的引用
const localCustomerInfo = ref({
  name: props.customerInfo.name || '',
  phone: props.customerInfo.phone || '',
})
const localPaymentMethod = ref(props.paymentMethod)

// 用戶認證相關狀態
const userProfile = ref(null)
const isLoadingProfile = ref(false)

// 信用卡資訊
const creditCardInfo = ref({
  number: '',
  expiry: '',
  cvv: '',
  name: '',
})

// 載入用戶資料
const loadUserProfile = async () => {
  if (!authStore.isLoggedIn || !authStore.currentBrandId) {
    return
  }

  try {
    isLoadingProfile.value = true
    // 使用統一的 getUserProfile 方法
    const profile = await authStore.getUserProfile()
    userProfile.value = profile

    // 如果表單還沒有資料，自動填入用戶資料
    if (!localCustomerInfo.value.name && !localCustomerInfo.value.phone) {
      autoFillUserInfo()
    }
  } catch (error) {
    console.error('載入用戶資料失敗:', error)
  } finally {
    isLoadingProfile.value = false
  }
}

// 自動填入用戶資料
const autoFillUserInfo = () => {
  if (!userProfile.value) return

  localCustomerInfo.value = {
    name: userProfile.value.name || '',
    phone: userProfile.value.phone || '',
  }

  // 通知父組件更新
  emit('update:customerInfo', { ...localCustomerInfo.value })
}

// 跳轉到登入頁面
const goToLogin = () => {
  const currentPath = router.currentRoute.value.fullPath
  router.push({
    path: '/auth/login',
    query: { redirect: currentPath },
  })
}

// 手動處理輸入事件，避免遞歸更新
const updateName = (event) => {
  localCustomerInfo.value.name = event.target.value
  emit('update:customerInfo', { ...localCustomerInfo.value })
}

const updatePhone = (event) => {
  localCustomerInfo.value.phone = event.target.value
  emit('update:customerInfo', { ...localCustomerInfo.value })
}

// 當訂單類型變為內用時，清空顧客資訊
watch(
  () => props.orderType,
  (newType) => {
    if (newType === 'dineIn') {
      // 如果用戶已登入，保留登入用戶的資訊
      if (authStore.isLoggedIn && userProfile.value) {
        autoFillUserInfo()
      } else {
        // 只有在未登入時才清空顧客資訊
        localCustomerInfo.value = { name: '', phone: '' }
        emit('update:customerInfo', { ...localCustomerInfo.value })
      }
    } else {
      // 切換到外帶或外送時，如果用戶已登入且表單為空，自動填入用戶資訊
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

// 只在 props 變化時更新本地狀態，避免雙向綁定造成的遞歸
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

// 監聽付款方式變化
watch(localPaymentMethod, (newVal) => {
  emit('update:paymentMethod', newVal)
})

// 監聽認證狀態變化
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

// 格式化信用卡號碼（每 4 位加一個空格）
const formatCardNumber = (e) => {
  let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')

  if (value.length > 0) {
    value = value.match(new RegExp('.{1,4}', 'g')).join(' ')
  }

  creditCardInfo.value.number = value
}

// 格式化有效期限（自動加入 / 分隔符）
const formatExpiryDate = (e) => {
  let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')

  if (value.length > 2) {
    value = value.substr(0, 2) + '/' + value.substr(2, 2)
  }

  creditCardInfo.value.expiry = value
}

// 組件掛載後檢查認證狀態
onMounted(async () => {
  // 如果已經登入，載入用戶資料
  if (authStore.isLoggedIn) {
    await loadUserProfile()
  }
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
