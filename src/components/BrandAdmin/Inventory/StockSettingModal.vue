<template>
  <BModal
    :model-value="show"
    @update:model-value="emit('close')"
    title="庫存設定"
    @ok="submitSettings"
    :ok-disabled="isSubmitting"
    ok-title="確認變更"
    cancel-title="取消"
    no-close-on-backdrop
    no-close-on-esc
    :no-header-close="true"
  >
    <template #default>
      <form @submit.prevent="submitSettings">
        <div class="mb-3">
          <label class="form-label">最低庫存警告值</label>
          <input
            type="number"
            v-model.number="settingsForm.minStockAlert"
            class="form-control"
            min="0"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">補貨目標數量</label>
          <input
            type="number"
            v-model.number="settingsForm.targetStockLevel"
            class="form-control"
            min="0"
          />
          <div class="form-text">留空表示無設定</div>
        </div>

        <div class="mb-3" v-if="item.inventoryType === 'DishTemplate'">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="settingsForm.isInventoryTracked"
              id="isInventoryTracked"
              @change="handleInventoryTrackingChange"
            />
            <label class="form-check-label" for="isInventoryTracked">
              追蹤庫存 (訂單自動扣除)
            </label>
          </div>
        </div>

        <div class="mb-3" v-if="item.inventoryType === 'DishTemplate'">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="settingsForm.enableAvailableStock"
              id="enableAvailableStock"
              :disabled="!settingsForm.isInventoryTracked"
              @change="confirmAvailableStock"
            />
            <label class="form-check-label" for="enableAvailableStock">
              是否啟用限量功能 (是否根據庫存自動切換售完狀態)
            </label>
          </div>
          <div class="form-text text-muted" v-if="!settingsForm.isInventoryTracked">
            <i class="bi bi-info-circle me-1"></i>
            需要先啟用「追蹤庫存」才能使用此功能
          </div>
        </div>

        <div v-if="error" class="alert alert-danger">
          {{ error }}
        </div>
      </form>
    </template>

    <template #modal-footer>
      <BButton variant="secondary" @click="emit('close')">取消</BButton>
      <BButton variant="primary" :disabled="isSubmitting" @click="submitSettings">
        <BSpinner small v-if="isSubmitting" class="me-1" />
        {{ isSubmitting ? '處理中...' : '確認變更' }}
      </BButton>
    </template>
  </BModal>

  <!-- 確認啟用/關閉庫存追蹤 Modal -->
  <BModal
    v-model="showInventoryTrackingConfirm"
    title="確認變更"
    @ok="confirmInventoryTrackingChange"
    @cancel="cancelInventoryTrackingChange"
    ok-title="確認變更"
    cancel-title="取消"
    no-close-on-backdrop
    no-close-on-esc
    :no-header-close="true"
  >
    <p v-if="pendingInventoryTracked">確定要啟用庫存追蹤嗎？啟用後，訂單確認時將自動扣除庫存。</p>
    <p v-else>
      確定要關閉庫存追蹤嗎？關閉後，訂單將不會自動扣除庫存。
      <br />
      <strong class="text-warning">注意：同時會關閉「自動停售」功能。</strong>
    </p>
  </BModal>

  <!-- 確認啟用/關閉可販售庫存 Modal -->
  <BModal
    v-model="showAvailableStockConfirm"
    title="確認變更"
    @ok="confirmAvailableStockChange"
    @cancel="cancelAvailableStockChange"
    ok-title="確認變更"
    cancel-title="取消"
    no-close-on-backdrop
    no-close-on-esc
    :no-header-close="true"
  >
    <p v-if="settingsForm.enableAvailableStock">
      確定要啟用可販售庫存功能嗎？啟用後可以設定每日限量販售。
    </p>
    <p v-else>確定要關閉可販售庫存功能嗎？關閉後將不再顯示可販售數量。</p>
  </BModal>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { BModal, BButton, BSpinner } from 'bootstrap-vue-next'
import api from '@/api'

// Props
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  storeId: {
    type: String,
    required: true,
  },
  brandId: {
    type: String,
    required: true,
  },
})

// Emits
const emit = defineEmits(['close', 'success'])

// 控制 Modal 顯示
const show = ref(true)

// 狀態
const isSubmitting = ref(false)
const error = ref('')

// 確認 Modal
const showInventoryTrackingConfirm = ref(false)
const showAvailableStockConfirm = ref(false)
const pendingInventoryTracked = ref(false)

// 設定表單
const settingsForm = reactive({
  minStockAlert: 0,
  targetStockLevel: null,
  isInventoryTracked: false,
  enableAvailableStock: false,
})

// 初始化表單值
const initForm = () => {
  if (props.item) {
    settingsForm.minStockAlert = props.item.minStockAlert || 0
    settingsForm.targetStockLevel = props.item.targetStockLevel
    settingsForm.isInventoryTracked = props.item.isInventoryTracked || false
    settingsForm.enableAvailableStock = props.item.enableAvailableStock || false
  }
}

// 處理庫存追蹤變更
const handleInventoryTrackingChange = () => {
  pendingInventoryTracked.value = settingsForm.isInventoryTracked
  showInventoryTrackingConfirm.value = true
}

const confirmInventoryTrackingChange = () => {
  // 如果關閉庫存追蹤，同時關閉自動停售
  if (!settingsForm.isInventoryTracked) {
    settingsForm.enableAvailableStock = false
  }
  showInventoryTrackingConfirm.value = false
}

const cancelInventoryTrackingChange = () => {
  settingsForm.isInventoryTracked = !settingsForm.isInventoryTracked
  showInventoryTrackingConfirm.value = false
}

// 確認可販售庫存變更
const confirmAvailableStock = () => {
  showAvailableStockConfirm.value = true
}

const confirmAvailableStockChange = () => {
  showAvailableStockConfirm.value = false
}

const cancelAvailableStockChange = () => {
  settingsForm.enableAvailableStock = !settingsForm.enableAvailableStock
  showAvailableStockConfirm.value = false
}

// 監聽庫存追蹤變更，確保防呆機制
watch(
  () => settingsForm.isInventoryTracked,
  (newValue) => {
    // 如果關閉庫存追蹤，自動關閉自動停售
    if (!newValue) {
      settingsForm.enableAvailableStock = false
    }
  },
)

// 提交設定
const submitSettings = async (evt) => {
  if (evt) evt.preventDefault()

  isSubmitting.value = true
  error.value = ''

  try {
    const data = {
      minStockAlert: settingsForm.minStockAlert,
      targetStockLevel: settingsForm.targetStockLevel || undefined,
      isInventoryTracked: settingsForm.isInventoryTracked,
      enableAvailableStock: settingsForm.enableAvailableStock,
      reason: '修改庫存設定',
    }

    await api.inventory.updateInventory({
      brandId: props.brandId,
      storeId: props.storeId,
      inventoryId: props.item._id,
      data: {
        ...data,
        inventoryType: props.item.inventoryType || 'DishTemplate',
      },
    })

    emit('success')
    emit('close')
  } catch (err) {
    console.error('更新設定失敗:', err)
    error.value = err.response?.data?.message || '更新設定時發生錯誤'
  } finally {
    isSubmitting.value = false
  }
}

// 監聽 item 變化
watch(
  () => props.item,
  () => {
    initForm()
  },
)

// 生命週期
onMounted(() => {
  initForm()
})
</script>
