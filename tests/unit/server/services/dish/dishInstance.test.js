/**
 * 餐點實例服務測試
 * 測試餐點實例相關業務邏輯功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock 所有外部依賴
vi.mock('@server/models/Dish/DishInstance.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Dish/DishTemplate.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Dish/Option.js', () => ({ default: vi.fn() }))

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
const dishInstanceService = await import('@server/services/dish/dishInstance.js')
const DishInstance = (await import('@server/models/Dish/DishInstance.js')).default
const DishTemplate = (await import('@server/models/Dish/DishTemplate.js')).default
const Option = (await import('@server/models/Dish/Option.js')).default
const { AppError } = await import('@server/middlewares/error.js')

// 測試資料工廠擴展
TestDataFactory.createDishInstanceData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439018',
  templateId: '507f1f77bcf86cd799439016',
  name: 'Test Dish Instance',
  basePrice: 150,
  finalPrice: 180,
  options: [
    {
      optionCategoryId: '507f1f77bcf86cd799439030',
      name: 'Size',
      selections: [
        {
          optionId: '507f1f77bcf86cd799439031',
          name: 'Large',
          price: 30
        }
      ]
    }
  ],
  specialInstructions: 'No spicy',
  createdAt: new Date(),
  ...overrides
})

TestDataFactory.createDishTemplateData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439016',
  name: 'Test Template',
  basePrice: 150,
  brand: '507f1f77bcf86cd799439013',
  ...overrides
})

TestDataFactory.createOptionData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439031',
  name: 'Large',
  price: 30,
  categoryId: '507f1f77bcf86cd799439030',
  ...overrides
})

// Mock 查詢鏈
const mockQueryChain = () => ({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  populate: vi.fn().mockResolvedValue([])
})

describe('DishInstance Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // 重置 Model Mock
    DishInstance.mockImplementation((data) => ({
      ...data,
      save: vi.fn().mockResolvedValue()
    }))

    DishInstance.countDocuments = vi.fn().mockResolvedValue(0)
    DishInstance.find = vi.fn().mockImplementation(() => mockQueryChain())
    DishInstance.findById = vi.fn().mockImplementation((id) => ({
      populate: vi.fn().mockResolvedValue(null)
    }))

    DishTemplate.findById = vi.fn().mockResolvedValue(null)
    Option.findById = vi.fn().mockResolvedValue(null)
  })

  describe('getAllInstances', () => {
    it('should get all instances with pagination successfully', async () => {
      // Arrange
      const mockInstances = [
        TestDataFactory.createDishInstanceData(),
        TestDataFactory.createDishInstanceData({ _id: '507f1f77bcf86cd799439019' })
      ]
      DishInstance.countDocuments.mockResolvedValue(2)
      DishInstance.find.mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue(mockInstances)
      })

      // Act
      const result = await dishInstanceService.getAllInstances()

      // Assert
      expect(result.instances).toEqual(mockInstances)
      expect(result.pagination).toMatchObject({
        total: 2,
        totalPages: 1,
        currentPage: 1,
        limit: 20,
        hasNextPage: false,
        hasPrevPage: false
      })
      expect(DishInstance.find).toHaveBeenCalled()
    })

    it('should handle custom pagination options', async () => {
      // Arrange
      const options = { page: 2, limit: 5 }
      DishInstance.countDocuments.mockResolvedValue(12)
      DishInstance.find.mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue([])
      })

      // Act
      await dishInstanceService.getAllInstances(options)

      // Assert
      expect(DishInstance.find().skip).toHaveBeenCalledWith(5) // (2-1) * 5
      expect(DishInstance.find().limit).toHaveBeenCalledWith(5)
    })

    it('should return correct pagination info with multiple pages', async () => {
      // Arrange
      DishInstance.countDocuments.mockResolvedValue(25)
      DishInstance.find.mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue([])
      })

      // Act
      const result = await dishInstanceService.getAllInstances({ page: 2, limit: 10 })

      // Assert
      expect(result.pagination).toMatchObject({
        total: 25,
        totalPages: 3,
        currentPage: 2,
        hasNextPage: true,
        hasPrevPage: true
      })
    })
  })

  describe('getInstanceById', () => {
    it('should get instance by ID successfully', async () => {
      // Arrange
      const mockInstance = TestDataFactory.createDishInstanceData()
      DishInstance.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockInstance)
      })

      // Act
      const result = await dishInstanceService.getInstanceById('507f1f77bcf86cd799439018')

      // Assert
      expect(result).toEqual(mockInstance)
      expect(DishInstance.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439018')
    })

    it('should throw error when instance not found', async () => {
      // Arrange
      DishInstance.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      // Act & Assert
      await expect(dishInstanceService.getInstanceById('nonexistent'))
        .rejects.toThrow('餐點實例不存在')
    })
  })

  describe('createInstance', () => {
    it('should create instance successfully with basic data', async () => {
      // Arrange
      const mockTemplate = TestDataFactory.createDishTemplateData()
      const instanceData = {
        templateId: '507f1f77bcf86cd799439016'
      }
      
      DishTemplate.findById.mockResolvedValue(mockTemplate)
      const mockSave = vi.fn().mockResolvedValue()
      DishInstance.mockImplementation((data) => ({
        ...data,
        save: mockSave
      }))

      // Act
      const result = await dishInstanceService.createInstance(instanceData)

      // Assert
      expect(result.name).toBe(mockTemplate.name)
      expect(result.basePrice).toBe(mockTemplate.basePrice)
      expect(result.finalPrice).toBe(mockTemplate.basePrice)
      expect(mockSave).toHaveBeenCalled()
    })

    it('should create instance with options and calculate final price', async () => {
      // Arrange
      const mockTemplate = TestDataFactory.createDishTemplateData()
      const mockOption = TestDataFactory.createOptionData()
      const instanceData = {
        templateId: '507f1f77bcf86cd799439016',
        options: [
          {
            optionCategoryId: '507f1f77bcf86cd799439030',
            selections: [
              {
                optionId: '507f1f77bcf86cd799439031'
              }
            ]
          }
        ]
      }

      DishTemplate.findById.mockResolvedValue(mockTemplate)
      Option.findById.mockResolvedValue(mockOption)
      const mockSave = vi.fn().mockResolvedValue()
      DishInstance.mockImplementation((data) => ({
        ...data,
        save: mockSave
      }))

      // Act
      const result = await dishInstanceService.createInstance(instanceData)

      // Assert
      expect(result.finalPrice).toBe(mockTemplate.basePrice + mockOption.price)
      expect(result.options[0].selections[0].name).toBe(mockOption.name)
      expect(result.options[0].selections[0].price).toBe(mockOption.price)
    })

    it('should throw error when template ID is missing', async () => {
      // Act & Assert
      await expect(dishInstanceService.createInstance({}))
        .rejects.toThrow('餐點模板ID為必填欄位')
    })

    it('should throw error when template not found', async () => {
      // Arrange
      DishTemplate.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(dishInstanceService.createInstance({ templateId: 'nonexistent' }))
        .rejects.toThrow('餐點模板不存在')
    })

    it('should throw error when option category ID is missing', async () => {
      // Arrange
      const mockTemplate = TestDataFactory.createDishTemplateData()
      const instanceData = {
        templateId: '507f1f77bcf86cd799439016',
        options: [{ selections: [{ optionId: '507f1f77bcf86cd799439031' }] }]
      }

      DishTemplate.findById.mockResolvedValue(mockTemplate)

      // Act & Assert
      await expect(dishInstanceService.createInstance(instanceData))
        .rejects.toThrow('選項類別ID為必填欄位')
    })

    it('should throw error when option ID is missing', async () => {
      // Arrange
      const mockTemplate = TestDataFactory.createDishTemplateData()
      const instanceData = {
        templateId: '507f1f77bcf86cd799439016',
        options: [
          {
            optionCategoryId: '507f1f77bcf86cd799439030',
            selections: [{}]
          }
        ]
      }

      DishTemplate.findById.mockResolvedValue(mockTemplate)

      // Act & Assert
      await expect(dishInstanceService.createInstance(instanceData))
        .rejects.toThrow('選項ID為必填欄位')
    })

    it('should throw error when option not found', async () => {
      // Arrange
      const mockTemplate = TestDataFactory.createDishTemplateData()
      const instanceData = {
        templateId: '507f1f77bcf86cd799439016',
        options: [
          {
            optionCategoryId: '507f1f77bcf86cd799439030',
            selections: [{ optionId: 'nonexistent' }]
          }
        ]
      }

      DishTemplate.findById.mockResolvedValue(mockTemplate)
      Option.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(dishInstanceService.createInstance(instanceData))
        .rejects.toThrow('選項 nonexistent 不存在')
    })
  })

  describe('updateInstance', () => {
    it('should update instance successfully', async () => {
      // Arrange
      const mockInstance = {
        ...TestDataFactory.createDishInstanceData(),
        save: vi.fn().mockResolvedValue()
      }
      const mockOption = TestDataFactory.createOptionData()
      const updateData = {
        options: [
          {
            optionCategoryId: '507f1f77bcf86cd799439030',
            selections: [{ optionId: '507f1f77bcf86cd799439031' }]
          }
        ],
        specialInstructions: 'Extra sauce'
      }

      DishInstance.findById.mockResolvedValue(mockInstance)
      Option.findById.mockResolvedValue(mockOption)

      // Act
      const result = await dishInstanceService.updateInstance('507f1f77bcf86cd799439018', updateData)

      // Assert
      expect(result.options).toEqual(updateData.options)
      expect(result.specialInstructions).toBe('Extra sauce')
      expect(mockInstance.save).toHaveBeenCalled()
    })

    it('should throw error when instance not found', async () => {
      // Arrange
      DishInstance.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(dishInstanceService.updateInstance('nonexistent', {}))
        .rejects.toThrow('餐點實例不存在')
    })

    it('should throw error when option not found during update', async () => {
      // Arrange
      const mockInstance = {
        ...TestDataFactory.createDishInstanceData(),
        save: vi.fn().mockResolvedValue()
      }
      const updateData = {
        options: [
          {
            optionCategoryId: '507f1f77bcf86cd799439030',
            selections: [{ optionId: 'nonexistent' }]
          }
        ]
      }

      DishInstance.findById.mockResolvedValue(mockInstance)
      Option.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(dishInstanceService.updateInstance('507f1f77bcf86cd799439018', updateData))
        .rejects.toThrow('選項 nonexistent 不存在')
    })

    it('should not update special instructions when undefined passed', async () => {
      // Arrange
      const mockInstance = {
        ...TestDataFactory.createDishInstanceData(),
        specialInstructions: 'Original instruction',
        save: vi.fn().mockResolvedValue()
      }
      const updateData = {
        specialInstructions: undefined
      }

      DishInstance.findById.mockResolvedValue(mockInstance)

      // Act
      const result = await dishInstanceService.updateInstance('507f1f77bcf86cd799439018', updateData)

      // Assert
      expect(result.specialInstructions).toBe('Original instruction') // 保持原值
      expect(mockInstance.save).toHaveBeenCalled()
    })
  })

  describe('deleteInstance', () => {
    it('should delete instance successfully', async () => {
      // Arrange
      const mockInstance = {
        ...TestDataFactory.createDishInstanceData(),
        deleteOne: vi.fn().mockResolvedValue()
      }
      DishInstance.findById.mockResolvedValue(mockInstance)

      // Act
      const result = await dishInstanceService.deleteInstance('507f1f77bcf86cd799439018')

      // Assert
      expect(result).toEqual({ success: true, message: '餐點實例已刪除' })
      expect(mockInstance.deleteOne).toHaveBeenCalled()
    })

    it('should throw error when instance not found', async () => {
      // Arrange
      DishInstance.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(dishInstanceService.deleteInstance('nonexistent'))
        .rejects.toThrow('餐點實例不存在')
    })
  })

  describe('calculateFinalPrice', () => {
    it('should calculate final price with base price only', () => {
      // Arrange
      const instance = { basePrice: 150 }

      // Act
      const result = dishInstanceService.calculateFinalPrice(instance)

      // Assert
      expect(result).toBe(150)
    })

    it('should calculate final price with options', () => {
      // Arrange
      const instance = {
        basePrice: 150,
        options: [
          {
            selections: [
              { price: 30 },
              { price: 10 }
            ]
          },
          {
            selections: [
              { price: 20 }
            ]
          }
        ]
      }

      // Act
      const result = dishInstanceService.calculateFinalPrice(instance)

      // Assert
      expect(result).toBe(210) // 150 + 30 + 10 + 20
    })

    it('should handle options with no price', () => {
      // Arrange
      const instance = {
        basePrice: 150,
        options: [
          {
            selections: [
              { price: 30 },
              {} // no price property
            ]
          }
        ]
      }

      // Act
      const result = dishInstanceService.calculateFinalPrice(instance)

      // Assert
      expect(result).toBe(180) // 150 + 30 + 0
    })

    it('should handle empty options array', () => {
      // Arrange
      const instance = {
        basePrice: 150,
        options: []
      }

      // Act
      const result = dishInstanceService.calculateFinalPrice(instance)

      // Assert
      expect(result).toBe(150)
    })

    it('should handle no options property', () => {
      // Arrange
      const instance = { basePrice: 150 }

      // Act
      const result = dishInstanceService.calculateFinalPrice(instance)

      // Assert
      expect(result).toBe(150)
    })
  })
})