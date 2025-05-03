<template>
  <div class="card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">{{ isEditMode ? '編輯選項類別' : '新增選項類別' }}</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="submitForm" novalidate>
        <!-- 基本資訊區塊 -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3">基本資訊</h6>

          <!-- 類別名稱 -->
          <div class="mb-3">
            <label for="categoryName" class="form-label required">類別名稱</label>
            <input type="text" class="form-control" id="categoryName" v-model="formData.name"
              :class="{ 'is-invalid': errors.name }" required />
            <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
            <div class="form-text">請輸入選項類別名稱，例如：「尺寸」、「甜度」、「配料」等</div>
          </div>

          <!-- 輸入類型 -->
          <div class="mb-3">
            <label for="inputType" class="form-label required">輸入類型</label>
            <select class="form-select" id="inputType" v-model="formData.inputType"
              :class="{ 'is-invalid': errors.inputType }" required>
              <option value="">請選擇...</option>
              <option value="single">單選</option>
              <option value="multiple">多選</option>
            </select>
            <div class="invalid-feedback" v-if="errors.inputType">{{ errors.inputType }}</div>
            <div class="form-text">
              <strong>單選</strong>：顧客只能選擇一個選項（例如：飲料尺寸）<br>
              <strong>多選</strong>：顧客可以選擇多個選項（例如：加料）
            </div>
          </div>
        </div>

        <!-- 選項管理區塊 -->
        <div class="mb-4" v-if="isEditMode">
          <h6 class="border-bottom pb-2 mb-3 d-flex justify-content-between">
            <span>選項管理</span>
            <button type="button" class="btn btn-sm btn-outline-primary" @click="showAddOptionModal">
              <i class="bi bi-plus-circle me-1"></i>添加選項
            </button>
          </h6>

          <!-- 選項列表 -->
          <div class="table-responsive mb-3" v-if="formData.options && formData.options.length > 0">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th width="5%">排序</th>
                  <th>選項名稱</th>
                  <th>價格</th>
                  <th>關聯餐點</th>
                  <th width="120px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(option, index) in sortedOptions" :key="option.refOption">
                  <td>
                    <div class="btn-group-vertical">
                      <button type="button" class="btn btn-sm btn-outline-secondary p-0 px-1"
                        @click="moveOption(option, -1)" :disabled="index === 0">
                        <i class="bi bi-chevron-up"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-outline-secondary p-0 px-1"
                        @click="moveOption(option, 1)" :disabled="index === sortedOptions.length - 1">
                        <i class="bi bi-chevron-down"></i>
                      </button>
                    </div>
                  </td>
                  <td>{{ getOptionName(option.refOption) }}</td>
                  <td>{{ formatPrice(getOptionPrice(option.refOption)) }}</td>
                  <td>{{ getRefDishName(option.refOption) }}</td>
                  <td>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="removeOption(option)">
                      <i class="bi bi-trash me-1"></i>移除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 無選項提示 -->
          <div class="alert alert-light text-center py-3" v-else>
            <div class="text-muted">尚未添加任何選項</div>
            <button type="button" class="btn btn-sm btn-primary mt-2" @click="showAddOptionModal">
              <i class="bi bi-plus-circle me-1"></i>添加選項
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
            <router-link :to="`/admin/${brandId}/option-categories`" class="btn btn-secondary me-2"
              :disabled="isSubmitting">
              <i class="bi bi-x-circle me-1"></i>取消
            </router-link>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              <i v-else class="bi bi-save me-1"></i>
              {{ isSubmitting ? '處理中...' : (isEditMode ? '更新選項類別' : '建立選項類別') }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- 添加選項對話框 -->
    <div class="modal fade" id="addOptionModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">添加選項</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="optionSelect" class="form-label required">選擇選項</label>
              <select class="form-select" id="optionSelect" v-model="selectedOptionId">
                <option value="">請選擇...</option>
                <option v-for="option in availableOptions" :key="option._id" :value="option._id">
                  {{ option.name }} ({{ option.price > 0 ? '+$' + option.price : '免費' }})
                </option>
              </select>
              <div class="form-text" v-if="availableOptions.length === 0">
                沒有可用的選項，請先在選項管理頁面中創建
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="addOption" :disabled="!selectedOptionId">
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
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
  inputType: '',
  options: []
});

// 錯誤訊息
const errors = reactive({
  name: '',
  inputType: ''
});

// 狀態
const isSubmitting = ref(false);
const successMessage = ref('');
const formErrors = ref([]);
const optionModal = ref(null);
const selectedOptionId = ref('');
const availableOptions = ref([]);
const allOptions = ref([]);

// 計算已排序的選項列表
const sortedOptions = computed(() => {
  return [...formData.options].sort((a, b) => a.order - b.order);
});

// 格式化價格
const formatPrice = (price) => {
  if (price === 0) return '免費';
  return '$' + price.toLocaleString('zh-TW');
};

// 獲取選項名稱
const getOptionName = (optionId) => {
  const option = allOptions.value.find(opt => opt._id === optionId);
  return option ? option.name : '未知選項';
};

// 獲取選項價格
const getOptionPrice = (optionId) => {
  const option = allOptions.value.find(opt => opt._id === optionId);
  return option ? option.price : 0;
};

// 獲取關聯餐點名稱
const getRefDishName = (optionId) => {
  const option = allOptions.value.find(opt => opt._id === optionId);
  return option && option.refDishTemplate ? option.refDishTemplate.name : '無';
};

// 顯示添加選項對話框
const showAddOptionModal = () => {
  updateAvailableOptions();
  selectedOptionId.value = '';
  optionModal.value.show();
};

// 更新可用選項列表
const updateAvailableOptions = () => {
  const usedOptionIds = formData.options.map(opt => opt.refOption);
  availableOptions.value = allOptions.value.filter(
    option => !usedOptionIds.includes(option._id)
  );
};

// 添加選項
const addOption = () => {
  if (!selectedOptionId.value) return;

  // 添加到選項列表
  formData.options.push({
    refOption: selectedOptionId.value,
    order: formData.options.length
  });

  // 更新可用列表
  updateAvailableOptions();

  // 關閉對話框
  optionModal.value.hide();
};

// 移除選項
const removeOption = (option) => {
  formData.options = formData.options.filter(opt => opt.refOption !== option.refOption);

  // 重新排序
  formData.options.forEach((opt, idx) => {
    opt.order = idx;
  });

  // 更新可用列表
  updateAvailableOptions();
};

// 移動選項排序
const moveOption = (option, direction) => {
  const currentIndex = formData.options.findIndex(opt => opt.refOption === option.refOption);
  const newIndex = currentIndex + direction;

  // 檢查邊界
  if (newIndex < 0 || newIndex >= formData.options.length) return;

  // 更新排序值
  const targetOption = formData.options[newIndex];
  const currentOrder = option.order;

  option.order = targetOption.order;
  targetOption.order = currentOrder;

  // 重新排序
  formData.options.sort((a, b) => a.order - b.order);
};

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取選項類別資料
    fetchCategoryData();
  } else {
    // 清空表單
    formData.name = '';
    formData.brand = brandId.value;
    formData.inputType = '';
    formData.options = [];
  }

  // 清除錯誤
  errors.name = '';
  errors.inputType = '';
  formErrors.value = [];
  successMessage.value = '';
};

// 驗證表單
const validateForm = () => {
  // 清除先前的錯誤
  errors.name = '';
  errors.inputType = '';
  formErrors.value = [];
  let isValid = true;

  // 驗證類別名稱
  if (!formData.name.trim()) {
    errors.name = '類別名稱為必填項';
    formErrors.value.push('類別名稱為必填項');
    isValid = false;
  } else if (formData.name.length > 50) {
    errors.name = '類別名稱不能超過 50 個字元';
    formErrors.value.push('類別名稱不能超過 50 個字元');
    isValid = false;
  }

  // 驗證輸入類型
  if (!formData.inputType) {
    errors.inputType = '請選擇輸入類型';
    formErrors.value.push('請選擇輸入類型');
    isValid = false;
  }

  return isValid;
};

// 獲取選項類別數據 (編輯模式)
const fetchCategoryData = async () => {
  if (!isEditMode.value || !route.params.id) return;

  try {
    const response = await api.dish.getOptionCategoryById(route.params.id, brandId.value, true);
    if (response && response.category) {
      const category = response.category;
      formData.name = category.name;
      formData.brand = category.brand;
      formData.inputType = category.inputType;
      formData.options = category.options || [];
      formData._id = category._id;
    } else {
      // 顯示錯誤訊息
      formErrors.value = ['獲取選項類別資料失敗'];
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/option-categories`);
      }, 2000);
    }
  } catch (error) {
    console.error('獲取選項類別資料時發生錯誤:', error);
    formErrors.value = ['獲取選項類別資料時發生錯誤，請稍後再試'];
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/option-categories`);
    }, 2000);
  }
};

// 獲取所有選項
const fetchAllOptions = async () => {
  try {
    const response = await api.dish.getAllOptions(brandId.value);
    if (response && response.options) {
      allOptions.value = response.options;
      updateAvailableOptions();
    }
  } catch (error) {
    console.error('獲取選項列表失敗:', error);
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
      inputType: formData.inputType,
    };

    // 只有在編輯模式下才提交選項列表
    if (isEditMode.value) {
      submitData.options = formData.options;
    }

    let response;

    if (isEditMode.value) {
      // 更新選項類別
      response = await api.dish.updateOptionCategory(route.params.id, submitData);
      successMessage.value = '選項類別更新成功！';
    } else {
      // 創建新選項類別
      response = await api.dish.createOptionCategory(submitData);
      successMessage.value = '選項類別創建成功！';
    }

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/option-categories`);

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-category-list'));
    }, 1500);
  } catch (error) {
    console.error('儲存選項類別時發生錯誤:', error);

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
      formErrors.value = ['儲存選項類別時發生未知錯誤，請稍後再試'];
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    isSubmitting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 初始化選項對話框
  const modalElement = document.getElementById('addOptionModal');
  if (modalElement) {
    optionModal.value = new Modal(modalElement);
  }

  // 獲取所有選項
  fetchAllOptions();

  // 如果是編輯模式，獲取選項類別資料
  if (isEditMode.value) {
    fetchCategoryData();
  }
});
</script>

<style scoped>
/* 必填欄位標記 */
.required::after {
  content: " *";
  color: #dc3545;
}

/* 表格樣式 */
.table th,
.table td {
  vertical-align: middle;
}

/* 按鈕樣式 */
.btn-group-vertical .btn {
  padding: 0.25rem 0.5rem;
}
</style>
