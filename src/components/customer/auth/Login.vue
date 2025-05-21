<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2 class="text-center mb-4">會員登入</h2>
      </div>
      <div class="auth-body">
        <div v-if="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="email" class="form-label">電子郵件</label>
            <input type="email" class="form-control" id="email" v-model="credentials.email" placeholder="請輸入您的電子郵件"
              required>
          </div>
          <div class="mb-4">
            <label for="password" class="form-label">密碼</label>
            <div class="input-group">
              <input :type="showPassword ? 'text' : 'password'" class="form-control" id="password"
                v-model="credentials.password" placeholder="請輸入密碼" required>
              <button class="btn btn-outline-secondary" type="button" @click="togglePasswordVisibility">
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
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
          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary py-2" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
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
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/api';

// 路由相關
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 表單資料
const credentials = reactive({
  email: '',
  password: ''
});

// 狀態管理
const isLoading = ref(false);
const errorMessage = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);

// 從 URL 查詢參數中恢復上次使用的 email
onMounted(() => {
  if (route.query.email) {
    credentials.email = route.query.email;
  }

  // 設置當前品牌ID (如果有的話)
  const brandId = route.params.brandId || sessionStorage.getItem('currentBrandId');
  // console.log('Brand ID:', brandId);
  if (brandId) {
    authStore.setBrandId(brandId);
  } else {
    // 如果沒有品牌ID，則跳轉到首頁或錯誤頁面
    router.push('/');
  }

  // 清除舊的錯誤訊息
  errorMessage.value = '';
});

// 切換密碼可見性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 跳轉到註冊頁面
const goToRegister = () => {
  router.push('/auth/register');
};

// 處理登入
const handleLogin = async () => {
  try {
    errorMessage.value = '';
    isLoading.value = true;

    // 從 URL 或 sessionStorage 獲取品牌 ID
    const brandId = route.params.brandId || sessionStorage.getItem('currentBrandId');

    if (!brandId) {
      throw new Error('無法獲取品牌資訊');
    }

    // 設置品牌ID到store
    authStore.setBrandId(brandId);

    // 使用store登入
    await authStore.login(credentials);

    // 登入成功後的處理
    console.log('登入成功!');

    // 跳轉到首頁或上一頁
    const redirectPath = route.query.redirect || '/';
    router.push(redirectPath);

  } catch (error) {
    console.error('登入失敗:', error);

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '登入失敗，請檢查您的電子郵件和密碼';
    } else {
      errorMessage.value = '登入失敗，請稍後再試';
    }
  } finally {
    isLoading.value = false;
  }
};
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
