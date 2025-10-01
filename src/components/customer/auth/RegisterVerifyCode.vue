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
            <div class="navbar-title">驗證手機號碼</div>
            <div class="nav-placeholder"></div>
          </div>
        </nav>
        <div class="nav-border"></div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="auth-card">
        <div class="mb-4 text-center">
          <h5 class="mb-3">請輸入驗證碼</h5>
          <p class="text-muted">
            驗證碼已發送至<br />
            <strong>{{ maskedPhone }}</strong>
          </p>
        </div>

        <form @submit.prevent="handleSubmit">
          <VerificationCodeInput
            v-model="verificationCode"
            :length="6"
            :error="fieldErrors.verificationCode"
            :auto-focus="true"
            @completed="handleCodeCompleted"
          />

          <div class="text-center mb-4">
            <button
              type="button"
              class="btn btn-link text-decoration-none"
              @click="resendCode"
              :disabled="isCodeSending || countdown > 0"
            >
              <span
                v-if="isCodeSending"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              {{ countdown > 0 ? `重新發送(${countdown}s)` : '重新發送驗證碼' }}
            </button>
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
              :disabled="isLoading || verificationCode.length < 6"
            >
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              下一步
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 驗證成功模態框 -->
  <BModal
    id="successModal"
    title="驗證成功"
    ok-title="繼續"
    ok-variant="success"
    hide-header-close
    no-close-on-backdrop
    no-close-on-esc
    @ok="goToProfile"
    ref="successModal"
  >
    <div class="text-center mb-3">
      <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem"></i>
    </div>
    <p class="text-center">手機號碼驗證成功</p>
    <div class="alert alert-success">
      <i class="bi bi-info-circle-fill me-2"></i>
      請繼續完成註冊資料
    </div>
  </BModal>

  <!-- 重新發送成功模態框 -->
  <BModal
    id="resendSuccessModal"
    title="驗證碼已重新發送"
    ok-title="確認"
    ok-variant="success"
    @ok="closeResendModal"
    ref="resendSuccessModal"
  >
    <div class="text-center mb-3">
      <i class="bi bi-envelope-check-fill text-success" style="font-size: 3rem"></i>
    </div>
    <p class="text-center">新的驗證碼已發送到您的手機</p>
  </BModal>

  <!-- 錯誤訊息模態框 -->
  <BModal
    id="errorModal"
    title="驗證失敗"
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { BModal, BAlert } from 'bootstrap-vue-next'
import VerificationCodeInput from './VerificationCodeInput.vue'
import api from '@/api'

const router = useRouter()

const successModal = ref(null)
const resendSuccessModal = ref(null)
const errorModal = ref(null)

const phone = ref('')
const verificationCode = ref('')
const isLoading = ref(false)
const isCodeSending = ref(false)
const countdown = ref(0)
const fieldErrors = reactive({})
const formErrors = ref([])
const errorModalMessage = ref('')

let countdownTimer = null

const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId')
})

const maskedPhone = computed(() => {
  if (!phone.value) return ''
  return phone.value.replace(/(\d{4})\d{4}(\d{2})/, '$1****$2')
})

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

const handleCodeCompleted = (code) => {
  verificationCode.value = code
}

const handleSubmit = async () => {
  try {
    formErrors.value = []

    if (!verificationCode.value || verificationCode.value.length < 6) {
      formErrors.value = ['請輸入完整的驗證碼']
      return
    }

    if (!brandId.value) {
      formErrors.value = ['無法獲取品牌資訊']
      return
    }

    isLoading.value = true

    const response = await api.userAuth.verifyCode({
      brandId: brandId.value,
      phone: phone.value.replace(/[\s\-\(\)]/g, ''),
      code: verificationCode.value,
      purpose: 'register',
    })

    console.log('驗證碼驗證成功:', response)

    sessionStorage.setItem('registerVerificationCode', verificationCode.value)

    if (successModal.value) {
      successModal.value.show()
    } else {
      goToProfile()
    }
  } catch (error) {
    console.error('驗證碼驗證失敗:', error)

    if (error.response?.status === 400) {
      errorModalMessage.value = error.response.data.message || '驗證碼錯誤或已過期'
    } else if (error.response?.data?.message) {
      errorModalMessage.value = error.response.data.message
    } else {
      errorModalMessage.value = '驗證失敗，請稍後再試'
    }

    if (errorModal.value) {
      errorModal.value.show()
    }
  } finally {
    isLoading.value = false
  }
}

const resendCode = async () => {
  try {
    formErrors.value = []

    if (countdown.value > 0) {
      formErrors.value = [`請等待 ${countdown.value} 秒後再重新發送驗證碼`]
      return
    }

    if (!brandId.value) {
      formErrors.value = ['無法獲取品牌資訊']
      return
    }

    isCodeSending.value = true

    await api.userAuth.sendVerificationCode({
      brandId: brandId.value,
      phone: phone.value.replace(/[\s\-\(\)]/g, ''),
      purpose: 'register',
    })

    if (resendSuccessModal.value) {
      resendSuccessModal.value.show()
    }

    startCountdown(60)
  } catch (error) {
    console.error('重新發送驗證碼失敗:', error)

    if (error.response?.status === 429) {
      errorModalMessage.value = '發送驗證碼過於頻繁，請稍後再試'
    } else if (error.response?.data?.message) {
      errorModalMessage.value = error.response.data.message
    } else {
      errorModalMessage.value = '發送驗證碼失敗，請稍後再試'
    }

    if (errorModal.value) {
      errorModal.value.show()
    }
  } finally {
    isCodeSending.value = false
  }
}

const goToProfile = () => {
  router.push('/auth/register/profile')
}

const goBack = () => {
  router.push('/auth/register')
}

const closeResendModal = () => {}

const closeErrorModal = () => {
  verificationCode.value = ''
}

onMounted(() => {
  const storedPhone = sessionStorage.getItem('registerPhone')
  const timestamp = sessionStorage.getItem('registerTimestamp')

  if (!storedPhone) {
    router.push('/auth/register')
    return
  }

  const now = Date.now()
  const elapsed = timestamp ? (now - parseInt(timestamp)) / 1000 : Infinity

  if (elapsed > 300) {
    sessionStorage.removeItem('registerPhone')
    sessionStorage.removeItem('registerTimestamp')
    router.push('/auth/register')
    return
  }

  phone.value = storedPhone

  const remainingTime = Math.max(0, 60 - Math.floor(elapsed))
  if (remainingTime > 0) {
    startCountdown(remainingTime)
  }
})

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

.btn-link {
  color: #d35400;
}

.btn-link:hover {
  color: #e67e22;
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
