import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'

// 全局權限狀態
const currentUserRole = ref('')
const currentUserPermissions = ref([])
const currentBrand = ref(null)
const currentStore = ref(null)

// 權限定義
const PERMISSIONS = {
  // 系統級權限
  SYSTEM_ADMIN: 'system_admin',
  PRIMARY_SYSTEM_ADMIN: 'primary_system_admin',

  // 品牌級權限
  BRAND_ADMIN: 'brand_admin',
  PRIMARY_BRAND_ADMIN: 'primary_brand_admin',

  // 店鋪級權限
  STORE_ADMIN: 'store_admin',
  PRIMARY_STORE_ADMIN: 'primary_store_admin',
  EMPLOYEE: 'employee',
}

// 角色層級定義（數字越大權限越高）
const ROLE_HIERARCHY = {
  [PERMISSIONS.EMPLOYEE]: 1,
  [PERMISSIONS.STORE_ADMIN]: 2,
  [PERMISSIONS.PRIMARY_STORE_ADMIN]: 3,
  [PERMISSIONS.BRAND_ADMIN]: 4,
  [PERMISSIONS.PRIMARY_BRAND_ADMIN]: 5,
  [PERMISSIONS.SYSTEM_ADMIN]: 6,
  [PERMISSIONS.PRIMARY_SYSTEM_ADMIN]: 7,
}

export function usePermissions() {
  const route = useRoute()

  // 檢查是否為指定角色或更高權限
  const hasRole = (role) => {
    const currentLevel = ROLE_HIERARCHY[currentUserRole.value] || 0
    const requiredLevel = ROLE_HIERARCHY[role] || 0
    return currentLevel >= requiredLevel
  }

  // 檢查是否為指定角色列表中的任一角色
  const hasAnyRole = (roles) => {
    return roles.some((role) => currentUserRole.value === role)
  }

  // 檢查特定品牌權限
  const canAccessBrand = (brandId) => {
    if (hasAnyRole([PERMISSIONS.PRIMARY_SYSTEM_ADMIN, PERMISSIONS.SYSTEM_ADMIN])) {
      return true
    }
    return currentBrand.value?._id === brandId
  }

  // 檢查特定店鋪權限
  const canAccessStore = (storeId) => {
    if (
      hasAnyRole([
        PERMISSIONS.PRIMARY_SYSTEM_ADMIN,
        PERMISSIONS.SYSTEM_ADMIN,
        PERMISSIONS.PRIMARY_BRAND_ADMIN,
        PERMISSIONS.BRAND_ADMIN,
      ])
    ) {
      return true
    }
    return currentStore.value?._id === storeId
  }

  // 獲取當前用戶權限資訊
  const fetchUserPermissions = async () => {
    try {
      const response = await api.adminAuth.checkStatus()
      if (response.loggedIn) {
        currentUserRole.value = response.role
        currentBrand.value = response.brand
        currentStore.value = response.store

        console.log('用戶權限已更新:', {
          role: currentUserRole.value,
          brand: currentBrand.value?.name,
          store: currentStore.value?.name,
        })
      }
    } catch (error) {
      console.error('獲取用戶權限失敗:', error)
      currentUserRole.value = ''
      currentBrand.value = null
      currentStore.value = null
    }
  }

  // 清除權限資訊
  const clearPermissions = () => {
    currentUserRole.value = ''
    currentBrand.value = null
    currentStore.value = null
    currentUserPermissions.value = []
  }

  // 獲取角色顯示名稱
  const getRoleDisplayName = (role = currentUserRole.value) => {
    const roleNames = {
      [PERMISSIONS.PRIMARY_SYSTEM_ADMIN]: '系統主管理員',
      [PERMISSIONS.SYSTEM_ADMIN]: '系統管理員',
      [PERMISSIONS.PRIMARY_BRAND_ADMIN]: '品牌主管理員',
      [PERMISSIONS.BRAND_ADMIN]: '品牌管理員',
      [PERMISSIONS.PRIMARY_STORE_ADMIN]: '店鋪主管理員',
      [PERMISSIONS.STORE_ADMIN]: '店鋪管理員',
      [PERMISSIONS.EMPLOYEE]: '員工',
    }
    return roleNames[role] || role
  }

  return {
    // 狀態
    currentUserRole,
    currentBrand,
    currentStore,

    // 基本權限檢查
    hasRole,
    hasAnyRole,

    // 資源權限檢查
    canAccessBrand,
    canAccessStore,

    // 方法
    fetchUserPermissions,
    clearPermissions,
    getRoleDisplayName,

    // 常數
    PERMISSIONS,
  }
}
