<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2 class="text-center mb-4">會員註冊</h2>
      </div>
      <div class="auth-body">
        <div v-if="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>
        <form @submit.prevent="handleNextStep">
          <div class="mb-3">
            <label for="name" class="form-label">姓名 <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="name" v-model="userData.name" placeholder="請輸入您的姓名" required>
          </div>
          <div class="mb-3">
            <label for="email" class="form-label">電子郵件</label>
            <input type="email" class="form-control" id="email" v-model="userData.email" placeholder="請輸入您的電子郵件">
            <small class="text-muted">選填，用於接收訂單通知</small>
          </div>
          <div class="mb-3">
            <label for="phone" class="form-label">手機號碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input type="tel" class="form-control" id="phone" v-model="userData.phone" placeholder="請輸入您的手機號碼"
                required>
              <button class="btn btn-outline-secondary" type="button" @click="sendVerificationCode"
                :disabled="isCodeSending || countdown > 0">
                <span v-if="isCodeSending" class="spinner-border spinner-border-sm me-1" role="status"
                  aria-hidden="true"></span>
                {{ countdown > 0 ? `重新發送(${countdown}s)` : '獲取驗證碼' }}
              </button>
            </div>
            <small class="form-text text-muted">驗證碼將發送到您的手機</small>
          </div>
          <div class="mb-3">
            <label for="verificationCode" class="form-label">驗證碼 <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="verificationCode" v-model="verificationCode"
              placeholder="請輸入收到的驗證碼" required>
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">密碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input :type="showPassword ? 'text' : 'password'" class="form-control" id="password"
                v-model="userData.password" placeholder="請設置密碼 (至少8位)" required minlength="8">
              <button class="btn btn-outline-secondary" type="button" @click="togglePasswordVisibility">
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
            <small class="form-text text-muted">密碼長度至少需要8個字元</small>
          </div>
          <div class="mb-4">
            <label for="confirmPassword" class="form-label">確認密碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input :type="showConfirmPassword ? 'text' : 'password'" class="form-control" id="confirmPassword"
                v-model="confirmPassword" placeholder="請再次輸入密碼" required>
              <button class="btn btn-outline-secondary" type="button" @click="toggleConfirmPasswordVisibility">
                <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>
          <div class="mb-4 form-check">
            <input class="form-check-input" type="checkbox" id="agreeTerms" v-model="agreeTerms" required>
            <label class="form-check-label" for="agreeTerms">
              我已閱讀並同意 <a href="#" @click.prevent="showTerms">用戶服務條款</a> 和 <a href="#"
                @click.prevent="showPrivacyPolicy">隱私政策</a>
            </label>
          </div>
          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary py-2" :disabled="isLoading || !isFormValid">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              註冊
            </button>
            <button type="button" class="btn btn-outline-secondary py-2 mt-2" @click="goToLogin">
              已有帳號？點此登入
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api';

// 路由相關
const router = useRouter();
const route = useRoute();

// 新增 brandId 計算屬性
const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId');
});

// 表單資料
const userData = reactive({
  name: '',
  email: '',
  phone: '',
  password: ''
});
const confirmPassword = ref('');
const verificationCode = ref('');
const agreeTerms = ref(false);

// 狀態管理
const isLoading = ref(false);
const isCodeSending = ref(false);
const errorMessage = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const countdown = ref(0);
let countdownTimer = null;

// 表單驗證
const isFormValid = computed(() => {
  return userData.name &&
    userData.phone &&
    userData.password &&
    confirmPassword.value &&
    userData.password === confirmPassword.value &&
    verificationCode.value &&
    agreeTerms.value;
});

// 切換密碼可見性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// 跳轉到登入頁面
const goToLogin = () => {
  router.push('/auth/login');
};

// 顯示服務條款
const showTerms = () => {
  alert('服務條款將在此顯示');
  // 實際應該打開一個模態窗口或跳轉到條款頁面
};

// 顯示隱私政策
const showPrivacyPolicy = () => {
  alert('隱私政策將在此顯示');
  // 實際應該打開一個模態窗口或跳轉到隱私政策頁面
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

// 發送驗證碼
const sendVerificationCode = async () => {
  // 驗證手機號碼
  if (!userData.phone || !/^\d{10,}$/.test(userData.phone)) {
    errorMessage.value = '請輸入有效的手機號碼';
    return;
  }

  try {
    errorMessage.value = '';
    isCodeSending.value = true;

    if (!brandId.value) {
      throw new Error('無法獲取品牌資訊');
    }

    // 調用發送驗證碼 API
    const response = await api.userAuth.sendVerificationCode({
      brandId: brandId.value,
      phone: userData.phone,
      purpose: 'register'
    });

    // 顯示成功訊息並開始倒計時
    alert('驗證碼已發送到您的手機，請注意查收');
    startCountdown(60); // 60秒倒計時

  } catch (error) {
    console.error('發送驗證碼失敗:', error);

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '發送驗證碼失敗，請稍後再試';
    } else {
      errorMessage.value = '發送驗證碼失敗，請稍後再試';
    }
  } finally {
    isCodeSending.value = false;
  }
};

// 處理註冊
const handleNextStep = async () => {
  // 表單驗證
  if (!isFormValid.value) {
    errorMessage.value = '請填寫所有必填欄位';
    return;
  }

  if (userData.password !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的密碼不一致';
    return;
  }

  try {
    errorMessage.value = '';
    isLoading.value = true;

    if (!brandId.value) {
      throw new Error('無法獲取品牌資訊');
    }

    // 首先驗證驗證碼
    // await api.userAuth.verifyCode({
    //   brandId: brandId.value,
    //   phone: userData.phone,
    //   code: verificationCode.value,
    //   purpose: 'register'
    // });

    // 然後註冊用戶
    const response = await api.userAuth.register({
      brandId: brandId.value,
      userData: {
        name: userData.name,
        email: userData.email || '', // 電子郵件現在可以為空
        phone: userData.phone,
        password: userData.password,
        brand: brandId.value
      },
      code: verificationCode.value
    });

    // 註冊成功後的處理
    console.log('註冊成功:', response);

    // 跳轉到登入頁面並傳遞手機號碼
    router.push({
      path: '/auth/login',
      query: { phone: userData.phone, registered: 'true' }
    });

  } catch (error) {
    console.error('註冊失敗:', error);

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '註冊失敗，請檢查您的資料';
    } else {
      errorMessage.value = '註冊失敗，請稍後再試';
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
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem 1rem;
  background-color: #f8f9fa;
}

.auth-card {
  width: 100%;
  max-width: 500px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.auth-header {
  padding: 1.5rem 1.5rem 0.5rem;
}

.auth-body {
  padding: 1.5rem;
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

@media (max-width: 576px) {
  .auth-card {
    border-radius: 0;
    box-shadow: none;
  }

  .auth-container {
    padding: 0;
  }
}
</style>
