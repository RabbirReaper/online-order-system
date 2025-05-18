<template>
  <div class="card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">{{ isEditMode ? '編輯優惠券' : '新增優惠券' }}</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="submitForm" novalidate>
        <!-- 基本資訊區塊 -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3">基本資訊</h6>

          <!-- 優惠券名稱 -->
          <div class="mb-3">
            <label for="couponName" class="form-label required">優惠券名稱</label>
            <input type="text" class="form-control" id="couponName" v-model="formData.name"
              :class="{ 'is-invalid': errors.name }" required />
            <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
            <div class="form-text">請輸入優惠券名稱，不可超過50個字元</div>
          </div>

          <!-- 優惠券描述 -->
          <div class="mb-3">
            <label for="couponDescription" class="form-label">優惠券描述</label>
            <textarea class="form-control" id="couponDescription" v-model="formData.description" rows="3"
              :class="{ 'is-invalid': errors.description }"></textarea>
            <div class="invalid-feedback" v-if="errors.description">{{ errors.description }}</div>
            <div class="form-text">簡短描述優惠券的使用說明或特色</div>
          </div>

          <!-- 優惠券類型 -->
          <div class="mb-3">
            <label for="couponType" class="form-label required">優惠券類型</label>
            <select class="form-select" id="couponType" v-model="formData.couponType"
              :class="{ 'is-invalid': errors.couponType }" required>
              <option value="">請選擇...</option>
              <option value="discount">折扣券</option>
              <option value="exchange">兌換券</option>
            </select>
            <div class="invalid-feedback" v-if="errors.couponType">{{ errors.couponType }}</div>
            <div class="form-text">
              <strong>折扣券</strong>：提供結帳時的折扣優惠<br>
              <strong>兌換券</strong>：可兌換指定餐點
            </div>
          </div>

          <!-- 點數成本 -->
          <div class="mb-3">
            <label for="pointCost" class="form-label required">所需點數</label>
            <input type="number" class="form-control" id="pointCost" v-model="formData.pointCost" min="1"
              :class="{ 'is-invalid': errors.pointCost }" required />
            <div class="invalid-feedback" v-if="errors.pointCost">{{ errors.pointCost }}</div>
            <div class="form-text">兌換此優惠券所需的點數</div>
          </div>

          <!-- 有效期限 -->
          <div class="mb-3">
            <label for="validityPeriod" class="form-label required">有效期限（天）</label>
            <input type="number" class="form-control" id="validityPeriod" v-model="formData.validityPeriod" min="1"
              :class="{ 'is-invalid': errors.validityPeriod }" required />
            <div class="invalid-feedback" v-if="errors.validityPeriod">{{ errors.validityPeriod }}</div>
            <div class="form-text">優惠券兌換後的有效天數</div>
          </div>

          <!-- 啟用狀態 -->
          <div class="mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="formData.isActive" id="isActive">
              <label class="form-check-label" for="isActive">
                立即啟用
              </label>
            </div>
            <div class="form-text">啟用後用戶可以使用點數兌換此優惠券</div>
          </div>
        </div>

        <!-- 折扣資訊區塊 -->
        <div class="mb-4" v-if="formData.couponType === 'discount'">
          <h6 class="border-bottom pb-2 mb-3">折扣設定</h6>

          <!-- 折扣類型 -->
          <div class="mb-3">
            <label for="discountType" class="form-label required">折扣類型</label>
            <select class="form-select" id="discountType" v-model="formData.discountInfo.discountType"
              :class="{ 'is-invalid': errors['discountInfo.discountType'] }" required>
              <option value="">請選擇...</option>
              <option value="percentage">百分比折扣</option>
              <option value="fixed">固定金額折扣</option>
            </select>
            <div class="invalid-feedback" v-if="errors['discountInfo.discountType']">{{
              errors['discountInfo.discountType'] }}</div>
          </div>

          <!-- 折扣值 -->
          <div class="mb-3">
            <label for="discountValue" class="form-label required">
              {{ formData.discountInfo.discountType === 'percentage' ? '折扣百分比' : '折扣金額' }}
            </label>
            <div class="input-group">
              <span class="input-group-text" v-if="formData.discountInfo.discountType === 'percentage'">%</span>
              <span class="input-group-text" v-else>$</span>
              <input type="number" class="form-control" id="discountValue" v-model="formData.discountInfo.discountValue"
                min="0" :max="formData.discountInfo.discountType === 'percentage' ? 100 : undefined"
                :class="{ 'is-invalid': errors['discountInfo.discountValue'] }" required />
            </div>
            <div class="invalid-feedback" v-if="errors['discountInfo.discountValue']">{{
              errors['discountInfo.discountValue'] }}</div>
            <div class="form-text" v-if="formData.discountInfo.discountType === 'percentage'">
              請輸入 0-100 之間的數字
            </div>
          </div>

          <!-- 最大折扣金額 (僅百分比折扣) -->
          <div class="mb-3" v-if="formData.discountInfo.discountType === 'percentage'">
            <label for="maxDiscountAmount" class="form-label">最大折扣金額</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input type="number" class="form-control" id="maxDiscountAmount"
                v-model="formData.discountInfo.maxDiscountAmount" min="0"
                :class="{ 'is-invalid': errors['discountInfo.maxDiscountAmount'] }" />
            </div>
            <div class="invalid-feedback" v-if="errors['discountInfo.maxDiscountAmount']">{{
              errors['discountInfo.maxDiscountAmount'] }}</div>
            <div class="form-text">設定折扣上限金額（選填）</div>
          </div>

          <!-- 最低消費金額 -->
          <div class="mb-3">
            <label for="minPurchaseAmount" class="form-label">最低消費金額</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input type="number" class="form-control" id="minPurchaseAmount"
                v-model="formData.discountInfo.minPurchaseAmount" min="0"
                :class="{ 'is-invalid': errors['discountInfo.minPurchaseAmount'] }" />
            </div>
            <div class="invalid-feedback" v-if="errors['discountInfo.minPurchaseAmount']">{{
              errors['discountInfo.minPurchaseAmount'] }}</div>
            <div class="form-text">使用此優惠券的最低消費門檻</div>
          </div>
        </div>

        <!-- 兌換資訊區塊 -->
        <div class="mb-4" v-if="formData.couponType === 'exchange'">
          <h6 class="border-bottom pb-2 mb-3 d-flex justify-content-between">
            <span>兌換品項</span>
            <button type="button" class="btn btn-sm btn-outline-primary" @click="addExchangeItem">
              <i class="bi bi-plus-circle me-1"></i>新增品項
            </button>
          </h6>

          <!-- 兌換品項列表 -->
          <div v-if="formData.exchangeInfo.items.length > 0">
            <div v-for="(item, index) in formData.exchangeInfo.items" :key="index" class="card mb-3">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-8 mb-3">
                    <label class="form-label required">餐點品項</label>
                    <select v-model="item.dishTemplate" class="form-select"
                      :class="{ 'is-invalid': getItemError(index, 'dishTemplate') }">
                      <option value="">選擇餐點</option>
                      <option v-for="template in dishTemplates" :key="template._id" :value="template._id">
                        {{ template.name }} - ${{ formatPrice(template.basePrice) }}
                      </option>
                    </select>
                    <div class="invalid-feedback" v-if="getItemError(index, 'dishTemplate')">{{ getItemError(index,
                      'dishTemplate') }}</div>
                  </div>
                  <div class="col-md-3 mb-3">
                    <label class="form-label required">數量</label>
                    <input type="number" class="form-control" v-model="item.quantity" min="1"
                      :class="{ 'is-invalid': getItemError(index, 'quantity') }" />
                    <div class="invalid-feedback" v-if="getItemError(index, 'quantity')">{{ getItemError(index,
                      'quantity') }}</div>
                  </div>
                  <div class="col-md-1 mb-3">
                    <label class="form-label">&nbsp;</label>
                    <button type="button" class="btn btn-outline-danger btn-sm d-block"
                      @click="removeExchangeItem(index)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 無品項提示 -->
          <div class="alert alert-light text-center py-3" v-else>
            <div class="text-muted">尚未添加任何兌換品項</div>
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
            <router-link :to="`/admin/${brandId}/coupons`" class="btn btn-secondary me-2" :disabled="isSubmitting">
              <i class="bi bi-x-circle me-1"></i>取消
            </router-link>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              <i v-else class="bi bi-save me-1"></i>
              {{ isSubmitting ? '處理中...' : (isEditMode ? '更新優惠券' : '建立優惠券') }}
            </button>
          </div>
        </div>
      </form>
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
  couponType: '',
  pointCost: 1,
  discountInfo: {
    discountType: '',
    discountValue: 0,
    maxDiscountAmount: null,
    minPurchaseAmount: 0
  },
  exchangeInfo: {
    items: []
  },
  validityPeriod: 30,
  isActive: true,
  stores: [] // 目前直接回傳空陣列
});

// 錯誤訊息
const errors = reactive({});

// 狀態
const isSubmitting = ref(false);
const successMessage = ref('');
const formErrors = ref([]);
const dishTemplates = ref([]);

// 添加變數來追蹤用戶是否手動清空了名稱
const userClearedName = ref(false);

// 格式化價格
const formatPrice = (price) => {
  return price.toLocaleString('zh-TW');
};

// 獲取品項錯誤
const getItemError = (index, field) => {
  return errors[`exchangeInfo.items.${index}.${field}`];
};

// 新增兌換品項
const addExchangeItem = () => {
  formData.exchangeInfo.items.push({
    dishTemplate: '',
    quantity: 1
  });
};

// 移除兌換品項
const removeExchangeItem = (index) => {
  formData.exchangeInfo.items.splice(index, 1);
};

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取優惠券資料
    fetchCouponData();
  } else {
    // 清空表單
    formData.name = '';
    formData.brand = brandId.value;
    formData.description = '';
    formData.couponType = '';
    formData.pointCost = 1;
    formData.discountInfo = {
      discountType: '',
      discountValue: 0,
      maxDiscountAmount: null,
      minPurchaseAmount: 0
    };
    formData.exchangeInfo = {
      items: []
    };
    formData.validityPeriod = 30;
    formData.isActive = true;
    formData.stores = [];

    // 重置名稱追蹤標記
    userClearedName.value = false;
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
    errors.name = '優惠券名稱為必填項';
    formErrors.value.push('優惠券名稱為必填項');
    isValid = false;
  } else if (formData.name.length > 50) {
    errors.name = '優惠券名稱不能超過 50 個字元';
    formErrors.value.push('優惠券名稱不能超過 50 個字元');
    isValid = false;
  }

  // 驗證類型
  if (!formData.couponType) {
    errors.couponType = '請選擇優惠券類型';
    formErrors.value.push('請選擇優惠券類型');
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

  // 根據類型驗證特定欄位
  if (formData.couponType === 'discount') {
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
  } else if (formData.couponType === 'exchange') {
    // 驗證兌換品項
    if (formData.exchangeInfo.items.length === 0) {
      formErrors.value.push('請至少添加一個兌換品項');
      isValid = false;
    } else {
      formData.exchangeInfo.items.forEach((item, index) => {
        if (!item.dishTemplate) {
          errors[`exchangeInfo.items.${index}.dishTemplate`] = '請選擇餐點';
          formErrors.value.push(`第 ${index + 1} 個品項未選擇餐點`);
          isValid = false;
        }
        if (!item.quantity || item.quantity < 1) {
          errors[`exchangeInfo.items.${index}.quantity`] = '數量必須大於 0';
          formErrors.value.push(`第 ${index + 1} 個品項數量錯誤`);
          isValid = false;
        }
      });
    }
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
    formErrors.value.push('無法獲取餐點資料，請稍後再試');
  }
};

// 獲取優惠券資料 (編輯模式)
const fetchCouponData = async () => {
  if (!isEditMode.value || !route.params.id) return;

  try {
    const response = await api.promotion.getCouponTemplateById({
      id: route.params.id,
      brandId: brandId.value
    });

    if (response && response.template) {
      const template = response.template;
      // 填充表單資料
      Object.assign(formData, template);
    } else {
      formErrors.value = ['獲取優惠券資料失敗'];
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/coupons`);
      }, 2000);
    }
  } catch (error) {
    console.error('獲取優惠券資料時發生錯誤:', error);
    formErrors.value = ['獲取優惠券資料時發生錯誤，請稍後再試'];
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

    // 根據優惠券類型清理不需要的資料
    if (submitData.couponType === 'discount') {
      delete submitData.exchangeInfo;
    } else if (submitData.couponType === 'exchange') {
      delete submitData.discountInfo;
    }

    let response;

    if (isEditMode.value) {
      // 更新優惠券
      response = await api.promotion.updateCouponTemplate({
        brandId: brandId.value,
        id: route.params.id,
        data: submitData
      });
      successMessage.value = '優惠券更新成功！';
    } else {
      // 創建新優惠券
      response = await api.promotion.createCouponTemplate({ data: submitData, brandId: brandId.value });
      successMessage.value = '優惠券創建成功！';
    }

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/coupons`);
    }, 1000);
  } catch (error) {
    console.error('儲存優惠券時發生錯誤:', error);

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
      formErrors.value = ['儲存優惠券時發生未知錯誤，請稍後再試'];
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    isSubmitting.value = false;
  }
};

// 監聽名稱變化
watch(() => formData.name, (newName, oldName) => {
  // 如果名稱從有值變為空值，表示用戶手動清空了
  if (oldName !== "" && newName === "") {
    userClearedName.value = true;
  }
});

// 監聽優惠券類型變化
watch(() => formData.couponType, (newType) => {
  // 如果切換到兌換券類型，重置用戶清空標記
  if (newType === 'exchange') {
    userClearedName.value = false;
  }
});

// 監聽兌換品項變化（深度監聽）
watch(() => formData.exchangeInfo.items, (newItems) => {
  // 如果是兌換券類型、名稱為空且用戶未手動清空過名稱
  if (formData.couponType === 'exchange' &&
    formData.name === "" &&
    !userClearedName.value &&
    newItems.length > 0) {

    // 找第一個有效的品項
    const firstValidItem = newItems.find(item => item.dishTemplate);
    if (firstValidItem) {
      const dish = dishTemplates.value.find(d => d._id === firstValidItem.dishTemplate);
      if (dish) {
        formData.name = `${dish.name}-兌換券`;
      }
    }
  }
}, { deep: true });

// 生命週期鉤子
onMounted(() => {
  // 獲取餐點模板
  fetchDishTemplates();

  // 如果是編輯模式，獲取優惠券資料
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
