<template>
  <div>
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

    <div v-if="!isLoading && !error">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ brandName }} 品牌儀表板</h4>
        <div class="btn-group">
          <button class="btn btn-outline-secondary" @click="refreshData">
            <i class="bi bi-arrow-clockwise me-1"></i>刷新數據
          </button>
          <router-link :to="`/admin/${brandId}/stores`" class="btn btn-primary">
            <i class="bi bi-shop me-1"></i>管理店鋪
          </router-link>
        </div>
      </div>

      <!-- 統計卡片 -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card h-100 border-primary">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-primary mb-0">店鋪數量</h6>
                  <p class="small text-muted mb-1">品牌旗下店鋪</p>
                </div>
                <div class="rounded-circle bg-primary bg-opacity-10 p-3">
                  <i class="bi bi-shop text-primary fs-4"></i>
                </div>
              </div>
              <h2 class="mt-3">{{ stats.storeCount }}</h2>
              <div class="small mt-2">
                <span class="badge bg-success me-1">
                  <i class="bi bi-check-circle me-1"></i>{{ stats.activeStoreCount }} 間啟用中
                </span>
                <span class="badge bg-secondary" v-if="stats.storeCount - stats.activeStoreCount > 0">
                  <i class="bi bi-dash-circle me-1"></i>{{ stats.storeCount - stats.activeStoreCount }} 間已停用
                </span>
              </div>
            </div>
            <div class="card-footer bg-white border-0">
              <router-link :to="`/admin/${brandId}/stores`" class="btn btn-sm btn-outline-primary w-100">
                查看店鋪列表
              </router-link>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card h-100 border-success">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-success mb-0">本週銷售額</h6>
                  <p class="small text-muted mb-1">所有店鋪總計</p>
                </div>
                <div class="rounded-circle bg-success bg-opacity-10 p-3">
                  <i class="bi bi-cash text-success fs-4"></i>
                </div>
              </div>
              <h2 class="mt-3">NT$ {{ formatNumber(stats.weeklySales || 0) }}</h2>
              <div class="small mt-2">
                <span class="badge bg-success me-1" v-if="stats.salesGrowth > 0">
                  <i class="bi bi-graph-up me-1"></i>較上週 +{{ stats.salesGrowth }}%
                </span>
                <span class="badge bg-danger me-1" v-else-if="stats.salesGrowth < 0">
                  <i class="bi bi-graph-down me-1"></i>較上週 {{ stats.salesGrowth }}%
                </span>
                <span class="badge bg-secondary" v-else>
                  <i class="bi bi-dash me-1"></i>與上週持平
                </span>
              </div>
            </div>
            <div class="card-footer bg-white border-0">
              <router-link :to="`/admin/${brandId}/orders/reports`" class="btn btn-sm btn-outline-success w-100">
                查看詳細報表
              </router-link>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card h-100 border-info">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-info mb-0">本週訂單數</h6>
                  <p class="small text-muted mb-1">所有店鋪總計</p>
                </div>
                <div class="rounded-circle bg-info bg-opacity-10 p-3">
                  <i class="bi bi-receipt text-info fs-4"></i>
                </div>
              </div>
              <h2 class="mt-3">{{ formatNumber(stats.weeklyOrders || 0) }}</h2>
              <div class="small mt-2">
                <span class="badge bg-info me-1">
                  <i class="bi bi-people me-1"></i>客單價 NT$ {{ formatNumber(stats.averageOrderValue || 0) }}
                </span>
              </div>
            </div>
            <div class="card-footer bg-white border-0">
              <router-link :to="`/admin/${brandId}/orders`" class="btn btn-sm btn-outline-info w-100">
                查看訂單列表
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- 店鋪概覽 -->
      <div class="card mb-4">
        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
          <h5 class="mb-0">店鋪概覽</h5>
          <router-link :to="`/admin/${brandId}/stores/create`" class="btn btn-sm btn-primary">
            <i class="bi bi-plus-circle me-1"></i>新增店鋪
          </router-link>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th>店鋪名稱</th>
                  <th>狀態</th>
                  <th>營業時間</th>
                  <th>本週銷售額</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="store in stores" :key="store._id">
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="store-img me-2">
                        <img :src="store.image?.url || '/placeholder.jpg'" :alt="store.name" class="rounded">
                      </div>
                      <div>
                        <h6 class="mb-0">{{ store.name }}</h6>
                        <span class="small text-muted">菜單: {{ store.menuId ? '已設定' : '未設定' }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge rounded-pill" :class="store.isActive ? 'bg-success' : 'bg-secondary'">
                      {{ store.isActive ? '營業中' : '已停業' }}
                    </span>
                  </td>
                  <td>
                    <div v-if="isTodayOpen(store)">
                      <span class="text-success small">
                        <i class="bi bi-clock me-1"></i>
                        今日營業: {{ formatBusinessHours(getTodayBusinessHours(store)) }}
                      </span>
                    </div>
                    <div v-else>
                      <span class="text-danger small">
                        <i class="bi bi-calendar-x me-1"></i>
                        今日公休
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex flex-column">
                      <span>NT$ {{ formatNumber(getStoreSales(store._id)) }}</span>
                      <small
                        :class="getStoreGrowth(store._id) > 0 ? 'text-success' : getStoreGrowth(store._id) < 0 ? 'text-danger' : 'text-muted'">
                        <i class="bi"
                          :class="getStoreGrowth(store._id) > 0 ? 'bi-arrow-up' : getStoreGrowth(store._id) < 0 ? 'bi-arrow-down' : 'bi-dash'"></i>
                        {{ getStoreGrowth(store._id) > 0 ? '+' : '' }}{{ getStoreGrowth(store._id) }}%
                      </small>
                    </div>
                  </td>
                  <td>
                    <div class="btn-group">
                      <router-link :to="`/admin/${brandId}/stores/detail/${store._id}`"
                        class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i>
                      </router-link>
                      <router-link :to="`/admin/${brandId}/stores/edit/${store._id}`"
                        class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-pencil"></i>
                      </router-link>
                      <router-link :to="`/admin/${brandId}/inventory?storeId=${store._id}`"
                        class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-box-seam"></i>
                      </router-link>
                    </div>
                  </td>
                </tr>
                <tr v-if="stores.length === 0">
                  <td colspan="5" class="text-center py-4">
                    <div class="text-muted">尚未創建任何店鋪</div>
                    <router-link :to="`/admin/${brandId}/stores/create`" class="btn btn-sm btn-primary mt-2">
                      <i class="bi bi-plus-circle me-1"></i>新增第一間店鋪
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer bg-white text-center" v-if="stores.length > 5">
          <router-link :to="`/admin/${brandId}/stores`" class="text-decoration-none">
            查看全部 {{ stats.storeCount }} 間店鋪 <i class="bi bi-chevron-right"></i>
          </router-link>
        </div>
      </div>

      <!-- 最近訂單 -->
      <div class="card mb-4">
        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
          <h5 class="mb-0">最近訂單</h5>
          <router-link :to="`/admin/${brandId}/orders`" class="btn btn-sm btn-primary">
            <i class="bi bi-list-ul me-1"></i>查看全部
          </router-link>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th>訂單編號</th>
                  <th>店鋪</th>
                  <th>顧客</th>
                  <th>金額</th>
                  <th>狀態</th>
                  <th>下單時間</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order.id">
                  <td>
                    <span class="fw-medium">#{{ order.id }}</span>
                  </td>
                  <td>{{ order.storeName }}</td>
                  <td>{{ order.customerName }}</td>
                  <td>NT$ {{ formatNumber(order.total) }}</td>
                  <td>
                    <span class="badge rounded-pill" :class="getOrderStatusClass(order.status)">
                      {{ getOrderStatusText(order.status) }}
                    </span>
                  </td>
                  <td>{{ formatDate(order.createdAt) }}</td>
                </tr>
                <tr v-if="recentOrders.length === 0">
                  <td colspan="6" class="text-center py-4">
                    <div class="text-muted">尚無訂單記錄</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer bg-white text-center" v-if="recentOrders.length > 0">
          <router-link :to="`/admin/${brandId}/orders`" class="text-decoration-none">
            查看全部訂單 <i class="bi bi-chevron-right"></i>
          </router-link>
        </div>
      </div>

      <!-- 快速操作區 -->
      <div class="row g-3 mb-4">
        <div class="col-md-6 col-lg-3">
          <router-link :to="`/admin/${brandId}/menus`" class="card action-card h-100">
            <div class="card-body d-flex flex-column align-items-center justify-content-center p-4">
              <div class="icon-circle bg-primary bg-opacity-10 mb-3">
                <i class="bi bi-menu-button-wide text-primary"></i>
              </div>
              <h5 class="card-title mb-2">菜單管理</h5>
              <p class="text-muted text-center small mb-0">管理店鋪菜單與餐點項目</p>
            </div>
          </router-link>
        </div>

        <div class="col-md-6 col-lg-3">
          <router-link :to="`/admin/${brandId}/inventory`" class="card action-card h-100">
            <div class="card-body d-flex flex-column align-items-center justify-content-center p-4">
              <div class="icon-circle bg-success bg-opacity-10 mb-3">
                <i class="bi bi-box-seam text-success"></i>
              </div>
              <h5 class="card-title mb-2">庫存管理</h5>
              <p class="text-muted text-center small mb-0">監控與管理店鋪餐點庫存</p>
            </div>
          </router-link>
        </div>

        <div class="col-md-6 col-lg-3">
          <router-link :to="`/admin/${brandId}/coupons`" class="card action-card h-100">
            <div class="card-body d-flex flex-column align-items-center justify-content-center p-4">
              <div class="icon-circle bg-warning bg-opacity-10 mb-3">
                <i class="bi bi-ticket-perforated text-warning"></i>
              </div>
              <h5 class="card-title mb-2">促銷管理</h5>
              <p class="text-muted text-center small mb-0">設置優惠券與點數規則</p>
            </div>
          </router-link>
        </div>

        <div class="col-md-6 col-lg-3">
          <router-link :to="`/admin/${brandId}/orders/reports`" class="card action-card h-100">
            <div class="card-body d-flex flex-column align-items-center justify-content-center p-4">
              <div class="icon-circle bg-info bg-opacity-10 mb-3">
                <i class="bi bi-bar-chart text-info"></i>
              </div>
              <h5 class="card-title mb-2">銷售報表</h5>
              <p class="text-muted text-center small mb-0">查看詳細銷售數據與分析</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api';

// 從路由中獲取品牌ID
const route = useRoute();
const brandId = computed(() => route.params.brandId);

// 狀態變數
const isLoading = ref(true);
const error = ref('');
const brandName = ref('');
const stores = ref([]);
const recentOrders = ref([]);
const stats = ref({
  storeCount: 0,
  activeStoreCount: 0,
  weeklySales: 0,
  salesGrowth: 0,
  weeklyOrders: 0,
  averageOrderValue: 0
});

// 模擬的店鋪銷售數據 (實際應從 API 獲取)
const storeSalesData = ref({});

// 格式化數字 (加入千位分隔符)
const formatNumber = (num) => {
  return new Intl.NumberFormat('zh-TW').format(num);
};

// 獲取當天星期幾 (0-6，0代表星期日)
const getTodayDayOfWeek = () => {
  return new Date().getDay();
};

// 獲取當天的營業時間
const getTodayBusinessHours = (store) => {
  if (!store.businessHours || store.businessHours.length === 0) {
    return null;
  }

  const today = getTodayDayOfWeek();
  const todayHours = store.businessHours.find(h => h.day === today);

  return todayHours;
};

// 檢查今天是否營業
const isTodayOpen = (store) => {
  const todayHours = getTodayBusinessHours(store);
  return todayHours && !todayHours.isClosed && todayHours.periods && todayHours.periods.length > 0;
};

// 格式化營業時間
const formatBusinessHours = (businessHours) => {
  if (!businessHours || !businessHours.periods || businessHours.periods.length === 0) {
    return '無資料';
  }

  return businessHours.periods.map(period => {
    return `${period.open}-${period.close}`;
  }).join(', ');
};

// 獲取店鋪本週銷售額
const getStoreSales = (storeId) => {
  return storeSalesData.value[storeId]?.weeklySales || 0;
};

// 獲取店鋪銷售成長率
const getStoreGrowth = (storeId) => {
  return storeSalesData.value[storeId]?.salesGrowth || 0;
};

// 根據訂單狀態返回對應的樣式類
const getOrderStatusClass = (status) => {
  switch (status) {
    case 'completed': return 'bg-success';
    case 'processing': return 'bg-primary';
    case 'pending': return 'bg-warning';
    case 'cancelled': return 'bg-danger';
    default: return 'bg-secondary';
  }
};

// 根據訂單狀態返回對應的文字
const getOrderStatusText = (status) => {
  switch (status) {
    case 'completed': return '已完成';
    case 'processing': return '處理中';
    case 'pending': return '待處理';
    case 'cancelled': return '已取消';
    default: return '未知';
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無資料';

  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 加載數據
const loadData = async () => {
  if (!brandId.value) return;

  isLoading.value = true;
  error.value = '';

  try {
    // 獲取品牌信息
    const brandResponse = await api.brand.getBrandById(brandId.value);
    if (brandResponse && brandResponse.brand) {
      brandName.value = brandResponse.brand.name;
    }

    // 獲取店鋪列表
    const storesResponse = await api.brand.getBrandStores({ brandId: brandId.value });
    if (storesResponse && storesResponse.stores) {
      stores.value = storesResponse.stores.slice(0, 5); // 僅顯示前5間店鋪

      // 更新統計數據
      stats.value.storeCount = storesResponse.stores.length;
      stats.value.activeStoreCount = storesResponse.stores.filter(store => store.isActive).length;
    }

    // 由於目前沒有實際的訂單和銷售數據 API，這裡使用模擬數據
    simulateData();

  } catch (err) {
    console.error('獲取數據失敗:', err);
    error.value = '無法載入數據，請稍後再試';
  } finally {
    isLoading.value = false;
  }
};

// 刷新數據
const refreshData = () => {
  loadData();
};

// 模擬數據 (實際項目中應替換為真實 API 調用)
const simulateData = () => {
  // 模擬銷售統計
  stats.value.weeklySales = Math.floor(Math.random() * 500000) + 100000;
  stats.value.salesGrowth = Math.floor(Math.random() * 40) - 10; // -10% 到 +30%
  stats.value.weeklyOrders = Math.floor(Math.random() * 500) + 100;
  stats.value.averageOrderValue = Math.floor(stats.value.weeklySales / stats.value.weeklyOrders);

  // 模擬店鋪銷售數據
  stores.value.forEach(store => {
    storeSalesData.value[store._id] = {
      weeklySales: Math.floor(Math.random() * 100000) + 10000,
      salesGrowth: Math.floor(Math.random() * 60) - 20 // -20% 到 +40%
    };
  });

  // 模擬最近訂單
  recentOrders.value = [];
  const orderStatuses = ['completed', 'processing', 'pending', 'cancelled'];
  const currentDate = new Date();

  for (let i = 0; i < 5; i++) {
    const randomStore = stores.value[Math.floor(Math.random() * stores.value.length)];
    if (!randomStore) continue;

    const orderDate = new Date(currentDate);
    orderDate.setHours(currentDate.getHours() - Math.floor(Math.random() * 24)); // 過去 24 小時內的訂單

    recentOrders.value.push({
      id: Math.floor(Math.random() * 10000) + 10000,
      storeId: randomStore._id,
      storeName: randomStore.name,
      customerName: `顧客${Math.floor(Math.random() * 1000) + 1}`,
      total: Math.floor(Math.random() * 1000) + 100,
      status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
      createdAt: orderDate.toISOString()
    });
  }

  // 依照時間排序，最新的在前
  recentOrders.value.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// 監聽品牌ID變化
watch(() => brandId.value, (newId, oldId) => {
  if (newId !== oldId) {
    loadData();
  }
});

// 生命週期鉤子
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}

/* 店鋪圖片 */
.store-img {
  width: 40px;
  height: 40px;
  overflow: hidden;
}

.store-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 操作卡片 */
.action-card {
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid #dee2e6;
  text-decoration: none;
  color: inherit;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-circle i {
  font-size: 1.75rem;
}

/* 頁面內標題 */
h5.card-title {
  font-weight: 600;
}

/* 表格樣式優化 */
.table th {
  font-weight: 600;
}

.table td,
.table th {
  padding: 0.75rem 1rem;
}
</style>
