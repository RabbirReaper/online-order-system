import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCounterDishTemplatesStore } from '@/stores/counter/dishTemplates.js'

// Mock API 模組
vi.mock('@/api', () => ({
  default: {
    dish: {
      getAllDishTemplates: vi.fn(),
      getAllOptionCategories: vi.fn(),
    },
    menu: {
      getAllStoreMenus: vi.fn(),
    },
  },
}))

describe('Counter Dish Templates Store', () => {
  let store
  let mockApi

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useCounterDishTemplatesStore()

    // 取得 mock API
    const api = await import('@/api')
    mockApi = api.default

    vi.clearAllMocks()
  })

  describe('初始狀態', () => {
    it('應該有正確的初始狀態', () => {
      expect(store.dishTemplates).toEqual([])
      expect(store.optionCategories).toEqual([])
      expect(store.menuData).toBeNull()
    })
  })

  describe('fetchDishTemplates', () => {
    const mockDishTemplates = [
      {
        _id: 'template1',
        name: '漢堡',
        price: 150,
        optionCategories: [{ categoryId: 'cat1' }],
      },
      {
        _id: 'template2',
        name: '薯條',
        price: 80,
        optionCategories: [],
      },
    ]

    it('應該成功載入餐點模板', async () => {
      // Arrange
      mockApi.dish.getAllDishTemplates.mockResolvedValue({
        success: true,
        templates: mockDishTemplates,
      })

      // Act
      await store.fetchDishTemplates('brand123')

      // Assert
      expect(mockApi.dish.getAllDishTemplates).toHaveBeenCalledWith({ brandId: 'brand123' })
      expect(store.dishTemplates).toEqual(mockDishTemplates)
    })

    it('當 API 回傳失敗時應該處理錯誤', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockApi.dish.getAllDishTemplates.mockResolvedValue({
        success: false,
        message: 'API 錯誤',
      })

      // Act
      await store.fetchDishTemplates('brand123')

      // Assert
      expect(store.dishTemplates).toEqual([])
      consoleErrorSpy.mockRestore()
    })

    it('當 API 拋出異常時應該處理錯誤', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('網路錯誤')
      mockApi.dish.getAllDishTemplates.mockRejectedValue(error)

      // Act
      await store.fetchDishTemplates('brand123')

      // Assert
      expect(store.dishTemplates).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalledWith('載入餐點模板失敗:', error)
      consoleErrorSpy.mockRestore()
    })
  })

  describe('fetchOptionCategoriesWithOptions', () => {
    const mockOptionCategories = [
      {
        _id: 'cat1',
        name: '套餐選項',
        inputType: 'single',
        options: [
          {
            _id: 'opt1',
            refOption: {
              _id: 'refOpt1',
              name: '薯條',
              price: 30,
            },
          },
        ],
      },
      {
        _id: 'cat2',
        name: '飲料選項',
        inputType: 'multiple',
        options: [
          {
            _id: 'opt2',
            name: '可樂',
            price: 25,
          },
        ],
      },
    ]

    it('應該成功載入選項類別', async () => {
      // Arrange
      mockApi.dish.getAllOptionCategories.mockResolvedValue({
        success: true,
        categories: mockOptionCategories,
      })

      // Act
      await store.fetchOptionCategoriesWithOptions('brand123')

      // Assert
      expect(mockApi.dish.getAllOptionCategories).toHaveBeenCalledWith('brand123')
      expect(store.optionCategories).toEqual(mockOptionCategories)
    })

    it('當 API 回傳失敗時應該處理錯誤', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockApi.dish.getAllOptionCategories.mockResolvedValue({
        success: false,
      })

      // Act
      await store.fetchOptionCategoriesWithOptions('brand123')

      // Assert
      expect(store.optionCategories).toEqual([])
      consoleErrorSpy.mockRestore()
    })

    it('當 API 拋出異常時應該處理錯誤', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('網路錯誤')
      mockApi.dish.getAllOptionCategories.mockRejectedValue(error)

      // Act
      await store.fetchOptionCategoriesWithOptions('brand123')

      // Assert
      expect(store.optionCategories).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalledWith('載入選項類別失敗:', error)
      consoleErrorSpy.mockRestore()
    })
  })

  describe('fetchMenuData', () => {
    const mockMenuData = {
      _id: 'menu1',
      menuType: 'food',
      categories: [
        {
          _id: 'category2',
          name: '飲料',
          order: 2,
          items: [
            { _id: 'item3', name: '可樂', order: 2 },
            { _id: 'item4', name: '雪碧', order: 1 },
          ],
        },
        {
          _id: 'category1',
          name: '主餐',
          order: 1,
          items: [
            { _id: 'item1', name: '漢堡', order: 1 },
            { _id: 'item2', name: '薯條', order: 3 },
          ],
        },
      ],
    }

    it('應該成功載入菜單資料並進行排序', async () => {
      // Arrange
      mockApi.menu.getAllStoreMenus.mockResolvedValue({
        success: true,
        menus: [mockMenuData],
      })

      mockApi.dish.getAllDishTemplates.mockResolvedValue({
        success: true,
        templates: [],
      })

      mockApi.dish.getAllOptionCategories.mockResolvedValue({
        success: true,
        categories: [],
      })

      // Act
      await store.fetchMenuData('brand123', 'store123')

      // Assert
      expect(mockApi.menu.getAllStoreMenus).toHaveBeenCalledWith({
        brandId: 'brand123',
        storeId: 'store123',
        includeUnpublished: false,
        activeOnly: true,
        menuType: 'food',
      })

      expect(store.menuData).toBeDefined()
      expect(store.menuData.categories).toHaveLength(2)

      // 驗證分類排序（order: 1, 2）
      expect(store.menuData.categories[0].name).toBe('主餐')
      expect(store.menuData.categories[1].name).toBe('飲料')

      // 驗證商品排序
      expect(store.menuData.categories[0].items[0].name).toBe('漢堡') // order: 1
      expect(store.menuData.categories[0].items[1].name).toBe('薯條') // order: 3
      expect(store.menuData.categories[1].items[0].name).toBe('雪碧') // order: 1
      expect(store.menuData.categories[1].items[1].name).toBe('可樂') // order: 2

      // 驗證其他 API 被調用
      expect(mockApi.dish.getAllDishTemplates).toHaveBeenCalledWith({ brandId: 'brand123' })
      expect(mockApi.dish.getAllOptionCategories).toHaveBeenCalledWith('brand123')
    })

    it('當沒有找到 food 類型菜單時應該設置空菜單', async () => {
      // Arrange
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const drinkMenu = { ...mockMenuData, menuType: 'drink' }
      mockApi.menu.getAllStoreMenus.mockResolvedValue({
        success: true,
        menus: [drinkMenu],
      })

      // Act
      await store.fetchMenuData('brand123', 'store123')

      // Assert
      expect(store.menuData).toEqual({ categories: [] })
      expect(consoleWarnSpy).toHaveBeenCalledWith('沒有找到現金購買餐點菜單')
      consoleWarnSpy.mockRestore()
    })

    it('當沒有啟用的菜單時應該設置空菜單', async () => {
      // Arrange
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockApi.menu.getAllStoreMenus.mockResolvedValue({
        success: true,
        menus: [],
      })

      // Act
      await store.fetchMenuData('brand123', 'store123')

      // Assert
      expect(store.menuData).toEqual({ categories: [] })
      expect(consoleWarnSpy).toHaveBeenCalledWith('沒有找到啟用的菜單')
      consoleWarnSpy.mockRestore()
    })

    it('當 API 調用失敗時應該拋出錯誤', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('API 錯誤')
      mockApi.menu.getAllStoreMenus.mockRejectedValue(error)

      // Act & Assert
      await expect(store.fetchMenuData('brand123', 'store123')).rejects.toThrow('API 錯誤')
      expect(consoleErrorSpy).toHaveBeenCalledWith('載入菜單資料失敗:', error)
      consoleErrorSpy.mockRestore()
    })

    it('應該處理沒有分類或商品的菜單資料', async () => {
      // Arrange
      const menuWithoutCategories = {
        _id: 'menu2',
        menuType: 'food',
      }
      mockApi.menu.getAllStoreMenus.mockResolvedValue({
        success: true,
        menus: [menuWithoutCategories],
      })

      mockApi.dish.getAllDishTemplates.mockResolvedValue({
        success: true,
        templates: [],
      })

      mockApi.dish.getAllOptionCategories.mockResolvedValue({
        success: true,
        categories: [],
      })

      // Act
      await store.fetchMenuData('brand123', 'store123')

      // Assert
      expect(store.menuData).toEqual(menuWithoutCategories)
      expect(mockApi.dish.getAllDishTemplates).toHaveBeenCalledWith({ brandId: 'brand123' })
      expect(mockApi.dish.getAllOptionCategories).toHaveBeenCalledWith('brand123')
    })
  })

  describe('getDishTemplate', () => {
    beforeEach(() => {
      store.dishTemplates = [
        { _id: 'template1', name: '漢堡', price: 150 },
        { _id: 'template2', name: '薯條', price: 80 },
        { _id: 'template3', name: '可樂', price: 50 },
      ]
    })

    it('應該根據 ID 正確返回餐點模板', () => {
      // Act
      const template = store.getDishTemplate('template2')

      // Assert
      expect(template).toEqual({ _id: 'template2', name: '薯條', price: 80 })
    })

    it('當找不到模板時應該返回 undefined', () => {
      // Act
      const template = store.getDishTemplate('nonexistent')

      // Assert
      expect(template).toBeUndefined()
    })

    it('當傳入 null 或 undefined 時應該返回 undefined', () => {
      // Act & Assert
      expect(store.getDishTemplate(null)).toBeUndefined()
      expect(store.getDishTemplate(undefined)).toBeUndefined()
    })
  })

  describe('getDefaultOptionsForDish', () => {
    beforeEach(() => {
      store.optionCategories = [
        {
          _id: 'cat1',
          name: '套餐選項',
          inputType: 'single',
          options: [
            {
              _id: 'opt1',
              refOption: {
                _id: 'refOpt1',
                name: '薯條',
                price: 30,
              },
            },
            {
              _id: 'opt2',
              refOption: {
                _id: 'refOpt2',
                name: '沙拉',
                price: 40,
              },
            },
          ],
        },
        {
          _id: 'cat2',
          name: '飲料選項',
          inputType: 'multiple', // 不應該產生預設選項
          options: [
            {
              _id: 'opt3',
              name: '可樂',
              price: 25,
            },
          ],
        },
        {
          _id: 'cat3',
          name: '調味料',
          inputType: 'single',
          options: [
            {
              _id: 'opt4',
              name: '番茄醬',
              price: 0, // 免費選項
            },
          ],
        },
      ]
    })

    it('應該為 single 類型的選項類別生成預設選項', () => {
      // Arrange
      const dishTemplate = {
        _id: 'template1',
        name: '漢堡',
        optionCategories: [{ categoryId: 'cat1' }, { categoryId: 'cat3' }],
      }

      // Act
      const defaultOptions = store.getDefaultOptionsForDish(dishTemplate)

      // Assert
      expect(defaultOptions).toHaveLength(2)

      // 第一個預設選項（cat1 的第一個選項）
      expect(defaultOptions[0]).toEqual({
        optionCategoryId: 'cat1',
        optionCategoryName: '套餐選項',
        selections: [
          {
            optionId: 'refOpt1',
            name: '薯條',
            price: 30,
          },
        ],
      })

      // 第二個預設選項（cat3 的第一個選項）
      expect(defaultOptions[1]).toEqual({
        optionCategoryId: 'cat3',
        optionCategoryName: '調味料',
        selections: [
          {
            optionId: 'opt4',
            name: '番茄醬',
            price: 0,
          },
        ],
      })
    })

    it('應該跳過 multiple 類型的選項類別', () => {
      // Arrange
      const dishTemplate = {
        _id: 'template1',
        name: '漢堡',
        optionCategories: [
          { categoryId: 'cat2' }, // multiple 類型
        ],
      }

      // Act
      const defaultOptions = store.getDefaultOptionsForDish(dishTemplate)

      // Assert
      expect(defaultOptions).toEqual([])
    })

    it('應該處理沒有 refOption 的選項', () => {
      // Arrange
      store.optionCategories.push({
        _id: 'cat4',
        name: '尺寸',
        inputType: 'single',
        options: [
          {
            _id: 'opt5',
            name: '大杯',
            price: 10,
            // 沒有 refOption
          },
        ],
      })

      const dishTemplate = {
        _id: 'template1',
        name: '飲料',
        optionCategories: [{ categoryId: 'cat4' }],
      }

      // Act
      const defaultOptions = store.getDefaultOptionsForDish(dishTemplate)

      // Assert
      expect(defaultOptions[0].selections[0]).toEqual({
        optionId: 'opt5',
        name: '大杯',
        price: 10,
      })
    })

    it('應該處理找不到選項類別的情況', () => {
      // Arrange
      const dishTemplate = {
        _id: 'template1',
        name: '漢堡',
        optionCategories: [{ categoryId: 'nonexistent' }],
      }

      // Act
      const defaultOptions = store.getDefaultOptionsForDish(dishTemplate)

      // Assert
      expect(defaultOptions).toEqual([])
    })

    it('應該處理沒有選項類別的菜品', () => {
      // Arrange
      const dishTemplate = {
        _id: 'template1',
        name: '簡單漢堡',
      }

      // Act
      const defaultOptions = store.getDefaultOptionsForDish(dishTemplate)

      // Assert
      expect(defaultOptions).toEqual([])
    })

    it('應該處理選項類別沒有選項的情況', () => {
      // Arrange
      store.optionCategories.push({
        _id: 'cat5',
        name: '空選項類別',
        inputType: 'single',
        options: [],
      })

      const dishTemplate = {
        _id: 'template1',
        name: '漢堡',
        optionCategories: [{ categoryId: 'cat5' }],
      }

      // Act
      const defaultOptions = store.getDefaultOptionsForDish(dishTemplate)

      // Assert
      expect(defaultOptions).toEqual([])
    })

    it('應該處理價格為 null 或 undefined 的選項', () => {
      // Arrange
      store.optionCategories.push({
        _id: 'cat6',
        name: '特殊選項',
        inputType: 'single',
        options: [
          {
            _id: 'opt6',
            refOption: {
              _id: 'refOpt6',
              name: '特殊配菜',
              price: null,
            },
          },
        ],
      })

      const dishTemplate = {
        _id: 'template1',
        name: '漢堡',
        optionCategories: [{ categoryId: 'cat6' }],
      }

      // Act
      const defaultOptions = store.getDefaultOptionsForDish(dishTemplate)

      // Assert
      expect(defaultOptions[0].selections[0].price).toBe(0)
    })
  })
})
