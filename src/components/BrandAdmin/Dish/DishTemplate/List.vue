<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex">
        <div class="input-group" style="width: 300px">
          <input
            type="text"
            class="form-control"
            placeholder="搜尋餐點..."
            v-model="searchQuery"
            @input="handleSearch"
          />
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>

        <div class="ms-2">
          <select class="form-select" v-model="filterTag" @change="handleSearch">
            <option value="">所有標籤</option>
            <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
          </select>
        </div>
      </div>

      <div>
        <router-link :to="`/admin/${brandId}/dishes/template/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增餐點
        </router-link>
      </div>
    </div>

    <!-- 網路錯誤提示 -->
    <div class="alert alert-danger" v-if="errorMessage">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
    </div>

    <!-- 餐點模板卡片列表 -->
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xxl-4 g-4">
      <div class="col" v-for="dish in dishes" :key="dish._id">
        <div class="card h-100 dish-card">
          <div class="card-img-top position-relative overflow-hidden" style="height: 180px">
            <template v-if="dish.image && dish.image.url">
              <img
                :src="dish.image.url"
                class="img-fluid w-100 h-100 object-fit-cover"
                :alt="dish.name"
              />
            </template>
            <template v-else>
              <div class="placeholder-icon-container">
                <i class="bi bi-question-octagon placeholder-icon"></i>
              </div>
            </template>
            <div class="dish-price">${{ formatPrice(dish.basePrice) }}</div>
          </div>

          <div class="card-body">
            <h5 class="card-title mb-2">{{ dish.name }}</h5>

            <div class="mb-3">
              <div class="text-muted small" v-if="dish.description">
                {{ truncateDescription(dish.description) }}
              </div>
              <div class="text-muted small fst-italic" v-else>無說明</div>
            </div>

            <div class="d-flex flex-wrap">
              <span v-for="tag in dish.tags" :key="tag" class="badge bg-info me-1 mb-1">
                {{ tag }}
              </span>
              <span class="badge bg-secondary me-1 mb-1" v-if="hasOptions(dish)">
                <i class="bi bi-list-check me-1"></i>{{ countOptions(dish) }} 種選項
              </span>
            </div>
          </div>

          <div class="card-footer bg-transparent border-top-0">
            <div class="d-flex flex-wrap">
              <div class="btn-group mb-2 me-2">
                <router-link
                  :to="`/admin/${brandId}/dishes/template/detail/${dish._id}`"
                  class="btn btn-outline-primary btn-sm"
                >
                  <i class="bi bi-eye me-1"></i>查看
                </router-link>
                <router-link
                  :to="`/admin/${brandId}/dishes/template/edit/${dish._id}`"
                  class="btn btn-outline-primary btn-sm"
                >
                  <i class="bi bi-pencil me-1"></i>編輯
                </router-link>
              </div>

              <button class="btn btn-sm btn-outline-danger mb-2" @click="confirmDelete(dish)">
                <i class="bi bi-trash me-1"></i>刪除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 無資料提示 -->
      <div class="col-12" v-if="dishes.length === 0 && !isLoading">
        <div class="alert alert-info text-center py-4">
          <i class="bi bi-info-circle me-2 fs-4"></i>
          <p class="mb-0">
            {{ searchQuery || filterTag ? '沒有符合搜尋條件的餐點' : '尚未創建任何餐點' }}
          </p>
          <div class="mt-3" v-if="!searchQuery && !filterTag">
            <router-link :to="`/admin/${brandId}/dishes/template/create`" class="btn btn-primary">
              <i class="bi bi-plus-lg me-1"></i>新增第一個餐點
            </router-link>
          </div>
        </div>
      </div>

      <!-- 加載中提示 -->
      <div class="col-12" v-if="isLoading">
        <div class="d-flex justify-content-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">加載中...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分頁控制 -->
    <nav aria-label="餐點列表分頁" class="mt-4" v-if="pagination.totalPages > 1">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">上一頁</a>
        </li>

        <li
          class="page-item"
          v-for="page in getPageNumbers()"
          :key="page"
          :class="{ active: currentPage === page }"
        >
          <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
        </li>

        <li class="page-item" :class="{ disabled: currentPage === pagination.totalPages }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">下一頁</a>
        </li>
      </ul>
    </nav>

    <!-- 確認刪除對話框 -->
    <div
      class="modal fade"
      id="deleteConfirmModal"
      tabindex="-1"
      aria-labelledby="deleteConfirmModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteConfirmModalLabel">確認刪除</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body" v-if="dishToDelete">
            <!-- 錯誤訊息顯示區域 -->
            <div class="alert alert-danger" v-if="deleteError">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              {{ deleteError }}
            </div>
            <p>
              確定要刪除餐點 <strong>{{ dishToDelete.name }}</strong> 嗎？
            </p>
            <div class="alert alert-warning">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              此操作無法撤銷，刪除後將無法復原！
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteDish" :disabled="isDeleting">
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
import api from '@/api'

// 從路由中獲取品牌ID
const route = useRoute()
const brandId = computed(() => route.params.brandId)

// 狀態變數
const dishes = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const filterTag = ref('')
const currentPage = ref(1)
const errorMessage = ref('')
const deleteModal = ref(null)
const dishToDelete = ref(null)
const isDeleting = ref(false)
const deleteError = ref('')
const availableTags = ref([])

const pagination = reactive({
  total: 0,
  totalPages: 0,
  limit: 12,
})

// 格式化價格
const formatPrice = (price) => {
  return price.toLocaleString('zh-TW')
}

// 截斷描述
const truncateDescription = (description) => {
  if (!description) return ''
  return description.length > 50 ? description.substring(0, 50) + '...' : description
}

// 檢查是否有選項類別
const hasOptions = (dish) => {
  return dish.optionCategories && dish.optionCategories.length > 0
}

// 計算選項類別數量
const countOptions = (dish) => {
  return dish.optionCategories ? dish.optionCategories.length : 0
}

// 頁碼生成
const getPageNumbers = () => {
  const totalPages = pagination.totalPages
  const currentPageNum = currentPage.value
  const pageNumbers = []

  // 顯示最多 5 個頁碼
  if (totalPages <= 5) {
    // 若總頁數少於 5，顯示全部頁碼
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i)
    }
  } else {
    // 若總頁數大於 5，顯示當前頁附近的頁碼
    if (currentPageNum <= 3) {
      // 當前頁在前 3 頁，顯示前 5 頁
      for (let i = 1; i <= 5; i++) {
        pageNumbers.push(i)
      }
    } else if (currentPageNum >= totalPages - 2) {
      // 當前頁在後 3 頁，顯示後 5 頁
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // 當前頁在中間，顯示當前頁及其前後 2 頁
      for (let i = currentPageNum - 2; i <= currentPageNum + 2; i++) {
        pageNumbers.push(i)
      }
    }
  }

  return pageNumbers
}

// 加載餐點列表
const fetchDishes = async () => {
  if (!brandId.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    // 獲取餐點模板列表
    const response = await api.dish.getAllDishTemplates({
      brandId: brandId.value,
      query: searchQuery.value,
      tags: filterTag.value ? filterTag.value : undefined,
    })

    if (response && response.templates) {
      dishes.value = response.templates

      // 收集所有標籤
      const tagsSet = new Set()
      dishes.value.forEach((dish) => {
        if (dish.tags && dish.tags.length > 0) {
          dish.tags.forEach((tag) => tagsSet.add(tag))
        }
      })
      availableTags.value = Array.from(tagsSet)

      // 分頁處理
      pagination.total = dishes.value.length
      pagination.totalPages = Math.ceil(pagination.total / pagination.limit)

      // 如果當前頁碼超過總頁數，重置為第一頁
      if (currentPage.value > pagination.totalPages) {
        currentPage.value = 1
      }

      const start = (currentPage.value - 1) * pagination.limit
      const end = start + pagination.limit
      dishes.value = dishes.value.slice(start, end)
    }
  } catch (error) {
    console.error('獲取餐點列表失敗:', error)
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

// 切換頁碼
const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages) {
    return
  }

  currentPage.value = page
  fetchDishes()
}

// 處理搜尋
const handleSearch = () => {
  currentPage.value = 1 // 重置頁碼
  fetchDishes()
}

// 顯示刪除確認對話框
const confirmDelete = (dish) => {
  dishToDelete.value = dish
  deleteError.value = ''
  deleteModal.value.show()
}

// 刪除餐點
const deleteDish = async () => {
  if (!dishToDelete.value) return

  isDeleting.value = true
  deleteError.value = ''

  try {
    await api.dish.deleteDishTemplate({
      id: dishToDelete.value._id,
      brandId: brandId.value
    })

    // 關閉對話框
    deleteModal.value.hide()

    // 重新加載列表
    fetchDishes()
  } catch (error) {
    console.error('刪除餐點失敗:', error)
    // 顯示錯誤訊息在 modal 上
    if (error.response?.data?.message) {
      deleteError.value = error.response.data.message
    } else if (error.message) {
      deleteError.value = error.message
    } else {
      deleteError.value = '刪除餐點時發生錯誤'
    }
  } finally {
    isDeleting.value = false
  }
}

// 監聽品牌ID變化
watch(
  () => brandId.value,
  (newId, oldId) => {
    if (newId !== oldId) {
      fetchDishes()
    }
  },
)

// 生命週期鉤子
onMounted(() => {
  // 初始化刪除確認對話框
  const modalElement = document.getElementById('deleteConfirmModal')
  if (modalElement) {
    deleteModal.value = new Modal(modalElement)
  }

  // 監聽刪除對話框關閉事件
  modalElement?.addEventListener('hidden.bs.modal', () => {
    dishToDelete.value = null
  })

  // 載入餐點列表
  fetchDishes()

  // 設置刷新列表的事件監聽器
  window.addEventListener('refresh-dish-list', fetchDishes)
})
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}

/* 餐點卡片樣式 */
.dish-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

/* 圖片占位符樣式 */
.placeholder-icon-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  position: absolute;
  top: 0;
  left: 0;
}

.placeholder-icon {
  font-size: 3rem;
  color: #6c757d;
}

.dish-card .card-img-top {
  position: relative;
  width: 100%;
  /* 16:9 比例 = 9/16 = 0.5625 = 56.25% */
  padding-top: 56.25%;
  background-color: #f8f9fa;
}

.dish-card .card-img-top img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 使用 contain 避免圖片被裁切 */
  object-fit: contain;
  /* 為了較小的圖片，加入背景色 */
  background-color: #f8f9fa;
}

.dish-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.dish-price {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
}

/* 分頁樣式 */
.pagination .page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.pagination .page-link {
  color: #0d6efd;
}

.pagination .page-link:focus {
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
</style>
