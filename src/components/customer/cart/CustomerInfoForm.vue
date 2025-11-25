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
      <!-- 現場付款 -->
      <div class="form-check me-4 mb-3">
        <input
          class="form-check-input"
          type="radio"
          name="paymentMethod"
          id="cashPayment"
          value="On-site"
          v-model="localPaymentMethod"
        />
        <label class="form-check-label" for="cashPayment">現場付款</label>
      </div>

      <!-- 線上付款 -->
      <div class="form-check me-4 mb-3">
        <input
          class="form-check-input"
          type="radio"
          name="paymentMethod"
          id="onlinePayment"
          value="Online"
          v-model="localPaymentMethod"
        />
        <label class="form-check-label" for="onlinePayment">線上付款</label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/customerAuth'
import { useCartStore } from '@/stores/cart'

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
    default: 'On-site',
  },
  orderType: {
    type: String,
    default: 'takeout',
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

const loadUserProfile = async () => {
  if (!authStore.isLoggedIn || !authStore.currentBrandId) {
    return
  }

  try {
    isLoadingProfile.value = true
    const profile = await authStore.getUserProfile()
    userProfile.value = profile

    // 登入後總是使用 API 返回的用戶資料覆蓋（包括 name 和 phone）
    // 這確保即使用戶通過 LINE 進入（已有 displayName），登入後也會更新為系統註冊的真實資料
    if (userProfile.value) {
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

  // 使用 cartStore.setPaymentType 設定付款類型
  // 'On-site' 或 'Online'
  cartStore.setPaymentType(newVal)
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
