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
    <div v-else-if="statsData" class="row mb-4">
      <!-- 調試信息 - 開發時可以顯示，正式版本可以移除 -->
      <div class="col-12 mb-3" v-if="true">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">調試信息（開發用）</h6>
            <button class="btn btn-sm btn-outline-warning" @click="fetchData">
              <i class="bi bi-arrow-clockwise me-1"></i>重新載入數據
            </button>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-12 mb-3">
                <div class="alert alert-warning">
                  <h6><i class="bi bi-exclamation-triangle me-2"></i>後端聚合查詢問題</h6>
                  <p class="mb-2">檢測到以下問題：</p>
                  <ul class="mb-2">
                    <li v-if="orders.length > 0 && (!statsData?.details || statsData.details.length === 0)">
                      <strong>統計聚合失敗：</strong> 有 {{ orders.length }} 筆訂單，但統計API返回空的details
                    </li>
                    <li v-if="orders.length > 0 && popularDishesData.length === 0">
                      <strong>熱門餐點聚合失敗：</strong> 有訂單但無法聚合餐點數據
                    </li>
                  </ul>
                  <p class="mb-0">
                    <strong>修復建議：</strong>
                    1. 檢查後端 orderAdmin.js 的聚合查詢邏輯
                    2. 確認訂單的 createdAt 字段格式
                    3. 檢查 DishInstance 與訂單的關聯是否正確
                  </p>
                </div>
              </div>
              <div class="col-md-4">
                <h6>統計數據結構:</h6>
                <pre
                  style="font-size: 11px; max-height: 150px; overflow-y: auto;">{{ JSON.stringify(statsData, null, 2) }}</pre>
                <div class="mt-2">
                  <small class="text-muted">
                    訂單總數: {{ orders.length }}/{{ pagination.total }}
                  </small>
                </div>
              </div>
              <div class="col-md-4">
                <h6>時段數據:</h6>
                <pre
                  style="font-size: 11px; max-height: 150px; overflow-y: auto;">{{JSON.stringify(hourlyChartData.filter(h => h.count > 0).slice(0, 5), null, 2)}}</pre>
                <div class="mt-2">
                  <small class="text-muted">
                    有數據時段: {{hourlyChartData.filter(h => h.count > 0).length}}/24
                  </small>
                </div>
              </div>
              <div class="col-md-4">
                <h6>訂單類型:</h6>
                <pre
                  style="font-size: 11px; max-height: 80px; overflow-y: auto;">{{ JSON.stringify(orderTypesData, null, 2) }}</pre>
                <h6 class="mt-2">熱門餐點:</h6>
                <pre
                  style="font-size: 11px; max-height: 80px; overflow-y: auto;">{{ JSON.stringify(popularDishesData.slice(0, 3), null, 2) }}</pre>
                <div class="mt-2">
                  <small class="text-muted">
                    餐點數據: {{ popularDishesData.length }} 項
                  </small>
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
            <DishSalesBarChart :dish-sales="popularDishesData" :height="300" />
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-3">
        <div class="card h-100">
          <div class="card-body">
            <div class="row text-center">
              <div class="col-6">
                <h3 class="text-success">${{ statsData.summary?.totalAmount || 0 }}</h3>
                <p class="text-muted">總營業額</p>
              </div>
              <div class="col-6">
                <h3 class="text-primary">{{ statsData.summary?.totalOrders || 0 }}</h3>
                <p class="text-muted">總訂單數</p>
              </div>
            </div>
            <div class="row text-center mt-3">
              <div class="col-6">
                <h5 class="text-info">{{ statsData.summary?.paidOrders || 0 }}</h5>
                <p class="text-muted">已付款</p>
              </div>
              <div class="col-6">
                <h5 class="text-warning">{{ statsData.summary?.unpaidOrders || 0 }}</h5>
                <p class="text-muted">未付款</p>
              </div>
            </div>
          </div>
        </div>
      </div>
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
    <OrderDetailModal :visible="showOrderDetail" :order="selectedOrder" @close="closeOrderDetail" />
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

const route = useRoute();
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);

// 狀態管理
const loading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const storeName = ref('');

// 篩選條件
const filters = reactive({
  fromDate: '',
  toDate: '',
  status: '',
  orderType: ''
});

// 資料狀態
const orders = ref([]);
const statsData = ref(null);
const popularDishesData = ref([]);
const showOrderDetail = ref(false);
const selectedOrder = ref(null);

// 分頁狀態
const pagination = reactive({
  currentPage: 1,
  totalPages: 0,
  total: 0,
  limit: 20
});

// 初始化日期範圍（最近7天）
const initializeDateRange = () => {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);

  filters.toDate = today.toISOString().split('T')[0];
  filters.fromDate = weekAgo.toISOString().split('T')[0];
};

// 計算圖表資料
const hourlyChartData = computed(() => {
  console.log('Computing hourlyChartData, statsData:', statsData.value);

  // 如果統計API的details為空，但有訂單數據，嘗試從訂單列表生成簡單的時段統計
  if (!statsData.value?.details || statsData.value.details.length === 0) {
    console.log('No statsData.details found, generating from orders data');

    if (orders.value && orders.value.length > 0) {
      console.log('Generating hourly data from orders:', orders.value.length);

      // 從訂單數據生成時段統計
      const hourlyStats = {};
      orders.value.forEach(order => {
        const date = new Date(order.createdAt);
        const hour = date.getHours();
        hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
      });

      const hourlyData = [];
      for (let hour = 0; hour < 24; hour++) {
        const hourStr = String(hour).padStart(2, '0') + ':00';
        hourlyData.push({
          time: hourStr,
          count: hourlyStats[hour] || 0
        });
      }

      console.log('Generated hourlyData from orders:', hourlyData);
      return hourlyData;
    }

    // 如果連訂單都沒有，返回全零數據
    const hourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = String(hour).padStart(2, '0') + ':00';
      hourlyData.push({
        time: hourStr,
        count: 0
      });
    }
    return hourlyData;
  }

  console.log('statsData.details:', statsData.value.details);

  const hourlyData = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourStr = String(hour).padStart(2, '0') + ':00';
    const hourData = statsData.value.details.find(detail => {
      if (detail._id?.hour !== undefined) {
        return detail._id.hour === hour;
      }
      return false;
    });

    hourlyData.push({
      time: hourStr,
      count: hourData ? hourData.totalOrders : 0
    });
  }

  console.log('Generated hourlyData:', hourlyData);
  return hourlyData;
});

const orderTypesData = computed(() => {
  console.log('Computing orderTypesData, statsData:', statsData.value);

  // 如果統計API的details為空，但有訂單數據，從訂單列表生成類型統計
  if (!statsData.value?.details || statsData.value.details.length === 0) {
    console.log('No statsData.details found for orderTypes, generating from orders');

    if (orders.value && orders.value.length > 0) {
      const types = {};
      orders.value.forEach(order => {
        const displayType = formatOrderType(order.orderType);
        types[displayType] = (types[displayType] || 0) + 1;
      });

      console.log('Generated orderTypesData from orders:', types);
      return types;
    }

    return {};
  }

  const types = {};
  statsData.value.details.forEach(detail => {
    console.log('Processing detail for orderTypes:', detail);
    if (detail.orderTypes) {
      Object.keys(detail.orderTypes).forEach(type => {
        const displayType = formatOrderType(type);
        types[displayType] = (types[displayType] || 0) + detail.orderTypes[type];
      });
    }
  });

  console.log('Generated orderTypesData:', types);
  return types;
});

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

const fetchOrders = async () => {
  try {
    console.log('Fetching orders with params:', {
      brandId: brandId.value,
      storeId: storeId.value,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      status: filters.status || undefined,
      orderType: filters.orderType || undefined,
      page: pagination.currentPage,
      limit: pagination.limit
    });

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

    console.log('Orders API response:', response);

    if (response.success) {
      orders.value = response.orders || [];
      pagination.total = response.pagination?.total || 0;
      pagination.totalPages = response.pagination?.totalPages || 0;

      console.log('Set orders to:', orders.value);
      console.log('Set pagination to:', {
        total: pagination.total,
        totalPages: pagination.totalPages,
        currentPage: pagination.currentPage
      });
    } else {
      console.log('Orders API returned success: false');
    }
  } catch (err) {
    console.error('獲取訂單列表失敗:', err);
    throw err;
  }
};

const fetchStats = async () => {
  try {
    console.log('Fetching stats with params:', {
      brandId: brandId.value,
      storeId: storeId.value,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      groupBy: 'hour'
    });

    const response = await api.orderAdmin.getOrderStats({
      brandId: brandId.value,
      storeId: storeId.value,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      groupBy: 'hour'
    });

    console.log('Stats API response:', response);

    if (response.success) {
      statsData.value = response.stats;
      console.log('Set statsData to:', statsData.value);
    } else {
      console.log('Stats API returned success: false');
    }
  } catch (err) {
    console.error('獲取訂單統計失敗:', err);
    throw err;
  }
};

const fetchPopularDishes = async () => {
  try {
    console.log('Fetching popular dishes with params:', {
      brandId: brandId.value,
      storeId: storeId.value,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      limit: 10
    });

    const response = await api.orderAdmin.getPopularDishes({
      brandId: brandId.value,
      storeId: storeId.value,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      limit: 10
    });

    console.log('Popular dishes API response:', response);

    if (response.success) {
      const processedData = response.popularDishes?.map(dish => ({
        name: dish.dishName,
        count: dish.totalQuantity
      })) || [];

      popularDishesData.value = processedData;
      console.log('Set popularDishesData to:', popularDishesData.value);
    } else {
      console.log('Popular dishes API returned success: false');
    }
  } catch (err) {
    console.error('獲取熱門餐點失敗:', err);
    throw err;
  }
};

const fetchData = async () => {
  loading.value = true;
  error.value = false;
  errorMessage.value = '';

  try {
    await Promise.all([
      fetchOrders(),
      fetchStats(),
      fetchPopularDishes()
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
  fetchData();
};

const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages) return;
  pagination.currentPage = page;
  fetchOrders();
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

// 格式化函數
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
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.pagination .page-link {
  color: #0d6efd;
}

.badge {
  font-size: 0.75rem;
}
</style>
