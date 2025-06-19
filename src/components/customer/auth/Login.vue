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
            <div class="navbar-title">會員登入</div>
            <div class="nav-placeholder"></div>
          </div>
        </nav>
        <div class="nav-border"></div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="auth-card">
        <form @submit.prevent="handleLogin" :class="{ 'was-validated': wasValidated }" novalidate>
          <div class="mb-3">
            <label for="phone" class="form-label">手機號碼</label>
            <input type="tel" class="form-control"
              :class="{ 'is-invalid': fieldErrors.phone, 'is-valid': isFieldValid('phone') }" id="phone"
              v-model="credentials.phone" placeholder="請輸入您的手機號碼" pattern="^09\d{8}$" required
              @blur="validateField('phone')" @input="clearFieldError('phone')">
            <div class="invalid-feedback">
              {{ fieldErrors.phone }}
            </div>
          </div>

          <div class="mb-4">
            <label for="password" class="form-label">密碼</label>
            <div class="input-group">
              <input :type="showPassword ? 'text' : 'password'" class="form-control"
                :class="{ 'is-invalid': fieldErrors.password, 'is-valid': isFieldValid('password') }" id="password"
                v-model="credentials.password" placeholder="請輸入密碼" minlength="6" required
                @blur="validateField('password')" @input="clearFieldError('password')">
              <button class="btn btn-outline-secondary" type="button" @click="togglePasswordVisibility">
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div class="invalid-feedback">
                {{ fieldErrors.password }}
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="rememberMe" v-model="rememberMe">
              <label class="form-check-label" for="rememberMe">
                記住我
              </label>
            </div>
            <router-link to="/auth/forgot-password" class="text-decoration-none">忘記密碼？</router-link>
          </div>
          <!-- 使用 BAlert 顯示錯誤訊息 -->
          <BAlert :show="formErrors.length > 0" variant="danger" class="mb-3 mb-0">
            <div v-for="error in formErrors" :key="error" class="mb-1 last:mb-0">
              {{ error }}
            </div>
          </BAlert>

          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary py-2" :disabled="authStore.loadingAuth">
              <span v-if="authStore.loadingAuth" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              登入
            </button>
            <button type="button" class="btn btn-outline-secondary py-2 mt-2" @click="goToRegister">
              還沒有帳號？立即註冊
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/customerAuth';
import { BAlert } from 'bootstrap-vue-next';

// 路由相關
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 表單資料
const credentials = reactive({
  phone: '',
  password: ''
});

// 狀態管理
const formErrors = ref([]);
const successMessage = ref('您已成功登入系統');
const showPassword = ref(false);
const rememberMe = ref(false);
const wasValidated = ref(false);
const fieldErrors = reactive({});
const touchedFields = reactive({});

// 驗證規則
const validationRules = {
  phone: {
    required: true,
    pattern: /^09\d{8}$/,
    message: '請輸入有效的手機號碼格式 (09xxxxxxxx)'
  },
  password: {
    required: true,
    minLength: 6,
    message: '密碼長度至少需要6個字元'
  }
};

// 驗證單一欄位
const validateField = (fieldName) => {
  touchedFields[fieldName] = true;
  const value = credentials[fieldName];
  const rules = validationRules[fieldName];

  if (!rules) return true;

  // 必填驗證
  if (rules.required && (!value || value.trim() === '')) {
    fieldErrors[fieldName] = `${getFieldDisplayName(fieldName)}為必填欄位`;
    return false;
  }

  // 最小長度驗證
  if (rules.minLength && value.length < rules.minLength) {
    fieldErrors[fieldName] = rules.message;
    return false;
  }

  // 正規表達式驗證
  if (rules.pattern && !rules.pattern.test(value)) {
    fieldErrors[fieldName] = rules.message;
    return false;
  }

  // 清除錯誤
  delete fieldErrors[fieldName];
  return true;
};

// 清除欄位錯誤
const clearFieldError = (fieldName) => {
  if (fieldErrors[fieldName]) {
    delete fieldErrors[fieldName];
  }
};

// 檢查欄位是否有效
const isFieldValid = (fieldName) => {
  return touchedFields[fieldName] && !fieldErrors[fieldName] && credentials[fieldName];
};

// 獲取欄位顯示名稱
const getFieldDisplayName = (fieldName) => {
  const displayNames = {
    phone: '手機號碼',
    password: '密碼'
  };
  return displayNames[fieldName] || fieldName;
};

// 驗證整個表單
const validateForm = () => {
  let isValid = true;

  // 驗證所有欄位
  Object.keys(validationRules).forEach(fieldName => {
    if (!validateField(fieldName)) {
      isValid = false;
    }
  });

  wasValidated.value = true;
  return isValid;
};

// 從 URL 查詢參數中恢復上次使用的手機號碼
onMounted(async () => {
  if (route.query.phone) {
    credentials.phone = route.query.phone;
  }

  // 初始化 authStore 的 brandId
  authStore.initializeBrandId();

  if (!authStore.currentBrandId) {
    // 如果沒有品牌ID，則跳轉到首頁或錯誤頁面
    router.push('/');
    return;
  }

  // 清除舊的錯誤訊息
  formErrors.value = [];

  // 如果是從註冊頁面跳轉過來，顯示成功訊息
  if (route.query.registered === 'true') {
    // 等待組件完全掛載
    await nextTick();
    // 設置成功訊息
    successMessage.value = '註冊成功，請使用您的手機號碼和密碼登入';
  }
});

// 返回上一頁
const goBack = () => {
  router.back();
};

// 切換密碼可見性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 跳轉到註冊頁面
const goToRegister = () => {
  router.push('/auth/register');
};

// 處理登入 - 使用統一的 authStore 方法
const handleLogin = async () => {
  try {
    // 清除之前的錯誤
    formErrors.value = [];

    // 驗證表單
    if (!validateForm()) {
      formErrors.value = ['請檢查並修正表單中的錯誤'];
      return;
    }

    // 確保有品牌ID
    if (!authStore.currentBrandId) {
      throw new Error('無法獲取品牌資訊');
    }

    // 使用統一的 authStore.login 方法
    await authStore.login(credentials);

    // 登入成功後的處理
    console.log('登入成功!');

    // 顯示成功訊息
    successMessage.value = '您已成功登入系統';

    const redirectPath = route.query.redirect || '/member';
    router.push(redirectPath);

  } catch (error) {
    console.error('登入失敗:', error);

    // 使用 authStore 的錯誤訊息，或者自定義錯誤處理
    if (authStore.error) {
      formErrors.value = [authStore.error];
    } else if (error.message) {
      formErrors.value = [error.message];
    } else {
      formErrors.value = ['登入失敗，請稍後再試'];
    }
  }
};
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

/* 自訂驗證樣式 */
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

/* 最後一個錯誤訊息不需要底部邊距 */
.last\:mb-0:last-child {
  margin-bottom: 0 !important;
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
