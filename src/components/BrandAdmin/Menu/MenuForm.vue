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
      <!-- 菜單基本資訊 -->
      <div class="card mb-4">
        <div class="card-header bg-light">
          <h5 class="mb-0">基本資訊</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label for="menuName" class="form-label required">菜單名稱</label>
                <input v-model="formData.name" type="text" class="form-control" id="menuName"
                  :class="{ 'is-invalid': errors.name }" placeholder="輸入菜單名稱" @blur="validateMenuName" />
                <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="mb-3">
                <label for="menuType" class="form-label required">菜單類型</label>
                <select v-model="formData.menuType" class="form-select" id="menuType"
                  :class="{ 'is-invalid': errors.menuType }">
                  <option value="food">現金購買餐點</option>
                  <option value="cash_coupon">現金購買預購券</option>
                  <option value="point_exchange">點數兌換</option>
                </select>
                <div class="invalid-feedback" v-if="errors.menuType">{{ errors.menuType }}</div>
                <div class="form-text">選擇菜單的主要用途類型</div>
              </div>
            </div>
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

                <!-- 商品列表 -->
                <h6 class="mb-2">商品項目</h6>
                <div class="table-responsive mb-3">
                  <table class="table table-bordered table-hover">
                    <thead class="table-light">
                      <tr>
                        <th style="width: 15%">類型</th>
                        <th style="width: 30%">商品</th>
                        <th style="width: 15%">價格覆蓋</th>
                        <th style="width: 15%">點數覆蓋</th>
                        <th style="width: 10%">狀態</th>
                        <th style="width: 15%">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, itemIndex) in category.items" :key="itemIndex">
                        <td>
                          <select v-model="item.itemType" class="form-select form-select-sm"
                            :class="{ 'is-invalid': getItemError(categoryIndex, itemIndex, 'itemType') }"
                            @change="onItemTypeChange(categoryIndex, itemIndex)">
                            <option value="">選擇類型</option>
                            <option value="dish">餐點</option>
                            <option value="coupon_bundle">套餐</option>
                          </select>
                          <div class="invalid-feedback" v-if="getItemError(categoryIndex, itemIndex, 'itemType')">
                            {{ getItemError(categoryIndex, itemIndex, 'itemType') }}
                          </div>
                        </td>
                        <td>
                          <!-- 餐點選擇 -->
                          <select v-if="item.itemType === 'dish'" v-model="item.dishTemplate"
                            class="form-select form-select-sm"
                            :class="{ 'is-invalid': getItemError(categoryIndex, itemIndex, 'dishTemplate') }">
                            <option value="">選擇餐點</option>
                            <option v-for="template in dishTemplates" :key="template._id" :value="template._id">
                              {{ template.name }} - ${{ template.basePrice }}
                            </option>
                          </select>

                          <!-- 套餐選擇 -->
                          <select v-else-if="item.itemType === 'coupon_bundle'" v-model="item.couponBundle"
                            class="form-select form-select-sm"
                            :class="{ 'is-invalid': getItemError(categoryIndex, itemIndex, 'couponBundle') }">
                            <option value="">選擇套餐</option>
                            <option v-for="bundle in bundles" :key="bundle._id" :value="bundle._id">
                              {{ bundle.name }} - ${{ bundle.sellingPrice }}
                            </option>
                          </select>

                          <div class="text-muted small" v-else>請先選擇商品類型</div>

                          <div class="invalid-feedback"
                            v-if="getItemError(categoryIndex, itemIndex, 'dishTemplate') || getItemError(categoryIndex, itemIndex, 'couponBundle')">
                            {{ getItemError(categoryIndex, itemIndex, 'dishTemplate') || getItemError(categoryIndex,
                              itemIndex, 'couponBundle') }}
                          </div>
                        </td>
                        <td>
                          <div class="input-group input-group-sm">
                            <span class="input-group-text">$</span>
                            <input type="number" class="form-control" v-model.number="item.priceOverride" min="0"
                              placeholder="原價" />
                          </div>
                        </td>
                        <td>
                          <input type="number" class="form-control form-control-sm" v-model.number="item.pointOverride"
                            min="0" placeholder="原點數" />
                        </td>
                        <td>
                          <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox"
                              :id="`item-status-${categoryIndex}-${itemIndex}`" v-model="item.isShowing">
                            <label class="form-check-label small" :for="`item-status-${categoryIndex}-${itemIndex}`">
                              {{ item.isShowing ? '顯示' : '隱藏' }}
                            </label>
                          </div>
                        </td>
                        <td>
                          <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-outline-secondary"
                              @click="moveItem(categoryIndex, itemIndex, -1)" :disabled="itemIndex === 0">
                              <i class="bi bi-arrow-up"></i>
                            </button>
                            <button type="button" class="btn btn-outline-secondary"
                              @click="moveItem(categoryIndex, itemIndex, 1)"
                              :disabled="itemIndex === category.items.length - 1">
                              <i class="bi bi-arrow-down"></i>
                            </button>
                            <button type="button" class="btn btn-outline-danger"
                              @click="removeItem(categoryIndex, itemIndex)">
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="category.items.length === 0">
                        <td colspan="6" class="text-center py-3 text-muted">此分類尚未添加商品</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button type="button" class="btn btn-outline-primary btn-sm" @click="addItem(category)">
                  <i class="bi bi-plus-lg me-1"></i>添加商品
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
const bundles = ref([]);

// 表單數據
const formData = reactive({
  name: '',
  menuType: 'food',
  store: '',
  brand: '',
  categories: [],
  isActive: true
});

// 錯誤訊息
const errors = reactive({
  name: '',
  menuType: '',
  categories: []
});

// 檢查表單是否有效
const isFormValid = computed(() => {
  // 檢查菜單名稱
  if (!formData.name.trim()) return false;

  // 檢查菜單類型
  if (!formData.menuType) return false;

  // 檢查是否有分類
  if (formData.categories.length === 0) return false;

  // 檢查每個分類
  for (const category of formData.categories) {
    // 檢查分類名稱
    if (!category.name || !category.name.trim()) return false;

    // 檢查是否有商品
    if (!category.items || category.items.length === 0) return false;

    // 檢查每個商品
    for (const item of category.items) {
      if (!item.itemType) return false;

      if (item.itemType === 'dish' && !item.dishTemplate) return false;
      if (item.itemType === 'coupon_bundle' && !item.couponBundle) return false;
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

// 獲取套餐資料
const fetchBundles = async () => {
  // TODO: 實作套餐 API 後再補上
  // if (!brandId.value) return;
  // try {
  //   const response = await api.bundle.getAllBundles({ brandId: brandId.value });
  //   if (response && response.bundles) {
  //     bundles.value = response.bundles;
  //   }
  // } catch (error) {
  //   console.error('獲取套餐資料失敗:', error);
  // }

  // 暫時使用空陣列
  bundles.value = [];
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
      formData.menuType = menu.menuType || 'food';
      formData.isActive = menu.isActive !== undefined ? menu.isActive : true;

      // 處理分類資料
      if (menu.categories && menu.categories.length > 0) {
        // 深複製分類資料
        formData.categories = menu.categories;
      }
      console.log('菜單分類資料:', formData.categories);
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

// 獲取商品錯誤訊息
const getItemError = (categoryIndex, itemIndex, field) => {
  if (!errors.categories ||
    !errors.categories[categoryIndex] ||
    !errors.categories[categoryIndex].items ||
    !errors.categories[categoryIndex].items[itemIndex]) {
    return '';
  }
  return errors.categories[categoryIndex].items[itemIndex][field] || '';
};

// 商品類型改變處理
const onItemTypeChange = (categoryIndex, itemIndex) => {
  const item = formData.categories[categoryIndex].items[itemIndex];

  // 清除之前的選擇
  if (item.itemType === 'dish') {
    item.couponBundle = '';
  } else if (item.itemType === 'coupon_bundle') {
    item.dishTemplate = '';
  }
};

// 添加分類
const addCategory = () => {
  formData.categories.push({
    name: '',
    description: '',
    items: [],
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

// 添加商品
const addItem = (category) => {
  if (!category.items) {
    category.items = [];
  }

  category.items.push({
    itemType: '',
    dishTemplate: '',
    couponBundle: '',
    priceOverride: null,
    pointOverride: null,
    isShowing: true,
    order: category.items.length
  });
};

// 移除商品
const removeItem = (categoryIndex, itemIndex) => {
  formData.categories[categoryIndex].items.splice(itemIndex, 1);

  // 重新排序
  formData.categories[categoryIndex].items.forEach((item, idx) => {
    item.order = idx;
  });
};

// 移動商品順序
const moveItem = (categoryIndex, itemIndex, direction) => {
  const items = formData.categories[categoryIndex].items;
  const newIndex = itemIndex + direction;

  if (newIndex < 0 || newIndex >= items.length) return;

  // 交換商品位置
  const temp = items[itemIndex];
  items[itemIndex] = items[newIndex];
  items[newIndex] = temp;

  // 更新順序值
  items[itemIndex].order = itemIndex;
  items[newIndex].order = newIndex;
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

  // 驗證菜單類型
  if (!formData.menuType) {
    errors.menuType = '請選擇菜單類型';
    formErrors.value.push('請選擇菜單類型');
    isValid = false;
  } else {
    errors.menuType = '';
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

    // 檢查是否有商品
    if (!category.items || category.items.length === 0) {
      formErrors.value.push(`分類 "${category.name || `#${categoryIndex + 1}`}" 至少需要一個商品`);
      isValid = false;
    } else {
      // 初始化商品錯誤對象
      errors.categories[categoryIndex].items = [];

      // 驗證每個商品
      category.items.forEach((item, itemIndex) => {
        if (!errors.categories[categoryIndex].items[itemIndex]) {
          errors.categories[categoryIndex].items[itemIndex] = {};
        }

        if (!item.itemType) {
          errors.categories[categoryIndex].items[itemIndex].itemType = '請選擇商品類型';
          formErrors.value.push(`分類 "${category.name || `#${categoryIndex + 1}`}" 中的商品 #${itemIndex + 1}: 請選擇商品類型`);
          isValid = false;
        } else if (item.itemType === 'dish' && !item.dishTemplate) {
          errors.categories[categoryIndex].items[itemIndex].dishTemplate = '請選擇餐點';
          formErrors.value.push(`分類 "${category.name || `#${categoryIndex + 1}`}" 中的商品 #${itemIndex + 1}: 請選擇餐點`);
          isValid = false;
        } else if (item.itemType === 'coupon_bundle' && !item.couponBundle) {
          errors.categories[categoryIndex].items[itemIndex].couponBundle = '請選擇套餐';
          formErrors.value.push(`分類 "${category.name || `#${categoryIndex + 1}`}" 中的商品 #${itemIndex + 1}: 請選擇套餐`);
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
    formData.menuType = 'food';
    formData.categories = [];
    formData.isActive = true;
  }

  // 清除錯誤
  errors.name = '';
  errors.menuType = '';
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
      menuType: formData.menuType,
      brand: formData.brand,
      store: formData.store,
      categories: formData.categories,
      isActive: formData.isActive
    };

    let response;

    if (isEditMode.value) {
      // 更新菜單
      response = await api.menu.updateMenu({
        brandId: brandId.value,
        storeId: storeId.value,
        menuId: menuId.value,
        data: submitData
      });
      successMessage.value = '菜單更新成功！';
    } else {
      // 創建新菜單
      response = await api.menu.createMenu({
        brandId: brandId.value,
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
      fetchBundles(),
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
    fetchBundles(),
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
