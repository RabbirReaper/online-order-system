<template>
  <div class="container-fluid py-4">
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-0">{{ storeName }} 的菜單詳情</h4>
        <p class="text-muted mb-0" v-if="store">
          店鋪狀態:
          <span class="badge" :class="store.isActive ? 'bg-success' : 'bg-secondary'">
            {{ store.isActive ? '啟用中' : '已停用' }}
          </span>
        </p>
      </div>
      <div class="d-flex">
        <router-link :to="`/admin/${brandId}/menus/store/${storeId}`" class="btn btn-outline-secondary me-2">
          <i class="bi bi-arrow-left me-1"></i>返回菜單管理
        </router-link>
        <router-link v-if="menu" :to="`/admin/${brandId}/menus/edit/${storeId}/${menu._id}`" class="btn btn-primary">
          <i class="bi bi-pencil me-1"></i>編輯菜單
        </router-link>
      </div>
    </div>

    <!-- 載入中提示 -->
    <div v-if="isLoading" class="d-flex justify-content-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div v-else-if="error" class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <!-- 菜單詳情內容 -->
    <div v-else-if="menu" class="row">
      <div class="col-12">
        <!-- 菜單資訊卡片 -->
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center"
            :class="menu.isActive ? 'bg-success text-white' : 'bg-secondary text-white'">
            <div class="d-flex align-items-center">
              <h5 class="mb-0">{{ menu.name }}</h5>
              <span class="badge rounded-pill bg-light text-dark ms-2">
                {{ menu.isActive ? '啟用中' : '已停用' }}
              </span>
            </div>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <p class="mb-2"><strong>菜單ID:</strong> {{ menu._id }}</p>
                <p class="mb-2"><strong>所屬店鋪:</strong> {{ storeName }}</p>
                <p class="mb-2"><strong>分類數量:</strong> {{ menu.categories ? menu.categories.length : 0 }}</p>
                <p class="mb-2"><strong>餐點數量:</strong> {{ countTotalDishes() }}</p>
              </div>
              <div class="col-md-6">
                <p class="mb-2"><strong>啟用餐點數量:</strong> {{ countActiveDishes() }}</p>
                <p class="mb-2"><strong>建立時間:</strong> {{ formatDate(menu.createdAt) }}</p>
                <p class="mb-2"><strong>最後更新:</strong> {{ formatDate(menu.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 菜單預覽 -->
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">菜單預覽</h5>
          </div>
          <div class="card-body">
            <!-- 無分類提示 -->
            <div v-if="!menu.categories || menu.categories.length === 0" class="text-center py-4">
              <p class="mb-0 text-muted">此菜單尚未設置任何分類</p>
            </div>

            <!-- 菜單內容 -->
            <div v-else class="menu-preview">
              <div v-for="category in sortedCategories" :key="category._id" class="menu-category mb-4">
                <h5 class="category-title">{{ category.name }}</h5>
                <p v-if="category.description" class="category-description text-muted">{{ category.description }}</p>

                <!-- 分類餐點 -->
                <div class="category-dishes">
                  <div v-if="category.dishes && category.dishes.length > 0"
                    class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                    <div v-for="dish in sortDishes(category.dishes)" :key="dish._id" class="col">
                      <div class="card h-100 dish-card" :class="{ 'dish-disabled': !dish.isPublished }">
                        <!-- 餐點圖片 -->
                        <img :src="getDishImage(dish)" class="card-img-top dish-image" :alt="getDishName(dish)">

                        <!-- 停用標記 -->
                        <div class="dish-status-badge" v-if="!dish.isPublished">
                          <span class="badge bg-secondary">已停用</span>
                        </div>

                        <div class="card-body">
                          <h6 class="dish-name">{{ getDishName(dish) }}</h6>
                          <p class="dish-description text-muted small">{{ getDishDescription(dish) }}</p>
                          <p class="dish-price">{{ formatPrice(dish.price || getDishPrice(dish)) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-3 bg-light rounded">
                    <p class="mb-0 text-muted">此分類尚未添加餐點</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 詳細資料表格 -->
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">詳細資料</h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover table-striped mb-0">
                <thead>
                  <tr>
                    <th>分類</th>
                    <th>餐點</th>
                    <th>價格</th>
                    <th>狀態</th>
                    <th>排序</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(category, categoryIndex) in sortedCategories" :key="categoryIndex">
                    <tr>
                      <td :rowspan="category.dishes && category.dishes.length > 0 ? category.dishes.length + 1 : 2"
                        class="align-middle fw-bold border-end">
                        {{ category.name }}
                        <div class="small text-muted">順序: {{ category.order }}</div>
                      </td>
                    </tr>
                    <template v-if="category.dishes && category.dishes.length > 0">
                      <tr v-for="dish in sortDishes(category.dishes)" :key="dish._id">
                        <td>{{ getDishName(dish) }}</td>
                        <td>{{ formatPrice(dish.price || getDishPrice(dish)) }}</td>
                        <td>
                          <span class="badge" :class="dish.isPublished ? 'bg-success' : 'bg-secondary'">
                            {{ dish.isPublished ? '啟用' : '停用' }}
                          </span>
                        </td>
                        <td>{{ dish.order }}</td>
                      </tr>
                    </template>
                    <tr v-else>
                      <td colspan="4" class="text-center text-muted">此分類尚未添加餐點</td>
                    </tr>
                  </template>
                  <tr v-if="!menu.categories || menu.categories.length === 0">
                    <td colspan="5" class="text-center text-muted py-3">此菜單尚未設置任何分類</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api';

// 路由相關
const route = useRoute();
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);
const menuId = computed(() => route.params.menuId);

// 狀態變數
const store = ref(null);
const menu = ref(null);
const dishTemplates = ref([]);
const isLoading = ref(true);
const error = ref('');
const storeName = ref('載入中...');

// 計算屬性
const sortedCategories = computed(() => {
  if (!menu.value || !menu.value.categories) return [];
  return [...menu.value.categories].sort((a, b) => a.order - b.order);
});

// 格式化價格
const formatPrice = (price) => {
  if (price === undefined || price === null) return '$0';
  return `$${price}`;
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無資料';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 排序餐點
const sortDishes = (dishes) => {
  if (!dishes) return [];
  return [...dishes].sort((a, b) => a.order - b.order);
};

// 獲取餐點名稱
const getDishName = (dish) => {
  if (!dish || !dish.dishTemplate) return '未知餐點';

  // 如果後端已經填充了dishTemplate對象
  if (typeof dish.dishTemplate === 'object' && dish.dishTemplate !== null) {
    return dish.dishTemplate.name;
  }

  // 從dishTemplates中尋找
  const template = dishTemplates.value.find(t => t._id === dish.dishTemplate);
  return template ? template.name : '未知餐點';
};

// 獲取餐點描述
const getDishDescription = (dish) => {
  if (!dish || !dish.dishTemplate) return '';

  // 如果後端已經填充了dishTemplate對象
  if (typeof dish.dishTemplate === 'object' && dish.dishTemplate !== null) {
    return dish.dishTemplate.description || '';
  }

  // 從dishTemplates中尋找
  const template = dishTemplates.value.find(t => t._id === dish.dishTemplate);
  return template ? template.description || '' : '';
};

// 獲取餐點圖片
const getDishImage = (dish) => {
  if (!dish || !dish.dishTemplate) return '/placeholder.jpg';

  // 如果後端已經填充了dishTemplate對象
  if (typeof dish.dishTemplate === 'object' && dish.dishTemplate !== null) {
    return dish.dishTemplate.image?.url || '/placeholder.jpg';
  }

  // 從dishTemplates中尋找
  const template = dishTemplates.value.find(t => t._id === dish.dishTemplate);
  return template && template.image && template.image.url ? template.image.url : '/placeholder.jpg';
};

// 獲取餐點價格
const getDishPrice = (dish) => {
  if (!dish) return 0;

  // 如果dish有自己的價格，優先使用
  if (dish.price !== undefined && dish.price !== null) return dish.price;

  // 從已填充的dishTemplate對象獲取
  if (typeof dish.dishTemplate === 'object' && dish.dishTemplate !== null) {
    return dish.dishTemplate.basePrice || 0;
  }

  // 從dishTemplates中尋找
  const template = dishTemplates.value.find(t => t._id === dish.dishTemplate);
  return template ? template.basePrice || 0 : 0;
};

// 計算總餐點數量
const countTotalDishes = () => {
  if (!menu.value || !menu.value.categories) return 0;
  return menu.value.categories.reduce((total, category) => {
    return total + (category.dishes ? category.dishes.length : 0);
  }, 0);
};

// 計算已啟用餐點數量
const countActiveDishes = () => {
  if (!menu.value || !menu.value.categories) return 0;
  return menu.value.categories.reduce((total, category) => {
    if (!category.dishes) return total;
    return total + category.dishes.filter(dish => dish.isPublished).length;
  }, 0);
};

// 獲取餐點模板資料
const fetchDishTemplates = async () => {
  if (!brandId.value) return;

  try {
    const response = await api.dish.getAllDishTemplates({ brandId: brandId.value });
    if (response && response.templates) {
      dishTemplates.value = response.templates;
    }
  } catch (err) {
    console.error('獲取餐點模板失敗:', err);
  }
};

// 獲取店鋪和菜單資料
const fetchData = async () => {
  if (!storeId.value || !menuId.value) return;

  isLoading.value = true;
  error.value = '';

  try {
    // 1. 獲取店鋪資料
    const storeResponse = await api.store.getStoreById(storeId.value);
    if (storeResponse && storeResponse.store) {
      store.value = storeResponse.store;
      storeName.value = storeResponse.store.name;
    } else {
      error.value = '無法獲取店鋪資訊';
    }

    // 2. 獲取餐點模板資料
    await fetchDishTemplates();

    // 3. 獲取菜單資料
    const menuResponse = await api.menu.getStoreMenu(storeId.value);
    if (menuResponse && menuResponse.menu && menuResponse.menu._id === menuId.value) {
      menu.value = menuResponse.menu;
    } else {
      error.value = '無法獲取菜單資訊';
    }
  } catch (err) {
    console.error('獲取資料失敗:', err);
    error.value = '獲取資料時發生錯誤，請稍後再試';
  } finally {
    isLoading.value = false;
  }
};

// 監聽ID變化
watch([storeId, menuId, brandId], ([newStoreId, newMenuId, newBrandId]) => {
  if (newStoreId && newMenuId && newBrandId) {
    fetchData();
  }
});

// 生命週期鉤子
onMounted(() => {
  // 載入資料
  fetchData();
});
</script>

<style scoped>
/* 菜單預覽樣式 */
.menu-preview {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}

.category-title {
  border-bottom: 2px solid #0d6efd;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  color: #0d6efd;
}

.category-description {
  margin-bottom: 1.5rem;
  font-style: italic;
}

.dish-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  position: relative;
}

.dish-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.dish-disabled {
  opacity: 0.6;
}

.dish-disabled::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.dish-image {
  height: 160px;
  object-fit: cover;
}

.dish-status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

.dish-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.dish-description {
  height: 3em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.dish-price {
  font-weight: bold;
  color: #dc3545;
  margin-bottom: 0;
}

/* 表格樣式 */
.table th {
  background-color: #f1f3f5;
}

.table td.align-middle {
  vertical-align: middle;
}

.badge {
  font-weight: 500;
}
</style>
