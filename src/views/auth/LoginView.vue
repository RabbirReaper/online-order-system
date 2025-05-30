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
                <p class="text-secondary mb-0">快速登入 (測試用)</p>
                <div class="btn-group-vertical mt-2 w-100">
                  <button class="btn btn-sm btn-outline-secondary mb-1" @click="loginAs('admin', '12345678')">
                    系統主管理員
                  </button>
                  <button class="btn btn-sm btn-outline-secondary mb-1"
                    @click="loginAs('test_brand_admin', 'password123')">
                    品牌主管理員
                  </button>
                  <button class="btn btn-sm btn-outline-secondary mb-1"
                    @click="loginAs('test_store_admin', 'password123')">
                    店鋪主管理員
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" @click="loginAs('test_employee', 'password123')">
                    員工
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
    // 調用管理員認證 API
    const response = await api.adminAuth.login({
      name: formData.username,
      password: formData.password
    });

    // 檢查登入是否成功
    if (response.success) {
      console.log('登入成功:', response);

      // 根據角色和品牌/店鋪資訊決定重定向路徑
      const redirectPath = getRedirectPath(response.role, response.brand, response.store);
      const finalPath = route.query.redirect || redirectPath;

      router.push(finalPath);
    } else {
      // 處理成功請求但業務邏輯失敗的情況
      loginError.value = response.message || '登入失敗，請稍後再試';
    }
  } catch (error) {
    console.error('登入失敗:', error);

    // 設置錯誤訊息
    if (error.response && error.response.data) {
      loginError.value = error.response.data.message || '登入失敗，請確認帳號和密碼是否正確';
    } else {
      loginError.value = '登入失敗，請檢查網路連線';
    }
  } finally {
    isLoading.value = false;
  }
};

// 根據角色和品牌/店鋪資訊決定重定向路徑
const getRedirectPath = (role, brand, store) => {
  if (!role) return '/admin/login';

  // 系統級管理員導向 boss 頁面
  if (role === 'primary_system_admin' || role === 'system_admin') {
    return '/boss';
  }

  // 品牌級管理員導向品牌管理頁面
  if ((role === 'primary_brand_admin' || role === 'brand_admin') && brand?._id) {
    return `/admin/${brand._id}`;
  }

  // 店鋪級管理員和員工導向品牌管理頁面（具體店鋪權限由後端控制）
  if ((role === 'primary_store_admin' || role === 'store_admin' || role === 'employee') && brand?._id) {
    return `/admin/${brand._id}`;
  }

  // 默認返回登入頁面
  return '/admin/login';
};

// 快速登入功能
const loginAs = async (username, password) => {
  formData.username = username;
  formData.password = password;
  await handleLogin();
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

.btn-group-vertical .btn {
  font-size: 0.875rem;
}
</style>
