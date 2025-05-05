<template>
  <div class="container py-4">
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4>{{ storeName }} 的菜單管理</h4>
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
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 尚未創建菜單 -->
    <div v-if="!isLoading && !hasMenu" class="text-center py-5 bg-light rounded">
      <i class="bi bi-menu-button-wide display-1 text-muted mb-3"></i>
      <h5>此店鋪尚未設置菜單</h5>
      <p class="text-muted">創建菜單後，您可以添加餐點分類和餐點項目</p>
      <router-link :to="`/admin/${brandId}/menus/create/${storeId}`" class="btn btn-primary mt-2">
        <i class="bi bi-plus-lg me-1"></i>新增菜單
      </router-link>
    </div>

    <!-- 菜單內容 -->
    <div v-if="!isLoading && hasMenu">
      <!-- 菜單狀態提示 -->
      <div class="alert" :class="menu.isActive ? 'alert-success' : 'alert-warning'" role="alert">
        <i :class="menu.isActive ? 'bi bi-check-circle me-2' : 'bi bi-exclamation-triangle me-2'"></i>
        <span v-if="menu.isActive">菜單已啟用，顧客可以瀏覽並下單。</span>
        <span v-else>菜單目前為停用狀態，顧客無法瀏覽此菜單。</span>
      </div>

      <!-- 菜單資訊卡 -->
      <div class="card mb-4">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0">{{ menu.name || '店鋪菜單' }}</h5>
          <div class="btn-group">
            <router-link :to="`/admin/${brandId}/menus/edit/${storeId}/${menu._id}`" class="btn btn-light btn-sm">
              <i class="bi bi-pencil me-1"></i>編輯菜單
            </router-link>
            <button class="btn btn-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown"
              aria-expanded="false">
              <i class="bi bi-gear"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <a class="dropdown-item" href="#" @click.prevent="toggleMenuActive">
                  <i class="bi" :class="menu && menu.isActive ? 'bi-pause-fill me-1' : 'bi-play-fill me-1'"></i>
                  {{ menu && menu.isActive ? '停用菜單' : '啟用菜單' }}
                </a>
              </li>
              <li>
                <hr class="dropdown-divider">
              </li>
              <li>
                <a class="dropdown-item text-danger" href="#" @click.prevent="showDeleteConfirm">
                  <i class="bi bi-trash me-1"></i>刪除菜單
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p class="mb-1"><strong>分類數量:</strong> {{ menu.categories ? menu.categories.length : 0 }}</p>
              <p class="mb-1"><strong>餐點數量:</strong> {{ countTotalDishes() }}</p>
              <p class="mb-1"><strong>已啟用餐點:</strong> {{ countActiveDishes() }}</p>
            </div>
            <div class="col-md-6">
              <p class="mb-1"><strong>最後更新:</strong> {{ formatDate(menu.updatedAt) }}</p>
              <p class="mb-1"><strong>建立時間:</strong> {{ formatDate(menu.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 分類和餐點列表 -->
      <div class="categories-container">
        <div v-for="(category, categoryIndex) in sortedCategories" :key="categoryIndex" class="card mb-3">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">{{ category.name }}</h6>
            <div>
              <button class="btn btn-outline-success btn-sm" @click="showAddDishModal(categoryIndex)">
                <i class="bi bi-plus-lg me-1"></i>添加餐點
              </button>
            </div>
          </div>

          <div class="card-body">
            <!-- 餐點列表 -->
            <div v-if="category.dishes && category.dishes.length > 0" class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th style="width: 80px">順序</th>
                    <th style="width: 80px">狀態</th>
                    <th>餐點名稱</th>
                    <th style="width: 120px">價格</th>
                    <th style="width: 180px">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(dish, dishIndex) in sortDishes(category.dishes)" :key="dishIndex">
                    <td>{{ dish.order }}</td>
                    <td>
                      <span class="badge" :class="dish.isPublished ? 'bg-success' : 'bg-secondary'">
                        {{ dish.isPublished ? '啟用' : '停用' }}
                      </span>
                    </td>
                    <td>{{ getDishName(dish) }}</td>
                    <td>{{ formatPrice(dish.price || getDishPrice(dish)) }}</td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary"
                          @click="toggleDishStatus(categoryIndex, getDishIndexInCategory(category, dish))">
                          <i class="bi" :class="dish.isPublished ? 'bi-eye-slash' : 'bi-eye'"></i>
                        </button>
                        <button class="btn btn-outline-primary"
                          @click="editDish(categoryIndex, getDishIndexInCategory(category, dish))">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-secondary"
                          @click="moveDish(categoryIndex, getDishIndexInCategory(category, dish), -1)"
                          :disabled="dishIndex === 0">
                          <i class="bi bi-arrow-up"></i>
                        </button>
                        <button class="btn btn-outline-secondary"
                          @click="moveDish(categoryIndex, getDishIndexInCategory(category, dish), 1)"
                          :disabled="dishIndex === sortDishes(category.dishes).length - 1">
                          <i class="bi bi-arrow-down"></i>
                        </button>
                        <button class="btn btn-outline-danger"
                          @click="removeDish(categoryIndex, getDishIndexInCategory(category, dish))">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center py-3 bg-light rounded">
              <p class="mb-0 text-muted">此分類尚未添加餐點</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <ConfirmModal :modalId="'deleteMenuModal'" :title="'確認刪除菜單'" :confirmMessage="'確定要刪除整個菜單'"
      :warningMessage="'此操作無法撤銷，菜單內所有分類和餐點數據都將被永久刪除。'" :item="menu" :nameKey="'name'" :confirmText="'確認刪除'"
      :alertType="'danger'" @delete="handleDeleteMenu" @close="closeDeleteModal" />

    <!-- 加入餐點模態框 -->
    <div class="modal fade" id="addDishModal" tabindex="-1" aria-labelledby="addDishModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addDishModalLabel">添加餐點</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="isLoadingTemplates" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加載中...</span>
              </div>
            </div>
            <div v-else>
              <!-- 搜尋框 -->
              <div class="mb-3">
                <input type="text" class="form-control" placeholder="搜尋餐點..." v-model="dishSearchQuery"
                  @input="filterDishTemplates">
              </div>

              <div class="mb-3">
                <select class="form-select" v-model="selectedDishType" @change="filterDishTemplates">
                  <option value="">所有餐點類型</option>
                  <option value="main">主餐</option>
                  <option value="side">配菜</option>
                  <option value="dessert">甜點</option>
                  <option value="drink">飲料</option>
                </select>
              </div>

              <!-- 餐點模板列表 -->
              <div v-if="filteredDishTemplates.length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th style="width: 80px">圖片</th>
                      <th>餐點名稱</th>
                      <th style="width: 120px">基本價格</th>
                      <th style="width: 100px">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="template in filteredDishTemplates" :key="template._id">
                      <td>
                        <img :src="template.image?.url || '/placeholder.jpg'" class="template-thumbnail" alt="">
                      </td>
                      <td>
                        <div class="fw-bold">{{ template.name }}</div>
                        <div class="small text-muted">{{ template.description }}</div>
                      </td>
                      <td>{{ formatPrice(template.basePrice) }}</td>
                      <td>
                        <button class="btn btn-sm btn-primary" @click="selectDishTemplate(template)">
                          <i class="bi bi-plus-lg me-1"></i>選擇
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center py-3">
                <p class="mb-0 text-muted">找不到符合條件的餐點模板</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 餐點價格編輯模態框 -->
    <div class="modal fade" id="editDishModal" tabindex="-1" aria-labelledby="editDishModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editDishModalLabel">編輯餐點</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">餐點名稱</label>
              <input type="text" class="form-control" disabled :value="selectedDish ? getDishName(selectedDish) : ''">
            </div>
            <div class="mb-3">
              <label class="form-label">模板價格</label>
              <input type="text" class="form-control" disabled
                :value="selectedDish ? formatPrice(getDishPrice(selectedDish)) : ''">
            </div>
            <div class="mb-3">
              <label for="dishPrice" class="form-label">自訂價格 (可選)</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input type="number" id="dishPrice" class="form-control" v-model="editDishForm.price"
                  placeholder="留空則使用模板價格">
              </div>
              <div class="form-text">若要使用模板價格，請留空此欄位</div>
            </div>
            <div class="mb-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="dishIsPublished" v-model="editDishForm.isPublished">
                <label class="form-check-label" for="dishIsPublished">在菜單中啟用</label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="saveDishEdit">儲存變更</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router';
import api from '@/api';
import { Modal } from 'bootstrap';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

// 路由
const route = useRoute();
const router = useRouter();

// 從路由中獲取品牌ID和店鋪ID
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);

// 狀態變數
const store = ref(null);
const menu = ref(null);
const isLoading = ref(true);
const isSaving = ref(false);
const storeName = ref('載入中...');
const hasMenu = computed(() => !!menu.value);

// 餐點模板相關
const dishTemplates = ref([]);
const filteredDishTemplates = ref([]);
const isLoadingTemplates = ref(false);
const dishSearchQuery = ref('');
const selectedDishType = ref('');

// 餐點編輯相關
const selectedCategoryIndex = ref(-1);
const selectedDishIndex = ref(-1);
const selectedDish = ref(null);
const editDishForm = reactive({
  price: '',
  isPublished: true
});

// 對話框元素
let addDishModal = null;
let editDishModal = null;

// 按分類順序排序的分類
const sortedCategories = computed(() => {
  if (!menu.value || !menu.value.categories) return [];
  return [...menu.value.categories].sort((a, b) => a.order - b.order);
});

// 排序餐點
const sortDishes = (dishes) => {
  if (!dishes) return [];
  return [...dishes].sort((a, b) => a.order - b.order);
};

// 格式化價格
const formatPrice = (price) => {
  if (price === undefined || price === null) return '$0';
  return `$${price}`;
};

// 獲取餐點名稱
const getDishName = (dish) => {
  if (!dish || !dish.dishTemplate) return '未知餐點';
  const template = dishTemplates.value.find(t => t._id === dish.dishTemplate);
  return template ? template.name : '未知餐點';
};

// 獲取餐點價格
const getDishPrice = (dish) => {
  if (!dish) return 0;
  if (dish.price !== undefined && dish.price !== null) return dish.price;
  const template = dishTemplates.value.find(t => t._id === dish.dishTemplate);
  return template ? template.basePrice : 0;
};

// 獲取餐點在分類中的索引
const getDishIndexInCategory = (category, dish) => {
  if (!category || !category.dishes) return -1;
  return category.dishes.findIndex(d => d.dishTemplate === dish.dishTemplate);
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
    const activeDishes = category.dishes.filter(dish => dish.isPublished);
    return total + activeDishes.length;
  }, 0);
};

// 獲取店鋪和菜單資料
const fetchData = async () => {
  if (!storeId.value) return;

  isLoading.value = true;

  try {
    // 獲取店鋪資料
    const storeResponse = await api.store.getStoreById(storeId.value);
    if (storeResponse && storeResponse.store) {
      store.value = storeResponse.store;
      storeName.value = storeResponse.store.name;
    }

    // 獲取菜單資料
    try {
      const menuResponse = await api.menu.getStoreMenu(storeId.value);
      if (menuResponse && menuResponse.menu) {
        menu.value = menuResponse.menu;
      }
    } catch (error) {
      console.log('店鋪尚未有菜單', error);
      // 沒有菜單的情況不算錯誤
      menu.value = null;
    }

    // 獲取餐點模板資料
    await fetchDishTemplates();
  } catch (error) {
    console.error('獲取資料失敗:', error);
  } finally {
    isLoading.value = false;
  }
};

// 獲取餐點模板資料
const fetchDishTemplates = async () => {
  if (!brandId.value) return;

  try {
    const response = await api.dish.getAllDishTemplates({ brandId: brandId.value });
    if (response && response.templates) {
      dishTemplates.value = response.templates;
      filteredDishTemplates.value = [...response.templates];
    }
  } catch (error) {
    console.error('獲取餐點模板失敗:', error);
  }
};

// 篩選餐點模板
const filterDishTemplates = () => {
  const query = dishSearchQuery.value.toLowerCase().trim();

  // 先按類型篩選
  let filtered = dishTemplates.value;

  if (selectedDishType.value) {
    filtered = filtered.filter(template => template.type === selectedDishType.value);
  }

  // 再按關鍵字篩選
  if (query) {
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(query) ||
      (template.description && template.description.toLowerCase().includes(query))
    );
  }

  filteredDishTemplates.value = filtered;
};

// 顯示加入餐點模態框
const showAddDishModal = (categoryIndex) => {
  selectedCategoryIndex.value = categoryIndex;
  dishSearchQuery.value = '';
  selectedDishType.value = '';
  filterDishTemplates();

  if (addDishModal) {
    addDishModal.show();
  }
};

// 顯示編輯餐點模態框
const editDish = (categoryIndex, dishIndex) => {
  selectedCategoryIndex.value = categoryIndex;
  selectedDishIndex.value = dishIndex;

  // 獲取所選餐點
  const dish = menu.value.categories[categoryIndex].dishes[dishIndex];
  selectedDish.value = dish;

  // 設置表單值
  editDishForm.price = dish.price !== undefined && dish.price !== null ? dish.price : '';
  editDishForm.isPublished = dish.isPublished !== undefined ? dish.isPublished : true;

  if (editDishModal) {
    editDishModal.show();
  }
};

// 保存餐點編輯
const saveDishEdit = async () => {
  if (selectedCategoryIndex.value < 0 || selectedDishIndex.value < 0) return;

  isSaving.value = true;

  try {
    // 準備更新數據
    const updatedMenu = { ...menu.value };
    const dish = updatedMenu.categories[selectedCategoryIndex.value].dishes[selectedDishIndex.value];

    // 更新價格
    if (editDishForm.price === '' || editDishForm.price === null) {
      dish.price = null; // 使用模板價格
    } else {
      dish.price = parseFloat(editDishForm.price);
    }

    // 更新啟用狀態
    dish.isPublished = editDishForm.isPublished;

    // 儲存到服務器
    const response = await api.menu.updateMenu({
      storeId: storeId.value,
      menuId: menu.value._id,
      data: updatedMenu
    });

    if (response && response.menu) {
      menu.value = response.menu;

      // 關閉模態窗口
      if (editDishModal) {
        editDishModal.hide();
      }
    }
  } catch (error) {
    console.error('更新餐點失敗:', error);
    alert('更新餐點時發生錯誤');
  } finally {
    isSaving.value = false;
  }
};

// 選擇餐點模板添加到菜單
const selectDishTemplate = async (template) => {
  if (selectedCategoryIndex.value < 0) return;

  isSaving.value = true;

  try {
    // 準備添加的餐點數據
    const dishData = {
      dishTemplate: template._id,
      price: null, // 使用模板價格
      isPublished: true,
      order: 0 // 預設順序，將在後端自動設置為最後
    };

    // 添加到菜單
    const response = await api.menu.addDishToMenu({
      storeId: storeId.value,
      menuId: menu.value._id,
      categoryIndex: selectedCategoryIndex.value,
      dishData
    });

    if (response && response.menu) {
      menu.value = response.menu;

      // 關閉模態窗口
      if (addDishModal) {
        addDishModal.hide();
      }
    }
  } catch (error) {
    console.error('添加餐點失敗:', error);
    alert('添加餐點時發生錯誤');
  } finally {
    isSaving.value = false;
  }
};

// 切換餐點狀態（啟用/停用）
const toggleDishStatus = async (categoryIndex, dishIndex) => {
  if (categoryIndex < 0 || dishIndex < 0) return;

  try {
    const dish = menu.value.categories[categoryIndex].dishes[dishIndex];
    const newStatus = !dish.isPublished;

    // 切換狀態
    const response = await api.menu.toggleMenuItem({
      storeId: storeId.value,
      menuId: menu.value._id,
      categoryIndex,
      dishIndex,
      isPublished: newStatus
    });

    if (response && response.menu) {
      menu.value = response.menu;
    }
  } catch (error) {
    console.error('切換餐點狀態失敗:', error);
    alert('切換餐點狀態時發生錯誤');
  }
};

// 移動餐點 (上移/下移)
const moveDish = async (categoryIndex, dishIndex, direction) => {
  const dishes = menu.value.categories[categoryIndex].dishes;
  const newIndex = dishIndex + direction;

  if (newIndex < 0 || newIndex >= dishes.length) return;

  try {
    // 準備更新數據
    const updatedMenu = { ...menu.value };
    const category = updatedMenu.categories[categoryIndex];

    // 交換順序號
    const temp = category.dishes[dishIndex].order;
    category.dishes[dishIndex].order = category.dishes[newIndex].order;
    category.dishes[newIndex].order = temp;

    // 儲存到服務器
    const response = await api.menu.updateDishOrder({
      storeId: storeId.value,
      menuId: menu.value._id,
      categoryIndex,
      dishOrders: category.dishes.map((dish, idx) => ({
        dishIndex: idx,
        order: dish.order
      }))
    });

    if (response && response.menu) {
      menu.value = response.menu;
    }
  } catch (error) {
    console.error('移動餐點失敗:', error);
    alert('移動餐點時發生錯誤');
  }
};

// 從菜單中移除餐點
const removeDish = async (categoryIndex, dishIndex) => {
  if (categoryIndex < 0 || dishIndex < 0) return;

  if (!confirm(`確定要從菜單中移除「${getDishName(menu.value.categories[categoryIndex].dishes[dishIndex])}」嗎？`)) {
    return;
  }

  try {
    // 移除餐點
    const response = await api.menu.removeDishFromMenu({
      storeId: storeId.value,
      menuId: menu.value._id,
      categoryIndex,
      dishIndex
    });

    if (response && response.menu) {
      menu.value = response.menu;
    }
  } catch (error) {
    console.error('移除餐點失敗:', error);
    alert('移除餐點時發生錯誤');
  }
};

// 切換菜單啟用狀態
const toggleMenuActive = async () => {
  if (!menu.value) return;

  try {
    const newStatus = !menu.value.isActive;

    // 切換菜單狀態
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
    alert('切換菜單狀態時發生錯誤');
  }
};

// 顯示刪除確認對話框
const showDeleteConfirm = () => {
  // ConfirmModal 組件會處理顯示
};

// 關閉刪除對話框的回調
const closeDeleteModal = () => {
  // 可以在這裡清除刪除相關的狀態
};

// 處理刪除菜單
const handleDeleteMenu = async () => {
  if (!menu.value) return;

  try {
    // 刪除菜單
    await api.menu.deleteMenu({
      storeId: storeId.value,
      menuId: menu.value._id
    });

    // 刪除成功後重定向回菜單頁面
    router.push(`/admin/${brandId.value}/menus`);
  } catch (error) {
    console.error('刪除菜單失敗:', error);
    alert('刪除菜單時發生錯誤');
    return Promise.reject(error); // 讓確認對話框知道操作失敗
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
  // 初始化Bootstrap模態框
  addDishModal = new Modal(document.getElementById('addDishModal'));
  editDishModal = new Modal(document.getElementById('editDishModal'));

  // 載入數據
  fetchData();
});
</script>

<style scoped>
.template-thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}
</style>
