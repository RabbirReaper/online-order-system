/**
 * 菜品模板服務測試
 * 測試菜品模板相關業務邏輯功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock 所有外部依賴
vi.mock('@server/models/Dish/DishTemplate.js', () => ({ default: vi.fn() }))
vi.mock('@server/models/Dish/OptionCategory.js', () => ({ default: vi.fn() }))
vi.mock('@server/services/imageHelper.js', () => ({
  uploadAndProcessImage: vi.fn(),
  updateImage: vi.fn(),
  deleteImage: vi.fn()
}))

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
const dishTemplateService = await import('@server/services/dish/dishTemplate.js')
const DishTemplate = (await import('@server/models/Dish/DishTemplate.js')).default
const OptionCategory = (await import('@server/models/Dish/OptionCategory.js')).default
const imageHelper = await import('@server/services/imageHelper.js')
const { AppError } = await import('@server/middlewares/error.js')

// 測試資料工廠擴展
TestDataFactory.createDishTemplateData = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439016',
  name: 'Test Dish Template',
  description: 'Test dish template description',
  brand: '507f1f77bcf86cd799439013',
  category: 'main',
  basePrice: 150,
  image: {
    url: 'https://r2.example.com/dish-image.jpg',
    key: 'dishes/brand123/dish-image.jpg'
  },
  tags: ['popular', 'spicy'],
  optionCategories: [
    {
      categoryId: '507f1f77bcf86cd799439030',
      order: 1
    }
  ],
  isActive: true,
  createdAt: new Date(),
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
    }
  ],
  ...overrides
})

TestDataFactory.createImageData = (overrides = {}) => ({
  url: 'https://r2.example.com/test-image.jpg',
  key: 'dishes/brand123/test-image.jpg',
  ...overrides
})

// Mock 查詢鏈
const createMockQueryChain = (resolvedValue = []) => ({
  sort: vi.fn().mockResolvedValue(resolvedValue),
  populate: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue(resolvedValue)
})

describe('DishTemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllTemplates', () => {
    it('should return all templates for a brand successfully', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const mockTemplates = [
        TestDataFactory.createDishTemplateData(),
        TestDataFactory.createDishTemplateData({ 
          _id: '507f1f77bcf86cd799439017',
          name: 'Another Template' 
        })
      ]

      const mockQuery = createMockQueryChain(mockTemplates)
      DishTemplate.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await dishTemplateService.getAllTemplates(brandId)

      // Assert
      expect(DishTemplate.find).toHaveBeenCalledWith({ brand: brandId })
      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 })
      expect(result).toEqual(mockTemplates)
    })

    it('should filter templates by search query', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const query = 'burger'
      const mockTemplates = [TestDataFactory.createDishTemplateData({ name: 'Cheese Burger' })]

      const mockQuery = createMockQueryChain(mockTemplates)
      DishTemplate.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await dishTemplateService.getAllTemplates(brandId, { query })

      // Assert
      expect(DishTemplate.find).toHaveBeenCalledWith({ 
        brand: brandId,
        name: { $regex: query, $options: 'i' }
      })
      expect(result).toEqual(mockTemplates)
    })

    it('should filter templates by tags', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const tags = ['popular', 'spicy']
      const mockTemplates = [TestDataFactory.createDishTemplateData({ tags })]

      const mockQuery = createMockQueryChain(mockTemplates)
      DishTemplate.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await dishTemplateService.getAllTemplates(brandId, { tags })

      // Assert
      expect(DishTemplate.find).toHaveBeenCalledWith({ 
        brand: brandId,
        tags: { $in: tags }
      })
      expect(result).toEqual(mockTemplates)
    })

    it('should filter templates by both query and tags', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const query = 'burger'
      const tags = ['popular']
      const mockTemplates = [TestDataFactory.createDishTemplateData()]

      const mockQuery = createMockQueryChain(mockTemplates)
      DishTemplate.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await dishTemplateService.getAllTemplates(brandId, { query, tags })

      // Assert
      expect(DishTemplate.find).toHaveBeenCalledWith({ 
        brand: brandId,
        name: { $regex: query, $options: 'i' },
        tags: { $in: tags }
      })
      expect(result).toEqual(mockTemplates)
    })
  })

  describe('getTemplateById', () => {
    it('should return template by id successfully', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const mockTemplate = TestDataFactory.createDishTemplateData({ _id: templateId })

      DishTemplate.findOne = vi.fn().mockResolvedValue(mockTemplate)

      // Act
      const result = await dishTemplateService.getTemplateById(templateId, brandId)

      // Assert
      expect(DishTemplate.findOne).toHaveBeenCalledWith({
        _id: templateId,
        brand: brandId
      })
      expect(result).toEqual(mockTemplate)
    })

    it('should throw error when template not found', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'

      DishTemplate.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(dishTemplateService.getTemplateById(templateId, brandId))
        .rejects.toThrow('餐點模板不存在或無權訪問')
    })

    it('should throw error when template belongs to different brand', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'

      DishTemplate.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(dishTemplateService.getTemplateById(templateId, brandId))
        .rejects.toThrow('餐點模板不存在或無權訪問')
    })
  })

  describe('createTemplate', () => {
    it('should create template successfully with image data', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const templateData = {
        name: 'New Template',
        basePrice: 200,
        imageData: 'base64image...'
      }
      const imageInfo = TestDataFactory.createImageData()
      const mockCreatedTemplate = TestDataFactory.createDishTemplateData({
        name: 'New Template',
        basePrice: 200,
        image: imageInfo
      })

      imageHelper.uploadAndProcessImage = vi.fn().mockResolvedValue(imageInfo)
      
      // Mock DishTemplate constructor
      const mockTemplateInstance = {
        ...mockCreatedTemplate,
        save: vi.fn().mockResolvedValue(mockCreatedTemplate)
      }
      DishTemplate.mockImplementation(() => mockTemplateInstance)

      // Act
      const result = await dishTemplateService.createTemplate(templateData, brandId)

      // Assert
      expect(imageHelper.uploadAndProcessImage).toHaveBeenCalledWith(
        'base64image...',
        `dishes/${brandId}`
      )
      expect(mockTemplateInstance.save).toHaveBeenCalled()
      expect(result.name).toBe('New Template')
      expect(result.basePrice).toBe(200)
    })

    it('should create template successfully with existing image info', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const templateData = {
        name: 'New Template',
        basePrice: 200,
        image: TestDataFactory.createImageData()
      }
      const mockCreatedTemplate = TestDataFactory.createDishTemplateData(templateData)

      // Mock DishTemplate constructor
      const mockTemplateInstance = {
        ...mockCreatedTemplate,
        save: vi.fn().mockResolvedValue(mockCreatedTemplate)
      }
      DishTemplate.mockImplementation(() => mockTemplateInstance)

      // Act
      const result = await dishTemplateService.createTemplate(templateData, brandId)

      // Assert
      expect(imageHelper.uploadAndProcessImage).not.toHaveBeenCalled()
      expect(mockTemplateInstance.save).toHaveBeenCalled()
      expect(result.name).toBe('New Template')
      expect(result.basePrice).toBe(200)
    })

    it('should throw error when name is missing', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const templateData = { basePrice: 200 }

      // Act & Assert
      await expect(dishTemplateService.createTemplate(templateData, brandId))
        .rejects.toThrow('名稱和基本價格為必填欄位')
    })

    it('should throw error when basePrice is missing', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const templateData = { name: 'New Template' }

      // Act & Assert
      await expect(dishTemplateService.createTemplate(templateData, brandId))
        .rejects.toThrow('名稱和基本價格為必填欄位')
    })

    it('should allow creating template without image', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const templateData = {
        name: 'New Template',
        basePrice: 200
        // No image provided
      }
      const mockCreatedTemplate = TestDataFactory.createDishTemplateData({
        name: 'New Template',
        basePrice: 200,
        image: undefined
      })

      // Mock DishTemplate constructor
      const mockTemplateInstance = {
        ...mockCreatedTemplate,
        save: vi.fn().mockResolvedValue(mockCreatedTemplate)
      }
      DishTemplate.mockImplementation(() => mockTemplateInstance)

      // Act
      const result = await dishTemplateService.createTemplate(templateData, brandId)

      // Assert
      expect(imageHelper.uploadAndProcessImage).not.toHaveBeenCalled()
      expect(mockTemplateInstance.save).toHaveBeenCalled()
      expect(result.name).toBe('New Template')
      expect(result.basePrice).toBe(200)
      expect(result.image).toBeUndefined()
    })

    it('should validate option categories belong to brand', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const templateData = {
        name: 'New Template',
        basePrice: 200,
        image: TestDataFactory.createImageData(),
        optionCategories: [
          { categoryId: '507f1f77bcf86cd799439030' }
        ]
      }
      const mockCategories = [TestDataFactory.createOptionCategoryData()]
      const mockCreatedTemplate = TestDataFactory.createDishTemplateData(templateData)

      OptionCategory.find = vi.fn().mockResolvedValue(mockCategories)

      // Mock DishTemplate constructor
      const mockTemplateInstance = {
        ...mockCreatedTemplate,
        save: vi.fn().mockResolvedValue(mockCreatedTemplate)
      }
      DishTemplate.mockImplementation(() => mockTemplateInstance)

      // Act
      const result = await dishTemplateService.createTemplate(templateData, brandId)

      // Assert
      expect(OptionCategory.find).toHaveBeenCalledWith({
        _id: { $in: ['507f1f77bcf86cd799439030'] },
        brand: brandId
      })
      expect(mockTemplateInstance.save).toHaveBeenCalled()
      expect(result.name).toBe('New Template')
    })

    it('should throw error when option category does not exist', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const templateData = {
        name: 'New Template',
        basePrice: 200,
        image: TestDataFactory.createImageData(),
        optionCategories: [
          { categoryId: '507f1f77bcf86cd799439030' }
        ]
      }

      OptionCategory.find = vi.fn().mockResolvedValue([]) // No categories found

      // Act & Assert
      await expect(dishTemplateService.createTemplate(templateData, brandId))
        .rejects.toThrow('部分選項類別不存在或不屬於此品牌')
    })

    it('should handle image upload error', async () => {
      // Arrange
      const brandId = '507f1f77bcf86cd799439013'
      const templateData = {
        name: 'New Template',
        basePrice: 200,
        imageData: 'invalid-image-data'
      }

      imageHelper.uploadAndProcessImage = vi.fn().mockRejectedValue(new Error('Upload failed'))

      // Act & Assert
      await expect(dishTemplateService.createTemplate(templateData, brandId))
        .rejects.toThrow('圖片處理失敗: Upload failed')
    })
  })

  describe('updateTemplate', () => {
    it('should update template successfully', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { name: 'Updated Template' }
      const existingTemplate = TestDataFactory.createDishTemplateData({ _id: templateId })
      const updatedTemplate = TestDataFactory.createDishTemplateData({
        _id: templateId,
        name: 'Updated Template'
      })

      DishTemplate.findOne = vi.fn().mockResolvedValue(existingTemplate)
      existingTemplate.save = vi.fn().mockResolvedValue(updatedTemplate)

      // Act
      const result = await dishTemplateService.updateTemplate(templateId, updateData, brandId)

      // Assert
      expect(DishTemplate.findOne).toHaveBeenCalledWith({
        _id: templateId,
        brand: brandId
      })
      expect(existingTemplate.name).toBe('Updated Template')
      expect(existingTemplate.save).toHaveBeenCalled()
      expect(result.name).toBe('Updated Template')
    })

    it('should throw error when template not found', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { name: 'Updated Template' }

      DishTemplate.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(dishTemplateService.updateTemplate(templateId, updateData, brandId))
        .rejects.toThrow('餐點模板不存在或無權訪問')
    })

    it('should update image when imageData is provided with existing image', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = {
        name: 'Updated Template',
        imageData: 'new-image-data'
      }
      const existingTemplate = TestDataFactory.createDishTemplateData({ _id: templateId })
      const newImageInfo = TestDataFactory.createImageData()
      const updatedTemplate = TestDataFactory.createDishTemplateData({
        _id: templateId,
        name: 'Updated Template',
        image: newImageInfo
      })

      DishTemplate.findOne = vi.fn().mockResolvedValue(existingTemplate)
      imageHelper.updateImage = vi.fn().mockResolvedValue(newImageInfo)
      existingTemplate.save = vi.fn().mockResolvedValue(updatedTemplate)

      // Act
      const result = await dishTemplateService.updateTemplate(templateId, updateData, brandId)

      // Assert
      expect(imageHelper.updateImage).toHaveBeenCalledWith(
        'new-image-data',
        'dishes/brand123/dish-image.jpg',
        `dishes/${brandId}`
      )
      expect(existingTemplate.image).toEqual(newImageInfo)
      expect(result.name).toBe('Updated Template')
    })

    it('should upload new image when imageData is provided without existing image', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = {
        name: 'Updated Template',
        imageData: 'new-image-data'
      }
      const existingTemplate = TestDataFactory.createDishTemplateData({ 
        _id: templateId,
        image: null 
      })
      const newImageInfo = TestDataFactory.createImageData()
      const updatedTemplate = TestDataFactory.createDishTemplateData({
        _id: templateId,
        name: 'Updated Template',
        image: newImageInfo
      })

      DishTemplate.findOne = vi.fn().mockResolvedValue(existingTemplate)
      imageHelper.uploadAndProcessImage = vi.fn().mockResolvedValue(newImageInfo)
      existingTemplate.save = vi.fn().mockResolvedValue(updatedTemplate)

      // Act
      const result = await dishTemplateService.updateTemplate(templateId, updateData, brandId)

      // Assert
      expect(imageHelper.uploadAndProcessImage).toHaveBeenCalledWith(
        'new-image-data',
        `dishes/${brandId}`
      )
      expect(existingTemplate.image).toEqual(newImageInfo)
      expect(result.name).toBe('Updated Template')
    })

    it('should validate option categories when updating', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = {
        optionCategories: [
          { categoryId: '507f1f77bcf86cd799439030' }
        ]
      }
      const existingTemplate = TestDataFactory.createDishTemplateData({ _id: templateId })
      const mockCategories = [TestDataFactory.createOptionCategoryData()]
      const updatedTemplate = TestDataFactory.createDishTemplateData({ _id: templateId })

      DishTemplate.findOne = vi.fn().mockResolvedValue(existingTemplate)
      OptionCategory.find = vi.fn().mockResolvedValue(mockCategories)
      existingTemplate.save = vi.fn().mockResolvedValue(updatedTemplate)

      // Act
      const result = await dishTemplateService.updateTemplate(templateId, updateData, brandId)

      // Assert
      expect(OptionCategory.find).toHaveBeenCalledWith({
        _id: { $in: ['507f1f77bcf86cd799439030'] },
        brand: brandId
      })
      expect(existingTemplate.save).toHaveBeenCalled()
      expect(result.optionCategories).toBeDefined()
    })

    it('should throw error when option category does not exist during update', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = {
        optionCategories: [
          { categoryId: '507f1f77bcf86cd799439030' }
        ]
      }
      const existingTemplate = TestDataFactory.createDishTemplateData({ _id: templateId })

      DishTemplate.findOne = vi.fn().mockResolvedValue(existingTemplate)
      OptionCategory.find = vi.fn().mockResolvedValue([]) // No categories found

      // Act & Assert
      await expect(dishTemplateService.updateTemplate(templateId, updateData, brandId))
        .rejects.toThrow('部分選項類別不存在或不屬於此品牌')
    })

    it('should not allow brand to be changed', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = { 
        name: 'Updated Template',
        brand: 'different-brand-id' // This should be ignored
      }
      const existingTemplate = TestDataFactory.createDishTemplateData({ _id: templateId })
      const updatedTemplate = TestDataFactory.createDishTemplateData({
        _id: templateId,
        name: 'Updated Template',
        brand: brandId // Should remain original brand
      })

      DishTemplate.findOne = vi.fn().mockResolvedValue(existingTemplate)
      existingTemplate.save = vi.fn().mockResolvedValue(updatedTemplate)

      // Act
      const result = await dishTemplateService.updateTemplate(templateId, updateData, brandId)

      // Assert
      expect(existingTemplate.brand).toBe(brandId) // Brand should not be changed
      expect(existingTemplate.save).toHaveBeenCalled()
      expect(result.name).toBe('Updated Template')
    })

    it('should handle image processing error during update', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const updateData = {
        imageData: 'invalid-image-data'
      }
      const existingTemplate = TestDataFactory.createDishTemplateData({ _id: templateId })

      DishTemplate.findOne = vi.fn().mockResolvedValue(existingTemplate)
      imageHelper.updateImage = vi.fn().mockRejectedValue(new Error('Image processing failed'))

      // Act & Assert
      await expect(dishTemplateService.updateTemplate(templateId, updateData, brandId))
        .rejects.toThrow('圖片處理失敗: Image processing failed')
    })
  })

  describe('deleteTemplate', () => {
    it('should delete template successfully with image cleanup', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const existingTemplate = TestDataFactory.createDishTemplateData({ _id: templateId })

      DishTemplate.findOne = vi.fn().mockResolvedValue(existingTemplate)
      imageHelper.deleteImage = vi.fn().mockResolvedValue(true)
      existingTemplate.deleteOne = vi.fn().mockResolvedValue()

      // Act
      const result = await dishTemplateService.deleteTemplate(templateId, brandId)

      // Assert
      expect(DishTemplate.findOne).toHaveBeenCalledWith({
        _id: templateId,
        brand: brandId
      })
      expect(imageHelper.deleteImage).toHaveBeenCalledWith(existingTemplate.image.key)
      expect(existingTemplate.deleteOne).toHaveBeenCalled()
      expect(result).toEqual({ success: true, message: '餐點模板已刪除' })
    })

    it('should throw error when template not found', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'

      DishTemplate.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(dishTemplateService.deleteTemplate(templateId, brandId))
        .rejects.toThrow('餐點模板不存在或無權訪問')
    })

    it('should continue deletion even if image deletion fails', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const existingTemplate = TestDataFactory.createDishTemplateData({ _id: templateId })

      // Mock console.error to avoid test output pollution
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      DishTemplate.findOne = vi.fn().mockResolvedValue(existingTemplate)
      imageHelper.deleteImage = vi.fn().mockRejectedValue(new Error('Image deletion failed'))
      existingTemplate.deleteOne = vi.fn().mockResolvedValue()

      // Act
      const result = await dishTemplateService.deleteTemplate(templateId, brandId)

      // Assert
      expect(imageHelper.deleteImage).toHaveBeenCalledWith(existingTemplate.image.key)
      expect(existingTemplate.deleteOne).toHaveBeenCalled()
      expect(result).toEqual({ success: true, message: '餐點模板已刪除' })
      expect(consoleErrorSpy).toHaveBeenCalledWith('刪除餐點模板圖片失敗: Image deletion failed')

      consoleErrorSpy.mockRestore()
    })

    it('should delete template without image cleanup when no image exists', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const existingTemplate = TestDataFactory.createDishTemplateData({ 
        _id: templateId,
        image: null
      })

      DishTemplate.findOne = vi.fn().mockResolvedValue(existingTemplate)
      existingTemplate.deleteOne = vi.fn().mockResolvedValue()

      // Act
      const result = await dishTemplateService.deleteTemplate(templateId, brandId)

      // Assert
      expect(imageHelper.deleteImage).not.toHaveBeenCalled()
      expect(existingTemplate.deleteOne).toHaveBeenCalled()
      expect(result).toEqual({ success: true, message: '餐點模板已刪除' })
    })
  })

  describe('getTemplateOptions', () => {
    it('should return template options successfully', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const mockTemplate = TestDataFactory.createDishTemplateData({ 
        _id: templateId,
        optionCategories: [
          { categoryId: '507f1f77bcf86cd799439030', order: 1 },
          { categoryId: '507f1f77bcf86cd799439031', order: 2 }
        ]
      })
      const mockCategories = [
        TestDataFactory.createOptionCategoryData({
          _id: '507f1f77bcf86cd799439030',
          name: 'Size Options',
          inputType: 'radio'
        }),
        TestDataFactory.createOptionCategoryData({
          _id: '507f1f77bcf86cd799439031',
          name: 'Extra Options',
          inputType: 'checkbox'
        })
      ]

      DishTemplate.findOne = vi.fn().mockResolvedValue(mockTemplate)
      
      const mockQuery = createMockQueryChain()
      mockQuery.populate = vi.fn().mockResolvedValue(mockCategories)
      OptionCategory.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await dishTemplateService.getTemplateOptions(templateId, brandId)

      // Assert
      expect(DishTemplate.findOne).toHaveBeenCalledWith({
        _id: templateId,
        brand: brandId
      })
      expect(OptionCategory.find).toHaveBeenCalledWith({
        _id: { $in: ['507f1f77bcf86cd799439030', '507f1f77bcf86cd799439031'] },
        brand: brandId
      })
      expect(mockQuery.populate).toHaveBeenCalledWith({
        path: 'options.refOption',
        populate: {
          path: 'refDishTemplate',
          select: 'name'
        }
      })
      expect(result).toHaveLength(2)
      expect(result[0].order).toBe(1)
      expect(result[1].order).toBe(2)
    })

    it('should throw error when template not found', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'

      DishTemplate.findOne = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(dishTemplateService.getTemplateOptions(templateId, brandId))
        .rejects.toThrow('餐點模板不存在或無權訪問')
    })

    it('should return empty array when template has no option categories', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const mockTemplate = TestDataFactory.createDishTemplateData({ 
        _id: templateId,
        optionCategories: []
      })

      DishTemplate.findOne = vi.fn().mockResolvedValue(mockTemplate)

      // Act
      const result = await dishTemplateService.getTemplateOptions(templateId, brandId)

      // Assert
      expect(result).toEqual([])
      expect(OptionCategory.find).not.toHaveBeenCalled()
    })

    it('should return empty array when template has null option categories', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const mockTemplate = TestDataFactory.createDishTemplateData({ 
        _id: templateId,
        optionCategories: null
      })

      DishTemplate.findOne = vi.fn().mockResolvedValue(mockTemplate)

      // Act
      const result = await dishTemplateService.getTemplateOptions(templateId, brandId)

      // Assert
      expect(result).toEqual([])
      expect(OptionCategory.find).not.toHaveBeenCalled()
    })

    it('should sort categories and options correctly', async () => {
      // Arrange
      const templateId = '507f1f77bcf86cd799439016'
      const brandId = '507f1f77bcf86cd799439013'
      const mockTemplate = TestDataFactory.createDishTemplateData({ 
        _id: templateId,
        optionCategories: [
          { categoryId: '507f1f77bcf86cd799439030', order: 2 }, // Second
          { categoryId: '507f1f77bcf86cd799439031', order: 1 }  // First
        ]
      })
      const mockCategories = [
        TestDataFactory.createOptionCategoryData({
          _id: '507f1f77bcf86cd799439030',
          name: 'Size Options',
          options: [
            {
              refOption: { name: 'Large', price: 50 },
              order: 2
            },
            {
              refOption: { name: 'Medium', price: 25 },
              order: 1
            }
          ]
        }),
        TestDataFactory.createOptionCategoryData({
          _id: '507f1f77bcf86cd799439031',
          name: 'Extra Options'
        })
      ]

      DishTemplate.findOne = vi.fn().mockResolvedValue(mockTemplate)
      
      const mockQuery = createMockQueryChain()
      mockQuery.populate = vi.fn().mockResolvedValue(mockCategories)
      OptionCategory.find = vi.fn().mockReturnValue(mockQuery)

      // Act
      const result = await dishTemplateService.getTemplateOptions(templateId, brandId)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].order).toBe(1) // First should be order 1
      expect(result[1].order).toBe(2) // Second should be order 2
      expect(result[0].category.name).toBe('Extra Options')
      expect(result[1].category.name).toBe('Size Options')
      
      // Check options are sorted by order
      expect(result[1].options[0].name).toBe('Medium') // Order 1 first
      expect(result[1].options[1].name).toBe('Large')  // Order 2 second
    })
  })
})