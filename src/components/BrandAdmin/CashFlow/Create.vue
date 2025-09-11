<template>
  <div>
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0">新增記帳記錄</h5>
      <router-link 
        :to="`/admin/${brandId}/cash-flow/${storeId}/show`" 
        class="btn btn-outline-secondary"
      >
        <i class="bi bi-arrow-left me-1"></i>返回記錄列表
      </router-link>
    </div>

    <!-- 表單 -->
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h6 class="card-title mb-0">記帳資訊</h6>
          </div>
          <div class="card-body">
            <form @submit.prevent="submitForm">
              <!-- 日期 -->
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label required">日期</label>
                  <input 
                    type="date" 
                    class="form-control"
                    v-model="form.date"
                    :class="{ 'is-invalid': errors.date }"
                    required
                  />
                  <div class="invalid-feedback" v-if="errors.date">
                    {{ errors.date }}
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label required">類型</label>
                  <select 
                    class="form-select"
                    v-model="form.type"
                    :class="{ 'is-invalid': errors.type }"
                    required
                  >
                    <option value="">請選擇類型</option>
                    <option value="income">收入</option>
                    <option value="expense">支出</option>
                  </select>
                  <div class="invalid-feedback" v-if="errors.type">
                    {{ errors.type }}
                  </div>
                </div>
              </div>

              <!-- 分類 -->
              <div class="mb-3">
                <label class="form-label required">分類</label>
                <div class="row">
                  <div class="col-md-8">
                    <select 
                      class="form-select"
                      v-model="form.categoryId"
                      :class="{ 'is-invalid': errors.categoryId }"
                      required
                    >
                      <option value="">請選擇分類</option>
                      <option 
                        v-for="category in filteredCategories" 
                        :key="category.id" 
                        :value="category.id"
                      >
                        {{ category.name }}
                      </option>
                    </select>
                    <div class="invalid-feedback" v-if="errors.categoryId">
                      {{ errors.categoryId }}
                    </div>
                  </div>
                  <div class="col-md-4">
                    <router-link 
                      :to="`/admin/${brandId}/cash-flow/${storeId}/category`"
                      class="btn btn-outline-primary w-100"
                    >
                      <i class="bi bi-plus me-1"></i>管理分類
                    </router-link>
                  </div>
                </div>
              </div>

              <!-- 金額 -->
              <div class="mb-3">
                <label class="form-label required">金額</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input 
                    type="number" 
                    class="form-control"
                    v-model.number="form.amount"
                    :class="{ 'is-invalid': errors.amount }"
                    placeholder="0"
                    min="0"
                    step="1"
                    required
                  />
                  <div class="invalid-feedback" v-if="errors.amount">
                    {{ errors.amount }}
                  </div>
                </div>
              </div>

              <!-- 描述 -->
              <div class="mb-4">
                <label class="form-label">描述</label>
                <textarea 
                  class="form-control"
                  v-model="form.description"
                  :class="{ 'is-invalid': errors.description }"
                  rows="3"
                  placeholder="記錄說明（選填）"
                ></textarea>
                <div class="invalid-feedback" v-if="errors.description">
                  {{ errors.description }}
                </div>
              </div>

              <!-- 預覽 -->
              <div class="alert alert-light border" v-if="isFormValid">
                <h6 class="alert-heading">記錄預覽</h6>
                <hr>
                <div class="row">
                  <div class="col-md-6">
                    <p class="mb-1"><strong>日期:</strong> {{ formatDate(form.date) }}</p>
                    <p class="mb-1">
                      <strong>類型:</strong> 
                      <span 
                        class="badge ms-1"
                        :class="form.type === 'income' ? 'bg-success' : 'bg-danger'"
                      >
                        {{ form.type === 'income' ? '收入' : '支出' }}
                      </span>
                    </p>
                  </div>
                  <div class="col-md-6">
                    <p class="mb-1"><strong>分類:</strong> {{ getCategoryName(form.categoryId) }}</p>
                    <p class="mb-1">
                      <strong>金額:</strong> 
                      <span 
                        class="fw-bold"
                        :class="form.type === 'income' ? 'text-success' : 'text-danger'"
                      >
                        {{ form.type === 'income' ? '+' : '-' }}${{ form.amount?.toLocaleString() || '0' }}
                      </span>
                    </p>
                  </div>
                  <div class="col-12" v-if="form.description">
                    <p class="mb-0"><strong>描述:</strong> {{ form.description }}</p>
                  </div>
                </div>
              </div>

              <!-- 操作按鈕 -->
              <div class="d-flex gap-2 justify-content-end">
                <button 
                  type="button" 
                  class="btn btn-secondary"
                  @click="resetForm"
                >
                  重置
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  :disabled="!isFormValid || isSubmitting"
                >
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-check2 me-1"></i>
                  {{ isSubmitting ? '儲存中...' : '儲存記錄' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 路由
const route = useRoute()
const router = useRouter()
const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.storeId)

// 狀態
const isSubmitting = ref(false)
const categories = ref([])
const errors = ref({})

// 表單資料
const form = ref({
  date: new Date().toISOString().split('T')[0],
  type: '',
  categoryId: '',
  amount: null,
  description: ''
})

// 模擬分類資料
const mockCategories = [
  { id: '1', name: '食材採購', type: 'expense' },
  { id: '2', name: '租金', type: 'expense' },
  { id: '3', name: '水電費', type: 'expense' },
  { id: '4', name: '人事費用', type: 'expense' },
  { id: '5', name: '設備維護', type: 'expense' },
  { id: '6', name: '餐點銷售', type: 'income' },
  { id: '7', name: '外送收入', type: 'income' },
  { id: '8', name: '其他收入', type: 'income' }
]

// 計算屬性
const filteredCategories = computed(() => {
  if (!form.value.type) return []
  return categories.value.filter(category => category.type === form.value.type)
})

const isFormValid = computed(() => {
  return form.value.date && 
         form.value.type && 
         form.value.categoryId && 
         form.value.amount > 0
})

// 監聽類型變化，重置分類選擇
watch(() => form.value.type, () => {
  form.value.categoryId = ''
  errors.value.categoryId = ''
})

// 方法
const fetchCategories = async () => {
  try {
    // 使用假資料
    categories.value = mockCategories
  } catch (err) {
    console.error('獲取分類失敗:', err)
  }
}

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.date) {
    errors.value.date = '請選擇日期'
  }
  
  if (!form.value.type) {
    errors.value.type = '請選擇類型'
  }
  
  if (!form.value.categoryId) {
    errors.value.categoryId = '請選擇分類'
  }
  
  if (!form.value.amount || form.value.amount <= 0) {
    errors.value.amount = '請輸入有效金額'
  }
  
  return Object.keys(errors.value).length === 0
}

const submitForm = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    // 模擬API請求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('新增記帳記錄:', form.value)
    
    // 成功後返回列表頁
    router.push(`/admin/${brandId.value}/cash-flow/${storeId.value}/show`)
  } catch (err) {
    console.error('新增記錄失敗:', err)
    alert('新增記錄失敗，請稍後再試')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  form.value = {
    date: new Date().toISOString().split('T')[0],
    type: '',
    categoryId: '',
    amount: null,
    description: ''
  }
  errors.value = {}
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-TW')
}

const getCategoryName = (categoryId) => {
  if (!categoryId) return ''
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : ''
}

// 生命週期
onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.required::after {
  content: ' *';
  color: #dc3545;
}

.alert-heading {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.input-group-text {
  background-color: #f8f9fa;
  border-color: #ced4da;
}

.badge {
  font-size: 0.75rem;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}
</style>