<template>
  <div class="card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">{{ isEditMode ? '編輯選項類別' : '新增選項類別' }}</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="submitForm" novalidate>
        <!-- 基本資訊區塊 -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3">基本資訊</h6>

          <!-- 類別名稱 -->
          <div class="mb-3">
            <label for="categoryName" class="form-label required">類別名稱</label>
            <input
              type="text"
              class="form-control"
              id="categoryName"
              v-model="formData.name"
              :class="{ 'is-invalid': errors.name }"
              required
            />
            <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
            <div class="form-text">請輸入選項類別名稱，例如：「尺寸」、「甜度」、「配料」等</div>
          </div>

          <!-- 輸入類型 -->
          <div class="mb-3">
            <label for="inputType" class="form-label required">輸入類型</label>
            <select
              class="form-select"
              id="inputType"
              v-model="formData.inputType"
              :class="{ 'is-invalid': errors.inputType }"
              required
            >
              <option value="">請選擇...</option>
              <option value="single">單選</option>
              <option value="multiple">多選</option>
            </select>
            <div class="invalid-feedback" v-if="errors.inputType">{{ errors.inputType }}</div>
            <div class="form-text">
              <strong>單選</strong>：顧客只能選擇一個選項（例如：飲料尺寸）<br />
              <strong>多選</strong>：顧客可以選擇多個選項（例如：加料）
            </div>
          </div>
        </div>

        <!-- 選項管理區塊 -->
        <div class="mb-4" v-if="isEditMode">
          <h6 class="border-bottom pb-2 mb-3 d-flex justify-content-between">
            <span>選項管理</span>
            <button
              type="button"
              class="btn btn-sm btn-outline-primary"
              @click="showAddOptionModal"
            >
              <i class="bi bi-plus-circle me-1"></i>添加選項
            </button>
          </h6>

          <!-- 選項列表 -->
          <div class="table-responsive mb-3" v-if="formData.options && formData.options.length > 0">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th width="5%">排序</th>
                  <th>選項名稱</th>
                  <th>價格</th>
                  <th>關聯餐點</th>
                  <th width="120px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(option, index) in sortedOptions" :key="option.refOption">
                  <td>
                    <div class="btn-group-vertical">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary p-0 px-1"
                        @click="moveOption(option, -1)"
                        :disabled="index === 0"
                      >
                        <i class="bi bi-chevron-up"></i>
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary p-0 px-1"
                        @click="moveOption(option, 1)"
                        :disabled="index === sortedOptions.length - 1"
                      >
                        <i class="bi bi-chevron-down"></i>
                      </button>
                    </div>
                  </td>
                  <td>{{ option.refOption.name }}</td>
                  <td>{{ formatPrice(option.refOption.price) }}</td>
                  <td>{{ formatRefDishName(option.refOption) }}</td>
                  <td>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      @click="removeOption(option)"
                    >
                      <i class="bi bi-trash me-1"></i>移除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 無選項提示 -->
          <div class="alert alert-light text-center py-3" v-else>
            <div class="text-muted">尚未添加任何選項</div>
            <button type="button" class="btn btn-sm btn-primary mt-2" @click="showAddOptionModal">
              <i class="bi bi-plus-circle me-1"></i>添加選項
            </button>
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
              :to="`/admin/${brandId}/option-categories`"
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
              {{ isSubmitting ? '處理中...' : isEditMode ? '更新選項類別' : '建立選項類別' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- 添加選項對話框 -->
    <div class="modal fade" id="addOptionModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">添加選項</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <!-- 選項篩選器 -->
            <div class="mb-3">
              <label class="form-label">篩選選項</label>
              <div class="d-flex gap-2 mb-2">
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="搜尋選項名稱..."
                    v-model="optionSearchQuery"
                    @input="filterOptions"
                  />
                  <button class="btn btn-outline-secondary" type="button">
                    <i class="bi bi-search"></i>
                  </button>
                </div>
                <button type="button" class="btn btn-outline-primary" @click="showTagFilterModal">
                  <i class="bi bi-tags me-1"></i>標籤
                </button>
              </div>

              <!-- 已選標籤顯示 -->
              <div
                v-if="selectedTags.length > 0"
                class="d-flex flex-wrap align-items-center gap-2 mb-2"
              >
                <span class="text-muted me-1">已選標籤:</span>
                <span v-for="(tag, index) in selectedTags" :key="index" class="badge bg-primary">
                  {{ tag }}
                  <button
                    type="button"
                    class="btn-close btn-close-white ms-1"
                    style="font-size: 0.5rem"
                    @click="removeSelectedTag(tag)"
                  ></button>
                </span>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  @click="clearTagFilters"
                >
                  <i class="bi bi-x me-1"></i>清除全部
                </button>
              </div>
            </div>

            <!-- 可用選項列表 -->
            <div class="mb-3">
              <label for="optionSelect" class="form-label required">選擇選項</label>
              <select
                class="form-select"
                id="optionSelect"
                v-model="selectedOptionId"
                size="10"
                style="height: 250px"
              >
                <option v-if="filteredOptions.length === 0" disabled>沒有符合篩選條件的選項</option>
                <option v-for="option in filteredOptions" :key="option._id" :value="option._id">
                  {{ option.name }} ({{ option.price > 0 ? '+$' + option.price : '免費' }})
                  <span v-if="option.refDishTemplate">
                    - 餐點: {{ option.refDishTemplate.name }}</span
                  >
                </option>
              </select>
              <div class="d-flex justify-content-between mt-1">
                <div
                  class="form-text"
                  v-if="
                    filteredOptions.length === 0 && !optionSearchQuery && selectedTags.length === 0
                  "
                >
                  沒有可用的選項，請先在選項管理頁面中創建
                </div>
                <div class="form-text" v-else-if="filteredOptions.length === 0">
                  沒有符合篩選條件的選項
                </div>
                <div class="form-text" v-else>共 {{ filteredOptions.length }} 個選項</div>
              </div>
            </div>

            <!-- 已選擇的選項詳情 -->
            <div v-if="selectedOptionPreview" class="card mt-3">
              <div class="card-header bg-light">
                <h6 class="mb-0">選項預覽</h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <p><strong>名稱:</strong> {{ selectedOptionPreview.name }}</p>
                    <p>
                      <strong>價格:</strong>
                      {{
                        selectedOptionPreview.price > 0
                          ? '+$' + selectedOptionPreview.price
                          : '免費'
                      }}
                    </p>
                  </div>
                  <div class="col-md-6">
                    <p>
                      <strong>關聯餐點:</strong>
                      {{
                        selectedOptionPreview.refDishTemplate
                          ? selectedOptionPreview.refDishTemplate.name
                          : '無'
                      }}
                    </p>
                    <p v-if="selectedOptionPreview.tags && selectedOptionPreview.tags.length > 0">
                      <strong>標籤:</strong>
                      <span
                        v-for="(tag, index) in selectedOptionPreview.tags"
                        :key="index"
                        class="badge bg-info me-1"
                      >
                        {{ tag }}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button
              type="button"
              class="btn btn-primary"
              @click="addOption"
              :disabled="!selectedOptionId"
            >
              添加到類別
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 標籤篩選對話框 -->
    <div class="modal fade" id="tagFilterModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">選擇標籤篩選</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <div class="d-flex flex-wrap gap-2">
                <div v-for="tag in availableTags" :key="tag" class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :id="`tag-${tag}`"
                    :value="tag"
                    v-model="selectedTags"
                  />
                  <label class="form-check-label" :for="`tag-${tag}`">{{ tag }}</label>
                </div>
                <div v-if="availableTags.length === 0" class="text-muted">
                  沒有可用的標籤，請先為選項添加標籤
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeTagFilterModal">
              取消
            </button>
            <button type="button" class="btn btn-primary" @click="applyTagFilters">應用篩選</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
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
  inputType: '',
  options: [],
})

// 錯誤訊息
const errors = reactive({
  name: '',
  inputType: '',
})

// 狀態
const isSubmitting = ref(false)
const successMessage = ref('')
const formErrors = ref([])
const optionModal = ref(null)
const tagFilterModal = ref(null)
const selectedOptionId = ref('')
const allOptions = ref([])
const availableTags = ref([])
const selectedTags = ref([])
const optionSearchQuery = ref('')
const selectedOptionPreview = ref(null)

// 計算已排序的選項列表
const sortedOptions = computed(() => {
  return [...formData.options].sort((a, b) => a.order - b.order)
})

// 根據標籤和搜尋過濾的選項列表
const filteredOptions = computed(() => {
  let options = [...availableOptions.value]

  // 根據搜尋關鍵字過濾
  if (optionSearchQuery.value.trim()) {
    const query = optionSearchQuery.value.toLowerCase().trim()
    options = options.filter((option) => option.name.toLowerCase().includes(query))
  }

  // 根據已選標籤過濾
  if (selectedTags.value.length > 0) {
    options = options.filter((option) => {
      if (!option.tags || !Array.isArray(option.tags)) return false
      // 確認選項標籤包含任一已選標籤
      return selectedTags.value.some((tag) => option.tags.includes(tag))
    })
  }

  return options
})

// 格式化價格
const formatPrice = (price) => {
  if (price === 0) return '免費'
  return '$' + price.toLocaleString('zh-TW')
}

// 格式化關聯餐點名稱函數
const formatRefDishName = (option) => {
  const dishName = option && option.refDishTemplate ? option.refDishTemplate.name : '無'
  return dishName === '無' ? dishName : `餐點: ${dishName}`
}

// 清除標籤篩選
const clearTagFilters = () => {
  selectedTags.value = []
  filterOptions()
}

// 移除單個已選標籤
const removeSelectedTag = (tag) => {
  selectedTags.value = selectedTags.value.filter((t) => t !== tag)
  filterOptions()
}

// 過濾選項
const filterOptions = () => {
  // 由於使用 computed 屬性 filteredOptions，此處只需重新獲取選項預覽
  updateSelectedOptionPreview()
}

// 獲取選項預覽
const updateSelectedOptionPreview = () => {
  if (!selectedOptionId.value) {
    selectedOptionPreview.value = null
    return
  }

  const option = allOptions.value.find((opt) => opt._id === selectedOptionId.value)
  selectedOptionPreview.value = option || null
}

// 顯示添加選項對話框
const showAddOptionModal = () => {
  // 重設篩選條件
  optionSearchQuery.value = ''
  selectedTags.value = []

  // 更新可用選項列表
  updateAvailableOptions()
  selectedOptionId.value = ''
  selectedOptionPreview.value = null

  // 顯示對話框
  optionModal.value.show()
}

// 顯示標籤篩選對話框
const showTagFilterModal = () => {
  tagFilterModal.value.show()
}

// 關閉標籤篩選對話框
const closeTagFilterModal = () => {
  tagFilterModal.value.hide()
}

// 應用標籤篩選
const applyTagFilters = () => {
  // 關閉標籤對話框
  tagFilterModal.value.hide()
  // 過濾選項會自動通過 computed 屬性完成
}

// 可用選項計算屬性
const availableOptions = computed(() => {
  const usedOptionIds = formData.options.map((opt) => opt.refOption._id)
  return allOptions.value.filter((option) => !usedOptionIds.includes(option._id))
})

// 更新可用選項列表
const updateAvailableOptions = async () => {
  try {
    // 重新獲取所有選項，以確保最新的標籤資訊
    const response = await api.dish.getAllOptions({ brandId: brandId.value })
    if (response && response.options) {
      allOptions.value = response.options

      // 收集所有可用標籤
      const tagSet = new Set()
      allOptions.value.forEach((option) => {
        if (option.tags && Array.isArray(option.tags)) {
          option.tags.forEach((tag) => tagSet.add(tag))
        }
      })
      availableTags.value = Array.from(tagSet)
    }
  } catch (error) {
    console.error('獲取選項列表失敗:', error)
  }
}

// 添加選項
const addOption = () => {
  if (!selectedOptionId.value) return

  // 找到選擇的選項對象
  const selectedOption = allOptions.value.find((opt) => opt._id === selectedOptionId.value)
  if (!selectedOption) return

  // 添加到選項列表
  formData.options.push({
    refOption: selectedOption, // 直接存儲整個對象
    order: formData.options.length,
  })

  // 關閉對話框
  optionModal.value.hide()
}

// 移除選項
const removeOption = (option) => {
  formData.options = formData.options.filter((opt) => opt.refOption._id !== option.refOption._id)

  // 重新排序
  formData.options.forEach((opt, idx) => {
    opt.order = idx
  })
}

// 移動選項排序
const moveOption = (option, direction) => {
  const currentIndex = formData.options.findIndex(
    (opt) => opt.refOption._id === option.refOption._id,
  )
  const newIndex = currentIndex + direction

  // 檢查邊界
  if (newIndex < 0 || newIndex >= formData.options.length) return

  // 更新排序值
  const targetOption = formData.options[newIndex]
  const currentOrder = option.order

  option.order = targetOption.order
  targetOption.order = currentOrder

  // 重新排序
  formData.options.sort((a, b) => a.order - b.order)
}

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取選項類別資料
    fetchCategoryData()
  } else {
    // 清空表單
    formData.name = ''
    formData.brand = brandId.value
    formData.inputType = ''
    formData.options = []
  }

  // 清除錯誤
  errors.name = ''
  errors.inputType = ''
  formErrors.value = []
  successMessage.value = ''
}

// 驗證表單
const validateForm = () => {
  // 清除先前的錯誤
  errors.name = ''
  errors.inputType = ''
  formErrors.value = []
  let isValid = true

  // 驗證類別名稱
  if (!formData.name.trim()) {
    errors.name = '類別名稱為必填項'
    formErrors.value.push('類別名稱為必填項')
    isValid = false
  } else if (formData.name.length > 50) {
    errors.name = '類別名稱不能超過 50 個字元'
    formErrors.value.push('類別名稱不能超過 50 個字元')
    isValid = false
  }

  // 驗證輸入類型
  if (!formData.inputType) {
    errors.inputType = '請選擇輸入類型'
    formErrors.value.push('請選擇輸入類型')
    isValid = false
  }

  return isValid
}

// 獲取選項類別數據 (編輯模式)
const fetchCategoryData = async () => {
  if (!isEditMode.value || !route.params.id) return

  try {
    const response = await api.dish.getOptionCategoryById({
      id: route.params.id,
      brandId: brandId.value,
      includeOptions: true,
    })
    if (response && response.category) {
      const category = response.category
      formData.name = category.name
      formData.brand = category.brand
      formData.inputType = category.inputType
      formData.options = category.options || []
      formData._id = category._id
    } else {
      // 顯示錯誤訊息
      formErrors.value = ['獲取選項類別資料失敗']
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/option-categories`)
      }, 2000)
    }
  } catch (error) {
    console.error('獲取選項類別資料時發生錯誤:', error)
    formErrors.value = ['獲取選項類別資料時發生錯誤，請稍後再試']
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/option-categories`)
    }, 2000)
  }
}

// 獲取所有選項 (無需分頁)
const fetchAllOptions = async () => {
  try {
    const response = await api.dish.getAllOptions({ brandId: brandId.value })
    if (response && response.options) {
      allOptions.value = response.options

      // 收集所有可用標籤
      const tagSet = new Set()
      allOptions.value.forEach((option) => {
        if (option.tags && Array.isArray(option.tags)) {
          option.tags.forEach((tag) => tagSet.add(tag))
        }
      })
      availableTags.value = Array.from(tagSet)
    }
  } catch (error) {
    console.error('獲取選項列表失敗:', error)
  }
}

// 監聽選項變更
const watchOptionSelection = () => {
  updateSelectedOptionPreview()
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
      name: formData.name,
      brand: formData.brand,
      inputType: formData.inputType,
    }

    // 只有在編輯模式下才提交選項列表
    if (isEditMode.value) {
      submitData.options = formData.options
    }

    let response

    if (isEditMode.value) {
      // 更新選項類別
      response = await api.dish.updateOptionCategory({
        id: route.params.id,
        data: submitData,
        brandId: brandId.value,
      })
      successMessage.value = '選項類別更新成功！'
    } else {
      // 創建新選項類別
      response = await api.dish.createOptionCategory({ data: submitData, brandId: brandId.value })
      successMessage.value = '選項類別創建成功！'
    }

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/option-categories`)

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-category-list'))
    }, 1500)
  } catch (error) {
    console.error('儲存選項類別時發生錯誤:', error)

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
      formErrors.value = ['儲存選項類別時發生未知錯誤，請稍後再試']
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isSubmitting.value = false
  }
}

// 生命週期鉤子
onMounted(() => {
  // 初始化選項對話框
  const modalElement = document.getElementById('addOptionModal')
  if (modalElement) {
    optionModal.value = new Modal(modalElement)
  }

  // 初始化標籤篩選對話框
  const tagModalElement = document.getElementById('tagFilterModal')
  if (tagModalElement) {
    tagFilterModal.value = new Modal(tagModalElement)
  }

  // 獲取所有選項
  fetchAllOptions()

  // 如果是編輯模式，獲取選項類別資料
  if (isEditMode.value) {
    fetchCategoryData()
  }

  // 監聽選項選擇變更
  watch(() => selectedOptionId.value, watchOptionSelection)
})
</script>

<style scoped>
/* 必填欄位標記 */
.required::after {
  content: ' *';
  color: #dc3545;
}

/* 表格樣式 */
.table th,
.table td {
  vertical-align: middle;
}

/* 按鈕樣式 */
.btn-group-vertical .btn {
  padding: 0.25rem 0.5rem;
}

/* 表單控制項樣式 */
.form-select[size] {
  height: auto;
}

/* 標籤樣式 */
.badge {
  font-weight: 500;
}

/* 選項預覽卡片 */
.card-header {
  padding: 0.5rem 1rem;
}
</style>
