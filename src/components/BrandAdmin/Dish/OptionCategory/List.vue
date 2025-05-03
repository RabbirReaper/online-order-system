<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex">
        <div class="input-group" style="width: 300px;">
          <input type="text" class="form-control" placeholder="搜尋選項類別..." v-model="searchQuery" @input="handleSearch">
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
    <div class="alert alert-danger" v-if="networkError">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ networkError }}
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
                  <span class="badge" :class="category.inputType === 'single' ? 'bg-info' : 'bg-warning'">
                    {{ category.inputType === 'single' ? '單選' : '多選' }}
                  </span>
                </td>
                <td>{{ getOptionCount(category) }}</td>
                <td>
                  <div class="btn-group">
                    <router-link :to="`/admin/${brandId}/option-categories/detail/${category._id}`"
                      class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-eye me-1"></i>查看
                    </router-link>
                    <router-link :to="`/admin/${brandId}/option-categories/edit/${category._id}`"
                      class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-pencil me-1"></i>編輯
                    </router-link>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="confirmDelete(category)">
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
    <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="categoryToDelete">
            <p>確定要刪除選項類別 <strong>{{ categoryToDelete.name }}</strong> 嗎？</p>
            <div class="alert alert-warning">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              刪除選項類別將同時刪除該類別下的所有選項關聯。此操作無法撤銷！
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteCategory" :disabled="isDeleting">
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              {{ isDeleting ? '刪除中...' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Modal } from 'bootstrap';
import api from '@/api';

// 從路由中獲取品牌ID
const route = useRoute();
const brandId = computed(() => route.params.brandId);

// 狀態變數
const categories = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const networkError = ref('');
const deleteModal = ref(null);
const categoryToDelete = ref(null);
const isDeleting = ref(false);

// 計算已過濾的類別列表
const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return categories.value;
  }

  const query = searchQuery.value.toLowerCase();
  return categories.value.filter(category =>
    category.name.toLowerCase().includes(query)
  );
});

// 獲取選項數量
const getOptionCount = (category) => {
  return category.options ? category.options.length : 0;
};

// 處理搜尋
const handleSearch = () => {
  // 實時過濾，無需額外操作
};

// 獲取選項類別列表
const fetchCategories = async () => {
  if (!brandId.value) return;

  isLoading.value = true;
  networkError.value = '';

  try {
    const response = await api.dish.getAllOptionCategories(brandId.value);
    if (response && response.categories) {
      categories.value = response.categories;
    }
  } catch (error) {
    console.error('獲取選項類別列表失敗:', error);
    networkError.value = '網路連線有問題，無法獲取選項類別資料';
  } finally {
    isLoading.value = false;
  }
};

// 顯示刪除確認對話框
const confirmDelete = (category) => {
  categoryToDelete.value = category;
  deleteModal.value.show();
};

// 刪除選項類別
const deleteCategory = async () => {
  if (!categoryToDelete.value) return;

  isDeleting.value = true;

  try {
    await api.dish.deleteOptionCategory(categoryToDelete.value._id, brandId.value);

    // 關閉對話框
    deleteModal.value.hide();

    // 從列表中移除已刪除的類別
    categories.value = categories.value.filter(
      category => category._id !== categoryToDelete.value._id
    );

    // 顯示成功通知
    alert('選項類別已成功刪除！');
  } catch (error) {
    console.error('刪除選項類別失敗:', error);
    alert('刪除選項類別時發生錯誤');
  } finally {
    isDeleting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 初始化刪除確認對話框
  const modalElement = document.getElementById('deleteConfirmModal');
  if (modalElement) {
    deleteModal.value = new Modal(modalElement);
  }

  // 載入選項類別列表
  fetchCategories();

  // 設置刷新列表的事件監聽器
  window.addEventListener('refresh-category-list', fetchCategories);
});
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
