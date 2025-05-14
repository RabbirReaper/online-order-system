<template>
  <div class="container-fluid py-4">
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex ">
        <div class="bg-primary rounded me-3" style="width: 6px; height: 26px;"></div>
        <h4 class="mb-0"> {{ isEditMode ? '編輯菜單' : '新增菜單' }}</h4>
      </div>

      <router-link :to="`/admin/${brandId}/menus/store/${storeId}`" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i>返回菜單管理
      </router-link>
    </div>

    <!-- 載入中提示 -->
    <div v-if="isLoading" class="d-flex justify-content-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <form v-else @submit.prevent="submitForm" class="menu-form">
      <!-- 菜單名稱 -->
      <div class="card mb-4">
        <div class="card-header bg-light">
          <h5 class="mb-0">基本資訊</h5>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label for="menuName" class="form-label required">菜單名稱</label>
            <input v-model="formData.name" type="text" class="form-control" id="menuName"
              :class="{ 'is-invalid': errors.name }" placeholder="輸入菜單名稱" @blur="validateMenuName" />
            <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
          </div>

          <div class="mb-0">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="menuActive" v-model="formData.isActive">
              <label class="form-check-label" for="menuActive">立即啟用菜單</label>
            </div>
            <div class="form-text">啟用後，顧客可以在線上瀏覽此菜單並下單</div>
          </div>
        </div>
      </div>

      <!-- 菜單類別管理 -->
      <div class="card mb-4">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 class="mb-0">菜單分類</h5>
          <button type="button" class="btn btn-sm btn-primary" @click="addCategory">
            <i class="bi bi-plus-circle me-1"></i>新增分類
          </button>
        </div>
        <div class="card-body">
          <!-- 分類列表 -->
          <div v-if="formData.categories.length > 0">
            <div v-for="(category, categoryIndex) in formData.categories" :key="categoryIndex"
              class="category-item card mb-3">
              <div class="card-header bg-light d-flex justify-content-between align-items-center py-2">
                <h6 class="mb-0">{{ category.name || `未命名分類 #${categoryIndex + 1}` }}</h6>
                <div class="btn-group btn-group-sm">
                  <button type="button" class="btn btn-outline-secondary" @click="moveCategory(categoryIndex, -1)"
                    :disabled="categoryIndex === 0">
                    <i class="bi bi-arrow-up"></i>
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="moveCategory(categoryIndex, 1)"
                    :disabled="categoryIndex === formData.categories.length - 1">
                    <i class="bi bi-arrow-down"></i>
                  </button>
                  <button type="button" class="btn btn-outline-danger" @click="removeCategory(categoryIndex)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              <div class="card-body">
                <!-- 分類編輯區塊 -->
                <div class="mb-3">
                  <label :for="`category-name-${categoryIndex}`" class="form-label required">分類名稱</label>
                  <input type="text" class="form-control" :id="`category-name-${categoryIndex}`" v-model="category.name"
                    :class="{ 'is-invalid': getCategoryError(categoryIndex, 'name') }" placeholder="例如：主餐、飲料、甜點" />
                  <div class="invalid-feedback" v-if="getCategoryError(categoryIndex, 'name')">
                    {{ getCategoryError(categoryIndex, 'name') }}
                  </div>
                </div>

                <div class="mb-3">
                  <label :for="`category-desc-${categoryIndex}`" class="form-label">分類描述</label>
                  <textarea class="form-control" :id="`category-desc-${categoryIndex}`" v-model="category.description"
                    rows="2" placeholder="可選的分類描述"></textarea>
                </div>

                <!-- 餐點列表 -->
                <h6 class="mb-2">餐點項目</h6>
                <div class="table-responsive mb-3">
                  <table class="table table-bordered table-hover">
                    <thead class="table-light">
                      <tr>
                        <th style="width: 45%">餐點</th>
                        <th style="width: 20%">價格</th>
                        <th style="width: 15%">狀態</th>
                        <th style="width: 20%">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(dish, dishIndex) in category.dishes" :key="dishIndex">
                        <td>
                          <select v-model="dish.dishTemplate._id" class="form-select"
                            :class="{ 'is-invalid': getDishError(categoryIndex, dishIndex, 'dishTemplate') }">
                            <option value="">選擇餐點</option>
                            <option v-for="template in dishTemplates" :key="template._id" :value="template._id">
                              {{ template.name }} - ${{ template.basePrice }}
                            </option>
                          </select>
                          <div class="invalid-feedback" v-if="getDishError(categoryIndex, dishIndex, 'dishTemplate')">
                            {{ getDishError(categoryIndex, dishIndex, 'dishTemplate') }}
                          </div>
                        </td>
                        <td>
                          <div class="input-group">
                            <span class="input-group-text">$</span>
                            <input type="number" class="form-control" v-model.number="dish.price" min="0"
                              placeholder="留空使用基本價格" />
                          </div>
                        </td>
                        <td>
                          <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox"
                              :id="`dish-status-${categoryIndex}-${dishIndex}`" v-model="dish.isPublished">
                            <label class="form-check-label small" :for="`dish-status-${categoryIndex}-${dishIndex}`">
                              {{ dish.isPublished ? '啟用' : '停用' }}
                            </label>
                          </div>
                        </td>
                        <td>
                          <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-outline-secondary"
                              @click="moveDish(categoryIndex, dishIndex, -1)" :disabled="dishIndex === 0">
                              <i class="bi bi-arrow-up"></i>
                            </button>
                            <button type="button" class="btn btn-outline-secondary"
                              @click="moveDish(categoryIndex, dishIndex, 1)"
                              :disabled="dishIndex === category.dishes.length - 1">
                              <i class="bi bi-arrow-down"></i>
                            </button>
                            <button type="button" class="btn btn-outline-danger"
                              @click="removeDish(categoryIndex, dishIndex)">
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="category.dishes.length === 0">
                        <td colspan="4" class="text-center py-3 text-muted">此分類尚未添加餐點</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button type="button" class="btn btn-outline-primary btn-sm" @click="addDish(category)">
                  <i class="bi bi-plus-lg me-1"></i>添加餐點
                </button>
              </div>
            </div>
          </div>

          <!-- 無分類提示 -->
          <div v-else class="text-center py-4 bg-light rounded">
            <p class="mb-2">尚未添加任何分類</p>
            <button type="button" class="btn btn-primary" @click="addCategory">
              <i class="bi bi-plus-circle me-1"></i>新增第一個分類
            </button>
          </div>
        </div>
      </div>

      <!-- 錯誤訊息顯示 -->
      <div v-if="formErrors.length > 0" class="alert alert-danger mb-3">
        <p class="mb-1 fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i>請修正以下錯誤：</p>
        <ul class="mb-0 ps-3">
          <li v-for="(error, index) in formErrors" :key="index">{{ error }}</li>
        </ul>
      </div>

      <!-- 提交結果訊息 -->
      <div v-if="successMessage" class="alert alert-success mb-3">
        <i class="bi bi-check-circle-fill me-2"></i>{{ successMessage }}
      </div>

      <!-- 表單按鈕 -->
      <div class="d-flex justify-content-between">
        <button type="button" class="btn btn-secondary" @click="resetForm" :disabled="isSubmitting">
          <i class="bi bi-arrow-counterclockwise me-1"></i>重置
        </button>

        <button type="submit" class="btn btn-success" :disabled="!isFormValid || isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
          <i v-else class="bi bi-save me-1"></i>
          {{ isSubmitting ? '儲存中...' : '儲存菜單' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api';

// 路由相關
const router = useRouter();
const route = useRoute();
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);
const menuId = computed(() => route.params.menuId);
const isEditMode = computed(() => !!menuId.value);

// 店鋪資訊
const store = ref(null);

// 狀態變數
const isLoading = ref(true);
const isSubmitting = ref(false);
const successMessage = ref('');
const formErrors = ref([]);
const dishTemplates = ref([]);

// 表單數據
const formData = reactive({
  name: '',
  store: '',
  brand: '',
  categories: [],
  isActive: true
});

// 錯誤訊息
const errors = reactive({
  name: '',
  categories: []
});

// 檢查表單是否有效
const isFormValid = computed(() => {
  // 檢查菜單名稱
  if (!formData.name.trim()) return false;

  // 檢查是否有分類
  if (formData.categories.length === 0) return false;

  // 檢查每個分類
  for (const category of formData.categories) {
    // 檢查分類名稱
    if (!category.name || !category.name.trim()) return false;

    // 檢查是否有餐點
    if (!category.dishes || category.dishes.length === 0) return false;

    // 檢查每個餐點
    for (const dish of category.dishes) {
      if (!dish.dishTemplate) return false;
    }
  }

  return true;
});

// 獲取店鋪資料
const fetchStoreData = async () => {
  if (!storeId.value) return;

  try {
    const response = await api.store.getStoreById({ brandId: brandId.value, id: storeId.value });
    if (response && response.store) {
      store.value = response.store;

      // 設置品牌ID和店鋪ID
      formData.brand = store.value.brand;
      formData.store = storeId.value;
    }
  } catch (err) {
    console.error('獲取店鋪資料時發生錯誤:', err);
    formErrors.value.push('獲取店鋪資料時發生錯誤，請稍後再試');
  }
};

// 獲取餐點模板資料
const fetchDishTemplates = async () => {
  if (!brandId.value) return;

  try {
    const response = await api.dish.getAllDishTemplates({ brandId: brandId.value });
    if (response && response.templates) {
      dishTemplates.value = response.templates;
    }
  } catch (error) {
    console.error('獲取餐點模板失敗:', error);
    formErrors.value.push('無法獲取餐點資料，請稍後再試');
  }
};

// 獲取菜單資料（編輯模式）
const fetchMenuData = async () => {
  if (!isEditMode.value || !storeId.value || !menuId.value) return;

  try {
    const response = await api.menu.getStoreMenu({ brandId: brandId.value, storeId: storeId.value });

    if (response && response.menu && response.menu._id === menuId.value) {
      const menu = response.menu;

      // 更新表單數據
      formData.name = menu.name || '';
      formData.isActive = menu.isActive !== undefined ? menu.isActive : true;

      // 處理分類資料
      if (menu.categories && menu.categories.length > 0) {
        // 深複製分類資料
        formData.categories = JSON.parse(JSON.stringify(menu.categories));
      }
    } else {
      formErrors.value.push('獲取菜單資料失敗');
    }
  } catch (err) {
    console.error('獲取菜單資料時發生錯誤:', err);
    formErrors.value.push('獲取菜單資料時發生錯誤，請稍後再試');
  }
};

// 驗證菜單名稱
const validateMenuName = () => {
  if (!formData.name.trim()) {
    errors.name = '請輸入菜單名稱';
    return false;
  }
  errors.name = '';
  return true;
};

// 獲取分類錯誤訊息
const getCategoryError = (categoryIndex, field) => {
  if (!errors.categories || !errors.categories[categoryIndex]) {
    return '';
  }
  return errors.categories[categoryIndex][field] || '';
};

// 獲取餐點錯誤訊息
const getDishError = (categoryIndex, dishIndex, field) => {
  if (!errors.categories ||
    !errors.categories[categoryIndex] ||
    !errors.categories[categoryIndex].dishes ||
    !errors.categories[categoryIndex].dishes[dishIndex]) {
    return '';
  }
  return errors.categories[categoryIndex].dishes[dishIndex][field] || '';
};

// 添加分類
const addCategory = () => {
  formData.categories.push({
    name: '',
    description: '',
    dishes: [],
    order: formData.categories.length
  });
};

// 移除分類
const removeCategory = (index) => {
  if (confirm(`確定要刪除「${formData.categories[index].name || '未命名分類'}」嗎？`)) {
    formData.categories.splice(index, 1);

    // 重新排序
    formData.categories.forEach((category, idx) => {
      category.order = idx;
    });
  }
};

// 移動分類順序
const moveCategory = (categoryIndex, direction) => {
  const newIndex = categoryIndex + direction;
  if (newIndex < 0 || newIndex >= formData.categories.length) return;

  // 交換分類位置
  const temp = formData.categories[categoryIndex];
  formData.categories[categoryIndex] = formData.categories[newIndex];
  formData.categories[newIndex] = temp;

  // 更新順序值
  formData.categories[categoryIndex].order = categoryIndex;
  formData.categories[newIndex].order = newIndex;
};

// 添加餐點
const addDish = (category) => {
  if (!category.dishes) {
    category.dishes = [];
  }

  category.dishes.push({
    dishTemplate: '',
    price: null,
    isPublished: true,
    order: category.dishes.length
  });
};

// 移除餐點
const removeDish = (categoryIndex, dishIndex) => {
  formData.categories[categoryIndex].dishes.splice(dishIndex, 1);

  // 重新排序
  formData.categories[categoryIndex].dishes.forEach((dish, idx) => {
    dish.order = idx;
  });
};

// 移動餐點順序
const moveDish = (categoryIndex, dishIndex, direction) => {
  const dishes = formData.categories[categoryIndex].dishes;
  const newIndex = dishIndex + direction;

  if (newIndex < 0 || newIndex >= dishes.length) return;

  // 交換餐點位置
  const temp = dishes[dishIndex];
  dishes[dishIndex] = dishes[newIndex];
  dishes[newIndex] = temp;

  // 更新順序值
  dishes[dishIndex].order = dishIndex;
  dishes[newIndex].order = newIndex;
};

// 驗證整個表單
const validateForm = () => {
  formErrors.value = [];
  let isValid = true;

  // 驗證菜單名稱
  if (!validateMenuName()) {
    formErrors.value.push('請輸入菜單名稱');
    isValid = false;
  }

  // 驗證分類
  if (formData.categories.length === 0) {
    formErrors.value.push('菜單至少需要一個分類');
    isValid = false;
  }

  // 初始化錯誤對象
  errors.categories = [];

  // 驗證每個分類
  formData.categories.forEach((category, categoryIndex) => {
    if (!errors.categories[categoryIndex]) {
      errors.categories[categoryIndex] = {};
    }

    // 驗證分類名稱
    if (!category.name || !category.name.trim()) {
      errors.categories[categoryIndex].name = '請輸入分類名稱';
      formErrors.value.push(`分類 #${categoryIndex + 1}: 請輸入分類名稱`);
      isValid = false;
    }

    // 檢查是否有餐點
    if (!category.dishes || category.dishes.length === 0) {
      formErrors.value.push(`分類 "${category.name || `#${categoryIndex + 1}`}" 至少需要一個餐點`);
      isValid = false;
    } else {
      // 初始化餐點錯誤對象
      errors.categories[categoryIndex].dishes = [];

      // 驗證每個餐點
      category.dishes.forEach((dish, dishIndex) => {
        if (!errors.categories[categoryIndex].dishes[dishIndex]) {
          errors.categories[categoryIndex].dishes[dishIndex] = {};
        }

        if (!dish.dishTemplate) {
          errors.categories[categoryIndex].dishes[dishIndex].dishTemplate = '請選擇餐點';
          formErrors.value.push(`分類 "${category.name || `#${categoryIndex + 1}`}" 中的餐點 #${dishIndex + 1}: 請選擇餐點`);
          isValid = false;
        }
      });
    }
  });

  return isValid;
};

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取菜單資料
    fetchMenuData();
  } else {
    // 清空表單
    formData.name = '';
    formData.categories = [];
    formData.isActive = true;
  }

  // 清除錯誤
  errors.name = '';
  errors.categories = [];
  formErrors.value = [];
  successMessage.value = '';
};

// 提交表單
const submitForm = async () => {
  // 驗證表單
  if (!validateForm()) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  isSubmitting.value = true;
  successMessage.value = '';
  formErrors.value = [];

  try {
    // 準備提交資料
    const submitData = {
      name: formData.name,
      brand: formData.brand,
      store: formData.store,
      categories: formData.categories,
      isActive: formData.isActive
    };

    let response;

    if (isEditMode.value) {
      // 更新菜單
      response = await api.menu.updateMenu({
        storeId: storeId.value,
        menuId: menuId.value,
        data: submitData
      });
      successMessage.value = '菜單更新成功！';
    } else {
      // 創建新菜單
      response = await api.menu.createMenu({
        storeId: storeId.value,
        data: submitData
      });
      successMessage.value = '菜單創建成功！';
    }

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/menus/store/${storeId.value}`);
    }, 1500);
  } catch (error) {
    console.error('儲存菜單時發生錯誤:', error);

    if (error.response && error.response.data) {
      const { message } = error.response.data;

      if (message) {
        formErrors.value.push(`錯誤: ${message}`);
      } else {
        formErrors.value.push('儲存菜單時發生錯誤，請稍後再試');
      }
    } else {
      formErrors.value.push('儲存菜單時發生錯誤，請稍後再試');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    isSubmitting.value = false;
  }
};

// 監聽ID變化
watch([storeId, menuId, brandId], ([newStoreId, newMenuId, newBrandId]) => {
  if (newStoreId && newBrandId) {
    isLoading.value = true;

    // 按順序執行資料獲取
    Promise.all([
      fetchStoreData(),
      fetchDishTemplates(),
      isEditMode.value ? fetchMenuData() : Promise.resolve()
    ]).finally(() => {
      isLoading.value = false;
    });
  }
});

// 生命週期鉤子
onMounted(() => {
  // 載入所有資料
  isLoading.value = true;

  Promise.all([
    fetchStoreData(),
    fetchDishTemplates(),
    isEditMode.value ? fetchMenuData() : Promise.resolve()
  ]).finally(() => {
    isLoading.value = false;
  });
});
</script>

<style scoped>
.required::after {
  content: " *";
  color: #dc3545;
}

.menu-form {
  max-width: 100%;
}

.category-item {
  transition: border-color 0.3s;
}

.category-item:hover {
  border-color: #0d6efd;
}

.table th,
.table td {
  vertical-align: middle;
}

.table-light {
  background-color: #f8f9fa;
}

.invalid-feedback {
  display: block;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
}

.form-switch .form-check-input {
  margin-top: 0.2rem;
}
</style>
