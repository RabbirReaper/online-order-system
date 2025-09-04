import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/customerAuth'

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// Mock API
vi.mock('@/api', () => ({
  default: {
    userAuth: {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      checkStatus: vi.fn(),
      resetPassword: vi.fn(),
      changePassword: vi.fn()
    },
    user: {
      getUserProfile: vi.fn()
    }
  }
}))

const api = (await import('@/api')).default

describe('customerAuth Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    window.sessionStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始狀態', () => {
    it('should have correct initial state', () => {
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(store.loadingAuth).toBe(false)
      expect(store.error).toBeNull()
      expect(store.brandId).toBeNull()
    })

    it('should have correct computed properties with null user', () => {
      expect(store.userName).toBe('訪客')
      expect(store.userId).toBeNull()
      expect(store.currentBrandId).toBeNull()
    })
  })

  describe('品牌ID管理', () => {
    it('should set brand ID and sync to sessionStorage', () => {
      const brandId = 'test-brand-123'
      
      store.setBrandId(brandId)
      
      expect(store.brandId).toBe(brandId)
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('currentBrandId', brandId)
    })

    it('should remove brand ID from sessionStorage when set to null', () => {
      store.setBrandId(null)
      
      expect(store.brandId).toBeNull()
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('currentBrandId')
    })

    it('should initialize brand ID from sessionStorage', () => {
      const storedBrandId = 'stored-brand-456'
      window.sessionStorage.getItem.mockReturnValue(storedBrandId)
      
      store.initializeBrandId()
      
      expect(store.brandId).toBe(storedBrandId)
      expect(window.sessionStorage.getItem).toHaveBeenCalledWith('currentBrandId')
    })

    it('should not overwrite existing brand ID during initialization', () => {
      store.brandId = 'existing-brand'
      window.sessionStorage.getItem.mockReturnValue('stored-brand')
      
      store.initializeBrandId()
      
      expect(store.brandId).toBe('existing-brand')
    })
  })

  describe('用戶註冊', () => {
    it('should register user successfully', async () => {
      const userData = { name: 'Test User', phone: '0912345678', password: 'password123' }
      const code = '123456'
      const brandId = 'test-brand'
      const mockResponse = { success: true, message: '註冊成功' }
      
      store.setBrandId(brandId)
      api.userAuth.register.mockResolvedValue(mockResponse)
      
      const result = await store.register(userData, code)
      
      expect(store.loadingAuth).toBe(false)
      expect(store.error).toBeNull()
      expect(api.userAuth.register).toHaveBeenCalledWith({
        brandId,
        userData: {
          ...userData,
          brand: brandId
        },
        code
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle registration error when no brand ID', async () => {
      const userData = { name: 'Test User' }
      const code = '123456'
      
      await expect(store.register(userData, code)).rejects.toThrow('無法獲取品牌資訊')
      expect(store.loadingAuth).toBe(false)
      expect(store.error).toBe('無法獲取品牌資訊')
    })

    it('should handle API registration error', async () => {
      const userData = { name: 'Test User' }
      const code = '123456'
      const errorMessage = '手機號碼已註冊'
      
      store.setBrandId('test-brand')
      api.userAuth.register.mockRejectedValue({
        response: { data: { message: errorMessage } }
      })
      
      await expect(store.register(userData, code)).rejects.toThrow()
      expect(store.loadingAuth).toBe(false)
      expect(store.error).toBe(errorMessage)
    })
  })

  describe('用戶登入', () => {
    it('should login user successfully with profile data', async () => {
      const credentials = { phone: '0912345678', password: 'password123' }
      const brandId = 'test-brand'
      const mockResponse = {
        profile: {
          _id: 'user-123',
          name: 'Test User',
          phone: '0912345678'
        }
      }
      
      store.setBrandId(brandId)
      api.userAuth.login.mockResolvedValue(mockResponse)
      
      const result = await store.login(credentials)
      
      expect(store.user).toEqual(mockResponse.profile)
      expect(store.isLoggedIn).toBe(true)
      expect(store.loadingAuth).toBe(false)
      expect(store.error).toBeNull()
      expect(api.userAuth.login).toHaveBeenCalledWith({
        brandId,
        credentials
      })
      expect(result).toEqual(mockResponse)
    })

    it('should login user successfully with user data structure', async () => {
      const credentials = { phone: '0912345678', password: 'password123' }
      const mockResponse = {
        user: {
          _id: 'user-123',
          name: 'Test User'
        }
      }
      
      store.setBrandId('test-brand')
      api.userAuth.login.mockResolvedValue(mockResponse)
      
      await store.login(credentials)
      
      expect(store.user).toEqual(mockResponse.user)
      expect(store.isLoggedIn).toBe(true)
    })

    it('should handle direct user data structure', async () => {
      const credentials = { phone: '0912345678', password: 'password123' }
      const mockResponse = {
        _id: 'user-123',
        name: 'Test User'
      }
      
      store.setBrandId('test-brand')
      api.userAuth.login.mockResolvedValue(mockResponse)
      
      await store.login(credentials)
      
      expect(store.user).toEqual(mockResponse)
      expect(store.isLoggedIn).toBe(true)
    })

    it('should handle login error when no brand ID', async () => {
      const credentials = { phone: '0912345678', password: 'password123' }
      
      await expect(store.login(credentials)).rejects.toThrow('無法獲取品牌資訊')
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(store.error).toBe('無法獲取品牌資訊')
    })

    it('should handle API login error and clear auth state', async () => {
      const credentials = { phone: '0912345678', password: 'wrong' }
      const errorMessage = '密碼錯誤'
      
      store.setBrandId('test-brand')
      api.userAuth.login.mockRejectedValue({
        response: { data: { message: errorMessage } }
      })
      
      await expect(store.login(credentials)).rejects.toThrow()
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(store.loadingAuth).toBe(false)
      expect(store.error).toBe(errorMessage)
    })
  })

  describe('用戶登出', () => {
    beforeEach(() => {
      store.user = { _id: 'user-123', name: 'Test User' }
      store.isLoggedIn = true
    })

    it('should logout user successfully', async () => {
      const brandId = 'test-brand'
      store.setBrandId(brandId)
      api.userAuth.logout.mockResolvedValue({ success: true })
      
      const result = await store.logout()
      
      expect(api.userAuth.logout).toHaveBeenCalledWith(brandId)
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(store.error).toBeNull()
      expect(store.loadingAuth).toBe(false)
      expect(result).toEqual({ success: true })
    })

    it('should logout without API call when no brand ID', async () => {
      const result = await store.logout()
      
      expect(api.userAuth.logout).not.toHaveBeenCalled()
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(result).toEqual({ success: true })
    })

    it('should handle logout API error and preserve state until success', async () => {
      const errorMessage = '登出失敗'
      store.setBrandId('test-brand')
      api.userAuth.logout.mockRejectedValue({
        response: { data: { message: errorMessage } }
      })
      
      await expect(store.logout()).rejects.toThrow()
      // 當 API 錯誤發生時，狀態不會被清除（符合原始邏輯）
      expect(store.user).toEqual({ _id: 'user-123', name: 'Test User' })
      expect(store.isLoggedIn).toBe(true)
      expect(store.error).toBe(errorMessage)
      expect(store.loadingAuth).toBe(false)
    })
  })

  describe('檢查登入狀態', () => {
    it('should clear state when no brand ID', async () => {
      store.user = { name: 'Test' }
      store.isLoggedIn = true
      
      const result = await store.checkAuthStatus()
      
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(result).toEqual({ loggedIn: false })
    })

    it('should handle logged in user with complete user data', async () => {
      const brandId = 'test-brand'
      const mockResponse = {
        loggedIn: true,
        user: { _id: 'user-123', name: 'Test User' }
      }
      
      store.setBrandId(brandId)
      api.userAuth.checkStatus.mockResolvedValue(mockResponse)
      
      const result = await store.checkAuthStatus()
      
      expect(store.isLoggedIn).toBe(true)
      expect(store.user).toEqual(mockResponse.user)
      expect(result).toEqual(mockResponse)
      expect(api.userAuth.checkStatus).toHaveBeenCalledWith(brandId)
    })

    it('should fetch user profile when checkStatus returns logged in but no user data', async () => {
      const brandId = 'test-brand'
      const mockStatusResponse = { loggedIn: true }
      const mockProfileResponse = { _id: 'user-123', name: 'Test User' }
      
      store.setBrandId(brandId)
      api.userAuth.checkStatus.mockResolvedValue(mockStatusResponse)
      api.user.getUserProfile.mockResolvedValue(mockProfileResponse)
      
      const result = await store.checkAuthStatus()
      
      expect(store.isLoggedIn).toBe(true)
      expect(store.user).toEqual(mockProfileResponse)
      expect(api.user.getUserProfile).toHaveBeenCalledWith(brandId)
      expect(result).toEqual(mockStatusResponse)
    })

    it('should set basic user object when profile fetch fails', async () => {
      const brandId = 'test-brand'
      const mockStatusResponse = { loggedIn: true }
      
      store.setBrandId(brandId)
      api.userAuth.checkStatus.mockResolvedValue(mockStatusResponse)
      api.user.getUserProfile.mockRejectedValue(new Error('Profile error'))
      
      const result = await store.checkAuthStatus()
      
      expect(store.isLoggedIn).toBe(true)
      expect(store.user).toEqual({ name: '用戶' })
      expect(result).toEqual(mockStatusResponse)
    })

    it('should clear auth state when not logged in', async () => {
      const brandId = 'test-brand'
      const mockResponse = { loggedIn: false }
      
      store.setBrandId(brandId)
      store.user = { name: 'Test' }
      store.isLoggedIn = true
      api.userAuth.checkStatus.mockResolvedValue(mockResponse)
      
      const result = await store.checkAuthStatus()
      
      expect(store.isLoggedIn).toBe(false)
      expect(store.user).toBeNull()
      expect(result).toEqual(mockResponse)
    })

    it('should handle checkStatus API error', async () => {
      const brandId = 'test-brand'
      
      store.setBrandId(brandId)
      store.user = { name: 'Test' }
      store.isLoggedIn = true
      api.userAuth.checkStatus.mockRejectedValue(new Error('Network error'))
      
      const result = await store.checkAuthStatus()
      
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(result).toEqual({ loggedIn: false })
    })
  })

  describe('重設密碼', () => {
    it('should reset password successfully', async () => {
      const resetData = { phone: '0912345678', code: '123456', newPassword: 'newpass123' }
      const brandId = 'test-brand'
      const mockResponse = { success: true }
      
      store.setBrandId(brandId)
      api.userAuth.resetPassword.mockResolvedValue(mockResponse)
      
      const result = await store.resetPassword(resetData)
      
      expect(api.userAuth.resetPassword).toHaveBeenCalledWith({
        brandId,
        ...resetData
      })
      expect(store.loadingAuth).toBe(false)
      expect(store.error).toBeNull()
      expect(result).toEqual(mockResponse)
    })

    it('should handle reset password error when no brand ID', async () => {
      const resetData = { phone: '0912345678', code: '123456', newPassword: 'newpass123' }
      
      await expect(store.resetPassword(resetData)).rejects.toThrow('無法獲取品牌資訊')
      expect(store.error).toBe('無法獲取品牌資訊')
      expect(store.loadingAuth).toBe(false)
    })

    it('should handle reset password API error', async () => {
      const resetData = { phone: '0912345678', code: '123456', newPassword: 'newpass123' }
      const errorMessage = '驗證碼錯誤'
      
      store.setBrandId('test-brand')
      api.userAuth.resetPassword.mockRejectedValue({
        response: { data: { message: errorMessage } }
      })
      
      await expect(store.resetPassword(resetData)).rejects.toThrow()
      expect(store.error).toBe(errorMessage)
      expect(store.loadingAuth).toBe(false)
    })
  })

  describe('修改密碼', () => {
    it('should change password successfully', async () => {
      const passwordData = { currentPassword: 'oldpass', newPassword: 'newpass123' }
      const brandId = 'test-brand'
      const mockResponse = { success: true }
      
      store.setBrandId(brandId)
      api.userAuth.changePassword.mockResolvedValue(mockResponse)
      
      const result = await store.changePassword(passwordData)
      
      expect(api.userAuth.changePassword).toHaveBeenCalledWith({
        brandId,
        ...passwordData
      })
      expect(store.loadingAuth).toBe(false)
      expect(store.error).toBeNull()
      expect(result).toEqual(mockResponse)
    })

    it('should handle change password error when no brand ID', async () => {
      const passwordData = { currentPassword: 'oldpass', newPassword: 'newpass123' }
      
      await expect(store.changePassword(passwordData)).rejects.toThrow('無法獲取品牌資訊')
      expect(store.error).toBe('無法獲取品牌資訊')
    })

    it('should handle change password API error', async () => {
      const passwordData = { currentPassword: 'wrong', newPassword: 'newpass123' }
      const errorMessage = '當前密碼錯誤'
      
      store.setBrandId('test-brand')
      api.userAuth.changePassword.mockRejectedValue({
        response: { data: { message: errorMessage } }
      })
      
      await expect(store.changePassword(passwordData)).rejects.toThrow()
      expect(store.error).toBe(errorMessage)
      expect(store.loadingAuth).toBe(false)
    })
  })

  describe('獲取用戶資料', () => {
    it('should get user profile successfully when logged in', async () => {
      const brandId = 'test-brand'
      const mockProfile = { _id: 'user-123', name: 'Test User', phone: '0912345678' }
      
      store.setBrandId(brandId)
      store.isLoggedIn = true
      store.user = { _id: 'user-123', name: 'Test User' }
      api.user.getUserProfile.mockResolvedValue(mockProfile)
      
      const result = await store.getUserProfile()
      
      expect(api.user.getUserProfile).toHaveBeenCalledWith(brandId)
      expect(store.user).toEqual({ ...store.user, ...mockProfile })
      expect(result).toEqual(mockProfile)
    })

    it('should return null when no brand ID', async () => {
      store.isLoggedIn = true
      
      const result = await store.getUserProfile()
      
      expect(result).toBeNull()
      expect(api.user.getUserProfile).not.toHaveBeenCalled()
    })

    it('should return null when not logged in', async () => {
      store.setBrandId('test-brand')
      store.isLoggedIn = false
      
      const result = await store.getUserProfile()
      
      expect(result).toBeNull()
      expect(api.user.getUserProfile).not.toHaveBeenCalled()
    })

    it('should handle getUserProfile API error', async () => {
      store.setBrandId('test-brand')
      store.isLoggedIn = true
      api.user.getUserProfile.mockRejectedValue(new Error('Profile error'))
      
      const result = await store.getUserProfile()
      
      expect(result).toBeNull()
    })
  })

  describe('初始化', () => {
    it('should initialize and check auth status when brand ID exists', async () => {
      const storedBrandId = 'stored-brand'
      const mockResponse = { loggedIn: true, user: { name: 'Test User' } }
      
      window.sessionStorage.getItem.mockReturnValue(storedBrandId)
      api.userAuth.checkStatus.mockResolvedValue(mockResponse)
      
      await store.initialize()
      
      expect(store.brandId).toBe(storedBrandId)
      expect(api.userAuth.checkStatus).toHaveBeenCalledWith(storedBrandId)
      expect(store.isLoggedIn).toBe(true)
      expect(store.user).toEqual(mockResponse.user)
    })

    it('should only initialize brand ID when no stored brand ID', async () => {
      window.sessionStorage.getItem.mockReturnValue(null)
      
      await store.initialize()
      
      expect(store.brandId).toBeNull()
      expect(api.userAuth.checkStatus).not.toHaveBeenCalled()
    })
  })

  describe('計算屬性', () => {
    it('should return correct userName when user exists', () => {
      store.user = { name: 'John Doe' }
      expect(store.userName).toBe('John Doe')
    })

    it('should return "訪客" when user is null', () => {
      store.user = null
      expect(store.userName).toBe('訪客')
    })

    it('should return correct userId when user exists', () => {
      store.user = { _id: 'user-123' }
      expect(store.userId).toBe('user-123')
    })

    it('should return null userId when user is null', () => {
      store.user = null
      expect(store.userId).toBeNull()
    })

    it('should return correct currentBrandId', () => {
      store.brandId = 'brand-123'
      expect(store.currentBrandId).toBe('brand-123')
    })
  })

  describe('clearAuthState', () => {
    it('should clear all auth state', () => {
      store.user = { name: 'Test User' }
      store.isLoggedIn = true
      store.error = 'Some error'
      
      store.clearAuthState()
      
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('錯誤處理', () => {
    it('should set error message when API call fails', async () => {
      const errorMessage = 'API Error'
      const mockError = {
        response: { data: { message: errorMessage } }
      }
      
      store.setBrandId('test-brand')
      api.userAuth.login.mockRejectedValue(mockError)
      
      await expect(store.login({ phone: '123', password: 'wrong' })).rejects.toThrow()
      expect(store.error).toBe(errorMessage)
    })

    it('should set generic error when no specific message available', async () => {
      const mockError = { message: 'Network Error' }
      
      store.setBrandId('test-brand')
      api.userAuth.login.mockRejectedValue(mockError)
      
      await expect(store.login({ phone: '123', password: 'wrong' })).rejects.toThrow()
      expect(store.error).toBe('Network Error')
    })

    it('should use default error message when no error details available', async () => {
      const mockError = {}
      
      store.setBrandId('test-brand')
      api.userAuth.login.mockRejectedValue(mockError)
      
      await expect(store.login({ phone: '123', password: 'wrong' })).rejects.toThrow()
      expect(store.error).toBe('登入失敗，請檢查您的手機號碼和密碼')
    })
  })
})