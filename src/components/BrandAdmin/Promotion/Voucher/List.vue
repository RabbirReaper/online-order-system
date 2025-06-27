<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex">
        <div class="input-group" style="width: 300px;">
          <input type="text" class="form-control" placeholder="搜尋兌換券..." v-model="searchQuery" @input="handleSearch">
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>

        <div class="ms-2">
          <select class="form-select" v-model="filterStatus" @change="handleSearch">
            <option value="">所有狀態</option>
            <option value="active">啟用中</option>
            <option value="inactive">已停用</option>
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
        <router-link :to="`/admin/${brandId}/vouchers/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增兌換券
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

    <!-- 兌換券列表 -->
    <div class="card" v-if="!isLoading">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th>名稱</th>
                <th>圖片</th>
                <th>價格</th>
                <th>內容</th>
                <th>有效期</th>
                <th>購買限制</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="voucher in filteredVouchers" :key="voucher._id">
                <td>
                  <div>
                    <strong>{{ voucher.name }}</strong>
                    <div class="small text-muted" v-if="voucher.sellingPoint">
                      {{ voucher.sellingPoint }}
                    </div>
                  </div>
                </td>
                <td>
                  <img v-if="voucher.image?.url" :src="voucher.image.url" class="rounded"
                    style="width: 60px; height: 60px; object-fit: cover;">
                  <div v-else class="bg-light rounded d-flex align-items-center justify-content-center"
                    style="width: 60px; height: 60px;">
                    <i class="bi bi-image text-muted"></i>
                  </div>
                </td>
                <td>
                  <div>
                    <div v-if="voucher.cashPrice">
                      <strong class="text-success">${{ formatPrice(voucher.cashPrice.selling ||
                        voucher.cashPrice.original) }}</strong>
                      <span v-if="voucher.cashPrice.selling && voucher.cashPrice.selling < voucher.cashPrice.original"
                        class="text-muted text-decoration-line-through small ms-1">
                        ${{ formatPrice(voucher.cashPrice.original) }}
                      </span>
                    </div>
                    <div v-if="voucher.pointPrice" class="text-primary">
                      {{ voucher.pointPrice.selling || voucher.pointPrice.original }} 點
                    </div>
                  </div>
                </td>
                <td>
                  <div v-if="voucher.bundleItems && voucher.bundleItems.length > 0">
                    <div v-for="(item, index) in voucher.bundleItems.slice(0, 2)" :key="index" class="small">
                      {{ item.quantity }}x {{ item.couponTemplate?.name || '未知項目' }}
                    </div>
                    <div v-if="voucher.bundleItems.length > 2" class="small text-muted">
                      還有 {{ voucher.bundleItems.length - 2 }} 項...
                    </div>
                  </div>
                </td>
                <td>
                  <div v-if="voucher.validFrom && voucher.validTo">
                    <div class="small">{{ formatDate(voucher.validFrom) }}</div>
                    <div class="small text-muted">至 {{ formatDate(voucher.validTo) }}</div>
                  </div>
                  <span v-else class="text-muted">無限制</span>
                </td>
                <td>
                  <span v-if="voucher.purchaseLimitPerUser">
                    每人限購 {{ voucher.purchaseLimitPerUser }} 個
                  </span>
                  <span v-else class="text-muted">無限制</span>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(voucher)">
                    {{ getStatusText(voucher) }}
                  </span>
                </td>
                <td>
                  <div class="btn-group">
                    <router-link :to="`/admin/${brandId}/vouchers/detail/${voucher._id}`"
                      class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-eye me-1"></i>查看
                    </router-link>
                    <router-link :to="`/admin/${brandId}/vouchers/edit/${voucher._id}`"
                      class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-pencil me-1"></i>編輯
                    </router-link>
                    <button type="button" class="btn btn-sm"
                      :class="voucher.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                      @click="toggleStatus(voucher)">
                      <i class="bi bi-power me-1"></i>{{ voucher.isActive ? '停用' : '啟用' }}
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="confirmDelete(voucher)">
                      <i class="bi bi-trash me-1"></i>刪除
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredVouchers.length === 0 && !isLoading">
                <td colspan="8" class="text-center text-muted py-4">
                  <i class="bi bi-inbox display-4 d-block mb-2"></i>
                  {{ searchQuery ? '沒有符合條件的兌換券' : '尚未建立任何兌換券' }}
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
            <p v-if="voucherToToggle">
              您確定要{{ voucherToToggle.isActive ? '停用' : '啟用' }}「{{ voucherToToggle.name }}」嗎？
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="confirmToggleStatus">
              確認{{ voucherToToggle?.isActive ? '停用' : '啟用' }}
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
            <p v-if="voucherToDelete">
              您確定要刪除兌換券「{{ voucherToDelete.name }}」嗎？
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteVoucher" :disabled="isDeleting">
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

// 兌換券列表和分頁
const vouchers = ref([]);
const pagination = ref(null);
const currentPage = ref(1);
const pageLimit = ref(20);

// 對話框控制
const deleteModal = ref(null);
const statusModal = ref(null);
const voucherToDelete = ref(null);
const voucherToToggle = ref(null);

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
const getStatusBadgeClass = (voucher) => {
  if (!voucher.isActive) return 'bg-secondary';

  const now = new Date();
  if (voucher.autoStatusControl && voucher.validTo && new Date(voucher.validTo) < now) {
    return 'bg-warning';
  }

  return 'bg-success';
};

// 獲取狀態文字
const getStatusText = (voucher) => {
  if (!voucher.isActive) return '停用';

  const now = new Date();
  if (voucher.autoStatusControl && voucher.validTo && new Date(voucher.validTo) < now) {
    return '已過期';
  }

  return '啟用';
};

// 處理搜尋
const handleSearch = () => {
  currentPage.value = 1;
  fetchVouchers();
};

// 篩選後的兌換券列表
const filteredVouchers = computed(() => {
  let filtered = [...vouchers.value];

  // 搜尋過濾
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(voucher =>
      voucher.name.toLowerCase().includes(query) ||
      (voucher.description && voucher.description.toLowerCase().includes(query)) ||
      (voucher.sellingPoint && voucher.sellingPoint.toLowerCase().includes(query))
    );
  }

  // 狀態過濾
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active';
    filtered = filtered.filter(voucher => voucher.isActive === isActive);
  }

  // 付款方式過濾
  if (filterPaymentType.value) {
    filtered = filtered.filter(voucher => {
      switch (filterPaymentType.value) {
        case 'cash':
          return voucher.cashPrice && (!voucher.pointPrice);
        case 'point':
          return voucher.pointPrice && (!voucher.cashPrice);
        case 'both':
          return voucher.cashPrice && voucher.pointPrice;
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
    fetchVouchers();
  }
};

// 獲取兌換券列表
const fetchVouchers = async () => {
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
      vouchers.value = response.bundles;
      pagination.value = response.pagination;
    }
  } catch (error) {
    console.error('獲取兌換券列表失敗:', error);
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
const toggleStatus = (voucher) => {
  voucherToToggle.value = voucher;
  statusModal.value.show();
};

// 確認切換狀態
const confirmToggleStatus = async () => {
  if (!voucherToToggle.value) return;

  try {
    const newStatus = !voucherToToggle.value.isActive;
    await api.bundle.updateBundle({
      brandId: brandId.value,
      bundleId: voucherToToggle.value._id,
      data: { isActive: newStatus }
    });

    // 更新本地狀態
    voucherToToggle.value.isActive = newStatus;

    // 關閉對話框
    statusModal.value.hide();
  } catch (error) {
    console.error('切換狀態失敗:', error);
    alert('切換狀態失敗，請稍後再試');
  }
};

// 顯示刪除確認對話框
const confirmDelete = (voucher) => {
  voucherToDelete.value = voucher;
  deleteModal.value.show();
};

// 刪除兌換券
const deleteVoucher = async () => {
  if (!voucherToDelete.value) return;

  isDeleting.value = true;

  try {
    await api.bundle.deleteBundle({
      brandId: brandId.value,
      bundleId: voucherToDelete.value._id
    });

    // 關閉對話框
    deleteModal.value.hide();

    // 重新載入列表
    await fetchVouchers();
  } catch (error) {
    console.error('刪除兌換券失敗:', error);
    alert('刪除兌換券時發生錯誤');
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
      voucherToDelete.value = null;
    });
  }

  // 初始化狀態切換對話框
  const statusModalElement = document.getElementById('statusToggleModal');
  if (statusModalElement) {
    statusModal.value = new Modal(statusModalElement);
    statusModalElement.addEventListener('hidden.bs.modal', () => {
      voucherToToggle.value = null;
    });
  }

  // 載入兌換券列表
  fetchVouchers();

  // 設置刷新列表的事件監聽器
  window.addEventListener('refresh-voucher-list', fetchVouchers);
});

onUnmounted(() => {
  // 移除事件監聽器
  window.removeEventListener('refresh-voucher-list', fetchVouchers);
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
