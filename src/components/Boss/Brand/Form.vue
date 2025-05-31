<template>
  <BCard>
    <BCardHeader class="bg-primary text-white">
      <h5 class="mb-0">{{ isEditMode ? '編輯品牌' : '新增品牌' }}</h5>
    </BCardHeader>
    <BCardBody>
      <BForm @submit.prevent="submitForm" novalidate>
        <!-- 品牌名稱 -->
        <BFormGroup label="品牌名稱" label-for="brandName" class="mb-3" :state="errors.name ? false : null">
          <template #label>
            <span class="required">品牌名稱</span>
          </template>
          <BFormInput id="brandName" v-model="formData.name" :state="errors.name ? false : null" required />
          <BFormInvalidFeedback :state="errors.name ? false : null">
            {{ errors.name }}
          </BFormInvalidFeedback>
          <BFormText>請輸入品牌名稱，不可超過50個字元</BFormText>
        </BFormGroup>

        <!-- 品牌描述 -->
        <BFormGroup label="品牌描述" label-for="description" class="mb-3" :state="errors.description ? false : null">
          <BFormTextarea id="description" v-model="formData.description" rows="3"
            :state="errors.description ? false : null" />
          <BFormInvalidFeedback :state="errors.description ? false : null">
            {{ errors.description }}
          </BFormInvalidFeedback>
          <BFormText>選填，最多500個字元</BFormText>
        </BFormGroup>

        <!-- 品牌啟用狀態 (僅在編輯模式顯示) -->
        <BFormGroup v-if="isEditMode" label="品牌狀態" class="mb-3">
          <BFormCheckbox v-model="formData.isActive" switch size="lg">
            {{ formData.isActive ? '啟用' : '停用' }}
          </BFormCheckbox>
          <BFormText>啟用狀態決定品牌是否可見</BFormText>
        </BFormGroup>

        <!-- 品牌圖片 -->
        <BFormGroup label="品牌圖片" label-for="brandImage" class="mb-3" :state="errors.image ? false : null">
          <template #label>
            <span class="required">品牌圖片</span>
          </template>
          <BInputGroup>
            <BFormFile id="brandImage" @change="handleImageChange" :state="errors.image ? false : null"
              accept="image/*" />
            <BButton variant="outline-secondary" @click="clearImage" v-if="imagePreview">
              清除
            </BButton>
          </BInputGroup>
          <BFormText v-if="!errors.image" class="text-muted">
            <i class="bi bi-info-circle me-1"></i>
            請上傳品牌圖片，檔案大小限制為 1MB，支援 JPG、PNG 格式
          </BFormText>
          <BFormInvalidFeedback :state="errors.image ? false : null">
            {{ errors.image }}
          </BFormInvalidFeedback>

          <!-- 圖片預覽 -->
          <div class="mt-2" v-if="imagePreview">
            <BImg :src="imagePreview" alt="圖片預覽" thumbnail fluid style="max-height: 200px" />
          </div>
          <!-- 現有圖片 (編輯模式) -->
          <div class="mt-2" v-else-if="formData.image && formData.image.url">
            <div class="d-flex align-items-center">
              <BImg :src="formData.image.url" alt="現有圖片" thumbnail fluid class="me-2" style="max-height: 200px" />
              <span class="text-muted">現有圖片</span>
            </div>
          </div>
        </BFormGroup>

        <!-- 表單驗證錯誤訊息 -->
        <BAlert variant="danger" show v-if="formErrors.length > 0">
          <p class="mb-1"><strong><i class="bi bi-exclamation-triangle-fill me-2"></i>請修正以下錯誤：</strong></p>
          <ul class="mb-0 ps-3">
            <li v-for="(error, index) in formErrors" :key="index">{{ error }}</li>
          </ul>
        </BAlert>

        <!-- 提交結果訊息 -->
        <BAlert variant="success" show dismissible v-if="successMessage">
          <i class="bi bi-check-circle-fill me-2"></i>{{ successMessage }}
        </BAlert>

        <!-- 按鈕組 -->
        <div class="d-flex justify-content-between">
          <!-- 左側 - 重置按鈕 -->
          <div>
            <BButton variant="secondary" @click="resetForm" :disabled="isSubmitting">
              重置
            </BButton>
          </div>

          <!-- 右側 - 取消和儲存按鈕 -->
          <div>
            <router-link :to="{ name: 'brand-list' }" class="btn btn-secondary me-2" :disabled="isSubmitting">
              取消
            </router-link>
            <BButton type="submit" variant="primary" :disabled="isSubmitting">
              <BSpinner v-if="isSubmitting" small class="me-1" />
              {{ isSubmitting ? '處理中...' : (isEditMode ? '更新品牌' : '儲存品牌') }}
            </BButton>
          </div>
        </div>
      </BForm>
    </BCardBody>
  </BCard>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api';
import {
  BCard, BCardHeader, BCardBody, BForm, BFormGroup, BFormInput,
  BFormTextarea, BFormCheckbox, BFormFile, BFormText, BFormInvalidFeedback,
  BButton, BAlert, BImg, BInputGroup, BSpinner
} from 'bootstrap-vue-next';

// 路由
const router = useRouter();
const route = useRoute();

// 判斷是否為編輯模式
const isEditMode = computed(() => !!route.params.id);

// 表單數據
const formData = reactive({
  name: '',
  description: '',
  image: null,
  isActive: true
});

// 錯誤訊息
const errors = reactive({
  name: '',
  description: '',
  image: ''
});

// 狀態
const isSubmitting = ref(false);
const imagePreview = ref('');
const successMessage = ref('');
const formErrors = ref([]);

// 處理圖片上傳
const handleImageChange = (event) => {
  const file = event.target.files[0];

  // 驗證文件
  if (!file) {
    return;
  }

  // 檢查檔案大小 (最大 1MB)
  if (file.size > 1 * 1024 * 1024) {
    errors.image = '圖片大小超過限制，請上傳不超過 1MB 的檔案';
    return;
  }

  // 檢查檔案類型
  if (!file.type.match('image.*')) {
    errors.image = '請上傳有效的圖片檔案（JPG、PNG 格式）';
    return;
  }

  // 儲存檔案並建立預覽
  formData.newImage = file;
  errors.image = '';

  // 使用 api.image.fileToBase64 來建立圖片預覽
  api.image.fileToBase64(file).then(base64 => {
    imagePreview.value = base64;
  });
};

// 清除圖片
const clearImage = () => {
  formData.newImage = null;
  imagePreview.value = '';
  // 清除檔案輸入框的值
  const fileInput = document.getElementById('brandImage');
  if (fileInput) {
    fileInput.value = '';
  }
};

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取品牌資料
    fetchBrandData();
  } else {
    // 清空表單
    formData.name = '';
    formData.description = '';
    formData.image = null;
    formData.isActive = true;
    clearImage();
  }

  // 清除錯誤
  errors.name = '';
  errors.description = '';
  errors.image = '';
  formErrors.value = [];
  successMessage.value = '';
};

// 驗證表單
const validateForm = () => {
  // 清除先前的錯誤
  errors.name = '';
  errors.description = '';
  errors.image = '';
  formErrors.value = [];
  let isValid = true;

  // 驗證品牌名稱
  if (!formData.name.trim()) {
    errors.name = '品牌名稱為必填項';
    formErrors.value.push('品牌名稱為必填項');
    isValid = false;
  } else if (formData.name.length > 50) {
    errors.name = '品牌名稱不能超過 50 個字元';
    formErrors.value.push('品牌名稱不能超過 50 個字元');
    isValid = false;
  }

  // 驗證品牌描述 (可選)
  if (formData.description && formData.description.length > 500) {
    errors.description = '品牌描述不能超過 500 個字元';
    formErrors.value.push('品牌描述不能超過 500 個字元');
    isValid = false;
  }

  // 驗證圖片 (新增模式必填，編輯模式若有現有圖片則可選)
  if (!isEditMode.value && !formData.newImage && !formData.image) {
    errors.image = '請上傳品牌圖片';
    formErrors.value.push('請上傳品牌圖片');
    isValid = false;
  } else if (isEditMode.value && !formData.newImage && !formData.image) {
    errors.image = '請上傳品牌圖片';
    formErrors.value.push('請上傳品牌圖片');
    isValid = false;
  }

  return isValid;
};

// 獲取品牌數據 (編輯模式)
const fetchBrandData = async () => {
  if (!isEditMode.value || !route.params.id) return;

  try {
    const response = await api.brand.getBrandById(route.params.id);
    if (response && response.brand) {
      const brand = response.brand;
      formData.name = brand.name;
      formData.description = brand.description || '';
      formData.image = brand.image;
      formData.isActive = brand.isActive !== undefined ? brand.isActive : true;
      formData._id = brand._id;
    } else {
      // 顯示錯誤訊息
      formErrors.value = ['獲取品牌資料失敗'];
      setTimeout(() => {
        router.push({ name: 'brand-list' });
      }, 2000);
    }
  } catch (error) {
    console.error('獲取品牌資料時發生錯誤:', error);
    formErrors.value = ['獲取品牌資料時發生錯誤，請稍後再試'];
    setTimeout(() => {
      router.push({ name: 'brand-list' });
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
      name: formData.name,
      description: formData.description || '',
      isActive: formData.isActive
    };

    // 如果有新上傳的圖片，處理圖片數據
    if (formData.newImage) {
      // 使用 fileToBase64 轉換圖片
      submitData.imageData = await api.image.fileToBase64(formData.newImage);
    }

    let response;

    if (isEditMode.value) {
      // 更新品牌
      response = await api.brand.updateBrand({
        id: route.params.id,
        data: submitData
      });
      successMessage.value = '品牌更新成功！';
    } else {
      // 創建新品牌
      response = await api.brand.createBrand(submitData);
      successMessage.value = '品牌創建成功！';
    }

    console.log(isEditMode.value ? '品牌更新成功:' : '品牌創建成功:', response);

    router.push({ name: 'brand-list' });
  } catch (error) {
    console.error('儲存品牌時發生錯誤:', error);

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
      formErrors.value = ['儲存品牌時發生未知錯誤，請稍後再試'];
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    isSubmitting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 如果是編輯模式，獲取品牌資料
  if (isEditMode.value) {
    fetchBrandData();
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

/* 提交按鈕效果 */
.btn-primary {
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0.25rem 0.5rem rgba(13, 110, 253, 0.3);
}
</style>
