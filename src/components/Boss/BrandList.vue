<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between mb-3">
      <div class="d-flex align-items-center">
        <div class="input-group" style="width: 300px;">
          <input type="text" class="form-control" placeholder="搜尋品牌..." v-model="searchQuery" @input="handleSearch">
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>
      <div>
        <router-link :to="{ name: 'brand-create' }" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增品牌
        </router-link>
      </div>
    </div>

    <!-- 網路錯誤提示 -->
    <div class="alert alert-danger" v-if="networkError">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ networkError }}
    </div>

    <!-- 品牌卡片列表 -->
    <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
      <div class="col" v-for="brand in brands" :key="brand._id">
        <div class="card h-100">
          <div class="card-img-top position-relative overflow-hidden" style="height: 200px;">
            <img :src="brand.image?.url || '/placeholder.jpg'" class="img-fluid w-100 h-100 object-fit-cover"
              :alt="brand.name">
            <div class="position-absolute top-0 end-0 p-2">
              <div class="badge bg-success" v-if="brand.storesCount > 0">{{ brand.storesCount }} 間店鋪</div>
            </div>
          </div>
          <div class="card-body">
            <h5 class="card-title d-flex justify-content-between align-items-center">
              {{ brand.name }}
              <span class="badge rounded-pill" :class="brand.isActive ? 'bg-success' : 'bg-secondary'">
                {{ brand.isActive ? '啟用中' : '已停用' }}
              </span>
            </h5>
            <p class="card-text" v-if="brand.description">{{ truncateText(brand.description, 100) }}</p>
            <p class="card-text small text-muted" v-if="brand.createdAt">
              建立於: {{ formatDate(brand.createdAt) }}
            </p>
          </div>
          <div class="card-footer bg-transparent border-top-0">
            <div class="d-flex flex-wrap">
              <div class="btn-group mb-2 me-2">
                <router-link :to="{ name: 'brand-detail', params: { id: brand._id } }"
                  class="btn btn-outline-primary btn-sm">
                  <i class="bi bi-eye me-1"></i>查看
                </router-link>
                <router-link :to="{ name: 'brand-admin-dashboard', params: { brandId: brand._id } }"
                  class="btn btn-outline-primary btn-sm">
                  <i class="bi bi-door-open me-1"></i>進入
                </router-link>
              </div>
              <div class="btn-group mb-2 me-2">
                <router-link :to="{ name: 'brand-edit', params: { id: brand._id } }"
                  class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-pencil me-1"></i>編輯
                </router-link>
              </div>
              <button class="btn btn-sm mb-2" :class="brand.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                @click="toggleBrandActive(brand)">
                <i class="bi" :class="brand.isActive ? 'bi-pause-fill me-1' : 'bi-play-fill me-1'"></i>
                {{ brand.isActive ? '停用' : '啟用' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 無資料提示 -->
      <div class="col-12" v-if="brands.length === 0 && !isLoading">
        <div class="alert alert-info text-center">
          <i class="bi bi-info-circle me-2"></i>
          {{ searchQuery ? '沒有符合搜尋條件的品牌' : '尚未創建任何品牌' }}
        </div>
      </div>

      <!-- 加載中提示 -->
      <div class="col-12" v-if="isLoading">
        <div class="d-flex justify-content-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">加載中...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分頁控制 -->
    <nav aria-label="品牌列表分頁" class="mt-4" v-if="pagination.totalPages > 1">
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
import { ref, reactive, onMounted } from 'vue';
import api from '@/api';

// 狀態變數
const brands = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const currentPage = ref(1);
const networkError = ref('');
const pagination = reactive({
  total: 0,
  totalPages: 0,
  limit: 12
});

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

// 加載品牌列表
const fetchBrands = async () => {
  isLoading.value = true;
  networkError.value = '';

  try {
    // 實際 API 呼叫
    const response = await api.brand.getAllBrands();

    if (response && response.brands) {
      // 添加店鋪數量計數
      brands.value = response.brands.map(brand => ({
        ...brand,
        storesCount: 0 // 初始值，實際應從API獲取
      }));

      // 獲取每個品牌的店鋪數量
      for (let brand of brands.value) {
        try {
          const storesResponse = await api.brand.getBrandStores({ brandId: brand._id });
          brand.storesCount = storesResponse.stores?.length || 0;
        } catch (error) {
          console.error(`獲取品牌 ${brand.name} 的店鋪列表失敗:`, error);
        }
      }

      // 處理搜尋過濾
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        brands.value = brands.value.filter(brand =>
          brand.name.toLowerCase().includes(query) ||
          (brand.description && brand.description.toLowerCase().includes(query))
        );
      }

      // 分頁處理(目前簡單處理)
      pagination.total = brands.value.length;
      pagination.totalPages = Math.ceil(pagination.total / pagination.limit);
      const start = (currentPage.value - 1) * pagination.limit;
      const end = start + pagination.limit;
      brands.value = brands.value.slice(start, end);
    }
  } catch (error) {
    console.error('獲取品牌列表失敗:', error);
    networkError.value = '網路連線有問題，無法獲取品牌資料';
  } finally {
    isLoading.value = false;
  }
};

// 切換頁碼
const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages) {
    return;
  }

  currentPage.value = page;
  fetchBrands();
};

// 處理搜尋
const handleSearch = () => {
  currentPage.value = 1; // 重置頁碼
  fetchBrands();
};

// 轉換日期格式
const formatDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 截斷文字
const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength) + '...';
};

// 切換品牌啟用狀態
const toggleBrandActive = async (brand) => {
  try {
    const newStatus = !brand.isActive;
    await api.brand.toggleBrandActive({
      id: brand._id,
      isActive: newStatus
    });

    // 更新本地狀態
    brand.isActive = newStatus;

  } catch (error) {
    console.error('切換品牌狀態失敗:', error);
    alert('切換品牌狀態時發生錯誤');
  }
};

// 生命週期鉤子
onMounted(() => {
  // 載入品牌列表
  fetchBrands();

  // 監聽刷新列表事件
  window.addEventListener('refresh-brand-list', () => {
    fetchBrands();
  });
});
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}

/* 卡片懸停效果 */
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}
</style>
