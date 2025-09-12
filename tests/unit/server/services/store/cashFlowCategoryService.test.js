import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock 所有外部依賴
vi.mock('../../../../../server/models/Store/CashFlowCategory.js')
vi.mock('../../../../../server/models/Store/Store.js')
vi.mock('../../../../../server/models/Brand/Brand.js')
vi.mock('../../../../../server/middlewares/error.js')

// 導入被測試的服務
import {
  getCategoriesByStore,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../../../../server/services/store/cashFlowCategoryService.js'

// 導入被 mock 的模組
import CashFlowCategory from '../../../../../server/models/Store/CashFlowCategory.js'
import Store from '../../../../../server/models/Store/Store.js'
import { AppError } from '../../../../../server/middlewares/error.js'

// 擴展 TestDataFactory 來支援 CashFlowCategory 相關的測試資料
TestDataFactory.createCashFlowCategory = function(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439030',
    name: '測試分類',
    type: 'income',
    store: '507f1f77bcf86cd799439014',
    brand: '507f1f77bcf86cd799439013',
    createdAt: new Date(),
    ...overrides
  }
}

describe('cashFlowCategoryService', () => {
  let mockCategory
  let mockStore
  let mockBrand

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockCategory = TestDataFactory.createCashFlowCategory()
    mockStore = TestDataFactory.createStore()
    mockBrand = TestDataFactory.createBrand()

    // 設定基本的 mock
    CashFlowCategory.find = vi.fn()
    CashFlowCategory.findById = vi.fn()
    CashFlowCategory.findOne = vi.fn()
    CashFlowCategory.findByIdAndUpdate = vi.fn()
    CashFlowCategory.findByIdAndDelete = vi.fn()
    
    Store.findById = vi.fn()
    
    // Mock AppError
    AppError.mockImplementation((message, statusCode) => {
      const error = new Error(message)
      error.statusCode = statusCode
      return error
    })
    
    // 重新設置 CashFlowCategory 為 mock 函數，可以作為 constructor 使用
    const mockCategoryInstance = {
      save: vi.fn().mockResolvedValue({})
    }
    vi.mocked(CashFlowCategory, true).mockImplementation = vi.fn().mockReturnValue(mockCategoryInstance)
  })

  describe('getCategoriesByStore', () => {
    it('應該成功獲取店鋪的所有分類', async () => {
      const storeId = mockStore._id
      const expectedCategories = [mockCategory]

      // 創建 mock 查詢鏈
      const mockChain = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(expectedCategories)
      }
      
      Store.findById.mockResolvedValue(mockStore)
      CashFlowCategory.find.mockReturnValue(mockChain)

      const result = await getCategoriesByStore(storeId)

      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(CashFlowCategory.find).toHaveBeenCalledWith({ store: storeId })
      expect(mockChain.populate).toHaveBeenCalledWith('brand', 'name')
      expect(mockChain.populate).toHaveBeenCalledWith('store', 'name')
      expect(mockChain.sort).toHaveBeenCalledWith({ type: 1, name: 1 })
      expect(result).toEqual(expectedCategories)
    })

    it('應該支援按類型過濾分類', async () => {
      const storeId = mockStore._id
      const options = { type: 'income' }
      const expectedCategories = [mockCategory]

      const mockChain = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(expectedCategories)
      }
      
      Store.findById.mockResolvedValue(mockStore)
      CashFlowCategory.find.mockReturnValue(mockChain)

      const result = await getCategoriesByStore(storeId, options)

      expect(CashFlowCategory.find).toHaveBeenCalledWith({ 
        store: storeId,
        type: 'income'
      })
      expect(result).toEqual(expectedCategories)
    })

    it('應該忽略無效的類型過濾', async () => {
      const storeId = mockStore._id
      const options = { type: 'invalid_type' }
      const expectedCategories = [mockCategory]

      const mockChain = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(expectedCategories)
      }
      
      Store.findById.mockResolvedValue(mockStore)
      CashFlowCategory.find.mockReturnValue(mockChain)

      const result = await getCategoriesByStore(storeId, options)

      expect(CashFlowCategory.find).toHaveBeenCalledWith({ store: storeId })
      expect(result).toEqual(expectedCategories)
    })

    it('當店鋪不存在時應該拋出錯誤', async () => {
      const storeId = 'nonexistent_store_id'

      Store.findById.mockResolvedValue(null)

      await expect(getCategoriesByStore(storeId))
        .rejects.toThrow('店舖不存在')
    })
  })

  describe('getCategoryById', () => {
    it('應該成功獲取指定的分類', async () => {
      const categoryId = mockCategory._id

      // 創建 mock 查詢鏈
      const mockChain = {
        populate: vi.fn().mockReturnThis()
      }
      
      // 設定 populate 鏈式調用
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce(mockCategory)
      
      CashFlowCategory.findById.mockReturnValue(mockChain)

      const result = await getCategoryById(categoryId)

      expect(CashFlowCategory.findById).toHaveBeenCalledWith(categoryId)
      expect(mockChain.populate).toHaveBeenCalledWith('brand', 'name')
      expect(mockChain.populate).toHaveBeenCalledWith('store', 'name')
      expect(result).toEqual(mockCategory)
    })

    it('當分類不存在時應該拋出錯誤', async () => {
      const categoryId = 'nonexistent_category_id'

      const mockChain = {
        populate: vi.fn().mockReturnThis()
      }
      
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce(null)
      
      CashFlowCategory.findById.mockReturnValue(mockChain)

      await expect(getCategoryById(categoryId))
        .rejects.toThrow('記帳分類不存在')
    })
  })

  describe('createCategory', () => {
    it.skip('應該成功創建分類', async () => {
      const categoryData = {
        name: '新分類',
        store: mockStore._id,
        type: 'income'
      }
      const mockStoreWithBrand = {
        ...mockStore,
        brand: mockBrand
      }
      const createdCategory = {
        ...mockCategory,
        ...categoryData,
        brand: mockBrand._id,
        _id: 'new_category_id'
      }

      Store.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStoreWithBrand)
      })
      CashFlowCategory.findOne.mockResolvedValue(null)
      
      // 在這個測試中設置 constructor mock
      const saveMock = vi.fn().mockResolvedValue(createdCategory)
      CashFlowCategory.mockImplementation.mockImplementationOnce((data) => ({
        ...data,
        _id: 'new_category_id',
        save: saveMock
      }))

      // Mock getCategoryById 的返回
      const mockGetCategoryChain = {
        populate: vi.fn().mockReturnThis()
      }
      mockGetCategoryChain.populate
        .mockReturnValueOnce(mockGetCategoryChain)
        .mockResolvedValueOnce(createdCategory)
      
      CashFlowCategory.findById.mockReturnValue(mockGetCategoryChain)

      const result = await createCategory(categoryData)

      expect(Store.findById).toHaveBeenCalledWith(categoryData.store)
      expect(CashFlowCategory.findOne).toHaveBeenCalledWith({
        store: categoryData.store,
        name: categoryData.name
      })
      expect(saveMock).toHaveBeenCalled()
      expect(result).toEqual(createdCategory)
    })

    it('當缺少必填欄位時應該拋出錯誤', async () => {
      const invalidData = {
        name: '測試分類'
        // 缺少 store 和 type
      }

      await expect(createCategory(invalidData))
        .rejects.toThrow('分類名稱、店舖和類型為必填欄位')
    })

    it('當類型無效時應該拋出錯誤', async () => {
      const invalidData = {
        name: '測試分類',
        store: mockStore._id,
        type: 'invalid_type'
      }

      await expect(createCategory(invalidData))
        .rejects.toThrow('類型必須為 income 或 expense')
    })

    it('當店鋪不存在時應該拋出錯誤', async () => {
      const categoryData = {
        name: '測試分類',
        store: 'nonexistent_store',
        type: 'income'
      }

      Store.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      await expect(createCategory(categoryData))
        .rejects.toThrow('店舖不存在')
    })

    it('當分類名稱重複時應該拋出錯誤', async () => {
      const categoryData = {
        name: '重複分類',
        store: mockStore._id,
        type: 'income'
      }
      const mockStoreWithBrand = {
        ...mockStore,
        brand: mockBrand
      }

      Store.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStoreWithBrand)
      })
      CashFlowCategory.findOne.mockResolvedValue(mockCategory)

      await expect(createCategory(categoryData))
        .rejects.toThrow('該店舖已存在相同名稱的記帳分類')
    })
  })

  describe('updateCategory', () => {
    it('應該成功更新分類', async () => {
      const categoryId = mockCategory._id
      const updateData = {
        name: '更新後的分類名稱',
        description: '更新後的描述'
      }
      const updatedCategory = {
        ...mockCategory,
        ...updateData
      }

      CashFlowCategory.findById.mockResolvedValue(mockCategory)
      CashFlowCategory.findOne.mockResolvedValue(null)
      
      const mockChain = {
        populate: vi.fn().mockReturnThis()
      }
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce(updatedCategory)
      
      CashFlowCategory.findByIdAndUpdate.mockReturnValue(mockChain)

      const result = await updateCategory(categoryId, updateData)

      expect(CashFlowCategory.findById).toHaveBeenCalledWith(categoryId)
      expect(CashFlowCategory.findByIdAndUpdate).toHaveBeenCalledWith(
        categoryId,
        updateData,
        { new: true }
      )
      expect(result).toEqual(updatedCategory)
    })

    it('當分類不存在時應該拋出錯誤', async () => {
      const categoryId = 'nonexistent_category'
      const updateData = { name: '新名稱' }

      CashFlowCategory.findById.mockResolvedValue(null)

      await expect(updateCategory(categoryId, updateData))
        .rejects.toThrow('記帳分類不存在')
    })

    it('當類型無效時應該拋出錯誤', async () => {
      const categoryId = mockCategory._id
      const updateData = {
        type: 'invalid_type'
      }

      CashFlowCategory.findById.mockResolvedValue(mockCategory)

      await expect(updateCategory(categoryId, updateData))
        .rejects.toThrow('類型必須為 income 或 expense')
    })

    it('當更新的名稱重複時應該拋出錯誤', async () => {
      const categoryId = mockCategory._id
      const updateData = {
        name: '重複名稱'
      }
      const existingCategory = TestDataFactory.createCashFlowCategory({
        _id: 'another_category_id',
        name: '重複名稱'
      })

      CashFlowCategory.findById.mockResolvedValue(mockCategory)
      CashFlowCategory.findOne.mockResolvedValue(existingCategory)

      await expect(updateCategory(categoryId, updateData))
        .rejects.toThrow('該店舖已存在相同名稱的記帳分類')
    })

    it('應該過濾掉不允許修改的欄位', async () => {
      const categoryId = mockCategory._id
      const updateData = {
        name: '新名稱',
        brand: 'should_be_removed',
        store: 'should_be_removed'
      }
      const expectedUpdateData = {
        name: '新名稱'
      }

      CashFlowCategory.findById.mockResolvedValue(mockCategory)
      CashFlowCategory.findOne.mockResolvedValue(null)
      
      const mockChain = {
        populate: vi.fn().mockReturnThis()
      }
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce(mockCategory)
      
      CashFlowCategory.findByIdAndUpdate.mockReturnValue(mockChain)

      await updateCategory(categoryId, updateData)

      expect(CashFlowCategory.findByIdAndUpdate).toHaveBeenCalledWith(
        categoryId,
        expectedUpdateData,
        { new: true }
      )
    })
  })

  describe('deleteCategory', () => {
    it('應該成功刪除分類', async () => {
      const categoryId = mockCategory._id

      CashFlowCategory.findById.mockResolvedValue(mockCategory)
      CashFlowCategory.findByIdAndDelete.mockResolvedValue(mockCategory)

      const result = await deleteCategory(categoryId)

      expect(CashFlowCategory.findById).toHaveBeenCalledWith(categoryId)
      expect(CashFlowCategory.findByIdAndDelete).toHaveBeenCalledWith(categoryId)
      expect(result).toBe(true)
    })

    it('當分類不存在時應該拋出錯誤', async () => {
      const categoryId = 'nonexistent_category'

      CashFlowCategory.findById.mockResolvedValue(null)

      await expect(deleteCategory(categoryId))
        .rejects.toThrow('記帳分類不存在')
    })
  })
})