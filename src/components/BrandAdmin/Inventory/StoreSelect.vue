<template>
  <div>
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">庫存管理 - 選擇店鋪</h4>
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

    <!-- 店鋪列表 -->
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xxl-4 g-4" v-if="!isLoading">
      <div class="col" v-for="store in stores" :key="store._id">
        <div class="card h-100 store-card" @mouseenter="fetchStoreStats(store)">
          <div class="card-img-top position-relative overflow-hidden" style="height: 180px;">
            <img :src="store.image?.url || '/placeholder.jpg'" class="img-fluid w-100 h-100 object-fit-cover"
              :alt="store.name">
            <div class="store-status" :class="store.isActive ? 'bg-success' : 'bg-secondary'">
              {{ store.isActive ? '營業中' : '已停用' }}
            </div>
          </div>

          <div class="card-body">
            <h5 class="card-title mb-2">{{ store.name }}</h5>

            <!-- 庫存快速統計 -->
            <div class="mb-3" style="min-height: 48px;">
              <div v-if="storeStats[store._id]">
                <div class="d-flex justify-content-between text-muted small">
                  <span>
                    <i class="bi bi-box-seam me-1"></i>
                    總項目: {{ storeStats[store._id].totalItems }}
                  </span>
                  <span :class="storeStats[store._id].lowStock > 0 ? 'text-dark' : ''">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    低庫存: {{ storeStats[store._id].lowStock }}
                  </span>
                </div>
                <div class="d-flex justify-content-between text-muted small">
                  <span :class="storeStats[store._id].outOfStock > 0 ? 'text-danger' : ''">
                    <i class="bi bi-x-circle me-1"></i>
                    缺貨: {{ storeStats[store._id].outOfStock }}
                  </span>
                  <span>
                    <i class="bi bi-check-circle me-1"></i>
                    正常: {{ storeStats[store._id].normal }}
                  </span>
                </div>
              </div>
              <div v-else-if="loadingStats[store._id]" class="text-center text-muted small">
                <div class="spinner-border spinner-border-sm me-1" role="status">
                  <span class="visually-hidden">載入中...</span>
                </div>
                載入統計中...
              </div>
              <div v-else class="text-center text-muted small">
                將滑鼠移到卡片上查看統計
              </div>
            </div>
          </div>

          <div class="card-footer bg-transparent">
            <div class="d-flex gap-2">
              <router-link :to="`/admin/${brandId}/inventory/store/${store._id}`" class="btn btn-primary flex-grow-1">
                <i class="bi bi-box-seam me-1"></i>管理庫存
              </router-link>
              <router-link :to="`/admin/${brandId}/inventory/logs?storeId=${store._id}`"
                class="btn btn-outline-secondary">
                <i class="bi bi-clock-history"></i>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- 無資料提示 -->
      <div class="col-12" v-if="stores.length === 0">
        <div class="alert alert-info text-center py-4">
          <i class="bi bi-info-circle me-2 fs-4"></i>
          <p class="mb-0">尚未創建任何店鋪</p>
          <div class="mt-3">
            <router-link :to="`/admin/${brandId}/stores/create`" class="btn btn-primary">
              <i class="bi bi-plus-lg me-1"></i>新增店鋪
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api';

// 路由
const route = useRoute();
const brandId = computed(() => route.params.brandId);

// 狀態
const isLoading = ref(true);
const error = ref('');
const stores = ref([]);
const storeStats = ref({});
const loadingStats = ref({}); // 記錄哪些店鋪正在載入統計

// 獲取店鋪列表
const fetchStores = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    // 獲取店鋪列表
    const response = await api.store.getAllStores({
      brandId: brandId.value,
      activeOnly: false
    });

    if (response && response.stores) {
      stores.value = response.stores;
    } else {
      stores.value = [];
    }
  } catch (err) {
    console.error('獲取店鋪列表失敗:', err);
    error.value = err.response?.data?.message || '獲取店鋪列表時發生錯誤';
  } finally {
    isLoading.value = false;
  }
};

// 獲取單個店鋪的庫存統計
const fetchStoreStats = async (store) => {
  // 如果已經在載入或已經有資料，則不重複載入
  if (loadingStats.value[store._id] || storeStats.value[store._id]) {
    return;
  }
  loadingStats.value[store._id] = true;

  try {
    // 使用獲取店鋪庫存列表的 API 來計算統計
    const response = await api.inventory.getStoreInventory({
      storeId: store._id,
      inventoryType: 'dish',
      onlyTracked: true
    });

    if (response && response.inventory) {
      // 手動計算統計數據
      const items = response.inventory;
      const stats = {
        totalItems: items.length,
        lowStock: 0,
        outOfStock: 0,
        normal: 0
      };

      // 計算各種狀態的數量
      items.forEach(item => {
        if (!item.isInventoryTracked) {
          stats.normal++;
        } else if (item.availableStock === 0) {
          stats.outOfStock++;
        } else if (item.availableStock <= item.minStockAlert) {
          stats.lowStock++;
        } else {
          stats.normal++;
        }
      });

      storeStats.value[store._id] = stats;
    } else {
      storeStats.value[store._id] = {
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        normal: 0
      };
    }
  } catch (err) {
    console.error(`獲取店鋪 ${store.name} 的庫存統計失敗:`, err);
    storeStats.value[store._id] = {
      totalItems: 0,
      lowStock: 0,
      outOfStock: 0,
      normal: 0
    };
  } finally {
    loadingStats.value[store._id] = false;
  }
};

// 生命週期
onMounted(() => {
  fetchStores();
});
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}

.store-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.store-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.store-status {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
}

.card-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.125);
}
</style>
