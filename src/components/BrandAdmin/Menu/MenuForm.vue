<template>
  <div class="container py-4">
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4>{{ isEditMode ? '編輯菜單' : '新增菜單' }}</h4>
      <router-link :to="`/admin/${brandId}/menus/store/${storeId}`" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i>返回菜單管理
      </router-link>
    </div>

    <!-- 菜單名稱 -->
    <div class="card mb-4">
      <div class="card-body">
        <label for="menuName" class="form-label">菜單名稱</label>
        <input v-model="formData.name" type="text" class="form-control" id="menuName"
          :class="{ 'is-invalid': errors.name }" placeholder="輸入菜單名稱" @blur="validateMenuName" />
        <div class="invalid-feedback">{{ errors.name }}</div>
      </div>
    </div>

    <!-- 菜單類別列表 -->
    <div class="mb-4">
      <div v-for="(category, categoryIndex) in formData.categories" :key="categoryIndex" class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <!-- 類別名稱 -->
            <div class="flex-grow-1 me-3">
              <label :for="`category-name-${categoryIndex}`" class="form-label">類別名稱</label>
              <input v-model="category.name" type="text" class="form-control" :id="`category-name-${categoryIndex}`"
                :class="{ 'is-invalid': getCategoryError(categoryIndex, 'name') }" placeholder="輸入類別名稱（例如：主餐、附餐）"
                @blur="validateCategory(categoryIndex)" />
              <div class="invalid-feedback">{{ getCategoryError(categoryIndex, 'name') }}</div>
            </div>
            <!-- 類別排序控制 -->
            <div class="btn-group">
              <button @click="moveCategory(categoryIndex, -1)" class="btn btn-outline-secondary"
                :disabled="categoryIndex === 0">
                ↑
              </button>
              <button @click="moveCategory(categoryIndex, 1)" class="btn btn-outline-secondary"
                :disabled="categoryIndex === formData.categories.length - 1">
                ↓
              </button>
            </div>
          </div>

          <!-- 餐點列表 -->
          <div class="mb-3">
            <h5 class="card-title">餐點項目</h5>
            <div class="list-group">
              <div v-for="(dish, dishIndex) in category.dishes" :key="dishIndex" class="list-group-item">
                <div class="row align-items-center">
                  <div class="col">
                    <select v-model="dish.dishTemplate" class="form-select"
                      :class="{ 'is-invalid': getDishError(categoryIndex, dishIndex, 'dishTemplate') }"
                      @blur="validateDish(categoryIndex, dishIndex)">
                      <option value="">選擇餐點</option>
                      <option v-for="template in filteredDishTemplates" :key="template._id" :value="template._id">
                        {{ template.name }} - ${{ template.basePrice }}
                      </option>
                    </select>
                    <div class="invalid-feedback">{{ getDishError(categoryIndex, dishIndex, 'dishTemplate') }}</div>
                  </div>
                  <div class="col-auto">
                    <div class="btn-group">
                      <button @click="moveDish(categoryIndex, dishIndex, -1)" class="btn btn-outline-secondary"
                        :disabled="dishIndex === 0">
                        ↑
                      </button>
                      <button @click="moveDish(categoryIndex, dishIndex, 1)" class="btn btn-outline-secondary"
                        :disabled="dishIndex === category.dishes.length - 1">
                        ↓
                      </button>
                      <button @click="removeDish(categoryIndex, dishIndex)" class="btn btn-outline-danger">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button @click="addDish(category)" class="btn btn-outline-primary mt-2">
              新增餐點
            </button>
          </div>

          <button @click="removeCategory(categoryIndex)" class="btn btn-danger">
            刪除類別
          </button>
        </div>
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <div v-if="formErrors.length > 0" class="alert alert-danger mb-3" role="alert">
      <p class="mb-1"><strong><i class="bi bi-exclamation-triangle-fill me-2"></i>請修正以下錯誤：</strong></p>
      <ul class="mb-0 ps-3">
        <li v-for="(error, index) in formErrors" :key="index">{{ error }}</li>
      </ul>
    </div>

    <!-- 提交結果訊息 -->
    <div v-if="successMessage" class="alert alert-success mb-3">
      <i class="bi bi-check-circle-fill me-2"></i>{{ successMessage }}
    </div>

    <!-- 控制按鈕 -->
    <div class="d-flex gap-2">
      <button @click="addCategory" class="btn btn-primary">
        新增類別
      </button>

      <button @click="submitForm" class="btn btn-success" :disabled="!isValid || isSubmitting">
        <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {{ isSubmitting ? '儲存中...' : '儲存菜單' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api';

// 路由
const router = useRouter();
const route = useRoute();

// 判斷是否為編輯模式
const isEditMode = computed(() => !!route.params.menuId);

// 從路由中獲取品牌ID和店鋪ID
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);
const menuId = computed(() => route.params.menuId);

// 店鋪資訊
const store = ref(null);

// 餐點模板資料
const dishTemplates = ref([]);
const filteredDishTemplates = ref([]);

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

// 表單錯誤列表
const formErrors = ref([]);
const successMessage = ref('');
const isSubmitting = ref(false);

// 獲取店鋪數據
const fetchStoreData = async () => {
  if (!storeId.value) return;

  try {
    const response = await api.store.getStoreById(storeId.value);
    if (response && response.store) {
      store.value = response.store;
      console.log(store.value.brand);
      // 設置品牌ID
      formData.brand = store.value.brand;
      formData.store = storeId.value;
    }
  } catch (err) {
    console.error('獲取店鋪資料時發生錯誤:', err);
    formErrors.value = ['獲取店鋪資料時發生錯誤，請稍後再試'];
  }
};

// 獲取餐點模板
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
    formErrors.value.push('無法獲取餐點資料，請稍後再試');
  }
};

// 獲取菜單數據 (編輯模式)
const fetchMenuData = async () => {
  if (!isEditMode.value || !storeId.value || !menuId.value) return;

  try {
    const response = await api.menu.getStoreMenu(storeId.value);

    if (response && response.menu && response.menu._id === menuId.value) {
      // 填充表單
      formData.name = response.menu.name || '';
      formData.isActive = response.menu.isActive !== undefined ? response.menu.isActive : true;

      // 處理分類
      formData.categories = response.menu.categories && response.menu.categories.length > 0
        ? JSON.parse(JSON.stringify(response.menu.categories)) // 深複製
        : [];
    } else {
      formErrors.value = ['獲取菜單資料失敗'];
    }
  } catch (err) {
    console.error('獲取菜單資料時發生錯誤:', err);
    formErrors.value = ['獲取菜單資料時發生錯誤，請稍後再試'];
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

// 驗證類別
const validateCategory = (categoryIndex) => {
  const category = formData.categories[categoryIndex];
  if (!category.name || !category.name.trim()) {
    if (!errors.categories) errors.categories = [];
    if (!errors.categories[categoryIndex]) errors.categories[categoryIndex] = {};
    errors.categories[categoryIndex].name = '請輸入類別名稱';
    return false;
  }

  if (errors.categories && errors.categories[categoryIndex]) {
    errors.categories[categoryIndex].name = '';
  }

  return true;
};

// 驗證餐點
const validateDish = (categoryIndex, dishIndex) => {
  const dish = formData.categories[categoryIndex].dishes[dishIndex];
  if (!dish.dishTemplate) {
    if (!errors.categories) errors.categories = [];
    if (!errors.categories[categoryIndex]) errors.categories[categoryIndex] = {};
    if (!errors.categories[categoryIndex].dishes) errors.categories[categoryIndex].dishes = [];
    if (!errors.categories[categoryIndex].dishes[dishIndex]) errors.categories[categoryIndex].dishes[dishIndex] = {};

    errors.categories[categoryIndex].dishes[dishIndex].dishTemplate = '請選擇餐點';
    return false;
  }

  if (errors.categories &&
    errors.categories[categoryIndex] &&
    errors.categories[categoryIndex].dishes &&
    errors.categories[categoryIndex].dishes[dishIndex]) {
    errors.categories[categoryIndex].dishes[dishIndex].dishTemplate = '';
  }

  return true;
};

// 獲取類別錯誤
const getCategoryError = (categoryIndex, field) => {
  if (!errors.categories || !errors.categories[categoryIndex]) {
    return '';
  }
  return errors.categories[categoryIndex][field] || '';
};

// 獲取餐點錯誤
const getDishError = (categoryIndex, dishIndex, field) => {
  if (!errors.categories ||
    !errors.categories[categoryIndex] ||
    !errors.categories[categoryIndex].dishes ||
    !errors.categories[categoryIndex].dishes[dishIndex]) {
    return '';
  }
  return errors.categories[categoryIndex].dishes[dishIndex][field] || '';
};

// 添加類別
const addCategory = () => {
  formData.categories.push({
    name: '',
    dishes: [],
    order: formData.categories.length
  });
};

// 移除類別
const removeCategory = (index) => {
  formData.categories.splice(index, 1);
  // 重新排序
  formData.categories.forEach((category, idx) => {
    category.order = idx;
  });
};

// 移動類別
const moveCategory = (categoryIndex, direction) => {
  const newIndex = categoryIndex + direction;
  if (newIndex >= 0 && newIndex < formData.categories.length) {
    const temp = formData.categories[categoryIndex];
    formData.categories[categoryIndex] = formData.categories[newIndex];
    formData.categories[newIndex] = temp;

    // 更新順序
    formData.categories[categoryIndex].order = categoryIndex;
    formData.categories[newIndex].order = newIndex;
  }
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

// 移動餐點
const moveDish = (categoryIndex, dishIndex, direction) => {
  const dishes = formData.categories[categoryIndex].dishes;
  const newIndex = dishIndex + direction;

  if (newIndex >= 0 && newIndex < dishes.length) {
    const temp = dishes[dishIndex];
    dishes[dishIndex] = dishes[newIndex];
    dishes[newIndex] = temp;

    // 更新順序
    dishes[dishIndex].order = dishIndex;
    dishes[newIndex].order = newIndex;
  }
};

// 檢查表單是否有效
const isValid = computed(() => {
  // 檢查菜單名稱
  if (!formData.name.trim()) return false;

  // 檢查是否有類別
  if (formData.categories.length === 0) return false;

  // 檢查每個類別
  for (const category of formData.categories) {
    // 檢查類別名稱
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

// 驗證整個表單
const validateForm = () => {
  formErrors.value = [];
  let isValid = true;

  // 驗證菜單名稱
  if (!validateMenuName()) {
    formErrors.value.push('請輸入菜單名稱');
    isValid = false;
  }

  // 驗證類別
  if (formData.categories.length === 0) {
    formErrors.value.push('菜單至少需要一個類別');
    isValid = false;
  }

  // 驗證每個類別
  formData.categories.forEach((category, categoryIndex) => {
    if (!validateCategory(categoryIndex)) {
      formErrors.value.push(`類別 #${categoryIndex + 1} 需要填寫名稱`);
      isValid = false;
    }

    // 檢查是否有餐點
    if (!category.dishes || category.dishes.length === 0) {
      formErrors.value.push(`類別 "${category.name || `#${categoryIndex + 1}`}" 至少需要一個餐點`);
      isValid = false;
    } else {
      // 驗證每個餐點
      category.dishes.forEach((dish, dishIndex) => {
        if (!validateDish(categoryIndex, dishIndex)) {
          formErrors.value.push(`類別 "${category.name || `#${categoryIndex + 1}`}" 中的餐點 #${dishIndex + 1} 需要選擇餐點`);
          isValid = false;
        }
      });
    }
  });

  return isValid;
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
        formErrors.value.push(message);
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

// 生命週期鉤子
onMounted(async () => {
  // 獲取餐點模板
  await fetchDishTemplates();

  // 獲取店鋪資料
  await fetchStoreData();

  // 如果是編輯模式，獲取菜單資料
  if (isEditMode.value) {
    await fetchMenuData();
  }
});
</script>

<style scoped>
.list-group-item {
  transition: background-color 0.2s;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

.form-control:focus,
.form-select:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
</style>
