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
            <div class="form-text">密碼長度至少 8 個字元</div>
          </div>

          <!-- 角色 -->
          <div class="mb-3">
            <label for="adminRole" class="form-label required">角色</label>
            <select class="form-select" id="adminRole" v-model="formData.role" :class="{ 'is-invalid': errors.role }"
              required>
              <option value="">請選擇...</option>
              <option v-for="role in availableRoles" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
            <div class="invalid-feedback" v-if="errors.role">{{ errors.role }}</div>
            <div class="form-text">
              <div v-for="role in availableRoles" :key="role.value" v-show="formData.role === role.value">
                <strong>{{ role.label }}：</strong>{{ role.description }}
              </div>
            </div>
          </div>

          <!-- 所屬店鋪 (根據角色顯示) -->
          <div class="mb-3" v-if="needsStore">
            <label for="adminStore" class="form-label required">所屬店鋪</label>
            <select class="form-select" id="adminStore" v-model="formData.store" :class="{ 'is-invalid': errors.store }"
              required>
              <option value="">請選擇...</option>
              <option v-for="store in stores" :key="store._id" :value="store._id">
                {{ store.name }}
              </option>
            </select>
            <div class="invalid-feedback" v-if="errors.store">{{ errors.store }}</div>
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

        <!-- 角色說明區塊 -->
        <div class="mb-4" v-if="formData.role">
          <h6 class="border-bottom pb-2 mb-3">角色權限說明</h6>
          <div class="alert alert-info">
            <h6 class="alert-heading">{{ getRoleLabel(formData.role) }}</h6>
            <p class="mb-2">{{ getRoleDescription(formData.role) }}</p>
            <hr>
            <div class="mb-0">
              <strong>權限範圍：</strong>{{ getRoleScope(formData.role) }}<br>
              <strong>管理層級：</strong>{{ getRoleLevel(formData.role) }}
            </div>
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
            <router-link :to="`/admin/${brandId}/store-admins`" class="btn btn-secondary me-2" :disabled="isSubmitting">
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

// 角色定義
const roleDefinitions = {
  'primary_system_admin': {
    label: '系統主管理員',
    description: '擁有系統最高權限，可管理所有品牌和店鋪',
    scope: '全系統',
    level: '最高級',
    needsBrand: false,
    needsStore: false
  },
  'system_admin': {
    label: '系統管理員',
    description: '系統級管理權限，可管理品牌和店鋪（不包含管理員管理）',
    scope: '全系統',
    level: '高級',
    needsBrand: false,
    needsStore: false
  },
  'primary_brand_admin': {
    label: '品牌主管理員',
    description: '品牌主管理員，可管理品牌下所有店鋪和管理員',
    scope: '品牌級',
    level: '中高級',
    needsBrand: true,
    needsStore: false
  },
  'brand_admin': {
    label: '品牌管理員',
    description: '品牌管理權限，可管理品牌設定和店鋪（不包含管理員管理）',
    scope: '品牌級',
    level: '中級',
    needsBrand: true,
    needsStore: false
  },
  'primary_store_admin': {
    label: '店鋪主管理員',
    description: '店鋪主管理員，可管理店鋪所有功能和員工',
    scope: '店鋪級',
    level: '中級',
    needsBrand: true,
    needsStore: true
  },
  'store_admin': {
    label: '店鋪管理員',
    description: '店鋪管理權限，可管理店鋪營運（不包含員工管理）',
    scope: '店鋪級',
    level: '基礎',
    needsBrand: true,
    needsStore: true
  },
  'employee': {
    label: '員工',
    description: '基礎員工權限，可使用點餐系統和基本庫存管理',
    scope: '店鋪級',
    level: '基礎',
    needsBrand: true,
    needsStore: true
  }
};

// 表單數據
const formData = reactive({
  name: '',
  password: '',
  role: '',
  brand: '',
  store: '',
  isActive: true
});

// 錯誤訊息
const errors = reactive({});

// 狀態
const isSubmitting = ref(false);
const successMessage = ref('');
const formErrors = ref([]);
const stores = ref([]);
const currentUserRole = ref('');
const availableRoles = ref([]);

// 計算屬性
const needsBrand = computed(() => {
  return roleDefinitions[formData.role]?.needsBrand || false;
});

const needsStore = computed(() => {
  return roleDefinitions[formData.role]?.needsStore || false;
});

// 角色相關方法
const getRoleLabel = (role) => {
  return roleDefinitions[role]?.label || role;
};

const getRoleDescription = (role) => {
  return roleDefinitions[role]?.description || '';
};

const getRoleScope = (role) => {
  return roleDefinitions[role]?.scope || '';
};

const getRoleLevel = (role) => {
  return roleDefinitions[role]?.level || '';
};

// 獲取可用角色列表（基於當前用戶權限）
const getAvailableRoles = async () => {
  try {
    const response = await api.adminAuth.checkStatus();
    if (response.loggedIn) {
      currentUserRole.value = response.role;

      // 角色管理權限矩陣 - 與後端保持一致
      const roleManagementMatrix = {
        'primary_system_admin': [
          'primary_system_admin', 'system_admin', 'primary_brand_admin',
          'brand_admin', 'primary_store_admin', 'store_admin', 'employee'
        ],
        'system_admin': [
          'primary_brand_admin', 'brand_admin', 'primary_store_admin',
          'store_admin', 'employee'
        ],
        'primary_brand_admin': [
          'brand_admin', 'primary_store_admin', 'store_admin', 'employee'
        ],
        'brand_admin': ['primary_store_admin', 'store_admin', 'employee'], // 更新：brand_admin 現在可以管理店鋪級角色
        'primary_store_admin': ['store_admin', 'employee'],
        'store_admin': [],
        'employee': []
      };

      // 根據當前用戶角色獲取可創建的角色
      const userCanCreate = roleManagementMatrix[response.role] || [];

      availableRoles.value = userCanCreate.map(role => ({
        value: role,
        label: roleDefinitions[role].label,
        description: roleDefinitions[role].description
      }));
    }
  } catch (error) {
    console.error('獲取用戶權限失敗:', error);
  }
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
    formData.brand = brandId.value; // 自動設定為當前品牌
    formData.store = '';
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
  } else if (!isEditMode.value && formData.password.length < 8) {
    errors.password = '密碼長度至少需要8個字元';
    formErrors.value.push('密碼長度至少需要8個字元');
    isValid = false;
  }

  // 驗證角色
  if (!formData.role) {
    errors.role = '請選擇角色';
    formErrors.value.push('請選擇角色');
    isValid = false;
  }

  // 驗證店鋪（需要店鋪的角色）
  if (needsStore.value && !formData.store) {
    errors.store = '請選擇所屬店鋪';
    formErrors.value.push('請選擇所屬店鋪');
    isValid = false;
  }

  return isValid;
};

// 獲取店鋪列表
const fetchStores = async () => {
  if (!brandId.value) {
    stores.value = [];
    return;
  }

  try {
    const response = await api.store.getAllStores({ brandId: brandId.value });
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
      formData.brand = admin.brand?._id || brandId.value; // 如果沒有品牌則使用當前品牌
      formData.store = admin.store?._id || '';
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

    // 確保品牌設定為當前品牌ID（針對需要品牌的角色）
    if (needsBrand.value) {
      submitData.brand = brandId.value;
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
      router.push(`/admin/${brandId.value}/store-admins`);
    }, 500);
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
  // 清除不需要的欄位
  if (!roleDefinitions[newRole]?.needsBrand) {
    formData.brand = '';
  } else {
    // 自動設定品牌為當前品牌
    formData.brand = brandId.value;
  }
  if (!roleDefinitions[newRole]?.needsStore) {
    formData.store = '';
  }
});

// 生命週期鉤子
onMounted(() => {
  // 自動設定品牌為當前品牌
  formData.brand = brandId.value;

  // 獲取可用角色
  getAvailableRoles();

  // 獲取店鋪列表
  fetchStores();

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

.alert-heading {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
</style>
