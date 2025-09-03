/**
 * 菜單服務測試
 * 測試菜單相關業務邏輯功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock 所有外部依賴
vi.mock('@server/models/Menu/Menu.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Store/Store.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Dish/DishTemplate.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Promotion/Bundle.js', () => ({ default: vi.fn() }))

vi.mock('@server/middlewares/error.js', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode = 500) {
      super(message)
      this.statusCode = statusCode
      this.name = 'AppError'
    }
  }
}))

// 動態導入服務和依賴
const menuService = await import('@server/services/store/menuService.js')
const Menu = (await import('@server/models/Menu/Menu.js')).default
const Store = (await import('@server/models/Store/Store.js')).default
const DishTemplate = (await import('@server/models/Dish/DishTemplate.js')).default
const Bundle = (await import('@server/models/Promotion/Bundle.js')).default
const { AppError } = await import('@server/middlewares/error.js')

// 測試資料工廠擴展
TestDataFactory.createMenuData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439020',
  name: 'Test Menu',
  store: '507f1f77bcf86cd799439014',
  menuType: 'food',
  categories: [
    {
      name: '主餐',
      items: [
        {
          dishTemplate: '507f1f77bcf86cd799439016',
          isShowing: true
        }
      ],
      toObject: vi.fn().mockReturnValue({
        name: '主餐',
        items: [
          {
            dishTemplate: '507f1f77bcf86cd799439016',
            isShowing: true
          }
        ]
      })
    }
  ],
  isActive: true,
  createdAt: new Date(),
  toObject: vi.fn().mockReturnValue(overrides),
  ...overrides
})

TestDataFactory.createStoreData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439014',
  name: 'Test Store',
  brand: '507f1f77bcf86cd799439013',
  ...overrides
})

TestDataFactory.createDishTemplateData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439016',
  name: 'Test Dish',
  description: 'Test dish description',
  basePrice: 150,
  image: 'test-dish.jpg',
  tags: [],
  optionCategories: [],
  ...overrides
})

TestDataFactory.createBundleData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439021',
  name: 'Test Bundle',
  description: 'Test bundle description',
  image: 'test-bundle.jpg',
  sellingPoint: 'Special offer',
  cashPrice: 200,
  pointPrice: 100,
  bundleItems: [],
  ...overrides
})

// Mock 查詢鏈
const createMockQueryChain = (resolvedValue = []) => ({
  populate: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue(resolvedValue)
})

describe('MenuService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllStoreMenus', () => {
    it('should return all store menus successfully', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const mockStore = TestDataFactory.createStoreData()
      const mockMenus = [
        TestDataFactory.createMenuData(),
        TestDataFactory.createMenuData({ _id: '507f1f77bcf86cd799439022', name: 'Menu 2' })
      ]

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      
      const mockQuery = createMockQueryChain()
      mockQuery.populate.mockReturnValue({
        ...mockQuery,
        sort: vi.fn().mockResolvedValue(mockMenus)
      })
      
      Menu.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await menuService.getAllStoreMenus(storeId)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(Menu.find).toHaveBeenCalledWith({ store: storeId })
      expect(result).toEqual(mockMenus)
    })

    it('should throw error when store not found', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      Store.findById = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(menuService.getAllStoreMenus(storeId))
        .rejects.toThrow('店鋪不存在')
    })

    it('should filter by activeOnly option', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const mockStore = TestDataFactory.createStoreData()
      const mockMenus = [TestDataFactory.createMenuData()]

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      
      const mockQuery = createMockQueryChain()
      mockQuery.populate.mockReturnValue({
        ...mockQuery,
        sort: vi.fn().mockResolvedValue(mockMenus)
      })
      
      Menu.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      await menuService.getAllStoreMenus(storeId, { activeOnly: true })

      // Assert
      expect(Menu.find).toHaveBeenCalledWith({ 
        store: storeId, 
        isActive: true 
      })
    })

    it('should filter by menuType option', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuType = 'cash_coupon'
      const mockStore = TestDataFactory.createStoreData()
      const mockMenus = [TestDataFactory.createMenuData({ menuType })]

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      
      const mockQuery = createMockQueryChain()
      mockQuery.populate.mockReturnValue({
        ...mockQuery,
        sort: vi.fn().mockResolvedValue(mockMenus)
      })
      
      Menu.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      await menuService.getAllStoreMenus(storeId, { menuType })

      // Assert
      expect(Menu.find).toHaveBeenCalledWith({ 
        store: storeId, 
        menuType 
      })
    })

    it('should filter unpublished items when includeUnpublished is false', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const mockStore = TestDataFactory.createStoreData()
      const mockMenus = [{
        categories: [{
          name: '主餐',
          items: [
            { isShowing: true, name: 'Published Item' },
            { isShowing: false, name: 'Unpublished Item' }
          ],
          toObject: vi.fn().mockReturnValue({
            name: '主餐',
            items: [
              { isShowing: true, name: 'Published Item' },
              { isShowing: false, name: 'Unpublished Item' }
            ]
          })
        }]
      }]

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      
      const mockQuery = createMockQueryChain()
      mockQuery.populate.mockReturnValue({
        ...mockQuery,
        sort: vi.fn().mockResolvedValue(mockMenus)
      })
      
      Menu.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await menuService.getAllStoreMenus(storeId, { includeUnpublished: false })

      // Assert
      expect(result[0].categories[0].items).toHaveLength(1)
      expect(result[0].categories[0].items[0].name).toBe('Published Item')
    })
  })

  describe('getMenuById', () => {
    it('should return menu by id successfully', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuId = '507f1f77bcf86cd799439020'
      const mockStore = TestDataFactory.createStoreData()
      const mockMenu = TestDataFactory.createMenuData({ _id: menuId })

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      
      const mockQuery = createMockQueryChain()
      mockQuery.populate = vi.fn().mockResolvedValue(mockMenu)
      Menu.findOne = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await menuService.getMenuById(storeId, menuId)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(Menu.findOne).toHaveBeenCalledWith({ _id: menuId, store: storeId })
      expect(result).toEqual(mockMenu)
    })

    it('should throw error when store not found', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuId = '507f1f77bcf86cd799439020'
      Store.findById = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(menuService.getMenuById(storeId, menuId))
        .rejects.toThrow('店鋪不存在')
    })

    it('should throw error when menu not found', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuId = '507f1f77bcf86cd799439020'
      const mockStore = TestDataFactory.createStoreData()

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      
      const mockQuery = createMockQueryChain()
      mockQuery.populate = vi.fn().mockResolvedValue(null)
      Menu.findOne = vi.fn().mockReturnValue(mockQuery)

      // Act & Assert
      await expect(menuService.getMenuById(storeId, menuId))
        .rejects.toThrow('菜單不存在')
    })
  })

  describe('createMenu', () => {
    it('should create menu successfully', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuData = {
        name: 'New Menu',
        menuType: 'food',
        isActive: true
      }
      const mockStore = TestDataFactory.createStoreData()
      const mockCreatedMenu = TestDataFactory.createMenuData(menuData)

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      Menu.findOne = vi.fn().mockResolvedValue(null) // 沒有現有啟用菜單
      
      // Mock Menu constructor and save
      const mockMenuInstance = {
        ...mockCreatedMenu,
        save: vi.fn().mockResolvedValue(mockCreatedMenu)
      }
      Menu.mockImplementation(() => mockMenuInstance)

      // Mock populate chain for return value
      const mockQuery = createMockQueryChain()
      mockQuery.populate = vi.fn().mockResolvedValue(mockCreatedMenu)
      Menu.findById = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await menuService.createMenu(storeId, menuData)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(Menu.findOne).toHaveBeenCalledWith({
        store: storeId,
        menuType: 'food',
        isActive: true
      })
      expect(mockMenuInstance.save).toHaveBeenCalled()
      expect(result).toEqual(mockCreatedMenu)
    })

    it('should throw error when store not found', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuData = { name: 'New Menu', menuType: 'food' }
      Store.findById = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(menuService.createMenu(storeId, menuData))
        .rejects.toThrow('店鋪不存在')
    })

    it('should throw error when same type active menu exists', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuData = {
        name: 'New Menu',
        menuType: 'food',
        isActive: true
      }
      const mockStore = TestDataFactory.createStoreData()
      const existingMenu = TestDataFactory.createMenuData({ 
        name: 'Existing Menu',
        menuType: 'food'
      })

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      Menu.findOne = vi.fn().mockResolvedValue(existingMenu)

      // Act & Assert
      await expect(menuService.createMenu(storeId, menuData))
        .rejects.toThrow('此店鋪已有啟用的「現金購買餐點」類型菜單')
    })
  })

  describe('updateMenu', () => {
    it('should update menu successfully', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuId = '507f1f77bcf86cd799439020'
      const updateData = { name: 'Updated Menu' }
      const mockStore = TestDataFactory.createStoreData()
      const currentMenu = TestDataFactory.createMenuData({ _id: menuId })
      const updatedMenu = TestDataFactory.createMenuData({ 
        _id: menuId, 
        ...updateData 
      })

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      Menu.findOne = vi.fn().mockResolvedValue(currentMenu)
      Menu.findOneAndUpdate = vi.fn().mockResolvedValue(updatedMenu)

      // Mock populate chain for return value
      const mockQuery = createMockQueryChain()
      mockQuery.populate = vi.fn().mockResolvedValue(updatedMenu)
      Menu.findById = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await menuService.updateMenu(storeId, menuId, updateData)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(Menu.findOne).toHaveBeenCalledWith({ _id: menuId, store: storeId })
      expect(Menu.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: menuId, store: storeId },
        updateData,
        { new: true, runValidators: true }
      )
      expect(result).toEqual(updatedMenu)
    })

    it('should throw error when store not found', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuId = '507f1f77bcf86cd799439020'
      const updateData = { name: 'Updated Menu' }
      Store.findById = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(menuService.updateMenu(storeId, menuId, updateData))
        .rejects.toThrow('店鋪不存在')
    })

    it('should throw error when menu not found', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuId = '507f1f77bcf86cd799439020'
      const updateData = { name: 'Updated Menu' }
      const mockStore = TestDataFactory.createStoreData()

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      Menu.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(menuService.updateMenu(storeId, menuId, updateData))
        .rejects.toThrow('菜單不存在或不屬於指定店鋪')
    })

    it('should handle activating menu and deactivate others of same type', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuId = '507f1f77bcf86cd799439020'
      const updateData = { isActive: true }
      const mockStore = TestDataFactory.createStoreData()
      const currentMenu = TestDataFactory.createMenuData({ 
        _id: menuId, 
        isActive: false,
        menuType: 'food'
      })
      const updatedMenu = TestDataFactory.createMenuData({ 
        _id: menuId, 
        isActive: true 
      })

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      Menu.findOne = vi.fn()
        .mockResolvedValueOnce(currentMenu) // 第一次調用：獲取當前菜單
        .mockResolvedValueOnce(TestDataFactory.createMenuData({ name: 'Other Active Menu' })) // 第二次調用：檢查其他啟用菜單
      
      Menu.updateMany = vi.fn().mockResolvedValue({})
      Menu.findOneAndUpdate = vi.fn().mockResolvedValue(updatedMenu)

      // Mock populate chain for return value
      const mockQuery = createMockQueryChain()
      mockQuery.populate = vi.fn().mockResolvedValue(updatedMenu)
      Menu.findById = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await menuService.updateMenu(storeId, menuId, updateData)

      // Assert
      expect(Menu.updateMany).toHaveBeenCalledWith(
        {
          store: storeId,
          menuType: 'food',
          isActive: true,
          _id: { $ne: menuId }
        },
        { isActive: false }
      )
      expect(result).toEqual(updatedMenu)
    })
  })

  describe('deleteMenu', () => {
    it('should delete menu successfully', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuId = '507f1f77bcf86cd799439020'
      const mockStore = TestDataFactory.createStoreData()
      const mockMenu = TestDataFactory.createMenuData({ _id: menuId })

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      Menu.findOneAndDelete = vi.fn().mockResolvedValue(mockMenu)

      // Act
      const result = await menuService.deleteMenu(storeId, menuId)

      // Assert
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(Menu.findOneAndDelete).toHaveBeenCalledWith({
        _id: menuId,
        store: storeId
      })
      expect(result).toBe('菜單已刪除')
    })

    it('should throw error when store not found', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuId = '507f1f77bcf86cd799439020'
      Store.findById = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(menuService.deleteMenu(storeId, menuId))
        .rejects.toThrow('店鋪不存在')
    })

    it('should throw error when menu not found', async () => {
      // Arrange
      const storeId = '507f1f77bcf86cd799439014'
      const menuId = '507f1f77bcf86cd799439020'
      const mockStore = TestDataFactory.createStoreData()

      Store.findById = vi.fn().mockResolvedValue(mockStore)
      Menu.findOneAndDelete = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(menuService.deleteMenu(storeId, menuId))
        .rejects.toThrow('菜單不存在或不屬於指定店鋪')
    })
  })
})