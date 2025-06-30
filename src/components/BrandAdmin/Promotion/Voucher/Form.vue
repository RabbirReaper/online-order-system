<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">{{ isEditMode ? '編輯兌換券模板' : '新增兌換券模板' }}</h4>
      <router-link :to="`/admin/${brandId}/vouchers`" class="btn btn-secondary">
        <i class="bi bi-arrow-left me-1"></i>返回列表
      </router-link>
    </div>

    <!-- 成功訊息 -->
    <div class="alert alert-success" v-if="successMessage">
      <i class="bi bi-check-circle-fill me-2"></i>
      {{ successMessage }}
    </div>

    <!-- 錯誤訊息 -->
    <div class="alert alert-danger" v-if="formErrors.length > 0">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      <strong>請修正以下錯誤：</strong>
      <ul class="mb-0 mt-2">
        <li v-for="error in formErrors" :key="error">{{ error }}</li>
      </ul>
    </div>

    <!-- 表單 -->
    <div class="card">
      <div class="card-body">
        <form @submit.prevent="submitForm">
          <!-- 基本資訊 -->
          <div class="mb-4">
            <h6 class="border-bottom pb-2 mb-3">基本資訊</h6>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="name" class="form-label required">兌換券名稱</label>
                <input type="text" class="form-control" id="name" v-model="formData.name"
                  :class="{ 'is-invalid': errors.name }" maxlength="100" placeholder="請輸入兌換券名稱">
                <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
                <div class="form-text">最多100個字元</div>
              </div>

              <div class="col-md-6 mb-3">
                <label for="validityPeriod" class="form-label required">有效期限</label>
                <div class="input-group">
                  <input type="number" class="form-control" id="validityPeriod" v-model="formData.validityPeriod"
                    :class="{ 'is-invalid': errors.validityPeriod }" min="1" placeholder="30">
                  <span class="input-group-text">天</span>
                </div>
                <div class="invalid-feedback" v-if="errors.validityPeriod">{{ errors.validityPeriod }}</div>
                <div class="form-text">兌換券從發放日起的有效天數</div>
              </div>
            </div>

            <div class="mb-3">
              <label for="description" class="form-label">描述</label>
              <textarea class="form-control" id="description" v-model="formData.description" rows="3"
                placeholder="請輸入兌換券描述（選填）"></textarea>
              <div class="form-text">向顧客說明此兌換券的使用方式</div>
            </div>

            <div class="mb-3">
              <label class="form-label">狀態</label>
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="isActive" v-model="formData.isActive">
                <label class="form-check-label" for="isActive">
                  {{ formData.isActive ? '啟用' : '停用' }}
                </label>
              </div>
              <div class="form-text">停用後此模板無法被用於建立 Bundle</div>
            </div>
          </div>

          <!-- 兌換內容設定 -->
          <div class="mb-4">
            <h6 class="border-bottom pb-2 mb-3">兌換內容設定</h6>

            <div class="mb-3">
              <label for="exchangeDishTemplate" class="form-label required">可兌換餐點</label>
              <select class="form-select" id="exchangeDishTemplate" v-model="formData.exchangeDishTemplate"
                :class="{ 'is-invalid': errors.exchangeDishTemplate }">
                <option value="">請選擇餐點</option>
                <option v-for="dish in dishTemplates" :key="dish._id" :value="dish._id">
                  {{ dish.name }} - ${{ formatPrice(dish.basePrice) }}
                </option>
              </select>
              <div class="invalid-feedback" v-if="errors.exchangeDishTemplate">{{ errors.exchangeDishTemplate }}</div>
              <div class="form-text">選擇此兌換券可以兌換的餐點</div>
            </div>

            <!-- 選定餐點的詳細資訊 -->
            <div v-if="selectedDish" class="alert alert-info">
              <h6 class="alert-heading mb-2">
                <i class="bi bi-info-circle me-2"></i>選定餐點資訊
              </h6>
              <div class="row">
                <div class="col-md-6">
                  <strong>餐點名稱：</strong>{{ selectedDish.name }}<br>
                  <strong>基本價格：</strong>${{ formatPrice(selectedDish.basePrice) }}<br>
                  <strong>描述：</strong>{{ selectedDish.description || '無' }}
                </div>
                <div class="col-md-6" v-if="selectedDish.image">
                  <img :src="selectedDish.image.url" class="img-thumbnail" style="max-width: 120px; max-height: 80px;">
                </div>
              </div>
              <div v-if="selectedDish.optionCategories && selectedDish.optionCategories.length > 0" class="mt-2">
                <strong>可選選項：</strong>
                <span v-for="(category, index) in selectedDish.optionCategories" :key="category._id">
                  {{ category.name }}<span v-if="index < selectedDish.optionCategories.length - 1">、</span>
                </span>
              </div>
            </div>
          </div>

          <!-- 提交按鈕 -->
          <div class="d-flex justify-content-end">
            <button type="button" class="btn btn-outline-secondary me-2" @click="resetForm">
              <i class="bi bi-arrow-clockwise me-1"></i>重置
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
              {{ isSubmitting ? '處理中...' : (isEditMode ? '更新模板' : '建立模板') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
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
  description: '',
  exchangeDishTemplate: '',
  validityPeriod: 30,
  isActive: true
});

// 錯誤訊息
const errors = reactive({});

// 狀態
const isSubmitting = ref(false);
const successMessage = ref('');
const formErrors = ref([]);

// 資料
const dishTemplates = ref([]);

// 計算選定的餐點
const selectedDish = computed(() => {
  if (!formData.exchangeDishTemplate) return null;
  return dishTemplates.value.find(dish => dish._id === formData.exchangeDishTemplate);
});

// 格式化價格
const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0';
};

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取模板資料
    fetchTemplateData();
  } else {
    // 清空表單
    Object.assign(formData, {
      name: '',
      description: '',
      exchangeDishTemplate: '',
      validityPeriod: 30,
      isActive: true
    });
  }

  // 清除錯誤
  Object.keys(errors).forEach(key => delete errors[key]);
  formErrors.value = [];
  successMessage.value = '';
};

// 驗證表單
const validateForm = () => {
  // 清除先前的錯誤
  Object.keys(errors).forEach(key => delete errors[key]);
  formErrors.value = [];
  let isValid = true;

  // 驗證名稱
  if (!formData.name.trim()) {
    errors.name = '兌換券名稱為必填項';
    formErrors.value.push('兌換券名稱為必填項');
    isValid = false;
  } else if (formData.name.length > 100) {
    errors.name = '兌換券名稱不能超過 100 個字元';
    formErrors.value.push('兌換券名稱不能超過 100 個字元');
    isValid = false;
  }

  // 驗證兌換餐點
  if (!formData.exchangeDishTemplate) {
    errors.exchangeDishTemplate = '請選擇可兌換的餐點';
    formErrors.value.push('請選擇可兌換的餐點');
    isValid = false;
  }

  // 驗證有效期限
  if (!formData.validityPeriod || formData.validityPeriod < 1) {
    errors.validityPeriod = '有效期限必須大於 0';
    formErrors.value.push('有效期限必須大於 0');
    isValid = false;
  }

  return isValid;
};

// 獲取餐點模板
const fetchDishTemplates = async () => {
  if (!brandId.value) return;

  try {
    const response = await api.dish.getAllDishTemplates({ brandId: brandId.value });
    if (response && response.templates) {
      dishTemplates.value = response.templates;
    }
  } catch (error) {
    console.error('獲取餐點模板失敗:', error);
    formErrors.value.push('無法獲取餐點模板資料，請稍後再試');
  }
};

// 獲取兌換券模板資料 (編輯模式)
const fetchTemplateData = async () => {
  if (!isEditMode.value || !route.params.id) return;

  try {
    const response = await api.promotion.getVoucherTemplateById({
      brandId: brandId.value,
      id: route.params.id
    });

    if (response && response.template) {
      const template = response.template;

      // 填充表單資料
      Object.assign(formData, {
        name: template.name,
        description: template.description || '',
        exchangeDishTemplate: template.exchangeDishTemplate?._id || template.exchangeDishTemplate || '',
        validityPeriod: template.validityPeriod,
        isActive: template.isActive
      });
    } else {
      formErrors.value = ['獲取兌換券模板資料失敗'];
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/vouchers`);
      }, 2000);
    }
  } catch (error) {
    console.error('獲取兌換券模板資料時發生錯誤:', error);
    formErrors.value = ['獲取兌換券模板資料時發生錯誤，請稍後再試'];
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/vouchers`);
    }, 2000);
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
    // 準備提交資料
    const submitData = {
      brand: brandId.value,
      ...formData
    };

    let response;

    if (isEditMode.value) {
      // 更新兌換券模板
      response = await api.promotion.updateVoucherTemplate({
        brandId: brandId.value,
        id: route.params.id,
        data: submitData
      });
      successMessage.value = '兌換券模板更新成功！';
    } else {
      // 創建新兌換券模板
      response = await api.promotion.createVoucherTemplate({
        brandId: brandId.value,
        data: submitData
      });
      successMessage.value = '兌換券模板創建成功！';
    }

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/vouchers`);
    }, 1000);
  } catch (error) {
    console.error('儲存兌換券模板時發生錯誤:', error);

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
      formErrors.value = ['儲存兌換券模板時發生未知錯誤，請稍後再試'];
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    isSubmitting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 獲取餐點模板
  fetchDishTemplates();

  // 如果是編輯模式，獲取兌換券模板資料
  if (isEditMode.value) {
    fetchTemplateData();
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

.img-thumbnail {
  border: 1px solid #dee2e6;
}
</style>
