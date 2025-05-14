<template>
  <div class="container-fluid py-4">
    <!-- 頁面標題及操作按鈕 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex">
        <div class="bg-primary rounded me-3" style="width: 6px; height: 26px;"></div>
        <h4>{{ storeName }} 的菜單管理</h4>
      </div>
      <div class="d-flex">
        <router-link :to="`/admin/${brandId}/menus`" class="btn btn-outline-secondary me-2">
          <i class="bi bi-arrow-left me-1"></i>返回店鋪列表
        </router-link>
        <router-link v-if="!hasMenu" :to="`/admin/${brandId}/menus/create/${storeId}`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增菜單
        </router-link>
      </div>
    </div>

    <!-- 載入中提示 -->
    <div v-if="isLoading" class="d-flex justify-content-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 尚未創建菜單提示 -->
    <div v-else-if="!hasMenu" class="text-center py-5 bg-light rounded">
      <i class="bi bi-menu-button-wide display-1 text-muted mb-3"></i>
      <h5>此店鋪尚未設置菜單</h5>
      <p class="text-muted">創建菜單後，您可以添加餐點分類和餐點項目</p>
      <router-link :to="`/admin/${brandId}/menus/create/${storeId}`" class="btn btn-primary mt-2">
        <i class="bi bi-plus-lg me-1"></i>新增菜單
      </router-link>
    </div>

    <!-- 菜單列表（單個店鋪只有一個菜單） -->
    <div v-else-if="menu" class="row">
      <div class="col-12">
        <!-- 菜單卡片 -->
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center"
            :class="menu.isActive ? 'bg-success text-white' : 'bg-secondary text-white'">
            <div class="d-flex align-items-center">
              <h5 class="mb-0">{{ menu.name || '店鋪菜單' }}</h5>
              <span class="badge rounded-pill bg-light text-dark ms-2">
                {{ menu.isActive ? '啟用中' : '已停用' }}
              </span>
            </div>
            <div class="btn-group">
              <router-link :to="`/admin/${brandId}/menus/detail/${storeId}/${menu._id}`"
                class="btn btn-light btn-sm me-2">
                <i class="bi bi-eye me-1"></i>查看詳情
              </router-link>
              <router-link :to="`/admin/${brandId}/menus/edit/${storeId}/${menu._id}`" class="btn btn-light btn-sm">
                <i class="bi bi-pencil me-1"></i>編輯菜單
              </router-link>
            </div>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <p class="mb-2"><strong>分類數量:</strong> {{ menu.categories ? menu.categories.length : 0 }}</p>
                <p class="mb-2"><strong>餐點數量:</strong> {{ countTotalDishes() }}</p>
                <p class="mb-2"><strong>已啟用餐點:</strong> {{ countActiveDishes() }}</p>
                <p class="mb-0"><strong>菜單狀態:</strong>
                  <span class="badge" :class="menu.isActive ? 'bg-success' : 'bg-secondary'">
                    {{ menu.isActive ? '啟用中' : '已停用' }}
                  </span>
                  <button class="btn btn-sm ms-2" :class="menu.isActive ? 'btn-outline-danger' : 'btn-outline-success'"
                    @click="toggleMenuActive">
                    <i class="bi" :class="menu.isActive ? 'bi-pause-fill' : 'bi-play-fill'"></i>
                    {{ menu.isActive ? '停用菜單' : '啟用菜單' }}
                  </button>
                </p>
              </div>
              <div class="col-md-6">
                <p class="mb-2"><strong>建立時間:</strong> {{ formatDate(menu.createdAt) }}</p>
                <p class="mb-2"><strong>最後更新:</strong> {{ formatDate(menu.updatedAt) }}</p>
                <p class="mb-0 mt-4">
                  <button class="btn btn-sm btn-danger" @click="confirmDeleteMenu">
                    <i class="bi bi-trash me-1"></i>刪除菜單
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 分類概況卡片 -->
        <div class="card mb-4">
          <div class="card-header bg-light">
            <h5 class="mb-0">分類概況</h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover table-striped mb-0">
                <thead>
                  <tr>
                    <th>分類名稱</th>
                    <th>餐點數量</th>
                    <th>啟用數量</th>
                    <th>順序</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="category in sortedCategories" :key="category._id">
                    <td>{{ category.name }}</td>
                    <td>{{ category.dishes ? category.dishes.length : 0 }}</td>
                    <td>{{ countCategoryActiveDishes(category) }}</td>
                    <td>{{ category.order }}</td>
                  </tr>
                  <tr v-if="!menu.categories || menu.categories.length === 0">
                    <td colspan="4" class="text-center py-3 text-muted">此菜單尚未設置任何分類</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 確認刪除對話框 -->
    <b-modal id="deleteModal" v-model:show="showDeleteModal" title="確認刪除菜單" @ok="deleteMenu" :ok-disabled="isDeleting"
      ok-title="確認刪除" ok-variant="danger" cancel-title="取消">
      <p v-if="menu">確定要刪除菜單「{{ menu.name }}」嗎？</p>
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        此操作無法撤銷，菜單內所有分類和餐點數據都將被永久刪除。
      </div>
      <div v-if="isDeleting" class="text-center">
        <div class="spinner-border text-danger" role="status">
          <span class="visually-hidden">刪除中...</span>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BModal } from 'bootstrap-vue-next';
import api from '@/api';

// 路由相關
const route = useRoute();
const router = useRouter();
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);

// 狀態變數
const store = ref(null);
const menu = ref(null);
const isLoading = ref(true);
const isDeleting = ref(false);
const storeName = ref('載入中...');
const showDeleteModal = ref(false);

// 計算屬性
const hasMenu = computed(() => !!menu.value);
const sortedCategories = computed(() => {
  if (!menu.value || !menu.value.categories) return [];
  return [...menu.value.categories].sort((a, b) => a.order - b.order);
});

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

// 計算分類中已啟用的餐點數量
const countCategoryActiveDishes = (category) => {
  if (!category.dishes) return 0;
  return category.dishes.filter(dish => dish.isPublished).length;
};

// 獲取店鋪和菜單資料
const fetchData = async () => {
  if (!storeId.value) return;

  isLoading.value = true;

  try {
    // 1. 獲取店鋪資料
    const storeResponse = await api.store.getStoreById({ brandId: brandId.value, id: storeId.value });
    if (storeResponse && storeResponse.store) {
      store.value = storeResponse.store;
      storeName.value = storeResponse.store.name;
    }

    // 2. 獲取菜單資料
    const menuResponse = await api.menu.getStoreMenu({ brandId: brandId.value, storeId: storeId.value });

    if (menuResponse.menu.exists === false) {
      menu.value = null;
      return;
    }

    if (menuResponse && menuResponse.menu) {
      menu.value = menuResponse.menu;
    }

  } catch (error) {
    console.error('獲取資料失敗:', error);
  } finally {
    isLoading.value = false;
  }
};

// 切換菜單啟用狀態
const toggleMenuActive = async () => {
  if (!menu.value) return;

  try {
    const newStatus = !menu.value.isActive;

    // 發送API請求切換狀態
    const response = await api.menu.toggleMenuActive({
      storeId: storeId.value,
      menuId: menu.value._id,
      active: newStatus
    });

    if (response && response.menu) {
      menu.value = response.menu;
    }
  } catch (error) {
    console.error('切換菜單狀態失敗:', error);
    alert('切換菜單狀態時發生錯誤，請稍後再試');
  }
};

// 顯示刪除確認對話框
const confirmDeleteMenu = () => {
  showDeleteModal.value = true;
};

// 刪除菜單
const deleteMenu = async () => {
  if (!menu.value) return;

  isDeleting.value = true;

  try {
    // 發送API請求刪除菜單
    await api.menu.deleteMenu({
      storeId: storeId.value,
      menuId: menu.value._id
    });

    // 隱藏對話框
    showDeleteModal.value = false;

    // 刪除成功後重定向回店鋪列表
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/menus`);
    }, 500);
  } catch (error) {
    console.error('刪除菜單失敗:', error);
    alert('刪除菜單時發生錯誤，請稍後再試');
  } finally {
    isDeleting.value = false;
  }
};

// 監聽ID變化
watch([storeId, brandId], ([newStoreId, newBrandId]) => {
  if (newStoreId && newBrandId) {
    fetchData();
  }
});

// 生命週期鉤子
onMounted(() => {
  // 載入數據
  fetchData();
});
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  transition: box-shadow 0.3s;
}

.card:hover {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.badge {
  font-weight: 500;
}

.table th {
  font-weight: 600;
  background-color: #f8f9fa;
}

.table td,
.table th {
  vertical-align: middle;
}
</style>
