<template>
  <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            <i class="bi bi-gear me-2"></i>系統設定
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <div class="modal-body">
          <!-- 載入中狀態 -->
          <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">載入中...</span>
            </div>
            <p class="mt-3 text-muted">載入中...</p>
          </div>

          <!-- 錯誤訊息 -->
          <div v-else-if="error" class="alert alert-danger">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {{ error }}
          </div>

          <!-- 登入資訊 -->
          <div v-else>
            <!-- 登入狀態 -->
            <div class="mb-4">
              <label class="form-label fw-bold">登入狀態</label>
              <div>
                <span class="badge bg-success fs-6">
                  <i class="bi bi-check-circle-fill me-1"></i>
                  已登入
                </span>
              </div>
            </div>

            <!-- 登入者資訊 -->
            <div class="mb-4">
              <label class="form-label fw-bold">登入者</label>
              <div class="d-flex align-items-center">
                <i class="bi bi-person-circle fs-3 text-primary me-3"></i>
                <div>
                  <div class="fw-bold">{{ profileData.name }}</div>
                  <small class="text-muted">{{ getRoleLabel(profileData.role) }}</small>
                </div>
              </div>
            </div>

            <!-- 所屬品牌 -->
            <div class="mb-4" v-if="profileData.brand">
              <label class="form-label fw-bold">所屬品牌</label>
              <div class="text-muted">
                <i class="bi bi-shop me-2"></i>{{ profileData.brand.name }}
              </div>
            </div>

            <!-- 所屬店鋪 -->
            <div class="mb-4" v-if="profileData.store">
              <label class="form-label fw-bold">所屬店鋪</label>
              <div class="text-muted">
                <i class="bi bi-building me-2"></i>{{ profileData.store.name }}
              </div>
            </div>

            <!-- 最後登入時間 -->
            <div class="mb-4">
              <label class="form-label fw-bold">最後登入時間</label>
              <div class="text-muted">
                <i class="bi bi-clock me-2"></i>{{ formatDateTime(profileData.lastLogin) }}
              </div>
            </div>

            <!-- 登出確認訊息 -->
            <div v-if="showLogoutConfirm" class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              確定要登出嗎？登出後將返回登入頁面。
            </div>

            <!-- 登出錯誤訊息 -->
            <div v-if="logoutError" class="alert alert-danger">
              <i class="bi bi-exclamation-circle me-2"></i>
              {{ logoutError }}
            </div>
          </div>
        </div>

        <div class="modal-footer" v-if="!isLoading && !error">
          <!-- 登出確認按鈕組 -->
          <template v-if="showLogoutConfirm">
            <button
              type="button"
              class="btn btn-secondary"
              @click="cancelLogout"
              :disabled="isLoggingOut"
            >
              取消
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="confirmLogout"
              :disabled="isLoggingOut"
            >
              <span
                v-if="isLoggingOut"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              <i v-else class="bi bi-box-arrow-right me-1"></i>
              {{ isLoggingOut ? '登出中...' : '確認登出' }}
            </button>
          </template>

          <!-- 一般按鈕組 -->
          <template v-else>
            <button type="button" class="btn btn-secondary" @click="$emit('close')">
              關閉
            </button>
            <button type="button" class="btn btn-danger" @click="handleLogout">
              <i class="bi bi-box-arrow-right me-1"></i>
              登出
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api'

const router = useRouter()
const route = useRoute()

const emit = defineEmits(['close'])

// 狀態管理
const isLoading = ref(true)
const error = ref('')
const isLoggingOut = ref(false)
const showLogoutConfirm = ref(false)
const logoutError = ref('')

const profileData = reactive({
  name: '',
  role: '',
  brand: null,
  store: null,
  lastLogin: null,
})

// 角色對應
const roleLabels = {
  primary_system_admin: '系統主管理員',
  system_admin: '系統管理員',
  primary_brand_admin: '品牌主管理員',
  brand_admin: '品牌管理員',
  primary_store_admin: '店鋪主管理員',
  store_admin: '店鋪管理員',
  employee: '員工',
}

const getRoleLabel = (role) => {
  return roleLabels[role] || role
}

// 格式化日期時間
const formatDateTime = (dateString) => {
  if (!dateString) return '無記錄'

  const date = new Date(dateString)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 載入用戶資料
const loadProfile = async () => {
  try {
    isLoading.value = true
    error.value = ''

    const response = await api.adminAuth.getProfile()

    if (response && response.admin) {
      const admin = response.admin
      profileData.name = admin.name
      profileData.role = admin.role
      profileData.brand = admin.brand
      profileData.store = admin.store
      profileData.lastLogin = admin.lastLogin
    }
  } catch (err) {
    console.error('載入用戶資料失敗:', err)
    error.value = '無法載入用戶資料，請重試'
  } finally {
    isLoading.value = false
  }
}

// 處理登出
const handleLogout = () => {
  showLogoutConfirm.value = true
  logoutError.value = ''
}

// 取消登出
const cancelLogout = () => {
  showLogoutConfirm.value = false
  logoutError.value = ''
}

// 確認登出
const confirmLogout = async () => {
  try {
    isLoggingOut.value = true
    logoutError.value = ''

    await api.adminAuth.logout()

    // 儲存當前路徑
    const currentPath = route.fullPath

    // 根據當前路徑判斷登入頁路徑
    const brandIdMatch = currentPath.match(/\/counter\/([^/]+)/)
    const brandId = brandIdMatch ? brandIdMatch[1] : null

    // 導向登入頁面，並帶上重定向參數
    if (brandId) {
      router.push({
        path: `/admin/${brandId}/login`,
        query: { redirect: currentPath },
      })
    } else {
      router.push({
        path: '/admin/login',
        query: { redirect: currentPath },
      })
    }

    // 關閉 modal
    emit('close')
  } catch (err) {
    console.error('登出失敗:', err)
    logoutError.value = err.response?.data?.message || '登出失敗，請重試'
  } finally {
    isLoggingOut.value = false
  }
}

// 初始化
onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.modal {
  display: block;
}

.modal-dialog {
  max-width: 500px;
}

.form-label {
  color: #495057;
  margin-bottom: 0.5rem;
}

.badge.fs-6 {
  font-size: 1rem !important;
  padding: 0.5rem 1rem;
}

.text-muted {
  font-size: 0.95rem;
}

.alert {
  border-radius: 8px;
}

.btn {
  min-width: 80px;
}
</style>
