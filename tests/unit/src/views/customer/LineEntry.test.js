import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock LIFF SDK
const mockLiff = {
  init: vi.fn(),
  isLoggedIn: vi.fn(),
  login: vi.fn(),
  getProfile: vi.fn(),
  getIDToken: vi.fn(),
  getFriendship: vi.fn()
}

vi.mock('@line/liff', () => ({
  default: mockLiff
}))


// Mock API
const mockApi = {
  store: {
    getLineBotInfo: vi.fn().mockResolvedValue({
      data: {
        liffId: '2007974797-rvmVYQB0',
        lineBotId: 'test-line-bot-id',
        enableLineOrdering: true,
        storeName: 'Test Store'
      }
    })
  }
}
vi.mock('@/api', () => ({
  default: mockApi
}))

// Mock cart store
const mockCartStore = {
  setBrandAndStore: vi.fn(),
  setLineUserInfo: vi.fn()
}
vi.mock('@/stores/cart', () => ({
  useCartStore: () => mockCartStore
}))

// Mock router
const mockRouter = {
  replace: vi.fn(),
  push: vi.fn()
}

const mockRoute = {
  query: {}
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => mockRouter,
    useRoute: () => mockRoute
  }
})

// Mock console methods
const originalConsole = { ...console }
beforeEach(() => {
  console.log = vi.fn()
  console.warn = vi.fn()
  console.error = vi.fn()
})

afterEach(() => {
  Object.assign(console, originalConsole)
})

// 動態導入組件
let LineEntry

describe('LineEntry.vue', () => {
  let wrapper
  let pinia

  beforeEach(async () => {
    // 重置所有 mocks
    vi.clearAllMocks()

    // 重置 route.query
    mockRoute.query = {}

    // 設置 Pinia
    pinia = createPinia()
    setActivePinia(pinia)

    // 動態導入組件
    const module = await import('@/views/customer/LineEntry.vue')
    LineEntry = module.default
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  const createWrapper = () => {
    return mount(LineEntry, {
      global: {
        plugins: [pinia],
        stubs: {
          // 避免測試時路由相關問題
          'router-link': true,
          'router-view': true
        }
      }
    })
  }

  describe('初始狀態', () => {
    it('應該顯示載入狀態', () => {
      wrapper = createWrapper()
      
      expect(wrapper.find('.loading-container').exists()).toBe(true)
      expect(wrapper.find('.spinner').exists()).toBe(true)
      expect(wrapper.find('.loading-text').text()).toBe('正在初始化...')
    })

    it('應該有正確的初始響應式數據', async () => {
      // Mock 正常的 LIFF 行為避免錯誤
      mockLiff.init.mockResolvedValue()
      mockRoute.query = {
        brandId: 'test-brand',
        storeId: 'test-store'
      }

      wrapper = createWrapper()

      // 檢查初始狀態（在任何異步操作之前）
      expect(wrapper.vm.isLoading).toBe(true)
      expect(wrapper.vm.error).toBe(null)
      expect(wrapper.vm.success).toBe(false)
      // currentStep 可能已經從 init 變為 liff，因為 onMounted 會立即執行
      expect(['init', 'liff']).toContain(wrapper.vm.currentStep)
    })
  })

  describe('LIFF 初始化', () => {
    beforeEach(() => {
      mockRoute.query = {
        brandId: 'test-brand',
        storeId: 'test-store'
      }
    })

    it('應該成功初始化 LIFF', async () => {
      mockLiff.init.mockResolvedValue()
      mockLiff.isLoggedIn.mockReturnValue(true)

      wrapper = createWrapper()

      // 等待異步操作完成（包括 API 呼叫）
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 200))

      // 驗證先呼叫 API 獲取 LIFF ID
      expect(mockApi.store.getLineBotInfo).toHaveBeenCalledWith({
        brandId: 'test-brand',
        id: 'test-store'
      })

      // 然後用獲取到的 LIFF ID 初始化
      expect(mockLiff.init).toHaveBeenCalledWith({ liffId: '2007974797-rvmVYQB0' })
    })

    it('應該在 LIFF 初始化失敗時顯示錯誤', async () => {
      const error = new Error('LIFF init failed')
      error.code = 'LIFF_INIT_ERROR'
      mockLiff.init.mockRejectedValue(error)
      
      wrapper = createWrapper()
      
      // 等待錯誤處理
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.error).toContain('LINE 應用程式初始化失敗')
      expect(wrapper.vm.isLoading).toBe(false)
    })
  })

  describe('登入狀態檢查', () => {
    beforeEach(() => {
      mockLiff.init.mockResolvedValue()
      mockRoute.query = {
        brandId: 'test-brand',
        storeId: 'test-store'
      }
    })

    it('應該在未登入時調用 liff.login() 並保存參數', async () => {
      mockLiff.isLoggedIn.mockReturnValue(false)
      mockLiff.login.mockImplementation(() => {})
      mockRoute.query = {
        brandId: 'test-brand-123',
        storeId: 'test-store-456'
      }

      // Mock sessionStorage
      const sessionStorageMock = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'sessionStorage', {
        value: sessionStorageMock
      })

      wrapper = createWrapper()

      // 等待異步操作完成
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockLiff.login).toHaveBeenCalled()
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('temp-brandId', 'test-brand-123')
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('temp-storeId', 'test-store-456')
    })

    it('應該在已登入時繼續處理流程', async () => {
      mockLiff.isLoggedIn.mockReturnValue(true)
      mockLiff.getProfile.mockResolvedValue({
        userId: 'test-user-123',
        displayName: 'Test User',
        pictureUrl: 'https://example.com/avatar.jpg'
      })
      mockLiff.getIDToken.mockReturnValue('mock-id-token')

      // Mock localStorage
      const localStorageMock = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      })

      wrapper = createWrapper()

      // 等待足夠的時間讓異步操作完成
      await new Promise(resolve => setTimeout(resolve, 500))

      expect(mockLiff.login).not.toHaveBeenCalled()
      expect(mockLiff.getProfile).toHaveBeenCalled()
    })
  })

  describe('參數解析', () => {
    beforeEach(() => {
      mockLiff.init.mockResolvedValue()
      mockLiff.isLoggedIn.mockReturnValue(true)
    })

    it('應該正確解析 URL 參數並從 API 獲取 LIFF ID', async () => {
      mockLiff.init.mockResolvedValue()
      mockLiff.isLoggedIn.mockReturnValue(true)

      mockRoute.query = {
        brandId: 'brand-123',
        storeId: 'store-456',
        tableNumber: '5',
        campaign: 'summer2023'
      }

      wrapper = createWrapper()

      // 等待處理完成
      await new Promise(resolve => setTimeout(resolve, 200))
      await wrapper.vm.$nextTick()

      // 檢查是否使用正確的參數呼叫 API
      expect(mockApi.store.getLineBotInfo).toHaveBeenCalledWith({
        brandId: 'brand-123',
        id: 'store-456'
      })

      // 檢查 LIFF 初始化是否使用從 API 獲取的 liffId
      expect(mockLiff.init).toHaveBeenCalledWith({ liffId: '2007974797-rvmVYQB0' })
    })

    it('應該在缺少必要參數時顯示錯誤', async () => {
      mockRoute.query = {
        brandId: 'test-brand'
        // 缺少 storeId
      }

      wrapper = createWrapper()

      // 等待處理完成
      await new Promise(resolve => setTimeout(resolve, 200))
      await wrapper.vm.$nextTick()

      // 應該顯示錯誤訊息
      expect(wrapper.vm.error).toContain('缺少必要參數')
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('應該能從 sessionStorage 恢復參數', async () => {
      // 設定 LIFF mocks
      mockLiff.init.mockResolvedValue()
      mockLiff.isLoggedIn.mockReturnValue(true)
      mockLiff.getProfile.mockResolvedValue({
        userId: 'test-user-123',
        displayName: 'Test User',
        pictureUrl: 'https://example.com/avatar.jpg'
      })
      mockLiff.getIDToken.mockReturnValue('mock-id-token')

      // Mock 路由參數完全缺少 brandId 和 storeId
      mockRoute.query = {}

      // Mock sessionStorage 有保存的參數
      const sessionStorageMock = {
        getItem: vi.fn((key) => {
          if (key === 'temp-brandId') return 'recovered-brand-123'
          if (key === 'temp-storeId') return 'recovered-store-456'
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'sessionStorage', {
        value: sessionStorageMock
      })

      // Mock localStorage
      const localStorageMock = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      })

      wrapper = createWrapper()

      // 等待處理完成，給夠的時間讓所有異步操作完成
      await new Promise(resolve => setTimeout(resolve, 1000))

      expect(sessionStorageMock.getItem).toHaveBeenCalledWith('temp-brandId')
      expect(sessionStorageMock.getItem).toHaveBeenCalledWith('temp-storeId')
      expect(console.log).toHaveBeenCalledWith('🔄 從 sessionStorage 恢復參數')

      // 驗證使用恢復的參數呼叫 API
      expect(mockApi.store.getLineBotInfo).toHaveBeenCalledWith({
        brandId: 'recovered-brand-123',
        id: 'recovered-store-456'
      })
    })
  })

  describe('API 錯誤處理', () => {
    beforeEach(() => {
      mockRoute.query = {
        brandId: 'test-brand',
        storeId: 'test-store'
      }
    })

    it('應該在店家未設定 LIFF ID 時顯示錯誤', async () => {
      mockApi.store.getLineBotInfo.mockResolvedValueOnce({
        data: {
          liffId: '',
          lineBotId: 'test-line-bot-id',
          enableLineOrdering: true,
          storeName: 'Test Store'
        }
      })

      wrapper = createWrapper()

      // 等待處理完成
      await new Promise(resolve => setTimeout(resolve, 200))
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.error).toContain('尚未設定 LIFF ID')
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('應該在店家未啟用 LINE 點餐時顯示錯誤', async () => {
      mockApi.store.getLineBotInfo.mockResolvedValueOnce({
        data: {
          liffId: '2007974797-rvmVYQB0',
          lineBotId: 'test-line-bot-id',
          enableLineOrdering: false,
          storeName: 'Test Store'
        }
      })

      wrapper = createWrapper()

      // 等待處理完成
      await new Promise(resolve => setTimeout(resolve, 200))
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.error).toContain('尚未啟用 LINE 點餐功能')
      expect(wrapper.vm.isLoading).toBe(false)
    })
  })

  describe('購物車 store 測試', () => {
    beforeEach(() => {
      mockLiff.init.mockResolvedValue()
      mockLiff.isLoggedIn.mockReturnValue(true)
      mockLiff.getProfile.mockResolvedValue({
        userId: 'test-user-123',
        displayName: 'Test User',
        pictureUrl: 'https://example.com/avatar.jpg',
        statusMessage: 'Hello World'
      })
      mockLiff.getIDToken.mockReturnValue('mock-id-token')
      mockRoute.query = {
        brandId: 'test-brand',
        storeId: 'test-store'
      }

      // Mock sessionStorage
      const sessionStorageMock = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'sessionStorage', {
        value: sessionStorageMock
      })

      // Mock localStorage
      const localStorageMock = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      })
    })

    it('應該設定 LINE 用戶資訊到購物車', async () => {
      wrapper = createWrapper()

      // 等待處理完成
      await new Promise(resolve => setTimeout(resolve, 500))

      expect(mockCartStore.setLineUserInfo).toHaveBeenCalledWith({
        userId: 'test-user-123',
        displayName: 'Test User',
        pictureUrl: 'https://example.com/avatar.jpg'
      })
    })

    it('應該設定品牌和店家到購物車', async () => {
      wrapper = createWrapper()

      // 等待處理完成
      await new Promise(resolve => setTimeout(resolve, 500))

      expect(mockCartStore.setBrandAndStore).toHaveBeenCalledWith('test-brand', 'test-store')
    })
  })

  describe('路由跳轉', () => {
    let sessionStorageMock

    beforeEach(() => {
      mockLiff.init.mockResolvedValue()
      mockLiff.isLoggedIn.mockReturnValue(true)
      mockLiff.getProfile.mockResolvedValue({
        userId: 'test-user-123',
        displayName: 'Test User',
        pictureUrl: 'https://example.com/avatar.jpg'
      })
      mockLiff.getIDToken.mockReturnValue('mock-id-token')

      // Mock sessionStorage
      sessionStorageMock = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'sessionStorage', {
        value: sessionStorageMock
      })

      // Mock localStorage
      const localStorageMock = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      })
    })

    it('應該跳轉到正確的菜單路由', async () => {
      mockRoute.query = {
        brandId: 'brand-123',
        storeId: 'store-456',
        tableNumber: '5',
        campaign: 'summer2023',
        promo: 'discount10'
      }

      wrapper = createWrapper()

      // 等待所有異步操作完成
      await new Promise(resolve => setTimeout(resolve, 2000))
      await wrapper.vm.$nextTick()

      // 驗證路由跳轉參數
      expect(mockRouter.replace).toHaveBeenCalledWith({
        name: 'menu',
        params: {
          brandId: 'brand-123',
          storeId: 'store-456'
        },
        query: expect.objectContaining({
          fromLine: 'true',
          source: 'line',
          tableNumber: '5',
          campaign: 'summer2023',
          promo: 'discount10',
          timestamp: expect.any(Number)
        })
      })
    })

    it('應該清理臨時保存的參數', async () => {
      mockRoute.query = {
        brandId: 'brand-123',
        storeId: 'store-456'
      }

      wrapper = createWrapper()

      // 等待所有異步操作完成
      await new Promise(resolve => setTimeout(resolve, 1000))
      await wrapper.vm.$nextTick()

      // 驗證臨時參數被清理
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('temp-brandId')
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('temp-storeId')
      expect(console.log).toHaveBeenCalledWith('🧹 清理臨時參數')
    })
  })

  describe('錯誤處理', () => {
    it('應該顯示錯誤狀態', async () => {
      mockLiff.init.mockRejectedValue(new Error('Test error'))
      
      wrapper = createWrapper()
      
      // 等待錯誤處理
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.error-container').exists()).toBe(true)
      expect(wrapper.find('.error-message').exists()).toBe(true)
    })

    it('應該有重試按鈕', async () => {
      mockLiff.init.mockRejectedValue(new Error('Test error'))
      
      wrapper = createWrapper()
      
      // 等待錯誤處理
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()
      
      const retryButton = wrapper.find('.retry-btn')
      expect(retryButton.exists()).toBe(true)
      expect(retryButton.text()).toBe('重新嘗試')
    })

    it('應該有返回首頁按鈕', async () => {
      mockLiff.init.mockRejectedValue(new Error('Test error'))
      
      wrapper = createWrapper()
      
      // 等待錯誤處理
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()
      
      const homeButton = wrapper.find('.home-btn')
      expect(homeButton.exists()).toBe(true)
      expect(homeButton.text()).toBe('返回首頁')
    })
  })

  describe('用戶互動', () => {
    beforeEach(async () => {
      mockLiff.init.mockRejectedValue(new Error('Test error'))
      wrapper = createWrapper()
      
      // 等待錯誤狀態
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()
    })

    it('應該能夠重試操作', async () => {
      const retryButton = wrapper.find('.retry-btn')

      // 重置 mock 讓重試成功
      mockLiff.init.mockResolvedValue()
      mockLiff.isLoggedIn.mockReturnValue(true)
      mockRoute.query = {
        brandId: 'test-brand',
        storeId: 'test-store'
      }

      await retryButton.trigger('click')

      expect(wrapper.vm.error).toBe(null)
      expect(wrapper.vm.isLoading).toBe(true)
    })

    it('應該能夠返回首頁', async () => {
      const homeButton = wrapper.find('.home-btn')
      
      await homeButton.trigger('click')
      
      expect(mockRouter.replace).toHaveBeenCalledWith({ name: 'landing-home' })
    })
  })

  describe('載入訊息', () => {
    it('應該顯示正確的載入訊息', () => {
      wrapper = createWrapper()
      
      const testCases = [
        { step: 'init', expected: '正在初始化...' },
        { step: 'liff', expected: '正在連接 LINE...' },
        { step: 'auth', expected: '正在驗證登入狀態...' },
        { step: 'params', expected: '正在解析參數...' },
        { step: 'context', expected: '正在設定上下文...' },
        { step: 'redirect', expected: '處理成功，準備跳轉...' }
      ]
      
      testCases.forEach(({ step, expected }) => {
        wrapper.vm.currentStep = step
        expect(wrapper.vm.loadingMessage).toBe(expected)
      })
    })

    it('應該有預設載入訊息', () => {
      wrapper = createWrapper()
      wrapper.vm.currentStep = 'unknown'
      
      expect(wrapper.vm.loadingMessage).toBe('處理中...')
    })
  })

  describe('成功狀態', () => {
    it('應該顯示成功狀態', async () => {
      mockLiff.init.mockResolvedValue()
      mockLiff.isLoggedIn.mockReturnValue(true)
      mockRoute.query = {
        brandId: 'test-brand',
        storeId: 'test-store'
      }

      wrapper = createWrapper()

      // 手動設置成功狀態用於測試
      wrapper.vm.success = true
      wrapper.vm.isLoading = false
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.success-container').exists()).toBe(true)
      expect(wrapper.find('.success-icon').exists()).toBe(true)
    })
  })

  describe('環境檢查', () => {
    let originalUserAgent

    beforeEach(() => {
      originalUserAgent = Object.getOwnPropertyDescriptor(navigator, 'userAgent')
    })

    afterEach(() => {
      if (originalUserAgent) {
        Object.defineProperty(navigator, 'userAgent', originalUserAgent)
      }
    })

    it('應該檢測 LINE App 環境', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Line/10.16.1',
        configurable: true
      })
      
      wrapper = createWrapper()
      
      // 檢查是否記錄了環境資訊
      expect(console.log).toHaveBeenCalledWith(
        '📱 環境資訊:',
        expect.objectContaining({
          isInLineApp: true
        })
      )
    })

    it('應該檢測非 LINE App 環境', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true
      })
      
      wrapper = createWrapper()
      
      // 檢查是否記錄了環境資訊和警告
      expect(console.log).toHaveBeenCalledWith(
        '📱 環境資訊:',
        expect.objectContaining({
          isInLineApp: false
        })
      )
      expect(console.warn).toHaveBeenCalledWith('⚠️ 不在 LINE App 環境中')
    })
  })

  describe('錯誤邊界處理', () => {
    it('應該處理未處理的 Promise 錯誤', async () => {
      // Mock 避免初始化錯誤
      mockLiff.init.mockResolvedValue()
      mockLiff.isLoggedIn.mockReturnValue(true)
      mockRoute.query = {
        brandId: 'test-brand',
        storeId: 'test-store'
      }

      wrapper = createWrapper()
      
      // 手動設置載入狀態為 true
      wrapper.vm.isLoading = true
      wrapper.vm.error = null
      await wrapper.vm.$nextTick()
      
      // 觸發未處理的 Promise rejection
      const unhandledRejection = new CustomEvent('unhandledrejection', {
        detail: { reason: new Error('Unhandled promise rejection') }
      })
      
      window.dispatchEvent(unhandledRejection)
      
      // 等待事件處理
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.error).toBe('系統錯誤，請重新嘗試')
      expect(wrapper.vm.isLoading).toBe(false)
    })
  })
})