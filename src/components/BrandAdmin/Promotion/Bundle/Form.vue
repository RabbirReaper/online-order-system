<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">{{ isEditMode ? '編輯包裝商品' : '新增包裝商品' }}</h4>
      <router-link :to="`/admin/${brandId}/bundles`" class="btn btn-secondary">
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
                <label for="name" class="form-label required">商品名稱</label>
                <input type="text" class="form-control" id="name" v-model="formData.name"
                  :class="{ 'is-invalid': errors.name }" maxlength="100" placeholder="請輸入商品名稱">
                <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
                <div class="form-text">最多100個字元</div>
              </div>

              <div class="col-md-6 mb-3">
                <label for="sellingPoint" class="form-label">賣點數值</label>
                <input type="number" class="form-control" id="sellingPoint" v-model="formData.sellingPoint" min="0"
                  placeholder="例如：節省金額、折扣百分比等">
                <div class="form-text">用於顯示的數值賣點，如折扣百分比或節省金額</div>
              </div>
            </div>

            <div class="mb-3">
              <label for="description" class="form-label required">商品描述</label>
              <textarea class="form-control" id="description" v-model="formData.description" rows="3"
                :class="{ 'is-invalid': errors.description }" placeholder="請輸入商品描述"></textarea>
              <div class="invalid-feedback" v-if="errors.description">{{ errors.description }}</div>
              <div class="form-text">向顧客說明此包裝商品的內容和特色</div>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">狀態</label>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="isActive" v-model="formData.isActive">
                  <label class="form-check-label" for="isActive">
                    {{ formData.isActive ? '啟用' : '停用' }}
                  </label>
                </div>
                <div class="form-text">停用後顧客無法購買此商品</div>
              </div>

              <div class="col-md-6 mb-3">
                <label class="form-label">自動狀態控制</label>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="autoStatusControl"
                    v-model="formData.autoStatusControl">
                  <label class="form-check-label" for="autoStatusControl">
                    {{ formData.autoStatusControl ? '啟用' : '停用' }}
                  </label>
                </div>
                <div class="form-text">根據販售期間自動啟用/停用商品</div>
              </div>
            </div>
          </div>

          <!-- 圖片上傳 -->
          <div class="mb-4">
            <h6 class="border-bottom pb-2 mb-3">商品圖片</h6>
            <div class="row">
              <div class="col-md-6">
                <label for="imageUpload" class="form-label">上傳圖片</label>
                <input type="file" class="form-control" id="imageUpload" accept="image/*" @change="handleImageUpload">
                <div class="form-text">支援 JPG, PNG 格式，建議尺寸 400x300 像素</div>
              </div>
              <div class="col-md-6">
                <div v-if="imagePreview" class="text-center">
                  <img :src="imagePreview" class="img-thumbnail" style="max-width: 200px; max-height: 150px;">
                  <div class="mt-2">
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage">
                      <i class="bi bi-trash me-1"></i>移除圖片
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 價格設定 -->
          <div class="mb-4">
            <h6 class="border-bottom pb-2 mb-3">價格設定</h6>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">現金價格</label>
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="hasCashPrice" v-model="hasCashPrice">
                  <label class="form-check-label" for="hasCashPrice">
                    提供現金購買
                  </label>
                </div>
                <div v-if="hasCashPrice">
                  <div class="row">
                    <div class="col-6">
                      <label class="form-label required">原價</label>
                      <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input type="number" class="form-control" v-model="formData.cashPrice.original" min="0"
                          step="0.01" placeholder="0.00" :class="{ 'is-invalid': errors['cashPrice.original'] }">
                      </div>
                      <div class="invalid-feedback" v-if="errors['cashPrice.original']">{{ errors['cashPrice.original']
                        }}</div>
                    </div>
                    <div class="col-6">
                      <label class="form-label">特價</label>
                      <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input type="number" class="form-control" v-model="formData.cashPrice.selling" min="0"
                          step="0.01" placeholder="留空使用原價">
                      </div>
                      <div class="form-text small">特價須低於原價</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <label class="form-label">點數價格</label>
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="hasPointPrice" v-model="hasPointPrice">
                  <label class="form-check-label" for="hasPointPrice">
                    提供點數兌換
                  </label>
                </div>
                <div v-if="hasPointPrice">
                  <div class="row">
                    <div class="col-6">
                      <label class="form-label required">原價</label>
                      <div class="input-group">
                        <input type="number" class="form-control" v-model="formData.pointPrice.original" min="0"
                          placeholder="0" :class="{ 'is-invalid': errors['pointPrice.original'] }">
                        <span class="input-group-text">點</span>
                      </div>
                      <div class="invalid-feedback" v-if="errors['pointPrice.original']">{{
                        errors['pointPrice.original'] }}</div>
                    </div>
                    <div class="col-6">
                      <label class="form-label">特價</label>
                      <div class="input-group">
                        <input type="number" class="form-control" v-model="formData.pointPrice.selling" min="0"
                          placeholder="留空使用原價">
                        <span class="input-group-text">點</span>
                      </div>
                      <div class="form-text small">特價須低於原價</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 時間設定 -->
          <div class="mb-4" v-if="formData.autoStatusControl">
            <h6 class="border-bottom pb-2 mb-3">時間設定</h6>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="validFrom" class="form-label required">販售開始時間</label>
                <input type="datetime-local" class="form-control" id="validFrom" v-model="formData.validFrom"
                  :class="{ 'is-invalid': errors.validFrom }">
                <div class="invalid-feedback" v-if="errors.validFrom">{{ errors.validFrom }}</div>
                <div class="form-text">商品開始販售的時間</div>
              </div>

              <div class="col-md-4 mb-3">
                <label for="validTo" class="form-label required">販售結束時間</label>
                <input type="datetime-local" class="form-control" id="validTo" v-model="formData.validTo"
                  :class="{ 'is-invalid': errors.validTo }">
                <div class="invalid-feedback" v-if="errors.validTo">{{ errors.validTo }}</div>
                <div class="form-text">商品停止販售的時間</div>
              </div>

              <div class="col-md-4 mb-3">
                <label for="voucherValidityDays" class="form-label required">兌換券有效期</label>
                <div class="input-group">
                  <input type="number" class="form-control" id="voucherValidityDays"
                    v-model="formData.voucherValidityDays" min="1"
                    :class="{ 'is-invalid': errors.voucherValidityDays }">
                  <span class="input-group-text">天</span>
                </div>
                <div class="invalid-feedback" v-if="errors.voucherValidityDays">{{ errors.voucherValidityDays }}</div>
                <div class="form-text">生成的兌換券有效天數</div>
              </div>
            </div>
          </div>

          <!-- 購買限制 -->
          <div class="mb-4">
            <h6 class="border-bottom pb-2 mb-3">購買限制</h6>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="purchaseLimitPerUser" class="form-label">每人購買限制</label>
                <input type="number" class="form-control" id="purchaseLimitPerUser"
                  v-model="formData.purchaseLimitPerUser" min="0" placeholder="0 表示無限制">
                <div class="form-text">設為0表示每人無購買數量限制</div>
              </div>
            </div>
          </div>

          <!-- 包裝內容 -->
          <div class="mb-4">
            <h6 class="border-bottom pb-2 mb-3 d-flex justify-content-between">
              <span>包裝內容</span>
              <button type="button" class="btn btn-sm btn-outline-primary" @click="addBundleItem"
                :disabled="voucherTemplates.length === 0">
                <i class="bi bi-plus-circle me-1"></i>新增項目
              </button>
            </h6>

            <!-- 兌換券模板載入提示 -->
            <div v-if="isLoadingTemplates" class="text-center py-3">
              <div class="spinner-border spinner-border-sm text-primary me-2"></div>
              載入兌換券模板中...
            </div>

            <!-- 沒有可用模板提示 -->
            <div v-else-if="voucherTemplates.length === 0" class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>沒有可用的兌換券模板</strong>
              <p class="mb-0 mt-2">請先到兌換券管理頁面建立兌換券模板，才能建立包裝商品。</p>
              <router-link :to="`/admin/${brandId}/vouchers`" class="btn btn-sm btn-outline-primary mt-2">
                前往兌換券管理
              </router-link>
            </div>

            <!-- 包裝項目列表 -->
            <div v-else-if="formData.bundleItems.length > 0">
              <div v-for="(item, index) in formData.bundleItems" :key="index" class="card mb-3">
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-8 mb-3">
                      <label class="form-label required">兌換券模板</label>
                      <select v-model="item.voucherTemplate" class="form-select"
                        :class="{ 'is-invalid': getItemError(index, 'voucherTemplate') }"
                        @change="updateVoucherName(index)">
                        <option value="">選擇兌換券模板</option>
                        <option v-for="template in voucherTemplates" :key="template._id" :value="template._id">
                          {{ template.name }}
                          <span v-if="template.exchangeDishTemplate">
                            - {{ template.exchangeDishTemplate.name }}
                          </span>
                        </option>
                      </select>
                      <div class="invalid-feedback" v-if="getItemError(index, 'voucherTemplate')">
                        {{ getItemError(index, 'voucherTemplate') }}
                      </div>
                    </div>
                    <div class="col-md-3 mb-3">
                      <label class="form-label required">數量</label>
                      <input type="number" class="form-control" v-model="item.quantity" min="1"
                        :class="{ 'is-invalid': getItemError(index, 'quantity') }" />
                      <div class="invalid-feedback" v-if="getItemError(index, 'quantity')">
                        {{ getItemError(index, 'quantity') }}
                      </div>
                    </div>
                    <div class="col-md-1 mb-3">
                      <label class="form-label">&nbsp;</label>
                      <button type="button" class="btn btn-outline-danger w-100" @click="removeBundleItem(index)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <!-- 選定模板的詳細資訊 -->
                  <div v-if="getSelectedTemplate(item.voucherTemplate)" class="alert alert-info mb-0">
                    <div class="row">
                      <div class="col-md-8">
                        <h6 class="mb-1">{{ getSelectedTemplate(item.voucherTemplate).name }}</h6>
                        <div v-if="getSelectedTemplate(item.voucherTemplate).exchangeDishTemplate">
                          <strong>可兌換：</strong>{{ getSelectedTemplate(item.voucherTemplate).exchangeDishTemplate.name
                          }}<br>
                          <strong>餐點價格：</strong>${{
                            formatPrice(getSelectedTemplate(item.voucherTemplate).exchangeDishTemplate.basePrice) }}<br>
                          <strong>有效期限：</strong>{{ getSelectedTemplate(item.voucherTemplate).validityPeriod }} 天
                        </div>
                      </div>
                      <div class="col-md-4"
                        v-if="getSelectedTemplate(item.voucherTemplate).exchangeDishTemplate?.image">
                        <img :src="getSelectedTemplate(item.voucherTemplate).exchangeDishTemplate.image.url"
                          class="img-thumbnail" style="max-width: 80px; max-height: 60px;">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 空狀態 -->
            <div v-else class="text-center text-muted py-4">
              <i class="bi bi-inbox display-6 d-block mb-2"></i>
              <p>尚未添加任何包裝項目</p>
              <button type="button" class="btn btn-outline-primary" @click="addBundleItem"
                :disabled="voucherTemplates.length === 0">
                <i class="bi bi-plus-circle me-1"></i>新增第一個項目
              </button>
            </div>
          </div>

          <!-- 提交按鈕 -->
          <div class="d-flex justify-content-end">
            <button type="button" class="btn btn-outline-secondary me-2" @click="resetForm">
              <i class="bi bi-arrow-clockwise me-1"></i>重置
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
              {{ isSubmitting ? '處理中...' : (isEditMode ? '更新商品' : '建立商品') }}
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
  description: '',
  image: null,
  sellingPoint: null,
  cashPrice: {
    original: null,
    selling: null
  },
  pointPrice: {
    original: null,
    selling: null
  },
  bundleItems: [],
  validFrom: null,
  validTo: null,
  voucherValidityDays: 30,
  isActive: true,
  autoStatusControl: false,
  purchaseLimitPerUser: null,
  stores: []
});

// 價格類型控制
const hasCashPrice = ref(false);
const hasPointPrice = ref(false);

// 圖片相關
const imagePreview = ref('');
const imageFile = ref(null);

// 錯誤訊息
const errors = reactive({});

// 狀態
const isSubmitting = ref(false);
const isLoadingTemplates = ref(false);
const successMessage = ref('');
const formErrors = ref([]);
const voucherTemplates = ref([]);

// 監聽價格類型變化
watch(hasCashPrice, (newVal) => {
  if (!newVal) {
    formData.cashPrice = { original: null, selling: null };
  }
});

watch(hasPointPrice, (newVal) => {
  if (!newVal) {
    formData.pointPrice = { original: null, selling: null };
  }
});

// 格式化價格
const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0';
};

// 獲取項目錯誤
const getItemError = (index, field) => {
  return errors[`bundleItems.${index}.${field}`];
};

// 獲取選定的模板
const getSelectedTemplate = (templateId) => {
  return voucherTemplates.value.find(template => template._id === templateId);
};

// 更新兌換券名稱
const updateVoucherName = (index) => {
  const template = getSelectedTemplate(formData.bundleItems[index].voucherTemplate);
  if (template) {
    formData.bundleItems[index].voucherName = template.name;
  }
};

// 處理圖片上傳
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 檢查檔案類型
  if (!file.type.startsWith('image/')) {
    alert('請選擇圖片檔案');
    return;
  }

  // 檢查檔案大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('圖片檔案不得超過 5MB');
    return;
  }

  imageFile.value = file;

  // 預覽圖片
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

// 移除圖片
const removeImage = () => {
  imageFile.value = null;
  imagePreview.value = '';
  formData.image = null;

  // 清除 file input
  const fileInput = document.getElementById('imageUpload');
  if (fileInput) {
    fileInput.value = '';
  }
};

// 新增包裝項目
const addBundleItem = () => {
  formData.bundleItems.push({
    voucherTemplate: '',
    quantity: 1,
    voucherName: ''
  });
};

// 移除包裝項目
const removeBundleItem = (index) => {
  formData.bundleItems.splice(index, 1);
};

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取商品資料
    fetchBundleData();
  } else {
    // 清空表單
    Object.assign(formData, {
      name: '',
      description: '',
      image: null,
      sellingPoint: null,
      cashPrice: { original: null, selling: null },
      pointPrice: { original: null, selling: null },
      bundleItems: [],
      validFrom: null,
      validTo: null,
      voucherValidityDays: 30,
      isActive: true,
      autoStatusControl: false,
      purchaseLimitPerUser: null,
      stores: []
    });

    hasCashPrice.value = false;
    hasPointPrice.value = false;
    removeImage();
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
    errors.name = '商品名稱為必填項';
    formErrors.value.push('商品名稱為必填項');
    isValid = false;
  } else if (formData.name.length > 100) {
    errors.name = '商品名稱不能超過 100 個字元';
    formErrors.value.push('商品名稱不能超過 100 個字元');
    isValid = false;
  }

  // 驗證描述
  if (!formData.description.trim()) {
    errors.description = '商品描述為必填項';
    formErrors.value.push('商品描述為必填項');
    isValid = false;
  }

  // 驗證價格設定
  if (!hasCashPrice.value && !hasPointPrice.value) {
    formErrors.value.push('請至少設定一種價格（現金或點數）');
    isValid = false;
  }

  if (hasCashPrice.value) {
    if (!formData.cashPrice.original || formData.cashPrice.original <= 0) {
      errors['cashPrice.original'] = '現金原價必須大於 0';
      formErrors.value.push('現金原價必須大於 0');
      isValid = false;
    }
    if (formData.cashPrice.selling && formData.cashPrice.selling >= formData.cashPrice.original) {
      formErrors.value.push('現金特價必須低於原價');
      isValid = false;
    }
  }

  if (hasPointPrice.value) {
    if (!formData.pointPrice.original || formData.pointPrice.original <= 0) {
      errors['pointPrice.original'] = '點數原價必須大於 0';
      formErrors.value.push('點數原價必須大於 0');
      isValid = false;
    }
    if (formData.pointPrice.selling && formData.pointPrice.selling >= formData.pointPrice.original) {
      formErrors.value.push('點數特價必須低於原價');
      isValid = false;
    }
  }

  // 驗證包裝項目
  if (formData.bundleItems.length === 0) {
    formErrors.value.push('請至少添加一個包裝項目');
    isValid = false;
  } else {
    formData.bundleItems.forEach((item, index) => {
      if (!item.voucherTemplate) {
        errors[`bundleItems.${index}.voucherTemplate`] = '請選擇兌換券模板';
        formErrors.value.push(`第 ${index + 1} 個項目未選擇兌換券模板`);
        isValid = false;
      }
      if (!item.quantity || item.quantity < 1) {
        errors[`bundleItems.${index}.quantity`] = '數量必須大於 0';
        formErrors.value.push(`第 ${index + 1} 個項目數量錯誤`);
        isValid = false;
      }
    });
  }

  // 驗證時間設定
  if (formData.autoStatusControl) {
    if (!formData.validFrom) {
      errors.validFrom = '請設定販售開始時間';
      formErrors.value.push('請設定販售開始時間');
      isValid = false;
    }
    if (!formData.validTo) {
      errors.validTo = '請設定販售結束時間';
      formErrors.value.push('請設定販售結束時間');
      isValid = false;
    }
    if (formData.validFrom && formData.validTo && new Date(formData.validFrom) >= new Date(formData.validTo)) {
      errors.validTo = '結束時間必須晚於開始時間';
      formErrors.value.push('販售結束時間必須晚於開始時間');
      isValid = false;
    }
    if (!formData.voucherValidityDays || formData.voucherValidityDays < 1) {
      errors.voucherValidityDays = '兌換券有效期必須大於 0';
      formErrors.value.push('兌換券有效期必須大於 0');
      isValid = false;
    }
  }

  return isValid;
};

// 獲取兌換券模板
const fetchVoucherTemplates = async () => {
  if (!brandId.value) return;

  isLoadingTemplates.value = true;

  try {
    const response = await api.promotion.getAvailableVoucherTemplates(brandId.value);
    if (response && response.templates) {
      voucherTemplates.value = response.templates;
    }
  } catch (error) {
    console.error('獲取兌換券模板失敗:', error);
    formErrors.value.push('無法獲取兌換券模板資料，請稍後再試');
  } finally {
    isLoadingTemplates.value = false;
  }
};

// 獲取包裝商品資料 (編輯模式)
const fetchBundleData = async () => {
  if (!isEditMode.value || !route.params.id) return;

  try {
    const response = await api.bundle.getBundleById({
      brandId: brandId.value,
      bundleId: route.params.id
    });

    if (response && response.bundle) {
      const bundle = response.bundle;

      // 填充表單資料
      Object.assign(formData, {
        name: bundle.name,
        description: bundle.description,
        image: bundle.image,
        sellingPoint: bundle.sellingPoint,
        cashPrice: bundle.cashPrice || { original: null, selling: null },
        pointPrice: bundle.pointPrice || { original: null, selling: null },
        bundleItems: bundle.bundleItems || [],
        validFrom: bundle.validFrom ? new Date(bundle.validFrom).toISOString().slice(0, 16) : null,
        validTo: bundle.validTo ? new Date(bundle.validTo).toISOString().slice(0, 16) : null,
        voucherValidityDays: bundle.voucherValidityDays || 30,
        isActive: bundle.isActive,
        autoStatusControl: bundle.autoStatusControl,
        purchaseLimitPerUser: bundle.purchaseLimitPerUser,
        stores: bundle.stores || []
      });

      // 設定價格類型
      hasCashPrice.value = !!(bundle.cashPrice && bundle.cashPrice.original);
      hasPointPrice.value = !!(bundle.pointPrice && bundle.pointPrice.original);

      // 設定圖片預覽
      if (bundle.image && bundle.image.url) {
        imagePreview.value = bundle.image.url;
      }
    } else {
      formErrors.value = ['獲取包裝商品資料失敗'];
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/bundles`);
      }, 2000);
    }
  } catch (error) {
    console.error('獲取包裝商品資料時發生錯誤:', error);
    formErrors.value = ['獲取包裝商品資料時發生錯誤，請稍後再試'];
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/bundles`);
    }, 2000);
  }
};

// 上傳圖片並轉換為 Base64
const convertImageToBase64 = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
    const submitData = { ...formData };

    // 處理價格資料
    if (!hasCashPrice.value) {
      submitData.cashPrice = null;
    }
    if (!hasPointPrice.value) {
      submitData.pointPrice = null;
    }

    // 處理圖片上傳
    if (imageFile.value) {
      submitData.imageData = await convertImageToBase64(imageFile.value);
    }

    let response;

    if (isEditMode.value) {
      // 更新包裝商品
      response = await api.bundle.updateBundle({
        brandId: brandId.value,
        bundleId: route.params.id,
        data: submitData
      });
      successMessage.value = '包裝商品更新成功！';
    } else {
      // 創建新包裝商品
      response = await api.bundle.createBundle({
        brandId: brandId.value,
        data: submitData
      });
      successMessage.value = '包裝商品創建成功！';
    }

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/bundles`);
    }, 1000);
  } catch (error) {
    console.error('儲存包裝商品時發生錯誤:', error);

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
      formErrors.value = ['儲存包裝商品時發生未知錯誤，請稍後再試'];
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    isSubmitting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 獲取兌換券模板
  fetchVoucherTemplates();

  // 如果是編輯模式，獲取包裝商品資料
  if (isEditMode.value) {
    fetchBundleData();
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
