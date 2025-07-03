<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex">
        <div class="input-group" style="width: 300px;">
          <input type="text" class="form-control" placeholder="搜尋包裝商品..." v-model="searchQuery" @input="handleSearch">
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>

        <div class="ms-2">
          <select class="form-select" v-model="filterStatus" @change="handleSearch">
            <option value="">所有狀態</option>
            <option value="active">啟用中</option>
            <option value="inactive">已停用</option>
            <option value="expired">已過期</option>
          </select>
        </div>

        <div class="ms-2">
          <select class="form-select" v-model="filterPaymentType" @change="handleSearch">
            <option value="">所有付款方式</option>
            <option value="cash">現金購買</option>
            <option value="point">點數兌換</option>
            <option value="both">兩者皆可</option>
          </select>
        </div>
      </div>

      <div>
        <router-link :to="`/admin/${brandId}/bundles/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增包裝商品
        </router-link>
      </div>
    </div>

    <!-- 網路錯誤提示 -->
    <div class="alert alert-danger" v-if="errorMessage">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
    </div>

    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 包裝商品列表 -->
    <div class="card" v-if="!isLoading">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th>商品名稱</th>
                <th>圖片</th>
                <th>價格</th>
                <th>包裝內容</th>
                <th>販售期間</th>
                <th>已售出</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bundle in filteredBundles" :key="bundle._id">
                <td>
                  <div>
                    <strong>{{ bundle.name }}</strong>
                    <div class="small text-muted" v-if="bundle.sellingPoint">
                      <i class="bi bi-star-fill text-warning me-1"></i>{{ bundle.sellingPoint }}
                    </div>
                    <div class="small text-muted" v-if="bundle.description">
                      {{ bundle.description }}
                    </div>
                  </div>
                </td>
                <td>
                  <img v-if="bundle.image?.url" :src="bundle.image.url" class="rounded"
                    style="width: 60px; height: 60px; object-fit: cover;">
                  <div v-else class="bg-light rounded d-flex align-items-center justify-content-center"
                    style="width: 60px; height: 60px;">
                    <i class="bi bi-image text-muted"></i>
                  </div>
                </td>
                <td>
                  <div>
                    <div v-if="bundle.cashPrice">
                      <strong class="text-success">${{ formatPrice(bundle.cashPrice.selling ||
                        bundle.cashPrice.original) }}</strong>
                      <span v-if="bundle.cashPrice.selling && bundle.cashPrice.selling < bundle.cashPrice.original"
                        class="text-muted text-decoration-line-through small ms-1">
                        ${{ formatPrice(bundle.cashPrice.original) }}
                      </span>
                    </div>
                    <div v-if="bundle.pointPrice" class="text-primary">
                      {{ bundle.pointPrice.selling || bundle.pointPrice.original }} 點
                      <span v-if="bundle.pointPrice.selling && bundle.pointPrice.selling < bundle.pointPrice.original"
                        class="text-muted text-decoration-line-through small ms-1">
                        {{ bundle.pointPrice.original }} 點
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div v-if="bundle.bundleItems && bundle.bundleItems.length > 0">
                    <div v-for="(item, index) in bundle.bundleItems.slice(0, 2)" :key="index" class="small">
                      {{ item.quantity }}x {{ item.voucherName || '兌換券' }}
                    </div>
                    <div v-if="bundle.bundleItems.length > 2" class="small text-muted">
                      還有 {{ bundle.bundleItems.length - 2 }} 項...
                    </div>
                  </div>
                  <span v-else class="text-muted small">未設定</span>
                </td>
                <td>
                  <div v-if="bundle.validFrom && bundle.validTo">
                    <div class="small">{{ formatDate(bundle.validFrom) }}</div>
                    <div class="small text-muted">至 {{ formatDate(bundle.validTo) }}</div>
                  </div>
                  <span v-else class="text-muted">無限制</span>
                </td>
                <td>
                  <span class="badge bg-info">{{ bundle.totalSold || 0 }}</span>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(bundle)">
                    {{ getStatusText(bundle) }}
                  </span>
                  <div v-if="bundle.autoStatusControl" class="small text-muted mt-1">
                    <i class="bi bi-clock"></i> 自動控制
                  </div>
                </td>
                <td>
                  <div class="btn-group">
                    <router-link :to="`/admin/${brandId}/bundles/detail/${bundle._id}`"
                      class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-eye me-1"></i>查看
                    </router-link>
                    <router-link :to="`/admin/${brandId}/bundles/edit/${bundle._id}`"
                      class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-pencil me-1"></i>編輯
                    </router-link>
                    <button type="button" class="btn btn-sm"
                      :class="bundle.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                      @click="toggleStatus(bundle)">
                      <i class="bi bi-power me-1"></i>{{ bundle.isActive ? '停用' : '啟用' }}
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="confirmDelete(bundle)">
                      <i class="bi bi-trash me-1"></i>刪除
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredBundles.length === 0 && !isLoading">
                <td colspan="8" class="text-center text-muted py-4">
                  <i class="bi bi-inbox display-4 d-block mb-2"></i>
                  {{ searchQuery ? '沒有符合條件的包裝商品' : '尚未建立任何包裝商品' }}
                  <div class="mt-3" v-if="!searchQuery && bundles.length === 0">
                    <router-link :to="`/admin/${brandId}/bundles/create`" class="btn btn-primary">
                      <i class="bi bi-plus-lg me-1"></i>建立第一個包裝商品
                    </router-link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 分頁控制 -->
    <nav v-if="pagination && pagination.totalPages > 1" class="mt-3">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: !pagination.hasPrevPage }">
          <button class="page-link" @click="changePage(pagination.currentPage - 1)" :disabled="!pagination.hasPrevPage">
            上一頁
          </button>
        </li>
        <li v-for="page in getPageNumbers()" :key="page" class="page-item"
          :class="{ active: page === pagination.currentPage }">
          <button class="page-link" @click="changePage(page)">{{ page }}</button>
        </li>
        <li class="page-item" :class="{ disabled: !pagination.hasNextPage }">
          <button class="page-link" @click="changePage(pagination.currentPage + 1)" :disabled="!pagination.hasNextPage">
            下一頁
          </button>
        </li>
      </ul>
    </nav>

    <!-- 狀態切換確認對話框 -->
    <div class="modal fade" id="statusToggleModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認操作</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p v-if="bundleToToggle">
              您確定要{{ bundleToToggle.isActive ? '停用' : '啟用' }}「{{ bundleToToggle.name }}」嗎？
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="confirmToggleStatus">
              確認{{ bundleToToggle?.isActive ? '停用' : '啟用' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>警告：</strong>此操作無法復原
            </div>
            <p v-if="bundleToDelete">
              您確定要刪除包裝商品「{{ bundleToDelete.name }}」嗎？
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteBundle" :disabled="isDeleting">
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1"></span>
              {{ isDeleting ? '刪除中...' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { Modal } from 'bootstrap';
import api from '@/api';

// 路由
const route = useRoute();

// 從路由中獲取品牌ID
const brandId = computed(() => route.params.brandId);

// 狀態
const isLoading = ref(false);
const isDeleting = ref(false);
const errorMessage = ref('');

// 搜尋和篩選
const searchQuery = ref('');
const filterStatus = ref('');
const filterPaymentType = ref('');

// 包裝商品列表和分頁
const bundles = ref([]);
const pagination = ref(null);
const currentPage = ref(1);
const pageLimit = ref(20);

// 對話框控制
const deleteModal = ref(null);
const statusModal = ref(null);
const bundleToDelete = ref(null);
const bundleToToggle = ref(null);

// 格式化價格
const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0';
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW');
};

// 獲取狀態徽章樣式
const getStatusBadgeClass = (bundle) => {
  if (!bundle.isActive) return 'bg-secondary';

  const now = new Date();
  if (bundle.autoStatusControl && bundle.validTo && new Date(bundle.validTo) < now) {
    return 'bg-warning';
  }

  return 'bg-success';
};

// 獲取狀態文字
const getStatusText = (bundle) => {
  if (!bundle.isActive) return '停用';

  const now = new Date();
  if (bundle.autoStatusControl && bundle.validTo && new Date(bundle.validTo) < now) {
    return '已過期';
  }

  return '啟用';
};

// 處理搜尋
const handleSearch = () => {
  currentPage.value = 1;
  fetchBundles();
};

// 篩選後的包裝商品列表
const filteredBundles = computed(() => {
  let filtered = [...bundles.value];

  // 搜尋過濾
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(bundle =>
      bundle.name.toLowerCase().includes(query) ||
      (bundle.description && bundle.description.toLowerCase().includes(query)) ||
      (bundle.sellingPoint && bundle.sellingPoint.toLowerCase().includes(query))
    );
  }

  // 狀態過濾
  if (filterStatus.value) {
    const now = new Date();
    filtered = filtered.filter(bundle => {
      switch (filterStatus.value) {
        case 'active':
          return bundle.isActive && (!bundle.autoStatusControl || !bundle.validTo || new Date(bundle.validTo) >= now);
        case 'inactive':
          return !bundle.isActive;
        case 'expired':
          return bundle.autoStatusControl && bundle.validTo && new Date(bundle.validTo) < now;
        default:
          return true;
      }
    });
  }

  // 付款方式過濾
  if (filterPaymentType.value) {
    filtered = filtered.filter(bundle => {
      switch (filterPaymentType.value) {
        case 'cash':
          return bundle.cashPrice && (!bundle.pointPrice);
        case 'point':
          return bundle.pointPrice && (!bundle.cashPrice);
        case 'both':
          return bundle.cashPrice && bundle.pointPrice;
        default:
          return true;
      }
    });
  }

  return filtered;
});

// 獲取分頁頁碼
const getPageNumbers = () => {
  if (!pagination.value) return [];

  const { currentPage, totalPages } = pagination.value;
  const pages = [];
  const maxPagesToShow = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
};

// 更改頁面
const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages && page !== currentPage.value) {
    currentPage.value = page;
    fetchBundles();
  }
};

// 獲取包裝商品列表
const fetchBundles = async () => {
  if (!brandId.value) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.bundle.getAllBundles({
      brandId: brandId.value,
      includeInactive: true,
      page: currentPage.value,
      limit: pageLimit.value
    });

    if (response && response.bundles) {
      bundles.value = response.bundles;
      pagination.value = response.pagination;
    }
  } catch (error) {
    console.error('獲取包裝商品列表失敗:', error);
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else if (error.message) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = '無法連接到伺服器，請檢查網路連線';
    }
  } finally {
    isLoading.value = false;
  }
};

// 顯示狀態切換確認對話框
const toggleStatus = (bundle) => {
  bundleToToggle.value = bundle;
  statusModal.value.show();
};

// 確認切換狀態
const confirmToggleStatus = async () => {
  if (!bundleToToggle.value) return;

  try {
    const newStatus = !bundleToToggle.value.isActive;
    // 🔧 修正：參數名從 bundleId 改為 id
    await api.bundle.updateBundle({
      brandId: brandId.value,
      id: bundleToToggle.value._id,
      data: { isActive: newStatus }
    });

    // 更新本地狀態
    bundleToToggle.value.isActive = newStatus;

    // 關閉對話框
    statusModal.value.hide();
  } catch (error) {
    console.error('切換狀態失敗:', error);
    alert('切換狀態失敗，請稍後再試');
  }
};

// 顯示刪除確認對話框
const confirmDelete = (bundle) => {
  bundleToDelete.value = bundle;
  deleteModal.value.show();
};

// 刪除包裝商品
const deleteBundle = async () => {
  if (!bundleToDelete.value) return;

  isDeleting.value = true;

  try {
    // 🔧 修正：參數名從 bundleId 改為 id
    await api.bundle.deleteBundle({
      brandId: brandId.value,
      id: bundleToDelete.value._id
    });

    // 關閉對話框
    deleteModal.value.hide();

    // 重新載入列表
    await fetchBundles();
  } catch (error) {
    console.error('刪除包裝商品失敗:', error);
    alert('刪除包裝商品時發生錯誤');
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
    modalElement.addEventListener('hidden.bs.modal', () => {
      bundleToDelete.value = null;
    });
  }

  // 初始化狀態切換對話框
  const statusModalElement = document.getElementById('statusToggleModal');
  if (statusModalElement) {
    statusModal.value = new Modal(statusModalElement);
    statusModalElement.addEventListener('hidden.bs.modal', () => {
      bundleToToggle.value = null;
    });
  }

  // 載入包裝商品列表
  fetchBundles();

  // 設置刷新列表的事件監聽器
  window.addEventListener('refresh-bundle-list', fetchBundles);
});

onUnmounted(() => {
  // 移除事件監聽器
  window.removeEventListener('refresh-bundle-list', fetchBundles);
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

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}

.pagination .page-link {
  color: #0d6efd;
}

.pagination .page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}
</style>
