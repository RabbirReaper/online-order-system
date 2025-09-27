/**
 * 選項類別服務測試
 * 測試餐點選項類別相關業務邏輯功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock 所有外部依賴
vi.mock('@server/models/Dish/OptionCategory.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Dish/Option.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Dish/DishTemplate.js', () => ({ default: vi.fn() }))
vi.mock('mongoose', () => ({
  default: {
    Types: {
      ObjectId: vi.fn().mockImplementation((id) => id)
    }
  }
}))

// 確保 ObjectId Mock 正確返回字符串
const mockObjectId = vi.fn().mockImplementation((id) => id)

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
const optionCategoryService = await import('@server/services/dish/optionCategoryService.js')
const OptionCategory = (await import('@server/models/Dish/OptionCategory.js')).default
const Option = (await import('@server/models/Dish/Option.js')).default
const DishTemplate = (await import('@server/models/Dish/DishTemplate.js')).default
const mongoose = (await import('mongoose')).default
const { AppError } = await import('@server/middlewares/error.js')

// 測試資料工廠擴展
TestDataFactory.createOptionCategoryData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439030',
  name: 'Size Options',
  brand: '507f1f77bcf86cd799439013',
  inputType: 'radio',
  options: [
    {
      refOption: {
        _id: '507f1f77bcf86cd799439031',
        name: 'Small',
        price: 0,
        refDishTemplate: {
          _id: '507f1f77bcf86cd799439032',
          name: 'Base Item'
        }
      },
      order: 1
    },
    {
      refOption: {
        _id: '507f1f77bcf86cd799439033',
        name: 'Large',
        price: 50,
        refDishTemplate: {
          _id: '507f1f77bcf86cd799439032',
          name: 'Base Item'
        }
      },
      order: 2
    }
  ],
  save: vi.fn().mockResolvedValue(),
  deleteOne: vi.fn().mockResolvedValue(),
  ...overrides
})

TestDataFactory.createOptionData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439031',
  name: 'Small Size',
  price: 0,
  brand: '507f1f77bcf86cd799439013',
  refDishTemplate: '507f1f77bcf86cd799439032',
  ...overrides
})

// Mock 查詢鏈
const createMockQueryChain = (resolvedValue = []) => ({
  sort: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue(resolvedValue)
})

describe('OptionCategoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重新設置 mongoose ObjectId Mock
    mongoose.Types.ObjectId.mockImplementation((id) => id)
  })

  describe('getAllCategories', () => {
    it('should return all categories for a brand successfully', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const mockCategories = [
        TestDataFactory.createOptionCategoryData(),
        TestDataFactory.createOptionCategoryData({
          _id: '507f1f77bcf86cd799439034',
          name: 'Extra Options',
          inputType: 'checkbox'
        })
      ]

      const mockQuery = createMockQueryChain()
      mockQuery.sort = vi.fn().mockReturnThis()
      mockQuery.populate = vi.fn().mockResolvedValue(mockCategories)
      OptionCategory.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await optionCategoryService.getAllCategories(brandId)

      // Assert
      expect(OptionCategory.find).toHaveBeenCalledWith({ brand: brandId })
      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 })
      expect(mockQuery.populate).toHaveBeenCalledWith({
        path: 'options.refOption',
        model: 'Option',
        populate: {
          path: 'refDishTemplate',
          model: 'DishTemplate',
          select: 'name'
        }
      })
      expect(result).toEqual(mockCategories)
    })

    it('should handle empty categories list', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'

      const mockQuery = createMockQueryChain()
      mockQuery.sort = vi.fn().mockReturnThis()
      mockQuery.populate = vi.fn().mockResolvedValue([])
      OptionCategory.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await optionCategoryService.getAllCategories(brandId)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('getCategoryById', () => {
    it('should return category by id without options', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const mockCategory = TestDataFactory.createOptionCategoryData({ _id: categoryId })

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)

      // Act
      const result = await optionCategoryService.getCategoryById(categoryId, brandId, false)

      // Assert
      expect(OptionCategory.findOne).toHaveBeenCalledWith({
        _id: categoryId,
        brand: brandId
      })
      expect(result).toEqual(mockCategory)
    })

    it('should return category by id with options when includeOptions is true', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const mockCategory = TestDataFactory.createOptionCategoryData({ _id: categoryId })

      const mockQuery = createMockQueryChain()
      mockQuery.populate = vi.fn().mockResolvedValue(mockCategory)
      OptionCategory.findOne = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await optionCategoryService.getCategoryById(categoryId, brandId, true)

      // Assert
      expect(OptionCategory.findOne).toHaveBeenCalledWith({
        _id: categoryId,
        brand: brandId
      })
      expect(mockQuery.populate).toHaveBeenCalledWith({
        path: 'options.refOption',
        model: 'Option',
        populate: {
          path: 'refDishTemplate',
          model: 'DishTemplate',
          select: 'name'
        }
      })
      expect(result).toEqual(mockCategory)
    })

    it('should throw error when category not found', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'

      OptionCategory.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(optionCategoryService.getCategoryById(categoryId, brandId))
        .rejects.toThrow('選項類別不存在或無權訪問')
    })
  })

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const categoryData = {
        name: 'Sauce Options',
        inputType: 'checkbox'
      }
      const mockCreatedCategory = TestDataFactory.createOptionCategoryData(categoryData)

      OptionCategory.findOne = vi.fn().mockResolvedValue(null) // 名稱不重複

      // Mock OptionCategory constructor
      const mockCategoryInstance = {
        ...mockCreatedCategory,
        save: vi.fn().mockResolvedValue(mockCreatedCategory)
      }
      OptionCategory.mockImplementation(() => mockCategoryInstance)

      // Act
      const result = await optionCategoryService.createCategory(categoryData, brandId)

      // Assert
      expect(OptionCategory.findOne).toHaveBeenCalledWith({
        name: categoryData.name,
        brand: brandId
      })
      expect(mockCategoryInstance.save).toHaveBeenCalled()
      expect(result.name).toBe('Sauce Options')
      expect(result.brand).toBe(brandId)
    })

    it('should throw error when name is missing', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const categoryData = { inputType: 'radio' }

      // Act & Assert
      await expect(optionCategoryService.createCategory(categoryData, brandId))
        .rejects.toThrow('名稱和輸入類型為必填欄位')
    })

    it('should throw error when inputType is missing', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const categoryData = { name: 'Test Category' }

      // Act & Assert
      await expect(optionCategoryService.createCategory(categoryData, brandId))
        .rejects.toThrow('名稱和輸入類型為必填欄位')
    })

    it('should throw error when category name already exists', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const categoryData = {
        name: 'Existing Category',
        inputType: 'radio'
      }
      const existingCategory = TestDataFactory.createOptionCategoryData({ name: 'Existing Category' })

      OptionCategory.findOne = vi.fn().mockResolvedValue(existingCategory)

      // Act & Assert
      await expect(optionCategoryService.createCategory(categoryData, brandId))
        .rejects.toThrow('此選項類別名稱已存在')
    })
  })

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { name: 'Updated Category', inputType: 'checkbox' }
      const mockCategory = TestDataFactory.createOptionCategoryData({ _id: categoryId })

      OptionCategory.findOne = vi.fn()
        .mockResolvedValueOnce(mockCategory) // 第一次調用：獲取現有類別
        .mockResolvedValueOnce(null) // 第二次調用：檢查名稱重複

      // Act
      const result = await optionCategoryService.updateCategory(categoryId, updateData, brandId)

      // Assert
      expect(OptionCategory.findOne).toHaveBeenCalledWith({
        _id: categoryId,
        brand: brandId
      })
      expect(mockCategory.save).toHaveBeenCalled()
      expect(result.name).toBe('Updated Category')
      expect(result.inputType).toBe('checkbox')
    })

    it('should throw error when category not found', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { name: 'Updated Category' }

      OptionCategory.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(optionCategoryService.updateCategory(categoryId, updateData, brandId))
        .rejects.toThrow('選項類別不存在或無權訪問')
    })

    it('should throw error when updated name already exists', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { name: 'Existing Name' }
      const mockCategory = TestDataFactory.createOptionCategoryData({
        _id: categoryId,
        name: 'Original Name'
      })
      const existingCategory = TestDataFactory.createOptionCategoryData({ name: 'Existing Name' })

      OptionCategory.findOne = vi.fn()
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(existingCategory)

      // Act & Assert
      await expect(optionCategoryService.updateCategory(categoryId, updateData, brandId))
        .rejects.toThrow('此選項類別名稱已存在')
    })

    it('should not check name duplication when name unchanged', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const currentName = 'Size Options'
      const updateData = { inputType: 'checkbox' } // 只更新 inputType
      const mockCategory = TestDataFactory.createOptionCategoryData({
        _id: categoryId,
        name: currentName
      })

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)

      // Act
      const result = await optionCategoryService.updateCategory(categoryId, updateData, brandId)

      // Assert
      expect(OptionCategory.findOne).toHaveBeenCalledTimes(1) // 只檢查一次（獲取現有類別）
      expect(result.inputType).toBe('checkbox')
    })

    it('should update options list when provided', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = {
        options: [
          { refOption: '507f1f77bcf86cd799439031', order: 1 },
          { refOption: '507f1f77bcf86cd799439033', order: 2 }
        ]
      }
      const mockCategory = TestDataFactory.createOptionCategoryData({ _id: categoryId })
      const mockOptions = [
        TestDataFactory.createOptionData({ _id: '507f1f77bcf86cd799439031' }),
        TestDataFactory.createOptionData({ _id: '507f1f77bcf86cd799439033' })
      ]

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)
      Option.findOne = vi.fn()
        .mockResolvedValueOnce(mockOptions[0])
        .mockResolvedValueOnce(mockOptions[1])

      // Act
      const result = await optionCategoryService.updateCategory(categoryId, updateData, brandId)

      // Assert
      expect(Option.findOne).toHaveBeenCalledTimes(2)
      expect(Option.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439031',
        brand: brandId
      })
      expect(Option.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439033',
        brand: brandId
      })
      expect(result.options).toEqual(updateData.options)
    })

    it('should throw error when option in options list does not exist', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = {
        options: [
          { refOption: '507f1f77bcf86cd799439031', order: 1 },
          { refOption: 'nonexistent-option-id', order: 2 }
        ]
      }
      const mockCategory = TestDataFactory.createOptionCategoryData({ _id: categoryId })
      const mockOption = TestDataFactory.createOptionData({ _id: '507f1f77bcf86cd799439031' })

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)
      Option.findOne = vi.fn()
        .mockResolvedValueOnce(mockOption)
        .mockResolvedValueOnce(null) // 第二個選項不存在

      // Act & Assert
      await expect(optionCategoryService.updateCategory(categoryId, updateData, brandId))
        .rejects.toThrow('選項 nonexistent-option-id 不存在或不屬於此品牌')
    })

    it('should throw error when option refOption is missing', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = {
        options: [
          { order: 1 } // 缺少 refOption
        ]
      }
      const mockCategory = TestDataFactory.createOptionCategoryData({ _id: categoryId })

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)

      // Act & Assert
      await expect(optionCategoryService.updateCategory(categoryId, updateData, brandId))
        .rejects.toThrow('選項ID為必填欄位')
    })

    it('should prevent brand modification', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const originalBrand = brandId
      const currentName = 'Size Options'
      const updateData = {
        name: currentName, // 使用相同名稱避免觸發重複檢查
        brand: 'different-brand-id' // 嘗試更改品牌
      }
      const mockCategory = TestDataFactory.createOptionCategoryData({
        _id: categoryId,
        name: currentName,
        brand: originalBrand
      })

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)

      // Act
      const result = await optionCategoryService.updateCategory(categoryId, updateData, brandId)

      // Assert
      expect(result.brand).toBe(originalBrand) // 品牌應該保持不變
    })
  })

  describe('deleteCategory', () => {
    it('should delete category successfully when no dependencies', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const mockCategory = TestDataFactory.createOptionCategoryData({ _id: categoryId })

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)
      DishTemplate.countDocuments = vi.fn().mockResolvedValue(0) // 沒有餐點模板使用此類別

      // Act
      const result = await optionCategoryService.deleteCategory(categoryId, brandId)

      // Assert
      expect(OptionCategory.findOne).toHaveBeenCalledWith({
        _id: categoryId,
        brand: brandId
      })
      expect(DishTemplate.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: brandId,
          'optionCategories.categoryId': expect.anything()
        })
      )
      expect(mockCategory.deleteOne).toHaveBeenCalled()
      expect(result).toEqual({ success: true, message: '選項類別已刪除' })
    })

    it('should throw error when category not found', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'

      OptionCategory.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(optionCategoryService.deleteCategory(categoryId, brandId))
        .rejects.toThrow('選項類別不存在或無權訪問')
    })

    it('should refuse to delete category when used by dish templates', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const mockCategory = TestDataFactory.createOptionCategoryData({ _id: categoryId })

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)
      DishTemplate.countDocuments = vi.fn().mockResolvedValue(3) // 有3個餐點模板使用此類別

      // Act & Assert
      await expect(optionCategoryService.deleteCategory(categoryId, brandId))
        .rejects.toThrow('此選項類別被餐點模板使用中，無法刪除')

      // 確保沒有執行刪除
      expect(mockCategory.deleteOne).not.toHaveBeenCalled()
    })

    it('should perform dependency check before deletion', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const mockCategory = TestDataFactory.createOptionCategoryData({ _id: categoryId })

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)
      DishTemplate.countDocuments = vi.fn().mockResolvedValue(0)

      // Act
      await optionCategoryService.deleteCategory(categoryId, brandId)

      // Assert
      expect(DishTemplate.countDocuments).toHaveBeenCalledBefore(mockCategory.deleteOne)
      expect(DishTemplate.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: brandId,
          'optionCategories.categoryId': expect.anything()
        })
      )
    })

    it('should check dependencies with correct query format', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const mockCategory = TestDataFactory.createOptionCategoryData({ _id: categoryId })

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)
      DishTemplate.countDocuments = vi.fn().mockResolvedValue(0)

      // Act
      await optionCategoryService.deleteCategory(categoryId, brandId)

      // Assert
      expect(DishTemplate.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: brandId,
          'optionCategories.categoryId': expect.anything() // 檢查嵌套欄位
        })
      )
      expect(mongoose.Types.ObjectId).toHaveBeenCalledWith(categoryId)
    })

    it('should handle ObjectId conversion correctly', async () => {
      // Arrange
      const categoryId = '507f1f77bcf86cd799439030'
      const brandId = '507f1f77bcf86cd799439013'
      const mockCategory = TestDataFactory.createOptionCategoryData({ _id: categoryId })

      OptionCategory.findOne = vi.fn().mockResolvedValue(mockCategory)
      DishTemplate.countDocuments = vi.fn().mockResolvedValue(0)

      // Act
      await optionCategoryService.deleteCategory(categoryId, brandId)

      // Assert
      expect(mongoose.Types.ObjectId).toHaveBeenCalledWith(categoryId)
      expect(DishTemplate.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: brandId,
          'optionCategories.categoryId': expect.anything() // Mock ObjectId 返回原始值
        })
      )
    })
  })
})