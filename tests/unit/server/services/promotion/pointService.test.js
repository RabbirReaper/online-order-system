// tests/unit/server/services/promotion/pointService.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestDataFactory } from '../../../../setup.js';

describe('PointService', () => {
  let pointService;
  let mockPointInstance;
  let mockMongoose;

  // 測試資料
  const testUserId = '507f1f77bcf86cd799439011';
  const testBrandId = '507f1f77bcf86cd799439012';
  const testNow = new Date('2024-01-15T10:00:00.000Z');

  beforeEach(async () => {
    // 重置所有 mock
    vi.clearAllMocks();

    // Mock PointInstance 模型
    mockPointInstance = vi.fn().mockImplementation((data) => ({
      ...data,
      _id: '507f1f77bcf86cd799439999',
      save: vi.fn().mockResolvedValue(),
      deleteOne: vi.fn().mockResolvedValue()
    }));

    // 設置靜態方法
    mockPointInstance.countDocuments = vi.fn();
    mockPointInstance.find = vi.fn();
    mockPointInstance.updateMany = vi.fn();
    mockPointInstance.insertMany = vi.fn();
    mockPointInstance.aggregate = vi.fn();
    mockPointInstance.populate = vi.fn();

    // Mock mongoose
    mockMongoose = {
      Types: {
        ObjectId: vi.fn().mockImplementation((id) => id || 'mocked-object-id')
      }
    };

    // Mock 模組
    vi.doMock('mongoose', () => ({
      default: mockMongoose,
      ...mockMongoose
    }));

    vi.doMock('../../../../../server/models/Promotion/PointInstance.js', () => ({
      default: mockPointInstance
    }));

    // Mock Date
    vi.useFakeTimers();
    vi.setSystemTime(testNow);

    // 動態導入服務
    pointService = await import('../../../../../server/services/promotion/pointService.js');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  describe('getUserPointsBalance', () => {
    it('should return correct points balance', async () => {
      // Arrange
      mockPointInstance.updateMany.mockResolvedValue({ modifiedCount: 2 });
      mockPointInstance.countDocuments.mockResolvedValue(10);

      // Act
      const balance = await pointService.getUserPointsBalance(testUserId, testBrandId);

      // Assert
      expect(balance).toBe(10);
      expect(mockPointInstance.updateMany).toHaveBeenCalledWith(
        {
          user: testUserId,
          brand: testBrandId,
          status: 'active',
          expiryDate: { $lt: testNow }
        },
        {
          $set: { status: 'expired' }
        }
      );
      expect(mockPointInstance.countDocuments).toHaveBeenCalledWith({
        user: expect.any(Object),
        brand: expect.any(Object),
        status: 'active'
      });
    });

    it('should return 0 when no points available', async () => {
      // Arrange
      mockPointInstance.updateMany.mockResolvedValue({ modifiedCount: 0 });
      mockPointInstance.countDocuments.mockResolvedValue(0);

      // Act
      const balance = await pointService.getUserPointsBalance(testUserId, testBrandId);

      // Assert
      expect(balance).toBe(0);
    });
  });

  describe('getUserPoints', () => {
    it('should return sorted active points', async () => {
      // Arrange
      const mockPoints = [
        { _id: '1', amount: 1, expiryDate: new Date('2024-02-01'), status: 'active' },
        { _id: '2', amount: 1, expiryDate: new Date('2024-01-20'), status: 'active' }
      ];

      mockPointInstance.updateMany.mockResolvedValue({ modifiedCount: 1 });
      
      const mockQuery = {
        sort: vi.fn().mockResolvedValue(mockPoints)
      };
      mockPointInstance.find.mockReturnValue(mockQuery);

      // Act
      const result = await pointService.getUserPoints(testUserId, testBrandId);

      // Assert
      expect(result).toEqual(mockPoints);
      expect(mockPointInstance.find).toHaveBeenCalledWith({
        user: testUserId,
        brand: testBrandId,
        status: 'active'
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ expiryDate: 1, createdAt: 1 });
    });

    it('should handle expired points before returning active ones', async () => {
      // Arrange
      mockPointInstance.updateMany.mockResolvedValue({ modifiedCount: 3 });
      
      const mockQuery = {
        sort: vi.fn().mockResolvedValue([])
      };
      mockPointInstance.find.mockReturnValue(mockQuery);

      // Act
      const result = await pointService.getUserPoints(testUserId, testBrandId);

      // Assert
      expect(mockPointInstance.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          user: testUserId,
          brand: testBrandId,
          status: 'active',
          expiryDate: { $lt: testNow }
        }),
        { $set: { status: 'expired' } }
      );
      expect(result).toEqual([]);
    });
  });

  describe('usePoints', () => {
    it('should use points successfully for valid order', async () => {
      // Arrange
      const usageInfo = { model: 'Order', id: '507f1f77bcf86cd799439020' };
      const pointsToUse = 3;
      
      // Mock getUserPointsBalance
      mockPointInstance.updateMany.mockResolvedValue({ modifiedCount: 0 });
      mockPointInstance.countDocuments.mockResolvedValue(5);
      
      // Mock getUserPoints
      const mockPoints = [
        { _id: '1', status: 'active', expiryDate: new Date('2024-02-01'), save: vi.fn().mockResolvedValue() },
        { _id: '2', status: 'active', expiryDate: new Date('2024-02-05'), save: vi.fn().mockResolvedValue() },
        { _id: '3', status: 'active', expiryDate: new Date('2024-02-10'), save: vi.fn().mockResolvedValue() },
        { _id: '4', status: 'active', expiryDate: new Date('2024-02-15'), save: vi.fn().mockResolvedValue() }
      ];

      const mockQuery = {
        sort: vi.fn().mockResolvedValue(mockPoints)
      };
      mockPointInstance.find.mockReturnValue(mockQuery);

      // Act
      const result = await pointService.usePoints(testUserId, testBrandId, pointsToUse, usageInfo);

      // Assert
      expect(result.success).toBe(true);
      expect(result.pointsUsed).toBe(3);
      expect(result.remainingPoints).toBe(2);
      expect(result.usedPoints).toHaveLength(3);
      
      // 檢查點數被正確標記為已使用
      expect(mockPoints[0].status).toBe('used');
      expect(mockPoints[1].status).toBe('used');
      expect(mockPoints[2].status).toBe('used');
      expect(mockPoints[3].status).toBe('active'); // 第4個點數不應該被使用
      
      // 檢查所有使用的點數都被保存
      expect(mockPoints[0].save).toHaveBeenCalled();
      expect(mockPoints[1].save).toHaveBeenCalled();
      expect(mockPoints[2].save).toHaveBeenCalled();
    });

    it('should throw error when insufficient points', async () => {
      // Arrange
      const usageInfo = { model: 'Order', id: '507f1f77bcf86cd799439020' };
      const pointsToUse = 10;

      mockPointInstance.updateMany.mockResolvedValue({ modifiedCount: 0 });
      mockPointInstance.countDocuments.mockResolvedValue(5);

      // Act & Assert
      await expect(pointService.usePoints(testUserId, testBrandId, pointsToUse, usageInfo))
        .rejects
        .toThrow('點數不足，需要 10 點，目前有 5 點');
    });

    it('should throw error for invalid usage info', async () => {
      // Arrange
      const pointsToUse = 3;
      const invalidUsageInfo = { model: 'Order' }; // 缺少 id

      // Act & Assert
      await expect(pointService.usePoints(testUserId, testBrandId, pointsToUse, invalidUsageInfo))
        .rejects
        .toThrow('使用資訊參數不完整');
    });

    it('should throw error for unsupported model', async () => {
      // Arrange
      const pointsToUse = 3;
      const invalidUsageInfo = { model: 'UnsupportedModel', id: '507f1f77bcf86cd799439020' };

      // Act & Assert
      await expect(pointService.usePoints(testUserId, testBrandId, pointsToUse, invalidUsageInfo))
        .rejects
        .toThrow('不支援的使用模型: UnsupportedModel');
    });

    it('should throw error when no active points available', async () => {
      // Arrange
      const usageInfo = { model: 'Order', id: '507f1f77bcf86cd799439020' };
      const pointsToUse = 1;

      mockPointInstance.updateMany.mockResolvedValue({ modifiedCount: 0 });
      mockPointInstance.countDocuments.mockResolvedValue(1);
      
      const mockQuery = {
        sort: vi.fn().mockResolvedValue([])
      };
      mockPointInstance.find.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(pointService.usePoints(testUserId, testBrandId, pointsToUse, usageInfo))
        .rejects
        .toThrow('沒有可用的點數');
    });

    it('should handle save errors properly', async () => {
      // Arrange
      const usageInfo = { model: 'Order', id: '507f1f77bcf86cd799439020' };
      const pointsToUse = 1;
      
      mockPointInstance.updateMany.mockResolvedValue({ modifiedCount: 0 });
      mockPointInstance.countDocuments.mockResolvedValue(2);
      
      const mockPoints = [
        { _id: '1', status: 'active', expiryDate: new Date('2024-02-01'), save: vi.fn().mockRejectedValue(new Error('Save failed')) }
      ];

      const mockQuery = {
        sort: vi.fn().mockResolvedValue(mockPoints)
      };
      mockPointInstance.find.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(pointService.usePoints(testUserId, testBrandId, pointsToUse, usageInfo))
        .rejects
        .toThrow('點數使用記錄保存失敗');
    });
  });

  describe('markExpiredPoints', () => {
    it('should mark expired points correctly', async () => {
      // Arrange
      mockPointInstance.updateMany.mockResolvedValue({ modifiedCount: 5 });

      // Act
      const result = await pointService.markExpiredPoints();

      // Assert
      expect(result).toBe(5);
      expect(mockPointInstance.updateMany).toHaveBeenCalledWith(
        {
          status: 'active',
          expiryDate: { $lt: testNow }
        },
        {
          $set: { status: 'expired' }
        }
      );
    });

    it('should return 0 when no points to mark', async () => {
      // Arrange
      mockPointInstance.updateMany.mockResolvedValue({ modifiedCount: 0 });

      // Act
      const result = await pointService.markExpiredPoints();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('refundPointsForTransaction', () => {
    it('should refund points for bundle redemption', async () => {
      // Arrange
      const relatedModel = 'BundleRedemption';
      const relatedId = '507f1f77bcf86cd799439030';
      
      const mockPointsToRefund = [
        { 
          _id: '1', 
          expiryDate: new Date('2024-02-01'), 
          status: 'used',
          usedAt: new Date('2024-01-10'),
          usedIn: { model: relatedModel, id: relatedId },
          save: vi.fn().mockResolvedValue()
        },
        { 
          _id: '2', 
          expiryDate: new Date('2024-01-10'), // 已過期
          status: 'used',
          usedAt: new Date('2024-01-05'),
          usedIn: { model: relatedModel, id: relatedId },
          save: vi.fn().mockResolvedValue()
        }
      ];

      mockPointInstance.find.mockResolvedValue(mockPointsToRefund);

      // Act
      const result = await pointService.refundPointsForTransaction(relatedModel, relatedId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.refundedCount).toBe(2);
      expect(result.details).toHaveLength(2);
      
      // 檢查第一個點數（未過期）被重新啟用
      expect(mockPointsToRefund[0].status).toBe('active');
      expect(mockPointsToRefund[0].usedAt).toBeNull();
      expect(mockPointsToRefund[0].usedIn).toBeNull();
      
      // 檢查第二個點數（已過期）標記為過期
      expect(mockPointsToRefund[1].status).toBe('expired');
      
      expect(mockPointsToRefund[0].save).toHaveBeenCalled();
      expect(mockPointsToRefund[1].save).toHaveBeenCalled();
    });

    it('should throw error for unsupported model', async () => {
      // Arrange
      const relatedModel = 'UnsupportedModel';
      const relatedId = '507f1f77bcf86cd799439030';

      // Act & Assert
      await expect(pointService.refundPointsForTransaction(relatedModel, relatedId))
        .rejects
        .toThrow('不支援的關聯模型: UnsupportedModel');
    });

    it('should handle no points to refund', async () => {
      // Arrange
      const relatedModel = 'BundleRedemption';
      const relatedId = '507f1f77bcf86cd799439030';
      
      mockPointInstance.find.mockResolvedValue([]);

      // Act
      const result = await pointService.refundPointsForTransaction(relatedModel, relatedId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('沒有找到需要退還的點數');
      expect(result.refundedCount).toBe(0);
    });
  });

  describe('addPointsToUser', () => {
    it('should add points to user successfully', async () => {
      // Arrange
      const amount = 3;
      const source = '滿額贈送';
      const sourceInfo = { model: 'Order', id: '507f1f77bcf86cd799439040' };
      const validityDays = 30;

      const mockSavedInstances = [
        { _id: '1', amount: 1, source, status: 'active' },
        { _id: '2', amount: 1, source, status: 'active' },
        { _id: '3', amount: 1, source, status: 'active' }
      ];

      mockPointInstance.insertMany.mockResolvedValue(mockSavedInstances);

      // Act
      const result = await pointService.addPointsToUser(
        testUserId, 
        testBrandId, 
        amount, 
        source, 
        sourceInfo, 
        validityDays
      );

      // Assert
      expect(result).toEqual(mockSavedInstances);
      expect(mockPointInstance.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user: testUserId,
            brand: testBrandId,
            amount: 1,
            source,
            status: 'active',
            sourceModel: 'Order',
            sourceId: '507f1f77bcf86cd799439040'
          })
        ])
      );
      
      // 檢查創建了正確數量的點數實例
      const createdInstances = mockPointInstance.insertMany.mock.calls[0][0];
      expect(createdInstances).toHaveLength(3);
      createdInstances.forEach(instance => {
        expect(instance.amount).toBe(1);
        expect(instance.source).toBe(source);
      });
    });

    it('should add points without source info', async () => {
      // Arrange
      const amount = 2;
      const source = '滿額贈送';
      const validityDays = 30;

      const mockSavedInstances = [
        { _id: '1', amount: 1, source, status: 'active' },
        { _id: '2', amount: 1, source, status: 'active' }
      ];

      mockPointInstance.insertMany.mockResolvedValue(mockSavedInstances);

      // Act
      const result = await pointService.addPointsToUser(
        testUserId, 
        testBrandId, 
        amount, 
        source, 
        null, 
        validityDays
      );

      // Assert
      expect(result).toEqual(mockSavedInstances);
      
      const createdInstances = mockPointInstance.insertMany.mock.calls[0][0];
      expect(createdInstances).toHaveLength(2);
      createdInstances.forEach(instance => {
        expect(instance).not.toHaveProperty('sourceModel');
        expect(instance).not.toHaveProperty('sourceId');
      });
    });

    it('should throw error for missing required parameters', async () => {
      // Act & Assert
      await expect(pointService.addPointsToUser(null, testBrandId, 1, '滿額贈送', null, 30))
        .rejects
        .toThrow('缺少必要參數');

      await expect(pointService.addPointsToUser(testUserId, null, 1, '滿額贈送', null, 30))
        .rejects
        .toThrow('缺少必要參數');

      await expect(pointService.addPointsToUser(testUserId, testBrandId, 0, '滿額贈送', null, 30))
        .rejects
        .toThrow('缺少必要參數');

      await expect(pointService.addPointsToUser(testUserId, testBrandId, 1, '', null, 30))
        .rejects
        .toThrow('缺少必要參數');

      await expect(pointService.addPointsToUser(testUserId, testBrandId, 1, '滿額贈送', null, null))
        .rejects
        .toThrow('缺少必要參數');
    });
  });

  describe('getUserPointHistory', () => {
    it('should return paginated point history', async () => {
      // Arrange
      const mockAggregateResult = [
        {
          source: '滿額贈送',
          sourceModel: 'Order',
          sourceId: '507f1f77bcf86cd799439050',
          status: 'used',
          amount: 2,
          createdAt: new Date('2024-01-10'),
          brand: { _id: testBrandId, name: 'Test Brand' },
          expiryDate: new Date('2024-02-10'),
          usedAt: new Date('2024-01-12')
        },
        {
          source: '滿額贈送',
          sourceModel: 'Order',
          sourceId: '507f1f77bcf86cd799439051',
          status: 'active',
          amount: 3,
          createdAt: new Date('2024-01-08'),
          brand: { _id: testBrandId, name: 'Test Brand' },
          expiryDate: new Date('2024-02-08'),
          usedAt: null
        }
      ];

      const mockTotalResult = [{ total: 15 }];

      mockPointInstance.aggregate
        .mockResolvedValueOnce(mockAggregateResult) // 第一次調用返回記錄
        .mockResolvedValueOnce(mockTotalResult);    // 第二次調用返回總數

      mockPointInstance.populate.mockResolvedValue(mockAggregateResult);

      // Act
      const result = await pointService.getUserPointHistory(testUserId, testBrandId, { page: 1, limit: 10 });

      // Assert
      expect(result.records).toEqual(mockAggregateResult);
      expect(result.pagination).toEqual({
        total: 15,
        totalPages: 2,
        currentPage: 1,
        limit: 10,
        hasNextPage: true,
        hasPrevPage: false
      });

      expect(mockPointInstance.aggregate).toHaveBeenCalledTimes(2);
      expect(mockPointInstance.populate).toHaveBeenCalledWith(mockAggregateResult, { path: 'brand', select: 'name' });
    });

    it('should handle query without brandId', async () => {
      // Arrange
      const mockAggregateResult = [];
      const mockTotalResult = [{ total: 0 }];

      mockPointInstance.aggregate
        .mockResolvedValueOnce(mockAggregateResult)
        .mockResolvedValueOnce(mockTotalResult);

      mockPointInstance.populate.mockResolvedValue(mockAggregateResult);

      // Act
      const result = await pointService.getUserPointHistory(testUserId, null, { page: 1, limit: 5 });

      // Assert
      expect(result.records).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(false);

      // 檢查聚合查詢的參數不包含品牌篩選
      const aggregateCall = mockPointInstance.aggregate.mock.calls[0][0];
      const matchStage = aggregateCall.find(stage => stage.$match);
      expect(matchStage.$match).not.toHaveProperty('brand');
    });

    it('should handle empty total result', async () => {
      // Arrange
      const mockAggregateResult = [];
      const mockTotalResult = []; // 空結果

      mockPointInstance.aggregate
        .mockResolvedValueOnce(mockAggregateResult)
        .mockResolvedValueOnce(mockTotalResult);

      mockPointInstance.populate.mockResolvedValue(mockAggregateResult);

      // Act
      const result = await pointService.getUserPointHistory(testUserId, testBrandId);

      // Assert
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should use default pagination parameters', async () => {
      // Arrange
      const mockAggregateResult = [];
      const mockTotalResult = [{ total: 0 }];

      mockPointInstance.aggregate
        .mockResolvedValueOnce(mockAggregateResult)
        .mockResolvedValueOnce(mockTotalResult);

      mockPointInstance.populate.mockResolvedValue(mockAggregateResult);

      // Act
      const result = await pointService.getUserPointHistory(testUserId, testBrandId);

      // Assert
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.limit).toBe(10);

      // 檢查 aggregate 被調用了兩次（一次查詢記錄，一次查詢總數）
      expect(mockPointInstance.aggregate).toHaveBeenCalledTimes(2);
      
      // 檢查第一次調用包含分頁參數
      const firstAggregateCall = mockPointInstance.aggregate.mock.calls[0][0];
      const skipStage = firstAggregateCall.find(stage => stage.$skip !== undefined);
      const limitStage = firstAggregateCall.find(stage => stage.$limit !== undefined);
      
      expect(skipStage).toBeDefined();
      expect(limitStage).toBeDefined();
      expect(skipStage.$skip).toBe(0); // (1-1) * 10 = 0
      expect(limitStage.$limit).toBe(10);
    });
  });
});