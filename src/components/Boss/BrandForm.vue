<template>
  <div class="card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">新增品牌</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="submitForm">
        <!-- 品牌名稱 -->
        <div class="mb-3">
          <label for="brandName" class="form-label">品牌名稱</label>
          <input type="text" class="form-control" id="brandName" v-model="formData.name"
            :class="{ 'is-invalid': errors.name }" required />
          <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
        </div>

        <!-- 品牌描述 -->
        <div class="mb-3">
          <label for="description" class="form-label">品牌描述</label>
          <textarea class="form-control" id="description" v-model="formData.description" rows="3"
            :class="{ 'is-invalid': errors.description }"></textarea>
          <div class="invalid-feedback" v-if="errors.description">{{ errors.description }}</div>
        </div>

        <!-- 品牌圖片 -->
        <div class="mb-3">
          <label for="brandImage" class="form-label">品牌圖片</label>
          <div class="input-group">
            <input type="file" class="form-control" id="brandImage" @change="handleImageChange"
              :class="{ 'is-invalid': errors.image }" accept="image/*" />
            <button class="btn btn-outline-secondary" type="button" @click="clearImage" v-if="imagePreview">
              清除
            </button>
          </div>
          <div class="invalid-feedback" v-if="errors.image">{{ errors.image }}</div>

          <!-- 圖片預覽 -->
          <div class="mt-2" v-if="imagePreview">
            <img :src="imagePreview" alt="圖片預覽" class="img-thumbnail" style="max-height: 200px" />
          </div>
        </div>

        <!-- 提交按鈕 -->
        <div class="d-grid gap-2 d-md-flex justify-content-md-end">
          <button type="button" class="btn btn-secondary me-md-2" @click="resetForm" :disabled="isSubmitting">
            重置
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"
              aria-hidden="true"></span>
            {{ isSubmitting ? '處理中...' : '儲存品牌' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, defineEmits } from 'vue';
import api from '@/api';

// 定義事件
const emit = defineEmits(['brand-created']);

// 表單數據
const formData = reactive({
  name: '',
  description: '',
  image: null
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

// 處理圖片上傳
const handleImageChange = (event) => {
  const file = event.target.files[0];

  // 驗證文件
  if (!file) {
    return;
  }

  // 檢查檔案大小 (最大 2MB)
  if (file.size > 1 * 1024 * 1024) {
    errors.image = '圖片大小不能超過 1MB';
    return;
  }

  // 檢查檔案類型
  if (!file.type.match('image.*')) {
    errors.image = '請上傳有效的圖片檔案';
    return;
  }

  // 儲存檔案並建立預覽
  formData.image = file;
  errors.image = '';

  // 建立圖片預覽
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

// 清除圖片
const clearImage = () => {
  formData.image = null;
  imagePreview.value = '';
  // 清除檔案輸入框的值
  const fileInput = document.getElementById('brandImage');
  if (fileInput) {
    fileInput.value = '';
  }
};

// 重置表單
const resetForm = () => {
  formData.name = '';
  formData.description = '';
  clearImage();

  // 清除錯誤
  errors.name = '';
  errors.description = '';
  errors.image = '';
};

// 驗證表單
const validateForm = () => {
  let isValid = true;

  // 驗證品牌名稱
  if (!formData.name.trim()) {
    errors.name = '品牌名稱為必填項';
    isValid = false;
  } else if (formData.name.length > 50) {
    errors.name = '品牌名稱不能超過 50 個字元';
    isValid = false;
  } else {
    errors.name = '';
  }

  // 驗證品牌描述 (可選)
  if (formData.description && formData.description.length > 500) {
    errors.description = '品牌描述不能超過 500 個字元';
    isValid = false;
  } else {
    errors.description = '';
  }

  // 驗證圖片 (必填)
  if (!formData.image) {
    errors.image = '請上傳品牌圖片';
    isValid = false;
  }

  return isValid;
};

// 提交表單
const submitForm = async () => {
  // 驗證表單
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    // 使用 FormData 來處理檔案上傳
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);

    if (formData.description) {
      formDataToSend.append('description', formData.description);
    }

    if (formData.image) {
      formDataToSend.append('image', formData.image);

      // 轉換圖片為Base64用於API
      const reader = new FileReader();
      reader.readAsDataURL(formData.image);
      reader.onload = async () => {
        const imageData = reader.result.split(',')[1]; // 去除 data:image/x;base64, 前綴

        // 實際呼叫 API
        const response = await api.brand.createBrand({
          name: formData.name,
          description: formData.description || '',
          imageData: imageData
        });
        console.log('品牌創建成功:', response);

        // 顯示成功訊息
        alert('品牌創建成功！');

        // 重置表單
        resetForm();

        // 觸發事件通知父組件
        emit('brand-created');
      };
      return;
    }

    // 如果沒有圖片，直接呼叫API (不應該發生，因為我們要求圖片必填)
    const response = await api.brand.createBrand({
      name: formData.name,
      description: formData.description || '',
    });
    console.log('品牌創建成功:', response);

    // 顯示成功訊息
    alert('品牌創建成功！');

    // 重置表單
    resetForm();

    // 觸發事件通知父組件
    emit('brand-created');

  } catch (error) {
    console.error('建立品牌時發生錯誤:', error);

    // 處理 API 錯誤
    if (error.response && error.response.data) {
      const { message, errors: apiErrors } = error.response.data;

      if (apiErrors) {
        // 處理特定欄位錯誤
        Object.keys(apiErrors).forEach(key => {
          errors[key] = apiErrors[key];
        });
      } else if (message) {
        // 顯示一般錯誤訊息
        alert(`錯誤: ${message}`);
      }
    } else {
      alert('建立品牌時發生未知錯誤，請稍後再試');
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
/* 可以新增自定義樣式 */
</style>
