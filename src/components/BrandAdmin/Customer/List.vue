<template>
  <div>
    <!-- 統計區域 -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">總用戶數</h6>
                <h3 class="mb-0">{{ totalUsers }}</h3>
              </div>
              <div class="align-self-center">
                <i class="bi bi-people fs-1"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">本月新增</h6>
                <h3 class="mb-0">{{ monthlyNewUsers }}</h3>
              </div>
              <div class="align-self-center">
                <i class="bi bi-person-plus fs-1"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">活躍用戶</h6>
                <h3 class="mb-0">{{ activeUsers }}</h3>
              </div>
              <div class="align-self-center">
                <i class="bi bi-person-check fs-1"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">停用用戶</h6>
                <h3 class="mb-0">{{ inactiveUsers }}</h3>
              </div>
              <div class="align-self-center">
                <i class="bi bi-person-x fs-1"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 圖表區域 -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">用戶總量趨勢 (過去30天)</h5>
          </div>
          <div class="card-body">
            <div style="height: 300px;">
              <Line :data="totalUsersChartData" :options="chartOptions" />
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">新用戶趨勢 (過去30天)</h5>
          </div>
          <div class="card-body">
            <div style="height: 300px;">
              <Line :data="newUsersChartData" :options="chartOptions" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex">
        <div class="input-group" style="width: 300px;">
          <input type="text" class="form-control" placeholder="搜尋姓名或電話..." v-model="searchQuery" @input="handleSearch">
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>

        <div class="ms-2">
          <select class="form-select" v-model="filterStatus" @change="handleFilter">
            <option value="">所有狀態</option>
            <option value="active">啟用中</option>
            <option value="inactive">已停用</option>
          </select>
        </div>
      </div>

      <div>
        <button class="btn btn-secondary me-2" @click="refreshData">
          <i class="bi bi-arrow-clockwise me-1"></i>重新整理
        </button>
      </div>
    </div>

    <!-- 網路錯誤提示 -->
    <div class="alert alert-danger" v-if="errorMessage">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
    </div>

    <!-- 用戶列表 -->
    <div class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th>姓名</th>
                <th>電話</th>
                <th>電子郵件</th>
                <th>註冊日期</th>
                <!-- <th>最後登入</th> -->
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in paginatedUsers" :key="user._id">
                <td>{{ user.name }}</td>
                <td>{{ user.phone }}</td>
                <td>{{ user.email || '-' }}</td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <!-- <td>
                  <span v-if="user.lastLogin">
                    {{ formatDate(user.lastLogin) }}
                  </span>
                  <span v-else class="text-muted">從未登入</span>
                </td> -->
                <td>
                  <span class="badge" :class="user.isActive ? 'bg-success' : 'bg-secondary'">
                    {{ user.isActive ? '啟用' : '停用' }}
                  </span>
                </td>
                <td>
                  <div class="btn-group">
                    <button type="button" class="btn btn-sm"
                      :class="user.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                      @click="toggleStatus(user)">
                      <i class="bi bi-power me-1"></i>{{ user.isActive ? '停用' : '啟用' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 分頁 -->
    <nav aria-label="用戶列表分頁" v-if="totalPages > 1" class="mt-3">
      <b-pagination v-model="currentPage" :total-rows="filteredUsers.length" :per-page="perPage"
        @page-click="handlePageChange" align="center">
      </b-pagination>
    </nav>

    <!-- 無資料提示 -->
    <div class="alert alert-info text-center py-4" v-if="filteredUsers.length === 0 && !isLoading">
      <i class="bi bi-info-circle me-2 fs-4"></i>
      <p class="mb-0">{{ searchQuery || filterStatus ? '沒有符合搜尋條件的用戶' : '尚無註冊用戶' }}</p>
    </div>

    <!-- 加載中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 狀態切換確認對話框 -->
    <b-modal v-model="showStatusModal" title="確認變更狀態" @ok="confirmToggleStatus" @cancel="cancelToggleStatus"
      :ok-variant="userToToggle && userToToggle.isActive ? 'warning' : 'success'" cancel-variant="secondary">

      <div v-if="userToToggle">
        <p>
          確定要將「<strong>{{ userToToggle.name }}</strong>」
          {{ userToToggle.isActive ? '停用' : '啟用' }}嗎？
        </p>

        <div v-if="userToToggle.isActive" class="alert alert-warning">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <strong>停用注意事項：</strong>
          <ul class="mb-0 mt-2">
            <li>該用戶將無法登入系統</li>
            <li>無法進行點餐等操作</li>
            <li>可隨時重新啟用</li>
          </ul>
        </div>

        <div v-else class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          <strong>啟用注意事項：</strong>
          <ul class="mb-0 mt-2">
            <li>該用戶將可以正常登入系統</li>
            <li>可進行點餐等正常操作</li>
          </ul>
        </div>
      </div>

      <template #modal-ok>
        確認{{ userToToggle && userToToggle.isActive ? '停用' : '啟用' }}
      </template>
    </b-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { BModal, BPagination } from 'bootstrap-vue-next';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '@/api';

// 註冊 Chart.js 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 從路由中獲取品牌ID
const route = useRoute();
const brandId = computed(() => route.params.brandId);

// 狀態變數
const users = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const filterStatus = ref('');
const errorMessage = ref('');
const userToToggle = ref(null);
const showStatusModal = ref(false);

// 統計數據
const totalUsers = ref(0);
const monthlyNewUsers = ref(0);
const activeUsers = ref(0);
const inactiveUsers = ref(0);

// 分頁狀態
const currentPage = ref(1);
const perPage = ref(20);

// 圖表數據
const totalUsersChartData = ref({
  labels: [],
  datasets: [{
    label: '總用戶數',
    data: [],
    borderColor: '#007bff',
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    tension: 0.3,
    fill: true
  }]
});

const newUsersChartData = ref({
  labels: [],
  datasets: [{
    label: '新增用戶數',
    data: [],
    borderColor: '#28a745',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    tension: 0.3,
    fill: true
  }]
});

// 圖表選項
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: '日期'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: '用戶數'
      },
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
};

// 計算過濾後的用戶列表
const filteredUsers = computed(() => {
  let filtered = users.value;

  // 搜尋過濾
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.phone.includes(query) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  }

  // 狀態過濾
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active';
    filtered = filtered.filter(user => user.isActive === isActive);
  }

  return filtered;
});

// 計算分頁後的用戶列表
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredUsers.value.slice(start, end);
});

// 計算總頁數
const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / perPage.value);
});

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無資料';

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    return '今天';
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
};

// 處理搜尋
const handleSearch = () => {
  currentPage.value = 1;
};

// 處理過濾
const handleFilter = () => {
  currentPage.value = 1;
};

// 處理分頁變更
const handlePageChange = (page) => {
  currentPage.value = page;
};

// 重新整理數據
const refreshData = async () => {
  await fetchUsers();
  await fetchChartData();
};

// 獲取用戶列表
const fetchUsers = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    // 獲取所有用戶數據用於統計和圖表
    const response = await api.adminUser.getAllUsers({
      brandId: brandId.value,
      page: 1,
      limit: 10000 // 獲取所有用戶
    });

    if (response && response.users) {
      users.value = response.users;

      // 計算統計數據
      totalUsers.value = response.users.length;
      activeUsers.value = response.users.filter(user => user.isActive).length;
      inactiveUsers.value = response.users.filter(user => !user.isActive).length;

      // 計算本月新增用戶
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      monthlyNewUsers.value = response.users.filter(user =>
        new Date(user.createdAt) >= firstDayOfMonth
      ).length;
    }
  } catch (error) {
    console.error('獲取用戶列表失敗:', error);
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

// 獲取圖表數據
const fetchChartData = async () => {
  try {
    // 生成過去30天的日期標籤
    const labels = [];
    const dates = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const formattedDate = date.toLocaleDateString('zh-TW', {
        month: '2-digit',
        day: '2-digit'
      });

      labels.push(formattedDate);
      dates.push(dateStr);
    }

    // 處理總量趨勢數據
    const totalData = [];
    let cumulativeCount = 0;

    // 先計算每日累計用戶數
    dates.forEach(dateStr => {
      const usersUntilDate = users.value.filter(user => {
        const userDate = new Date(user.createdAt).toISOString().split('T')[0];
        return userDate <= dateStr;
      }).length;

      totalData.push(usersUntilDate);
    });

    totalUsersChartData.value = {
      labels,
      datasets: [{
        label: '總用戶數',
        data: totalData,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        tension: 0.3,
        fill: true
      }]
    };

    // 處理新用戶趨勢數據
    const newData = dates.map(dateStr => {
      return users.value.filter(user => {
        const userDate = new Date(user.createdAt).toISOString().split('T')[0];
        return userDate === dateStr;
      }).length;
    });

    newUsersChartData.value = {
      labels,
      datasets: [{
        label: '新增用戶數',
        data: newData,
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.3,
        fill: true
      }]
    };

  } catch (error) {
    console.error('獲取圖表數據失敗:', error);
  }
};

// 顯示狀態切換確認對話框
const toggleStatus = (user) => {
  userToToggle.value = user;
  showStatusModal.value = true;
};

// 確認切換狀態
const confirmToggleStatus = async () => {
  if (!userToToggle.value) return;

  try {
    const newStatus = !userToToggle.value.isActive;
    await api.adminUser.toggleUserStatus({
      brandId: brandId.value,
      id: userToToggle.value._id,
      isActive: newStatus
    });

    // 更新本地狀態
    userToToggle.value.isActive = newStatus;

    // 重新計算統計數據
    activeUsers.value = users.value.filter(user => user.isActive).length;
    inactiveUsers.value = users.value.filter(user => !user.isActive).length;

    showStatusModal.value = false;
    userToToggle.value = null;
  } catch (error) {
    console.error('切換狀態失敗:', error);
    alert('切換狀態失敗，請稍後再試');
  }
};

// 取消切換狀態
const cancelToggleStatus = () => {
  userToToggle.value = null;
  showStatusModal.value = false;
};

// 生命週期鉤子
onMounted(async () => {
  await fetchUsers();
  await fetchChartData();
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

.card .card-body {
  padding: 1rem;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* 統計卡片樣式 */
.card.bg-primary,
.card.bg-success,
.card.bg-info,
.card.bg-warning {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card.bg-primary .card-title,
.card.bg-success .card-title,
.card.bg-info .card-title,
.card.bg-warning .card-title {
  opacity: 0.9;
}

/* 圖表容器樣式 */
.card .card-body>div[style*="height"] {
  position: relative;
}
</style>
