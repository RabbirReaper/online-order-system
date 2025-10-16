import api from '@/api'
import { useAuthStore } from '@/stores/customerAuth'

// 檢查管理員登入狀態
export const checkAdminAuth = async () => {
  try {
    const response = await api.adminAuth.checkStatus()
    console.log('管理員登入狀態:', response)
    return response
  } catch (error) {
    console.error('檢查管理員登入狀態失敗', error)
    return { loggedIn: false, role: null, brand: null, store: null }
  }
}

// 統一的用戶認證檢查 - 使用 authStore
export const checkUserAuthStatus = async () => {
  const authStore = useAuthStore()

  // 確保有brandId
  if (!authStore.currentBrandId) {
    authStore.initializeBrandId() // 從sessionStorage恢復
  }

  if (!authStore.currentBrandId) {
    return { loggedIn: false }
  }

  try {
    const result = await authStore.checkAuthStatus()
    return result
  } catch (error) {
    console.error('檢查用戶登入狀態失敗', error)
    return { loggedIn: false }
  }
}

// 認證守衛 - 檢查用戶是否已登入
export const requireAuth = async (to, from, next) => {
  const { loggedIn } = await checkUserAuthStatus()

  if (loggedIn) {
    next() // 允許訪問
  } else {
    // 跳轉到登入頁面並保存原始請求路徑
    next({
      path: '/auth/login',
      query: { redirect: to.fullPath },
    })
  }
}

// 非認證守衛 - 檢查用戶是否未登入
export const requireNoAuth = async (to, from, next) => {
  const { loggedIn } = await checkUserAuthStatus()

  if (!loggedIn) {
    next() // 允許訪問
  } else {
    // 如果已登入，跳轉到會員中心
    next('/member')
  }
}

// 取得管理員登入頁面路徑的輔助函數
const getAdminLoginPath = (brandId = null, role = null) => {
  // 系統管理員使用不包含 brandId 的登入路由（如果有的話）
  if (role === 'primary_system_admin' || role === 'system_admin') {
    // 系統管理員可能需要特殊的登入路由，這裡暫時使用預設品牌
    // 或者你可以創建一個專門的系統管理員登入路由
    return brandId ? `/admin/${brandId}/login` : '/admin/login' // 需要一個預設的處理方式
  }

  // 其他管理員需要 brandId
  if (brandId) {
    return `/admin/${brandId}/login`
  }

  // 如果沒有 brandId，需要有一個預設處理方式
  // 可能需要重定向到品牌選擇頁面或使用預設品牌
  return '/admin/login' // 這裡需要你決定預設行為
}

// 全局前置守衛邏輯
export const globalBeforeEach = async (to, from, next) => {
  // 處理管理員登入路由（允許訪問）
  if (to.path.includes('/admin/') && to.path.includes('/login')) {
    return next()
  }

  // 管理員授權檢查
  if (to.matched.some((record) => record.meta.requiresAdminAuth)) {
    const { loggedIn, role, brand, store } = await checkAdminAuth()

    if (!loggedIn) {
      // 優先使用路由中的 brandId，否則嘗試從當前用戶的品牌獲取
      const targetBrandId = to.params.brandId || brand?._id
      const loginPath = getAdminLoginPath(targetBrandId, role)

      return next({
        path: loginPath,
        query: { redirect: to.fullPath },
      })
    }

    // 檢查角色權限
    if (to.meta.role) {
      const allowedRoles = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role]

      if (!allowedRoles.includes(role)) {
        // 根據角色選擇重定向路徑
        let redirectPath

        if (role === 'primary_system_admin' || role === 'system_admin') {
          redirectPath = '/boss'
        } else if (role === 'primary_brand_admin' || role === 'brand_admin') {
          redirectPath = brand?._id ? `/admin/${brand._id}` : '/admin/login'
        } else if (brand?._id) {
          // store_admin, primary_store_admin, employee 沒有訪問品牌管理頁面的權限
          redirectPath = `/admin/${brand._id}`
        } else {
          redirectPath = '/admin/login'
        }

        alert('您沒有權限訪問此頁面')
        return next(redirectPath)
      }
    }

    // 檢查品牌權限
    if (to.params.brandId && role !== 'primary_system_admin' && role !== 'system_admin') {
      if (!brand || brand._id !== to.params.brandId) {
        alert('您沒有權限管理此品牌')
        const loginPath = getAdminLoginPath(to.params.brandId, role)
        return next(loginPath)
      }
    }

    // 檢查店鋪權限
    if (
      to.params.storeId &&
      (role === 'primary_store_admin' || role === 'store_admin' || role === 'employee')
    ) {
      if (!store || store._id !== to.params.storeId) {
        alert('您沒有權限管理此店鋪')
        return next(`/admin/${brand._id}`)
      }
    }
  }

  // 會員授權檢查 - 已在路由守衛中處理
  // 統一的 brandId 設置和狀態同步
  if (to.params.brandId || to.params.storeId) {
    const authStore = useAuthStore()

    // 如果路由包含 brandId，設置到 authStore
    if (to.params.brandId) {
      authStore.setBrandId(to.params.brandId)
    }

    // 如果路由包含 brandId 和 storeId，設置到 cartStore
    if (to.params.brandId && to.params.storeId) {
      // 動態導入 cartStore 避免循環依賴
      const { useCartStore } = await import('@/stores/cart')
      const cartStore = useCartStore()
      cartStore.setBrandAndStore(to.params.brandId, to.params.storeId)
    }
  }

  next()
}
