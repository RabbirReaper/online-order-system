<template>
  <div>
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">庫存變更記錄</h4>
      <div class="d-flex gap-2">
        <!-- 篩選按鈕 -->
        <div class="dropdown">
          <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            <i class="bi bi-filter me-1"></i>篩選
          </button>
          <div class="dropdown-menu p-3" style="min-width: 350px;">
            <!-- 日期範圍 -->
            <div class="mb-3">
              <label class="form-label">日期範圍</label>
              <div class="row g-2">
                <div class="col-6">
                  <input type="date" v-model="filters.startDate" class="form-control" @change="applyFilters">
                </div>
                <div class="col-6">
                  <input type="date" v-model="filters.endDate" class="form-control" @change="applyFilters">
                </div>
              </div>
            </div>

            <!-- 庫存類型 -->
            <div class="mb-3">
              <label class="form-label">庫存類型</label>
              <select v-model="filters.inventoryType" class="form-select" @change="applyFilters">
                <option value="">全部類型</option>
                <option value="dish">餐點</option>
                <option value="else">其他</option>
              </select>
            </div>

            <!-- 庫存變更類型 -->
            <div class="mb-3">
              <label class="form-label">庫存變更類型</label>
              <select v-model="filters.stockType" class="form-select" @change="applyFilters">
                <option value="">全部類型</option>
                <option value="warehouseStock">倉庫庫存</option>
                <option value="availableStock">可販售庫存</option>
              </select>
            </div>

            <!-- 變更原因 -->
            <div class="mb-3">
              <label class="form-label">變更原因</label>
              <select v-model="filters.changeType" class="form-select" @change="applyFilters">
                <option value="">全部原因</option>
                <option value="manual_add">手動新增</option>
                <option value="manual_subtract">手動減少</option>
                <option value="order">訂單消耗</option>
                <option value="system_adjustment">系統調整</option>
                <option value="initial_stock">初始庫存</option>
                <option value="restock">進貨</option>
                <option value="damage">損耗</option>
              </select>
            </div>

            <button class="btn btn-sm btn-secondary w-100" @click="resetFilters">重置篩選</button>
          </div>
        </div>

        <!-- 搜尋框 -->
        <div class="input-group" style="width: 300px;">
          <input type="text" class="form-control" placeholder="搜尋項目名稱..." v-model="searchQuery" @input="handleSearch">
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>

        <!-- 匯出按鈕 -->
        <button class="btn btn-outline-primary" @click="exportLogs">
          <i class="bi bi-download me-1"></i>匯出
        </button>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div class="alert alert-danger" v-if="error">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 日誌列表 -->
    <div class="card" v-if="!isLoading">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>時間</th>
                <th>類型</th>
                <th>項目名稱</th>
                <th>庫存類型</th>
                <th>變更前</th>
                <th>變更後</th>
                <th>變化量</th>
                <th>變更原因</th>
                <th>操作人員</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in stockLogs" :key="log._id">
                <td>{{ formatDateTime(log.createdAt) }}</td>
                <td>
                  <span class="badge" :class="log.inventoryType === 'dish' ? 'bg-info' : 'bg-secondary'">
                    {{ log.inventoryType === 'dish' ? '餐點' : '其他' }}
                  </span>
                </td>
                <td>{{ log.itemName }}</td>
                <td>
                  <span class="badge" :class="log.stockType === 'warehouseStock' ? 'bg-primary' : 'bg-success'">
                    {{ log.stockType === 'warehouseStock' ? '倉庫' : '可販售' }}
                  </span>
                </td>
                <td>{{ log.previousStock }}</td>
                <td>{{ log.newStock }}</td>
                <td>
                  <span :class="log.changeAmount > 0 ? 'text-success' : 'text-danger'">
                    {{ log.changeAmount > 0 ? '+' : '' }}{{ log.changeAmount }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="getChangeTypeBadgeClass(log.changeType)">
                    {{ getChangeTypeText(log.changeType) }}
                  </span>
                </td>
                <td>{{ log.admin?.name || '-' }}</td>
                <td>
                  <span v-if="log.reason" class="text-muted small">{{ log.reason }}</span>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>

              <!-- 無資料提示 -->
              <tr v-if="stockLogs.length === 0">
                <td colspan="10" class="text-center py-4">
                  <div class="text-muted">
                    {{ searchQuery || hasActiveFilters() ? '沒有符合條件的記錄' : '暫無庫存變更記錄' }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 分頁控制 -->
    <nav v-if="pagination.totalPages > 1" class="mt-4">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">上一頁</a>
        </li>
        <li class="page-item" v-for="page in visiblePages" :key="page" :class="{ active: currentPage === page }">
          <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === pagination.totalPages }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">下一頁</a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api';

// 路由
const route = useRoute();
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.query.storeId || route.params.storeId);
const itemId = computed(() => route.query.itemId);

// 狀態
const isLoading = ref(true);
const error = ref('');
const stockLogs = ref([]);
const searchQuery = ref('');
const currentPage = ref(1);

// 篩選條件
const filters = reactive({
  startDate: '',
  endDate: '',
  inventoryType: '',
  stockType: '',
  changeType: ''
});

// 分頁
const pagination = reactive({
  total: 0,
  totalPages: 0,
  limit: 20
});

// 計算可見頁碼
const visiblePages = computed(() => {
  const total = pagination.totalPages;
  const current = currentPage.value;
  const pages = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    }
  }

  return pages;
});

// 格式化日期時間
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 獲取變更類型文字
const getChangeTypeText = (type) => {
  const types = {
    'manual_add': '手動新增',
    'manual_subtract': '手動減少',
    'order': '訂單消耗',
    'system_adjustment': '系統調整',
    'initial_stock': '初始庫存',
    'restock': '進貨',
    'damage': '損耗'
  };
  return types[type] || type;
};

// 獲取變更類型徽章樣式
const getChangeTypeBadgeClass = (type) => {
  const classes = {
    'manual_add': 'bg-success',
    'manual_subtract': 'bg-warning',
    'order': 'bg-info',
    'system_adjustment': 'bg-secondary',
    'initial_stock': 'bg-primary',
    'restock': 'bg-success',
    'damage': 'bg-danger'
  };
  return classes[type] || 'bg-secondary';
};

// 檢查是否有啟用的篩選條件
const hasActiveFilters = () => {
  return filters.startDate || filters.endDate || filters.inventoryType ||
    filters.stockType || filters.changeType;
};

// 獲取庫存日誌
const fetchStockLogs = async () => {
  // 如果沒有有效的 storeId，跳過請求
  if (!storeId.value) {
    error.value = '請選擇店鋪';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const params = {
      storeId: storeId.value,
      page: currentPage.value,
      limit: pagination.limit
    };

    // 如果有指定項目ID
    if (itemId.value) {
      params.itemId = itemId.value;
    }

    // 搜尋關鍵字
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    // 應用篩選條件
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.inventoryType) params.inventoryType = filters.inventoryType;
    if (filters.stockType) params.stockType = filters.stockType;
    if (filters.changeType) params.changeType = filters.changeType;

    const response = await api.inventory.getInventoryLogs(params);

    stockLogs.value = response.logs;
    pagination.total = response.total;
    pagination.totalPages = response.totalPages;
  } catch (err) {
    console.error('獲取庫存日誌失敗:', err);

    // 更詳細的錯誤處理
    if (err.response?.status === 500) {
      error.value = '服務器錯誤：無法獲取庫存日誌。請確認後端 API 路由配置正確。';
    } else if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = '獲取庫存日誌時發生未知錯誤';
    }

    // 設置預設值
    stockLogs.value = [];
    pagination.total = 0;
    pagination.totalPages = 1;
  } finally {
    isLoading.value = false;
  }
};

// 搜尋處理
const handleSearch = () => {
  currentPage.value = 1;
  fetchStockLogs();
};

// 應用篩選
const applyFilters = () => {
  currentPage.value = 1;
  fetchStockLogs();
};

// 重置篩選
const resetFilters = () => {
  filters.startDate = '';
  filters.endDate = '';
  filters.inventoryType = '';
  filters.stockType = '';
  filters.changeType = '';
  currentPage.value = 1;
  fetchStockLogs();
};

// 換頁
const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages || page === '...') return;
  currentPage.value = page;
  fetchStockLogs();
};

// 匯出日誌
const exportLogs = async () => {
  try {
    // TODO: 實作匯出功能
    // 可以將日誌數據匯出為 CSV 或 Excel 格式
    console.log('匯出日誌功能待實作');
    alert('匯出功能尚未實作');
  } catch (err) {
    console.error('匯出失敗:', err);
    alert('匯出日誌時發生錯誤');
  }
};

// 生命週期
onMounted(() => {
  // 只有在有有效的 storeId 時才獲取日誌
  if (storeId.value) {
    fetchStockLogs();
  } else {
    isLoading.value = false;
    error.value = '請選擇店鋪以查看庫存變更記錄';
  }
});
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.table th {
  font-weight: 600;
  background-color: #f8f9fa;
  white-space: nowrap;
}

.table td {
  vertical-align: middle;
}

.dropdown-menu {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.badge {
  font-weight: 500;
}
</style>
