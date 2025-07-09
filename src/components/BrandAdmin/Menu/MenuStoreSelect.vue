<template>
  <div class="container-fluid">
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex">
        <div class="bg-primary rounded me-3" style="width: 6px; height: 26px;"></div>
        <h4 class="mb-0">菜單管理 - 選擇店鋪</h4>
      </div>
    </div>

    <!-- 搜尋和篩選 -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row align-items-end">
          <div class="col-md-4">
            <label class="form-label">搜尋店鋪</label>
            <div class="input-group">
              <input type="text" class="form-control" placeholder="搜尋店鋪名稱..." v-model="searchQuery"
                @input="handleSearch">
              <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label">店鋪狀態</label>
            <select class="form-select" v-model="filterActive" @change="handleSearch">
              <option value="all">所有狀態</option>
              <option value="active">僅顯示啟用</option>
              <option value="inactive">僅顯示停用</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">菜單狀態</label>
            <select class="form-select" v-model="filterMenuStatus" @change="handleSearch">
              <option value="all">所有狀態</option>
              <option value="has_menu">已設定菜單</option>
              <option value="no_menu">尚未設定菜單</option>
            </select>
          </div>
          <div class="col-md-2">
            <button @click="resetFilters" class="btn btn-outline-secondary w-100">
              <i class="bi bi-arrow-counterclockwise me-1"></i>重置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 網路錯誤提示 -->
    <div v-if="networkError" class="alert alert-danger mb-3" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ networkError }}
    </div>

    <!-- 載入中提示 -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 統計資訊 -->
    <div class="row mb-4" v-if="!isLoading && allStores.length > 0">
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">總店鋪數</h6>
                <h4 class="mb-0">{{ allStores.length }}</h4>
              </div>
              <div class="align-self-center">
                <i class="bi bi-shop fs-2"></i>
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
                <h6 class="card-title">啟用店鋪</h6>
                <h4 class="mb-0">{{ activeStoresCount }}</h4>
              </div>
              <div class="align-self-center">
                <i class="bi bi-check-circle fs-2"></i>
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
                <h6 class="card-title">已設定菜單</h6>
                <h4 class="mb-0">{{ storesWithMenuCount }}</h4>
              </div>
              <div class="align-self-center">
                <i class="bi bi-menu-button-wide fs-2"></i>
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
                <h6 class="card-title">總菜單數</h6>
                <h4 class="mb-0">{{ totalMenusCount }}</h4>
              </div>
              <div class="align-self-center">
                <i class="bi bi-grid fs-2"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 店鋪卡片列表 -->
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xxl-4 g-4">
      <div v-for="store in filteredStores" :key="store._id" class="col">
        <div class="card h-100 store-card hover-shadow">
          <div class="card-img-top position-relative overflow-hidden" style="height: 180px;">
            <img :src="store.image?.url || '/placeholder.jpg'" class="img-fluid w-100 h-100 object-fit-cover"
              :alt="store.name">
            <div class="store-status" :class="store.isActive ? 'bg-success' : 'bg-secondary'">
              {{ store.isActive ? '啟用中' : '已停用' }}
            </div>
          </div>

          <div class="card-body">
            <h5 class="card-title mb-2">{{ store.name }}</h5>

            <div class="mb-3">
              <div class="text-muted small" v-if="isTodayOpen(store)">
                <i class="bi bi-clock me-1"></i>
                今日營業: {{ formatBusinessHours(getTodayBusinessHours(store)) }}
              </div>
              <div class="text-danger small" v-else>
                <i class="bi bi-calendar-x me-1"></i>
                今日公休
              </div>
            </div>

            <!-- 菜單狀態資訊 -->
            <div class="mb-3">
              <div class="d-flex flex-wrap">
                <span class="badge bg-info me-1 mb-1" v-if="store.menuStats && store.menuStats.total > 0">
                  <i class="bi bi-menu-button me-1"></i>{{ store.menuStats.total }} 個菜單
                </span>
                <span class="badge bg-warning me-1 mb-1" v-else>
                  <i class="bi bi-exclamation-triangle me-1"></i>尚未設定菜單
                </span>

                <span class="badge bg-success me-1 mb-1" v-if="store.menuStats && store.menuStats.active > 0">
                  <i class="bi bi-check-circle me-1"></i>{{ store.menuStats.active }} 個啟用
                </span>
              </div>

              <!-- 菜單類型統計 -->
              <div class="small text-muted mt-2" v-if="store.menuStats && store.menuStats.byType">
                <div v-if="store.menuStats.byType.food > 0">
                  現金購買餐點: {{ store.menuStats.byType.food }} 個
                </div>
                <div v-if="store.menuStats.byType.cash_coupon > 0">
                  現金購買預購券: {{ store.menuStats.byType.cash_coupon }} 個
                </div>
                <div v-if="store.menuStats.byType.point_exchange > 0">
                  點數兌換: {{ store.menuStats.byType.point_exchange }} 個
                </div>
              </div>
            </div>
          </div>

          <div class="card-footer bg-transparent border-top-0">
            <router-link :to="`/admin/${brandId}/menus/store/${store._id}`" class="btn btn-primary w-100">
              <i class="bi bi-menu-button-wide me-1"></i>管理菜單
            </router-link>
          </div>
        </div>
      </div>

      <!-- 無資料提示 -->
      <div class="col-12" v-if="filteredStores.length === 0 && !isLoading">
        <div class="alert alert-info text-center py-4">
          <i class="bi bi-info-circle me-2 fs-4"></i>
          <p class="mb-0">{{ getNoDataMessage() }}</p>
          <div class="mt-3" v-if="allStores.length === 0">
            <router-link :to="`/admin/${brandId}/stores/create`" class="btn btn-primary">
              <i class="bi bi-plus-lg me-1"></i>新增第一間店鋪
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 分頁控制 -->
    <nav aria-label="店鋪列表分頁" class="mt-4" v-if="pagination.totalPages > 1">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">上一頁</a>
        </li>

        <li class="page-item" v-for="page in getPageNumbers()" :key="page" :class="{ active: currentPage === page }">
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api';

// 從路由中獲取品牌ID
const route = useRoute();
const brandId = computed(() => route.params.brandId);

// 狀態變數
const allStores = ref([]);
const filteredStores = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const filterActive = ref('all');
const filterMenuStatus = ref('all');
const currentPage = ref(1);
const networkError = ref('');
const pagination = reactive({
  total: 0,
  totalPages: 0,
  limit: 12 // 每頁顯示12個店鋪
});

// 計算屬性
const activeStoresCount = computed(() => {
  return allStores.value.filter(store => store.isActive).length;
});

const storesWithMenuCount = computed(() => {
  return allStores.value.filter(store =>
    store.menuStats && store.menuStats.total > 0
  ).length;
});

const totalMenusCount = computed(() => {
  return allStores.value.reduce((total, store) => {
    return total + (store.menuStats ? store.menuStats.total : 0);
  }, 0);
});

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

// 獲取無資料提示訊息
const getNoDataMessage = () => {
  if (allStores.value.length === 0) {
    return '尚未創建任何店鋪';
  }

  if (searchQuery.value) {
    return '沒有符合搜尋條件的店鋪';
  }

  if (filterActive.value !== 'all' || filterMenuStatus.value !== 'all') {
    return '沒有符合篩選條件的店鋪';
  }

  return '沒有店鋪資料';
};

// 頁碼生成
const getPageNumbers = () => {
  const totalPages = pagination.totalPages;
  const currentPageNum = currentPage.value;
  const pageNumbers = [];

  // 顯示最多 5 個頁碼
  if (totalPages <= 5) {
    // 若總頁數少於 5，顯示全部頁碼
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    // 若總頁數大於 5，顯示當前頁附近的頁碼
    if (currentPageNum <= 3) {
      // 當前頁在前 3 頁，顯示前 5 頁
      for (let i = 1; i <= 5; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPageNum >= totalPages - 2) {
      // 當前頁在後 3 頁，顯示後 5 頁
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 當前頁在中間，顯示當前頁及其前後 2 頁
      for (let i = currentPageNum - 2; i <= currentPageNum + 2; i++) {
        pageNumbers.push(i);
      }
    }
  }

  return pageNumbers;
};

// 獲取店鋪菜單統計
const getStoreMenuStats = async (storeId) => {
  try {
    const response = await api.menu.getAllStoreMenus({
      brandId: brandId.value,
      storeId: storeId,
      includeUnpublished: true
    });

    if (response && response.menus) {
      const menus = response.menus;
      const stats = {
        total: menus.length,
        active: menus.filter(m => m.isActive).length,
        byType: {
          food: menus.filter(m => m.menuType === 'food').length,
          cash_coupon: menus.filter(m => m.menuType === 'cash_coupon').length,
          point_exchange: menus.filter(m => m.menuType === 'point_exchange').length
        }
      };
      return stats;
    }
  } catch (error) {
    console.warn('獲取店鋪菜單統計失敗:', error);
  }

  return {
    total: 0,
    active: 0,
    byType: { food: 0, cash_coupon: 0, point_exchange: 0 }
  };
};

// 加載店鋪列表
const fetchStores = async () => {
  if (!brandId.value) return;

  isLoading.value = true;
  networkError.value = '';

  try {
    // 獲取店鋪列表
    const response = await api.store.getAllStores({
      brandId: brandId.value
    });

    if (response && response.stores) {
      allStores.value = response.stores;

      // 為每個店鋪獲取菜單統計
      const storesWithStats = await Promise.all(
        allStores.value.map(async (store) => {
          const menuStats = await getStoreMenuStats(store._id);
          return {
            ...store,
            menuStats
          };
        })
      );

      allStores.value = storesWithStats;

      // 應用篩選
      applyFilters();

    } else {
      allStores.value = [];
      filteredStores.value = [];
    }
  } catch (error) {
    console.error('獲取店鋪列表失敗:', error);
    networkError.value = '網路連線有問題，無法獲取店鋪資料';
  } finally {
    isLoading.value = false;
  }
};

// 應用篩選邏輯
const applyFilters = () => {
  let filtered = [...allStores.value];

  // 搜尋篩選
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(store =>
      store.name.toLowerCase().includes(query)
    );
  }

  // 店鋪狀態篩選
  if (filterActive.value === 'active') {
    filtered = filtered.filter(store => store.isActive);
  } else if (filterActive.value === 'inactive') {
    filtered = filtered.filter(store => !store.isActive);
  }

  // 菜單狀態篩選
  if (filterMenuStatus.value === 'has_menu') {
    filtered = filtered.filter(store =>
      store.menuStats && store.menuStats.total > 0
    );
  } else if (filterMenuStatus.value === 'no_menu') {
    filtered = filtered.filter(store =>
      !store.menuStats || store.menuStats.total === 0
    );
  }

  // 分頁處理
  pagination.total = filtered.length;
  pagination.totalPages = Math.ceil(pagination.total / pagination.limit);

  // 確保當前頁在有效範圍內
  if (currentPage.value > pagination.totalPages && pagination.totalPages > 0) {
    currentPage.value = pagination.totalPages;
  }

  const start = (currentPage.value - 1) * pagination.limit;
  const end = start + pagination.limit;
  filteredStores.value = filtered.slice(start, end);
};

// 切換頁碼
const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages) {
    return;
  }

  currentPage.value = page;
  applyFilters();
};

// 處理搜尋
const handleSearch = () => {
  currentPage.value = 1; // 重置頁碼
  applyFilters();
};

// 重置篩選器
const resetFilters = () => {
  searchQuery.value = '';
  filterActive.value = 'all';
  filterMenuStatus.value = 'all';
  currentPage.value = 1;
  applyFilters();
};

// 監聽品牌ID變化
watch(() => brandId.value, (newId, oldId) => {
  if (newId !== oldId) {
    fetchStores();
  }
});

// 生命週期鉤子
onMounted(() => {
  // 載入店鋪列表
  fetchStores();
});
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}

/* 店鋪卡片樣式 */
.store-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.hover-shadow:hover {
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

/* 統計卡片樣式 */
.card.bg-primary,
.card.bg-success,
.card.bg-info,
.card.bg-warning {
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card.bg-primary .card-body,
.card.bg-success .card-body,
.card.bg-info .card-body,
.card.bg-warning .card-body {
  padding: 1.25rem;
}

/* 分頁樣式 */
.pagination .page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.pagination .page-link {
  color: #0d6efd;
}

.pagination .page-link:focus {
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
</style>
