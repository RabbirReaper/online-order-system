import * as bundleService from '../../services/bundle/bundleService.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取所有 Bundle（管理員）
export const getAllBundles = asyncHandler(async (req, res) => {
  const brandId = req.brandId || req.params.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const options = {
    includeInactive: req.query.includeInactive === 'true',
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20
  };

  const result = await bundleService.getAllBundles(brandId, options);

  res.json({
    success: true,
    bundles: result.bundles,
    pagination: result.pagination
  });
});

// 獲取單個 Bundle
export const getBundleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.brandId || req.params.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const bundle = await bundleService.getBundleById(id, brandId);

  res.json({
    success: true,
    bundle
  });
});

// 創建 Bundle（管理員）
export const createBundle = asyncHandler(async (req, res) => {
  const brandId = req.brandId || req.params.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const bundleData = req.body;
  bundleData.brand = brandId;

  const newBundle = await bundleService.createBundle(bundleData);

  res.status(201).json({
    success: true,
    message: 'Bundle 創建成功',
    bundle: newBundle
  });
});

// 更新 Bundle（管理員）
export const updateBundle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.brandId || req.params.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const updateData = req.body;

  const updatedBundle = await bundleService.updateBundle(id, updateData, brandId);

  res.json({
    success: true,
    message: 'Bundle 更新成功',
    bundle: updatedBundle
  });
});

// 刪除 Bundle（管理員）
export const deleteBundle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.brandId || req.params.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  await bundleService.deleteBundle(id, brandId);

  res.json({
    success: true,
    message: 'Bundle 刪除成功'
  });
});

// 獲取可購買的 Bundle（客戶端）
export const getAvailableBundles = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params;
  const { paymentType = 'all' } = req.query;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const bundles = await bundleService.getAvailableBundles(brandId, storeId, paymentType);

  res.json({
    success: true,
    bundles
  });
});

// 檢查用戶購買限制（客戶端）
export const checkPurchaseLimit = asyncHandler(async (req, res) => {
  const { bundleId } = req.params;
  const userId = req.auth?.userId; // 可能未登入
  const { quantity = 1 } = req.query;

  if (!userId) {
    return res.json({
      success: true,
      canPurchase: true,
      remainingLimit: null,
      message: '未登入用戶無購買限制'
    });
  }

  const result = await bundleService.checkPurchaseLimit(userId, bundleId, parseInt(quantity, 10));

  res.json({
    success: true,
    ...result
  });
});

// 驗證 Bundle 購買資格（客戶端）
export const validateBundlePurchase = asyncHandler(async (req, res) => {
  const { bundleId, storeId } = req.params;
  const userId = req.auth?.userId; // 可能未登入
  const { quantity = 1, paymentType = 'cash' } = req.query;

  const bundle = await bundleService.validateBundlePurchase(
    bundleId,
    userId,
    parseInt(quantity, 10),
    storeId,
    paymentType
  );

  res.json({
    success: true,
    bundle,
    message: 'Bundle 購買資格驗證通過'
  });
});

// 自動更新 Bundle 狀態（系統任務）
export const autoUpdateBundleStatus = asyncHandler(async (req, res) => {
  // 通常這個操作需要系統管理員權限
  const result = await bundleService.autoUpdateBundleStatus();

  res.json({
    success: true,
    message: 'Bundle 狀態自動更新完成',
    result
  });
});
