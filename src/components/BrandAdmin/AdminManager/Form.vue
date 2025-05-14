<template>
  <div class="card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">{{ isEditMode ? '編輯管理員' : '新增管理員' }}</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="submitForm" novalidate>
        <!-- 基本資訊區塊 -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3">基本資訊</h6>

          <!-- 用戶名 -->
          <div class="mb-3">
            <label for="adminName" class="form-label required">用戶名</label>
            <input type="text" class="form-control" id="adminName" v-model="formData.name"
              :class="{ 'is-invalid': errors.name }" required :disabled="isEditMode" />
            <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
            <div class="form-text">{{ isEditMode ? '用戶名無法修改' : '請輸入唯一的用戶名，不可與其他管理員重複' }}</div>
          </div>

          <!-- 密碼 (只在新增模式顯示) -->
          <div class="mb-3" v-if="!isEditMode">
            <label for="adminPassword" class="form-label required">密碼</label>
            <input type="password" class="form-control" id="adminPassword" v-model="formData.password"
              :class="{ 'is-invalid': errors.password }" required />
            <div class="invalid-feedback" v-if="errors.password">{{ errors.password }}</div>
            <div class="form-text">密碼長度至少 6 個字元</div>
          </div>

          <!-- 角色 -->
          <div class="mb-3">
            <label for="adminRole" class="form-label required">角色</label>
            <select class="form-select" id="adminRole" v-model="formData.role" :class="{ 'is-invalid': errors.role }"
              required>
              <option value="">請選擇...</option>
              <option value="boss">總管理員</option>
              <option value="brand_admin">品牌管理員</option>
              <option value="store_admin">店鋪管理員</option>
            </select>
            <div class="invalid-feedback" v-if="errors.role">{{ errors.role }}</div>
            <div class="form-text">
              <strong>總管理員</strong>：擁有系統最高權限<br>
              <strong>品牌管理員</strong>：管理特定品牌及其店鋪<br>
              <strong>店鋪管理員</strong>：管理特定店鋪
            </div>
          </div>

          <!-- 所屬品牌 (品牌管理員和店鋪管理員需要) -->
          <div class="mb-3" v-if="formData.role === 'brand_admin' || formData.role === 'store_admin'">
            <label for="adminBrand" class="form-label required">所屬品牌</label>
            <select class="form-select" id="adminBrand" v-model="formData.brand" :class="{ 'is-invalid': errors.brand }"
              required>
              <option value="">請選擇...</option>
              <option v-for="brand in brands" :key="brand._id" :value="brand._id">
                {{ brand.name }}
              </option>
            </select>
            <div class="invalid-feedback" v-if="errors.brand">{{ errors.brand }}</div>
          </div>

          <!-- 啟用狀態 -->
          <div class="mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="formData.isActive" id="isActive">
              <label class="form-check-label" for="isActive">
                立即啟用
              </label>
            </div>
            <div class="form-text">啟用後管理員可以登入系統</div>
          </div>
        </div>

        <!-- 權限設定區塊 (只有店鋪管理員需要) -->
        <div class="mb-4" v-if="formData.role === 'store_admin' && stores.length > 0">
          <h6 class="border-bottom pb-2 mb-3 d-flex justify-content-between">
            <span>店鋪權限設定</span>
            <button type="button" class="btn btn-sm btn-outline-primary" @click="addManageItem">
              <i class="bi bi-plus-circle me-1"></i>新增店鋪
            </button>
          </h6>

          <!-- 店鋪權限列表 -->
          <div v-if="formData.manage.length > 0">
            <div v-for="(item, index) in formData.manage" :key="index" class="card mb-3">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-5 mb-3">
                    <label class="form-label required">店鋪</label>
                    <select v-model="item.store" class="form-select"
                      :class="{ 'is-invalid': getItemError(index, 'store') }">
                      <option value="">選擇店鋪</option>
                      <option v-for="store in stores" :key="store._id" :value="store._id"
                        :disabled="isStoreAlreadySelected(store._id, index)">
                        {{ store.name }}
                      </option>
                    </select>
                    <div class="invalid-feedback" v-if="getItemError(index, 'store')">{{ getItemError(index, 'store') }}
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label required">權限</label>
                    <div>
                      <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" :id="`order_system_${index}`"
                          v-model="item.permission" value="order_system">
                        <label class="form-check-label" :for="`order_system_${index}`">
                          點餐系統
                        </label>
                      </div>
                      <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" :id="`view_reports_${index}`"
                          v-model="item.permission" value="view_reports">
                        <label class="form-check-label" :for="`view_reports_${index}`">
                          查看報表
                        </label>
                      </div>
                      <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" :id="`edit_backend_${index}`"
                          v-model="item.permission" value="edit_backend">
                        <label class="form-check-label" :for="`edit_backend_${index}`">
                          編輯後台
                        </label>
                      </div>
                      <div class="form-check form-check-inline">
                        <!-- TODO: 目前權限邏輯尚未實作，暫時顯示所有權限選項。
                             未來應限制只有品牌管理員才能給予 manage_staff 權限 -->
                        <input class="form-check-input" type="checkbox" :id="`manage_staff_${index}`"
                          v-model="item.permission" value="manage_staff">
                        <label class="form-check-label" :for="`manage_staff_${index}`">
                          員工管理
                        </label>
                      </div>
                    </div>
                    <div class="form-text">
                      <small>
                        點餐系統：登入前台點餐系統、庫存管理<br>
                        查看報表：查看後台資料、記帳<br>
                        編輯後台：編輯後臺資料<br>
                        員工管理：員工權限管理
                      </small>
                    </div>
                    <div class="text-danger small mt-1" v-if="getItemError(index, 'permission')">
                      {{ getItemError(index, 'permission') }}
                    </div>
                  </div>
                  <div class="col-md-1 mb-3">
                    <label class="form-label">&nbsp;</label>
                    <button type="button" class="btn btn-outline-danger btn-sm d-block"
                      @click="removeManageItem(index)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 無權限設定提示 -->
          <div class="alert alert-light text-center py-3" v-else>
            <div class="text-muted">尚未設定任何店鋪權限</div>
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
            <router-link :to="`/admin/${brandId}/admins`" class="btn btn-secondary me-2" :disabled="isSubmitting">
              <i class="bi bi-x-circle me-1"></i>取消
            </router-link>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              <i v-else class="bi bi-save me-1"></i>
              {{ isSubmitting ? '處理中...' : (isEditMode ? '更新管理員' : '新增管理員') }}
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
  password: '',
  role: '',
  brand: '',
  manage: [],
  isActive: true
});

// 錯誤訊息
const errors = reactive({});

// 狀態
const isSubmitting = ref(false);
const successMessage = ref('');
const formErrors = ref([]);
const brands = ref([]);
const stores = ref([]);

// 獲取品項錯誤
const getItemError = (index, field) => {
  return errors[`manage.${index}.${field}`];
};

// 檢查店鋪是否已被選擇
const isStoreAlreadySelected = (storeId, currentIndex) => {
  return formData.manage.some((item, index) =>
    index !== currentIndex && item.store === storeId
  );
};

// 新增管理項目
const addManageItem = () => {
  formData.manage.push({
    store: '',
    permission: []
  });
};

// 移除管理項目
const removeManageItem = (index) => {
  formData.manage.splice(index, 1);
};

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取管理員資料
    fetchAdminData();
  } else {
    // 清空表單
    formData.name = '';
    formData.password = '';
    formData.role = '';
    formData.brand = '';
    formData.manage = [];
    formData.isActive = true;
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

  // 驗證用戶名
  if (!formData.name.trim()) {
    errors.name = '用戶名為必填項';
    formErrors.value.push('用戶名為必填項');
    isValid = false;
  }

  // 驗證密碼（新增模式）
  if (!isEditMode.value && !formData.password) {
    errors.password = '密碼為必填項';
    formErrors.value.push('密碼為必填項');
    isValid = false;
  } else if (!isEditMode.value && formData.password.length < 6) {
    errors.password = '密碼長度至少 6 個字元';
    formErrors.value.push('密碼長度至少 6 個字元');
    isValid = false;
  }

  // 驗證角色
  if (!formData.role) {
    errors.role = '請選擇角色';
    formErrors.value.push('請選擇角色');
    isValid = false;
  }

  // 驗證品牌（品牌管理員和店鋪管理員）
  if ((formData.role === 'brand_admin' || formData.role === 'store_admin') && !formData.brand) {
    errors.brand = '請選擇所屬品牌';
    formErrors.value.push('請選擇所屬品牌');
    isValid = false;
  }

  // 驗證店鋪權限（店鋪管理員）
  if (formData.role === 'store_admin') {
    formData.manage.forEach((item, index) => {
      if (!item.store) {
        errors[`manage.${index}.store`] = '請選擇店鋪';
        formErrors.value.push(`第 ${index + 1} 個權限設定未選擇店鋪`);
        isValid = false;
      }
      if (!item.permission || item.permission.length === 0) {
        errors[`manage.${index}.permission`] = '請至少選擇一個權限';
        formErrors.value.push(`第 ${index + 1} 個權限設定未選擇任何權限`);
        isValid = false;
      }
    });
  }

  return isValid;
};

// 獲取品牌列表
const fetchBrands = async () => {
  try {
    const response = await api.brand.getAllBrands();
    if (response && response.brands) {
      brands.value = response.brands;
    }
  } catch (error) {
    console.error('獲取品牌列表失敗:', error);
    formErrors.value.push('無法獲取品牌資料，請稍後再試');
  }
};

// 獲取店鋪列表
const fetchStores = async () => {
  if (!formData.brand) {
    stores.value = [];
    return;
  }

  try {
    const response = await api.store.getAllStores({ brandId: formData.brand });
    if (response && response.stores) {
      stores.value = response.stores;
    }
  } catch (error) {
    console.error('獲取店鋪列表失敗:', error);
    formErrors.value.push('無法獲取店鋪資料，請稍後再試');
  }
};

// 獲取管理員資料 (編輯模式)
const fetchAdminData = async () => {
  if (!isEditMode.value || !route.params.id) return;

  try {
    const response = await api.admin.getAdminById(route.params.id);

    if (response && response.admin) {
      const admin = response.admin;
      // 填充表單資料
      formData.name = admin.name;
      formData.role = admin.role;
      formData.brand = admin.brand?._id || '';
      formData.manage = admin.manage || [];
      formData.isActive = admin.isActive;
    } else {
      formErrors.value = ['獲取管理員資料失敗'];
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/admins`);
      }, 2000);
    }
  } catch (error) {
    console.error('獲取管理員資料時發生錯誤:', error);
    formErrors.value = ['獲取管理員資料時發生錯誤，請稍後再試'];
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/admins`);
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
      ...formData
    };

    // 根據角色處理資料
    if (submitData.role === 'boss') {
      delete submitData.brand;
      delete submitData.manage;
    } else if (submitData.role === 'brand_admin') {
      delete submitData.manage;
    }

    let response;

    if (isEditMode.value) {
      // 更新管理員
      // 編輯模式不包含密碼
      delete submitData.password;
      response = await api.admin.updateAdmin({
        id: route.params.id,
        data: submitData
      });
      successMessage.value = '管理員更新成功！';
    } else {
      // 創建新管理員
      response = await api.admin.createAdmin({
        brandId: brandId.value,
        data: submitData
      });
      successMessage.value = '管理員創建成功！';
    }

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/admins`);
    }, 1000);
  } catch (error) {
    console.error('儲存管理員時發生錯誤:', error);

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
      formErrors.value = ['儲存管理員時發生未知錯誤，請稍後再試'];
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    isSubmitting.value = false;
  }
};

// 監聽角色變化
watch(() => formData.role, (newRole) => {
  // 清除品牌和管理設定
  if (newRole === 'boss') {
    formData.brand = '';
    formData.manage = [];
  } else if (newRole === 'brand_admin') {
    formData.manage = [];
  }
});

// 監聽品牌變化
watch(() => formData.brand, () => {
  // 當品牌改變時，重新獲取店鋪列表
  fetchStores();
  // 清除現有的店鋪選擇
  formData.manage.forEach(item => {
    item.store = '';
  });
});

// 生命週期鉤子
onMounted(() => {
  // 獲取品牌列表
  fetchBrands();

  // 如果是編輯模式，獲取管理員資料
  if (isEditMode.value) {
    fetchAdminData();
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

.form-check-inline {
  margin-right: 1rem;
}
</style>
