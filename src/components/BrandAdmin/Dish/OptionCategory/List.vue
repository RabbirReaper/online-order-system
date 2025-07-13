<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex">
        <div class="input-group" style="width: 300px">
          <input
            type="text"
            class="form-control"
            placeholder="搜尋選項類別..."
            v-model="searchQuery"
            @input="handleSearch"
          />
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>

      <div>
        <router-link :to="`/admin/${brandId}/option-categories/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增選項類別
        </router-link>
      </div>
    </div>

    <!-- 網路錯誤提示 -->
    <div class="alert alert-danger" v-if="errorMessage">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
    </div>

    <!-- 選項類別列表 -->
    <div class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th>名稱</th>
                <th>類型</th>
                <th>選項數量</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in filteredCategories" :key="category._id">
                <td>{{ category.name }}</td>
                <td>
                  <span
                    class="badge"
                    :class="category.inputType === 'single' ? 'bg-info' : 'bg-warning'"
                  >
                    {{ category.inputType === 'single' ? '單選' : '多選' }}
                  </span>
                </td>
                <td>{{ getOptionCount(category) }}</td>
                <td>
                  <div class="btn-group">
                    <router-link
                      :to="`/admin/${brandId}/option-categories/detail/${category._id}`"
                      class="btn btn-sm btn-outline-primary"
                    >
                      <i class="bi bi-eye me-1"></i>查看
                    </router-link>
                    <router-link
                      :to="`/admin/${brandId}/option-categories/edit/${category._id}`"
                      class="btn btn-sm btn-outline-primary"
                    >
                      <i class="bi bi-pencil me-1"></i>編輯
                    </router-link>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      @click="confirmDelete(category)"
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
    <div class="alert alert-info text-center py-4" v-if="categories.length === 0 && !isLoading">
      <i class="bi bi-info-circle me-2 fs-4"></i>
      <p class="mb-0">{{ searchQuery ? '沒有符合搜尋條件的選項類別' : '尚未創建任何選項類別' }}</p>
      <div class="mt-3" v-if="!searchQuery">
        <router-link :to="`/admin/${brandId}/option-categories/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增第一個選項類別
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
    <BModal
      id="deleteCategoryModal"
      title="確認刪除選項類別"
      ok-title="確認刪除"
      cancel-title="取消"
      ok-variant="danger"
      @ok="handleDeleteConfirm"
      ref="deleteCategoryModal"
    >
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        此操作無法撤銷，類別及其所有選項都將被永久刪除。
      </div>
      <p v-if="categoryToDelete">
        確定要刪除選項類別 <strong>{{ categoryToDelete.name }}</strong
        >？
      </p>
    </BModal>

    <!-- 錯誤通知模態框 -->
    <BModal id="errorModal" title="操作失敗" ok-title="確認" ok-variant="danger" ref="errorModal">
      <div class="text-center mb-3">
        <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3rem"></i>
      </div>
      <p class="text-center">刪除選項類別時發生錯誤</p>
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ errorModalMessage }}
      </div>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { BModal } from 'bootstrap-vue-next'
import api from '@/api'

// 從路由中獲取品牌ID
const route = useRoute()
const brandId = computed(() => route.params.brandId)

// 狀態變數
const categories = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const errorMessage = ref('')
const categoryToDelete = ref(null)
const errorModalMessage = ref('操作失敗')
const deleteCategoryModal = ref(null)
const errorModal = ref(null)

// 計算已過濾的類別列表
const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return categories.value
  }

  const query = searchQuery.value.toLowerCase()
  return categories.value.filter((category) => category.name.toLowerCase().includes(query))
})

// 獲取選項數量
const getOptionCount = (category) => {
  return category.options ? category.options.length : 0
}

// 處理搜尋
const handleSearch = () => {
  // 實時過濾，無需額外操作
}

// 獲取選項類別列表
const fetchCategories = async () => {
  if (!brandId.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await api.dish.getAllOptionCategories(brandId.value)
    if (response && response.categories) {
      categories.value = response.categories
    }
  } catch (error) {
    console.error('獲取選項類別列表失敗:', error)

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

// 確認刪除前的操作
const confirmDelete = (category) => {
  categoryToDelete.value = category
  deleteCategoryModal.value.show()
}

// 處理確認刪除
const handleDeleteConfirm = () => {
  if (categoryToDelete.value) {
    deleteCategory(categoryToDelete.value)
  }
}

// 實際進行刪除的方法
const deleteCategory = async (category) => {
  try {
    await api.dish.deleteOptionCategory({ id: category._id, brandId: brandId.value })
    // 從列表中移除已刪除的類別
    categories.value = categories.value.filter((item) => item._id !== category._id)
  } catch (error) {
    console.error('刪除選項類別失敗:', error)
    // 設置錯誤訊息
    if (error.response && error.response.data && error.response.data.message) {
      errorModalMessage.value = error.response.data.message
    } else if (error.message) {
      errorModalMessage.value = error.message
    } else {
      errorModalMessage.value = '刪除選項類別時發生錯誤'
    }
    // 顯示錯誤模態框
    errorModal.value.show()
  }
}

// 生命週期鉤子
onMounted(() => {
  // 載入選項類別列表
  fetchCategories()

  // 設置刷新列表的事件監聽器
  window.addEventListener('refresh-category-list', fetchCategories)
})
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}

.badge {
  font-weight: 500;
  font-size: 0.85rem;
}
</style>
