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
        <button class="btn btn-primary" @click="goToCreateBrand">
          <i class="bi bi-plus-lg me-1"></i>新增品牌
        </button>
      </div>
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
              <span class="badge rounded-pill" :class="getBadgeClass(brand)">
                {{ getStatusText(brand) }}
              </span>
            </h5>
            <p class="card-text" v-if="brand.description">{{ truncateText(brand.description, 100) }}</p>
            <p class="card-text small text-muted" v-if="brand.createdAt">
              建立於: {{ formatDate(brand.createdAt) }}
            </p>
          </div>
          <div class="card-footer bg-transparent border-top-0">
            <div class="d-flex justify-content-between">
              <button class="btn btn-outline-primary btn-sm" @click="viewBrandDetails(brand)">
                <i class="bi bi-eye me-1"></i>查看
              </button>
              <div>
                <button class="btn btn-outline-secondary btn-sm me-1" @click="editBrand(brand)">
                  <i class="bi bi-pencil me-1"></i>編輯
                </button>
                <button class="btn btn-outline-danger btn-sm" @click="confirmDeleteBrand(brand)">
                  <i class="bi bi-trash me-1"></i>刪除
                </button>
              </div>
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

    <!-- 刪除確認對話框 -->
    <div class="modal fade" id="deleteBrandModal" tabindex="-1" ref="deleteModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedBrand">
            <p>您確定要刪除品牌 <strong>{{ selectedBrand.name }}</strong> 嗎？</p>
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              此操作無法撤銷，品牌相關的所有資料都將被永久刪除。
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteBrand" :disabled="isDeleting">
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              {{ isDeleting ? '處理中...' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Modal } from 'bootstrap';
import api from '@/api';

// 狀態變數
const brands = ref([]);
const isLoading = ref(true);
const selectedBrand = ref(null);
const searchQuery = ref('');
const isDeleting = ref(false);
const deleteModal = ref(null);
const currentPage = ref(1);
const pagination = reactive({
  total: 0,
  totalPages: 0,
  limit: 12
});

// 模擬品牌數據 (實際應從 API 獲取)
const mockBrands = [
  {
    _id: '1',
    name: '好味餐廳',
    description: '提供各式中式料理，以川菜為主，提供友善的用餐環境和優質的服務。',
    image: { url: 'https://placehold.co/600x400/orange/white?text=好味餐廳' },
    storesCount: 3,
    status: 'active',
    createdAt: '2023-01-15T08:00:00.000Z'
  },
  {
    _id: '2',
    name: '健康食堂',
    description: '專注於健康飲食的連鎖品牌，提供低卡路里、高蛋白質的餐點選擇。',
    image: { url: 'https://placehold.co/600x400/green/white?text=健康食堂' },
    storesCount: 5,
    status: 'active',
    createdAt: '2023-02-20T09:30:00.000Z'
  },
  {
    _id: '3',
    name: '義饗廚房',
    description: '正宗義大利美食，堅持使用進口原料，為顧客帶來地道的義式風味。',
    image: { url: 'https://placehold.co/600x400/red/white?text=義饗廚房' },
    storesCount: 2,
    status: 'active',
    createdAt: '2023-03-10T10:15:00.000Z'
  },
  {
    _id: '4',
    name: '上善茶坊',
    description: '傳統台灣茶文化的現代詮釋，提供多種台灣茶品和精緻茶點。',
    image: { url: 'https://placehold.co/600x400/teal/white?text=上善茶坊' },
    storesCount: 7,
    status: 'active',
    createdAt: '2023-04-05T14:20:00.000Z'
  },
  {
    _id: '5',
    name: '銀河咖啡',
    description: '從世界各地嚴選咖啡豆，堅持手工烘焙，為咖啡愛好者提供極致體驗。',
    image: { url: 'https://placehold.co/600x400/brown/white?text=銀河咖啡' },
    storesCount: 4,
    status: 'inactive',
    createdAt: '2023-05-18T11:45:00.000Z'
  },
  {
    _id: '6',
    name: '鮮活壽司',
    description: '每日直送新鮮海產，由日本師傅親自料理，帶來正宗日式風味。',
    image: { url: 'https://placehold.co/600x400/navy/white?text=鮮活壽司' },
    storesCount: 1,
    status: 'active',
    createdAt: '2023-06-22T16:30:00.000Z'
  }
];

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
  try {
    // 這裡使用的是實際 API 的呼叫方式，但在示例中使用模擬數據
    /*
    const response = await api.brand.getAllBrands({
      page: currentPage.value,
      limit: pagination.limit,
      search: searchQuery.value
    });

    brands.value = response.brands;
    pagination.total = response.pagination.total;
    pagination.totalPages = response.pagination.totalPages;
    */

    // 模擬 API 呼叫
    await new Promise(resolve => setTimeout(resolve, 500));

    // 模擬搜尋功能
    let filteredBrands = [...mockBrands];
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filteredBrands = mockBrands.filter(brand =>
        brand.name.toLowerCase().includes(query) ||
        (brand.description && brand.description.toLowerCase().includes(query))
      );
    }

    // 模擬分頁
    pagination.total = filteredBrands.length;
    pagination.totalPages = Math.ceil(filteredBrands.length / pagination.limit);

    const start = (currentPage.value - 1) * pagination.limit;
    const end = start + pagination.limit;
    brands.value = filteredBrands.slice(start, end);

  } catch (error) {
    console.error('獲取品牌列表失敗:', error);
    alert('載入品牌列表時發生錯誤');
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

// 生成狀態文字
const getStatusText = (brand) => {
  return brand.status === 'active' ? '營運中' : '已停用';
};

// 生成狀態徽章樣式
const getBadgeClass = (brand) => {
  return brand.status === 'active' ? 'bg-success' : 'bg-secondary';
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

// 前往創建品牌頁面
const goToCreateBrand = () => {
  // 觸發父組件切換
  // 可以使用自訂事件或 vue-router
  // 這裡假設父組件透過設置 activeMenu 來控制
  window.dispatchEvent(new CustomEvent('set-active-menu', { detail: 'brand-create' }));
};

// 查看品牌詳情
const viewBrandDetails = (brand) => {
  console.log('查看品牌詳情:', brand);
  // 實際應用中可能會導航到品牌詳情頁面
};

// 編輯品牌
const editBrand = (brand) => {
  console.log('編輯品牌:', brand);
  // 實際應用中可能會導航到品牌編輯頁面
};

// 確認刪除品牌
const confirmDeleteBrand = (brand) => {
  selectedBrand.value = brand;
  if (deleteModal.value) {
    deleteModal.value.show();
  }
};

// 執行刪除品牌
const deleteBrand = async () => {
  if (!selectedBrand.value) return;

  isDeleting.value = true;

  try {
    // 實際 API 呼叫
    /*
    await api.brand.deleteBrand(selectedBrand.value._id);
    */

    // 模擬 API 呼叫
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 移除列表中的品牌
    brands.value = brands.value.filter(brand => brand._id !== selectedBrand.value._id);

    // 關閉對話框
    if (deleteModal.value) {
      deleteModal.value.hide();
    }

    // 顯示成功訊息
    alert(`品牌 ${selectedBrand.value.name} 已成功刪除`);

    // 如果當前頁已空，且不是第一頁，則返回上一頁
    if (brands.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
      fetchBrands();
    } else if (pagination.total > 0) {
      // 重新整理資料，以更新總數等
      fetchBrands();
    }

  } catch (error) {
    console.error('刪除品牌失敗:', error);
    alert('刪除品牌時發生錯誤');
  } finally {
    isDeleting.value = false;
    selectedBrand.value = null;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 初始化刪除確認對話框
  const modalElement = document.getElementById('deleteBrandModal');
  if (modalElement) {
    deleteModal.value = new Modal(modalElement);
  }

  // 載入品牌列表
  fetchBrands();

  // 監聽自訂事件，處理外部切換菜單
  window.addEventListener('set-active-menu', (event) => {
    if (event.detail === 'brand-list') {
      fetchBrands();
    }
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
