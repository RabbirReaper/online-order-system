<template>
  <div class="card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">{{ isEditMode ? '編輯選項' : '新增選項' }}</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="submitForm" novalidate>
        <!-- 基本資訊區塊 -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3">基本資訊</h6>

          <!-- 選項名稱 -->
          <div class="mb-3">
            <label for="optionName" class="form-label required">選項名稱</label>
            <input type="text" class="form-control" id="optionName" v-model="formData.name"
              :class="{ 'is-invalid': errors.name }" required />
            <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
            <div class="form-text">請輸入選項名稱，例如：「大杯」、「半糖」、「加珍珠」等</div>
          </div>

          <!-- 選項價格 -->
          <div class="mb-3">
            <label for="optionPrice" class="form-label required">額外價格</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input type="number" class="form-control" id="optionPrice" v-model="formData.price" min="0" step="1"
                :class="{ 'is-invalid': errors.price }" required />
            </div>
            <div class="invalid-feedback" v-if="errors.price">{{ errors.price }}</div>
            <div class="form-text">選擇此選項時需額外加收的費用，填寫 0 表示免費</div>
          </div>

          <!-- 關聯餐點 -->
          <div class="mb-3">
            <label for="refDishTemplate" class="form-label">關聯餐點</label>
            <select class="form-select" id="refDishTemplate" v-model="formData.refDishTemplate"
              :class="{ 'is-invalid': errors.refDishTemplate }">
              <option value="">無關聯（不影響庫存）</option>
              <option v-for="dish in dishes" :key="dish._id" :value="dish._id">
                {{ dish.name }}
              </option>
            </select>
            <div class="invalid-feedback" v-if="errors.refDishTemplate">{{ errors.refDishTemplate }}</div>
            <div class="form-text">關聯餐點後，選擇此選項會影響該餐點的庫存（可選）</div>
          </div>
        </div>

        <!-- 關聯類別區塊 -->
        <div class="mb-4" v-if="isEditMode">
          <h6 class="border-bottom pb-2 mb-3">關聯類別</h6>
          <div v-if="linkedCategories.length > 0">
            <p>此選項已關聯到以下選項類別：</p>
            <ul class="list-group mb-3">
              <li v-for="category in linkedCategories" :key="category._id"
                class="list-group-item d-flex justify-content-between align-items-center">
                {{ category.name }}
                <span class="badge" :class="category.inputType === 'single' ? 'bg-info' : 'bg-warning'">
                  {{ category.inputType === 'single' ? '單選' : '多選' }}
                </span>
              </li>
            </ul>
          </div>
          <div v-else class="alert alert-light text-center">
            <div class="text-muted">此選項尚未關聯到任何選項類別</div>
          </div>
        </div>

        <!-- 表單驗證錯誤訊息 -->
        <div class="alert alert-danger" v-if="formErrors.length > 0">
          <p class="mb-1"><strong><i class="bi bi-exclamation-triangle-fill me-2"></i>請修正以下錯誤：</strong></p>
          <ul class="mb-0 ps-3">
            <li v-for="(error, index) in formErrors" :key="index">{{ error }}</li>
          </ul>
        </div>

        <!-- 提交結果訊息 -->
        <div class="alert alert-success" v-if="successMessage">
          <i class="bi bi-check-circle-fill me-2"></i>{{ successMessage }}
        </div>

        <!-- 按鈕組 -->
        <div class="d-flex justify-content-between">
          <!-- 左側 - 重置按鈕 -->
          <div>
            <button type="button" class="btn btn-secondary" @click="resetForm" :disabled="isSubmitting">
              <i class="bi bi-arrow-counterclockwise me-1"></i>重置
            </button>
          </div>

          <!-- 右側 - 取消和儲存按鈕 -->
          <div>
            <router-link :to="`/admin/${brandId}/options`" class="btn btn-secondary me-2" :disabled="isSubmitting">
              <i class="bi bi-x-circle me-1"></i>取消
            </router-link>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              <i v-else class="bi bi-save me-1"></i>
              {{ isSubmitting ? '處理中...' : (isEditMode ? '更新選項' : '建立選項') }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api';

// 路由
const router = useRouter();
const route = useRoute();

// 判斷是否為編輯模式
const isEditMode = computed(() => !!route.params.id);

// 從路由中獲取品牌ID
const brandId = computed(() => route.params.brandId);

// 表單數據
const formData = reactive({
  name: '',
  brand: '',
  price: 0,
  refDishTemplate: ''
});

// 錯誤訊息
const errors = reactive({
  name: '',
  price: '',
  refDishTemplate: ''
});

// 狀態
const isSubmitting = ref(false);
const successMessage = ref('');
const formErrors = ref([]);
const dishes = ref([]);
const linkedCategories = ref([]);

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取選項資料
    fetchOptionData();
  } else {
    // 清空表單
    formData.name = '';
    formData.brand = brandId.value;
    formData.price = 0;
    formData.refDishTemplate = '';
  }

  // 清除錯誤
  errors.name = '';
  errors.price = '';
  errors.refDishTemplate = '';
  formErrors.value = [];
  successMessage.value = '';
};

// 驗證表單
const validateForm = () => {
  // 清除先前的錯誤
  errors.name = '';
  errors.price = '';
  errors.refDishTemplate = '';
  formErrors.value = [];
  let isValid = true;

  // 驗證選項名稱
  if (!formData.name.trim()) {
    errors.name = '選項名稱為必填項';
    formErrors.value.push('選項名稱為必填項');
    isValid = false;
  } else if (formData.name.length > 50) {
    errors.name = '選項名稱不能超過 50 個字元';
    formErrors.value.push('選項名稱不能超過 50 個字元');
    isValid = false;
  }

  // 驗證價格
  if (formData.price === null || formData.price === undefined || formData.price === '') {
    errors.price = '價格為必填項';
    formErrors.value.push('價格為必填項');
    isValid = false;
  } else if (isNaN(formData.price) || formData.price < 0) {
    errors.price = '價格必須是非負數';
    formErrors.value.push('價格必須是非負數');
    isValid = false;
  }

  return isValid;
};

// 獲取選項資料 (編輯模式)
const fetchOptionData = async () => {
  if (!isEditMode.value || !route.params.id) return;

  try {
    const response = await api.dish.getOptionById({ id: route.params.id, brandId: brandId.value });
    if (response && response.option) {
      const option = response.option;
      formData.name = option.name;
      formData.brand = option.brand;
      formData.price = option.price;
      formData.refDishTemplate = option.refDishTemplate ? option.refDishTemplate._id : '';
      formData._id = option._id;

      // 獲取關聯此選項的類別
      fetchLinkedCategories();
    } else {
      // 顯示錯誤訊息
      formErrors.value = ['獲取選項資料失敗'];
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/options`);
      }, 2000);
    }
  } catch (error) {
    console.error('獲取選項資料時發生錯誤:', error);
    formErrors.value = ['獲取選項資料時發生錯誤，請稍後再試'];
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/options`);
    }, 2000);
  }
};

// 獲取關聯此選項的類別
const fetchLinkedCategories = async () => {
  if (!isEditMode.value || !route.params.id) return;

  try {
    const response = await api.dish.getAllOptionCategories(brandId.value);
    if (response && response.categories) {
      // 找出包含此選項的類別
      linkedCategories.value = response.categories.filter(category =>
        category.options && category.options.some(opt => opt.refOption === route.params.id)
      );
    }
  } catch (error) {
    console.error('獲取關聯類別失敗:', error);
  }
};

// 獲取餐點列表
const fetchDishes = async () => {
  try {
    const response = await api.dish.getAllDishTemplates({ brandId: brandId.value });
    if (response && response.templates) {
      dishes.value = response.templates;
    }
  } catch (error) {
    console.error('獲取餐點列表失敗:', error);
  }
};

// 提交表單
const submitForm = async () => {
  // 清除上一次的成功訊息
  successMessage.value = '';

  if (!validateForm()) {
    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  isSubmitting.value = true;

  try {
    // 設置品牌ID
    formData.brand = brandId.value;

    // 準備提交資料
    const submitData = {
      name: formData.name,
      brand: formData.brand,
      price: Number(formData.price),
      refDishTemplate: formData.refDishTemplate || null
    };

    let response;

    if (isEditMode.value) {
      // 更新選項
      response = await api.dish.updateOption(route.params.id, submitData);
      successMessage.value = '選項更新成功！';
    } else {
      // 創建新選項
      response = await api.dish.createOption(submitData);
      successMessage.value = '選項創建成功！';
    }

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/options`);

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-option-list'));
    }, 500);
  } catch (error) {
    console.error('儲存選項時發生錯誤:', error);

    // 處理 API 錯誤
    if (error.response && error.response.data) {
      const { message, errors: apiErrors } = error.response.data;

      if (apiErrors) {
        // 處理特定欄位錯誤
        Object.keys(apiErrors).forEach(key => {
          errors[key] = apiErrors[key];
          formErrors.value.push(apiErrors[key]);
        });
      } else if (message) {
        // 顯示一般錯誤訊息
        formErrors.value = [`錯誤: ${message}`];
      }
    } else {
      formErrors.value = ['儲存選項時發生未知錯誤，請稍後再試'];
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    isSubmitting.value = false;
  }
};

// 添加一個變數來追蹤用戶是否手動清空了名稱
const userClearedName = ref(false);

// 監聽名稱變化
watch(() => formData.name, (newName, oldName) => {
  // 如果名稱從有值變為空值，表示用戶手動清空了
  if (oldName !== "" && newName === "") {
    userClearedName.value = true;
  }
});

// 監聽引用餐點模板變化
watch(() => formData.refDishTemplate, (newTemplateId, oldTemplateId) => {
  // 如果引用模板改變，重置「用戶清空」標記
  if (newTemplateId !== oldTemplateId) {
    userClearedName.value = false;
  }

  // 只有當名稱為空且用戶未手動清空過名稱時，才自動填充
  if (formData.name === "" && !userClearedName.value && newTemplateId) {
    const dish = dishes.value.find(dish => dish._id === newTemplateId);
    if (dish) {
      formData.name = "+" + dish.name;
    }
  }
});

// 生命週期鉤子
onMounted(() => {
  // 獲取餐點列表
  fetchDishes();

  // 如果是編輯模式，獲取選項資料
  if (isEditMode.value) {
    fetchOptionData();
  }
});
</script>

<style scoped>
/* 必填欄位標記 */
.required::after {
  content: " *";
  color: #dc3545;
}

/* 表單樣式增強 */
.form-control:focus,
.form-select:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.form-text {
  font-size: 0.875rem;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

/* 標籤樣式 */
.badge {
  font-weight: 500;
  font-size: 0.85rem;
}
</style>
