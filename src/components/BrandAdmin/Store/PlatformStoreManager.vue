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

        <!-- 平台店鋪ID -->
        <div class="col-md-6">
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
        :disabled="isSaving || isLoading || !!successMessage"
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
                ? '更新配置'
                : '新增配置'
        }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { BModal, BButton, BFormSelect, BFormInput, BFormCheckbox, BAlert } from 'bootstrap-vue-next'
import api from '@/api'

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

// Computed
const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const modalTitle = computed(() => {
  const platformName = getPlatformDisplayName(props.platform)
  return `${props.store?.name || ''} - ${platformName} 配置`
})

// 狀態
const isLoading = ref(false)
const error = ref('')
const successMessage = ref('')
const isSaving = ref(false)
const editingConfig = ref(null)

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
    } else {
      // 新增模式
      editingConfig.value = null
      resetForm()
      configForm.platform = props.platform
    }
  } catch (err) {
    console.error('獲取平台配置失敗:', err)
    error.value = '獲取平台配置時發生錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 保存配置
const saveConfig = async () => {
  // 基本驗證
  if (!configForm.platform || !configForm.platformStoreId) {
    error.value = '請填寫必填欄位'
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
