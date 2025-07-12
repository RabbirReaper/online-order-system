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
        <form @submit.prevent="handleSubmit" :class="{ 'was-validated': wasValidated }" novalidate>

          <!-- 姓名 -->
          <div class="mb-3">
            <label for="name" class="form-label">姓名 <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="name" v-model="userData.name"
              :class="{ 'is-invalid': fieldErrors.name, 'is-valid': isFieldValid('name') }" placeholder="請輸入您的姓名"
              @blur="validateField('name')" @input="clearFieldError('name')" required>
            <div class="invalid-feedback">
              {{ fieldErrors.name }}
            </div>
          </div>

          <!-- 電子郵件 -->
          <div class="mb-3">
            <label for="email" class="form-label">電子郵件</label>
            <input type="email" class="form-control" id="email" v-model="userData.email"
              :class="{ 'is-invalid': fieldErrors.email, 'is-valid': isFieldValid('email') }" placeholder="請輸入您的電子郵件"
              @blur="validateField('email')" @input="clearFieldError('email')">
            <small class="text-muted">選填，用於接收訂單通知</small>
            <div class="invalid-feedback">
              {{ fieldErrors.email }}
            </div>
          </div>

          <!-- 手機號碼 -->
          <div class="mb-3">
            <label for="phone" class="form-label">手機號碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input type="tel" class="form-control" id="phone" v-model="userData.phone"
                :class="{ 'is-invalid': fieldErrors.phone, 'is-valid': isFieldValid('phone') }" placeholder="請輸入您的手機號碼"
                @blur="validateField('phone')" @input="clearFieldError('phone')" required>
              <button class="btn btn-outline-secondary" type="button" @click="sendVerificationCode"
                :disabled="isCodeSending || countdown > 0 || fieldErrors.phone">
                <span v-if="isCodeSending" class="spinner-border spinner-border-sm me-1" role="status"
                  aria-hidden="true"></span>
                {{ getVerificationButtonText() }}
              </button>
              <div class="invalid-feedback">
                {{ fieldErrors.phone }}
              </div>
            </div>
            <small class="form-text text-muted">驗證碼將發送到您的手機</small>
          </div>

          <!-- 驗證碼 -->
          <div class="mb-3">
            <label for="verificationCode" class="form-label">驗證碼 <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="verificationCode" v-model="verificationCode"
              :class="{ 'is-invalid': fieldErrors.verificationCode, 'is-valid': isFieldValid('verificationCode') }"
              placeholder="請輸入收到的驗證碼" @blur="validateField('verificationCode')"
              @input="clearFieldError('verificationCode')" required>
            <div class="invalid-feedback">
              {{ fieldErrors.verificationCode }}
            </div>
          </div>

          <!-- 密碼 -->
          <div class="mb-3">
            <label for="password" class="form-label">密碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input :type="showPassword ? 'text' : 'password'" class="form-control" id="password"
                v-model="userData.password"
                :class="{ 'is-invalid': fieldErrors.password, 'is-valid': isFieldValid('password') }"
                placeholder="請設置密碼 8-64位，只能包含英文數字及!@#$%^&*" @blur="validateField('password')"
                @input="clearFieldError('password')" required>
              <button class="btn btn-outline-secondary" type="button" @click="togglePasswordVisibility">
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div class="invalid-feedback">
                {{ fieldErrors.password }}
              </div>
            </div>
          </div>

          <!-- 確認密碼 -->
          <div class="mb-4">
            <label for="confirmPassword" class="form-label">確認密碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input :type="showConfirmPassword ? 'text' : 'password'" class="form-control" id="confirmPassword"
                v-model="confirmPassword"
                :class="{ 'is-invalid': fieldErrors.confirmPassword, 'is-valid': isFieldValid('confirmPassword') }"
                placeholder="請再次輸入密碼" @blur="validateField('confirmPassword')"
                @input="clearFieldError('confirmPassword')" required>
              <button class="btn btn-outline-secondary" type="button" @click="toggleConfirmPasswordVisibility">
                <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div class="invalid-feedback">
                {{ fieldErrors.confirmPassword }}
              </div>
            </div>
          </div>

          <!-- 同意條款 -->
          <div class="mb-4 form-check">
            <input class="form-check-input" type="checkbox" id="agreeTerms" v-model="agreeTerms"
              :class="{ 'is-invalid': fieldErrors.agreeTerms }" @change="validateField('agreeTerms')" required>
            <label class="form-check-label" for="agreeTerms">
              我已閱讀並同意 <a href="#" @click.prevent="showTerms">用戶服務條款</a> 和 <a href="#"
                @click.prevent="showPrivacyPolicy">隱私政策</a>
            </label>
            <div class="invalid-feedback">
              {{ fieldErrors.agreeTerms }}
            </div>
          </div>

          <!-- 表單整體錯誤訊息 -->
          <BAlert :show="formErrors.length > 0" variant="danger" class="mb-3">
            <div v-for="error in formErrors" :key="error" class="mb-1 last:mb-0">
              {{ error }}
            </div>
          </BAlert>

          <!-- 提交按鈕 -->
          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary py-2" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              註冊
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 原有的模態框保持不變 -->
  <!-- 驗證碼已發送模態框 -->
  <BModal id="verificationCodeModal" title="驗證碼已發送" ok-title="我知道了" ok-variant="success"
    cancel-variant="outline-secondary" no-close-on-backdrop @ok="closeVerificationModal" ref="verificationCodeModal">
    <div class="text-center mb-3">
      <i class="bi bi-envelope-check-fill text-success" style="font-size: 3rem;"></i>
    </div>
    <p class="text-center">驗證碼已發送到您的手機，請注意查收</p>
    <div class="alert alert-success">
      <i class="bi bi-info-circle-fill me-2"></i>
      系統已向您的手機發送驗證簡訊，請在5分鐘內完成驗證。
    </div>
  </BModal>

  <!-- 其他模態框省略，保持原有程式碼不變 -->
  <!-- ... -->

  <!-- 註冊成功模態框 -->
  <BModal id="successModal" title="註冊成功" ok-title="立即登入" ok-variant="success" hide-header-close no-close-on-backdrop
    no-close-on-esc @ok="redirectToLogin" ref="successModal">
    <div class="text-center mb-3">
      <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
    </div>
    <h5 class="text-center mb-3">恭喜您完成註冊！</h5>
    <p class="text-center">您的帳號已成功建立，請立即登入開始使用我們的服務。</p>
    <div class="alert alert-success">
      <i class="bi bi-info-circle-fill me-2"></i>
      您的會員資料已成功儲存，您可以在登入後隨時查看或修改。
    </div>
  </BModal>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { BModal, BAlert } from 'bootstrap-vue-next';
import api from '@/api';

// 路由相關
const router = useRouter();
const route = useRoute();

// 模態框參考
const successModal = ref(null);
const verificationCodeModal = ref(null);

// 新增 brandId 計算屬性
const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId');
});

// 表單資料 - 使用 reactive
const userData = reactive({
  name: '',
  email: '',
  phone: '',
  password: ''
});

const confirmPassword = ref('');
const verificationCode = ref('');
const agreeTerms = ref(false);

// 驗證狀態管理 - 符合用戶偏好架構
const fieldErrors = reactive({});      // 個別欄位錯誤
const formErrors = ref([]);           // 表單整體錯誤
const touchedFields = reactive({});    // 追蹤已觸摸欄位
const wasValidated = ref(false);      // Bootstrap 驗證狀態

// 其他狀態
const isLoading = ref(false);
const isCodeSending = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const countdown = ref(0);
let countdownTimer = null;

// 驗證規則 - 統一管理
const validationRules = {
  name: {
    required: true,
    minLength: 2,
    message: '姓名至少需要2個字元'
  },
  email: {
    required: false, // 電子郵件為選填
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '請輸入有效的電子郵件格式'
  },
  phone: {
    required: true,
    pattern: /^09\d{8}$/,
    message: '請輸入有效的手機號碼格式 (09xxxxxxxx)'
  },
  verificationCode: {
    required: true,
    minLength: 4,
    message: '請輸入驗證碼'
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 64,
    pattern: /^[a-zA-Z0-9!@#$%^&*]+$/,
    message: '密碼必須8-64個字元，只能包含英文、數字和符號 !@#$%^&*'
  },
  confirmPassword: {
    required: true,
    match: 'password',
    message: '確認密碼與密碼不相符'
  },
  agreeTerms: {
    required: true,
    message: '請同意服務條款和隱私政策'
  }
};

// 核心驗證函數
const validateField = (fieldName) => {
  touchedFields[fieldName] = true;
  const rule = validationRules[fieldName];
  if (!rule) return true;

  let value;
  if (fieldName === 'confirmPassword') {
    value = confirmPassword.value;
  } else if (fieldName === 'verificationCode') {
    value = verificationCode.value;
  } else if (fieldName === 'agreeTerms') {
    value = agreeTerms.value;
  } else {
    value = userData[fieldName];
  }

  // 必填驗證
  if (rule.required) {
    if (fieldName === 'agreeTerms') {
      if (!value) {
        fieldErrors[fieldName] = rule.message;
        return false;
      }
    } else if (!value || value.trim() === '') {
      fieldErrors[fieldName] = rule.message;
      return false;
    }
  }

  // 如果不是必填且為空，則跳過其他驗證
  if (!rule.required && (!value || value.trim() === '')) {
    delete fieldErrors[fieldName];
    return true;
  }

  // 最小長度驗證
  if (rule.minLength && value.length < rule.minLength) {
    fieldErrors[fieldName] = rule.message;
    return false;
  }

  // 最大長度驗證
  if (rule.maxLength && value.length > rule.maxLength) {
    fieldErrors[fieldName] = rule.message;
    return false;
  }

  // 正則表達式驗證
  if (rule.pattern && !rule.pattern.test(value)) {
    fieldErrors[fieldName] = rule.message;
    return false;
  }

  // 匹配驗證（用於確認密碼）
  if (rule.match) {
    const matchValue = userData[rule.match];
    if (value !== matchValue) {
      fieldErrors[fieldName] = rule.message;
      return false;
    }
  }

  delete fieldErrors[fieldName];
  return true;
};

const clearFieldError = (fieldName) => {
  delete fieldErrors[fieldName];
  formErrors.value = []; // 清除表單整體錯誤
};

const isFieldValid = (fieldName) => {
  return touchedFields[fieldName] && !fieldErrors[fieldName] && userData[fieldName];
};

const validateForm = () => {
  let isValid = true;
  const fieldsToValidate = ['name', 'email', 'phone', 'verificationCode', 'password', 'confirmPassword', 'agreeTerms'];

  fieldsToValidate.forEach(field => {
    if (!validateField(field)) {
      isValid = false;
    }
  });

  wasValidated.value = true;
  return isValid;
};

// 返回上一頁
const goBack = () => {
  router.back();
};

// 切換密碼可見性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// 註冊成功後跳轉到登入頁面
const redirectToLogin = () => {
  router.push({
    path: '/auth/login',
    query: { phone: userData.phone, registered: 'true' }
  });
};

// 顯示服務條款和隱私政策（保持原有邏輯）
const showTerms = () => {
  // 實作顯示條款模態框
};

const showPrivacyPolicy = () => {
  // 實作顯示隱私政策模態框
};

// 關閉驗證碼模態框
const closeVerificationModal = () => {
  // 可以在這裡添加模態框關閉後的邏輯
};

// 獲取驗證碼按鈕文字
const getVerificationButtonText = () => {
  if (isCodeSending.value) {
    return '發送中...';
  }
  if (countdown.value > 0) {
    return `重新發送(${countdown.value}s)`;
  }
  return '獲取驗證碼';
};

// 開始倒計時
const startCountdown = (seconds) => {
  countdown.value = seconds;
  clearInterval(countdownTimer);

  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1;
    } else {
      clearInterval(countdownTimer);
    }
  }, 1000);
};

// 發送驗證碼 - 優化錯誤處理
const sendVerificationCode = async () => {
  try {
    formErrors.value = []; // 清除之前的錯誤

    // 先驗證手機號碼
    if (!validateField('phone')) {
      return;
    }

    // 檢查是否在倒計時中
    if (countdown.value > 0) {
      formErrors.value = [`請等待 ${countdown.value} 秒後再重新發送驗證碼`];
      return;
    }

    // 檢查品牌ID
    if (!brandId.value) {
      formErrors.value = ['無法獲取品牌資訊，請重新整理頁面後再試'];
      return;
    }

    isCodeSending.value = true;

    // 調用發送驗證碼 API
    const response = await api.userAuth.sendVerificationCode({
      brandId: brandId.value,
      phone: userData.phone.replace(/[\s\-\(\)]/g, ''),
      purpose: 'register'
    });
    console.log('驗證碼發送成功:', response);
    // 顯示成功訊息並開始倒計時
    if (verificationCodeModal.value) {
      verificationCodeModal.value.show();
    }

    startCountdown(60); // 60秒倒計時

  } catch (error) {
    console.error('發送驗證碼失敗:', error);

    if (error.response?.status === 429) {
      formErrors.value = ['發送驗證碼過於頻繁，請稍後再試'];
    } else if (error.response?.status === 400) {
      formErrors.value = [error.response.data.message || '手機號碼格式不正確或已被註冊'];
    } else if (error.response?.data?.message) {
      formErrors.value = [error.response.data.message];
    } else {
      formErrors.value = ['發送驗證碼失敗，請檢查網路連線後再試'];
    }
  } finally {
    isCodeSending.value = false;
  }
};

// 處理表單提交 - 重構驗證邏輯
const handleSubmit = async () => {
  try {
    formErrors.value = []; // 清除之前的錯誤

    // 驗證整個表單
    if (!validateForm()) {
      formErrors.value = ['請檢查並修正表單中的錯誤'];
      return;
    }

    if (!brandId.value) {
      formErrors.value = ['無法獲取品牌資訊'];
      return;
    }

    isLoading.value = true;

    // 註冊用戶
    const response = await api.userAuth.register({
      brandId: brandId.value,
      userData: {
        name: userData.name,
        email: userData.email || '',
        phone: userData.phone.replace(/[\s\-\(\)]/g, ''),
        password: userData.password,
        brand: brandId.value
      },
      code: verificationCode.value
    });

    // 註冊成功後的處理
    console.log('註冊成功:', response);

    // 顯示註冊成功模態框
    if (successModal.value) {
      successModal.value.show();
    } else {
      redirectToLogin();
    }

  } catch (error) {
    console.error('註冊失敗:', error);

    // 根據用戶偏好的錯誤處理邏輯
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      formErrors.value = error.response.data.errors;
    } else if (error.response?.data?.message) {
      formErrors.value = [error.response.data.message];
    } else if (error.response?.status === 400) {
      const errorMsg = error.response.data.message;
      if (errorMsg?.includes('驗證碼')) {
        formErrors.value = ['驗證碼錯誤或已過期，請重新獲取驗證碼'];
      } else if (errorMsg?.includes('手機號碼')) {
        formErrors.value = ['該手機號碼已被註冊，請使用其他號碼或前往登入'];
      } else {
        formErrors.value = [errorMsg || '註冊失敗，請檢查您的資料'];
      }
    } else if (error.response?.status === 429) {
      formErrors.value = ['操作過於頻繁，請稍後再試'];
    } else {
      formErrors.value = ['註冊失敗，請檢查網路連線後再試'];
    }
  } finally {
    isLoading.value = false;
  }
};

// 組件卸載時清除定時器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* 導航欄樣式 */
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

/* 內容容器 */
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
  padding: 1.5rem;
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

/* 針對性的驗證樣式 */
.form-control.is-valid,
.form-check-input.is-valid {
  border-color: #198754;
}

.form-control.is-invalid,
.form-check-input.is-invalid {
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
  }
}
</style>
