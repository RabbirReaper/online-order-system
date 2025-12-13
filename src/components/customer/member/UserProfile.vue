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
            <div class="navbar-title">會員資料</div>
            <div class="nav-placeholder"></div>
          </div>
        </nav>
        <div class="nav-border"></div>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
        <p class="mt-3">載入您的資料中，請稍候...</p>
      </div>

      <div v-else-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <div v-else class="profile-content">
        <!-- 個人資料部分 -->
        <div class="profile-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">個人資料</h5>
            <button class="btn btn-sm btn-outline-primary" @click="toggleEditProfile">
              <i class="bi bi-pencil me-1"></i>{{ isEditingProfile ? '取消編輯' : '編輯資料' }}
            </button>
          </div>
          <div class="card-body">
            <form v-if="isEditingProfile" @submit.prevent="updateProfile">
              <div class="mb-3">
                <label for="name" class="form-label">姓名</label>
                <input
                  type="text"
                  class="form-control"
                  id="name"
                  v-model="editForm.name"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="email" class="form-label">電子郵件</label>
                <input
                  type="email"
                  class="form-control"
                  id="email"
                  v-model="editForm.email"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="phone" class="form-label">手機號碼</label>
                <input
                  type="tel"
                  class="form-control"
                  id="phone"
                  v-model="editForm.phone"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="gender" class="form-label">性別</label>
                <select class="form-select" id="gender" v-model="editForm.gender">
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">其他</option>
                  <option value="prefer_not_to_say">不願透露</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="dateOfBirth" class="form-label">生日</label>
                <input
                  type="date"
                  class="form-control"
                  id="dateOfBirth"
                  v-model="editForm.dateOfBirth"
                />
              </div>
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary" :disabled="isUpdating">
                  <span
                    v-if="isUpdating"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  儲存變更
                </button>
                <button type="button" class="btn btn-outline-secondary" @click="cancelEdit">
                  取消
                </button>
              </div>
            </form>
            <div v-else class="profile-info">
              <div class="info-item">
                <div class="info-label">姓名</div>
                <div class="info-value">{{ profile.name || '未設定' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">電子郵件</div>
                <div class="info-value">{{ profile.email || '未設定' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">手機號碼</div>
                <div class="info-value">{{ profile.phone || '未設定' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">性別</div>
                <div class="info-value">{{ formatGender(profile.gender) }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">生日</div>
                <div class="info-value">{{ formatDate(profile.dateOfBirth) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 地址部分 -->
        <div class="profile-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">地址管理</h5>
            <button class="btn btn-sm btn-outline-primary" @click="showAddAddressForm">
              <i class="bi bi-plus-lg me-1"></i>新增地址
            </button>
          </div>
          <div class="card-body">
            <div v-if="profile.addresses && profile.addresses.length > 0">
              <div class="address-item" v-for="(address, index) in profile.addresses" :key="index">
                <div class="address-content">
                  <div class="d-flex align-items-center mb-1">
                    <h6 class="mb-0">{{ address.name }}</h6>
                    <span v-if="address.isDefault" class="badge bg-success ms-2">預設</span>
                  </div>
                  <p class="mb-1">{{ address.address }}</p>
                </div>
                <div class="address-actions">
                  <button
                    v-if="!address.isDefault"
                    class="btn btn-sm btn-outline-success me-2"
                    @click="setDefaultAddress(address._id)"
                    :disabled="isUpdatingAddress"
                  >
                    設為預設
                  </button>
                  <button
                    class="btn btn-sm btn-outline-secondary me-2"
                    @click="editAddress(address)"
                  >
                    編輯
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    @click="confirmDeleteAddress(address)"
                    :disabled="isUpdatingAddress"
                  >
                    <span
                      v-if="isUpdatingAddress && deletingAddressId === address._id"
                      class="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    刪除
                  </button>
                </div>
              </div>
            </div>
            <p v-else class="text-muted">您尚未新增任何地址。</p>

            <!-- 地址表單 -->
            <div v-if="isAddingAddress || isEditingAddress" class="address-form mt-4">
              <h6 class="mb-3">{{ isEditingAddress ? '編輯地址' : '新增地址' }}</h6>
              <form @submit.prevent="saveAddress">
                <div class="mb-3">
                  <label for="addressName" class="form-label">地址名稱</label>
                  <input
                    type="text"
                    class="form-control"
                    id="addressName"
                    v-model="addressForm.name"
                    placeholder="例如：家、公司"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="addressDetail" class="form-label">詳細地址</label>
                  <textarea
                    class="form-control"
                    id="addressDetail"
                    v-model="addressForm.address"
                    rows="3"
                    placeholder="請輸入完整地址"
                    required
                  ></textarea>
                </div>
                <div class="mb-3 form-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    id="isDefault"
                    v-model="addressForm.isDefault"
                  />
                  <label class="form-check-label" for="isDefault">設為預設地址</label>
                </div>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="isUpdatingAddress">
                    <span
                      v-if="isUpdatingAddress"
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    儲存
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="cancelAddressForm"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- 密碼管理部分 -->
        <div class="profile-card">
          <div class="card-header">
            <h5 class="mb-0">密碼管理</h5>
          </div>
          <div class="card-body">
            <button class="btn btn-outline-primary" @click="showChangePasswordForm">
              <i class="bi bi-key me-1"></i>修改密碼
            </button>

            <!-- 修改密碼表單 -->
            <div v-if="isChangingPassword" class="password-form mt-4">
              <h6 class="mb-3">修改密碼</h6>
              <form @submit.prevent="changePassword">
                <div class="mb-3">
                  <label for="currentPassword" class="form-label">當前密碼</label>
                  <div class="input-group">
                    <input
                      :type="showCurrentPassword ? 'text' : 'password'"
                      class="form-control"
                      id="currentPassword"
                      v-model="passwordForm.currentPassword"
                      required
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="showCurrentPassword = !showCurrentPassword"
                    >
                      <i :class="showCurrentPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="newPassword" class="form-label">新密碼</label>
                  <div class="input-group">
                    <input
                      :type="showNewPassword ? 'text' : 'password'"
                      class="form-control"
                      id="newPassword"
                      v-model="passwordForm.newPassword"
                      required
                      minlength="6"
                      maxlength="32"
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="showNewPassword = !showNewPassword"
                    >
                      <i :class="showNewPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                  <small class="form-text text-muted">密碼長度必須6-32個字元</small>
                </div>
                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">確認新密碼</label>
                  <div class="input-group">
                    <input
                      :type="showConfirmPassword ? 'text' : 'password'"
                      class="form-control"
                      id="confirmPassword"
                      v-model="passwordForm.confirmPassword"
                      required
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="isUpdatingPassword">
                    <span
                      v-if="isUpdatingPassword"
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    更新密碼
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="cancelChangePassword"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 通知模態框 -->
  <BModal
    id="successModal"
    title="操作成功"
    ok-title="確認"
    ok-variant="success"
    :hide-footer="false"
    ref="successModal"
  >
    <div class="text-center mb-3">
      <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem"></i>
    </div>
    <p class="text-center">{{ successMessage }}</p>
    <div class="alert alert-success">
      <i class="bi bi-info-circle-fill me-2"></i>
      您的操作已成功完成。
    </div>
  </BModal>

  <!-- 刪除地址確認模態框 -->
  <BModal
    id="deleteAddressModal"
    title="確認刪除地址"
    ok-title="確認刪除"
    ok-variant="danger"
    cancel-title="取消"
    @ok="proceedDeleteAddress"
    ref="deleteAddressModal"
  >
    <p v-if="addressToDelete">確定要刪除地址「{{ addressToDelete.name }}」嗎？</p>
    <div class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      此操作無法撤銷，地址將被永久刪除。
    </div>
    <div v-if="isUpdatingAddress" class="text-center">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">刪除中...</span>
      </div>
    </div>
  </BModal>

  <!-- 錯誤模態框 -->
  <BModal
    id="errorModal"
    title="操作失敗"
    ok-title="確認"
    ok-variant="danger"
    :hide-footer="false"
    ref="errorModal"
  >
    <div class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
    </div>
  </BModal>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api'
import { BModal } from 'bootstrap-vue-next'

// 路由相關
const router = useRouter()
const route = useRoute()

// 模態框參考
const successModal = ref(null)
const deleteAddressModal = ref(null)
const errorModal = ref(null)

// 返回上一頁 - 修改為返回會員中心
const goBack = () => {
  router.push('/member')
}

// 品牌ID計算屬性
const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId')
})

const storeId = computed(() => {
  return sessionStorage.getItem('currentStoreId')
})

// 狀態管理
const isLoading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const profile = ref({})

// 編輯個人資料相關
const isEditingProfile = ref(false)
const isUpdating = ref(false)
const editForm = reactive({
  name: '',
  email: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
})

// 地址管理相關
const isAddingAddress = ref(false)
const isEditingAddress = ref(false)
const isUpdatingAddress = ref(false)
const deletingAddressId = ref(null)
const currentEditAddressId = ref(null)
const addressForm = reactive({
  name: '',
  address: '',
  isDefault: false,
})

// 地址刪除
const addressToDelete = ref(null)

// 密碼管理相關
const isChangingPassword = ref(false)
const isUpdatingPassword = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 格式化性別顯示
const formatGender = (gender) => {
  const genderMap = {
    male: '男性',
    female: '女性',
    other: '其他',
    prefer_not_to_say: '不願透露',
  }

  return gender ? genderMap[gender] || gender : '未設定'
}

// 格式化日期顯示
const formatDate = (dateString) => {
  if (!dateString) return '未設定'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '無效日期'

  return date.toLocaleDateString('zh-TW')
}

// 載入用戶資料
const loadUserProfile = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const currentBrandId = brandId.value

    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊')
    }

    // 調用獲取用戶資料 API
    const response = await api.user.getUserProfile(currentBrandId)
    console.log('用戶資料:', response)
    profile.value = response.profile

    // 初始化編輯表單
    initEditForm()
  } catch (error) {
    console.error('載入用戶資料失敗:', error)

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '無法載入用戶資料'
    } else {
      errorMessage.value = '無法載入用戶資料，請稍後再試'
    }

    if (errorModal.value) {
      errorModal.value.show()
    }
  } finally {
    isLoading.value = false
  }
}

// 初始化編輯表單
const initEditForm = () => {
  editForm.name = profile.value.name || ''
  editForm.email = profile.value.email || ''
  editForm.phone = profile.value.phone || ''
  editForm.gender = profile.value.gender || ''

  if (profile.value.dateOfBirth) {
    // 將日期轉換為 YYYY-MM-DD 格式
    const date = new Date(profile.value.dateOfBirth)
    if (!isNaN(date.getTime())) {
      editForm.dateOfBirth = date.toISOString().substring(0, 10)
    } else {
      editForm.dateOfBirth = ''
    }
  } else {
    editForm.dateOfBirth = ''
  }
}

// 切換編輯個人資料
const toggleEditProfile = () => {
  if (!isEditingProfile.value) {
    initEditForm()
  }
  isEditingProfile.value = !isEditingProfile.value
}

// 取消編輯
const cancelEdit = () => {
  isEditingProfile.value = false
}

// 更新個人資料
const updateProfile = async () => {
  try {
    isUpdating.value = true
    errorMessage.value = ''

    const currentBrandId = brandId.value

    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊')
    }

    // 調用更新用戶資料 API
    const response = await api.user.updateUserProfile({
      brandId: currentBrandId,
      profileData: {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        gender: editForm.gender,
        dateOfBirth: editForm.dateOfBirth,
      },
    })

    profile.value = response
    isEditingProfile.value = false

    // 顯示成功訊息模態框
    successMessage.value = '個人資料已成功更新'
    if (successModal.value) {
      successModal.value.show()
    }

    loadUserProfile()
  } catch (error) {
    console.error('更新用戶資料失敗:', error)

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '更新個人資料失敗'
    } else {
      errorMessage.value = '更新個人資料失敗，請稍後再試'
    }

    if (errorModal.value) {
      errorModal.value.show()
    }
  } finally {
    isUpdating.value = false
  }
}

// 顯示新增地址表單
const showAddAddressForm = () => {
  addressForm.name = ''
  addressForm.address = ''
  addressForm.isDefault = !profile.value.addresses || profile.value.addresses.length === 0
  isAddingAddress.value = true
  isEditingAddress.value = false
  currentEditAddressId.value = null
}

// 編輯地址
const editAddress = (address) => {
  addressForm.name = address.name
  addressForm.address = address.address
  addressForm.isDefault = address.isDefault
  isEditingAddress.value = true
  isAddingAddress.value = false
  currentEditAddressId.value = address._id
}

// 取消地址表單
const cancelAddressForm = () => {
  isAddingAddress.value = false
  isEditingAddress.value = false
}

// 保存地址
const saveAddress = async () => {
  try {
    isUpdatingAddress.value = true
    errorMessage.value = ''

    const currentBrandId = brandId.value

    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊')
    }

    let response

    if (isEditingAddress.value) {
      // 調用更新地址 API
      response = await api.user.updateAddress({
        brandId: currentBrandId,
        addressId: currentEditAddressId.value,
        data: {
          name: addressForm.name,
          address: addressForm.address,
          isDefault: addressForm.isDefault,
        },
      })
    } else {
      // 調用新增地址 API
      response = await api.user.addAddress({
        brandId: currentBrandId,
        addressData: {
          name: addressForm.name,
          address: addressForm.address,
          isDefault: addressForm.isDefault,
        },
      })
    }

    profile.value = response
    isAddingAddress.value = false
    isEditingAddress.value = false

    // 顯示成功訊息模態框
    successMessage.value = isEditingAddress.value ? '地址已成功更新' : '地址已成功新增'
    if (successModal.value) {
      successModal.value.show()
    }
    loadUserProfile()
  } catch (error) {
    console.error('保存地址失敗:', error)

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '保存地址失敗'
    } else {
      errorMessage.value = '保存地址失敗，請稍後再試'
    }

    if (errorModal.value) {
      errorModal.value.show()
    }
  } finally {
    isUpdatingAddress.value = false
  }
}

// 設置默認地址
const setDefaultAddress = async (addressId) => {
  try {
    isUpdatingAddress.value = true
    errorMessage.value = ''

    const currentBrandId = brandId.value

    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊')
    }

    // 調用設置默認地址 API
    const response = await api.user.updateAddress({
      brandId: currentBrandId,
      addressId,
      data: {
        isDefault: true,
      },
    })

    profile.value = response

    // 顯示成功訊息
    successMessage.value = '已設為預設地址'
    if (successModal.value) {
      successModal.value.show()
    }

    loadUserProfile()
  } catch (error) {
    console.error('設置默認地址失敗:', error)

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '設置默認地址失敗'
    } else {
      errorMessage.value = '設置默認地址失敗，請稍後再試'
    }

    if (errorModal.value) {
      errorModal.value.show()
    }
  } finally {
    isUpdatingAddress.value = false
  }
}

// 確認刪除地址
const confirmDeleteAddress = (address) => {
  addressToDelete.value = address
  if (deleteAddressModal.value) {
    deleteAddressModal.value.show()
  }
}

// 執行地址刪除
const proceedDeleteAddress = async () => {
  if (!addressToDelete.value) return

  try {
    isUpdatingAddress.value = true
    deletingAddressId.value = addressToDelete.value._id
    errorMessage.value = ''

    const currentBrandId = brandId.value

    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊')
    }

    // 調用刪除地址 API
    const response = await api.user.deleteAddress({
      brandId: currentBrandId,
      addressId: addressToDelete.value._id,
    })

    profile.value = response

    // 顯示成功訊息模態框
    successMessage.value = '地址已成功刪除'
    if (successModal.value) {
      successModal.value.show()
    }
    loadUserProfile()
  } catch (error) {
    console.error('刪除地址失敗:', error)

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '刪除地址失敗'
    } else {
      errorMessage.value = '刪除地址失敗，請稍後再試'
    }

    if (errorModal.value) {
      errorModal.value.show()
    }
  } finally {
    isUpdatingAddress.value = false
    deletingAddressId.value = null
    addressToDelete.value = null
  }
}

// 顯示修改密碼表單
const showChangePasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  isChangingPassword.value = true
}

// 取消修改密碼
const cancelChangePassword = () => {
  isChangingPassword.value = false
}

// 修改密碼
const changePassword = async () => {
  // 驗證密碼
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    errorMessage.value = '兩次輸入的密碼不一致'
    if (errorModal.value) {
      errorModal.value.show()
    }
    return
  }

  if (passwordForm.newPassword.length < 6 || passwordForm.newPassword.length > 32) {
    errorMessage.value = '密碼長度必須6-32個字元'
    if (errorModal.value) {
      errorModal.value.show()
    }
    return
  }

  try {
    isUpdatingPassword.value = true
    errorMessage.value = ''

    const currentBrandId = brandId.value

    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊')
    }

    // 調用修改密碼 API
    await api.userAuth.changePassword({
      brandId: currentBrandId,
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })

    isChangingPassword.value = false

    // 顯示成功訊息模態框
    successMessage.value = '密碼已成功修改'
    if (successModal.value) {
      successModal.value.show()
    }
  } catch (error) {
    console.error('修改密碼失敗:', error)

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '修改密碼失敗'
    } else {
      errorMessage.value = '修改密碼失敗，請稍後再試'
    }

    if (errorModal.value) {
      errorModal.value.show()
    }
  } finally {
    isUpdatingPassword.value = false
  }
}

// 組件掛載後載入用戶資料
onMounted(() => {
  loadUserProfile()
})
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

.profile-content {
  margin-bottom: 2rem;
}

.profile-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.card-header {
  background-color: #f8f9fa;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.card-body {
  padding: 1.25rem;
}

.info-item {
  display: flex;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f1f1;
}

.info-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.info-label {
  width: 110px;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  flex: 1;
}

.btn-primary {
  background-color: #d35400;
  border-color: #d35400;
}

.btn-primary:hover,
.btn-primary:focus {
  background-color: #e67e22;
  border-color: #e67e22;
}

.address-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 1rem;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.address-content {
  flex: 1;
}

.address-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-left: 1rem;
}

.badge {
  padding: 0.35em 0.5em;
  font-size: 0.75em;
}

@media (max-width: 576px) {
  .content-wrapper {
    padding-top: 70px;
  }

  .address-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .address-actions {
    margin-top: 1rem;
    width: 100%;
    margin-left: 0;
  }
}
</style>
