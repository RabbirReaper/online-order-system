import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestDataFactory } from '../../../../setup.js'

// Mock 外部依賴
const mockPointRule = vi.fn().mockImplementation((data) => ({
  ...data,
  _id: '507f1f77bcf86cd799439030',
  save: vi.fn().mockResolvedValue(),
  deleteOne: vi.fn().mockResolvedValue()
}))

// 設置靜態方法
mockPointRule.find = vi.fn().mockReturnValue({
  sort: vi.fn().mockResolvedValue([])
})
mockPointRule.findOne = vi.fn()

// Mock mongoose
const mockMongoose = {
  Types: {
    ObjectId: vi.fn()
  }
}

vi.mock('@server/models/Promotion/PointRule.js', () => ({ default: mockPointRule }))
vi.mock('mongoose', () => ({ default: mockMongoose, ...mockMongoose }))

// 動態導入服務
const pointRuleService = await import('@server/services/promotion/pointRuleService.js')
const { AppError } = await import('@server/middlewares/error.js')

describe('PointRuleService', () => {
  // 測試資料
  const testBrandId = '507f1f77bcf86cd799439012'
  const testRuleId = '507f1f77bcf86cd799439030'
  const testNow = new Date('2024-01-15T10:00:00.000Z')

  // Mock 資料
  const mockRuleData = {
    _id: testRuleId,
    brand: testBrandId,
    name: '購買金額點數規則',
    description: '每消費100元獲得1點',
    type: 'purchase_amount',
    conversionRate: 100,
    minimumAmount: 0,
    validityDays: 60,
    isActive: true,
    createdAt: testNow,
    save: vi.fn().mockResolvedValue(),
    deleteOne: vi.fn().mockResolvedValue()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllPointRules', () => {
    it('should return all point rules for a brand', async () => {
      // Arrange
      const expectedRules = [mockRuleData]
      mockPointRule.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue(expectedRules)
      })

      // Act
      const result = await pointRuleService.getAllPointRules(testBrandId)

      // Assert
      expect(mockPointRule.find).toHaveBeenCalledWith({ brand: testBrandId })
      expect(result).toEqual(expectedRules)
    })

    it('should throw error when brandId is missing', async () => {
      // Act & Assert
      await expect(pointRuleService.getAllPointRules())
        .rejects.toThrow('品牌ID為必填欄位')

      await expect(pointRuleService.getAllPointRules(''))
        .rejects.toThrow('品牌ID為必填欄位')

      await expect(pointRuleService.getAllPointRules(null))
        .rejects.toThrow('品牌ID為必填欄位')
    })
  })

  describe('getPointRuleById', () => {
    it('should return point rule when found with correct brand', async () => {
      // Arrange
      mockPointRule.findOne.mockResolvedValue(mockRuleData)

      // Act
      const result = await pointRuleService.getPointRuleById(testRuleId, testBrandId)

      // Assert
      expect(mockPointRule.findOne).toHaveBeenCalledWith({
        _id: testRuleId,
        brand: testBrandId
      })
      expect(result).toEqual(mockRuleData)
    })

    it('should throw error when point rule not found', async () => {
      // Arrange
      mockPointRule.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(pointRuleService.getPointRuleById(testRuleId, testBrandId))
        .rejects.toThrow('點數規則不存在或無權訪問')
    })

    it('should throw error when brand does not match', async () => {
      // Arrange
      mockPointRule.findOne.mockResolvedValue(null)
      const wrongBrandId = '507f1f77bcf86cd799439999'

      // Act & Assert
      await expect(pointRuleService.getPointRuleById(testRuleId, wrongBrandId))
        .rejects.toThrow('點數規則不存在或無權訪問')
    })
  })

  describe('createPointRule', () => {
    const validRuleData = {
      brand: testBrandId,
      name: '測試點數規則',
      type: 'purchase_amount',
      conversionRate: 100,
      minimumAmount: 0,
      validityDays: 60,
      isActive: true
    }

    it('should create point rule with valid data', async () => {
      // Arrange
      mockPointRule.findOne.mockResolvedValue(null) // 沒有衝突的規則
      const newRuleInstance = {
        ...validRuleData,
        _id: testRuleId,
        save: vi.fn().mockResolvedValue()
      }
      mockPointRule.mockReturnValue(newRuleInstance)

      // Act
      const result = await pointRuleService.createPointRule(validRuleData)

      // Assert
      expect(mockPointRule).toHaveBeenCalledWith(validRuleData)
      expect(newRuleInstance.save).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should throw error when required fields are missing', async () => {
      // Test missing name
      const dataWithoutName = { ...validRuleData }
      delete dataWithoutName.name

      await expect(pointRuleService.createPointRule(dataWithoutName))
        .rejects.toThrow('名稱、類型和轉換率為必填欄位')

      // Test missing type
      const dataWithoutType = { ...validRuleData }
      delete dataWithoutType.type

      await expect(pointRuleService.createPointRule(dataWithoutType))
        .rejects.toThrow('名稱、類型和轉換率為必填欄位')

      // Test missing conversionRate
      const dataWithoutRate = { ...validRuleData }
      delete dataWithoutRate.conversionRate

      await expect(pointRuleService.createPointRule(dataWithoutRate))
        .rejects.toThrow('名稱、類型和轉換率為必填欄位')
    })

    it('should throw error when conversionRate is undefined', async () => {
      // Arrange
      const dataWithUndefinedRate = { ...validRuleData, conversionRate: undefined }

      // Act & Assert
      await expect(pointRuleService.createPointRule(dataWithUndefinedRate))
        .rejects.toThrow('名稱、類型和轉換率為必填欄位')
    })

    it('should allow creating inactive rule even when active rule exists', async () => {
      // Arrange
      const inactiveRuleData = { ...validRuleData, isActive: false }
      mockPointRule.findOne.mockResolvedValue(mockRuleData) // 存在啟用的規則
      
      const newRuleInstance = {
        ...inactiveRuleData,
        _id: testRuleId,
        save: vi.fn().mockResolvedValue()
      }
      mockPointRule.mockReturnValue(newRuleInstance)

      // Act
      const result = await pointRuleService.createPointRule(inactiveRuleData)

      // Assert
      expect(mockPointRule).toHaveBeenCalledWith(inactiveRuleData)
      expect(result).toBeDefined()
    })

    it('should throw error when active rule of same type already exists', async () => {
      // Arrange
      mockPointRule.findOne.mockResolvedValue(mockRuleData) // 模擬已存在啟用規則

      // Act & Assert
      await expect(pointRuleService.createPointRule(validRuleData))
        .rejects.toThrow(`已存在啟用的 ${validRuleData.type} 類型規則，請先停用現有規則`)

      expect(mockPointRule.findOne).toHaveBeenCalledWith({
        brand: validRuleData.brand,
        type: validRuleData.type,
        isActive: true
      })
    })
  })

  describe('updatePointRule', () => {
    const updateData = {
      name: '更新的點數規則',
      conversionRate: 50,
      isActive: true
    }

    it('should update point rule with valid data', async () => {
      // Arrange
      const mockRule = {
        ...mockRuleData,
        isActive: false,
        save: vi.fn().mockResolvedValue()
      }
      // 第一次調用：找到要更新的規則
      // 第二次調用：檢查是否有衝突規則（沒有找到衝突規則）
      mockPointRule.findOne
        .mockResolvedValueOnce(mockRule)
        .mockResolvedValueOnce(null)

      // Act
      const result = await pointRuleService.updatePointRule(testRuleId, updateData, testBrandId)

      // Assert
      expect(mockPointRule.findOne).toHaveBeenCalledWith({
        _id: testRuleId,
        brand: testBrandId
      })
      expect(mockRule.save).toHaveBeenCalled()
      expect(result).toEqual(mockRule)
    })

    it('should throw error when point rule not found', async () => {
      // Arrange
      mockPointRule.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(pointRuleService.updatePointRule(testRuleId, updateData, testBrandId))
        .rejects.toThrow('點數規則不存在或無權訪問')
    })

    it('should prevent updating brand field', async () => {
      // Arrange
      const mockRule = {
        ...mockRuleData,
        save: vi.fn().mockResolvedValue(),
        brand: testBrandId
      }
      mockPointRule.findOne.mockResolvedValue(mockRule)
      const updateDataWithBrand = { ...updateData, brand: '507f1f77bcf86cd799439999' }

      // Act
      await pointRuleService.updatePointRule(testRuleId, updateDataWithBrand, testBrandId)

      // Assert
      expect(mockRule.brand).toBe(testBrandId) // brand 應該沒有被改變
    })

    it('should throw error when activating rule but same type active rule exists', async () => {
      // Arrange
      const mockRule = {
        ...mockRuleData,
        isActive: false,
        type: 'purchase_amount',
        save: vi.fn().mockResolvedValue()
      }
      mockPointRule.findOne
        .mockResolvedValueOnce(mockRule) // 第一次調用：找到要更新的規則
        .mockResolvedValueOnce(mockRuleData) // 第二次調用：找到衝突的啟用規則

      const activateData = { isActive: true }

      // Act & Assert
      await expect(pointRuleService.updatePointRule(testRuleId, activateData, testBrandId))
        .rejects.toThrow(`已存在啟用的 ${mockRule.type} 類型規則，請先停用現有規則`)
    })

    it('should allow activating rule when no conflicting active rule exists', async () => {
      // Arrange
      const mockRule = {
        ...mockRuleData,
        isActive: false,
        save: vi.fn().mockResolvedValue()
      }
      mockPointRule.findOne
        .mockResolvedValueOnce(mockRule) // 第一次調用：找到要更新的規則
        .mockResolvedValueOnce(null) // 第二次調用：沒有衝突的啟用規則

      const activateData = { isActive: true }

      // Act
      const result = await pointRuleService.updatePointRule(testRuleId, activateData, testBrandId)

      // Assert
      expect(mockRule.save).toHaveBeenCalled()
      expect(result).toEqual(mockRule)
    })
  })

  describe('deletePointRule', () => {
    it('should delete inactive point rule', async () => {
      // Arrange
      const mockInactiveRule = {
        ...mockRuleData,
        isActive: false,
        deleteOne: vi.fn().mockResolvedValue()
      }
      mockPointRule.findOne.mockResolvedValue(mockInactiveRule)

      // Act
      const result = await pointRuleService.deletePointRule(testRuleId, testBrandId)

      // Assert
      expect(mockPointRule.findOne).toHaveBeenCalledWith({
        _id: testRuleId,
        brand: testBrandId
      })
      expect(mockInactiveRule.deleteOne).toHaveBeenCalled()
      expect(result).toEqual({ success: true, message: '點數規則已刪除' })
    })

    it('should throw error when point rule not found', async () => {
      // Arrange
      mockPointRule.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(pointRuleService.deletePointRule(testRuleId, testBrandId))
        .rejects.toThrow('點數規則不存在或無權訪問')
    })

    it('should throw error when trying to delete active point rule', async () => {
      // Arrange
      const mockActiveRule = { ...mockRuleData, isActive: true }
      mockPointRule.findOne.mockResolvedValue(mockActiveRule)

      // Act & Assert
      await expect(pointRuleService.deletePointRule(testRuleId, testBrandId))
        .rejects.toThrow('無法刪除啟用中的規則，請先停用規則')
    })
  })

  describe('getActivePointRules', () => {
    it('should return active point rules for brand', async () => {
      // Arrange
      const activeRules = [
        { ...mockRuleData, isActive: true },
        { ...mockRuleData, _id: '507f1f77bcf86cd799439031', type: 'first_purchase', isActive: true }
      ]
      mockPointRule.find.mockResolvedValue(activeRules)

      // Act
      const result = await pointRuleService.getActivePointRules(testBrandId)

      // Assert
      expect(mockPointRule.find).toHaveBeenCalledWith({
        brand: testBrandId,
        isActive: true
      })
      expect(result).toEqual(activeRules)
    })

    it('should return empty array when no active rules exist', async () => {
      // Arrange
      mockPointRule.find.mockResolvedValue([])

      // Act
      const result = await pointRuleService.getActivePointRules(testBrandId)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('calculateOrderPoints', () => {
    it('should calculate points correctly when rule exists and meets minimum amount', async () => {
      // Arrange
      const orderAmount = 250
      const expectedPoints = Math.floor(orderAmount / mockRuleData.conversionRate)
      mockPointRule.findOne.mockResolvedValue(mockRuleData)

      // Act
      const result = await pointRuleService.calculateOrderPoints(testBrandId, orderAmount)

      // Assert
      expect(mockPointRule.findOne).toHaveBeenCalledWith({
        brand: testBrandId,
        type: 'purchase_amount',
        isActive: true
      })
      expect(result).toEqual({
        points: expectedPoints,
        rule: mockRuleData
      })
    })

    it('should return 0 points when no active rule exists', async () => {
      // Arrange
      mockPointRule.findOne.mockResolvedValue(null)

      // Act
      const result = await pointRuleService.calculateOrderPoints(testBrandId, 100)

      // Assert
      expect(result).toBe(0)
    })

    it('should return 0 points when order amount is below minimum', async () => {
      // Arrange
      const ruleWithMinimum = { ...mockRuleData, minimumAmount: 100 }
      mockPointRule.findOne.mockResolvedValue(ruleWithMinimum)
      const orderAmount = 50 // 低於最低消費金額

      // Act
      const result = await pointRuleService.calculateOrderPoints(testBrandId, orderAmount)

      // Assert
      expect(result).toBe(0)
    })

    it('should calculate points with floor function', async () => {
      // Arrange
      const ruleWith75Rate = { ...mockRuleData, conversionRate: 75 }
      mockPointRule.findOne.mockResolvedValue(ruleWith75Rate)
      const orderAmount = 199 // 199/75 = 2.65，應該向下取整為 2

      // Act
      const result = await pointRuleService.calculateOrderPoints(testBrandId, orderAmount)

      // Assert
      expect(result.points).toBe(2)
      expect(result.rule).toEqual(ruleWith75Rate)
    })

    it('should handle zero order amount', async () => {
      // Arrange
      mockPointRule.findOne.mockResolvedValue(mockRuleData)

      // Act
      const result = await pointRuleService.calculateOrderPoints(testBrandId, 0)

      // Assert
      // 當訂單金額為0時，應該返回 {points: 0, rule: rule}，因為 0 >= minimumAmount (0)
      expect(result).toEqual({
        points: 0,
        rule: mockRuleData
      })
    })
  })
})

// 擴展 TestDataFactory（在測試文件中）
TestDataFactory.createPointRule = (overrides = {}) => {
  return {
    _id: '507f1f77bcf86cd799439030',
    brand: '507f1f77bcf86cd799439012',
    name: '購買金額點數規則',
    description: '每消費100元獲得1點',
    type: 'purchase_amount',
    conversionRate: 100,
    minimumAmount: 0,
    validityDays: 60,
    isActive: true,
    createdAt: new Date('2024-01-15T10:00:00.000Z'),
    ...overrides
  }
}