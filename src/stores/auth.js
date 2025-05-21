import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api';

export const useAuthStore = defineStore('auth', () => {
  // 狀態 (ref)
  const user = ref(null);
  const isLoggedIn = ref(false);
  const loadingAuth = ref(false);
  const error = ref(null);
  const brandId = ref(null);

  // 計算屬性 (computed)
  const userName = computed(() => {
    return user.value?.name || '訪客';
  });

  const userIsLoggedIn = computed(() => {
    return isLoggedIn.value;
  });

  const currentBrandId = computed(() => {
    return brandId.value;
  });

  // 方法 (actions)

  // 設置品牌ID
  function setBrandId(newBrandId) {
    brandId.value = newBrandId;
  }

  // 註冊用戶
  async function register(userData, code) {
    loadingAuth.value = true;
    error.value = null;

    try {
      if (!brandId.value) {
        throw new Error('無法獲取品牌資訊');
      }

      const response = await api.userAuth.register({
        brandId: brandId.value,
        userData: {
          ...userData,
          brand: brandId.value
        },
        code
      });

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || '註冊失敗，請稍後再試';
      throw err;
    } finally {
      loadingAuth.value = false;
    }
  }

  // 用戶登入
  async function login(credentials) {
    loadingAuth.value = true;
    error.value = null;

    try {
      if (!brandId.value) {
        throw new Error('無法獲取品牌資訊');
      }

      const response = await api.userAuth.login({
        brandId: brandId.value,
        credentials
      });

      user.value = response;
      isLoggedIn.value = true;

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || '登入失敗，請檢查您的手機號碼和密碼';
      throw err;
    } finally {
      loadingAuth.value = false;
    }
  }

  // 用戶登出
  async function logout() {
    loadingAuth.value = true;
    error.value = null;

    try {
      if (!brandId.value) {
        throw new Error('無法獲取品牌資訊');
      }

      await api.userAuth.logout(brandId.value);

      user.value = null;
      isLoggedIn.value = false;

      return { success: true };
    } catch (err) {
      error.value = err.response?.data?.message || '登出失敗，請稍後再試';
      throw err;
    } finally {
      loadingAuth.value = false;
    }
  }

  // 檢查用戶登入狀態
  async function checkAuthStatus() {
    if (!brandId.value) {
      return { loggedIn: false };
    }

    try {
      const response = await api.userAuth.checkStatus(brandId.value);

      isLoggedIn.value = response.loggedIn;

      if (response.loggedIn) {
        // 如果已登入，獲取用戶資料
        const userProfile = await api.user.getUserProfile(brandId.value);
        user.value = userProfile;
      } else {
        user.value = null;
      }

      return response;
    } catch (err) {
      console.error('檢查用戶狀態失敗:', err);
      isLoggedIn.value = false;
      user.value = null;
      return { loggedIn: false };
    }
  }

  // 重設密碼
  async function resetPassword(resetData) {
    loadingAuth.value = true;
    error.value = null;

    try {
      if (!brandId.value) {
        throw new Error('無法獲取品牌資訊');
      }

      const response = await api.userAuth.resetPassword({
        brandId: brandId.value,
        ...resetData
      });

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || '重設密碼失敗，請稍後再試';
      throw err;
    } finally {
      loadingAuth.value = false;
    }
  }

  // 修改密碼
  async function changePassword(passwordData) {
    loadingAuth.value = true;
    error.value = null;

    try {
      if (!brandId.value) {
        throw new Error('無法獲取品牌資訊');
      }

      const response = await api.userAuth.changePassword({
        brandId: brandId.value,
        ...passwordData
      });

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || '修改密碼失敗，請稍後再試';
      throw err;
    } finally {
      loadingAuth.value = false;
    }
  }

  // 返回store所有需要暴露的內容
  return {
    // 狀態
    user,
    isLoggedIn,
    loadingAuth,
    error,
    brandId,

    // 計算屬性
    userName,
    userIsLoggedIn,
    currentBrandId,

    // 方法
    setBrandId,
    register,
    login,
    logout,
    checkAuthStatus,
    resetPassword,
    changePassword
  };
});
