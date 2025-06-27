<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">{{ isEditMode ? '編輯折價券' : '新增折價券' }}</h4>
      <router-link :to="`/admin/${brandId}/coupons`" class="btn btn-secondary">
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
                <label for="name" class="form-label required">折價券名稱</label>
                <input type="text" class="form-control" id="name" v-model="formData.name"
                  :class="{ 'is-invalid': errors.name }" maxlength="50" placeholder="請輸入折價券名稱">
                <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
                <div class="form-text">最多50個字元</div>
              </div>

              <div class="col-md-6 mb-3">
                <label for="pointCost" class="form-label required">兌換點數</label>
                <input type="number" class="form-control" id="pointCost" v-model="formData.pointCost"
                  :class="{ 'is-invalid': errors.pointCost }" min="1" placeholder="請輸入所需點數">
                <div class="invalid-feedback" v-if="errors.pointCost">{{ errors.pointCost }}</div>
                <div class="form-text">顧客兌換此折價券需要的點數</div>
              </div>
            </div>

            <div class="mb-3">
              <label for="description" class="form-label">描述</label>
              <textarea class="form-control" id="description" v-model="formData.description" rows="3"
                placeholder="請輸入折價券描述（選填）"></textarea>
              <div class="form-text">向顧客說明此折價券的使用方式和限制</div>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="validityPeriod" class="form-label required">有效期限</label>
                <div class="input-group">
                  <input type="number" class="form-control" id="validityPeriod" v-model="formData.validityPeriod"
                    :class="{ 'is-invalid': errors.validityPeriod }" min="1" placeholder="請輸入天數">
                  <span class="input-group-text">天</span>
                </div>
                <div class="invalid-feedback" v-if="errors.validityPeriod">{{ errors.validityPeriod }}</div>
                <div class="form-text">從發放日起計算的有效天數</div>
              </div>

              <div class="col-md-6 mb-3">
                <label class="form-label">狀態</label>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="isActive" v-model="formData.isActive">
                  <label class="form-check-label" for="isActive">
                    {{ formData.isActive ? '啟用' : '停用' }}
                  </label>
                </div>
                <div class="form-text">停用後顧客無法兌換此折價券</div>
              </div>
            </div>
          </div>

          <!-- 折扣資訊 -->
          <div class="mb-4">
            <h6 class="border-bottom pb-2 mb-3">折扣設定</h6>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="discountType" class="form-label required">折扣類型</label>
                <select class="form-select" id="discountType" v-model="formData.discountInfo.discountType"
                  :class="{ 'is-invalid': errors['discountInfo.discountType'] }">
                  <option value="">請選擇折扣類型</option>
                  <option value="percentage">百分比折扣</option>
                  <option value="fixed">固定金額折抵</option>
                </select>
                <div class="invalid-feedback" v-if="errors['discountInfo.discountType']">{{
                  errors['discountInfo.discountType'] }}</div>
              </div>

              <div class="col-md-6 mb-3">
                <label for="discountValue" class="form-label required">折扣值</label>
                <div class="input-group">
                  <span class="input-group-text" v-if="formData.discountInfo.discountType === 'fixed'">$</span>
                  <input type="number" class="form-control" id="discountValue"
                    v-model="formData.discountInfo.discountValue"
                    :class="{ 'is-invalid': errors['discountInfo.discountValue'] }" min="0.01" step="0.01"
                    :placeholder="formData.discountInfo.discountType === 'percentage' ? '請輸入百分比' : '請輸入金額'">
                  <span class="input-group-text" v-if="formData.discountInfo.discountType === 'percentage'">%</span>
                </div>
                <div class="invalid-feedback" v-if="errors['discountInfo.discountValue']">{{
                  errors['discountInfo.discountValue'] }}</div>
                <div class="form-text">
                  {{ formData.discountInfo.discountType === 'percentage' ? '輸入1-100的百分比數值' : '輸入具體的折抵金額' }}
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="minPurchaseAmount" class="form-label">最低消費金額</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" id="minPurchaseAmount"
                    v-model="formData.discountInfo.minPurchaseAmount" min="0" step="0.01" placeholder="0">
                </div>
                <div class="form-text">設為0表示無最低消費限制</div>
              </div>

              <div class="col-md-6 mb-3" v-if="formData.discountInfo.discountType === 'percentage'">
                <label for="maxDiscountAmount" class="form-label">最高折扣金額</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" id="maxDiscountAmount"
                    v-model="formData.discountInfo.maxDiscountAmount" min="0.01" step="0.01" placeholder="不限制">
                </div>
                <div class="form-text">留空表示不限制最高折扣金額</div>
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
              {{ isSubmitting ? '處理中...' : (isEditMode ? '更新折價券' : '建立折價券') }}
            </button>
          </div>
        </form>
      </div>
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
const isEditMode = computed(() => !!route.params.id);

// 從路由中獲取品牌ID
const brandId = computed(() => route.params.brandId);

// 表單數據
const formData = reactive({
  name: '',
  brand: '',
  description: '',
  couponType: 'discount', // 固定為折價券
  pointCost: 1,
  discountInfo: {
    discountType: '',
    discountValue: 0,
    maxDiscountAmount: null,
    minPurchaseAmount: 0
  },
  validityPeriod: 30,
  isActive: true,
  stores: []
});

// 錯誤訊息
const errors = reactive({});

// 狀態
const isSubmitting = ref(false);
const successMessage = ref('');
const formErrors = ref([]);

// 格式化價格
const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0';
};

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取折價券資料
    fetchCouponData();
  } else {
    // 清空表單
    formData.name = '';
    formData.brand = brandId.value;
    formData.description = '';
    formData.couponType = 'discount';
    formData.pointCost = 1;
    formData.discountInfo = {
      discountType: '',
      discountValue: 0,
      maxDiscountAmount: null,
      minPurchaseAmount: 0
    };
    formData.validityPeriod = 30;
    formData.isActive = true;
    formData.stores = [];
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
    errors.name = '折價券名稱為必填項';
    formErrors.value.push('折價券名稱為必填項');
    isValid = false;
  } else if (formData.name.length > 50) {
    errors.name = '折價券名稱不能超過 50 個字元';
    formErrors.value.push('折價券名稱不能超過 50 個字元');
    isValid = false;
  }

  // 驗證點數成本
  if (!formData.pointCost || formData.pointCost < 1) {
    errors.pointCost = '點數成本必須大於 0';
    formErrors.value.push('點數成本必須大於 0');
    isValid = false;
  }

  // 驗證有效期限
  if (!formData.validityPeriod || formData.validityPeriod < 1) {
    errors.validityPeriod = '有效期限必須大於 0';
    formErrors.value.push('有效期限必須大於 0');
    isValid = false;
  }

  // 驗證折扣類型
  if (!formData.discountInfo.discountType) {
    errors['discountInfo.discountType'] = '請選擇折扣類型';
    formErrors.value.push('請選擇折扣類型');
    isValid = false;
  }

  // 驗證折扣值
  if (!formData.discountInfo.discountValue || formData.discountInfo.discountValue <= 0) {
    errors['discountInfo.discountValue'] = '折扣值必須大於 0';
    formErrors.value.push('折扣值必須大於 0');
    isValid = false;
  } else if (formData.discountInfo.discountType === 'percentage' && formData.discountInfo.discountValue > 100) {
    errors['discountInfo.discountValue'] = '折扣百分比不能超過 100';
    formErrors.value.push('折扣百分比不能超過 100');
    isValid = false;
  }

  return isValid;
};

// 獲取折價券資料 (編輯模式)
const fetchCouponData = async () => {
  if (!isEditMode.value || !route.params.id) return;

  try {
    const response = await api.promotion.getCouponTemplateById({
      id: route.params.id,
      brandId: brandId.value
    });

    if (response && response.template) {
      const template = response.template;

      // 確保只處理折價券
      if (template.couponType !== 'discount') {
        formErrors.value = ['此項目不是折價券'];
        setTimeout(() => {
          router.push(`/admin/${brandId.value}/coupons`);
        }, 2000);
        return;
      }

      // 填充表單資料
      Object.assign(formData, template);
    } else {
      formErrors.value = ['獲取折價券資料失敗'];
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/coupons`);
      }, 2000);
    }
  } catch (error) {
    console.error('獲取折價券資料時發生錯誤:', error);
    formErrors.value = ['獲取折價券資料時發生錯誤，請稍後再試'];
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/coupons`);
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
    // 設置品牌ID
    formData.brand = brandId.value;

    // 準備提交資料
    const submitData = {
      ...formData
    };

    // 清理 exchangeInfo（折價券不需要）
    delete submitData.exchangeInfo;

    let response;

    if (isEditMode.value) {
      // 更新折價券
      response = await api.promotion.updateCouponTemplate({
        brandId: brandId.value,
        id: route.params.id,
        data: submitData
      });
      successMessage.value = '折價券更新成功！';
    } else {
      // 創建新折價券
      response = await api.promotion.createCouponTemplate({
        data: submitData,
        brandId: brandId.value
      });
      successMessage.value = '折價券創建成功！';
    }

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/coupons`);
    }, 1000);
  } catch (error) {
    console.error('儲存折價券時發生錯誤:', error);

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
      formErrors.value = ['儲存折價券時發生未知錯誤，請稍後再試'];
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    isSubmitting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 如果是編輯模式，獲取折價券資料
  if (isEditMode.value) {
    fetchCouponData();
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
</style>
