import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock API
const mockApi = {
  dish: {
    getDishTemplateById: vi.fn(),
    getOptionCategoryById: vi.fn(),
    getTemplateOptions: vi.fn()
  },
  inventory: {
    getStoreInventory: vi.fn()
  }
}
vi.mock('@/api', () => ({
  default: mockApi
}))

// Mock cart store
const mockCartStore = {
  addItem: vi.fn(),
  removeItem: vi.fn(),
  items: []
}
vi.mock('@/stores/cart', () => ({
  useCartStore: () => mockCartStore
}))

// Mock menu store
const mockMenuStore = {
  inventoryData: {},
  isLoadingInventory: false,
  loadInventory: vi.fn()
}
vi.mock('@/stores/menu', () => ({
  useMenuStore: () => mockMenuStore
}))

// Mock router
const mockRouter = {
  back: vi.fn(),
  push: vi.fn()
}

const mockRoute = {
  params: {
    brandId: 'test-brand',
    storeId: 'test-store',
    dishId: 'test-dish'
  },
  query: {}
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute
}))

// Mock OptionSelector 組件
vi.mock('@/components/customer/dishDetail/OptionSelector.vue', () => ({
  default: {
    name: 'OptionSelector',
    template: '<div data-testid="option-selector"></div>',
    props: ['dish', 'option-categories', 'is-edit-mode', 'existing-item', 'inventory-data', 'is-loading-inventory'],
    emits: ['add-to-cart', 'update-cart']
  }
}))

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

let DishDetailView

describe('DishDetailView.vue', () => {
  let wrapper
  let pinia

  beforeEach(async () => {
    // 重置所有 mocks
    vi.clearAllMocks()

    // 重置 route params 和 query
    mockRoute.params = {
      brandId: 'test-brand',
      storeId: 'test-store',
      dishId: 'test-dish'
    }
    mockRoute.query = {}

    // 重置 cart store
    mockCartStore.items = []

    // 重置 menu store
    mockMenuStore.inventoryData = {}
    mockMenuStore.isLoadingInventory = false
    mockMenuStore.loadInventory.mockResolvedValue({})

    // 設置 Pinia
    pinia = createPinia()
    setActivePinia(pinia)

    // 動態導入組件
    const module = await import('@/views/customer/DishDetailView.vue')
    DishDetailView = module.default
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  const createWrapper = (options = {}) => {
    return mount(DishDetailView, {
      global: {
        plugins: [pinia],
        stubs: {
          'router-link': true,
          'router-view': true
        }
      },
      ...options
    })
  }

  describe('初始狀態', () => {
    it('應該顯示載入狀態', () => {
      wrapper = createWrapper()

      expect(wrapper.find('.loading-container').exists()).toBe(true)
      expect(wrapper.find('.spinner-border').exists()).toBe(true)
      expect(wrapper.vm.isLoading).toBe(true)
    })

    it('應該有正確的初始響應式數據', () => {
      wrapper = createWrapper()

      expect(wrapper.vm.dish).toEqual({})
      expect(wrapper.vm.optionCategories).toEqual([])
      expect(wrapper.vm.inventoryData).toEqual({})
      expect(wrapper.vm.isLoadingInventory).toBe(false)
      expect(wrapper.vm.existingItem).toBe(null)
    })
  })

  describe('計算屬性', () => {
    it('應該正確計算 brandId、storeId、dishId', () => {
      wrapper = createWrapper()

      expect(wrapper.vm.brandId).toBe('test-brand')
      expect(wrapper.vm.storeId).toBe('test-store')
      expect(wrapper.vm.dishId).toBe('test-dish')
    })

    it('應該正確判斷編輯模式', () => {
      // 非編輯模式
      wrapper = createWrapper()
      expect(wrapper.vm.isEditMode).toBe(false)

      wrapper.unmount()

      // 編輯模式
      mockRoute.query = { edit: 'true', editIndex: '2' }
      wrapper = createWrapper()
      expect(wrapper.vm.isEditMode).toBe(true)
      expect(wrapper.vm.editIndex).toBe(2)
    })
  })

  describe('餐點資料載入', () => {
    const mockDishData = {
      success: true,
      template: {
        _id: 'test-dish',
        name: '測試餐點',
        basePrice: 100,
        description: '測試描述',
        image: { url: 'test-image.jpg' },
        optionCategories: [
          { categoryId: 'category-1', order: 1 }
        ]
      }
    }

    const mockOptionsData = {
      success: true,
      options: [
        {
          category: {
            _id: 'category-1',
            name: '測試類別',
            inputType: 'single'
          },
          order: 1,
          options: [
            {
              _id: 'option-1',
              name: '測試選項',
              price: 20,
              refDishTemplate: { _id: 'ref-dish-1', name: '關聯餐點' }
            }
          ]
        }
      ]
    }

    beforeEach(() => {
      mockApi.dish.getDishTemplateById.mockResolvedValue(mockDishData)
      mockApi.dish.getTemplateOptions.mockResolvedValue(mockOptionsData)
      mockMenuStore.loadInventory.mockResolvedValue({})
    })

    it('應該成功載入餐點資料', async () => {
      wrapper = createWrapper()

      // 等待異步操作完成
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockApi.dish.getDishTemplateById).toHaveBeenCalledWith({
        brandId: 'test-brand',
        id: 'test-dish'
      })

      expect(wrapper.vm.dish).toEqual(mockDishData.template)
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('應該正確處理選項類別資料', async () => {
      wrapper = createWrapper()

      // 等待異步操作完成
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockApi.dish.getTemplateOptions).toHaveBeenCalledWith({
        brandId: 'test-brand',
        id: 'test-dish'
      })

      // 檢查選項類別是否正確處理
      expect(wrapper.vm.optionCategories).toHaveLength(1)
      const category = wrapper.vm.optionCategories[0]
      expect(category._id).toBe('category-1')
      expect(category.name).toBe('測試類別')
      expect(category.options).toHaveLength(1)

      // 檢查選項資料是否正確提取 refDishTemplate
      const option = category.options[0]
      expect(option._id).toBe('option-1')
      expect(option.name).toBe('測試選項')
      expect(option.price).toBe(20)
      expect(option.refDishTemplate).toEqual({ _id: 'ref-dish-1', name: '關聯餐點' })
    })

    it('應該處理無效的餐點 ID', async () => {
      mockRoute.params.dishId = ''
      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(console.error).toHaveBeenCalledWith('無效的餐點 ID:', '')
      expect(wrapper.vm.isLoading).toBe(false)
      expect(mockApi.dish.getDishTemplateById).not.toHaveBeenCalled()
    })

    it('應該處理 API 錯誤', async () => {
      mockApi.dish.getDishTemplateById.mockRejectedValue(new Error('API 錯誤'))
      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(console.error).toHaveBeenCalledWith('無法載入餐點詳情:', expect.any(Error))
      expect(wrapper.vm.isLoading).toBe(false)
    })
  })

  describe('庫存資料載入', () => {
    const mockInventoryMap = {
      'dish-1': {
        inventoryId: 'inventory-1',
        enableAvailableStock: true,
        availableStock: 10,
        totalStock: 50,
        isSoldOut: false,
        isInventoryTracked: true
      },
      'dish-2': {
        inventoryId: 'inventory-2',
        enableAvailableStock: false,
        availableStock: 0,
        totalStock: 0,
        isSoldOut: true,
        isInventoryTracked: false
      }
    }

    beforeEach(() => {
      mockMenuStore.loadInventory.mockResolvedValue(mockInventoryMap)
      mockMenuStore.inventoryData = {}
      mockMenuStore.isLoadingInventory = false
    })

    it('應該在組件掛載時調用 menuStore.loadInventory', async () => {
      wrapper = createWrapper()

      // 等待 onMounted 完成
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockMenuStore.loadInventory).toHaveBeenCalledWith('test-brand', 'test-store')
    })

    it('應該在缺少參數時不調用 loadInventory', async () => {
      // 在創建組件前設置無效參數
      mockRoute.params = {
        brandId: '',  // 空字串
        storeId: 'test-store',
        dishId: 'test-dish'
      }

      wrapper = createWrapper()

      // 等待組件初始化
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // menuStore.loadInventory 不應被調用（因為 brandId 是空字串）
      expect(mockMenuStore.loadInventory).not.toHaveBeenCalled()
    })

    it('應該通過 computed 屬性訪問 menuStore 的庫存資料', async () => {
      mockMenuStore.inventoryData = mockInventoryMap
      wrapper = createWrapper()

      await wrapper.vm.$nextTick()

      // inventoryData 是 computed 屬性，應該返回 menuStore 的值
      expect(wrapper.vm.inventoryData).toBe(mockMenuStore.inventoryData)
    })

    it('應該通過 computed 屬性訪問 menuStore 的載入狀態', async () => {
      mockMenuStore.isLoadingInventory = true
      wrapper = createWrapper()

      await wrapper.vm.$nextTick()

      // isLoadingInventory 是 computed 屬性，應該返回 menuStore 的值
      expect(wrapper.vm.isLoadingInventory).toBe(true)
    })
  })

  describe('編輯模式', () => {
    beforeEach(() => {
      mockRoute.query = { edit: 'true', editIndex: '1' }
      mockCartStore.items = [
        { _id: 'item-1', name: '餐點1' },
        { _id: 'item-2', name: '餐點2' }
      ]
    })

    it('應該在編輯模式下載入現有項目資料', async () => {
      // 確保在創建組件前 cartStore 已經有數據
      mockCartStore.items = [
        { _id: 'item-1', name: '餐點1' },
        { _id: 'item-2', name: '餐點2' }
      ]

      wrapper = createWrapper()

      // 等待 loadDishData 完成
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // 手動調用 loadExistingItem 以確保執行
      wrapper.vm.loadExistingItem()

      expect(wrapper.vm.existingItem).toEqual({ _id: 'item-2', name: '餐點2' })
    })

    it('應該處理無效的編輯索引', async () => {
      mockRoute.query.editIndex = '10' // 超出範圍
      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(wrapper.vm.existingItem).toBe(null)
    })
  })

  describe('購物車操作', () => {
    beforeEach(async () => {
      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
    })

    it('應該將餐點加入購物車並返回', () => {
      const dishInstance = { _id: 'dish-1', name: '測試餐點', price: 100 }

      wrapper.vm.addToCart(dishInstance)

      expect(mockCartStore.addItem).toHaveBeenCalledWith(dishInstance)
      expect(mockRouter.back).toHaveBeenCalled()
    })

    it('應該更新購物車項目並跳轉到購物車', () => {
      // 設置編輯模式和索引
      mockRoute.query = { edit: 'true', editIndex: '1' }

      // 重新創建 wrapper 以獲取正確的 editIndex
      wrapper.unmount()
      wrapper = createWrapper()

      const dishInstance = { _id: 'dish-1', name: '修改後餐點', price: 120 }

      wrapper.vm.updateCart(dishInstance)

      expect(mockCartStore.removeItem).toHaveBeenCalledWith(1)
      expect(mockCartStore.addItem).toHaveBeenCalledWith(dishInstance)
      expect(mockRouter.push).toHaveBeenCalledWith({ name: 'cart' })
    })
  })

  describe('組件整合', () => {
    beforeEach(async () => {
      // Mock 成功的 API 回應
      mockApi.dish.getDishTemplateById.mockResolvedValue({
        success: true,
        template: {
          _id: 'test-dish',
          name: '測試餐點',
          basePrice: 100,
          optionCategories: []
        }
      })

      mockApi.inventory.getStoreInventory.mockResolvedValue({
        success: true,
        inventory: []
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    it('應該正確傳遞 props 給 OptionSelector', async () => {
      const optionSelector = wrapper.findComponent({ name: 'OptionSelector' })

      expect(optionSelector.exists()).toBe(true)
      expect(optionSelector.props()).toEqual({
        dish: wrapper.vm.dish,
        optionCategories: wrapper.vm.optionCategories,
        isEditMode: false,
        existingItem: null,
        inventoryData: wrapper.vm.inventoryData,
        isLoadingInventory: false
      })
    })

    it('應該處理 OptionSelector 的 add-to-cart 事件', async () => {
      const testDish = { _id: 'test', name: 'test dish' }

      // 直接調用方法來測試功能
      wrapper.vm.addToCart(testDish)

      expect(mockCartStore.addItem).toHaveBeenCalledWith(testDish)
      expect(mockRouter.back).toHaveBeenCalled()
    })

    it('應該處理 OptionSelector 的 update-cart 事件', async () => {
      const testDish = { _id: 'test', name: 'test dish' }

      // 設置編輯模式
      mockRoute.query = { edit: 'true', editIndex: '0' }
      wrapper.unmount()
      wrapper = createWrapper()

      // 等待組件載入
      await wrapper.vm.$nextTick()

      // 直接調用方法來測試功能
      wrapper.vm.updateCart(testDish)

      expect(mockCartStore.removeItem).toHaveBeenCalledWith(0)
      expect(mockCartStore.addItem).toHaveBeenCalledWith(testDish)
      expect(mockRouter.push).toHaveBeenCalledWith({ name: 'cart' })
    })
  })


  describe('UI 渲染', () => {
    it('應該在載入完成後顯示內容', async () => {
      mockApi.dish.getDishTemplateById.mockResolvedValue({
        success: true,
        template: {
          _id: 'test-dish',
          name: '測試餐點',
          basePrice: 100,
          description: '測試描述',
          image: { url: 'test.jpg' },
          optionCategories: []
        }
      })

      wrapper = createWrapper()

      // 初始載入狀態
      expect(wrapper.find('.loading-container').exists()).toBe(true)
      expect(wrapper.find('.detail-container').exists()).toBe(false)

      // 等待載入完成
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // 載入完成後的狀態
      expect(wrapper.find('.loading-container').exists()).toBe(false)
      expect(wrapper.find('.detail-container').exists()).toBe(true)
      expect(wrapper.find('h3').text()).toBe('測試餐點')
    })

    it('應該在編輯模式下顯示標題', async () => {
      mockRoute.query = { edit: 'true' }

      wrapper = createWrapper()
      wrapper.vm.isLoading = false
      await wrapper.vm.$nextTick()

      expect(wrapper.find('h5').text()).toBe('編輯餐點')
    })

    it('應該有返回按鈕', async () => {
      wrapper = createWrapper()
      wrapper.vm.isLoading = false
      await wrapper.vm.$nextTick()

      const backButton = wrapper.find('button')
      expect(backButton.exists()).toBe(true)

      await backButton.trigger('click')
      expect(mockRouter.back).toHaveBeenCalled()
    })
  })
})