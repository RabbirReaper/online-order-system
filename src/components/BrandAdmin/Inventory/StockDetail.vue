<template>
  <div>
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0" v-if="inventoryItem">
        {{ inventoryItem.itemName }} - 庫存詳情
      </h4>
      <div>
        <router-link :to="`/admin/${brandId}/inventory/store/${storeId}`" class="btn btn-secondary">
          <i class="bi bi-arrow-left me-1"></i>返回列表
        </router-link>
      </div>
    </div>

    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div class="alert alert-danger" v-if="error">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <div v-if="inventoryItem && !isLoading" class="row">
      <!-- 左側：基本信息卡片 -->
      <div class="col-md-4">
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">基本信息</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="text-muted small">項目類型</label>
              <p class="mb-0">
                <span class="badge"
                  :class="inventoryItem.inventoryType === 'DishTemplate' ? 'bg-info' : 'bg-secondary'">
                  {{ inventoryItem.inventoryType === 'DishTemplate' ? '餐點' : '其他' }}
                </span>
              </p>
            </div>
            <div class="mb-3">
              <label class="text-muted small">項目名稱</label>
              <p class="mb-0 fw-bold">{{ inventoryItem.itemName }}</p>
            </div>
            <div class="mb-3">
              <label class="text-muted small">是否追蹤庫存</label>
              <p class="mb-0">
                <span class="badge" :class="inventoryItem.isInventoryTracked ? 'bg-success' : 'bg-secondary'">
                  {{ inventoryItem.isInventoryTracked ? '追蹤' : '不追蹤' }}
                </span>
              </p>
            </div>
            <div class="mb-3">
              <label class="text-muted small">可販售庫存功能</label>
              <p class="mb-0">
                <span class="badge" :class="inventoryItem.enableAvailableStock ? 'bg-success' : 'bg-secondary'">
                  {{ inventoryItem.enableAvailableStock ? '啟用' : '關閉' }}
                </span>
              </p>
            </div>
            <div class="mb-3">
              <label class="text-muted small">售完狀態</label>
              <p class="mb-0">
                <span class="badge" :class="inventoryItem.isSoldOut ? 'bg-danger' : 'bg-success'">
                  {{ inventoryItem.isSoldOut ? '售完' : '正常' }}
                </span>
              </p>
            </div>
            <div class="mb-3">
              <label class="text-muted small">最低庫存警告值</label>
              <p class="mb-0 fw-bold">{{ inventoryItem.minStockAlert }}</p>
            </div>
            <div class="mb-3">
              <label class="text-muted small">補貨目標數量</label>
              <p class="mb-0 fw-bold">{{ inventoryItem.targetStockLevel || '無設定' }}</p>
            </div>
            <div>
              <label class="text-muted small">最後更新時間</label>
              <p class="mb-0">{{ formatDate(inventoryItem.updatedAt) }}</p>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">快速操作</h5>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <button class="btn btn-primary" @click="openAdjustModal">
                <i class="bi bi-pencil me-1"></i>調整庫存
              </button>
              <button class="btn btn-outline-secondary" @click="openSettingsModal">
                <i class="bi bi-gear me-1"></i>庫存設定
              </button>
              <button class="btn" :class="inventoryItem.isSoldOut ? 'btn-success' : 'btn-danger'"
                @click="toggleSoldOut">
                <i class="bi me-1" :class="inventoryItem.isSoldOut ? 'bi-check-circle' : 'bi-x-circle'"></i>
                {{ inventoryItem.isSoldOut ? '標示為可售' : '標示為售完' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側：庫存統計與趨勢 -->
      <div class="col-md-8">
        <!-- 當前庫存狀態 -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">當前庫存狀態</h5>
          </div>
          <div class="card-body">
            <div class="row g-4">
              <div class="col-md-6">
                <div class="p-3 border rounded text-center">
                  <h6 class="text-muted mb-2">總庫存</h6>
                  <h2 class="mb-0 text-primary">{{ inventoryItem.totalStock }}</h2>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-3 border rounded text-center">
                  <h6 class="text-muted mb-2">可販售庫存</h6>
                  <h2 class="mb-0 text-success">{{ inventoryItem.availableStock }}</h2>
                  <small class="text-muted" v-if="!inventoryItem.enableAvailableStock">（未啟用）</small>
                </div>
              </div>
            </div>

            <!-- 庫存狀態指示器 -->
            <div class="mt-4">
              <div class="progress" style="height: 25px;">
                <div class="progress-bar" :class="getProgressBarClass()" role="progressbar"
                  :style="{ width: getStockPercentage() + '%' }">
                  {{ getStatusText() }}
                </div>
              </div>
              <div class="d-flex justify-content-between text-muted small mt-1">
                <span>0</span>
                <span>低庫存警告值: {{ inventoryItem.minStockAlert }}</span>
                <span v-if="inventoryItem.targetStockLevel">補貨目標: {{ inventoryItem.targetStockLevel }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 統計數據 -->
        <div class="card mb-4" v-if="stats">
          <div class="card-header">
            <h5 class="mb-0">統計數據 (近30天)</h5>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-3">
                <div class="text-center">
                  <h6 class="text-muted">總入庫</h6>
                  <h4 class="mb-0 text-success">+{{ stats.stats?.last30Days?.added || 0 }}</h4>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h6 class="text-muted">總消耗</h6>
                  <h4 class="mb-0 text-danger">-{{ stats.stats?.last30Days?.consumed || 0 }}</h4>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h6 class="text-muted">日均消耗</h6>
                  <h4 class="mb-0">{{ (stats.consumptionRate || 0).toFixed(1) }}</h4>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h6 class="text-muted">預計剩餘天數</h6>
                  <h4 class="mb-0" :class="getDaysRemainingClass()">
                    {{ getDaysRemaining() }}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 變更歷史 -->
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">最近變更記錄</h5>
            <router-link :to="`/admin/${brandId}/inventory/logs?storeId=${storeId}&itemId=${inventoryItem._id}`"
              class="btn btn-sm btn-outline-primary">
              查看全部
            </router-link>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>時間</th>
                    <th>類型</th>
                    <th>庫存類型</th>
                    <th>變更前</th>
                    <th>變更後</th>
                    <th>變化量</th>
                    <th>原因</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in recentLogs" :key="log._id">
                    <td>{{ formatDate(log.createdAt) }}</td>
                    <td>
                      <span class="badge" :class="getChangeTypeBadgeClass(log.changeType)">
                        {{ getChangeTypeText(log.changeType) }}
                      </span>
                    </td>
                    <td>{{ log.stockType === 'totalStock' ? '總庫存' : '可販售' }}</td>
                    <td>{{ log.previousStock }}</td>
                    <td>{{ log.newStock }}</td>
                    <td>
                      <span :class="log.changeAmount > 0 ? 'text-success' : 'text-danger'">
                        {{ log.changeAmount > 0 ? '+' : '' }}{{ log.changeAmount }}
                      </span>
                    </td>
                    <td>{{ log.reason || '-' }}</td>
                  </tr>
                  <tr v-if="recentLogs.length === 0">
                    <td colspan="7" class="text-center py-3 text-muted">
                      暫無變更記錄
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 調整庫存 Modal -->
    <StockAdjustModal v-if="showAdjustModal" :item="inventoryItem" :store-id="storeId" :brand-id="brandId"
      @close="showAdjustModal = false" @success="handleAdjustSuccess" />

    <!-- 庫存設定 Modal -->
    <BModal v-model="showSettingsModal" title="庫存設定" @ok="submitSettings">
      <form @submit.prevent="submitSettings">
        <div class="mb-3">
          <label class="form-label">最低庫存警告值</label>
          <input type="number" v-model.number="settingsForm.minStockAlert" class="form-control" min="0">
        </div>

        <div class="mb-3">
          <label class="form-label">補貨目標數量</label>
          <input type="number" v-model.number="settingsForm.targetStockLevel" class="form-control" min="0">
          <div class="form-text">留空表示無設定</div>
        </div>

        <div class="mb-3">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" v-model="settingsForm.isInventoryTracked"
              id="isInventoryTracked">
            <label class="form-check-label" for="isInventoryTracked">
              追蹤庫存 (訂單自動扣除)
            </label>
          </div>
        </div>

        <div class="mb-3">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" v-model="settingsForm.enableAvailableStock"
              id="enableAvailableStock">
            <label class="form-check-label" for="enableAvailableStock">
              啟用可販售庫存 (每日限量)
            </label>
          </div>
        </div>

        <div v-if="settingsError" class="alert alert-danger">
          {{ settingsError }}
        </div>
      </form>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BModal } from 'bootstrap-vue-next';
import api from '@/api';
import StockAdjustModal from './StockAdjustModal.vue';

// 路由
const route = useRoute();
const router = useRouter();
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);
const itemId = computed(() => route.params.id);

// 狀態
const isLoading = ref(true);
const error = ref('');
const inventoryItem = ref(null);
const recentLogs = ref([]);
const stats = ref(null);

// Modal相關
const showAdjustModal = ref(false);
const showSettingsModal = ref(false);
const settingsForm = ref({
  minStockAlert: 0,
  targetStockLevel: null,
  isInventoryTracked: true,
  enableAvailableStock: false
});
const isSavingSettings = ref(false);
const settingsError = ref('');

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 獲取庫存百分比
const getStockPercentage = () => {
  if (!inventoryItem.value || !inventoryItem.value.targetStockLevel) {
    return 100;
  }
  return Math.min(100, (inventoryItem.value.totalStock / inventoryItem.value.targetStockLevel) * 100);
};

// 獲取進度條樣式
const getProgressBarClass = () => {
  if (!inventoryItem.value) return 'bg-secondary';

  if (inventoryItem.value.isSoldOut) return 'bg-danger';
  if (inventoryItem.value.totalStock === 0) return 'bg-danger';
  if (inventoryItem.value.needsRestock) return 'bg-warning text-dark';
  if (inventoryItem.value.totalStock <= inventoryItem.value.minStockAlert) return 'bg-warning text-dark';
  return 'bg-success';
};

// 獲取狀態文字
const getStatusText = () => {
  if (!inventoryItem.value) return '';

  if (inventoryItem.value.isSoldOut) return '售完';
  if (inventoryItem.value.totalStock === 0) return '缺貨';
  if (inventoryItem.value.needsRestock) return '需要補貨';
  if (inventoryItem.value.totalStock <= inventoryItem.value.minStockAlert) return '低庫存';
  return '正常';
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

// 獲取剩餘天數
const getDaysRemaining = () => {
  if (!inventoryItem.value || !stats.value || stats.value.consumptionRate === 0) {
    return '無法計算';
  }
  const effectiveStock = inventoryItem.value.enableAvailableStock ?
    inventoryItem.value.availableStock : inventoryItem.value.totalStock;
  const days = Math.floor(effectiveStock / stats.value.consumptionRate);
  return days > 0 ? `${days} 天` : '即將耗盡';
};

// 獲取剩餘天數樣式
const getDaysRemainingClass = () => {
  if (!inventoryItem.value || !stats.value || stats.value.consumptionRate === 0) {
    return '';
  }
  const effectiveStock = inventoryItem.value.enableAvailableStock ?
    inventoryItem.value.availableStock : inventoryItem.value.totalStock;
  const days = Math.floor(effectiveStock / stats.value.consumptionRate);
  if (days <= 3) return 'text-danger';
  if (days <= 7) return 'text-warning';
  return 'text-success';
};

// 獲取庫存詳情
const fetchInventoryDetail = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    // 獲取庫存詳情
    const response = await api.inventory.getInventoryItem({
      storeId: storeId.value,
      itemId: itemId.value
    });

    inventoryItem.value = response.inventoryItem;

    // 初始化設定表單
    settingsForm.value = {
      minStockAlert: inventoryItem.value.minStockAlert,
      targetStockLevel: inventoryItem.value.targetStockLevel,
      isInventoryTracked: inventoryItem.value.isInventoryTracked,
      enableAvailableStock: inventoryItem.value.enableAvailableStock
    };

    // 獲取統計數據
    await fetchStats();

    // 獲取最近變更記錄
    await fetchRecentLogs();
  } catch (err) {
    console.error('獲取庫存詳情失敗:', err);
    error.value = err.response?.data?.message || '獲取庫存詳情時發生錯誤';
  } finally {
    isLoading.value = false;
  }
};

// 獲取統計數據
const fetchStats = async () => {
  try {
    const response = await api.inventory.getItemInventoryStats({
      storeId: storeId.value,
      itemId: itemId.value,
      inventoryType: inventoryItem.value.inventoryType
    });
    stats.value = response.stats;
  } catch (err) {
    console.error('獲取統計數據失敗:', err);
  }
};

// 獲取最近變更記錄
const fetchRecentLogs = async () => {
  try {
    const response = await api.inventory.getInventoryLogs({
      storeId: storeId.value,
      itemId: itemId.value,
      inventoryType: inventoryItem.value.inventoryType,
      limit: 10
    });
    recentLogs.value = response.logs;
  } catch (err) {
    console.error('獲取變更記錄失敗:', err);
  }
};

// 打開調整Modal
const openAdjustModal = () => {
  showAdjustModal.value = true;
};

// 處理調整成功
const handleAdjustSuccess = () => {
  showAdjustModal.value = false;
  fetchInventoryDetail();
};

// 打開設定Modal
const openSettingsModal = () => {
  showSettingsModal.value = true;
};

// 切換售完狀態
const toggleSoldOut = async () => {
  try {
    await api.inventory.toggleSoldOut({
      storeId: storeId.value,
      itemId: itemId.value,
      isSoldOut: !inventoryItem.value.isSoldOut
    });

    inventoryItem.value.isSoldOut = !inventoryItem.value.isSoldOut;
  } catch (err) {
    console.error('切換售完狀態失敗:', err);
    error.value = err.response?.data?.message || '切換售完狀態時發生錯誤';
  }
};

// 提交設定
const submitSettings = async () => {
  isSavingSettings.value = true;
  settingsError.value = '';

  try {
    const data = {
      minStockAlert: settingsForm.value.minStockAlert,
      targetStockLevel: settingsForm.value.targetStockLevel || undefined,
      isInventoryTracked: settingsForm.value.isInventoryTracked,
      enableAvailableStock: settingsForm.value.enableAvailableStock,
      reason: '修改庫存設定'
    };

    await api.inventory.updateInventory({
      storeId: storeId.value,
      itemId: itemId.value,
      data: {
        ...data,
        inventoryType: inventoryItem.value.inventoryType
      }
    });

    showSettingsModal.value = false;
    fetchInventoryDetail();
  } catch (err) {
    console.error('更新設定失敗:', err);
    settingsError.value = err.response?.data?.message || '更新設定時發生錯誤';
  } finally {
    isSavingSettings.value = false;
  }
};

// 生命週期
onMounted(() => {
  fetchInventoryDetail();
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

.progress {
  position: relative;
}

.progress-bar {
  font-weight: 600;
}
</style>
