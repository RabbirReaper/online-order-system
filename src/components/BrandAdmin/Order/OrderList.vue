<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>訂單管理 - {{ storeName }}</h1>
      <router-link :to="`/admin/${brandId}/orders`" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i>返回選擇店鋪
      </router-link>
    </div>

    <!-- 上部分：時間選擇和篩選 -->
    <div class="card mb-4">
      <div class="card-body">
        <!-- 快速日期選擇器 -->
        <div class="row align-items-center mb-3">
          <div class="col-md-6">
            <label class="form-label">快速選擇日期</label>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-outline-primary" @click="adjustDate(-1)" :disabled="loading">
                <i class="bi bi-chevron-left"></i>
              </button>

              <div class="quick-date-selector">
                <button class="btn btn-primary" @click="setToday" :disabled="loading">
                  <i class="bi bi-calendar-day me-1"></i>今天
                </button>
                <div class="current-date-display">
                  {{ formatSelectedDateRange() }}
                </div>
              </div>

              <button class="btn btn-outline-primary" @click="adjustDate(1)" :disabled="loading || isToday()">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label">快速期間選擇</label>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-secondary" @click="setDateRange('today')"
                :class="{ 'active': isCurrentRange('today') }">今天</button>
              <button class="btn btn-sm btn-outline-secondary" @click="setDateRange('yesterday')"
                :class="{ 'active': isCurrentRange('yesterday') }">昨天</button>
              <button class="btn btn-sm btn-outline-secondary" @click="setDateRange('week')"
                :class="{ 'active': isCurrentRange('week') }">本週</button>
              <button class="btn btn-sm btn-outline-secondary" @click="setDateRange('month')"
                :class="{ 'active': isCurrentRange('month') }">本月</button>
            </div>
          </div>
        </div>

        <!-- 詳細日期和篩選選項 -->
        <div class="row align-items-center">
          <div class="col-md-3">
            <label class="form-label">開始日期</label>
            <input type="date" class="form-control" v-model="filters.fromDate" @change="handleDateChange">
          </div>
          <div class="col-md-3">
            <label class="form-label">結束日期</label>
            <input type="date" class="form-control" v-model="filters.toDate" @change="handleDateChange">
          </div>
          <div class="col-md-2">
            <label class="form-label">訂單狀態</label>
            <select class="form-select" v-model="filters.status" @change="handleFilterChange">
              <option value="">全部狀態</option>
              <option value="unpaid">未付款</option>
              <option value="paid">已付款</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">訂單類型</label>
            <select class="form-select" v-model="filters.orderType" @change="handleFilterChange">
              <option value="">全部類型</option>
              <option value="dine_in">內用</option>
              <option value="takeout">外帶</option>
              <option value="delivery">外送</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">&nbsp;</label>
            <div class="d-flex gap-2">
              <button class="btn btn-primary" @click="applyFilters" :disabled="loading">
                <i class="bi bi-search me-1"></i>查詢
              </button>
              <button class="btn btn-outline-secondary" @click="resetFilters">
                <i class="bi bi-arrow-clockwise me-1"></i>重置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 載入中提示 -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
      <p>正在載入訂單資料...</p>
    </div>

    <!-- 錯誤提示 -->
    <div v-else-if="error" class="alert alert-danger mb-4">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
      <button class="btn btn-sm btn-danger ms-3" @click="fetchData">重試</button>
    </div>

    <!-- 中部分：圖表顯示 -->
    <div v-else-if="allOrders.length > 0" class="row mb-4">
      <!-- 總營業額顯示 -->
      <div class="col-12 mb-4">
        <div class="card shadow-sm">
          <div class="card-body text-center py-4">
            <div class="row align-items-center">
              <div class="col-md-4">
                <div class="summary-item">
                  <h2 class="text-success mb-1 fw-bold">${{ summaryData.totalAmount.toLocaleString() }}</h2>
                  <p class="text-muted mb-0 fs-5">總營業額</p>
                </div>
              </div>
              <div class="col-md-4">
                <div class="summary-item">
                  <h2 class="text-primary mb-1 fw-bold">{{ summaryData.totalOrders }}</h2>
                  <p class="text-muted mb-0 fs-5">總訂單數</p>
                </div>
              </div>
              <div class="col-md-4">
                <div class="summary-item">
                  <h2 class="text-info mb-1 fw-bold">${{ summaryData.averageOrderValue.toLocaleString() }}</h2>
                  <p class="text-muted mb-0 fs-5">平均客單價</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-3">
        <div class="card h-100">
          <div class="card-body">
            <HourlyOrdersLineChart :hourly-data="hourlyChartData" :height="300" />
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-3">
        <div class="card h-100">
          <div class="card-body">
            <OrderTypesPieChart :order-types="orderTypesData" :height="300" />
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-3">
        <div class="card h-100">
          <div class="card-body">
            <DishSalesBarChart :dish-sales="popularDishesData" :height="450" />
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-3">
        <div class="card h-100">
          <div class="card-body">
            <PaymentMethodsPieChart :payment-methods="paymentMethodsData" :height="450" />
          </div>
        </div>
      </div>
    </div>

    <!-- 無資料提示 -->
    <div v-else-if="!loading" class="alert alert-info text-center mb-4">
      <i class="bi bi-info-circle me-2"></i>
      所選時間範圍內沒有訂單資料
    </div>

    <!-- 下部分：訂單列表 -->
    <div class="card">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0">訂單列表</h5>
          <span class="badge bg-secondary">
            共 {{ pagination.total }} 筆訂單
          </span>
        </div>
      </div>
      <div class="card-body">
        <div v-if="orders.length === 0 && !loading" class="alert alert-info text-center">
          <i class="bi bi-info-circle me-2"></i>
          所選時間範圍內沒有訂單資料
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>訂單編號</th>
                <th>建立時間</th>
                <th>訂單類型</th>
                <th>總金額</th>
                <th>付款方式</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order._id">
                <td>
                  <strong v-if="order.platformOrderId">{{ order.platformOrderId }}</strong>
                  <span v-else>{{ order.orderDateCode }}-{{ String(order.sequence).padStart(3, '0') }}</span>
                </td>
                <td>{{ formatDateTime(order.createdAt) }}</td>
                <td>
                  <span :class="getOrderTypeClass(order.orderType)">
                    {{ formatOrderType(order.orderType) }}
                  </span>
                </td>
                <td class="text-success fw-bold">${{ order.total }}</td>
                <td>{{ formatPaymentMethod(order.paymentMethod) }}</td>
                <td>
                  <span :class="getOrderStatusClass(order.status)">
                    {{ formatOrderStatus(order.status) }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline-primary" @click="openOrderDetail(order._id)">
                    <i class="bi bi-eye me-1"></i>詳情
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分頁控制 -->
        <nav aria-label="訂單列表分頁" class="mt-3" v-if="pagination.totalPages > 1">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: pagination.currentPage === 1 }">
              <a class="page-link" href="#" @click.prevent="changePage(pagination.currentPage - 1)">上一頁</a>
            </li>
            <li class="page-item" v-for="page in getPageNumbers()" :key="page"
              :class="{ active: pagination.currentPage === page }">
              <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
            </li>
            <li class="page-item" :class="{ disabled: pagination.currentPage === pagination.totalPages }">
              <a class="page-link" href="#" @click.prevent="changePage(pagination.currentPage + 1)">下一頁</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- 訂單詳情彈窗 -->
    <OrderDetailModal :visible="showOrderDetail" :order="selectedOrder" :storeName="storeName"
      @close="closeOrderDetail" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api';
import OrderDetailModal from '@/components/BrandAdmin/Order/OrderDetailModal.vue';
import HourlyOrdersLineChart from '@/components/BrandAdmin/Order/Charts/HourlyOrdersLineChart.vue';
import OrderTypesPieChart from '@/components/BrandAdmin/Order/Charts/OrderTypesPieChart.vue';
import DishSalesBarChart from '@/components/BrandAdmin/Order/Charts/DishSalesBarChart.vue';
import PaymentMethodsPieChart from '@/components/BrandAdmin/Order/Charts/PaymentMethodsPieChart.vue';

const route = useRoute();
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);

// 狀態管理
const loading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const storeName = ref('');
const currentDateRange = ref(''); // 記錄當前選擇的日期範圍類型

// 篩選條件
const filters = reactive({
  fromDate: '',
  toDate: '',
  status: '',
  orderType: ''
});

// 資料狀態
const orders = ref([]);
const allOrders = ref([]); // 儲存所有訂單資料，用於圖表計算
const showOrderDetail = ref(false);
const selectedOrder = ref(null);

// 分頁狀態
const pagination = reactive({
  currentPage: 1,
  totalPages: 0,
  total: 0,
  limit: 10
});

// 簡化的日期處理函數 - 使用本地時區
const formatDate = (date) => {
  return date.toLocaleDateString('en-CA'); // 返回 YYYY-MM-DD 格式
};

const isToday = () => {
  const today = formatDate(new Date());
  return filters.fromDate === today && filters.toDate === today;
};

const formatSelectedDateRange = () => {
  if (!filters.fromDate || !filters.toDate) return '請選擇日期';

  if (filters.fromDate === filters.toDate) {
    return new Date(filters.fromDate + 'T00:00:00').toLocaleDateString('zh-TW');
  }

  return `${new Date(filters.fromDate + 'T00:00:00').toLocaleDateString('zh-TW')} - ${new Date(filters.toDate + 'T00:00:00').toLocaleDateString('zh-TW')}`;
};

const setToday = () => {
  const today = new Date();
  filters.fromDate = formatDate(today);
  filters.toDate = formatDate(today);
  currentDateRange.value = 'today';
  applyFilters();
};

const adjustDate = (days) => {
  const fromDate = new Date(filters.fromDate + 'T00:00:00');
  const toDate = new Date(filters.toDate + 'T00:00:00');

  fromDate.setDate(fromDate.getDate() + days);
  toDate.setDate(toDate.getDate() + days);

  // 不能選擇未來的日期
  const today = new Date();
  if (toDate > today) return;

  filters.fromDate = formatDate(fromDate);
  filters.toDate = formatDate(toDate);
  currentDateRange.value = '';
  applyFilters();
};

const setDateRange = (range) => {
  const today = new Date();

  switch (range) {
    case 'today':
      filters.fromDate = formatDate(today);
      filters.toDate = formatDate(today);
      break;
    case 'yesterday':
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      filters.fromDate = formatDate(yesterday);
      filters.toDate = formatDate(yesterday);
      break;
    case 'week':
      const weekStart = new Date();
      weekStart.setDate(today.getDate() - today.getDay()); // 週日開始
      filters.fromDate = formatDate(weekStart);
      filters.toDate = formatDate(today);
      break;
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      filters.fromDate = formatDate(monthStart);
      filters.toDate = formatDate(today);
      break;
  }

  currentDateRange.value = range;
  applyFilters();
};

const isCurrentRange = (range) => {
  return currentDateRange.value === range;
};

// 初始化日期範圍（今天）
const initializeDateRange = () => {
  setToday();
};

// 從訂單資料計算圖表資料
const hourlyChartData = computed(() => {
  const hourlyStats = {};

  // 初始化24小時
  for (let hour = 0; hour < 24; hour++) {
    hourlyStats[hour] = 0;
  }

  // 統計每小時的訂單數
  allOrders.value.forEach(order => {
    const date = new Date(order.createdAt);
    const hour = date.getHours();
    hourlyStats[hour]++;
  });

  // 轉換為圖表格式
  const hourlyData = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourStr = String(hour).padStart(2, '0') + ':00';
    hourlyData.push({
      time: hourStr,
      count: hourlyStats[hour]
    });
  }

  return hourlyData;
});

const orderTypesData = computed(() => {
  const types = {};

  allOrders.value.forEach(order => {
    const displayType = formatOrderType(order.orderType);
    types[displayType] = (types[displayType] || 0) + 1;
  });

  return types;
});

const popularDishesData = computed(() => {
  const dishStats = {};

  allOrders.value.forEach(order => {
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const dishName = getDishName(item);
        const quantity = item.quantity || 1;
        dishStats[dishName] = (dishStats[dishName] || 0) + quantity;
      });
    }
  });

  // 轉換為數組並排序
  const dishArray = Object.entries(dishStats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // 只取前10名

  return dishArray;
});

const paymentMethodsData = computed(() => {
  const methods = {};

  allOrders.value.forEach(order => {
    const displayMethod = formatPaymentMethod(order.paymentMethod);
    methods[displayMethod] = (methods[displayMethod] || 0) + 1;
  });

  return methods;
});

const summaryData = computed(() => {
  const data = {
    totalOrders: allOrders.value.length,
    totalAmount: 0,
    paidOrders: 0,
    unpaidOrders: 0,
    averageOrderValue: 0
  };

  allOrders.value.forEach(order => {
    data.totalAmount += order.total || 0;
    if (order.status === 'paid') {
      data.paidOrders++;
    } else if (order.status === 'unpaid') {
      data.unpaidOrders++;
    }
  });

  // 計算平均客單價
  data.averageOrderValue = data.totalOrders > 0 ? (data.totalAmount / data.totalOrders) : 0;

  return data;
});

// 獲取餐點名稱
const getDishName = (item) => {
  if (!item || !item.dishInstance) return '未知餐點';

  if (typeof item.dishInstance === 'object') {
    return item.dishInstance.name || '未知餐點';
  }

  return '未知餐點';
};

// API 調用
const fetchStoreInfo = async () => {
  try {
    const response = await api.store.getStoreById({
      brandId: brandId.value,
      id: storeId.value
    });

    if (response.success && response.store) {
      storeName.value = response.store.name;
    }
  } catch (err) {
    console.error('獲取店鋪資訊失敗:', err);
  }
};

const fetchAllOrders = async () => {
  try {
    // 獲取所有訂單（不分頁，用於圖表計算）
    const allOrdersResponse = await api.orderAdmin.getStoreOrders({
      brandId: brandId.value,
      storeId: storeId.value,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      status: filters.status || undefined,
      orderType: filters.orderType || undefined,
      page: 1,
      limit: 1000 // 取大一點的數量確保獲得所有資料
    });

    if (allOrdersResponse.success) {
      allOrders.value = allOrdersResponse.orders || [];
    }
  } catch (err) {
    console.error('獲取所有訂單失敗:', err);
    throw err;
  }
};

const fetchOrders = async () => {
  try {
    const response = await api.orderAdmin.getStoreOrders({
      brandId: brandId.value,
      storeId: storeId.value,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      status: filters.status || undefined,
      orderType: filters.orderType || undefined,
      page: pagination.currentPage,
      limit: pagination.limit
    });

    if (response.success) {
      orders.value = response.orders || [];
      pagination.total = response.pagination?.total || 0;
      pagination.totalPages = response.pagination?.totalPages || 0;
    }
  } catch (err) {
    console.error('獲取訂單列表失敗:', err);
    throw err;
  }
};

const fetchData = async () => {
  loading.value = true;
  error.value = false;
  errorMessage.value = '';

  try {
    await Promise.all([
      fetchAllOrders(), // 用於圖表
      fetchOrders()     // 用於列表顯示
    ]);
  } catch (err) {
    error.value = true;
    errorMessage.value = err.response?.data?.message || '載入資料失敗';
  } finally {
    loading.value = false;
  }
};

// 事件處理
const handleDateChange = () => {
  if (filters.fromDate && filters.toDate) {
    if (new Date(filters.fromDate) > new Date(filters.toDate)) {
      alert('開始日期不能晚於結束日期');
      return;
    }
    currentDateRange.value = ''; // 清除快速選擇狀態
    applyFilters();
  }
};

const handleFilterChange = () => {
  applyFilters();
};

const applyFilters = () => {
  pagination.currentPage = 1;
  fetchData();
};

const resetFilters = () => {
  filters.status = '';
  filters.orderType = '';
  initializeDateRange();
  pagination.currentPage = 1;
};

const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages) return;
  pagination.currentPage = page;
  fetchOrders(); // 只需要重新獲取列表資料
};

const getPageNumbers = () => {
  const total = pagination.totalPages;
  const current = pagination.currentPage;
  const pageNumbers = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pageNumbers.push(i);
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) {
        pageNumbers.push(i);
      }
    } else if (current >= total - 2) {
      for (let i = total - 4; i <= total; i++) {
        pageNumbers.push(i);
      }
    } else {
      for (let i = current - 2; i <= current + 2; i++) {
        pageNumbers.push(i);
      }
    }
  }

  return pageNumbers;
};

const openOrderDetail = async (orderId) => {
  try {
    const response = await api.orderAdmin.getOrderById({
      brandId: brandId.value,
      storeId: storeId.value,
      orderId: orderId
    });
    console.log('獲取訂單詳情:', response);

    if (response.success) {
      selectedOrder.value = response.order;
      showOrderDetail.value = true;
    }
  } catch (err) {
    console.error('獲取訂單詳情失敗:', err);
    alert('獲取訂單詳情失敗');
  }
};

const closeOrderDetail = () => {
  showOrderDetail.value = false;
  selectedOrder.value = null;
};

// 格式化函數 - 簡化時間顯示，讓瀏覽器處理本地時區
const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatOrderType = (type) => {
  const typeMap = {
    'dine_in': '內用',
    'takeout': '外帶',
    'delivery': '外送'
  };
  return typeMap[type] || type;
};

const formatOrderStatus = (status) => {
  const statusMap = {
    'unpaid': '未付款',
    'paid': '已付款',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
};

const formatPaymentMethod = (method) => {
  const methodMap = {
    'cash': '現金',
    'credit_card': '信用卡',
    'line_pay': 'LINE Pay',
    'other': '其他'
  };
  return methodMap[method] || method || '未設定';
};

const getOrderTypeClass = (type) => {
  const classMap = {
    'dine_in': 'badge bg-primary',
    'takeout': 'badge bg-success',
    'delivery': 'badge bg-warning'
  };
  return classMap[type] || 'badge bg-secondary';
};

const getOrderStatusClass = (status) => {
  const classMap = {
    'unpaid': 'badge bg-warning',
    'paid': 'badge bg-success',
    'cancelled': 'badge bg-danger'
  };
  return classMap[status] || 'badge bg-secondary';
};

// 生命週期
onMounted(async () => {
  initializeDateRange();
  await fetchStoreInfo();
  await fetchData();
});

watch(() => route.params.storeId, async (newStoreId, oldStoreId) => {
  if (newStoreId !== oldStoreId) {
    await fetchStoreInfo();
    await fetchData();
  }
});
</script>

<style scoped>
.table th {
  border-top: none;
  font-weight: 600;
  background-color: #f8f9fa;
}

.pagination .page-item.active .page-link {
  background-color: #1a56b03e;
  border-color: #0d6efd;
}

.pagination .page-link {
  color: #0d6efd;
}

.badge {
  font-size: 0.75rem;
}

/* 快速日期選擇器樣式 */
.quick-date-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 200px;
}

.current-date-display {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
  text-align: center;
}

/* 快速期間選擇按鈕 */
.btn-sm.active {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

/* 按鈕hover效果 */
.btn-outline-primary:hover {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

/* 總營業額摘要樣式 */
.summary-item {
  padding: 1rem;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.summary-item:hover {
  transform: translateY(-2px);
}

.summary-item h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .summary-item {
    margin-bottom: 1rem;
    padding: 0.75rem;
  }

  .summary-item h2 {
    font-size: 2rem;
  }
}
</style>
