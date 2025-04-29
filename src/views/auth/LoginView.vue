<template>
  <div class="login-page d-flex align-items-center min-vh-100">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card shadow">
            <div class="card-body p-4">
              <div class="text-center mb-4">
                <img src="@/assets/logo.svg" alt="Logo" width="60" height="60" class="mb-3" />
                <h2 class="font-weight-bold">管理系統登入</h2>
                <p class="text-muted">請輸入您的帳號和密碼</p>
              </div>

              <form @submit.prevent="handleLogin">
                <!-- 登入錯誤提示 -->
                <div class="alert alert-danger" v-if="loginError">
                  {{ loginError }}
                </div>

                <!-- 帳號輸入 -->
                <div class="mb-3">
                  <label for="username" class="form-label">帳號</label>
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="bi bi-person"></i>
                    </span>
                    <input type="text" class="form-control" id="username" v-model="formData.username"
                      placeholder="請輸入帳號" required :disabled="isLoading" />
                  </div>
                </div>

                <!-- 密碼輸入 -->
                <div class="mb-4">
                  <label for="password" class="form-label">密碼</label>
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="bi bi-lock"></i>
                    </span>
                    <input :type="showPassword ? 'text' : 'password'" class="form-control" id="password"
                      v-model="formData.password" placeholder="請輸入密碼" required :disabled="isLoading" />
                    <button class="btn btn-outline-secondary" type="button" @click="togglePasswordVisibility">
                      <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                    </button>
                  </div>
                </div>

                <!-- 記住我選項 -->
                <div class="mb-4 form-check">
                  <input type="checkbox" class="form-check-input" id="remember" v-model="formData.remember"
                    :disabled="isLoading" />
                  <label class="form-check-label" for="remember">記住我</label>
                </div>

                <!-- 提交按鈕 -->
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="isLoading">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
                      aria-hidden="true"></span>
                    {{ isLoading ? '登入中...' : '登入' }}
                  </button>
                </div>
              </form>

              <div class="mt-4 text-center">
                <p class="text-secondary mb-0">選擇角色登入 (測試用)</p>
                <div class="btn-group mt-2">
                  <button class="btn btn-sm btn-outline-secondary" @click="loginAsBoss">
                    系統管理員
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" @click="loginAsBrandAdmin">
                    品牌管理員
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" @click="loginAsStoreAdmin">
                    店鋪管理員
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api';

const router = useRouter();
const route = useRoute();

// 表單資料
const formData = reactive({
  username: '',
  password: '',
  remember: false
});

// 狀態
const isLoading = ref(false);
const loginError = ref('');
const showPassword = ref(false);

// 切換密碼可見性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 處理登入
const handleLogin = async () => {
  // 重置錯誤訊息
  loginError.value = '';
  isLoading.value = true;

  try {
    // 實際 API 呼叫 (此段程式碼僅供示範，實際環境中取消註解)
    /*
    const response = await api.auth.login({
      name: formData.username,
      password: formData.password
    });
    */

    // 模擬 API 呼叫
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模擬登入成功
    console.log('登入成功');

    // 根據記住我選項，可以儲存部分資訊到 localStorage
    if (formData.remember) {
      localStorage.setItem('rememberedUsername', formData.username);
    } else {
      localStorage.removeItem('rememberedUsername');
    }

    // 如果有重定向參數，則導航到該頁面，否則導航到預設頁面
    const redirectPath = route.query.redirect || '/admin';
    router.push(redirectPath);

  } catch (error) {
    console.error('登入失敗:', error);

    // 設置錯誤訊息
    if (error.response && error.response.data && error.response.data.message) {
      loginError.value = error.response.data.message;
    } else {
      loginError.value = '登入失敗，請確認帳號和密碼是否正確';
    }
  } finally {
    isLoading.value = false;
  }
};

// 測試用的快速登入功能
const loginAsBoss = () => {
  formData.username = 'boss';
  formData.password = 'password';
  router.push('/boss');
};

const loginAsBrandAdmin = () => {
  formData.username = 'brand_admin';
  formData.password = 'password';
  router.push('/admin');
};

const loginAsStoreAdmin = () => {
  formData.username = 'store_admin';
  formData.password = 'password';
  router.push('/admin');
};
</script>

<style scoped>
.login-page {
  background-color: #f8f9fa;
}

.card {
  border-radius: 10px;
  border: none;
}

.form-control:focus,
.btn:focus {
  box-shadow: none;
  border-color: #80bdff;
}

/* 漸變按鈕效果 */
.btn-primary {
  background-image: linear-gradient(to right, #4e73df, #224abe);
  border: none;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(78, 115, 223, 0.4);
}

/* Logo 動畫 */
img {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}
</style>
