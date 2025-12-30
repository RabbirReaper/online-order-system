<template>
  <div class="main-container">
    <!-- 頂部導航欄 -->
    <div class="nav-container">
      <div class="nav-wrapper">
        <nav class="navbar navbar-light">
          <div class="container-fluid px-3">
            <a class="navbar-brand" href="#" @click.prevent="goBack">
              <i class="bi bi-arrow-left me-2"></i>返回
            </a>
            <div class="navbar-title">會員註冊</div>
            <div class="nav-placeholder"></div>
          </div>
        </nav>
        <div class="nav-border"></div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="auth-card">
        <div class="mb-4 text-center">
          <h5 class="mb-2">歡迎註冊</h5>
          <p class="text-muted">請輸入您的手機號碼以開始註冊</p>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="mb-4">
            <label for="phone" class="form-label"
              >手機號碼 <span class="text-danger">*</span></label
            >
            <input
              type="tel"
              class="form-control"
              id="phone"
              v-model="phone"
              :class="{ 'is-invalid': fieldErrors.phone, 'is-valid': isFieldValid }"
              placeholder="請輸入您的手機號碼"
              pattern="^09\d{8}$"
              required
              @blur="validateField"
              @input="clearFieldError"
            />
            <div class="invalid-feedback">
              {{ fieldErrors.phone }}
            </div>
            <small class="form-text text-muted">格式：09xxxxxxxx</small>
          </div>

          <BAlert :show="formErrors.length > 0" variant="danger" class="mb-3">
            <div v-for="error in formErrors" :key="error" class="mb-1 last:mb-0">
              {{ error }}
            </div>
          </BAlert>

          <div class="d-grid gap-2">
            <button
              type="submit"
              class="btn btn-primary py-2"
              :disabled="isLoading || countdown > 0"
            >
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {{ countdown > 0 ? `請等待 ${countdown} 秒` : '發送驗證碼' }}
            </button>
            <button type="button" class="btn btn-outline-secondary py-2" @click="goToLogin">
              已有帳號？前往登入
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 驗證碼已發送模態框 -->
  <BModal
    id="successModal"
    title="驗證碼已發送"
    ok-title="下一步"
    ok-variant="success"
    hide-header-close
    no-close-on-backdrop
    no-close-on-esc
    @ok="goToVerifyCode"
    ref="successModal"
  >
    <div class="text-center mb-3">
      <i class="bi bi-envelope-check-fill text-success" style="font-size: 3rem"></i>
    </div>
    <p class="text-center">驗證碼已發送到您的手機</p>
    <div class="alert alert-success">
      <i class="bi bi-info-circle-fill me-2"></i>
      請在5分鐘內完成驗證
    </div>
  </BModal>

  <!-- 錯誤訊息模態框 -->
  <BModal
    id="errorModal"
    title="發送失敗"
    ok-title="確認"
    ok-variant="danger"
    @ok="closeErrorModal"
    ref="errorModal"
  >
    <div class="text-center mb-3">
      <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3rem"></i>
    </div>
    <div class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorModalMessage }}
    </div>
  </BModal>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { BModal, BAlert } from 'bootstrap-vue-next'
import api from '@/api'

const router = useRouter()

const successModal = ref(null)
const errorModal = ref(null)

const phone = ref('')
const isLoading = ref(false)
const countdown = ref(0)
const fieldErrors = reactive({})
const formErrors = ref([])
const errorModalMessage = ref('')
const touchedField = ref(false)

let countdownTimer = null

const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId')
})

const isFieldValid = computed(() => {
  return touchedField.value && !fieldErrors.phone && phone.value
})

const validateField = () => {
  touchedField.value = true
  const phonePattern = /^09\d{8}$/

  if (!phone.value || phone.value.trim() === '') {
    fieldErrors.phone = '手機號碼為必填欄位'
    return false
  }

  if (!phonePattern.test(phone.value)) {
    fieldErrors.phone = '請輸入有效的手機號碼格式 (09xxxxxxxx)'
    return false
  }

  delete fieldErrors.phone
  return true
}

const clearFieldError = () => {
  delete fieldErrors.phone
  formErrors.value = []
}

const startCountdown = (seconds) => {
  countdown.value = seconds
  clearInterval(countdownTimer)

  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1
    } else {
      clearInterval(countdownTimer)
    }
  }, 1000)
}

const handleSubmit = async () => {
  try {
    formErrors.value = []

    if (!validateField()) {
      formErrors.value = ['請輸入有效的手機號碼']
      return
    }

    if (countdown.value > 0) {
      formErrors.value = [`請等待 ${countdown.value} 秒後再重新發送驗證碼`]
      return
    }

    if (!brandId.value) {
      formErrors.value = ['無法獲取品牌資訊，請重新整理頁面後再試']
      return
    }

    isLoading.value = true

    const response = await api.userAuth.sendVerificationCode({
      brandId: brandId.value,
      phone: phone.value.replace(/[\s\-\(\)]/g, ''),
      purpose: 'register',
    })

    console.log('驗證碼發送成功:', response)

    sessionStorage.setItem('registerPhone', phone.value)
    sessionStorage.setItem('registerTimestamp', Date.now().toString())

    if (successModal.value) {
      successModal.value.show()
    }

    startCountdown(60)
  } catch (error) {
    console.error('發送驗證碼失敗:', error)

    if (error.response?.status === 429) {
      errorModalMessage.value = '發送驗證碼過於頻繁，請稍後再試'
    } else if (error.response?.status === 400) {
      errorModalMessage.value = error.response.data.message || '手機號碼格式不正確或已被註冊'
    } else if (error.response?.data?.message) {
      errorModalMessage.value = error.response.data.message
    } else {
      errorModalMessage.value = '發送驗證碼失敗，請檢查網路連線後再試'
    }

    if (errorModal.value) {
      errorModal.value.show()
    }
  } finally {
    isLoading.value = false
  }
}

const goToVerifyCode = () => {
  router.push('/auth/register/verify')
}

const goToLogin = () => {
  router.push('/auth/login')
}

const goBack = () => {
  const brandId = sessionStorage.getItem('currentBrandId')
  const storeId = sessionStorage.getItem('currentStoreId')

  if (brandId && storeId) {
    router.push({
      name: 'menu',
      params: { brandId, storeId }
    })
  } else {
    router.back()
  }
}

const closeErrorModal = () => {}

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.nav-container {
  position: fixed;
  top: 0;
  width: 100%;
  max-width: 736px;
  z-index: 1030;
  left: 50%;
  transform: translateX(-50%);
}

.nav-wrapper {
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar {
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 0;
  padding: 0.8rem 1rem;
}

.navbar-brand {
  color: #333;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.navbar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 700;
  font-size: 1.1rem;
  color: #333;
}

.nav-placeholder {
  width: 30px;
}

.nav-border {
  height: 3px;
  background: linear-gradient(to right, #d35400, #e67e22);
  width: 100%;
}

.content-wrapper {
  width: 100%;
  max-width: 736px;
  margin: 0 auto;
  padding: 80px 15px 30px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.auth-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem 1.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
}

.form-label {
  font-weight: 500;
  color: #333;
}

.btn-primary {
  background-color: #d35400;
  border-color: #d35400;
  font-weight: 500;
}

.btn-primary:hover,
.btn-primary:focus {
  background-color: #e67e22;
  border-color: #e67e22;
}

.form-control.is-valid {
  border-color: #198754;
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.last\:mb-0:last-child {
  margin-bottom: 0;
}

@media (max-width: 576px) {
  .content-wrapper {
    padding-top: 70px;
  }

  .auth-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 1.5rem;
  }
}
</style>
