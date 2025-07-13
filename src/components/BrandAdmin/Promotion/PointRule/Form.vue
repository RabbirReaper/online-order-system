<template>
  <div class="card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">{{ isEditMode ? '編輯點數規則' : '新增點數規則' }}</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="submitForm" novalidate>
        <!-- 基本資訊區塊 -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3">基本資訊</h6>

          <!-- 規則名稱 -->
          <div class="mb-3">
            <label for="ruleName" class="form-label required">規則名稱</label>
            <input
              type="text"
              class="form-control"
              id="ruleName"
              v-model="formData.name"
              :class="{ 'is-invalid': errors.name }"
              required
            />
            <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
            <div class="form-text">請輸入規則名稱，不可超過50個字元</div>
          </div>

          <!-- 規則描述 -->
          <div class="mb-3">
            <label for="ruleDescription" class="form-label">規則描述</label>
            <textarea
              class="form-control"
              id="ruleDescription"
              v-model="formData.description"
              rows="3"
              :class="{ 'is-invalid': errors.description }"
            ></textarea>
            <div class="invalid-feedback" v-if="errors.description">{{ errors.description }}</div>
            <div class="form-text">簡短描述規則的使用說明或特色</div>
          </div>

          <!-- 規則類型 -->
          <div class="mb-3">
            <label for="ruleType" class="form-label required">規則類型</label>
            <select
              class="form-select"
              id="ruleType"
              v-model="formData.type"
              :class="{ 'is-invalid': errors.type }"
              required
              :disabled="isEditMode"
            >
              <option value="">請選擇...</option>
              <option value="purchase_amount">消費金額</option>
              <option value="first_purchase">首次購買</option>
              <option value="recurring_visit">重複訪問</option>
            </select>
            <div class="invalid-feedback" v-if="errors.type">{{ errors.type }}</div>
            <div class="form-text">
              <strong>消費金額</strong>：根據消費金額累積點數<br />
              <strong>首次購買</strong>：新客戶首次購買獲得固定點數<br />
              <strong>重複訪問</strong>：客戶重複來訪獲得固定點數
            </div>
            <div class="alert alert-warning mt-2" v-if="isEditMode">
              <i class="bi bi-info-circle me-2"></i>
              編輯模式下無法更改規則類型
            </div>
          </div>

          <!-- 轉換率 -->
          <div class="mb-3">
            <label for="conversionRate" class="form-label required">
              {{ getConversionRateLabel() }}
            </label>
            <div class="input-group">
              <span class="input-group-text" v-if="formData.type === 'purchase_amount'"
                >每消費 $</span
              >
              <input
                type="number"
                class="form-control"
                id="conversionRate"
                v-model="formData.conversionRate"
                min="1"
                :class="{ 'is-invalid': errors.conversionRate }"
                required
              />
              <span class="input-group-text" v-if="formData.type === 'purchase_amount'"
                >= 1 點</span
              >
              <span class="input-group-text" v-else>點</span>
            </div>
            <div class="invalid-feedback" v-if="errors.conversionRate">
              {{ errors.conversionRate }}
            </div>
            <div class="form-text">
              <template v-if="formData.type === 'purchase_amount'">
                設定消費多少金額可獲得 1 點
              </template>
              <template v-else> 設定可獲得的固定點數 </template>
            </div>
          </div>

          <!-- 最低消費金額 (僅消費金額類型) -->
          <div class="mb-3" v-if="formData.type === 'purchase_amount'">
            <label for="minimumAmount" class="form-label">最低消費金額</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input
                type="number"
                class="form-control"
                id="minimumAmount"
                v-model="formData.minimumAmount"
                min="0"
                :class="{ 'is-invalid': errors.minimumAmount }"
              />
            </div>
            <div class="invalid-feedback" v-if="errors.minimumAmount">
              {{ errors.minimumAmount }}
            </div>
            <div class="form-text">設定累積點數的最低消費門檻（選填）</div>
          </div>

          <!-- 點數有效期限 -->
          <div class="mb-3">
            <label for="validityDays" class="form-label required">點數有效期限</label>
            <div class="input-group">
              <input
                type="number"
                class="form-control"
                id="validityDays"
                v-model="formData.validityDays"
                min="1"
                :class="{ 'is-invalid': errors.validityDays }"
                required
              />
              <span class="input-group-text">天</span>
            </div>
            <div class="invalid-feedback" v-if="errors.validityDays">{{ errors.validityDays }}</div>
            <div class="form-text">設定用戶獲得點數後多少天內有效（最少1天）</div>
          </div>

          <!-- 啟用狀態 -->
          <div class="mb-3">
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="formData.isActive"
                id="isActive"
              />
              <label class="form-check-label" for="isActive"> 立即啟用 </label>
            </div>
            <div class="form-text">啟用後將開始根據此規則累積點數</div>
          </div>
        </div>

        <!-- 表單驗證錯誤訊息 -->
        <div class="alert alert-danger" v-if="formErrors.length > 0">
          <p class="mb-1">
            <strong><i class="bi bi-exclamation-triangle-fill me-2"></i>請修正以下錯誤：</strong>
          </p>
          <ul class="mb-0 ps-3">
            <li v-for="(error, index) in formErrors" :key="index">{{ error }}</li>
          </ul>
        </div>

        <!-- 提交結果訊息 -->
        <div class="alert alert-success" v-if="successMessage">
          <i class="bi bi-check-circle-fill me-2"></i>{{ successMessage }}
        </div>

        <!-- 按鈕組 -->
        <div class="d-flex justify-content-between">
          <!-- 左側 - 重置按鈕 -->
          <div>
            <button
              type="button"
              class="btn btn-secondary"
              @click="resetForm"
              :disabled="isSubmitting"
            >
              <i class="bi bi-arrow-counterclockwise me-1"></i>重置
            </button>
          </div>

          <!-- 右側 - 取消和儲存按鈕 -->
          <div>
            <router-link
              :to="`/admin/${brandId}/point-rules`"
              class="btn btn-secondary me-2"
              :disabled="isSubmitting"
            >
              <i class="bi bi-x-circle me-1"></i>取消
            </router-link>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span
                v-if="isSubmitting"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              <i v-else class="bi bi-save me-1"></i>
              {{ isSubmitting ? '處理中...' : isEditMode ? '更新規則' : '建立規則' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api'

// 路由
const router = useRouter()
const route = useRoute()

// 判斷是否為編輯模式
const isEditMode = computed(() => !!route.params.id)

// 從路由中獲取品牌ID
const brandId = computed(() => route.params.brandId)

// 表單數據
const formData = reactive({
  name: '',
  brand: '',
  description: '',
  type: '',
  conversionRate: 100,
  minimumAmount: 0,
  validityDays: 365, // 新增：預設365天
  isActive: false,
})

// 錯誤訊息
const errors = reactive({})

// 狀態
const isSubmitting = ref(false)
const successMessage = ref('')
const formErrors = ref([])

// 獲取轉換率標籤
const getConversionRateLabel = () => {
  if (formData.type === 'purchase_amount') {
    return '轉換率（消費金額）'
  } else if (formData.type === 'first_purchase') {
    return '首購獎勵點數'
  } else if (formData.type === 'recurring_visit') {
    return '重複訪問獎勵點數'
  }
  return '轉換率'
}

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取規則資料
    fetchRuleData()
  } else {
    // 清空表單
    formData.name = ''
    formData.brand = brandId.value
    formData.description = ''
    formData.type = ''
    formData.conversionRate = 100
    formData.minimumAmount = 0
    formData.validityDays = 365 // 新增：重置有效期限
    formData.isActive = false
  }

  // 清除錯誤
  Object.keys(errors).forEach((key) => delete errors[key])
  formErrors.value = []
  successMessage.value = ''
}

// 驗證表單
const validateForm = () => {
  // 清除先前的錯誤
  Object.keys(errors).forEach((key) => delete errors[key])
  formErrors.value = []
  let isValid = true

  // 驗證名稱
  if (!formData.name.trim()) {
    errors.name = '規則名稱為必填項'
    formErrors.value.push('規則名稱為必填項')
    isValid = false
  } else if (formData.name.length > 50) {
    errors.name = '規則名稱不能超過 50 個字元'
    formErrors.value.push('規則名稱不能超過 50 個字元')
    isValid = false
  }

  // 驗證類型
  if (!formData.type) {
    errors.type = '請選擇規則類型'
    formErrors.value.push('請選擇規則類型')
    isValid = false
  }

  // 驗證轉換率
  if (!formData.conversionRate || formData.conversionRate <= 0) {
    errors.conversionRate = '轉換率必須大於 0'
    formErrors.value.push('轉換率必須大於 0')
    isValid = false
  }

  // 驗證最低消費金額（消費金額類型）
  if (formData.type === 'purchase_amount' && formData.minimumAmount < 0) {
    errors.minimumAmount = '最低消費金額不能小於 0'
    formErrors.value.push('最低消費金額不能小於 0')
    isValid = false
  }

  // 驗證點數有效期限
  if (!formData.validityDays || formData.validityDays < 1) {
    errors.validityDays = '點數有效期限必須至少為 1 天'
    formErrors.value.push('點數有效期限必須至少為 1 天')
    isValid = false
  }

  return isValid
}

// 獲取規則資料 (編輯模式)
const fetchRuleData = async () => {
  if (!isEditMode.value || !route.params.id) return

  try {
    const response = await api.pointRules.getPointRuleById({
      id: route.params.id,
      brandId: brandId.value,
    })

    if (response && response.rule) {
      const rule = response.rule
      // 填充表單資料
      Object.assign(formData, rule)
    } else {
      formErrors.value = ['獲取規則資料失敗']
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/point-rules`)
      }, 2000)
    }
  } catch (error) {
    console.error('獲取規則資料時發生錯誤:', error)
    formErrors.value = ['獲取規則資料時發生錯誤，請稍後再試']
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/point-rules`)
    }, 2000)
  }
}

// 提交表單
const submitForm = async () => {
  // 清除上一次的成功訊息
  successMessage.value = ''

  if (!validateForm()) {
    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  isSubmitting.value = true

  try {
    // 設置品牌ID
    formData.brand = brandId.value

    // 準備提交資料
    const submitData = {
      ...formData,
    }

    // 如果不是消費金額類型，移除最低消費金額
    if (submitData.type !== 'purchase_amount') {
      delete submitData.minimumAmount
    }

    let response

    if (isEditMode.value) {
      // 更新規則
      response = await api.pointRules.updatePointRule({
        brandId: brandId.value,
        id: route.params.id,
        data: submitData,
      })
      successMessage.value = '點數規則更新成功！'
    } else {
      // 創建新規則
      response = await api.pointRules.createPointRule({ brandId: brandId.value, data: submitData })
      successMessage.value = '點數規則創建成功！'
    }

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/point-rules`)
    }, 1000)
  } catch (error) {
    console.error('儲存規則時發生錯誤:', error)

    // 處理 API 錯誤
    if (error.response && error.response.data) {
      const { message, errors: apiErrors } = error.response.data

      if (apiErrors) {
        // 處理特定欄位錯誤
        Object.keys(apiErrors).forEach((key) => {
          errors[key] = apiErrors[key]
          formErrors.value.push(apiErrors[key])
        })
      } else if (message) {
        // 顯示一般錯誤訊息
        formErrors.value = [`錯誤: ${message}`]
      }
    } else {
      formErrors.value = ['儲存規則時發生未知錯誤，請稍後再試']
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isSubmitting.value = false
  }
}

// 生命週期鉤子
onMounted(() => {
  // 如果是編輯模式，獲取規則資料
  if (isEditMode.value) {
    fetchRuleData()
  }
})
</script>

<style scoped>
/* 必填欄位標記 */
.required::after {
  content: ' *';
  color: #dc3545;
}

/* 表單樣式增強 */
.form-control:focus,
.form-select:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.form-text {
  font-size: 0.875rem;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>
