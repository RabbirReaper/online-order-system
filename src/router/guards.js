import api from '@/api'
import { useAuthStore } from '@/stores/customerAuth'

// 檢查管理員登入狀態
export const checkAdminAuth = async () => {
  try {
    const response = await api.adminAuth.checkStatus()
    console.log('管理員登入狀態:', response)
    return response;
  } catch (error) {
    console.error('檢查管理員登入狀態失敗', error)
    return { loggedIn: false, role: null, brand: null, store: null }
  }
}

// 統一的用戶認證檢查 - 使用 authStore
export const checkUserAuthStatus = async () => {
  const authStore = useAuthStore();

  // 確保有brandId
  if (!authStore.currentBrandId) {
    authStore.initializeBrandId(); // 從sessionStorage恢復
  }

  if (!authStore.currentBrandId) {
    return { loggedIn: false };
  }

  try {
    const result = await authStore.checkAuthStatus();
    return result;
  } catch (error) {
    console.error('檢查用戶登入狀態失敗', error);
    return { loggedIn: false };
  }
};

// 認證守衛 - 檢查用戶是否已登入
export const requireAuth = async (to, from, next) => {
  const { loggedIn } = await checkUserAuthStatus();

  if (loggedIn) {
    next(); // 允許訪問
  } else {
    // 跳轉到登入頁面並保存原始請求路徑
    next({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    });
  }
};

// 非認證守衛 - 檢查用戶是否未登入
export const requireNoAuth = async (to, from, next) => {
  const { loggedIn } = await checkUserAuthStatus();

  if (!loggedIn) {
    next(); // 允許訪問
  } else {
    // 如果已登入，跳轉到會員中心
    next('/member');
  }
};

// 全局前置守衛邏輯
export const globalBeforeEach = async (to, from, next) => {
  if (to.path === '/admin/login') {
    return next()
  }

  // 管理員授權檢查
  if (to.matched.some(record => record.meta.requiresAdminAuth)) {
    const { loggedIn, role, brand, store } = await checkAdminAuth()

    if (!loggedIn) {
      return next({
        path: '/admin/login',
        query: { redirect: to.fullPath }
      })
    }

    // 檢查角色權限
    if (to.meta.role) {
      const allowedRoles = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role];

      if (!allowedRoles.includes(role)) {
        // 根據角色選擇重定向路徑
        let redirectPath = '/admin/login';

        if (role === 'primary_system_admin' || role === 'system_admin') {
          redirectPath = '/boss';
        } else if (brand?._id) {
          redirectPath = `/admin/${brand._id}`;
        }

        alert('您沒有權限訪問此頁面')
        return next(redirectPath)
      }
    }

    // 檢查品牌權限
    if (to.params.brandId && role !== 'primary_system_admin' && role !== 'system_admin') {
      if (!brand || brand._id !== to.params.brandId) {
        alert('您沒有權限管理此品牌')
        return next('/admin/login')
      }
    }

    // 檢查店鋪權限
    if (to.params.storeId &&
      (role === 'primary_store_admin' || role === 'store_admin' || role === 'employee')) {
      if (!store || store._id !== to.params.storeId) {
        alert('您沒有權限管理此店鋪')
        return next(`/admin/${brand._id}`)
      }
    }
  }

  // 會員授權檢查 - 已在路由守衛中處理
  // 統一的 brandId 設置和狀態同步
  if (to.params.brandId || to.params.storeId) {
    const authStore = useAuthStore();

    // 如果路由包含 brandId，設置到 authStore
    if (to.params.brandId) {
      authStore.setBrandId(to.params.brandId);
    }

    // 如果路由包含 brandId 和 storeId，設置到 cartStore
    if (to.params.brandId && to.params.storeId) {
      // 動態導入 cartStore 避免循環依賴
      const { useCartStore } = await import('@/stores/cart');
      const cartStore = useCartStore();
      cartStore.setBrandAndStore(to.params.brandId, to.params.storeId);
    }
  }

  next();
}
