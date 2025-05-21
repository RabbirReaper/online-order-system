<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2 class="text-center mb-4">忘記密碼</h2>
      </div>
      <div class="auth-body">
        <div v-if="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>

        <p class="text-muted mb-4">請輸入您註冊時使用的手機號碼，我們將發送驗證碼用於重設密碼。</p>

        <form @submit.prevent="handleSubmit">
          <div class="mb-4">
            <label for="phone" class="form-label">手機號碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input type="tel" class="form-control" id="phone" v-model="phone" placeholder="請輸入您的手機號碼" required>
              <button class="btn btn-outline-secondary" type="button" @click="sendVerificationCode"
                :disabled="isCodeSending || countdown > 0">
                <span v-if="isCodeSending" class="spinner-border spinner-border-sm me-1" role="status"
                  aria-hidden="true"></span>
                {{ countdown > 0 ? `重新發送(${countdown}s)` : '獲取驗證碼' }}
              </button>
            </div>
          </div>

          <div v-if="codeRequested" class="mb-4">
            <label for="verificationCode" class="form-label">驗證碼 <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="verificationCode" v-model="verificationCode"
              placeholder="請輸入收到的驗證碼" required>
          </div>

          <div v-if="codeVerified" class="mb-3">
            <label for="newPassword" class="form-label">新密碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input :type="showPassword ? 'text' : 'password'" class="form-control" id="newPassword"
                v-model="newPassword" placeholder="請設置新密碼 (至少8位)" required minlength="8">
              <button class="btn btn-outline-secondary" type="button" @click="togglePasswordVisibility">
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
            <small class="form-text text-muted">密碼長度至少需要8個字元</small>
          </div>

          <div v-if="codeVerified" class="mb-4">
            <label for="confirmPassword" class="form-label">確認新密碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input :type="showConfirmPassword ? 'text' : 'password'" class="form-control" id="confirmPassword"
                v-model="confirmPassword" placeholder="請再次輸入新密碼" required>
              <button class="btn btn-outline-secondary" type="button" @click="toggleConfirmPasswordVisibility">
                <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>

          <div class="d-grid gap-2">
            <button v-if="!codeRequested" type="submit" class="btn btn-primary py-2" :disabled="isLoading || !phone">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              下一步
            </button>

            <button v-else-if="!codeVerified" type="submit" class="btn btn-primary py-2"
              :disabled="isLoading || !verificationCode">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              驗證
            </button>

            <button v-else type="submit" class="btn btn-primary py-2" :disabled="isLoading || !isPasswordFormValid">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              重設密碼
            </button>

            <button type="button" class="btn btn-outline-secondary py-2 mt-2" @click="goToLogin">
              返回登入
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 成功訊息模態框 -->
  <BModal id="successModal" title="操作成功" ok-title="確認" ok-variant="success" cancel-variant="outline-secondary"
    no-close-on-backdrop @ok="onSuccessModalClose" ref="successModal">
    <div class="text-center mb-3">
      <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
    </div>
    <p class="text-center">{{ successMessage }}</p>
    <div class="alert alert-success">
      <i class="bi bi-info-circle-fill me-2"></i>
      您的操作已成功完成。
    </div>
  </BModal>

  <!-- 錯誤訊息模態框 -->
  <BModal id="errorModal" title="操作失敗" ok-title="確認" ok-variant="danger" cancel-variant="outline-secondary"
    no-close-on-backdrop @ok="closeErrorModal" ref="errorModal">
    <div class="text-center mb-3">
      <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3rem;"></i>
    </div>
    <p class="text-center">{{ errorMessage }}</p>
    <div class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      操作失敗，請稍後再試。
    </div>
  </BModal>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { BModal } from 'bootstrap-vue-next';
import api from '@/api';

// 路由相關
const router = useRouter();
const route = useRoute();

// 模態框參考
const successModal = ref(null);
const errorModal = ref(null);

// 表單資料
const phone = ref('');
const verificationCode = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

// 狀態管理
const isLoading = ref(false);
const isCodeSending = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const countdown = ref(0);
const codeRequested = ref(false);
const codeVerified = ref(false);
let countdownTimer = null;

// 模態框回調函數
const onSuccessModalClose = () => {
  // 如果是密碼重設成功，跳轉到登入頁面
  if (codeVerified.value) {
    router.push('/auth/login');
  }
};

const closeErrorModal = () => { };

// 表單驗證
const isPasswordFormValid = computed(() => {
  return newPassword.value &&
    confirmPassword.value &&
    newPassword.value === confirmPassword.value &&
    newPassword.value.length >= 8;
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
  if (!phone.value || !/^\d{10,}$/.test(phone.value)) {
    errorMessage.value = '請輸入有效的手機號碼';
    if (errorModal.value) {
      errorModal.value.show();
    }
    return;
  }

  try {
    errorMessage.value = '';
    successMessage.value = '';
    isCodeSending.value = true;

    // 從 URL 或其他地方獲取品牌 ID
    const brandId = route.params.brandId || localStorage.getItem('currentBrandId');

    if (!brandId) {
      throw new Error('無法獲取品牌資訊');
    }

    // 調用發送驗證碼 API
    await api.userAuth.forgotPassword({
      brandId,
      phone: phone.value
    });

    // 顯示成功訊息並開始倒計時
    successMessage.value = '驗證碼已發送到您的手機，請注意查收';
    if (successModal.value) {
      successModal.value.show();
    }

    startCountdown(60); // 60秒倒計時
    codeRequested.value = true;

  } catch (error) {
    console.error('發送驗證碼失敗:', error);

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '發送驗證碼失敗，請稍後再試';
    } else {
      errorMessage.value = '發送驗證碼失敗，請稍後再試';
    }

    if (errorModal.value) {
      errorModal.value.show();
    }
  } finally {
    isCodeSending.value = false;
  }
};

// 驗證驗證碼
const verifyCode = async () => {
  try {
    errorMessage.value = '';
    successMessage.value = '';
    isLoading.value = true;

    // 從 URL 或其他地方獲取品牌 ID
    const brandId = route.params.brandId || localStorage.getItem('currentBrandId');

    if (!brandId) {
      throw new Error('無法獲取品牌資訊');
    }

    // 調用驗證驗證碼 API
    await api.userAuth.verifyCode({
      brandId,
      phone: phone.value,
      code: verificationCode.value,
      purpose: 'reset_password'
    });

    // 驗證成功
    successMessage.value = '驗證成功，請設置新密碼';
    if (successModal.value) {
      successModal.value.show();
    }

    codeVerified.value = true;

  } catch (error) {
    console.error('驗證碼驗證失敗:', error);

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '驗證碼無效或已過期';
    } else {
      errorMessage.value = '驗證失敗，請稍後再試';
    }

    if (errorModal.value) {
      errorModal.value.show();
    }
  } finally {
    isLoading.value = false;
  }
};

// 重設密碼
const resetPassword = async () => {
  // 驗證密碼
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的密碼不一致';
    if (errorModal.value) {
      errorModal.value.show();
    }
    return;
  }

  if (newPassword.value.length < 8) {
    errorMessage.value = '密碼長度至少需要8個字元';
    if (errorModal.value) {
      errorModal.value.show();
    }
    return;
  }

  try {
    errorMessage.value = '';
    successMessage.value = '';
    isLoading.value = true;

    // 從 URL 或其他地方獲取品牌 ID
    const brandId = route.params.brandId || localStorage.getItem('currentBrandId');

    if (!brandId) {
      throw new Error('無法獲取品牌資訊');
    }

    // 調用重設密碼 API
    await api.userAuth.resetPassword({
      brandId,
      phone: phone.value,
      code: verificationCode.value,
      newPassword: newPassword.value
    });

    // 重設成功
    successMessage.value = '密碼已重設成功，請使用新密碼登入';
    if (successModal.value) {
      successModal.value.show();
    } else {
      // 如果模態框不可用，延遲後直接跳轉
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    }

  } catch (error) {
    console.error('重設密碼失敗:', error);

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '重設密碼失敗，請稍後再試';
    } else {
      errorMessage.value = '重設密碼失敗，請稍後再試';
    }

    if (errorModal.value) {
      errorModal.value.show();
    }
  } finally {
    isLoading.value = false;
  }
};

// 表單提交處理
const handleSubmit = async () => {
  // 根據當前步驟執行不同的操作
  if (!codeRequested.value) {
    // 第一步：請求驗證碼
    await sendVerificationCode();
  } else if (!codeVerified.value) {
    // 第二步：驗證驗證碼
    await verifyCode();
  } else {
    // 第三步：重設密碼
    await resetPassword();
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
  max-width: 450px;
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
