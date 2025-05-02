<template>
  <div class="card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">{{ isEditMode ? '編輯餐點' : '新增餐點' }}</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="submitForm" novalidate>
        <!-- 基本資訊區塊 -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3">基本資訊</h6>

          <!-- 餐點名稱 -->
          <div class="mb-3">
            <label for="dishName" class="form-label required">餐點名稱</label>
            <input type="text" class="form-control" id="dishName" v-model="formData.name"
              :class="{ 'is-invalid': errors.name }" required />
            <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
            <div class="form-text">請輸入餐點名稱，不可超過50個字元</div>
          </div>

          <!-- 餐點價格 -->
          <div class="mb-3">
            <label for="dishPrice" class="form-label required">基本價格</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input type="number" class="form-control" id="dishPrice" v-model="formData.basePrice" min="0" step="1"
                :class="{ 'is-invalid': errors.basePrice }" required />
            </div>
            <div class="invalid-feedback" v-if="errors.basePrice">{{ errors.basePrice }}</div>
            <div class="form-text">請輸入餐點基本價格（不含選項價格）</div>
          </div>

          <!-- 餐點描述 -->
          <div class="mb-3">
            <label for="dishDescription" class="form-label">餐點描述</label>
            <textarea class="form-control" id="dishDescription" v-model="formData.description" rows="3"
              :class="{ 'is-invalid': errors.description }"></textarea>
            <div class="invalid-feedback" v-if="errors.description">{{ errors.description }}</div>
            <div class="form-text">簡短描述餐點的內容或特色，不超過200字</div>
          </div>

          <!-- 標籤 -->
          <div class="mb-3">
            <label for="dishTags" class="form-label">標籤</label>
            <div class="d-flex align-items-center mb-2">
              <input type="text" class="form-control" id="newTag" v-model="newTag" placeholder="新增標籤" />
              <button type="button" class="btn btn-outline-primary ms-2" @click="addTag" :disabled="!newTag.trim()">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
            <div class="d-flex flex-wrap">
              <span v-for="(tag, index) in formData.tags" :key="index" class="badge bg-info me-2 mb-2 p-2">
                {{ tag }}
                <button type="button" class="btn-close btn-close-white ms-1" style="font-size: 0.65rem;"
                  @click="removeTag(index)"></button>
              </span>
              <span v-if="formData.tags.length === 0" class="text-muted small">尚未添加標籤</span>
            </div>
            <div class="form-text">標籤可用於分類和搜尋餐點</div>
          </div>

          <!-- 餐點圖片 -->
          <div class="mb-3">
            <label for="dishImage" class="form-label required">餐點圖片</label>
            <div class="input-group">
              <input type="file" class="form-control" id="dishImage" ref="fileInputRef" @change="handleImageChange"
                :class="{ 'is-invalid': errors.image }" accept="image/*" />
              <button class="btn btn-outline-secondary" type="button" @click="clearImage"
                v-if="formData.newImage || (formData.image && formData.image.url)">
                清除
              </button>
            </div>
            <div class="text-danger" v-if="errors.image">{{ errors.image }}</div>
            <div class="form-text text-muted" v-else>
              <i class="bi bi-info-circle me-1"></i>
              請上傳餐點圖片，檔案大小限制為 1MB，支援 JPG、PNG 格式
            </div>

            <!-- 圖片預覽 -->
            <div class="mt-2" v-if="formData.newImage">
              <img :src="formData.newImage" alt="圖片預覽" class="img-thumbnail" style="max-height: 200px" />
            </div>
            <!-- 現有圖片 (編輯模式) -->
            <div class="mt-2" v-else-if="formData.image && formData.image.url">
              <div class="d-flex align-items-center">
                <img :src="formData.image.url" alt="現有圖片" class="img-thumbnail me-2" style="max-height: 200px" />
                <span class="text-muted">現有圖片</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 選項類別區塊 -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3 d-flex justify-content-between">
            <span>選項類別</span>
            <button type="button" class="btn btn-sm btn-outline-primary" @click="showAddOptionCategoryModal">
              <i class="bi bi-plus-circle me-1"></i>添加選項類別
            </button>
          </h6>

          <!-- 選項類別列表 -->
          <div class="table-responsive mb-3" v-if="formData.optionCategories.length > 0">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th width="5%">排序</th>
                  <th>選項類別</th>
                  <th>類型</th>
                  <th width="120px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(category, index) in formData.optionCategories" :key="index">
                  <td>
                    <div class="btn-group-vertical">
                      <button type="button" class="btn btn-sm btn-outline-secondary p-0 px-1"
                        @click="moveOptionCategory(index, -1)" :disabled="index === 0">
                        <i class="bi bi-chevron-up"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-outline-secondary p-0 px-1"
                        @click="moveOptionCategory(index, 1)"
                        :disabled="index === formData.optionCategories.length - 1">
                        <i class="bi bi-chevron-down"></i>
                      </button>
                    </div>
                  </td>
                  <td>
                    {{ getCategoryName(category.categoryId) }}
                  </td>
                  <td>
                    {{ getCategoryType(category.categoryId) }}
                  </td>
                  <td>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="removeOptionCategory(index)">
                      <i class="bi bi-trash me-1"></i>移除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 無選項類別提示 -->
          <div class="alert alert-light text-center py-3" v-else>
            <div class="text-muted">尚未添加選項類別</div>
            <button type="button" class="btn btn-sm btn-primary mt-2" @click="showAddOptionCategoryModal">
              <i class="bi bi-plus-circle me-1"></i>添加選項類別
            </button>
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
            <router-link :to="`/admin/${brandId}/dishes/template`" class="btn btn-secondary me-2"
              :disabled="isSubmitting">
              <i class="bi bi-x-circle me-1"></i>取消
            </router-link>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              <i v-else class="bi bi-save me-1"></i>
              {{ isSubmitting ? '處理中...' : (isEditMode ? '更新餐點' : '建立餐點') }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- 添加選項類別對話框 -->
    <div class="modal fade" id="addOptionCategoryModal" tabindex="-1" aria-labelledby="addOptionCategoryModalLabel"
      aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addOptionCategoryModalLabel">添加選項類別</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="categorySelect" class="form-label required">選擇選項類別</label>
              <select class="form-select" id="categorySelect" v-model="selectedCategoryId">
                <option value="">請選擇...</option>
                <option v-for="category in availableCategories" :key="category._id" :value="category._id">
                  {{ category.name }} ({{ category.inputType === 'single' ? '單選' : '多選' }})
                </option>
              </select>
              <div class="form-text" v-if="availableCategories.length === 0">
                沒有可用的選項類別，請先在選項類別管理頁面中創建
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="addOptionCategory" :disabled="!selectedCategoryId">
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Modal } from 'bootstrap';
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
  basePrice: 0,
  description: '',
  tags: [],
  image: null,   // 現有圖片（編輯模式）
  newImage: null, // 新上傳的圖片
  optionCategories: [], // [{categoryId, order}]
});

// 錯誤訊息
const errors = reactive({
  name: '',
  basePrice: '',
  description: '',
  image: '',
});

// 狀態
const isSubmitting = ref(false);
const successMessage = ref('');
const formErrors = ref([]);
const fileInputRef = ref(null);
const newTag = ref('');
const optionCategoryModal = ref(null);
const selectedCategoryId = ref('');
const availableCategories = ref([]);
const optionCategoryMap = ref({}); // 用於儲存類別ID到類別詳情的映射

// 添加標籤
const addTag = () => {
  const tag = newTag.value.trim();
  if (!tag) return;

  if (!formData.tags.includes(tag)) {
    formData.tags.push(tag);
  }

  newTag.value = '';
};

// 移除標籤
const removeTag = (index) => {
  formData.tags.splice(index, 1);
};

// 處理圖片上傳
const handleImageChange = (event) => {
  const file = event.target.files[0];

  if (!file) return;

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

  errors.image = '';

  // 直接轉換並儲存base64
  api.image.fileToBase64(file).then(base64 => {
    formData.newImage = base64; // 直接保存base64字符串
  });
};

// 清除圖片
const clearImage = () => {
  formData.newImage = null;

  // 清除檔案輸入框的值
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取餐點資料
    fetchDishData();
  } else {
    // 清空表單
    formData.name = '';
    formData.brand = brandId.value;
    formData.basePrice = 0;
    formData.description = '';
    formData.tags = [];
    formData.image = null;
    formData.optionCategories = [];
  }
  clearImage();
  newTag.value = '';

  // 清除錯誤
  errors.name = '';
  errors.basePrice = '';
  errors.description = '';
  errors.image = '';
  formErrors.value = [];
  successMessage.value = '';
};

// 驗證表單
const validateForm = () => {
  // 清除先前的錯誤
  errors.name = '';
  errors.basePrice = '';
  errors.description = '';
  formErrors.value = [];
  let isValid = true;

  // 驗證餐點名稱
  if (!formData.name.trim()) {
    errors.name = '餐點名稱為必填項';
    formErrors.value.push('餐點名稱為必填項');
    isValid = false;
  } else if (formData.name.length > 50) {
    errors.name = '餐點名稱不能超過 50 個字元';
    formErrors.value.push('餐點名稱不能超過 50 個字元');
    isValid = false;
  }

  // 驗證價格
  if (formData.basePrice === null || formData.basePrice === undefined || formData.basePrice === '') {
    errors.basePrice = '基本價格為必填項';
    formErrors.value.push('基本價格為必填項');
    isValid = false;
  } else if (isNaN(formData.basePrice) || formData.basePrice < 0) {
    errors.basePrice = '基本價格必須是非負數';
    formErrors.value.push('基本價格必須是非負數');
    isValid = false;
  }

  // 驗證描述
  if (formData.description && formData.description.length > 200) {
    errors.description = '餐點描述不能超過 200 個字元';
    formErrors.value.push('餐點描述不能超過 200 個字元');
    isValid = false;
  }

  // 驗證圖片
  if (errors.image) {
    formErrors.value.push(errors.image);
    isValid = false;
  } else if (!isEditMode.value && !formData.newImage && !formData.image) {
    errors.image = '請上傳餐點圖片';
    formErrors.value.push('請上傳餐點圖片');
    isValid = false;
  } else if (isEditMode.value && !formData.newImage && !formData.image) {
    errors.image = '請上傳餐點圖片';
    formErrors.value.push('請上傳餐點圖片');
    isValid = false;
  }

  return isValid;
};

// 獲取餐點數據 (編輯模式)
const fetchDishData = async () => {
  if (!isEditMode.value || !route.params.id) return;

  try {
    const response = await api.dish.getDishTemplateById(route.params.id, brandId.value);
    if (response && response.template) {
      const template = response.template;
      formData.name = template.name;
      formData.brand = template.brand;
      formData.basePrice = template.basePrice;
      formData.description = template.description || '';
      formData.tags = template.tags || [];
      formData.image = template.image;
      formData.optionCategories = template.optionCategories || [];
      formData._id = template._id;
    } else {
      // 顯示錯誤訊息
      formErrors.value = ['獲取餐點資料失敗'];
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/dishes/template`);
      }, 2000);
    }
  } catch (error) {
    console.error('獲取餐點資料時發生錯誤:', error);
    formErrors.value = ['獲取餐點資料時發生錯誤，請稍後再試'];
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/dishes/template`);
    }, 2000);
  }
};

// 加載選項類別
const fetchOptionCategories = async () => {
  try {
    const response = await api.dish.getAllOptionCategories(brandId.value);
    if (response && response.categories) {
      // 建立映射表
      const categories = response.categories;
      const map = {};
      categories.forEach(category => {
        map[category._id] = category;
      });
      optionCategoryMap.value = map;

      // 過濾掉已添加的類別
      updateAvailableCategories();
    }
  } catch (error) {
    console.error('獲取選項類別失敗:', error);
  }
};

// 更新可用的選項類別列表
const updateAvailableCategories = () => {
  const allCategories = Object.values(optionCategoryMap.value);
  const usedCategoryIds = formData.optionCategories.map(oc => oc.categoryId);

  availableCategories.value = allCategories.filter(category =>
    !usedCategoryIds.includes(category._id)
  );
};

// 顯示添加選項類別對話框
const showAddOptionCategoryModal = () => {
  // 更新可用類別列表
  updateAvailableCategories();

  // 重置選擇
  selectedCategoryId.value = '';

  // 顯示對話框
  optionCategoryModal.value.show();
};

// 添加選項類別
const addOptionCategory = () => {
  if (!selectedCategoryId.value) return;

  // 添加到選項類別列表
  formData.optionCategories.push({
    categoryId: selectedCategoryId.value,
    order: formData.optionCategories.length
  });

  // 更新可用列表
  updateAvailableCategories();

  // 關閉對話框
  optionCategoryModal.value.hide();
};

// 移除選項類別
const removeOptionCategory = (index) => {
  formData.optionCategories.splice(index, 1);

  // 重新排序
  formData.optionCategories.forEach((oc, idx) => {
    oc.order = idx;
  });

  // 更新可用列表
  updateAvailableCategories();
};

// 移動選項類別排序
const moveOptionCategory = (index, direction) => {
  const newIndex = index + direction;

  // 檢查邊界
  if (newIndex < 0 || newIndex >= formData.optionCategories.length) return;

  // 交換位置
  const temp = formData.optionCategories[index];
  formData.optionCategories[index] = formData.optionCategories[newIndex];
  formData.optionCategories[newIndex] = temp;

  // 更新排序值
  formData.optionCategories.forEach((oc, idx) => {
    oc.order = idx;
  });
};

// 獲取類別名稱
const getCategoryName = (categoryId) => {
  return optionCategoryMap.value[categoryId]?.name || '未知類別';
};

// 獲取類別類型
const getCategoryType = (categoryId) => {
  const type = optionCategoryMap.value[categoryId]?.inputType;
  return type === 'single' ? '單選' : type === 'multiple' ? '多選' : '未知';
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
      basePrice: Number(formData.basePrice),
      description: formData.description,
      tags: formData.tags,
      optionCategories: formData.optionCategories
    };

    // 直接使用已轉換的base64圖片，不需要再次轉換
    if (formData.newImage) {
      submitData.imageData = formData.newImage;
    }

    let response;

    if (isEditMode.value) {
      // 更新餐點
      response = await api.dish.updateDishTemplate(route.params.id, submitData);
      successMessage.value = '餐點更新成功！';
    } else {
      // 創建新餐點
      response = await api.dish.createDishTemplate(submitData);
      successMessage.value = '餐點創建成功！';
    }

    console.log(isEditMode.value ? '餐點更新成功:' : '餐點創建成功:', response);

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/dishes/template`);

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-dish-list'));
    }, 1000);
  } catch (error) {
    console.error('儲存餐點時發生錯誤:', error);

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
      formErrors.value = ['儲存餐點時發生未知錯誤，請稍後再試'];
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    isSubmitting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 初始化選項類別對話框
  const modalElement = document.getElementById('addOptionCategoryModal');
  if (modalElement) {
    optionCategoryModal.value = new Modal(modalElement);
  }

  // 加載選項類別
  fetchOptionCategories();

  // 如果是編輯模式，獲取餐點資料
  if (isEditMode.value) {
    fetchDishData();
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

/* 標籤樣式 */
.badge {
  font-size: 0.85rem;
}

/* 按鈕樣式 */
.btn-close {
  font-size: 10px;
}
</style>
