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
            <div class="navbar-title">完成註冊</div>
            <div class="nav-placeholder"></div>
          </div>
        </nav>
        <div class="nav-border"></div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="auth-card">
        <div class="mb-4 text-center">
          <h5 class="mb-2">設定您的帳號</h5>
          <p class="text-muted">請填寫以下資料以完成註冊</p>
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- 姓名 -->
          <div class="mb-3">
            <label for="name" class="form-label">姓名 <span class="text-danger">*</span></label>
            <input
              type="text"
              class="form-control"
              id="name"
              v-model="userData.name"
              :class="{ 'is-invalid': fieldErrors.name, 'is-valid': isFieldValid('name') }"
              placeholder="請輸入您的姓名"
              required
              @blur="validateField('name')"
              @input="clearFieldError('name')"
            />
            <div class="invalid-feedback">
              {{ fieldErrors.name }}
            </div>
          </div>

          <!-- 電子郵件 -->
          <div class="mb-3">
            <label for="email" class="form-label">電子郵件</label>
            <input
              type="email"
              class="form-control"
              id="email"
              v-model="userData.email"
              :class="{ 'is-invalid': fieldErrors.email, 'is-valid': isFieldValid('email') }"
              placeholder="請輸入您的電子郵件"
              @blur="validateField('email')"
              @input="clearFieldError('email')"
            />
            <small class="text-muted">選填，用於接收訂單通知</small>
            <div class="invalid-feedback">
              {{ fieldErrors.email }}
            </div>
          </div>

          <!-- 密碼 -->
          <div class="mb-3">
            <label for="password" class="form-label">密碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                id="password"
                v-model="userData.password"
                :class="{
                  'is-invalid': fieldErrors.password,
                  'is-valid': isFieldValid('password'),
                }"
                placeholder="請設置密碼"
                required
                @blur="validateField('password')"
                @input="clearFieldError('password')"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="togglePasswordVisibility"
              >
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div class="invalid-feedback">
                {{ fieldErrors.password }}
              </div>
            </div>
            <small class="form-text text-muted">密碼需6-32位，只能包含英文數字及!@#$%^&*</small>
          </div>

          <!-- 確認密碼 -->
          <div class="mb-4">
            <label for="confirmPassword" class="form-label"
              >確認密碼 <span class="text-danger">*</span></label
            >
            <div class="input-group">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                class="form-control"
                id="confirmPassword"
                v-model="confirmPassword"
                :class="{
                  'is-invalid': fieldErrors.confirmPassword,
                  'is-valid': isFieldValid('confirmPassword'),
                }"
                placeholder="請再次輸入密碼"
                required
                @blur="validateField('confirmPassword')"
                @input="clearFieldError('confirmPassword')"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="toggleConfirmPasswordVisibility"
              >
                <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div class="invalid-feedback">
                {{ fieldErrors.confirmPassword }}
              </div>
            </div>
          </div>

          <!-- 同意條款 -->
          <div class="mb-4 form-check">
            <input
              class="form-check-input"
              type="checkbox"
              id="agreeTerms"
              v-model="agreeTerms"
              :class="{ 'is-invalid': fieldErrors.agreeTerms }"
              @change="validateField('agreeTerms')"
              required
            />
            <label class="form-check-label" for="agreeTerms">
              我已閱讀並同意 <a href="#" @click.prevent="showTerms">用戶服務條款</a> 和
              <a href="#" @click.prevent="showPrivacyPolicy">隱私政策</a>
            </label>
            <div class="invalid-feedback">
              {{ fieldErrors.agreeTerms }}
            </div>
          </div>

          <BAlert :show="formErrors.length > 0" variant="danger" class="mb-3">
            <div v-for="error in formErrors" :key="error" class="mb-1 last:mb-0">
              {{ error }}
            </div>
          </BAlert>

          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary py-2" :disabled="isLoading">
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              完成註冊
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 註冊成功模態框 -->
  <BModal
    id="successModal"
    title="註冊成功"
    ok-title="立即登入"
    ok-variant="success"
    hide-header-close
    no-close-on-backdrop
    no-close-on-esc
    @ok="redirectToLogin"
    ref="successModal"
  >
    <div class="text-center mb-3">
      <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem"></i>
    </div>
    <h5 class="text-center mb-3">恭喜您完成註冊！</h5>
    <p class="text-center">您的帳號已成功建立，請立即登入開始使用我們的服務。</p>
    <div class="alert alert-success">
      <i class="bi bi-info-circle-fill me-2"></i>
      您的會員資料已成功儲存，您可以在登入後隨時查看或修改。
    </div>
  </BModal>

  <!-- 錯誤訊息模態框 -->
  <BModal
    id="errorModal"
    title="註冊失敗"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BModal, BAlert } from 'bootstrap-vue-next'
import api from '@/api'

const router = useRouter()

const successModal = ref(null)
const errorModal = ref(null)

const phone = ref('')
const verificationCode = ref('')
const userData = reactive({
  name: '',
  email: '',
  password: '',
})
const confirmPassword = ref('')
const agreeTerms = ref(false)

const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const fieldErrors = reactive({})
const touchedFields = reactive({})
const formErrors = ref([])
const errorModalMessage = ref('')

const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId')
})

const validationRules = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 25,
    message: '姓名長度必須1-25個字元',
  },
  email: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '請輸入有效的電子郵件格式',
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 32,
    pattern: /^[a-zA-Z0-9!@#$%^&*]+$/,
    message: '密碼必須6-32個字元，只能包含英文、數字和符號 !@#$%^&*',
  },
  confirmPassword: {
    required: true,
    match: 'password',
    message: '確認密碼與密碼不相符',
  },
  agreeTerms: {
    required: true,
    message: '請同意服務條款和隱私政策',
  },
}

const validateField = (fieldName) => {
  touchedFields[fieldName] = true
  const rule = validationRules[fieldName]
  if (!rule) return true

  let value
  if (fieldName === 'confirmPassword') {
    value = confirmPassword.value
  } else if (fieldName === 'agreeTerms') {
    value = agreeTerms.value
  } else {
    value = userData[fieldName]
  }

  if (rule.required) {
    if (fieldName === 'agreeTerms') {
      if (!value) {
        fieldErrors[fieldName] = rule.message
        return false
      }
    } else if (!value || value.trim() === '') {
      fieldErrors[fieldName] = rule.message
      return false
    }
  }

  if (!rule.required && (!value || value.trim() === '')) {
    delete fieldErrors[fieldName]
    return true
  }

  if (rule.minLength && value.length < rule.minLength) {
    fieldErrors[fieldName] = rule.message
    return false
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    fieldErrors[fieldName] = rule.message
    return false
  }

  if (rule.pattern && !rule.pattern.test(value)) {
    fieldErrors[fieldName] = rule.message
    return false
  }

  if (rule.match) {
    const matchValue = userData[rule.match]
    if (value !== matchValue) {
      fieldErrors[fieldName] = rule.message
      return false
    }
  }

  delete fieldErrors[fieldName]
  return true
}

const clearFieldError = (fieldName) => {
  delete fieldErrors[fieldName]
  formErrors.value = []
}

const isFieldValid = (fieldName) => {
  return touchedFields[fieldName] && !fieldErrors[fieldName] && userData[fieldName]
}

const validateForm = () => {
  let isValid = true
  const fieldsToValidate = ['name', 'email', 'password', 'confirmPassword', 'agreeTerms']

  fieldsToValidate.forEach((field) => {
    if (!validateField(field)) {
      isValid = false
    }
  })

  return isValid
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const showTerms = () => {
  // 實作顯示條款模態框
}

const showPrivacyPolicy = () => {
  // 實作顯示隱私政策模態框
}

const handleSubmit = async () => {
  try {
    formErrors.value = []

    if (!validateForm()) {
      formErrors.value = ['請檢查並修正表單中的錯誤']
      return
    }

    if (!brandId.value) {
      formErrors.value = ['無法獲取品牌資訊']
      return
    }

    if (!phone.value || !verificationCode.value) {
      formErrors.value = ['註冊資訊不完整，請重新開始註冊流程']
      return
    }

    isLoading.value = true

    const response = await api.userAuth.register({
      brandId: brandId.value,
      userData: {
        name: userData.name,
        email: userData.email || '',
        phone: phone.value.replace(/[\s\-\(\)]/g, ''),
        password: userData.password,
        brand: brandId.value,
      },
      code: verificationCode.value,
    })

    console.log('註冊成功:', response)

    sessionStorage.removeItem('registerPhone')
    sessionStorage.removeItem('registerVerificationCode')
    sessionStorage.removeItem('registerTimestamp')

    if (successModal.value) {
      successModal.value.show()
    } else {
      redirectToLogin()
    }
  } catch (error) {
    console.error('註冊失敗:', error)

    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      errorModalMessage.value = error.response.data.errors.join('\n')
    } else if (error.response?.data?.message) {
      errorModalMessage.value = error.response.data.message
    } else if (error.response?.status === 400) {
      const errorMsg = error.response.data.message
      if (errorMsg?.includes('驗證碼')) {
        errorModalMessage.value = '驗證碼錯誤或已過期，請重新開始註冊流程'
      } else if (errorMsg?.includes('手機號碼')) {
        errorModalMessage.value = '該手機號碼已被註冊，請使用其他號碼或前往登入'
      } else {
        errorModalMessage.value = errorMsg || '註冊失敗，請檢查您的資料'
      }
    } else if (error.response?.status === 429) {
      errorModalMessage.value = '操作過於頻繁，請稍後再試'
    } else {
      errorModalMessage.value = '註冊失敗，請檢查網路連線後再試'
    }

    if (errorModal.value) {
      errorModal.value.show()
    }
  } finally {
    isLoading.value = false
  }
}

const redirectToLogin = () => {
  router.push({
    path: '/auth/login',
    query: { phone: phone.value, registered: 'true' },
  })
}

const goBack = () => {
  router.push('/auth/register/verify')
}

const closeErrorModal = () => {}

onMounted(() => {
  const storedPhone = sessionStorage.getItem('registerPhone')
  const storedCode = sessionStorage.getItem('registerVerificationCode')

  if (!storedPhone || !storedCode) {
    router.push('/auth/register')
    return
  }

  phone.value = storedPhone
  verificationCode.value = storedCode
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

.form-check-input:checked {
  background-color: #d35400;
  border-color: #d35400;
}

.form-control.is-valid {
  border-color: #198754;
}

.form-control.is-invalid,
.form-check-input.is-invalid {
  border-color: #dc3545;
}

.input-group .form-control.is-invalid {
  border-right: 1px solid #dc3545;
}

.input-group .form-control.is-valid {
  border-right: 1px solid #198754;
}

.input-group .invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
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
