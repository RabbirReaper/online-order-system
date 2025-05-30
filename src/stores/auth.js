import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api';

export const useAdminAuthStore = defineStore('adminAuth', () => {
  // 狀態 (ref)
  const admin = ref(null);
  const isLoggedIn = ref(false);
  const loadingAuth = ref(false);
  const error = ref(null);
  const role = ref(null);
  const brand = ref(null);
  const store = ref(null);

  // 計算屬性 (computed)
  const adminName = computed(() => {
    return admin.value?.name || '訪客';
  });

  const adminIsLoggedIn = computed(() => {
    return isLoggedIn.value;
  });

  const currentRole = computed(() => {
    return role.value;
  });

  const currentBrand = computed(() => {
    return brand.value;
  });

  const currentStore = computed(() => {
    return store.value;
  });

  const roleLabel = computed(() => {
    const roleLabels = {
      'primary_system_admin': '系統主管理員',
      'system_admin': '系統管理員',
      'primary_brand_admin': '品牌主管理員',
      'brand_admin': '品牌管理員',
      'primary_store_admin': '店鋪主管理員',
      'store_admin': '店鋪管理員',
      'employee': '員工'
    };
    return roleLabels[role.value] || role.value;
  });

  const canManageSystem = computed(() => {
    return ['primary_system_admin', 'system_admin'].includes(role.value);
  });

  const canManageBrand = computed(() => {
    return [
      'primary_system_admin',
      'system_admin',
      'primary_brand_admin',
      'brand_admin'
    ].includes(role.value);
  });

  const canManageStore = computed(() => {
    return [
      'primary_system_admin',
      'system_admin',
      'primary_brand_admin',
      'brand_admin',
      'primary_store_admin',
      'store_admin'
    ].includes(role.value);
  });

  const isPrimaryRole = computed(() => {
    return role.value?.startsWith('primary_') || false;
  });

  // 方法 (actions)

  // 管理員登入
  async function login(credentials) {
    loadingAuth.value = true;
    error.value = null;

    try {
      const response = await api.adminAuth.login(credentials);

      if (response.success) {
        // 設置管理員資訊
        isLoggedIn.value = true;
        role.value = response.role;
        brand.value = response.brand;
        store.value = response.store;

        return response;
      } else {
        throw new Error(response.message || '登入失敗');
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || '登入失敗，請檢查您的帳號和密碼';
      throw err;
    } finally {
      loadingAuth.value = false;
    }
  }

  // 管理員登出
  async function logout() {
    loadingAuth.value = true;
    error.value = null;

    try {
      await api.adminAuth.logout();

      // 清除本地狀態
      admin.value = null;
      isLoggedIn.value = false;
      role.value = null;
      brand.value = null;
      store.value = null;

      return { success: true };
    } catch (err) {
      error.value = err.response?.data?.message || '登出失敗，請稍後再試';
      throw err;
    } finally {
      loadingAuth.value = false;
    }
  }

  // 檢查管理員登入狀態
  async function checkAuthStatus() {
    loadingAuth.value = true;

    try {
      const response = await api.adminAuth.checkStatus();

      isLoggedIn.value = response.loggedIn;
      role.value = response.role;
      brand.value = response.brand;
      store.value = response.store;

      return response;
    } catch (err) {
      console.error('檢查管理員狀態失敗:', err);
      isLoggedIn.value = false;
      role.value = null;
      brand.value = null;
      store.value = null;
      return { loggedIn: false };
    } finally {
      loadingAuth.value = false;
    }
  }

  // 修改密碼
  async function changePassword(passwordData) {
    loadingAuth.value = true;
    error.value = null;

    try {
      const response = await api.adminAuth.changePassword(passwordData);
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || '修改密碼失敗，請稍後再試';
      throw err;
    } finally {
      loadingAuth.value = false;
    }
  }

  // 檢查權限
  function hasPermission(permission) {
    // 簡化版權限檢查，實際應該根據後端返回的詳細權限資訊
    const permissions = {
      'primary_system_admin': ['*'], // 所有權限
      'system_admin': [
        'manage_brands', 'manage_stores', 'manage_menu', 'manage_inventory',
        'manage_orders', 'view_reports', 'manage_promotions', 'manage_customers'
      ],
      'primary_brand_admin': [
        'manage_brand', 'manage_stores', 'manage_menu', 'manage_inventory',
        'manage_orders', 'view_reports', 'manage_promotions', 'manage_customers',
        'manage_brand_admins'
      ],
      'brand_admin': [
        'manage_brand', 'manage_stores', 'manage_menu', 'manage_inventory',
        'manage_orders', 'view_reports', 'manage_promotions', 'manage_customers'
      ],
      'primary_store_admin': [
        'manage_store', 'manage_menu', 'manage_inventory', 'manage_orders',
        'view_reports', 'manage_promotions', 'manage_customers', 'manage_store_admins'
      ],
      'store_admin': [
        'manage_store', 'manage_menu', 'manage_inventory', 'manage_orders',
        'view_reports', 'manage_promotions', 'manage_customers'
      ],
      'employee': [
        'order_system', 'manage_inventory'
      ]
    };

    const userPermissions = permissions[role.value] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }

  // 檢查是否可以訪問特定品牌
  function canAccessBrand(brandId) {
    if (canManageSystem.value) return true;
    if (!brand.value) return false;
    return brand.value._id === brandId || brand.value === brandId;
  }

  // 檢查是否可以訪問特定店鋪
  function canAccessStore(storeId) {
    if (canManageSystem.value || canManageBrand.value) return true;
    if (!store.value) return false;
    return store.value._id === storeId || store.value === storeId;
  }

  // 清除錯誤
  function clearError() {
    error.value = null;
  }

  // 返回store所有需要暴露的內容
  return {
    // 狀態
    admin,
    isLoggedIn,
    loadingAuth,
    error,
    role,
    brand,
    store,

    // 計算屬性
    adminName,
    adminIsLoggedIn,
    currentRole,
    currentBrand,
    currentStore,
    roleLabel,
    canManageSystem,
    canManageBrand,
    canManageStore,
    isPrimaryRole,

    // 方法
    login,
    logout,
    checkAuthStatus,
    changePassword,
    hasPermission,
    canAccessBrand,
    canAccessStore,
    clearError
  };
});
