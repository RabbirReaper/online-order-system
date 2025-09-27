/**
 * 選項服務測試
 * 測試餐點選項相關業務邏輯功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock 所有外部依賴
vi.mock('@server/models/Dish/Option.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Dish/OptionCategory.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Dish/DishTemplate.js', () => ({ default: vi.fn() }))

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
const optionService = await import('@server/services/dish/optionService.js')
const Option = (await import('@server/models/Dish/Option.js')).default
const OptionCategory = (await import('@server/models/Dish/OptionCategory.js')).default
const DishTemplate = (await import('@server/models/Dish/DishTemplate.js')).default
const { AppError } = await import('@server/middlewares/error.js')

// 測試資料工廠擴展
TestDataFactory.createOptionData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439031',
  name: 'Small Size',
  price: 0,
  brand: '507f1f77bcf86cd799439013',
  refDishTemplate: '507f1f77bcf86cd799439032',
  tags: ['size'],
  isActive: true,
  createdAt: new Date(),
  toObject: vi.fn().mockReturnThis(),
  save: vi.fn().mockResolvedValue(),
  deleteOne: vi.fn().mockResolvedValue(),
  ...overrides
})

TestDataFactory.createOptionCategoryData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439030',
  name: 'Size Options',
  brand: '507f1f77bcf86cd799439013',
  inputType: 'radio',
  options: [
    {
      refOption: '507f1f77bcf86cd799439031',
      order: 1
    }
  ],
  ...overrides
})

TestDataFactory.createDishTemplateData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439032',
  name: 'Base Dish',
  brand: '507f1f77bcf86cd799439013',
  basePrice: 100,
  ...overrides
})

// Mock 查詢鏈
const createMockQueryChain = (resolvedValue = []) => ({
  sort: vi.fn().mockReturnThis(),
  populate: vi.fn().mockResolvedValue(resolvedValue),
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue(resolvedValue)
})

describe('OptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllOptions', () => {
    it('should return all options for a brand successfully', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const mockOptions = [
        TestDataFactory.createOptionData(),
        TestDataFactory.createOptionData({
          _id: '507f1f77bcf86cd799439033',
          name: 'Large Size',
          price: 50
        })
      ]

      // Mock 鏈式調用
      Option.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockOptions)
        })
      })

      // Act
      const result = await optionService.getAllOptions(brandId)

      // Assert
      expect(Option.find).toHaveBeenCalledWith({ brand: brandId })
      expect(result).toEqual(mockOptions)
    })

    it('should filter options by tags', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const tags = ['size', 'popular']
      const mockOptions = [TestDataFactory.createOptionData({ tags })]

      // Mock 鏈式調用
      Option.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockOptions)
        })
      })

      // Act
      const result = await optionService.getAllOptions(brandId, { tags })

      // Assert
      expect(Option.find).toHaveBeenCalledWith({
        brand: brandId,
        tags: { $in: tags }
      })
      expect(result).toEqual(mockOptions)
    })

    it('should filter options by category', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const categoryId = '507f1f77bcf86cd799439030'
      const mockCategory = TestDataFactory.createOptionCategoryData()
      const mockOptions = [TestDataFactory.createOptionData()]

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)

      // Mock 鏈式調用
      Option.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockOptions)
        })
      })

      // Act
      const result = await optionService.getAllOptions(brandId, { categoryId })

      // Assert
      expect(OptionCategory.findOne).toHaveBeenCalledWith({
        _id: categoryId,
        brand: brandId
      })
      expect(Option.find).toHaveBeenCalledWith({
        brand: brandId,
        _id: { $in: ['507f1f77bcf86cd799439031'] }
      })
      expect(result).toEqual(mockOptions)
    })

    it('should return empty array when category has no options', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const categoryId = '507f1f77bcf86cd799439030'
      const mockCategory = TestDataFactory.createOptionCategoryData({ options: [] })

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)

      // 當 options 為空陣列時，程式會執行 Option.find 但查詢條件是 _id: { $in: [] }
      // 這會返回空結果
      Option.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue([])
        })
      })

      // Act
      const result = await optionService.getAllOptions(brandId, { categoryId })

      // Assert
      expect(result).toEqual([])
      expect(Option.find).toHaveBeenCalledWith({
        brand: brandId,
        _id: { $in: [] } // 空陣列
      })
    })

    it('should return empty array when category does not exist', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const categoryId = '507f1f77bcf86cd799439030'

      OptionCategory.findOne = vi.fn().mockResolvedValue(null)

      // Act
      const result = await optionService.getAllOptions(brandId, { categoryId })

      // Assert
      expect(result).toEqual([])
      expect(Option.find).not.toHaveBeenCalled()
    })
  })

  describe('getOptionsByCategoryId', () => {
    it('should return options with order information', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const mockCategory = TestDataFactory.createOptionCategoryData()
      const mockOption = TestDataFactory.createOptionData()

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)

      const mockQuery = createMockQueryChain()
      mockQuery.populate = vi.fn().mockResolvedValue([mockOption])
      Option.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await optionService.getOptionsByCategoryId(categoryId, brandId)

      // Assert
      expect(OptionCategory.findOne).toHaveBeenCalledWith({
        _id: categoryId,
        brand: brandId
      })
      expect(Option.find).toHaveBeenCalledWith({
        _id: { $in: ['507f1f77bcf86cd799439031'] },
        brand: brandId
      })
      expect(result[0].order).toBe(1)
    })

    it('should throw error when category not found', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'

      OptionCategory.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(optionService.getOptionsByCategoryId(categoryId, brandId))
        .rejects.toThrow('選項類別不存在或無權訪問')
    })

    it('should return empty array when category has no options', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const mockCategory = TestDataFactory.createOptionCategoryData({ options: [] })

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)

      // Act
      const result = await optionService.getOptionsByCategoryId(categoryId, brandId)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('getOptionById', () => {
    it('should return option by id successfully', async () => {
      // Arrange
      const optionId = '507f1f77bcf86cd799439031'
      const brandId = '507f1f77bcf86cd799439013'
      const mockOption = TestDataFactory.createOptionData({ _id: optionId })

      const mockQuery = createMockQueryChain()
      mockQuery.populate = vi.fn().mockResolvedValue(mockOption)
      Option.findOne = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await optionService.getOptionById(optionId, brandId)

      // Assert
      expect(Option.findOne).toHaveBeenCalledWith({
        _id: optionId,
        brand: brandId
      })
      expect(mockQuery.populate).toHaveBeenCalledWith('refDishTemplate', 'name')
      expect(result).toEqual(mockOption)
    })

    it('should throw error when option not found', async () => {
      // Arrange
      const optionId = '507f1f77bcf86cd799439031'
      const brandId = '507f1f77bcf86cd799439013'

      const mockQuery = createMockQueryChain()
      mockQuery.populate = vi.fn().mockResolvedValue(null)
      Option.findOne = vi.fn().mockReturnValue(mockQuery)

      // Act & Assert
      await expect(optionService.getOptionById(optionId, brandId))
        .rejects.toThrow('選項不存在或無權訪問')
    })
  })

  describe('createOption', () => {
    it('should create option successfully', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const optionData = {
        name: 'Medium Size',
        price: 25,
        refDishTemplate: '507f1f77bcf86cd799439032',
        tags: ['size']
      }
      const mockTemplate = TestDataFactory.createDishTemplateData()
      const mockCreatedOption = TestDataFactory.createOptionData(optionData)

      DishTemplate.findOne = vi.fn().mockResolvedValue(mockTemplate)
      Option.findOne = vi.fn().mockResolvedValue(null) // 名稱不重複

      // Mock Option constructor
      const mockOptionInstance = {
        ...mockCreatedOption,
        save: vi.fn().mockResolvedValue(mockCreatedOption)
      }
      Option.mockImplementation(() => mockOptionInstance)

      // Act
      const result = await optionService.createOption(optionData, brandId)

      // Assert
      expect(DishTemplate.findOne).toHaveBeenCalledWith({
        _id: optionData.refDishTemplate,
        brand: brandId
      })
      expect(Option.findOne).toHaveBeenCalledWith({
        name: optionData.name,
        brand: brandId
      })
      expect(mockOptionInstance.save).toHaveBeenCalled()
      expect(result.name).toBe('Medium Size')
      expect(result.brand).toBe(brandId)
    })

    it('should throw error when name is missing', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const optionData = { price: 25 }

      // Act & Assert
      await expect(optionService.createOption(optionData, brandId))
        .rejects.toThrow('選項名稱為必填欄位')
    })

    it('should throw error when dish template not found', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const optionData = {
        name: 'Medium Size',
        refDishTemplate: '507f1f77bcf86cd799439032'
      }

      DishTemplate.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(optionService.createOption(optionData, brandId))
        .rejects.toThrow('關聯的餐點模板不存在或不屬於此品牌')
    })

    it('should throw error when option name already exists', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const optionData = {
        name: 'Existing Option',
        refDishTemplate: '507f1f77bcf86cd799439032'
      }
      const mockTemplate = TestDataFactory.createDishTemplateData()
      const existingOption = TestDataFactory.createOptionData({ name: 'Existing Option' })

      DishTemplate.findOne = vi.fn().mockResolvedValue(mockTemplate)
      Option.findOne = vi.fn().mockResolvedValue(existingOption)

      // Act & Assert
      await expect(optionService.createOption(optionData, brandId))
        .rejects.toThrow('此選項名稱已存在')
    })

    it('should ensure tags is array', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const optionData = {
        name: 'Test Option',
        tags: 'single-tag' // String instead of array
      }
      const mockCreatedOption = TestDataFactory.createOptionData({
        ...optionData,
        tags: ['single-tag']
      })

      Option.findOne = vi.fn().mockResolvedValue(null)

      const mockOptionInstance = {
        ...mockCreatedOption,
        save: vi.fn().mockResolvedValue(mockCreatedOption)
      }
      Option.mockImplementation(() => mockOptionInstance)

      // Act
      const result = await optionService.createOption(optionData, brandId)

      // Assert
      expect(result.tags).toEqual(['single-tag'])
    })
  })

  describe('updateOption', () => {
    it('should update option successfully', async () => {
      // Arrange
      const optionId = '507f1f77bcf86cd799439031'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { name: 'Updated Option', price: 30 }
      const mockOption = TestDataFactory.createOptionData({ _id: optionId })

      Option.findOne = vi.fn()
        .mockResolvedValueOnce(mockOption) // 第一次調用：獲取現有選項
        .mockResolvedValueOnce(null) // 第二次調用：檢查名稱重複

      // Act
      const result = await optionService.updateOption(optionId, updateData, brandId)

      // Assert
      expect(Option.findOne).toHaveBeenCalledWith({
        _id: optionId,
        brand: brandId
      })
      expect(Option.findOne).toHaveBeenCalledWith({
        name: updateData.name,
        brand: brandId,
        _id: { $ne: optionId }
      })
      expect(mockOption.save).toHaveBeenCalled()
      expect(result.name).toBe('Updated Option')
      expect(result.price).toBe(30)
    })

    it('should throw error when option not found', async () => {
      // Arrange
      const optionId = '507f1f77bcf86cd799439031'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { name: 'Updated Option' }

      Option.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(optionService.updateOption(optionId, updateData, brandId))
        .rejects.toThrow('選項不存在或無權訪問')
    })

    it('should throw error when updated name already exists', async () => {
      // Arrange
      const optionId = '507f1f77bcf86cd799439031'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { name: 'Existing Name' }
      const mockOption = TestDataFactory.createOptionData({ _id: optionId })
      const existingOption = TestDataFactory.createOptionData({ name: 'Existing Name' })

      Option.findOne = vi.fn()
        .mockResolvedValueOnce(mockOption)
        .mockResolvedValueOnce(existingOption)

      // Act & Assert
      await expect(optionService.updateOption(optionId, updateData, brandId))
        .rejects.toThrow('此選項名稱已存在')
    })

    it('should validate dish template when updating refDishTemplate', async () => {
      // Arrange
      const optionId = '507f1f77bcf86cd799439031'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { refDishTemplate: '507f1f77bcf86cd799439033' }
      const mockOption = TestDataFactory.createOptionData({ _id: optionId })
      const mockTemplate = TestDataFactory.createDishTemplateData({ _id: '507f1f77bcf86cd799439033' })

      Option.findOne = vi.fn().mockResolvedValue(mockOption)
      DishTemplate.findOne = vi.fn().mockResolvedValue(mockTemplate)

      // Act
      const result = await optionService.updateOption(optionId, updateData, brandId)

      // Assert
      expect(DishTemplate.findOne).toHaveBeenCalledWith({
        _id: updateData.refDishTemplate,
        brand: brandId
      })
      expect(result.refDishTemplate).toBe('507f1f77bcf86cd799439033')
    })

    it('should throw error when updated dish template not found', async () => {
      // Arrange
      const optionId = '507f1f77bcf86cd799439031'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { refDishTemplate: '507f1f77bcf86cd799439033' }
      const mockOption = TestDataFactory.createOptionData({ _id: optionId })

      Option.findOne = vi.fn().mockResolvedValue(mockOption)
      DishTemplate.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(optionService.updateOption(optionId, updateData, brandId))
        .rejects.toThrow('關聯的餐點模板不存在或不屬於此品牌')
    })
  })

  describe('deleteOption', () => {
    it('should delete option successfully when no dependencies', async () => {
      // Arrange
      const optionId = '507f1f77bcf86cd799439031'
      const brandId = '507f1f77bcf86cd799439013'
      const mockOption = TestDataFactory.createOptionData({ _id: optionId })

      Option.findOne = vi.fn().mockResolvedValue(mockOption)
      OptionCategory.find = vi.fn().mockResolvedValue([]) // 沒有類別引用此選項

      // Act
      const result = await optionService.deleteOption(optionId, brandId)

      // Assert
      expect(Option.findOne).toHaveBeenCalledWith({
        _id: optionId,
        brand: brandId
      })
      expect(OptionCategory.find).toHaveBeenCalledWith({
        'options.refOption': optionId,
        brand: brandId
      })
      expect(mockOption.deleteOne).toHaveBeenCalled()
      expect(result).toEqual({ success: true, message: '選項已刪除' })
    })

    it('should throw error when option not found', async () => {
      // Arrange
      const optionId = '507f1f77bcf86cd799439031'
      const brandId = '507f1f77bcf86cd799439013'

      Option.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(optionService.deleteOption(optionId, brandId))
        .rejects.toThrow('選項不存在或無權訪問')
    })

    it('should refuse to delete option when referenced by categories', async () => {
      // Arrange
      const optionId = '507f1f77bcf86cd799439031'
      const brandId = '507f1f77bcf86cd799439013'
      const mockOption = TestDataFactory.createOptionData({ _id: optionId })
      const referencingCategories = [
        TestDataFactory.createOptionCategoryData({ name: 'Size Category' }),
        TestDataFactory.createOptionCategoryData({ name: 'Type Category' })
      ]

      Option.findOne = vi.fn().mockResolvedValue(mockOption)
      OptionCategory.find = vi.fn().mockResolvedValue(referencingCategories)

      // Act & Assert
      await expect(optionService.deleteOption(optionId, brandId))
        .rejects.toThrow('無法刪除此選項，因為它已被一個或多個類別引用')

      // 確保沒有執行刪除
      expect(mockOption.deleteOne).not.toHaveBeenCalled()
    })

    it('should perform dependency check before deletion', async () => {
      // Arrange
      const optionId = '507f1f77bcf86cd799439031'
      const brandId = '507f1f77bcf86cd799439013'
      const mockOption = TestDataFactory.createOptionData({ _id: optionId })

      Option.findOne = vi.fn().mockResolvedValue(mockOption)
      OptionCategory.find = vi.fn().mockResolvedValue([])

      // Act
      await optionService.deleteOption(optionId, brandId)

      // Assert
      expect(OptionCategory.find).toHaveBeenCalledBefore(mockOption.deleteOne)
      expect(OptionCategory.find).toHaveBeenCalledWith({
        'options.refOption': optionId,
        brand: brandId
      })
    })

    it('should check dependencies with correct query format', async () => {
      // Arrange
      const optionId = '507f1f77bcf86cd799439031'
      const brandId = '507f1f77bcf86cd799439013'
      const mockOption = TestDataFactory.createOptionData({ _id: optionId })

      Option.findOne = vi.fn().mockResolvedValue(mockOption)
      OptionCategory.find = vi.fn().mockResolvedValue([])

      // Act
      await optionService.deleteOption(optionId, brandId)

      // Assert
      expect(OptionCategory.find).toHaveBeenCalledWith({
        'options.refOption': optionId, // 檢查嵌套欄位
        brand: brandId
      })
    })
  })
})