import * as pointService from '../../services/promotion/index.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取用戶點數餘額
export const getUserPoints = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { brandId } = req.params;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  // 獲取點數
  const pointsList = await pointService.point.getUserPoints(userId, brandId);
  const balance = await pointService.point.getUserPointsBalance(userId, brandId);

  res.json({
    success: true,
    points: pointsList,
    balance: balance
  });
});

// 獲取用戶點數歷史
export const getUserPointHistory = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { brandId } = req.params;

  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10
  };

  // 獲取點數歷史
  const result = await pointService.point.getUserPointHistory(userId, brandId, options);

  res.json({
    success: true,
    records: result.records,
    pagination: result.pagination
  });
});

// 給用戶添加點數 (管理員操作)
export const addPointsToUser = asyncHandler(async (req, res) => {
  const { userId, brandId, amount, source, validityDays } = req.body;
  const adminId = req.adminId;

  if (!userId || !brandId || !amount || !source) {
    return res.status(400).json({
      success: false,
      message: '用戶ID、品牌ID、點數數量和來源為必填欄位'
    });
  }

  // 來源資訊
  const sourceInfo = {
    model: 'Admin',
    id: adminId
  };

  // 添加點數
  const pointInstance = await pointService.point.addPointsToUser(
    userId,
    brandId,
    amount,
    source,
    sourceInfo,
    validityDays || 365
  );

  res.json({
    success: true,
    message: '點數添加成功',
    pointInstance
  });
});

// 標記過期點數 (系統操作，通常由排程任務調用)
export const markExpiredPoints = asyncHandler(async (req, res) => {
  // 通常這個操作需要超級管理員權限
  // 此處省略權限檢查

  const count = await pointService.point.markExpiredPoints();

  res.json({
    success: true,
    message: `已標記 ${count} 個過期點數`,
    expiredCount: count
  });
});
