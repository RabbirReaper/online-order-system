import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// 擴展 TestDataFactory 以支援 CashFlow 相關測試資料
TestDataFactory.createCashFlow = function(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439020',
    name: '測試記帳項目',
    amount: 1000,
    type: 'income',
    description: '測試描述',
    category: '507f1f77bcf86cd799439021',
    store: '507f1f77bcf86cd799439014',
    brand: '507f1f77bcf86cd799439013',
    admin: '507f1f77bcf86cd799439012',
    time: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

TestDataFactory.createCashFlowCategory = function(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439021',
    name: '測試分類',
    type: 'income',
    description: '測試分類描述',
    store: '507f1f77bcf86cd799439014',
    brand: '507f1f77bcf86cd799439013',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

// Mock 所有外部依賴 - 必須在動態導入之前
vi.mock('@server/models/Store/CashFlow.js', () => {
  const createMockQueryChain = () => {
    const chain = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(), 
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      find: vi.fn().mockReturnThis()
    }
    
    // 確保所有方法都返回相同的鏈式對象
    Object.keys(chain).forEach(key => {
      if (typeof chain[key] === 'function' && key !== 'limit') {
        chain[key] = vi.fn().mockReturnValue(chain)
      }
    })
    
    return chain
  }

  const MockCashFlow = vi.fn().mockImplementation((data) => ({
    ...data,
    _id: 'mock-cashflow-id',
    save: vi.fn().mockResolvedValue(),
    toObject: vi.fn().mockReturnValue({ ...data, _id: 'mock-cashflow-id' })
  }))

  Object.assign(MockCashFlow, {
    find: vi.fn().mockImplementation(() => createMockQueryChain()),
    findById: vi.fn().mockImplementation(() => createMockQueryChain()),
    findByIdAndUpdate: vi.fn().mockImplementation(() => createMockQueryChain()),
    findByIdAndDelete: vi.fn().mockResolvedValue(true),
    countDocuments: vi.fn().mockResolvedValue(0)
  })

  return { default: MockCashFlow }
})

vi.mock('@server/models/Store/CashFlowCategory.js', () => ({
  default: {
    findOne: vi.fn().mockResolvedValue(null)
  }
}))

vi.mock('@server/models/Store/Store.js', () => ({
  default: {
    findById: vi.fn().mockReturnValue({
      populate: vi.fn().mockResolvedValue(null)
    })
  }
}))

vi.mock('@server/models/User/Admin.js', () => ({
  default: {
    findById: vi.fn().mockResolvedValue(null)
  }
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

// 動態導入被測試的服務
const cashFlowService = await import('@server/services/store/cashFlowService.js')
const CashFlow = (await import('@server/models/Store/CashFlow.js')).default
const CashFlowCategory = (await import('@server/models/Store/CashFlowCategory.js')).default
const Store = (await import('@server/models/Store/Store.js')).default
const Admin = (await import('@server/models/User/Admin.js')).default

describe('CashFlowService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCashFlowsByStore', () => {
    it('should get cash flows with pagination successfully', async () => {
      // Arrange
      const storeId = 'store-123'
      const mockStore = TestDataFactory.createStore({ _id: storeId })
      const mockCashFlows = [
        TestDataFactory.createCashFlow({ store: storeId, type: 'income' }),
        TestDataFactory.createCashFlow({ store: storeId, type: 'expense' })
      ]

      Store.findById.mockResolvedValue(mockStore)
      CashFlow.countDocuments.mockResolvedValue(2)
      CashFlow.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockCashFlows)
      })

      // Act
      const result = await cashFlowService.getCashFlowsByStore(storeId, {
        page: 1,
        limit: 20
      })

      // Assert
      expect(result.data).toEqual(mockCashFlows)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.pages).toBe(1)
      expect(Store.findById).toHaveBeenCalledWith(storeId)
      expect(CashFlow.countDocuments).toHaveBeenCalled()
    })

    it('should filter by date range', async () => {
      // Arrange
      const storeId = 'store-123'
      const startDate = '2024-01-01'
      const endDate = '2024-01-31'
      const mockStore = TestDataFactory.createStore({ _id: storeId })

      Store.findById.mockResolvedValue(mockStore)
      CashFlow.countDocuments.mockResolvedValue(1)
      CashFlow.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      })

      // Act
      await cashFlowService.getCashFlowsByStore(storeId, { startDate, endDate })

      // Assert
      const expectedQuery = expect.objectContaining({
        store: storeId,
        time: expect.objectContaining({
          $gte: expect.any(Date),
          $lte: expect.any(Date)
        })
      })
      expect(CashFlow.find).toHaveBeenCalledWith(expectedQuery)
    })

    it('should filter by type', async () => {
      // Arrange
      const storeId = 'store-123'
      const type = 'income'
      const mockStore = TestDataFactory.createStore({ _id: storeId })

      Store.findById.mockResolvedValue(mockStore)
      CashFlow.countDocuments.mockResolvedValue(1)
      CashFlow.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      })

      // Act
      await cashFlowService.getCashFlowsByStore(storeId, { type })

      // Assert
      const expectedQuery = expect.objectContaining({
        store: storeId,
        type: 'income'
      })
      expect(CashFlow.find).toHaveBeenCalledWith(expectedQuery)
    })

    it('should filter by category', async () => {
      // Arrange
      const storeId = 'store-123'
      const categoryId = 'category-123'
      const mockStore = TestDataFactory.createStore({ _id: storeId })

      Store.findById.mockResolvedValue(mockStore)
      CashFlow.countDocuments.mockResolvedValue(1)
      CashFlow.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      })

      // Act
      await cashFlowService.getCashFlowsByStore(storeId, { categoryId })

      // Assert
      const expectedQuery = expect.objectContaining({
        store: storeId,
        category: categoryId
      })
      expect(CashFlow.find).toHaveBeenCalledWith(expectedQuery)
    })

    it('should support search functionality', async () => {
      // Arrange
      const storeId = 'store-123'
      const search = '午餐'
      const mockStore = TestDataFactory.createStore({ _id: storeId })

      Store.findById.mockResolvedValue(mockStore)
      CashFlow.countDocuments.mockResolvedValue(1)
      CashFlow.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      })

      // Act
      await cashFlowService.getCashFlowsByStore(storeId, { search })

      // Assert
      const expectedQuery = expect.objectContaining({
        store: storeId,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      })
      expect(CashFlow.find).toHaveBeenCalledWith(expectedQuery)
    })

    it('should throw error when store not found', async () => {
      // Arrange
      const storeId = 'nonexistent-store'
      Store.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(cashFlowService.getCashFlowsByStore(storeId))
        .rejects.toThrow('店舖不存在')
    })
  })

  describe('getCashFlowById', () => {
    it('should get cash flow by id successfully', async () => {
      // Arrange
      const cashFlowId = 'cashflow-123'
      const mockCashFlow = TestDataFactory.createCashFlow({ _id: cashFlowId })

      const mockChain = {
        populate: vi.fn().mockReturnThis()
      }
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockReturnValueOnce(mockChain)
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce(mockCashFlow)

      CashFlow.findById.mockReturnValue(mockChain)

      // Act
      const result = await cashFlowService.getCashFlowById(cashFlowId)

      // Assert
      expect(result).toEqual(mockCashFlow)
      expect(CashFlow.findById).toHaveBeenCalledWith(cashFlowId)
    })

    it('should throw error when cash flow not found', async () => {
      // Arrange
      const cashFlowId = 'nonexistent-cashflow'
      const mockChain = {
        populate: vi.fn().mockReturnThis()
      }
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockReturnValueOnce(mockChain)
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce(null)

      CashFlow.findById.mockReturnValue(mockChain)

      // Act & Assert
      await expect(cashFlowService.getCashFlowById(cashFlowId))
        .rejects.toThrow('記帳記錄不存在')
    })
  })

  describe('createCashFlow', () => {
    const mockStore = TestDataFactory.createStore({
      _id: 'store-123',
      brand: { _id: 'brand-123' }
    })
    const mockCategory = TestDataFactory.createCashFlowCategory({
      _id: 'category-123',
      store: 'store-123',
      type: 'income'
    })
    const mockAdmin = TestDataFactory.createAdmin({ _id: 'admin-123' })

    it('should create cash flow successfully', async () => {
      // Arrange
      const cashFlowData = {
        name: '銷售收入',
        amount: 1000,
        type: 'income',
        category: 'category-123',
        store: 'store-123',
        description: '餐點銷售收入'
      }
      const adminId = 'admin-123'

      Store.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStore)
      })
      CashFlowCategory.findOne.mockResolvedValue(mockCategory)
      Admin.findById.mockResolvedValue(mockAdmin)
      
      // Mock constructor creation
      const mockCreatedCashFlow = { _id: 'new-cashflow-id', ...cashFlowData }
      CashFlow.mockImplementationOnce((data) => ({
        ...data,
        _id: 'new-cashflow-id',
        save: vi.fn().mockResolvedValue()
      }))

      // Mock getCashFlowById for final return - 需要鏈式調用多個 populate
      const mockReturnChain = {
        populate: vi.fn().mockReturnThis()
      }
      mockReturnChain.populate
        .mockReturnValueOnce(mockReturnChain)
        .mockReturnValueOnce(mockReturnChain)
        .mockReturnValueOnce(mockReturnChain)
        .mockResolvedValueOnce(mockCreatedCashFlow)

      CashFlow.findById.mockReturnValue(mockReturnChain)

      // Act
      const result = await cashFlowService.createCashFlow(cashFlowData, adminId)

      // Assert
      expect(result).toBeDefined()
      expect(Store.findById).toHaveBeenCalledWith(cashFlowData.store)
      expect(CashFlowCategory.findOne).toHaveBeenCalledWith({
        _id: cashFlowData.category,
        store: cashFlowData.store
      })
      expect(Admin.findById).toHaveBeenCalledWith(adminId)
    })

    it('should throw error when required fields missing', async () => {
      // Arrange
      const invalidData = { amount: 100 } // Missing name, category, store
      const adminId = 'admin-123'

      // Act & Assert
      await expect(cashFlowService.createCashFlow(invalidData, adminId))
        .rejects.toThrow('名稱、金額、分類和店舖為必填欄位')
    })

    it('should throw error when amount is not positive', async () => {
      // Arrange
      const invalidData = {
        name: '測試',
        amount: -100,
        category: 'category-123',
        store: 'store-123',
        type: 'income'
      }
      const adminId = 'admin-123'

      // Act & Assert
      await expect(cashFlowService.createCashFlow(invalidData, adminId))
        .rejects.toThrow('金額必須大於0')
    })

    it('should throw error when type is invalid', async () => {
      // Arrange
      const invalidData = {
        name: '測試',
        amount: 100,
        category: 'category-123',
        store: 'store-123',
        type: 'invalid-type'
      }
      const adminId = 'admin-123'

      // Act & Assert
      await expect(cashFlowService.createCashFlow(invalidData, adminId))
        .rejects.toThrow('類型必須為 income 或 expense')
    })

    it('should throw error when store not found', async () => {
      // Arrange
      const cashFlowData = {
        name: '測試',
        amount: 100,
        category: 'category-123',
        store: 'nonexistent-store',
        type: 'income'
      }
      const adminId = 'admin-123'

      Store.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      // Act & Assert
      await expect(cashFlowService.createCashFlow(cashFlowData, adminId))
        .rejects.toThrow('店舖不存在')
    })

    it('should throw error when category not found or not belongs to store', async () => {
      // Arrange
      const cashFlowData = {
        name: '測試',
        amount: 100,
        category: 'nonexistent-category',
        store: 'store-123',
        type: 'income'
      }
      const adminId = 'admin-123'

      Store.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStore)
      })
      CashFlowCategory.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(cashFlowService.createCashFlow(cashFlowData, adminId))
        .rejects.toThrow('分類不存在或不屬於該店舖')
    })

    it('should throw error when type mismatch with category', async () => {
      // Arrange
      const cashFlowData = {
        name: '測試',
        amount: 100,
        category: 'category-123',
        store: 'store-123',
        type: 'expense' // Category is income type
      }
      const adminId = 'admin-123'

      Store.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStore)
      })
      CashFlowCategory.findOne.mockResolvedValue(mockCategory) // income type

      // Act & Assert
      await expect(cashFlowService.createCashFlow(cashFlowData, adminId))
        .rejects.toThrow('記帳類型必須與分類類型一致')
    })

    it('should throw error when admin not found', async () => {
      // Arrange
      const cashFlowData = {
        name: '測試',
        amount: 100,
        category: 'category-123',
        store: 'store-123',
        type: 'income'
      }
      const adminId = 'nonexistent-admin'

      Store.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStore)
      })
      CashFlowCategory.findOne.mockResolvedValue(mockCategory)
      Admin.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(cashFlowService.createCashFlow(cashFlowData, adminId))
        .rejects.toThrow('管理員不存在')
    })
  })

  describe('updateCashFlow', () => {
    const mockCashFlow = TestDataFactory.createCashFlow({
      _id: 'cashflow-123',
      store: 'store-123',
      type: 'income'
    })
    const mockAdmin = TestDataFactory.createAdmin({ _id: 'admin-123' })
    const mockCategory = TestDataFactory.createCashFlowCategory({
      _id: 'category-123',
      store: 'store-123',
      type: 'income'
    })

    it('should update cash flow successfully', async () => {
      // Arrange
      const cashFlowId = 'cashflow-123'
      const updateData = { name: '更新名稱', amount: 2000 }
      const adminId = 'admin-123'

      CashFlow.findById.mockResolvedValue(mockCashFlow)
      Admin.findById.mockResolvedValue(mockAdmin)
      const mockUpdateChain = {
        populate: vi.fn().mockReturnThis()
      }
      mockUpdateChain.populate
        .mockReturnValueOnce(mockUpdateChain)
        .mockReturnValueOnce(mockUpdateChain)
        .mockReturnValueOnce(mockUpdateChain)
        .mockResolvedValueOnce({ ...mockCashFlow, ...updateData })

      CashFlow.findByIdAndUpdate.mockReturnValue(mockUpdateChain)

      // Act
      const result = await cashFlowService.updateCashFlow(cashFlowId, updateData, adminId)

      // Assert
      expect(result.name).toBe(updateData.name)
      expect(CashFlow.findById).toHaveBeenCalledWith(cashFlowId)
      expect(Admin.findById).toHaveBeenCalledWith(adminId)
      expect(CashFlow.findByIdAndUpdate).toHaveBeenCalledWith(
        cashFlowId,
        expect.objectContaining({ ...updateData, admin: adminId }),
        { new: true }
      )
    })

    it('should throw error when cash flow not found', async () => {
      // Arrange
      const cashFlowId = 'nonexistent-cashflow'
      const updateData = { name: '更新名稱' }
      const adminId = 'admin-123'

      CashFlow.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(cashFlowService.updateCashFlow(cashFlowId, updateData, adminId))
        .rejects.toThrow('記帳記錄不存在')
    })

    it('should throw error when admin not found', async () => {
      // Arrange
      const cashFlowId = 'cashflow-123'
      const updateData = { name: '更新名稱' }
      const adminId = 'nonexistent-admin'

      CashFlow.findById.mockResolvedValue(mockCashFlow)
      Admin.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(cashFlowService.updateCashFlow(cashFlowId, updateData, adminId))
        .rejects.toThrow('管理員不存在')
    })

    it('should throw error when amount is not positive', async () => {
      // Arrange
      const cashFlowId = 'cashflow-123'
      const updateData = { amount: -100 }
      const adminId = 'admin-123'

      CashFlow.findById.mockResolvedValue(mockCashFlow)
      Admin.findById.mockResolvedValue(mockAdmin)

      // Act & Assert
      await expect(cashFlowService.updateCashFlow(cashFlowId, updateData, adminId))
        .rejects.toThrow('金額必須大於0')
    })

    it('should throw error when type is invalid', async () => {
      // Arrange
      const cashFlowId = 'cashflow-123'
      const updateData = { type: 'invalid-type' }
      const adminId = 'admin-123'

      CashFlow.findById.mockResolvedValue(mockCashFlow)
      Admin.findById.mockResolvedValue(mockAdmin)

      // Act & Assert
      await expect(cashFlowService.updateCashFlow(cashFlowId, updateData, adminId))
        .rejects.toThrow('類型必須為 income 或 expense')
    })

    it('should throw error when category not found or not belongs to store', async () => {
      // Arrange
      const cashFlowId = 'cashflow-123'
      const updateData = { category: 'nonexistent-category' }
      const adminId = 'admin-123'

      CashFlow.findById.mockResolvedValue(mockCashFlow)
      Admin.findById.mockResolvedValue(mockAdmin)
      CashFlowCategory.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(cashFlowService.updateCashFlow(cashFlowId, updateData, adminId))
        .rejects.toThrow('分類不存在或不屬於該店舖')
    })

    it('should throw error when type mismatch with category', async () => {
      // Arrange
      const cashFlowId = 'cashflow-123'
      const updateData = { type: 'expense', category: 'category-123' }
      const adminId = 'admin-123'

      CashFlow.findById.mockResolvedValue(mockCashFlow)
      Admin.findById.mockResolvedValue(mockAdmin)
      CashFlowCategory.findOne.mockResolvedValue(mockCategory) // income type

      // Act & Assert
      await expect(cashFlowService.updateCashFlow(cashFlowId, updateData, adminId))
        .rejects.toThrow('記帳類型必須與分類類型一致')
    })

    it('should not allow updating brand and store', async () => {
      // Arrange
      const cashFlowId = 'cashflow-123'
      const updateData = { 
        name: '更新名稱',
        brand: 'new-brand',
        store: 'new-store'
      }
      const adminId = 'admin-123'

      CashFlow.findById.mockResolvedValue(mockCashFlow)
      Admin.findById.mockResolvedValue(mockAdmin)
      const mockFinalChain = {
        populate: vi.fn().mockReturnThis()
      }
      mockFinalChain.populate
        .mockReturnValueOnce(mockFinalChain)
        .mockReturnValueOnce(mockFinalChain)
        .mockReturnValueOnce(mockFinalChain)
        .mockResolvedValueOnce({ ...mockCashFlow, name: updateData.name })

      CashFlow.findByIdAndUpdate.mockReturnValue(mockFinalChain)

      // Act
      await cashFlowService.updateCashFlow(cashFlowId, updateData, adminId)

      // Assert
      expect(CashFlow.findByIdAndUpdate).toHaveBeenCalledWith(
        cashFlowId,
        expect.not.objectContaining({
          brand: expect.anything(),
          store: expect.anything()
        }),
        { new: true }
      )
    })
  })

  describe('deleteCashFlow', () => {
    it('should delete cash flow successfully', async () => {
      // Arrange
      const cashFlowId = 'cashflow-123'
      const mockCashFlow = TestDataFactory.createCashFlow({ _id: cashFlowId })

      CashFlow.findById.mockResolvedValue(mockCashFlow)
      CashFlow.findByIdAndDelete.mockResolvedValue(true)

      // Act
      const result = await cashFlowService.deleteCashFlow(cashFlowId)

      // Assert
      expect(result).toBe(true)
      expect(CashFlow.findById).toHaveBeenCalledWith(cashFlowId)
      expect(CashFlow.findByIdAndDelete).toHaveBeenCalledWith(cashFlowId)
    })

    it('should throw error when cash flow not found', async () => {
      // Arrange
      const cashFlowId = 'nonexistent-cashflow'
      CashFlow.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(cashFlowService.deleteCashFlow(cashFlowId))
        .rejects.toThrow('記帳記錄不存在')
    })
  })

  describe('exportCashFlowCSV', () => {
    it('should export cash flow data to CSV format', async () => {
      // Arrange
      const storeId = 'store-123'
      const mockStore = TestDataFactory.createStore({ _id: storeId })
      const mockCashFlows = [
        {
          time: new Date('2024-01-15T10:30:00Z'),
          type: 'income',
          category: { name: '銷售收入' },
          amount: 1000,
          name: '午餐銷售',
          description: '餐點銷售',
          admin: { name: '張三' }
        },
        {
          time: new Date('2024-01-15T14:20:00Z'),
          type: 'expense',
          category: { name: '食材採購' },
          amount: 500,
          name: '蔬菜採購',
          description: '新鮮蔬菜',
          admin: { name: '李四' }
        }
      ]

      Store.findById.mockResolvedValue(mockStore)
      CashFlow.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockCashFlows)
      })

      // Act
      const result = await cashFlowService.exportCashFlowCSV(storeId, {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      })

      // Assert
      expect(result).toContain('日期,類型,分類,金額,名稱,描述,操作人員')
      expect(result).toContain('收入')
      expect(result).toContain('支出') 
      expect(result).toContain('午餐銷售')
      expect(result).toContain('蔬菜採購')
      expect(result).toMatch(/^\ufeff/) // UTF-8 BOM
    })

    it('should throw error when store not found for export', async () => {
      // Arrange
      const storeId = 'nonexistent-store'
      Store.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(cashFlowService.exportCashFlowCSV(storeId))
        .rejects.toThrow('店舖不存在')
    })

    it('should apply filters when exporting', async () => {
      // Arrange
      const storeId = 'store-123'
      const options = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        type: 'income',
        categoryId: 'category-123'
      }
      const mockStore = TestDataFactory.createStore({ _id: storeId })

      Store.findById.mockResolvedValue(mockStore)
      CashFlow.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([])
      })

      // Act
      await cashFlowService.exportCashFlowCSV(storeId, options)

      // Assert
      const expectedQuery = expect.objectContaining({
        store: storeId,
        type: 'income',
        category: 'category-123',
        time: expect.objectContaining({
          $gte: expect.any(Date),
          $lte: expect.any(Date)
        })
      })
      expect(CashFlow.find).toHaveBeenCalledWith(expectedQuery)
    })

    it('should handle CSV field escaping correctly', async () => {
      // Arrange
      const storeId = 'store-123'
      const mockStore = TestDataFactory.createStore({ _id: storeId })
      const mockCashFlows = [
        {
          time: new Date('2024-01-15T10:30:00Z'),
          type: 'income',
          category: { name: '銷售,收入' }, // Contains comma
          amount: 1000,
          name: '午餐"特價"銷售', // Contains quotes
          description: '包含\n換行的描述', // Contains newline
          admin: { name: '張三' }
        }
      ]

      Store.findById.mockResolvedValue(mockStore)
      CashFlow.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockCashFlows)
      })

      // Act
      const result = await cashFlowService.exportCashFlowCSV(storeId)

      // Assert
      expect(result).toContain('"銷售,收入"') // Comma escaped
      expect(result).toContain('"午餐""特價""銷售"') // Quotes escaped
      expect(result).toContain('"包含\n換行的描述"') // Newline preserved
    })
  })
})