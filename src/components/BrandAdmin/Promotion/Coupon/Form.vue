<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">{{ isEditMode ? '編輯優惠券' : '新增優惠券' }}</h4>
      <router-link :to="`/admin/${brandId}/coupons`" class="btn btn-secondary">
        <i class="bi bi-arrow-left me-1"></i>返回列表
      </router-link>
    </div>

    <!-- 表單 -->
    <div class="card">
      <div class="card-body">
        <form @submit.prevent="submitForm">
          <!-- 基本資訊 -->
          <div class="mb-4">
            <h6 class="border-bottom pb-2 mb-3">基本資訊</h6>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="name" class="form-label required">優惠券名稱</label>
                <input
                  type="text"
                  class="form-control"
                  id="name"
                  v-model="formData.name"
                  :class="{ 'is-invalid': errors.name }"
                  maxlength="50"
                  placeholder="請輸入優惠券名稱"
                />
                <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
                <div class="form-text">最多50個字元</div>
              </div>

              <div class="col-md-6 mb-3">
                <label for="validityPeriod" class="form-label required">有效期限</label>
                <div class="input-group">
                  <input
                    type="number"
                    class="form-control"
                    id="validityPeriod"
                    v-model="formData.validityPeriod"
                    :class="{ 'is-invalid': errors.validityPeriod }"
                    min="1"
                    placeholder="請輸入天數"
                  />
                  <span class="input-group-text">天</span>
                </div>
                <div class="invalid-feedback" v-if="errors.validityPeriod">
                  {{ errors.validityPeriod }}
                </div>
                <div class="form-text">從發放日起計算的有效天數</div>
              </div>
            </div>

            <div class="mb-3">
              <label for="description" class="form-label">描述</label>
              <textarea
                class="form-control"
                id="description"
                v-model="formData.description"
                rows="3"
                placeholder="請輸入優惠券描述（選填）"
              ></textarea>
              <div class="form-text">向用戶說明此優惠券的使用方式和限制</div>
            </div>

            <div class="mb-3">
              <label class="form-label">狀態</label>
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="isActive"
                  v-model="formData.isActive"
                />
                <label class="form-check-label" for="isActive">
                  {{ formData.isActive ? '啟用' : '停用' }}
                </label>
              </div>
              <div class="form-text">停用後無法發放此優惠券給用戶</div>
            </div>
          </div>

          <!-- 折扣資訊 -->
          <div class="mb-4">
            <h6 class="border-bottom pb-2 mb-3">折扣設定</h6>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="discountType" class="form-label required">折扣類型</label>
                <select
                  class="form-select"
                  id="discountType"
                  v-model="formData.discountInfo.discountType"
                  :class="{ 'is-invalid': errors['discountInfo.discountType'] }"
                >
                  <option value="">請選擇折扣類型</option>
                  <option value="percentage">百分比折扣</option>
                  <option value="fixed">固定金額折抵</option>
                </select>
                <div class="invalid-feedback" v-if="errors['discountInfo.discountType']">
                  {{ errors['discountInfo.discountType'] }}
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <label for="discountValue" class="form-label required">折扣值</label>
                <div class="input-group">
                  <span
                    class="input-group-text"
                    v-if="formData.discountInfo.discountType === 'fixed'"
                    >$</span
                  >
                  <input
                    type="number"
                    class="form-control"
                    id="discountValue"
                    v-model.number="formData.discountInfo.discountValue"
                    :class="{ 'is-invalid': errors['discountInfo.discountValue'] }"
                    min="0.01"
                    step="0.01"
                    :placeholder="
                      formData.discountInfo.discountType === 'percentage'
                        ? '請輸入百分比'
                        : '請輸入金額'
                    "
                  />
                  <span
                    class="input-group-text"
                    v-if="formData.discountInfo.discountType === 'percentage'"
                    >%</span
                  >
                </div>
                <div class="invalid-feedback" v-if="errors['discountInfo.discountValue']">
                  {{ errors['discountInfo.discountValue'] }}
                </div>
                <div class="form-text">
                  {{
                    formData.discountInfo.discountType === 'percentage'
                      ? '輸入1-100的百分比數值'
                      : '輸入具體的折抵金額'
                  }}
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="minPurchaseAmount" class="form-label">最低消費金額</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    type="number"
                    class="form-control"
                    id="minPurchaseAmount"
                    v-model.number="formData.discountInfo.minPurchaseAmount"
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
                <div class="form-text">設為0表示無最低消費限制</div>
              </div>

              <div class="col-md-6 mb-3" v-if="formData.discountInfo.discountType === 'percentage'">
                <label for="maxDiscountAmount" class="form-label">最高折扣金額</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    type="number"
                    class="form-control"
                    id="maxDiscountAmount"
                    v-model.number="formData.discountInfo.maxDiscountAmount"
                    min="0.01"
                    step="0.01"
                    placeholder="不限制"
                  />
                </div>
                <div class="form-text">留空表示不限制最高折扣金額</div>
              </div>
            </div>
          </div>

          <!-- 預覽區域 -->
          <div
            class="mb-4"
            v-if="
              formData.name &&
              formData.discountInfo.discountType &&
              formData.discountInfo.discountValue
            "
          >
            <h6 class="border-bottom pb-2 mb-3">優惠券預覽</h6>
            <div class="card bg-light">
              <div class="card-body">
                <h6 class="card-title">{{ formData.name }}</h6>
                <p class="card-text" v-if="formData.description">{{ formData.description }}</p>
                <div class="text-primary fw-bold mb-2">
                  <template v-if="formData.discountInfo.discountType === 'percentage'">
                    {{ formData.discountInfo.discountValue }}% 折扣
                    <span v-if="formData.discountInfo.maxDiscountAmount" class="text-muted small">
                      (最高${{ formatPrice(formData.discountInfo.maxDiscountAmount) }})
                    </span>
                  </template>
                  <template v-else>
                    折抵 ${{ formatPrice(formData.discountInfo.discountValue) }}
                  </template>
                </div>
                <div class="small text-muted">
                  <div v-if="formData.discountInfo.minPurchaseAmount > 0">
                    最低消費：${{ formatPrice(formData.discountInfo.minPurchaseAmount) }}
                  </div>
                  <div>有效期限：{{ formData.validityPeriod }} 天</div>
                </div>
              </div>
            </div>
          </div>
          <!-- 成功訊息 -->
          <div class="alert alert-success" v-if="successMessage">
            <i class="bi bi-check-circle-fill me-2"></i>
            {{ successMessage }}
          </div>

          <!-- 錯誤訊息 -->
          <div class="alert alert-danger" v-if="formErrors.length > 0">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>請修正以下錯誤：</strong>
            <ul class="mb-0 mt-2">
              <li v-for="error in formErrors" :key="error">{{ error }}</li>
            </ul>
          </div>
          <!-- 提交按鈕 -->
          <div class="d-flex justify-content-end">
            <button type="button" class="btn btn-outline-secondary me-2" @click="resetForm">
              <i class="bi bi-arrow-clockwise me-1"></i>重置
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
              {{ isSubmitting ? '處理中...' : isEditMode ? '更新優惠券' : '建立優惠券' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
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
  description: '',
  discountInfo: {
    discountType: '',
    discountValue: 0,
    maxDiscountAmount: null,
    minPurchaseAmount: 0,
  },
  validityPeriod: 30,
  isActive: true,
})

// 錯誤訊息
const errors = reactive({})

// 狀態
const isSubmitting = ref(false)
const successMessage = ref('')
const formErrors = ref([])

// 格式化價格
const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0'
}

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取優惠券資料
    fetchCouponData()
  } else {
    // 清空表單
    formData.name = ''
    formData.description = ''
    formData.discountInfo = {
      discountType: '',
      discountValue: 0,
      maxDiscountAmount: null,
      minPurchaseAmount: 0,
    }
    formData.validityPeriod = 30
    formData.isActive = true
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
    errors.name = '優惠券名稱為必填項'
    formErrors.value.push('優惠券名稱為必填項')
    isValid = false
  } else if (formData.name.length > 50) {
    errors.name = '優惠券名稱不能超過 50 個字元'
    formErrors.value.push('優惠券名稱不能超過 50 個字元')
    isValid = false
  }

  // 驗證有效期限
  if (!formData.validityPeriod || formData.validityPeriod < 1) {
    errors.validityPeriod = '有效期限必須大於 0'
    formErrors.value.push('有效期限必須大於 0')
    isValid = false
  }

  // 驗證折扣類型
  if (!formData.discountInfo.discountType) {
    errors['discountInfo.discountType'] = '請選擇折扣類型'
    formErrors.value.push('請選擇折扣類型')
    isValid = false
  }

  // 驗證折扣值
  if (!formData.discountInfo.discountValue || formData.discountInfo.discountValue <= 0) {
    errors['discountInfo.discountValue'] = '折扣值必須大於 0'
    formErrors.value.push('折扣值必須大於 0')
    isValid = false
  } else if (
    formData.discountInfo.discountType === 'percentage' &&
    formData.discountInfo.discountValue > 100
  ) {
    errors['discountInfo.discountValue'] = '折扣百分比不能超過 100'
    formErrors.value.push('折扣百分比不能超過 100')
    isValid = false
  }

  return isValid
}

// 獲取優惠券資料 (編輯模式)
const fetchCouponData = async () => {
  if (!isEditMode.value || !route.params.id) return

  try {
    const response = await api.promotion.getCouponTemplateById({
      id: route.params.id,
      brandId: brandId.value,
    })

    if (response && response.template) {
      const template = response.template

      // 填充表單資料
      formData.name = template.name || ''
      formData.description = template.description || ''
      formData.validityPeriod = template.validityPeriod || 30
      formData.isActive = template.isActive !== false

      // 處理折扣資訊
      if (template.discountInfo) {
        formData.discountInfo.discountType = template.discountInfo.discountType || ''
        formData.discountInfo.discountValue = template.discountInfo.discountValue || 0
        formData.discountInfo.maxDiscountAmount = template.discountInfo.maxDiscountAmount || null
        formData.discountInfo.minPurchaseAmount = template.discountInfo.minPurchaseAmount || 0
      }
    } else {
      formErrors.value = ['獲取優惠券資料失敗']
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/coupons`)
      }, 2000)
    }
  } catch (error) {
    console.error('獲取優惠券資料時發生錯誤:', error)
    if (error.response && error.response.data && error.response.data.message) {
      formErrors.value = [error.response.data.message]
    } else {
      formErrors.value = ['獲取優惠券資料時發生錯誤，請稍後再試']
    }
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/coupons`)
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
    // 準備提交資料
    const submitData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      discountInfo: {
        discountType: formData.discountInfo.discountType,
        discountValue: Number(formData.discountInfo.discountValue),
        maxDiscountAmount: formData.discountInfo.maxDiscountAmount
          ? Number(formData.discountInfo.maxDiscountAmount)
          : null,
        minPurchaseAmount: Number(formData.discountInfo.minPurchaseAmount) || 0,
      },
      validityPeriod: Number(formData.validityPeriod),
      isActive: formData.isActive,
    }

    let response

    if (isEditMode.value) {
      // 更新優惠券
      response = await api.promotion.updateCouponTemplate({
        brandId: brandId.value,
        id: route.params.id,
        data: submitData,
      })
      successMessage.value = '優惠券更新成功！'
    } else {
      // 創建新優惠券
      response = await api.promotion.createCouponTemplate({
        brandId: brandId.value,
        data: submitData,
      })
      successMessage.value = '優惠券創建成功！'
    }

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/coupons`)
    }, 1000)
  } catch (error) {
    console.error('儲存優惠券時發生錯誤:', error)

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
      formErrors.value = ['儲存優惠券時發生未知錯誤，請稍後再試']
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isSubmitting.value = false
  }
}

// 監聽折扣類型變化，清除不相關的欄位
watch(
  () => formData.discountInfo.discountType,
  (newType) => {
    if (newType !== 'percentage') {
      formData.discountInfo.maxDiscountAmount = null
    }
  },
)

// 生命週期鉤子
onMounted(() => {
  // 如果是編輯模式，獲取優惠券資料
  if (isEditMode.value) {
    fetchCouponData()
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
