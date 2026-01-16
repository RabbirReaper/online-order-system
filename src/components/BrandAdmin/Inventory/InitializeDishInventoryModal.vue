<template>
  <BModal
    :model-value="show"
    @update:model-value="emit('close')"
    size="lg"
    title="初始化餐點庫存"
    :ok-disabled="isSubmitting"
    @ok="submitInitialization"
    ok-title="初始化庫存"
    cancel-title="取消"
  >
    <template #default>
      <!-- 操作說明 -->
      <div class="alert alert-info mb-4">
        <h6><i class="bi bi-info-circle me-1"></i> 初始化說明</h6>
        <p class="mb-0">此功能將為店鋪所有餐點建立庫存記錄，預設設定如下：</p>
        <ul class="mb-0 mt-2">
          <li>庫存追蹤：關閉（不會自動扣減）</li>
          <li>可販售庫存：關閉</li>
          <li>售完狀態：正常</li>
          <li>初始庫存：0</li>
        </ul>
      </div>

      <!-- 載入中提示 -->
      <div class="d-flex justify-content-center my-3" v-if="isLoading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">檢查中...</span>
        </div>
      </div>

      <!-- 預覽結果 -->
      <div v-if="!isLoading && previewData" class="mb-4">
        <h6>即將初始化的餐點</h6>
        <div class="alert alert-secondary">
          <p class="mb-1">總餐點數：{{ previewData.total }}</p>
          <p class="mb-1">將建立：{{ previewData.toCreate }} 個庫存記錄</p>
          <p class="mb-0">已存在：{{ previewData.existing }} 個（將跳過）</p>
        </div>
      </div>

      <!-- 錯誤提示 -->
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>
    </template>

    <template #modal-footer>
      <BButton variant="secondary" @click="emit('close')">取消</BButton>
      <BButton
        variant="primary"
        :disabled="isSubmitting || !previewData"
        @click="submitInitialization"
      >
        <BSpinner small v-if="isSubmitting" class="me-1" />
        {{ isSubmitting ? '初始化中...' : '確認初始化' }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { BModal, BButton, BSpinner } from 'bootstrap-vue-next'
import api from '@/api'

// Props
const props = defineProps({
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
const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref('')
const previewData = ref(null)

// 獲取預覽資料
const fetchPreviewData = async () => {
  isLoading.value = true
  error.value = ''

  try {
    // 獲取品牌所有餐點
    const dishResponse = await api.dish.getAllDishTemplates({
      brandId: props.brandId,
      page: 1,
      limit: 1000, // 取得所有餐點
    })

    // 獲取店鋪現有庫存
    const inventoryResponse = await api.inventory.getStoreInventory({
      brandId: props.brandId,
      storeId: props.storeId,
      inventoryType: 'DishTemplate',
    })

    const allDishes = dishResponse.templates || []
    const existingInventory = inventoryResponse.inventory || []
    console.log(existingInventory)
    // 計算已存在的餐點庫存
    const existingDishIds = existingInventory.map((inv) => inv.dish?._id)
    const toCreate = allDishes.filter((dish) => !existingDishIds.includes(dish._id))

    previewData.value = {
      total: allDishes.length,
      toCreate: toCreate.length,
      existing: existingDishIds.length,
    }
  } catch (err) {
    console.error('獲取預覽資料失敗:', err)
    error.value = '獲取餐點資料失敗'
  } finally {
    isLoading.value = false
  }
}

// 提交初始化
const submitInitialization = async (evt) => {
  evt.preventDefault()

  if (!previewData.value || previewData.value.toCreate === 0) {
    error.value = '沒有需要初始化的餐點'
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    const response = await api.inventory.initializeDishInventory({
      brandId: props.brandId,
      storeId: props.storeId,
    })

    // 顯示結果
    if (response.result) {
      const result = response.result
      const message = `初始化完成：成功建立 ${result.created} 個，跳過 ${result.skipped} 個${
        result.errors.length > 0 ? `，失敗 ${result.errors.length} 個` : ''
      }`

      emit('success', { message })
    }

    emit('close')
  } catch (err) {
    console.error('初始化庫存失敗:', err)
    error.value = err.response?.data?.message || '初始化庫存時發生錯誤'
  } finally {
    isSubmitting.value = false
  }
}

// 生命週期
onMounted(() => {
  fetchPreviewData()
})
</script>

<style scoped>
.alert ul {
  padding-left: 20px;
}
</style>
