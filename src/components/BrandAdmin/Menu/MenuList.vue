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
        <router-link :to="`/admin/${brandId}/menus/create/${storeId}`" class="btn btn-primary">
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

    <!-- 菜單列表 -->
    <div v-else-if="menus.length > 0">
      <!-- 統計資訊 -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">總菜單數</h6>
                  <h4 class="mb-0">{{ menus.length }}</h4>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-menu-button-wide fs-2"></i>
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
                  <h6 class="card-title">啟用菜單</h6>
                  <h4 class="mb-0">{{ activeMenusCount }}</h4>
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
                  <h6 class="card-title">總分類數</h6>
                  <h4 class="mb-0">{{ totalCategoriesCount }}</h4>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-list fs-2"></i>
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
                  <h6 class="card-title">總商品數</h6>
                  <h4 class="mb-0">{{ totalItemsCount }}</h4>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-grid fs-2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 菜單卡片列表 -->
      <div class="row row-cols-1 row-cols-lg-2 row-cols-xl-3 g-4">
        <div v-for="menu in menus" :key="menu._id" class="col">
          <div class="card h-100 menu-card hover-shadow"
            :class="{ 'border-success': menu.isActive, 'border-secondary': !menu.isActive }">
            <!-- 卡片頭部 -->
            <div class="card-header d-flex justify-content-between align-items-center"
              :class="menu.isActive ? 'bg-success text-white' : 'bg-secondary text-white'">
              <div class="d-flex align-items-center">
                <h6 class="mb-0 me-2">{{ menu.name || '未命名菜單' }}</h6>
                <span class="badge rounded-pill bg-light text-dark">
                  {{ menu.isActive ? '啟用中' : '已停用' }}
                </span>
              </div>
              <!-- 菜單類型標記 -->
              <span class="badge rounded-pill bg-info text-white">
                {{ getMenuTypeText(menu.menuType) }}
              </span>
            </div>

            <!-- 卡片內容 -->
            <div class="card-body">
              <!-- 菜單基本資訊 -->
              <div class="row mb-3">
                <div class="col-6">
                  <small class="text-muted">分類數量</small>
                  <div class="fw-bold">{{ menu.categories ? menu.categories.length : 0 }}</div>
                </div>
                <div class="col-6">
                  <small class="text-muted">商品數量</small>
                  <div class="fw-bold">{{ countTotalItems(menu) }}</div>
                </div>
              </div>

              <div class="row mb-3">
                <div class="col-6">
                  <small class="text-muted">已顯示商品</small>
                  <div class="fw-bold text-success">{{ countActiveItems(menu) }}</div>
                </div>
                <div class="col-6">
                  <small class="text-muted">隱藏商品</small>
                  <div class="fw-bold text-warning">{{ countTotalItems(menu) - countActiveItems(menu) }}</div>
                </div>
              </div>

              <!-- 時間資訊 -->
              <div class="border-top pt-3">
                <div class="small text-muted mb-1">
                  <i class="bi bi-calendar-plus me-1"></i>
                  建立：{{ formatDate(menu.createdAt) }}
                </div>
                <div class="small text-muted">
                  <i class="bi bi-clock me-1"></i>
                  更新：{{ formatDate(menu.updatedAt) }}
                </div>
              </div>

              <!-- 分類預覽 -->
              <div class="mt-3" v-if="menu.categories && menu.categories.length > 0">
                <small class="text-muted">分類預覽</small>
                <div class="mt-1">
                  <span v-for="category in menu.categories.slice(0, 3)" :key="category._id"
                    class="badge bg-light text-dark me-1 mb-1">
                    {{ category.name }}
                  </span>
                  <span v-if="menu.categories.length > 3" class="badge bg-secondary me-1 mb-1">
                    +{{ menu.categories.length - 3 }} 個分類
                  </span>
                </div>
              </div>
            </div>

            <!-- 卡片操作區 -->
            <div class="card-footer bg-transparent border-top">
              <div class="d-flex justify-content-between align-items-center">
                <!-- 狀態切換 -->
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" :id="`menu-active-${menu._id}`"
                    v-model="menu.isActive" @change="toggleMenuActive(menu._id)" :disabled="isToggling">
                  <label class="form-check-label small" :for="`menu-active-${menu._id}`">
                    {{ menu.isActive ? '啟用中' : '已停用' }}
                  </label>
                </div>

                <!-- 操作按鈕 -->
                <div class="btn-group btn-group-sm">
                  <router-link :to="`/admin/${brandId}/menus/detail/${storeId}/${menu._id}`"
                    class="btn btn-outline-primary" title="查看詳情">
                    <i class="bi bi-eye"></i>
                  </router-link>
                  <router-link :to="`/admin/${brandId}/menus/edit/${storeId}/${menu._id}`"
                    class="btn btn-outline-warning" title="編輯菜單">
                    <i class="bi bi-pencil"></i>
                  </router-link>
                  <button type="button" class="btn btn-outline-danger" @click="confirmDeleteMenu(menu)" title="刪除菜單">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 無菜單提示 -->
    <div v-else class="text-center py-5 bg-light rounded">
      <i class="bi bi-menu-button-wide display-1 text-muted mb-3"></i>
      <h5>此店鋪尚未設置菜單</h5>
      <p class="text-muted">創建菜單後，您可以添加餐點分類和商品項目</p>
      <router-link :to="`/admin/${brandId}/menus/create/${storeId}`" class="btn btn-primary mt-2">
        <i class="bi bi-plus-lg me-1"></i>新增第一個菜單
      </router-link>
    </div>

    <!-- 確認刪除對話框 -->
    <b-modal id="deleteModal" v-model:show="showDeleteModal" :title="`刪除菜單 - ${selectedMenu?.name}`" @ok="deleteMenu"
      :ok-disabled="isDeleting" ok-title="確認刪除" ok-variant="danger" cancel-title="取消">
      <p v-if="selectedMenu">確定要刪除菜單「{{ selectedMenu.name }}」嗎？</p>
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        此操作無法撤銷，菜單內所有分類和商品數據都將被永久刪除。
      </div>
      <div v-if="selectedMenu">
        <ul class="mb-0">
          <li>分類數量：{{ selectedMenu.categories?.length || 0 }}</li>
          <li>商品數量：{{ countTotalItems(selectedMenu) }}</li>
        </ul>
      </div>
      <div v-if="isDeleting" class="text-center mt-3">
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
const menus = ref([]); // 改為陣列
const isLoading = ref(true);
const isDeleting = ref(false);
const isToggling = ref(false);
const storeName = ref('載入中...');
const showDeleteModal = ref(false);
const selectedMenu = ref(null);

// 計算屬性
const activeMenusCount = computed(() => {
  return menus.value.filter(menu => menu.isActive).length;
});

const totalCategoriesCount = computed(() => {
  return menus.value.reduce((total, menu) => {
    return total + (menu.categories ? menu.categories.length : 0);
  }, 0);
});

const totalItemsCount = computed(() => {
  return menus.value.reduce((total, menu) => {
    return total + countTotalItems(menu);
  }, 0);
});

// 獲取菜單類型文字
const getMenuTypeText = (type) => {
  const typeMap = {
    'food': '現金購買餐點',
    'cash_coupon': '現金購買預購券',
    'point_exchange': '點數兌換'
  };
  return typeMap[type] || type;
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無資料';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// 計算菜單總商品數量
const countTotalItems = (menu) => {
  if (!menu || !menu.categories) return 0;
  return menu.categories.reduce((total, category) => {
    return total + (category.items ? category.items.length : 0);
  }, 0);
};

// 計算菜單已啟用商品數量
const countActiveItems = (menu) => {
  if (!menu || !menu.categories) return 0;
  return menu.categories.reduce((total, category) => {
    if (!category.items) return total;
    return total + category.items.filter(item => item.isShowing).length;
  }, 0);
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

    // 2. 獲取所有菜單資料 (假設 API 支援獲取所有菜單)
    // 如果 API 不支援，這裡需要調整邏輯
    try {
      const menusResponse = await api.menu.getAllStoreMenus({
        brandId: brandId.value,
        storeId: storeId.value
      });

      if (menusResponse && menusResponse.menus) {
        menus.value = menusResponse.menus;
      } else {
        // 如果 API 不支援多菜單，回退到單菜單模式
        const menuResponse = await api.menu.getStoreMenu({
          brandId: brandId.value,
          storeId: storeId.value
        });

        if (menuResponse.menu && menuResponse.menu.exists !== false) {
          menus.value = [menuResponse.menu];
        } else {
          menus.value = [];
        }
      }
    } catch (error) {
      // API 可能不支援多菜單，回退到單菜單
      console.log('回退到單菜單模式:', error);
      try {
        const menuResponse = await api.menu.getStoreMenu({
          brandId: brandId.value,
          storeId: storeId.value
        });

        if (menuResponse.menu && menuResponse.menu.exists !== false) {
          menus.value = [menuResponse.menu];
        } else {
          menus.value = [];
        }
      } catch (singleError) {
        console.error('獲取菜單失敗:', singleError);
        menus.value = [];
      }
    }

  } catch (error) {
    console.error('獲取資料失敗:', error);
  } finally {
    isLoading.value = false;
  }
};

// 切換菜單啟用狀態
const toggleMenuActive = async (menuId) => {
  if (isToggling.value) return;

  const menu = menus.value.find(m => m._id === menuId);
  if (!menu) return;

  isToggling.value = true;
  const newStatus = menu.isActive;

  try {
    // 發送API請求切換狀態
    const response = await api.menu.toggleMenuActive({
      brandId: brandId.value,
      storeId: storeId.value,
      menuId: menuId,
      active: newStatus
    });

    if (response && response.menu) {
      // 更新本地狀態
      const menuIndex = menus.value.findIndex(m => m._id === menuId);
      if (menuIndex !== -1) {
        menus.value[menuIndex] = response.menu;
      }
    }
  } catch (error) {
    console.error('切換菜單狀態失敗:', error);
    // 恢復原狀態
    menu.isActive = !newStatus;
    alert('切換菜單狀態時發生錯誤，請稍後再試');
  } finally {
    isToggling.value = false;
  }
};

// 顯示刪除確認對話框
const confirmDeleteMenu = (menu) => {
  selectedMenu.value = menu;
  showDeleteModal.value = true;
};

// 刪除菜單
const deleteMenu = async () => {
  if (!selectedMenu.value) return;

  isDeleting.value = true;

  try {
    // 發送API請求刪除菜單
    await api.menu.deleteMenu({
      brandId: brandId.value,
      storeId: storeId.value,
      menuId: selectedMenu.value._id
    });

    // 從本地陣列中移除
    const menuIndex = menus.value.findIndex(m => m._id === selectedMenu.value._id);
    if (menuIndex !== -1) {
      menus.value.splice(menuIndex, 1);
    }

    // 隱藏對話框
    showDeleteModal.value = false;
    selectedMenu.value = null;

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
.menu-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-shadow:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-header h6 {
  font-weight: 600;
}

.badge {
  font-weight: 500;
}

.border-success {
  border-color: #28a745 !important;
  border-width: 2px;
}

.border-secondary {
  border-color: #6c757d !important;
  border-width: 1px;
}

.form-switch .form-check-input:checked {
  background-color: #28a745;
  border-color: #28a745;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.card-footer {
  padding: 0.75rem 1rem;
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
</style>
