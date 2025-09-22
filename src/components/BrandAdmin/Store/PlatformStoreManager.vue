<template>
  <BModal
    v-model:show="show"
    :title="`${store?.name || ''} - 外送平台配置管理`"
    size="xl"
    centered
    @hidden="onModalHidden"
  >
    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div class="alert alert-danger" v-if="error">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <div v-if="!isLoading">
      <!-- 頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h6 class="mb-0">平台配置管理</h6>
        <BButton size="sm" variant="primary" @click="showCreateModal = true">
          <i class="bi bi-plus-circle me-1"></i>新增平台配置
        </BButton>
      </div>

      <!-- 平台配置列表 -->
      <div class="row g-3" v-if="platformStores.length > 0">
        <div v-for="config in platformStores" :key="config._id" class="col-md-6 col-lg-4">
          <div class="card platform-config-card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 class="card-title mb-1">
                    <i class="bi bi-truck me-2"></i>
                    {{ getPlatformDisplayName(config.platform) }}
                  </h6>
                  <small class="text-muted">ID: {{ config.platformStoreId }}</small>
                </div>
                <span class="badge" :class="getStatusBadgeClass(config.status)">
                  {{ getStatusDisplayName(config.status) }}
                </span>
              </div>

              <div class="platform-details mb-3">
                <div class="row g-2 text-sm">
                  <div class="col-6">
                    <div class="detail-item">
                      <span class="text-muted">準備時間:</span>
                      <span class="fw-bold">{{ config.prepTime }}分</span>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="detail-item">
                      <span class="text-muted">忙碌時間:</span>
                      <span class="fw-bold">{{ config.busyPrepTime }}分</span>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="detail-item">
                      <span class="text-muted">自動接單:</span>
                      <span
                        class="fw-bold"
                        :class="config.autoAccept ? 'text-success' : 'text-danger'"
                      >
                        {{ config.autoAccept ? '啟用' : '停用' }}
                      </span>
                    </div>
                  </div>
                  <div class="col-12" v-if="config.menuLastSync">
                    <div class="detail-item">
                      <span class="text-muted">最後同步:</span>
                      <span class="fw-bold">{{ formatDate(config.menuLastSync) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="platform-actions">
                <div class="d-flex flex-wrap gap-1">
                  <!-- 狀態切換按鈕 -->
                  <BButton
                    size="sm"
                    :variant="config.status === 'ONLINE' ? 'success' : 'outline-success'"
                    @click="toggleStatus(config, 'ONLINE')"
                    :disabled="isUpdatingStatus"
                  >
                    <i class="bi bi-play-fill"></i>
                    上線
                  </BButton>
                  <BButton
                    size="sm"
                    :variant="config.status === 'BUSY' ? 'warning' : 'outline-warning'"
                    @click="toggleStatus(config, 'BUSY')"
                    :disabled="isUpdatingStatus"
                  >
                    <i class="bi bi-clock-fill"></i>
                    忙碌
                  </BButton>
                  <BButton
                    size="sm"
                    :variant="config.status === 'OFFLINE' ? 'secondary' : 'outline-secondary'"
                    @click="toggleStatus(config, 'OFFLINE')"
                    :disabled="isUpdatingStatus"
                  >
                    <i class="bi bi-pause-fill"></i>
                    離線
                  </BButton>
                </div>
                <div class="d-flex justify-content-between mt-2">
                  <div>
                    <BButton
                      size="sm"
                      variant="outline-info"
                      @click="syncMenu(config)"
                      :disabled="isUpdatingMenu"
                      title="更新菜單同步時間"
                    >
                      <i class="bi bi-arrow-clockwise"></i>
                      同步菜單
                    </BButton>
                  </div>
                  <div>
                    <BButton
                      size="sm"
                      variant="outline-primary"
                      @click="editConfig(config)"
                      class="me-1"
                    >
                      <i class="bi bi-pencil"></i>
                    </BButton>
                    <BButton size="sm" variant="outline-danger" @click="deleteConfig(config)">
                      <i class="bi bi-trash"></i>
                    </BButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 無配置提示 -->
      <div v-else class="alert alert-light text-center py-4">
        <div class="text-muted mb-3">
          <i class="bi bi-truck" style="font-size: 3rem"></i>
        </div>
        <h6 class="text-muted mb-2">尚未設置外送平台配置</h6>
        <p class="text-muted small mb-3">
          設置外送平台配置後，系統可自動接收來自 foodpanda、Uber Eats 等平台的訂單
        </p>
        <BButton variant="primary" @click="showCreateModal = true">
          <i class="bi bi-plus-circle me-1"></i>新增平台配置
        </BButton>
      </div>
    </div>

    <template #footer>
      <BButton variant="secondary" @click="closeModal">關閉</BButton>
    </template>
  </BModal>

  <!-- 新增/編輯配置模態框 -->
  <BModal
    v-model:show="showCreateModal"
    :title="editingConfig ? '編輯平台配置' : '新增平台配置'"
    size="lg"
    centered
  >
    <form @submit.prevent="saveConfig">
      <div class="row g-3">
        <!-- 平台選擇 -->
        <div class="col-md-6">
          <label for="platform" class="form-label required">外送平台</label>
          <BFormSelect
            id="platform"
            v-model="configForm.platform"
            :options="platformOptions"
            :disabled="editingConfig"
            required
          />
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
        <div class="col-md-6">
          <label for="prepTime" class="form-label">準備時間（分鐘）</label>
          <BFormInput
            type="number"
            id="prepTime"
            v-model.number="configForm.prepTime"
            min="0"
            placeholder="30"
          />
        </div>

        <!-- 忙碌時準備時間 -->
        <div class="col-md-6">
          <label for="busyPrepTime" class="form-label">忙碌時準備時間（分鐘）</label>
          <BFormInput
            type="number"
            id="busyPrepTime"
            v-model.number="configForm.busyPrepTime"
            min="0"
            placeholder="45"
          />
        </div>

        <!-- 營運狀態 -->
        <div class="col-md-6">
          <label for="status" class="form-label">初始營運狀態</label>
          <BFormSelect id="status" v-model="configForm.status" :options="statusOptions" />
        </div>

        <!-- 自動接單 -->
        <div class="col-md-6 d-flex align-items-end">
          <BFormCheckbox v-model="configForm.autoAccept" switch>
            自動接單 {{ configForm.autoAccept ? '✓' : '✗' }}
          </BFormCheckbox>
        </div>
      </div>
    </form>

    <template #footer>
      <BButton variant="secondary" @click="showCreateModal = false">取消</BButton>
      <BButton variant="primary" @click="saveConfig" :disabled="isSaving">
        <span
          v-if="isSaving"
          class="spinner-border spinner-border-sm me-1"
          role="status"
          aria-hidden="true"
        ></span>
        {{ isSaving ? '處理中...' : editingConfig ? '更新配置' : '新增配置' }}
      </BButton>
    </template>
  </BModal>

  <!-- 刪除確認對話框 -->
  <BModal v-model:show="showDeleteModal" title="確認刪除" centered>
    <div v-if="deletingConfig">
      <p>
        您確定要刪除
        <strong>{{ getPlatformDisplayName(deletingConfig.platform) }}</strong> 的配置嗎？
      </p>
      <div class="alert alert-warning">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        此操作無法撤銷，刪除後將無法接收來自該平台的訂單。
      </div>
    </div>

    <template #footer>
      <BButton variant="secondary" @click="showDeleteModal = false">取消</BButton>
      <BButton variant="danger" @click="confirmDelete" :disabled="isDeleting">
        <span
          v-if="isDeleting"
          class="spinner-border spinner-border-sm me-1"
          role="status"
          aria-hidden="true"
        ></span>
        {{ isDeleting ? '刪除中...' : '確認刪除' }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { BModal, BButton, BFormSelect, BFormInput, BFormCheckbox } from 'bootstrap-vue-next'
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
})

// Emits
const emit = defineEmits(['update:show', 'updated'])

// Computed
const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

// 狀態
const platformStores = ref([])
const isLoading = ref(false)
const error = ref('')
const isUpdatingStatus = ref(false)
const isUpdatingMenu = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)

// 模態框狀態
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const editingConfig = ref(null)
const deletingConfig = ref(null)

// 表單數據
const configForm = reactive({
  platform: '',
  platformStoreId: '',
  prepTime: 30,
  busyPrepTime: 45,
  status: 'OFFLINE',
  autoAccept: true,
})

// 選項配置
const platformOptions = [
  { value: '', text: '請選擇外送平台', disabled: true },
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

// 取得狀態顯示名稱
const getStatusDisplayName = (status) => {
  const statusMap = {
    ONLINE: '上線中',
    BUSY: '忙碌中',
    OFFLINE: '離線',
  }
  return statusMap[status] || status
}

// 取得狀態徽章樣式
const getStatusBadgeClass = (status) => {
  const statusClasses = {
    ONLINE: 'bg-success',
    BUSY: 'bg-warning',
    OFFLINE: 'bg-secondary',
  }
  return statusClasses[status] || 'bg-secondary'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 獲取平台配置列表
const fetchPlatformStores = async () => {
  if (!props.brandId || !props.storeId) return

  isLoading.value = true
  error.value = ''

  try {
    const response = await api.platformStore.getAllPlatformStores({
      brandId: props.brandId,
      storeId: props.storeId,
    })

    platformStores.value = response.platformStores || []
  } catch (err) {
    console.error('獲取平台配置失敗:', err)
    error.value = '獲取平台配置時發生錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 切換營運狀態
const toggleStatus = async (config, status) => {
  if (config.status === status) return

  isUpdatingStatus.value = true

  try {
    await api.platformStore.togglePlatformStoreStatus({
      brandId: props.brandId,
      storeId: props.storeId,
      platformStoreId: config._id,
      status,
    })

    // 更新本地狀態
    config.status = status
  } catch (err) {
    console.error('切換狀態失敗:', err)
    alert('切換狀態時發生錯誤')
  } finally {
    isUpdatingStatus.value = false
  }
}

// 同步菜單
const syncMenu = async (config) => {
  isUpdatingMenu.value = true

  try {
    const response = await api.platformStore.updateMenuSyncTime({
      brandId: props.brandId,
      storeId: props.storeId,
      platformStoreId: config._id,
    })

    // 更新本地數據
    config.menuLastSync = response.platformStore.menuLastSync
  } catch (err) {
    console.error('同步菜單失敗:', err)
    alert('同步菜單時發生錯誤')
  } finally {
    isUpdatingMenu.value = false
  }
}

// 編輯配置
const editConfig = (config) => {
  editingConfig.value = config
  Object.assign(configForm, {
    platform: config.platform,
    platformStoreId: config.platformStoreId,
    prepTime: config.prepTime,
    busyPrepTime: config.busyPrepTime,
    status: config.status,
    autoAccept: config.autoAccept,
  })
  showCreateModal.value = true
}

// 刪除配置
const deleteConfig = (config) => {
  deletingConfig.value = config
  showDeleteModal.value = true
}

// 確認刪除
const confirmDelete = async () => {
  if (!deletingConfig.value) return

  isDeleting.value = true

  try {
    await api.platformStore.deletePlatformStore({
      brandId: props.brandId,
      storeId: props.storeId,
      platformStoreId: deletingConfig.value._id,
    })

    // 從列表中移除
    platformStores.value = platformStores.value.filter(
      (config) => config._id !== deletingConfig.value._id,
    )

    showDeleteModal.value = false
    deletingConfig.value = null

    // 通知父組件更新
    emit('updated')
  } catch (err) {
    console.error('刪除配置失敗:', err)
    alert('刪除配置時發生錯誤')
  } finally {
    isDeleting.value = false
  }
}

// 保存配置
const saveConfig = async () => {
  // 基本驗證
  if (!configForm.platform || !configForm.platformStoreId) {
    alert('請填寫必填欄位')
    return
  }

  isSaving.value = true

  try {
    const configData = {
      platform: configForm.platform,
      platformStoreId: configForm.platformStoreId,
      prepTime: configForm.prepTime || 30,
      busyPrepTime: configForm.busyPrepTime || 45,
      status: configForm.status || 'OFFLINE',
      autoAccept: configForm.autoAccept,
    }

    if (editingConfig.value) {
      // 更新配置
      const response = await api.platformStore.updatePlatformStore({
        brandId: props.brandId,
        storeId: props.storeId,
        platformStoreId: editingConfig.value._id,
        data: configData,
      })

      // 更新本地數據
      Object.assign(editingConfig.value, response.platformStore)
    } else {
      // 新增配置
      const response = await api.platformStore.createPlatformStore({
        brandId: props.brandId,
        storeId: props.storeId,
        data: {
          ...configData,
          brand: props.brandId,
          store: props.storeId,
        },
      })

      // 添加到列表
      platformStores.value.push(response.platformStore)
    }

    // 重置表單
    resetForm()
    showCreateModal.value = false

    // 通知父組件更新
    emit('updated')
  } catch (err) {
    console.error('保存配置失敗:', err)
    if (err.response?.data?.message) {
      alert(`保存失敗: ${err.response.data.message}`)
    } else {
      alert('保存配置時發生錯誤')
    }
  } finally {
    isSaving.value = false
  }
}

// 重置表單
const resetForm = () => {
  Object.assign(configForm, {
    platform: '',
    platformStoreId: '',
    prepTime: 30,
    busyPrepTime: 45,
    status: 'OFFLINE',
    autoAccept: true,
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
  showCreateModal.value = false
  showDeleteModal.value = false
}

// 監聽模態框顯示狀態
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      fetchPlatformStores()
    }
  },
)

// 監聽新增模態框關閉
watch(showCreateModal, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

<style scoped>
.platform-config-card {
  transition: all 0.2s ease;
  border: 1px solid #dee2e6;
}

.platform-config-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #0d6efd;
}

.platform-details {
  font-size: 0.875rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.platform-actions .btn {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.875rem;
}

.required::after {
  content: ' *';
  color: #dc3545;
}

/* 響應式調整 */
@media (max-width: 768px) {
  .platform-actions .d-flex {
    flex-direction: column;
    gap: 0.5rem;
  }

  .platform-actions .d-flex:first-child {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
