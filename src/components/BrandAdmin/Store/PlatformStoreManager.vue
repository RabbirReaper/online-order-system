<template>
  <BModal
    v-model="show"
    :title="modalTitle"
    size="lg"
    centered
    :no-close-on-backdrop="isSaving || !!successMessage"
    :no-close-on-esc="isSaving || !!successMessage"
    @hidden="onModalHidden"
  >
    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
    </div>

    <!-- 成功提示 -->
    <BAlert :show="!!successMessage" variant="success">
      <i class="bi bi-check-circle-fill me-2"></i>{{ successMessage }}
    </BAlert>

    <!-- 錯誤提示 -->
    <div class="alert alert-danger" v-if="error">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <!-- 配置表單 -->
    <form @submit.prevent="saveConfig" v-if="!isLoading">
      <div class="row g-3">
        <!-- 平台選擇（禁用，僅顯示） -->
        <div class="col-md-6">
          <label for="platform" class="form-label required">外送平台</label>
          <BFormSelect
            id="platform"
            v-model="configForm.platform"
            :options="platformOptions"
            disabled
            required
          />
        </div>

        <!-- 平台品牌ID (僅 foodpanda) -->
        <div class="col-md-6" v-if="configForm.platform === 'foodpanda'">
          <label for="platformBrandId" class="form-label">平台品牌ID (Chain ID)</label>
          <BFormInput
            id="platformBrandId"
            v-model="configForm.platformBrandId"
            placeholder="請輸入 Foodpanda Chain ID"
          />
          <small class="form-text text-muted">選填：Foodpanda 的 chain_id</small>
        </div>

        <!-- Uber Eats OAuth 授權區塊 -->
        <div class="col-12" v-if="configForm.platform === 'ubereats'">
          <div class="card border-primary">
            <div class="card-header bg-primary bg-opacity-10">
              <h6 class="mb-0">
                <i class="bi bi-shield-lock me-2"></i>Uber Eats 授權
              </h6>
            </div>
            <div class="card-body">
              <!-- 未授權狀態 -->
              <div v-if="!oauthStatus.isAuthorized">
                <BAlert variant="info" :show="true" class="mb-3">
                  <div class="mb-2">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    <strong>授權前請注意：</strong>
                  </div>
                  <ul class="mb-0 small">
                    <li>請使用 <strong>Uber Eats 商家帳號</strong>登入（不是顧客帳號）</li>
                    <li>該帳號必須有此店舖的<strong>管理權限</strong></li>
                    <li>授權後系統將自動連接您的店舖</li>
                  </ul>
                </BAlert>
                <BButton
                  @click="connectUberEats"
                  variant="primary"
                  :disabled="oauthLoading || isLoading"
                >
                  <span
                    v-if="oauthLoading"
                    class="spinner-border spinner-border-sm me-1"
                  ></span>
                  <i v-else class="bi bi-link-45deg me-1"></i>
                  {{ oauthLoading ? '授權中...' : '連接 Uber Eats' }}
                </BButton>
              </div>

              <!-- 已授權狀態 -->
              <div v-else>
                <BAlert variant="success" :show="true" class="mb-3">
                  <i class="bi bi-check-circle-fill me-2"></i>
                  已授權並自動連接店舖
                  <small class="ms-2 text-muted">
                    {{ new Date(oauthStatus.authorizedAt).toLocaleString('zh-TW') }}
                  </small>
                </BAlert>

                <!-- 顯示已連接的店舖資訊 -->
                <div v-if="oauthStatus.discoveredStores.length > 0">
                  <BAlert variant="info" :show="true">
                    <i class="bi bi-shop me-2"></i>
                    已連接店舖：<strong>{{ oauthStatus.discoveredStores[0]?.name || '未知' }}</strong>
                  </BAlert>
                </div>

                <!-- 沒有店舖 -->
                <div v-else>
                  <BAlert variant="warning" :show="true">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    未找到任何店舖，請確認您的 Uber Eats 帳號有管理權限
                  </BAlert>
                </div>

                <!-- Token 過期警告 -->
                <BAlert variant="warning" :show="oauthStatus.hasExpired" class="mb-2 mt-2">
                  <i class="bi bi-clock-history me-2"></i>
                  授權已過期，請重新授權
                </BAlert>

                <!-- 解除連接按鈕 -->
                <div class="mt-3">
                  <BButton
                    @click="disconnectUberEats"
                    variant="outline-danger"
                    size="sm"
                    :disabled="oauthLoading || isLoading"
                  >
                    <i class="bi bi-x-circle me-1"></i>
                    解除連接
                  </BButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 平台店鋪ID (foodpanda 使用) -->
        <div class="col-md-6" v-if="configForm.platform === 'foodpanda'">
          <label for="platformStoreId" class="form-label required">平台店鋪ID</label>
          <BFormInput
            id="platformStoreId"
            v-model="configForm.platformStoreId"
            placeholder="請輸入平台提供的店鋪ID"
            required
          />
        </div>

        <!-- 準備時間 -->
        <!-- <div class="col-md-6">
          <label for="prepTime" class="form-label">準備時間（分鐘）</label>
          <BFormInput
            type="number"
            id="prepTime"
            v-model.number="configForm.prepTime"
            min="0"
            placeholder="30"
          />
        </div> -->

        <!-- 忙碌時準備時間 -->
        <!-- <div class="col-md-6">
          <label for="busyPrepTime" class="form-label">忙碌時準備時間（分鐘）</label>
          <BFormInput
            type="number"
            id="busyPrepTime"
            v-model.number="configForm.busyPrepTime"
            min="0"
            placeholder="45"
          />
        </div> -->

        <!-- 營運狀態 -->
        <!-- <div class="col-md-6">
          <label for="status" class="form-label">初始營運狀態</label>
          <BFormSelect id="status" v-model="configForm.status" :options="statusOptions" />
        </div> -->

        <!-- 自動接單 -->
        <div class="col-md-6 d-flex align-items-end">
          <BFormCheckbox v-model="configForm.autoAccept" switch>
            自動接單 {{ configForm.autoAccept ? '✓' : '✗' }}
          </BFormCheckbox>
        </div>

        <!-- 平台整合啟用狀態 -->
        <div class="col-md-6 d-flex align-items-end">
          <BFormCheckbox v-model="configForm.isActive" switch>
            啟用平台整合 {{ configForm.isActive ? '✓' : '✗' }}
          </BFormCheckbox>
        </div>
      </div>
    </form>

    <template #footer>
      <BButton variant="secondary" @click="closeModal" :disabled="isSaving || !!successMessage"
        >取消</BButton
      >
      <BButton
        variant="primary"
        @click="saveConfig"
        :disabled="isSaving || isLoading || !!successMessage || (editingConfig && !hasFormChanged)"
      >
        <span
          v-if="isSaving"
          class="spinner-border spinner-border-sm me-1"
          role="status"
          aria-hidden="true"
        ></span>
        {{
          isSaving
            ? '處理中...'
            : successMessage
              ? '成功！'
              : editingConfig
                ? hasFormChanged
                  ? '更新配置'
                  : '無變更'
                : '新增配置'
        }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { BModal, BButton, BFormSelect, BFormInput, BFormCheckbox, BAlert } from 'bootstrap-vue-next'
import api from '@/api'
import { useUberEatsOAuth } from '@/composables/useUberEatsOAuth'

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  brandId: {
    type: String,
    required: true,
  },
  storeId: {
    type: String,
    required: true,
  },
  store: {
    type: Object,
    default: null,
  },
  platform: {
    type: String,
    required: true,
  },
})

// Emits
const emit = defineEmits(['update:show', 'updated'])

// Uber Eats OAuth Composable
const {
  isLoading: oauthLoading,
  error: oauthError,
  oauthStatus,
  initiateOAuth,
  checkOAuthStatus,
  revokeOAuth,
} = useUberEatsOAuth()

// Computed
const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const modalTitle = computed(() => {
  const platformName = getPlatformDisplayName(props.platform)
  return `${props.store?.name || ''} - ${platformName} 配置`
})

// 檢查表單是否有變更
const hasFormChanged = computed(() => {
  if (!editingConfig.value || !initialFormState.value) {
    // 新增模式或尚未載入初始狀態，允許保存
    return true
  }

  // 比較每個欄位
  return (
    configForm.platform !== initialFormState.value.platform ||
    configForm.platformBrandId !== initialFormState.value.platformBrandId ||
    configForm.platformStoreId !== initialFormState.value.platformStoreId ||
    configForm.prepTime !== initialFormState.value.prepTime ||
    configForm.busyPrepTime !== initialFormState.value.busyPrepTime ||
    configForm.status !== initialFormState.value.status ||
    configForm.autoAccept !== initialFormState.value.autoAccept ||
    configForm.isActive !== initialFormState.value.isActive
  )
})

// 狀態
const isLoading = ref(false)
const error = ref('')
const successMessage = ref('')
const isSaving = ref(false)
const editingConfig = ref(null)
const initialFormState = ref(null) // 用於追蹤表單初始狀態

// 表單數據
const configForm = reactive({
  platform: '',
  platformBrandId: '',
  platformStoreId: '',
  prepTime: 30,
  busyPrepTime: 45,
  status: 'OFFLINE',
  autoAccept: true,
  isActive: false,
})

// 選項配置
const platformOptions = [
  { value: 'foodpanda', text: 'foodpanda' },
  { value: 'ubereats', text: 'Uber Eats' },
]

const statusOptions = [
  { value: 'OFFLINE', text: '離線' },
  { value: 'ONLINE', text: '上線' },
  { value: 'BUSY', text: '忙碌' },
]

// 取得平台顯示名稱
const getPlatformDisplayName = (platform) => {
  const platformMap = {
    foodpanda: 'foodpanda',
    ubereats: 'Uber Eats',
  }
  return platformMap[platform] || platform
}

// 載入平台配置
const loadPlatformConfig = async () => {
  if (!props.brandId || !props.storeId || !props.platform) return

  isLoading.value = true
  error.value = ''

  try {
    const response = await api.platformStore.getAllPlatformStores({
      brandId: props.brandId,
      storeId: props.storeId,
    })

    const existingConfig = response.platformStores?.find(
      (config) => config.platform === props.platform,
    )

    if (existingConfig) {
      // 編輯模式
      editingConfig.value = existingConfig
      Object.assign(configForm, {
        platform: existingConfig.platform,
        platformBrandId: existingConfig.platformBrandId || '',
        platformStoreId: existingConfig.platformStoreId,
        prepTime: existingConfig.prepTime,
        busyPrepTime: existingConfig.busyPrepTime,
        status: existingConfig.status,
        autoAccept: existingConfig.autoAccept,
        isActive: existingConfig.isActive !== undefined ? existingConfig.isActive : false,
      })

      // 保存初始狀態用於變更偵測
      initialFormState.value = {
        platform: existingConfig.platform,
        platformBrandId: existingConfig.platformBrandId || '',
        platformStoreId: existingConfig.platformStoreId,
        prepTime: existingConfig.prepTime,
        busyPrepTime: existingConfig.busyPrepTime,
        status: existingConfig.status,
        autoAccept: existingConfig.autoAccept,
        isActive: existingConfig.isActive !== undefined ? existingConfig.isActive : false,
      }
    } else {
      // 新增模式
      editingConfig.value = null
      initialFormState.value = null
      resetForm()
      configForm.platform = props.platform
    }

    // 如果是 Uber Eats 平台，載入 OAuth 狀態
    if (props.platform === 'ubereats') {
      await loadOAuthStatus()
    }
  } catch (err) {
    console.error('獲取平台配置失敗:', err)
    error.value = '獲取平台配置時發生錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 載入 OAuth 狀態
const loadOAuthStatus = async () => {
  try {
    await checkOAuthStatus(props.brandId, props.storeId)
  } catch (err) {
    console.error('載入 OAuth 狀態失敗:', err)
  }
}

// 連接 Uber Eats（發起 OAuth）
const connectUberEats = async () => {
  try {
    error.value = ''
    await initiateOAuth(props.brandId, props.storeId)

    // 授權成功後重新載入配置和 OAuth 狀態
    successMessage.value = 'Uber Eats 授權成功！'
    await loadPlatformConfig()

    // 清除成功訊息
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('OAuth 授權失敗:', err)
    error.value = oauthError.value || '授權失敗，請稍後再試'
  }
}

// 解除 Uber Eats 連接
const disconnectUberEats = async () => {
  if (!confirm('確定要解除與 Uber Eats 的連接嗎？這將清除所有授權資料。')) {
    return
  }

  try {
    error.value = ''
    await revokeOAuth(props.brandId, props.storeId)

    successMessage.value = '已成功解除 Uber Eats 連接'

    // 清空 platformStoreId
    configForm.platformStoreId = ''

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('解除連接失敗:', err)
    error.value = oauthError.value || '解除連接失敗，請稍後再試'
  }
}

// 保存配置
const saveConfig = async () => {
  // 基本驗證
  if (!configForm.platform) {
    error.value = '請選擇平台'
    return
  }

  // Uber Eats 需要先完成 OAuth 授權（授權後會自動記錄店舖 ID）
  if (configForm.platform === 'ubereats' && !oauthStatus.isAuthorized) {
    error.value = '請先完成 Uber Eats 授權'
    return
  }

  // foodpanda 需要手動輸入店舖 ID
  if (configForm.platform === 'foodpanda' && !configForm.platformStoreId) {
    error.value = '請填寫平台店鋪 ID'
    return
  }

  isSaving.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const configData = {
      platform: configForm.platform,
      platformStoreId: configForm.platformStoreId,
      prepTime: configForm.prepTime || 30,
      busyPrepTime: configForm.busyPrepTime || 45,
      status: configForm.status || 'OFFLINE',
      autoAccept: configForm.autoAccept,
      isActive: configForm.isActive,
    }

    // 只有 foodpanda 才加入 platformBrandId
    if (configForm.platform === 'foodpanda' && configForm.platformBrandId) {
      configData.platformBrandId = configForm.platformBrandId
    }

    if (editingConfig.value) {
      // 更新配置
      await api.platformStore.updatePlatformStore({
        brandId: props.brandId,
        storeId: props.storeId,
        platformStoreId: editingConfig.value._id,
        data: configData,
      })
      successMessage.value = '配置更新成功！'

      // 更新初始狀態（重置變更偵測）
      initialFormState.value = { ...configForm }
    } else {
      // 新增配置
      await api.platformStore.createPlatformStore({
        brandId: props.brandId,
        storeId: props.storeId,
        data: {
          ...configData,
          brand: props.brandId,
          store: props.storeId,
        },
      })
      successMessage.value = '配置新增成功！'
    }

    // 通知父組件更新
    emit('updated')

    // 延遲 1.5 秒後關閉模態框
    setTimeout(() => {
      closeModal()
    }, 1500)
  } catch (err) {
    console.error('保存配置失敗:', err)
    error.value = err.response?.data?.message || '保存配置時發生錯誤'
  } finally {
    isSaving.value = false
  }
}

// 重置表單
const resetForm = () => {
  Object.assign(configForm, {
    platform: '',
    platformBrandId: '',
    platformStoreId: '',
    prepTime: 30,
    busyPrepTime: 45,
    status: 'OFFLINE',
    autoAccept: true,
    isActive: false,
  })
  editingConfig.value = null
}

// 關閉模態框
const closeModal = () => {
  show.value = false
}

// 模態框關閉時的處理
const onModalHidden = () => {
  resetForm()
  error.value = ''
  successMessage.value = ''
}

// 監聽模態框顯示狀態
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      configForm.platform = props.platform
      loadPlatformConfig()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.required::after {
  content: ' *';
  color: #dc3545;
}
</style>
