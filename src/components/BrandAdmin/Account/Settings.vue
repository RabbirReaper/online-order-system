<template>
  <div class="row">
    <div class="col-lg-8">
      <!-- 基本資訊卡片 -->
      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0"><i class="bi bi-person-gear me-2"></i>基本資訊</h5>
        </div>
        <div class="card-body">
          <form @submit.prevent="updateProfile" novalidate>
            <!-- 用戶名 -->
            <div class="mb-3">
              <label for="username" class="form-label required">用戶名</label>
              <input
                type="text"
                class="form-control"
                id="username"
                v-model="profileData.name"
                :class="{ 'is-invalid': profileErrors.name }"
                required
              />
              <div class="invalid-feedback" v-if="profileErrors.name">{{ profileErrors.name }}</div>
              <div class="form-text">請輸入您的用戶名</div>
            </div>

            <!-- 電話號碼 -->
            <div class="mb-3">
              <label for="phone" class="form-label">電話號碼</label>
              <input
                type="tel"
                class="form-control"
                id="phone"
                v-model="profileData.phone"
                :class="{ 'is-invalid': profileErrors.phone }"
                placeholder="請輸入電話號碼"
              />
              <div class="invalid-feedback" v-if="profileErrors.phone">
                {{ profileErrors.phone }}
              </div>
              <div class="form-text">選填，方便聯繫使用</div>
            </div>

            <!-- 角色 -->
            <div class="mb-3">
              <label for="role" class="form-label">角色</label>
              <input
                type="text"
                class="form-control"
                id="role"
                :value="getRoleLabel(profileData.role)"
                readonly
              />
              <div class="form-text">角色無法修改</div>
            </div>

            <!-- 所屬品牌 -->
            <div class="mb-3" v-if="profileData.brand">
              <label for="brand" class="form-label">所屬品牌</label>
              <input
                type="text"
                class="form-control"
                id="brand"
                :value="profileData.brand.name"
                readonly
              />
              <div class="form-text">所屬品牌無法修改</div>
            </div>

            <!-- 所屬店鋪 -->
            <div class="mb-3" v-if="profileData.store">
              <label for="store" class="form-label">所屬店鋪</label>
              <input
                type="text"
                class="form-control"
                id="store"
                :value="profileData.store.name"
                readonly
              />
              <div class="form-text">所屬店鋪無法修改</div>
            </div>

            <!-- 最後登入時間 -->
            <div class="mb-3">
              <label for="lastLogin" class="form-label">最後登入時間</label>
              <input
                type="text"
                class="form-control"
                id="lastLogin"
                :value="profileData.lastLogin ? formatDate(profileData.lastLogin) : '無記錄'"
                readonly
              />
            </div>

            <!-- 帳號狀態 -->
            <div class="mb-3">
              <label class="form-label">帳號狀態</label>
              <div>
                <span
                  class="badge fs-6"
                  :class="profileData.isActive ? 'bg-success' : 'bg-secondary'"
                >
                  <i
                    class="bi me-1"
                    :class="profileData.isActive ? 'bi-check-circle-fill' : 'bi-pause-circle-fill'"
                  ></i>
                  {{ profileData.isActive ? '啟用中' : '已停用' }}
                </span>
              </div>
            </div>

            <!-- 創建時間 -->
            <div class="mb-3">
              <label for="createdAt" class="form-label">建立時間</label>
              <input
                type="text"
                class="form-control"
                id="createdAt"
                :value="profileData.createdAt ? formatDate(profileData.createdAt) : '無記錄'"
                readonly
              />
            </div>

            <!-- 創建者 -->
            <div class="mb-3" v-if="profileData.createdBy">
              <label for="createdBy" class="form-label">創建者</label>
              <input
                type="text"
                class="form-control"
                id="createdBy"
                :value="profileData.createdBy.name"
                readonly
              />
            </div>

            <!-- 表單錯誤訊息 -->
            <div class="alert alert-danger" v-if="profileFormErrors.length > 0">
              <p class="mb-1">
                <strong><i class="bi bi-exclamation-triangle-fill me-2"></i>發生錯誤：</strong>
              </p>
              <ul class="mb-0 ps-3">
                <li v-for="(error, index) in profileFormErrors" :key="index">{{ error }}</li>
              </ul>
            </div>

            <!-- 成功訊息 -->
            <div class="alert alert-success" v-if="profileSuccessMessage">
              <i class="bi bi-check-circle-fill me-2"></i>{{ profileSuccessMessage }}
            </div>

            <!-- 基本資料按鈕組 -->
            <div class="d-flex justify-content-between">
              <button
                type="button"
                class="btn btn-secondary"
                @click="resetProfileForm"
                :disabled="isProfileSubmitting"
              >
                <i class="bi bi-arrow-counterclockwise me-1"></i>重置
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isProfileSubmitting">
                <span
                  v-if="isProfileSubmitting"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                <i v-else class="bi bi-save me-1"></i>
                {{ isProfileSubmitting ? '更新中...' : '更新基本資料' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 修改密碼卡片 -->
      <div class="card">
        <div class="card-header bg-warning text-dark">
          <h5 class="mb-0"><i class="bi bi-shield-lock me-2"></i>修改密碼</h5>
        </div>
        <div class="card-body">
          <form @submit.prevent="changePassword" novalidate>
            <!-- 當前密碼 -->
            <div class="mb-3">
              <label for="currentPassword" class="form-label required">當前密碼</label>
              <div class="input-group">
                <input
                  :type="showCurrentPassword ? 'text' : 'password'"
                  class="form-control"
                  id="currentPassword"
                  v-model="passwordData.currentPassword"
                  :class="{ 'is-invalid': passwordErrors.currentPassword }"
                  required
                  @blur="validatePasswordField('currentPassword')"
                  @input="
                    touchedPasswordFields.currentPassword &&
                    validatePasswordField('currentPassword')
                  "
                />
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                  @click="toggleCurrentPasswordVisibility"
                >
                  <i class="bi" :class="showCurrentPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              <div class="invalid-feedback" v-if="passwordErrors.currentPassword">
                {{ passwordErrors.currentPassword }}
              </div>
            </div>

            <!-- 新密碼 -->
            <div class="mb-3">
              <label for="newPassword" class="form-label required">新密碼</label>
              <div class="input-group">
                <input
                  :type="showNewPassword ? 'text' : 'password'"
                  class="form-control"
                  id="newPassword"
                  v-model="passwordData.newPassword"
                  :class="{ 'is-invalid': passwordErrors.newPassword }"
                  required
                  @blur="validatePasswordField('newPassword')"
                  @input="touchedPasswordFields.newPassword && validatePasswordField('newPassword')"
                />
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                  @click="toggleNewPasswordVisibility"
                >
                  <i class="bi" :class="showNewPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              <div class="invalid-feedback" v-if="passwordErrors.newPassword">
                {{ passwordErrors.newPassword }}
              </div>
              <div class="form-text">密碼必須8-64個字元，只能包含英文、數字和符號(!@#$%^&*)</div>
            </div>

            <!-- 確認新密碼 -->
            <div class="mb-3">
              <label for="confirmPassword" class="form-label required">確認新密碼</label>
              <div class="input-group">
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="form-control"
                  id="confirmPassword"
                  v-model="passwordData.confirmPassword"
                  :class="{ 'is-invalid': passwordErrors.confirmPassword }"
                  required
                  @blur="validatePasswordField('confirmPassword')"
                  @input="
                    touchedPasswordFields.confirmPassword &&
                    validatePasswordField('confirmPassword')
                  "
                />
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                  @click="toggleConfirmPasswordVisibility"
                >
                  <i class="bi" :class="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              <div class="invalid-feedback" v-if="passwordErrors.confirmPassword">
                {{ passwordErrors.confirmPassword }}
              </div>
            </div>

            <!-- 密碼強度指示器 -->
            <div class="mb-3" v-if="passwordData.newPassword">
              <label class="form-label">密碼強度</label>
              <div class="progress" style="height: 8px">
                <div
                  class="progress-bar"
                  :class="passwordStrengthClass"
                  :style="{ width: passwordStrengthPercentage + '%' }"
                  role="progressbar"
                ></div>
              </div>
              <small class="form-text" :class="passwordStrengthTextClass">{{
                passwordStrengthText
              }}</small>
            </div>

            <!-- 表單錯誤訊息 -->
            <div class="alert alert-danger" v-if="passwordFormErrors.length > 0">
              <p class="mb-1">
                <strong
                  ><i class="bi bi-exclamation-triangle-fill me-2"></i>請修正以下錯誤：</strong
                >
              </p>
              <ul class="mb-0 ps-3">
                <li v-for="(error, index) in passwordFormErrors" :key="index">{{ error }}</li>
              </ul>
            </div>

            <!-- 成功訊息 -->
            <div class="alert alert-success" v-if="passwordSuccessMessage">
              <i class="bi bi-check-circle-fill me-2"></i>{{ passwordSuccessMessage }}
            </div>

            <!-- 按鈕組 -->
            <div class="d-flex justify-content-between">
              <button
                type="button"
                class="btn btn-secondary"
                @click="resetPasswordForm"
                :disabled="isPasswordSubmitting"
              >
                <i class="bi bi-arrow-counterclockwise me-1"></i>重置
              </button>
              <button type="submit" class="btn btn-warning" :disabled="isPasswordSubmitting">
                <span
                  v-if="isPasswordSubmitting"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                <i v-else class="bi bi-shield-check me-1"></i>
                {{ isPasswordSubmitting ? '修改中...' : '修改密碼' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 右側信息 -->
    <div class="col-lg-4">
      <!-- 權限範圍卡片 -->
      <div class="card mb-3" v-if="profileData.role">
        <div class="card-header bg-success text-white">
          <h6 class="mb-0"><i class="bi bi-shield-check me-2"></i>權限範圍</h6>
        </div>
        <div class="card-body">
          <div class="mb-2"><strong>管理層級：</strong>{{ getRoleScope(profileData.role) }}</div>
          <div class="mb-2" v-if="profileData.brand">
            <strong>管理品牌：</strong>{{ profileData.brand.name }}
          </div>
          <div class="mb-2" v-if="profileData.store">
            <strong>管理店鋪：</strong>{{ profileData.store.name }}
          </div>
          <hr />
          <div>
            <strong>角色說明：</strong>
            <p class="text-muted small mb-0">{{ getRoleDescription(profileData.role) }}</p>
          </div>
        </div>
      </div>

      <!-- 安全提示卡片 -->
      <div class="card">
        <div class="card-header bg-info text-white">
          <h6 class="mb-0"><i class="bi bi-shield-exclamation me-2"></i>安全提示</h6>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <h6>帳號安全建議</h6>
            <ul class="list-unstyled">
              <li class="mb-2">
                <i class="bi bi-check-circle text-success me-2"></i>
                定期更換密碼
              </li>
              <li class="mb-2">
                <i class="bi bi-check-circle text-success me-2"></i>
                使用強密碼組合
              </li>
              <li class="mb-2">
                <i class="bi bi-check-circle text-success me-2"></i>
                避免在公共場所登入
              </li>
              <li class="mb-2">
                <i class="bi bi-check-circle text-success me-2"></i>
                及時退出系統
              </li>
            </ul>
          </div>

          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>重要提醒：</strong>
            請妥善保管您的登入資訊，不要與他人分享您的帳號密碼。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'

// 路由
const route = useRoute()
const brandId = computed(() => route.params.brandId)

// 狀態管理
const profileData = reactive({
  name: '',
  phone: '',
  role: '',
  brand: null,
  store: null,
  lastLogin: null,
  createdAt: null,
  createdBy: null,
  isActive: true,
})

const passwordData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const profileErrors = reactive({})
const passwordErrors = reactive({})

const isProfileSubmitting = ref(false)
const isPasswordSubmitting = ref(false)

const profileSuccessMessage = ref('')
const passwordSuccessMessage = ref('')

const profileFormErrors = ref([])
const passwordFormErrors = ref([])

// 密碼可見性控制
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 密碼驗證規則
const passwordValidationRules = {
  currentPassword: {
    required: true,
    message: '請輸入當前密碼',
  },
  newPassword: {
    required: true,
    minLength: 8,
    maxLength: 64,
    pattern: /^[a-zA-Z0-9!@#$%^&*]+$/,
    message: '密碼必須8-64個字元，只能包含英文、數字和符號(!@#$%^&*)',
  },
  confirmPassword: {
    required: true,
    match: 'newPassword',
    message: '兩次輸入的密碼不一致',
  },
}

// 觸碰過的欄位記錄
const touchedPasswordFields = reactive({})

// 驗證單一密碼欄位
const validatePasswordField = (fieldName) => {
  touchedPasswordFields[fieldName] = true
  const rule = passwordValidationRules[fieldName]
  if (!rule) return true

  let value
  if (fieldName === 'confirmPassword') {
    value = passwordData.confirmPassword
  } else {
    value = passwordData[fieldName]
  }

  // 必填驗證
  if (rule.required) {
    if (!value || value.trim() === '') {
      passwordErrors[fieldName] = '此欄位為必填'
      return false
    }
  }

  // 如果不是必填且為空，則跳過其他驗證
  if (!rule.required && (!value || value.trim() === '')) {
    delete passwordErrors[fieldName]
    return true
  }

  // 最小長度驗證
  if (rule.minLength && value.length < rule.minLength) {
    passwordErrors[fieldName] = `密碼長度至少需要 ${rule.minLength} 個字元`
    return false
  }

  // 最大長度驗證
  if (rule.maxLength && value.length > rule.maxLength) {
    passwordErrors[fieldName] = `密碼長度不能超過 ${rule.maxLength} 個字元`
    return false
  }

  // 正則表達式驗證（密碼格式）
  if (rule.pattern && !rule.pattern.test(value)) {
    passwordErrors[fieldName] = rule.message
    return false
  }

  // 匹配驗證（用於確認密碼）
  if (rule.match) {
    const matchValue = passwordData[rule.match]
    if (value !== matchValue) {
      passwordErrors[fieldName] = rule.message
      return false
    }
  }

  // 檢查新舊密碼是否相同
  if (
    fieldName === 'newPassword' &&
    passwordData.currentPassword &&
    value === passwordData.currentPassword
  ) {
    passwordErrors[fieldName] = '新密碼不能與當前密碼相同'
    return false
  }

  delete passwordErrors[fieldName]
  return true
}

// 角色定義
const roleDefinitions = {
  primary_system_admin: {
    label: '系統主管理員',
    description: '擁有系統最高權限，可管理所有品牌和店鋪',
    scope: '系統級',
  },
  system_admin: {
    label: '系統管理員',
    description: '系統級管理權限，可管理品牌和店鋪（不包含管理員管理）',
    scope: '系統級',
  },
  primary_brand_admin: {
    label: '品牌主管理員',
    description: '品牌主管理員，可管理品牌下所有店鋪和管理員',
    scope: '品牌級',
  },
  brand_admin: {
    label: '品牌管理員',
    description: '品牌管理權限，可管理品牌設定和店鋪（不包含管理員管理）',
    scope: '品牌級',
  },
  primary_store_admin: {
    label: '店鋪主管理員',
    description: '店鋪主管理員，可管理店鋪所有功能和員工',
    scope: '店鋪級',
  },
  store_admin: {
    label: '店鋪管理員',
    description: '店鋪管理權限，可管理店鋪營運（不包含員工管理）',
    scope: '店鋪級',
  },
  employee: {
    label: '員工',
    description: '基礎員工權限，可使用點餐系統和基本庫存管理',
    scope: '店鋪級',
  },
}

// 角色相關方法
const getRoleLabel = (role) => {
  return roleDefinitions[role]?.label || role
}

const getRoleDescription = (role) => {
  return roleDefinitions[role]?.description || ''
}

const getRoleScope = (role) => {
  return roleDefinitions[role]?.scope || ''
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無記錄'

  const date = new Date(dateString)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 密碼強度計算
const passwordStrength = computed(() => {
  const password = passwordData.newPassword
  if (!password) return 0

  let strength = 0

  // 長度檢查
  if (password.length >= 8) strength += 30
  if (password.length >= 12) strength += 20
  if (password.length >= 16) strength += 20

  // 包含字母
  if (/[a-zA-Z]/.test(password)) strength += 15

  // 包含數字
  if (/\d/.test(password)) strength += 10

  // 包含符號
  if (/[!@#$%^&*]/.test(password)) strength += 5

  return Math.min(strength, 100)
})

const passwordStrengthPercentage = computed(() => passwordStrength.value)

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength < 30) return 'bg-danger'
  if (strength < 60) return 'bg-warning'
  if (strength < 80) return 'bg-info'
  return 'bg-success'
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength < 30) return '弱'
  if (strength < 60) return '普通'
  if (strength < 80) return '良好'
  return '強'
})

const passwordStrengthTextClass = computed(() => {
  const strength = passwordStrength.value
  if (strength < 30) return 'text-danger'
  if (strength < 60) return 'text-warning'
  if (strength < 80) return 'text-info'
  return 'text-success'
})

// 切換密碼可見性
const toggleCurrentPasswordVisibility = () => {
  showCurrentPassword.value = !showCurrentPassword.value
}

const toggleNewPasswordVisibility = () => {
  showNewPassword.value = !showNewPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

// 驗證密碼表單
const validatePasswordForm = () => {
  Object.keys(passwordErrors).forEach((key) => delete passwordErrors[key])
  passwordFormErrors.value = []

  let isValid = true

  // 驗證所有密碼相關欄位
  ;['currentPassword', 'newPassword', 'confirmPassword'].forEach((field) => {
    if (!validatePasswordField(field)) {
      isValid = false
    }
  })

  // 收集所有錯誤訊息
  Object.values(passwordErrors).forEach((error) => {
    if (error && !passwordFormErrors.value.includes(error)) {
      passwordFormErrors.value.push(error)
    }
  })

  return isValid
}

// 重置密碼表單
const resetPasswordForm = () => {
  passwordData.currentPassword = ''
  passwordData.newPassword = ''
  passwordData.confirmPassword = ''

  Object.keys(passwordErrors).forEach((key) => delete passwordErrors[key])
  Object.keys(touchedPasswordFields).forEach((key) => delete touchedPasswordFields[key])
  passwordFormErrors.value = []
  passwordSuccessMessage.value = ''

  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}

// 獲取用戶資料
const fetchUserProfile = async () => {
  try {
    const response = await api.adminAuth.getProfile()
    if (response && response.admin) {
      const admin = response.admin
      profileData.name = admin.name
      profileData.phone = admin.phone || ''
      profileData.role = admin.role
      profileData.brand = admin.brand
      profileData.store = admin.store
      profileData.lastLogin = admin.lastLogin
      profileData.createdAt = admin.createdAt
      profileData.createdBy = admin.createdBy
      profileData.isActive = admin.isActive
    }
  } catch (error) {
    console.error('獲取用戶資料失敗:', error)
    profileFormErrors.value = ['無法獲取用戶資料，請重新整理頁面']
  }
}

// 驗證基本資料表單
const validateProfileForm = () => {
  Object.keys(profileErrors).forEach((key) => delete profileErrors[key])
  profileFormErrors.value = []
  let isValid = true

  // 驗證用戶名
  if (!profileData.name.trim()) {
    profileErrors.name = '用戶名為必填項'
    profileFormErrors.value.push('用戶名為必填項')
    isValid = false
  } else if (profileData.name.trim().length < 2) {
    profileErrors.name = '用戶名至少需要2個字元'
    profileFormErrors.value.push('用戶名至少需要2個字元')
    isValid = false
  }

  // 驗證電話號碼（選填，但如果有填寫則需要驗證格式）
  if (profileData.phone && !/^[\d\-\+\(\)\s]+$/.test(profileData.phone)) {
    profileErrors.phone = '請輸入有效的電話號碼'
    profileFormErrors.value.push('請輸入有效的電話號碼')
    isValid = false
  }

  return isValid
}

// 重置基本資料表單
const resetProfileForm = () => {
  // 重新獲取原始資料
  fetchUserProfile()

  // 清除錯誤
  Object.keys(profileErrors).forEach((key) => delete profileErrors[key])
  profileFormErrors.value = []
  profileSuccessMessage.value = ''
}

// 更新基本資料
const updateProfile = async () => {
  profileSuccessMessage.value = ''

  if (!validateProfileForm()) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  isProfileSubmitting.value = true

  try {
    // 假設有更新基本資料的 API
    await api.adminAuth.updateProfile({
      name: profileData.name.trim(),
      phone: profileData.phone.trim(),
    })

    profileSuccessMessage.value = '基本資料更新成功！'

    // 滾動到成功訊息
    setTimeout(() => {
      document.querySelector('.alert-success')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  } catch (error) {
    console.error('更新基本資料失敗:', error)

    if (error.response && error.response.data) {
      const { message, errors: apiErrors } = error.response.data

      if (apiErrors) {
        // 處理特定欄位錯誤
        Object.keys(apiErrors).forEach((key) => {
          profileErrors[key] = apiErrors[key]
          profileFormErrors.value.push(apiErrors[key])
        })
      } else if (message) {
        profileFormErrors.value = [message]
      }
    } else {
      profileFormErrors.value = ['更新基本資料失敗，請檢查網路連線']
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isProfileSubmitting.value = false
  }
}

// 修改密碼
const changePassword = async () => {
  passwordSuccessMessage.value = ''

  if (!validatePasswordForm()) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  isPasswordSubmitting.value = true

  try {
    await api.adminAuth.changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    })

    passwordSuccessMessage.value = '密碼修改成功！'
    resetPasswordForm()

    // 滾動到成功訊息
    setTimeout(() => {
      document.querySelector('.alert-success')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  } catch (error) {
    console.error('修改密碼失敗:', error)

    if (error.response && error.response.data) {
      const { message } = error.response.data
      passwordFormErrors.value = [message || '修改密碼失敗，請稍後再試']
    } else {
      passwordFormErrors.value = ['修改密碼失敗，請檢查網路連線']
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isPasswordSubmitting.value = false
  }
}

// 生命週期鉤子
onMounted(() => {
  fetchUserProfile()
})
</script>

<style scoped>
.required::after {
  content: ' *';
  color: #dc3545;
}

.form-control:focus,
.form-select:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.progress {
  border-radius: 4px;
}

.badge.fs-6 {
  font-size: 0.9rem !important;
}

.list-unstyled li {
  font-size: 0.9rem;
}
</style>
