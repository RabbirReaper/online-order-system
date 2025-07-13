<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex flex-wrap gap-2">
        <div class="input-group" style="width: 300px">
          <input
            type="text"
            class="form-control"
            placeholder="搜尋選項..."
            v-model="searchQuery"
            @input="handleSearch"
          />
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>

        <!-- 標籤篩選下拉菜單 -->
        <div class="dropdown">
          <button
            class="btn btn-outline-primary dropdown-toggle"
            type="button"
            id="tagFilterDropdown"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i class="bi bi-tags me-1"></i>標籤篩選
            <span v-if="selectedTags.length > 0" class="badge bg-primary ms-1">{{
              selectedTags.length
            }}</span>
          </button>
          <div
            class="dropdown-menu p-3"
            aria-labelledby="tagFilterDropdown"
            style="min-width: 250px"
          >
            <h6 class="dropdown-header">選擇標籤</h6>
            <div class="mb-2">
              <div class="form-check" v-for="tag in availableTags" :key="tag">
                <input
                  class="form-check-input"
                  type="checkbox"
                  :id="`tag-${tag}`"
                  v-model="selectedTags"
                  :value="tag"
                  @change="handleSearch"
                />
                <label class="form-check-label" :for="`tag-${tag}`">{{ tag }}</label>
              </div>
              <div v-if="availableTags.length === 0" class="text-muted small py-2">
                沒有可用的標籤
              </div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
              <span class="text-muted small"
                >已選: {{ selectedTags.length }}/{{ availableTags.length }}</span
              >
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                @click="clearTagFilter"
              >
                清除篩選
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <router-link :to="`/admin/${brandId}/options/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增選項
        </router-link>
      </div>
    </div>

    <!-- 篩選提示條 -->
    <div class="mb-3 d-flex flex-wrap align-items-center" v-if="selectedTags.length > 0">
      <span class="me-2">已套用標籤篩選:</span>
      <div class="d-flex flex-wrap gap-1">
        <span v-for="tag in selectedTags" :key="tag" class="badge bg-primary me-1">
          {{ tag }}
          <button
            type="button"
            class="btn-close btn-close-white ms-1"
            style="font-size: 0.5rem"
            @click="removeSelectedTag(tag)"
          ></button>
        </span>
      </div>
      <button type="button" class="btn btn-sm btn-outline-secondary ms-2" @click="clearTagFilter">
        <i class="bi bi-x me-1"></i>清除全部
      </button>
    </div>

    <!-- 網路錯誤提示 -->
    <div class="alert alert-danger" v-if="errorMessage">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
    </div>

    <!-- 選項列表 -->
    <div class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th>名稱</th>
                <th>價格</th>
                <th>關聯餐點</th>
                <th>標籤</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="option in filteredOptions" :key="option._id">
                <td>{{ option.name }}</td>
                <td>
                  <span v-if="option.price > 0" class="text-success"
                    >+${{ formatPrice(option.price) }}</span
                  >
                  <span v-else>免費</span>
                </td>
                <td>
                  <span v-if="option.refDishTemplate">{{ option.refDishTemplate.name }}</span>
                  <span v-else class="text-muted">無</span>
                </td>
                <td>
                  <div class="d-flex flex-wrap gap-1">
                    <span
                      v-for="(tag, tagIndex) in option.tags"
                      :key="tagIndex"
                      class="badge bg-info"
                    >
                      {{ tag }}
                    </span>
                    <span v-if="!option.tags || option.tags.length === 0" class="text-muted"
                      >無標籤</span
                    >
                  </div>
                </td>
                <td>
                  <div class="btn-group">
                    <router-link
                      :to="`/admin/${brandId}/options/edit/${option._id}`"
                      class="btn btn-sm btn-outline-primary"
                    >
                      <i class="bi bi-pencil me-1"></i>編輯
                    </router-link>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      @click="confirmDelete(option)"
                    >
                      <i class="bi bi-trash me-1"></i>刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 無資料提示 -->
    <div class="alert alert-info text-center py-4" v-if="options.length === 0 && !isLoading">
      <i class="bi bi-info-circle me-2 fs-4"></i>
      <p class="mb-0">
        {{ searchQuery || selectedTags.length > 0 ? '沒有符合搜尋條件的選項' : '尚未創建任何選項' }}
      </p>
      <div class="mt-3" v-if="!searchQuery && selectedTags.length === 0">
        <router-link :to="`/admin/${brandId}/options/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增第一個選項
        </router-link>
      </div>
    </div>

    <!-- 加載中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 確認刪除對話框 -->
    <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body" v-if="optionToDelete">
            <p>
              確定要刪除選項 <strong>{{ optionToDelete.name }}</strong> 嗎？
            </p>

            <!-- 錯誤訊息區塊，只有當有錯誤時才顯示 -->
            <div class="alert alert-danger mt-3" v-if="deleteError">
              <i class="bi bi-exclamation-circle-fill me-2"></i>
              {{ deleteError }}
            </div>

            <!-- 原有的警告訊息 -->
            <div class="alert alert-warning" v-if="!deleteError">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              刪除選項可能會影響已關聯該選項的選項類別。此操作無法撤銷！
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button
              type="button"
              class="btn btn-danger"
              @click="deleteOption"
              :disabled="isDeleting"
            >
              <span
                v-if="isDeleting"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              {{ isDeleting ? '刪除中...' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Modal, Dropdown } from 'bootstrap'
import api from '@/api'

// 從路由中獲取品牌ID
const route = useRoute()
const brandId = computed(() => route.params.brandId)

// 狀態變數
const options = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const errorMessage = ref('')
const deleteModal = ref(null)
const optionToDelete = ref(null)
const isDeleting = ref(false)
const deleteError = ref('')

// 標籤相關
const availableTags = ref([])
const selectedTags = ref([])

// 初始化下拉菜單
const initDropdowns = () => {
  document.querySelectorAll('.dropdown-toggle').forEach((dropdownToggle) => {
    new Dropdown(dropdownToggle)
  })
}

// 計算已過濾的選項列表
const filteredOptions = computed(() => {
  let filtered = [...options.value]

  // 關鍵字搜尋
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((option) => option.name.toLowerCase().includes(query))
  }

  // 標籤篩選
  if (selectedTags.value.length > 0) {
    filtered = filtered.filter((option) => {
      if (!option.tags || !Array.isArray(option.tags) || option.tags.length === 0) return false
      // 選項必須包含至少一個已選標籤
      return option.tags.some((tag) => selectedTags.value.includes(tag))
    })
  }

  return filtered
})

// 格式化價格
const formatPrice = (price) => {
  return price.toLocaleString('zh-TW')
}

// 處理搜尋
const handleSearch = () => {
  // 實時過濾，無需額外操作
}

// 清除標籤篩選
const clearTagFilter = () => {
  selectedTags.value = []
  handleSearch()
}

// 移除單個已選標籤
const removeSelectedTag = (tag) => {
  selectedTags.value = selectedTags.value.filter((t) => t !== tag)
  handleSearch()
}

// 獲取選項列表
const fetchOptions = async () => {
  if (!brandId.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await api.dish.getAllOptions({ brandId: brandId.value })
    if (response && response.options) {
      options.value = response.options

      // 收集所有標籤
      const tagSet = new Set()
      options.value.forEach((option) => {
        if (option.tags && Array.isArray(option.tags)) {
          option.tags.forEach((tag) => tagSet.add(tag))
        }
      })
      availableTags.value = Array.from(tagSet).sort()
    }
  } catch (error) {
    console.error('獲取選項列表失敗:', error)
    // 嘗試獲取更有意義的錯誤訊息
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message // 從API回應中獲取錯誤訊息
    } else if (error.message) {
      errorMessage.value = error.message // 從錯誤物件獲取訊息
    } else {
      errorMessage.value = '無法連接到伺服器，請檢查網路連線' // 預設訊息
    }
  } finally {
    isLoading.value = false
  }
}

// 顯示刪除確認對話框
const confirmDelete = (option) => {
  optionToDelete.value = option
  deleteError.value = '' // 清空錯誤訊息
  deleteModal.value.show()
}

// 刪除選項
const deleteOption = async () => {
  if (!optionToDelete.value) return

  isDeleting.value = true
  deleteError.value = '' // 重置錯誤訊息

  try {
    await api.dish.deleteOption({
      brandId: brandId.value,
      id: optionToDelete.value._id,
    })

    // 關閉對話框
    deleteModal.value.hide()

    // 從列表中移除已刪除的選項
    options.value = options.value.filter((option) => option._id !== optionToDelete.value._id)

    // 更新標籤列表
    updateAvailableTags()
  } catch (error) {
    console.error('刪除選項失敗:', error)

    // 獲取並設置後端返回的具體錯誤訊息
    if (error.response && error.response.data && error.response.data.message) {
      deleteError.value = error.response.data.message
    } else {
      deleteError.value = '刪除選項時發生未知錯誤'
    }
  } finally {
    isDeleting.value = false
  }
}

// 更新可用標籤列表
const updateAvailableTags = () => {
  const tagSet = new Set()
  options.value.forEach((option) => {
    if (option.tags && Array.isArray(option.tags)) {
      option.tags.forEach((tag) => tagSet.add(tag))
    }
  })
  availableTags.value = Array.from(tagSet).sort()

  // 移除不存在的已選標籤
  selectedTags.value = selectedTags.value.filter((tag) => availableTags.value.includes(tag))
}

// 生命週期鉤子
onMounted(() => {
  // 初始化刪除確認對話框
  const modalElement = document.getElementById('deleteConfirmModal')
  if (modalElement) {
    deleteModal.value = new Modal(modalElement)
  }

  // 初始化下拉菜單
  initDropdowns()

  // 載入選項列表
  fetchOptions()

  // 設置刷新列表的事件監聽器
  window.addEventListener('refresh-option-list', fetchOptions)
})
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}

.badge {
  font-weight: 500;
}

.dropdown-menu {
  max-height: 300px;
  overflow-y: auto;
}

.form-check {
  margin-bottom: 0.3rem;
}
</style>
