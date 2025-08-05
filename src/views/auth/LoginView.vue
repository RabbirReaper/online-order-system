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

                <div v-if="isSystemAdmin">
                  <p class="text-muted">系統管理員登入</p>
                </div>
                <div v-else>
                  <p class="text-muted">品牌管理員登入</p>
                </div>
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
                    <input
                      type="text"
                      class="form-control"
                      id="username"
                      v-model="formData.username"
                      placeholder="請輸入帳號"
                      required
                      :disabled="isLoading"
                    />
                  </div>
                </div>

                <!-- 密碼輸入 -->
                <div class="mb-4">
                  <label for="password" class="form-label">密碼</label>
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="bi bi-lock"></i>
                    </span>
                    <input
                      :type="showPassword ? 'text' : 'password'"
                      class="form-control"
                      id="password"
                      v-model="formData.password"
                      placeholder="請輸入密碼"
                      required
                      :disabled="isLoading"
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="togglePasswordVisibility"
                    >
                      <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                    </button>
                  </div>
                </div>

                <!-- 提交按鈕 -->
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="isLoading">
                    <span
                      v-if="isLoading"
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {{ isLoading ? '登入中...' : '登入' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api'

const router = useRouter()
const route = useRoute()

// 從路由參數中獲取 brandId 和登入類型
const brandId = computed(() => route.params.brandId)
const loginType = computed(() => route.meta?.loginType || 'system')
const isSystemAdmin = computed(() => loginType.value === 'system' || !brandId.value)

// 表單資料
const formData = reactive({
  username: '',
  password: '',
})

// 狀態
const isLoading = ref(false)
const loginError = ref('')
const showPassword = ref(false)

// 切換密碼可見性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// 處理登入
const handleLogin = async () => {
  // 重置錯誤訊息
  loginError.value = ''
  isLoading.value = true

  try {
    // 調用管理員認證 API，傳入品牌上下文
    const loginData = {
      name: formData.username,
      password: formData.password,
    }

    // 如果有 brandId，加入到登入資料中
    if (brandId.value) {
      loginData.brandId = brandId.value
    }

    const response = await api.adminAuth.login(loginData)

    // 檢查登入是否成功
    if (response.success) {
      // 簡化的重定向邏輯
      const redirectPath = getRedirectPath()
      const finalPath = route.query.redirect || redirectPath

      router.push(finalPath)
    } else {
      // 處理成功請求但業務邏輯失敗的情況
      loginError.value = response.message || '登入失敗，請稍後再試'
    }
  } catch (error) {
    console.error('登入失敗:', error)

    // 設置錯誤訊息
    if (error.response && error.response.data) {
      loginError.value = error.response.data.message || '登入失敗，請確認帳號和密碼是否正確'
    } else {
      loginError.value = '登入失敗，請檢查網路連線'
    }
  } finally {
    isLoading.value = false
  }
}

// 根據有沒有 brandId 決定重定向路徑
const getRedirectPath = () => {
  // 有 brandId → 品牌管理頁面
  if (brandId.value) {
    return `/admin/${brandId.value}`
  }

  // 沒有 brandId → 系統管理頁面
  return '/boss'
}
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(78, 115, 223, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  transform: none;
  box-shadow: none;
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
