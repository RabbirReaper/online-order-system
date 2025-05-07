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
              <tr v-for="item in inventorys" :key="item._id" :class="getRowClass(item)">
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
                    <router-link :to="`/admin/${brandId}/inventory/store/${storeId}/detail/${item._id}`"
                      class="btn btn-outline-secondary">
                      <i class="bi bi-eye"></i> 詳情
                    </router-link>
                  </div>
                </td>
              </tr>

              <!-- 無資料提示 -->
              <tr v-if="!inventorys || inventorys.length === 0">
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

    <!-- 庫存調整 Modal (保持原有) -->
    <div class="modal fade" id="adjustStockModal" tabindex="-1" ref="adjustModalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">調整庫存</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="selectedItem">
            <h6 class="mb-3">{{ selectedItem.itemName }}</h6>

            <!-- 調整類型選擇 -->
            <div class="mb-3">
              <label class="form-label">調整類型</label>
              <select v-model="adjustForm.type" class="form-select" @change="resetAdjustForm">
                <option value="warehouse">調整倉庫庫存</option>
                <option value="available">調整可販售庫存</option>
                <option value="transfer">轉移到可販售</option>
                <option value="damage">損耗處理</option>
              </select>
            </div>

            <!-- 調整表單的其餘部分保持不變... -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="submitAdjustment" :disabled="isAdjusting">
              <span v-if="isAdjusting" class="spinner-border spinner-border-sm me-1"></span>
              {{ isAdjusting ? '處理中...' : '確認調整' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api';
import InitializeDishInventoryModal from './InitializeDishInventoryModal.vue';
import CreateInventoryModal from './CreateInventoryModal.vue';

// 路由
const route = useRoute();
const router = useRouter();
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);

// 狀態
const isLoading = ref(true);
const error = ref('');
const inventorys = ref([]);
const searchQuery = ref('');
const currentPage = ref(1);
const storeName = ref('');

// 新增的狀態
const showInitializeModal = ref(false);
const showCreateModal = ref(false);

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

// 調整庫存相關
const adjustModalRef = ref(null);
const selectedItem = ref(null);
const isAdjusting = ref(false);
const adjustError = ref('');

// 調整表單
const adjustForm = ref({
  type: 'warehouse',
  warehouseStock: 0,
  availableStock: 0,
  transferQuantity: 1,
  damageFrom: 'warehouse',
  damageQuantity: 1,
  reason: ''
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

// 新增方法
const openInitializeModal = () => {
  showInitializeModal.value = true;
};

const openCreateModal = () => {
  showCreateModal.value = true;
};

const handleInitializeSuccess = () => {
  showInitializeModal.value = false;
  fetchInventory();
};

const handleCreateSuccess = () => {
  showCreateModal.value = false;
  fetchInventory();
};

// 其餘方法保持不變...
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
    console.log('獲取庫存列表:', response);
    if (response && response.inventory) {
      inventorys.value = response.inventory;
      pagination.total = response.total || 0;
      pagination.totalPages = response.totalPages || 1;

      if (filters.status) {
        inventorys.value = inventorys.value.filter(item => {
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
      inventorys.value = [];
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
    error.value = '獲取庫存列表時發生錯誤';
    inventorys.value = [];
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

const updateStats = () => {
  if (!inventorys.value || !Array.isArray(inventorys.value)) {
    stats.value = {
      totalItems: 0,
      lowStock: 0,
      outOfStock: 0,
      overStock: 0
    };
    return;
  }

  stats.value = {
    totalItems: inventorys.value.length,
    lowStock: inventorys.value.filter(item => getStatusText(item) === '低庫存').length,
    outOfStock: inventorys.value.filter(item => getStatusText(item) === '缺貨').length,
    overStock: inventorys.value.filter(item => getStatusText(item) === '庫存過多').length
  };
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchInventory();
};

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

const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages || page === '...') return;
  currentPage.value = page;
  fetchInventory();
};

// 修改 openAdjustModal 方法，不使用 Modal 實例
const openAdjustModal = (item) => {
  selectedItem.value = item;
  adjustForm.value.warehouseStock = item.warehouseStock;
  adjustForm.value.availableStock = item.availableStock;
  adjustForm.value.reason = '';
  adjustError.value = '';

};

const resetAdjustForm = () => {
  adjustForm.value.reason = '';
  adjustForm.value.transferQuantity = 1;
  adjustForm.value.damageQuantity = 1;
};

const getDamageMaxQuantity = () => {
  if (!selectedItem.value) return 0;
  if (adjustForm.value.damageFrom === 'warehouse') {
    return selectedItem.value.warehouseStock;
  } else {
    return selectedItem.value.availableStock;
  }
};

const submitAdjustment = async () => {
  if (!selectedItem.value || !adjustForm.value.reason.trim()) {
    adjustError.value = '請填寫調整原因';
    return;
  }

  isAdjusting.value = true;
  adjustError.value = '';

  try {
    let response;
    const itemId = selectedItem.value._id;
    const inventoryType = selectedItem.value.inventoryType;

    switch (adjustForm.value.type) {
      case 'warehouse':
        response = await api.inventory.updateInventory({
          storeId: storeId.value,
          itemId,
          data: {
            inventoryType,
            stockType: 'warehouseStock',
            stock: adjustForm.value.warehouseStock,
            reason: adjustForm.value.reason
          }
        });
        break;

      case 'available':
        response = await api.inventory.updateInventory({
          storeId: storeId.value,
          itemId,
          data: {
            inventoryType,
            stockType: 'availableStock',
            stock: adjustForm.value.availableStock,
            reason: adjustForm.value.reason
          }
        });
        break;

      case 'transfer':
        response = await api.inventory.transferStock({
          storeId: storeId.value,
          itemId,
          quantity: adjustForm.value.transferQuantity,
          reason: adjustForm.value.reason,
          inventoryType
        });
        break;

      case 'damage':
        response = await api.inventory.processDamage({
          storeId: storeId.value,
          itemId,
          quantity: adjustForm.value.damageQuantity,
          reason: adjustForm.value.reason,
          stockType: adjustForm.value.damageFrom === 'warehouse' ? 'warehouseStock' : 'availableStock',
          inventoryType
        });
        break;
    }

    if (response) {
      // 關閉 modal - 使用原生 Bootstrap 方法
      const modalElement = document.getElementById('adjustStockModal');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
      fetchInventory();
    }
  } catch (err) {
    console.error('調整庫存失敗:', err);
    adjustError.value = err.response?.data?.message || '調整庫存時發生錯誤';
  } finally {
    isAdjusting.value = false;
  }
};

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
