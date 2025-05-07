<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex align-items-center">
        <router-link :to="`/admin/${brandId}/inventory`" class="btn btn-outline-secondary me-3">
          <i class="bi bi-arrow-left"></i>
        </router-link>
        <h4 class="mb-0">{{ storeName }} - 庫存管理</h4>
      </div>
      <div class="d-flex gap-2">
        <!-- 新增按鈕組 -->
        <div class="btn-group">
          <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
            <i class="bi bi-plus-lg me-1"></i>新增庫存
          </button>
          <ul class="dropdown-menu">
            <li>
              <button class="dropdown-item" @click="openInitializeModal">
                <i class="bi bi-box-seam me-2"></i>初始化餐點庫存
              </button>
            </li>
            <li>
              <button class="dropdown-item" @click="openCreateModal">
                <i class="bi bi-plus-circle me-2"></i>新增自訂義庫存
              </button>
            </li>
          </ul>
        </div>

        <!-- 原有的篩選和搜尋按鈕 -->
        <div class="dropdown">
          <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            <i class="bi bi-filter me-1"></i>篩選
          </button>
          <div class="dropdown-menu p-3" style="min-width: 300px;">
            <!-- 庫存類型篩選 -->
            <div class="mb-3">
              <label class="form-label">庫存類型</label>
              <select v-model="filters.inventoryType" class="form-select" @change="applyFilters">
                <option value="">全部類型</option>
                <option value="dish">餐點</option>
                <option value="else">其他</option>
              </select>
            </div>

            <!-- 庫存狀態篩選 -->
            <div class="mb-3">
              <label class="form-label">庫存狀態</label>
              <select v-model="filters.status" class="form-select" @change="applyFilters">
                <option value="">全部狀態</option>
                <option value="normal">正常</option>
                <option value="low">低庫存</option>
                <option value="out">缺貨</option>
                <option value="overstock">庫存過多</option>
              </select>
            </div>

            <!-- 追蹤狀態篩選 -->
            <div class="mb-3">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="filters.onlyTracked" id="onlyTracked"
                  @change="applyFilters">
                <label class="form-check-label" for="onlyTracked">
                  只顯示追蹤庫存的項目
                </label>
              </div>
            </div>

            <button class="btn btn-sm btn-secondary w-100" @click="resetFilters">重置篩選</button>
          </div>
        </div>

        <div class="input-group" style="width: 300px;">
          <input type="text" class="form-control" placeholder="搜尋項目名稱..." v-model="searchQuery" @input="handleSearch">
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 統計卡片 -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <h6 class="card-title">總項目數</h6>
            <h3 class="mb-0">{{ stats.totalItems }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-white">
          <div class="card-body">
            <h6 class="card-title">低庫存</h6>
            <h3 class="mb-0">{{ stats.lowStock }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-danger text-white">
          <div class="card-body">
            <h6 class="card-title">缺貨</h6>
            <h3 class="mb-0">{{ stats.outOfStock }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body">
            <h6 class="card-title">庫存過多</h6>
            <h3 class="mb-0">{{ stats.overStock }}</h3>
          </div>
        </div>
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

    <!-- 庫存列表 -->
    <div class="card" v-if="!isLoading">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>類型</th>
                <th>項目名稱</th>
                <th>倉庫庫存</th>
                <th>可販售庫存</th>
                <th>狀態</th>
                <th>最低警告值</th>
                <th>最高限制</th>
                <th>顯示給客人</th>
                <th width="150">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in inventories" :key="item._id" :class="getRowClass(item)">
                <td>
                  <span class="badge" :class="item.inventoryType === 'dish' ? 'bg-info' : 'bg-secondary'">
                    {{ item.inventoryType === 'dish' ? '餐點' : '其他' }}
                  </span>
                </td>
                <td>{{ item.itemName }}</td>
                <td>
                  <strong>{{ item.warehouseStock }}</strong>
                </td>
                <td>
                  <strong>{{ item.availableStock }}</strong>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(item)">
                    {{ getStatusText(item) }}
                  </span>
                </td>
                <td>{{ item.minStockAlert }}</td>
                <td>{{ item.maxStockLimit || '-' }}</td>
                <td>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" :checked="item.showAvailableStockToCustomer"
                      disabled>
                  </div>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" @click="openAdjustModal(item)">
                      <i class="bi bi-pencil"></i> 調整
                    </button>
                    <router-link
                      :to="`/admin/${brandId}/inventory/store/${storeId}/detail/${item._id}?type=${item.inventoryType}`"
                      class="btn btn-outline-secondary">
                      <i class="bi bi-eye"></i> 詳情
                    </router-link>
                  </div>
                </td>
              </tr>

              <!-- 無資料提示 -->
              <tr v-if="!inventories || inventories.length === 0">
                <td colspan="9" class="text-center py-4">
                  <div class="text-muted">
                    {{ searchQuery ? '沒有符合搜尋條件的庫存項目' : '尚未建立任何庫存項目' }}
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

    <!-- 初始化餐點庫存 Modal -->
    <InitializeDishInventoryModal v-if="showInitializeModal" :store-id="storeId" :brand-id="brandId"
      @close="showInitializeModal = false" @success="handleInitializeSuccess" />

    <!-- 新增自訂義庫存 Modal -->
    <CreateInventoryModal v-if="showCreateModal" :store-id="storeId" :brand-id="brandId"
      @close="showCreateModal = false" @success="handleCreateSuccess" />

    <!-- 庫存調整 Modal -->
    <StockAdjustModal v-if="showAdjustModal" :item="selectedItem" :store-id="storeId" :brand-id="brandId"
      @close="showAdjustModal = false" @success="handleAdjustSuccess" />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api';
import InitializeDishInventoryModal from './InitializeDishInventoryModal.vue';
import CreateInventoryModal from './CreateInventoryModal.vue';
import StockAdjustModal from './StockAdjustModal.vue';

// 路由
const route = useRoute();
const router = useRouter();
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);

// 狀態
const isLoading = ref(true);
const error = ref('');
const inventories = ref([]);
const searchQuery = ref('');
const currentPage = ref(1);
const storeName = ref('');

// Modal 狀態
const showInitializeModal = ref(false);
const showCreateModal = ref(false);
const showAdjustModal = ref(false);
const selectedItem = ref(null);

// 篩選條件
const filters = reactive({
  inventoryType: '',
  status: '',
  onlyTracked: false
});

// 分頁
const pagination = reactive({
  total: 0,
  totalPages: 0,
  limit: 20
});

// 統計數據
const stats = ref({
  totalItems: 0,
  lowStock: 0,
  outOfStock: 0,
  overStock: 0
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

// Modal 操作方法
const openInitializeModal = () => {
  showInitializeModal.value = true;
};

const openCreateModal = () => {
  showCreateModal.value = true;
};

const openAdjustModal = (item) => {
  selectedItem.value = item;
  showAdjustModal.value = true;
};

const handleInitializeSuccess = () => {
  showInitializeModal.value = false;
  fetchInventory();
};

const handleCreateSuccess = () => {
  showCreateModal.value = false;
  fetchInventory();
};

const handleAdjustSuccess = () => {
  showAdjustModal.value = false;
  selectedItem.value = null;
  fetchInventory();
};

// 庫存狀態相關方法
const getStatusText = (item) => {
  if (!item.isInventoryTracked) return '不追蹤';
  if (item.availableStock === 0) return '缺貨';
  if (item.availableStock <= item.minStockAlert) return '低庫存';
  if (item.maxStockLimit && item.warehouseStock > item.maxStockLimit) return '庫存過多';
  return '正常';
};

const getStatusBadgeClass = (item) => {
  const status = getStatusText(item);
  switch (status) {
    case '缺貨': return 'bg-danger';
    case '低庫存': return 'bg-warning';
    case '庫存過多': return 'bg-info';
    case '不追蹤': return 'bg-secondary';
    default: return 'bg-success';
  }
};

const getRowClass = (item) => {
  const status = getStatusText(item);
  if (status === '缺貨') return 'table-danger';
  if (status === '低庫存') return 'table-warning';
  return '';
};

// 獲取庫存列表
const fetchInventory = async () => {
  if (!storeId.value) {
    error.value = '請選擇店鋪';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const params = {
      storeId: storeId.value,
      search: searchQuery.value,
      page: currentPage.value,
      limit: pagination.limit
    };

    if (filters.inventoryType) {
      params.inventoryType = filters.inventoryType;
    }

    if (filters.onlyTracked) {
      params.onlyTracked = true;
    }

    const response = await api.inventory.getStoreInventory(params);

    if (response && response.inventory) {
      inventories.value = response.inventory;
      pagination.total = response.total || response.inventory.length;
      pagination.totalPages = response.totalPages || Math.ceil(pagination.total / pagination.limit);

      if (filters.status) {
        inventories.value = inventories.value.filter(item => {
          const status = getStatusText(item);
          switch (filters.status) {
            case 'normal': return status === '正常';
            case 'low': return status === '低庫存';
            case 'out': return status === '缺貨';
            case 'overstock': return status === '庫存過多';
            default: return true;
          }
        });
      }

      updateStats();
    } else {
      inventories.value = [];
      pagination.total = 0;
      pagination.totalPages = 1;
      stats.value = {
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        overStock: 0
      };
    }
  } catch (err) {
    console.error('獲取庫存列表失敗:', err);
    error.value = err.response?.data?.message || '獲取庫存列表時發生錯誤';
    inventories.value = [];
    pagination.total = 0;
    pagination.totalPages = 1;
    stats.value = {
      totalItems: 0,
      lowStock: 0,
      outOfStock: 0,
      overStock: 0
    };
  } finally {
    isLoading.value = false;
  }
};

// 更新統計數據
const updateStats = () => {
  if (!inventories.value || !Array.isArray(inventories.value)) {
    stats.value = {
      totalItems: 0,
      lowStock: 0,
      outOfStock: 0,
      overStock: 0
    };
    return;
  }

  stats.value = {
    totalItems: inventories.value.length,
    lowStock: inventories.value.filter(item => getStatusText(item) === '低庫存').length,
    outOfStock: inventories.value.filter(item => getStatusText(item) === '缺貨').length,
    overStock: inventories.value.filter(item => getStatusText(item) === '庫存過多').length
  };
};

// 搜尋處理
const handleSearch = () => {
  currentPage.value = 1;
  fetchInventory();
};

// 篩選操作
const applyFilters = () => {
  currentPage.value = 1;
  fetchInventory();
};

const resetFilters = () => {
  filters.inventoryType = '';
  filters.status = '';
  filters.onlyTracked = false;
  currentPage.value = 1;
  fetchInventory();
};

// 換頁
const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages || page === '...') return;
  currentPage.value = page;
  fetchInventory();
};

// 獲取店鋪資訊
const fetchStoreInfo = async () => {
  if (!storeId.value) return;

  try {
    const response = await api.store.getStoreById(storeId.value);
    if (response && response.store) {
      storeName.value = response.store.name;
    }
  } catch (err) {
    console.error('獲取店鋪資訊失敗:', err);
  }
};

// 生命週期
onMounted(() => {
  fetchStoreInfo();
  fetchInventory();
});
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.table th {
  font-weight: 600;
  background-color: #f8f9fa;
}

.table-danger {
  background-color: rgba(220, 53, 69, 0.1);
}

.table-warning {
  background-color: rgba(255, 193, 7, 0.1);
}

.btn-group-sm>.btn {
  padding: 0.25rem 0.5rem;
}

.dropdown-menu {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}
</style>
