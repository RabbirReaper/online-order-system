<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between mb-3">
      <div class="d-flex align-items-center">
        <BInputGroup style="width: 300px;">
          <BFormInput v-model="searchQuery" placeholder="搜尋品牌..." @input="handleSearch" />
          <BButton variant="outline-secondary" @click="handleSearch">
            <i class="bi bi-search"></i>
          </BButton>
        </BInputGroup>
      </div>
      <div>
        <router-link :to="{ name: 'brand-create' }" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增品牌
        </router-link>
      </div>
    </div>

    <!-- 網路錯誤提示 -->
    <BAlert variant="danger" show dismissible v-if="networkError">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ networkError }}
    </BAlert>

    <!-- 品牌卡片列表 -->
    <BRow class="g-4">
      <BCol cols="12" md="6" xl="4" v-for="brand in brands" :key="brand._id">
        <BCard class="h-100">
          <div class="position-relative overflow-hidden" style="height: 200px;">
            <BCardImg :src="brand.image?.url || '/placeholder.jpg'" class="w-100 h-100 object-fit-cover"
              :alt="brand.name" />
            <div class="position-absolute top-0 end-0 p-2">
              <BBadge variant="success" v-if="brand.storesCount > 0">{{ brand.storesCount }} 間店鋪</BBadge>
            </div>
          </div>
          <BCardBody>
            <BCardTitle class="d-flex justify-content-between align-items-center">
              {{ brand.name }}
              <BBadge pill :variant="brand.isActive ? 'success' : 'secondary'">
                {{ brand.isActive ? '啟用中' : '已停用' }}
              </BBadge>
            </BCardTitle>
            <BCardText v-if="brand.description">{{ truncateText(brand.description, 100) }}</BCardText>
            <BCardText class="small text-muted" v-if="brand.createdAt">
              建立於: {{ formatDate(brand.createdAt) }}
            </BCardText>
          </BCardBody>
          <BCardFooter class="bg-transparent border-top-0">
            <div class="d-flex flex-wrap">
              <BButtonGroup class="mb-2 me-2">
                <router-link :to="{ name: 'brand-detail', params: { id: brand._id } }"
                  class="btn btn-outline-primary btn-sm">
                  <i class="bi bi-eye me-1"></i>查看
                </router-link>
                <router-link :to="{ name: 'brand-admin-dashboard', params: { brandId: brand._id } }"
                  class="btn btn-outline-primary btn-sm">
                  <i class="bi bi-door-open me-1"></i>進入
                </router-link>
              </BButtonGroup>
              <BButtonGroup class="mb-2 me-2">
                <router-link :to="{ name: 'brand-edit', params: { id: brand._id } }"
                  class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-pencil me-1"></i>編輯
                </router-link>
              </BButtonGroup>
              <BButton size="sm" class="mb-2" :variant="brand.isActive ? 'outline-warning' : 'outline-success'"
                @click="toggleBrandActive(brand)">
                <i class="bi" :class="brand.isActive ? 'bi-pause-fill me-1' : 'bi-play-fill me-1'"></i>
                {{ brand.isActive ? '停用' : '啟用' }}
              </BButton>
            </div>
          </BCardFooter>
        </BCard>
      </BCol>

      <!-- 無資料提示 -->
      <BCol cols="12" v-if="brands.length === 0 && !isLoading">
        <BAlert variant="info" show class="text-center">
          <i class="bi bi-info-circle me-2"></i>
          {{ searchQuery ? '沒有符合搜尋條件的品牌' : '尚未創建任何品牌' }}
        </BAlert>
      </BCol>

      <!-- 加載中提示 -->
      <BCol cols="12" v-if="isLoading">
        <div class="d-flex justify-content-center my-5">
          <BSpinner variant="primary" label="加載中...">
            <span class="visually-hidden">加載中...</span>
          </BSpinner>
        </div>
      </BCol>
    </BRow>

    <!-- 分頁控制 -->
    <BPagination v-if="pagination.totalPages > 1" v-model="currentPage" :total-rows="pagination.total"
      :per-page="pagination.limit" align="center" class="mt-4" @update:modelValue="changePage" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '@/api';
import {
  BRow, BCol, BCard, BCardImg, BCardBody, BCardTitle, BCardText, BCardFooter,
  BInputGroup, BFormInput, BButton, BButtonGroup, BAlert, BBadge, BSpinner, BPagination
} from 'bootstrap-vue-next';

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
