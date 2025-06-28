/**
 * Bundle 實例控制器
 * 處理 Bundle 實例相關的 HTTP 請求
 */

import * as bundleInstanceService from '../../services/bundle/bundleInstance.js';
import { asyncHandler } from '../../middlewares/error.js';

/**
 * 獲取所有 Bundle 實例（後台）
 * GET /brands/:brandId/bundles/instances
 */
export const getAllBundleInstances = asyncHandler(async (req, res) => {
  const { brandId } = req.params;

  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
    status: req.query.status,
    templateId: req.query.templateId,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate
  };

  const result = await bundleInstanceService.getAllInstances(brandId, options);

  res.json({
    success: true,
    instances: result.instances,
    pagination: result.pagination,
    totalStatistics: result.statistics
  });
});

/**
 * 獲取單個 Bundle 實例
 * GET /brands/:brandId/bundles/instances/:id
 */
export const getBundleInstanceById = asyncHandler(async (req, res) => {
  const { brandId, id } = req.params;

  const instance = await bundleInstanceService.getInstanceById(id, brandId);

  res.json({
    success: true,
    instance
  });
});

/**
 * 創建 Bundle 實例（通常由訂單系統調用）
 * POST /brands/:brandId/bundles/instances
 */
export const createBundleInstance = asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const instanceData = {
    ...req.body,
    brand: brandId
  };

  // 驗證請求數據
  if (!instanceData.templateId) {
    return res.status(400).json({
      success: false,
      message: 'Bundle 模板ID為必填欄位'
    });
  }

  const newInstance = await bundleInstanceService.createInstance(instanceData);

  res.status(201).json({
    success: true,
    message: 'Bundle 實例創建成功',
    instance: newInstance
  });
});

/**
 * 更新 Bundle 實例
 * PUT /brands/:brandId/bundles/instances/:id
 */
export const updateBundleInstance = asyncHandler(async (req, res) => {
  const { brandId, id } = req.params;
  const updateData = req.body;

  const updatedInstance = await bundleInstanceService.updateInstance(id, updateData, brandId);

  res.json({
    success: true,
    message: 'Bundle 實例更新成功',
    instance: updatedInstance
  });
});

/**
 * 刪除 Bundle 實例
 * DELETE /brands/:brandId/bundles/instances/:id
 */
export const deleteBundleInstance = asyncHandler(async (req, res) => {
  const { brandId, id } = req.params;

  await bundleInstanceService.deleteInstance(id, brandId);

  res.json({
    success: true,
    message: 'Bundle 實例刪除成功'
  });
});

/**
 * 根據模板ID獲取實例
 * GET /brands/:brandId/bundles/:templateId/instances
 */
export const getBundleInstancesByTemplate = asyncHandler(async (req, res) => {
  const { brandId, templateId } = req.params;

  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
    status: req.query.status,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate
  };

  const result = await bundleInstanceService.getInstancesByTemplate(templateId, brandId, options);

  res.json({
    success: true,
    instances: result.instances,
    pagination: result.pagination,
    template: result.template
  });
});

/**
 * 獲取 Bundle 實例統計資訊
 * GET /brands/:brandId/bundles/instances/statistics
 */
export const getBundleInstanceStatistics = asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const { templateId, fromDate, toDate } = req.query;

  const statistics = await bundleInstanceService.getInstanceStatistics(brandId, {
    templateId,
    fromDate,
    toDate
  });

  res.json({
    success: true,
    statistics
  });
});

/**
 * 批量更新 Bundle 實例狀態
 * POST /brands/:brandId/bundles/instances/batch-update
 */
export const batchUpdateBundleInstances = asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const { instanceIds, updateData } = req.body;

  if (!instanceIds || !Array.isArray(instanceIds) || instanceIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: '請提供有效的實例ID陣列'
    });
  }

  const result = await bundleInstanceService.batchUpdateInstances(instanceIds, updateData, brandId);

  res.json({
    success: true,
    message: `成功更新 ${result.modifiedCount} 個實例`,
    result
  });
});

/**
 * 獲取 Bundle 實例關聯的 Voucher
 * GET /brands/:brandId/bundles/instances/:id/vouchers
 */
export const getBundleInstanceVouchers = asyncHandler(async (req, res) => {
  const { brandId, id } = req.params;

  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
    status: req.query.status,
    voucherType: req.query.voucherType
  };

  const result = await bundleInstanceService.getInstanceVouchers(id, brandId, options);

  res.json({
    success: true,
    vouchers: result.vouchers,
    pagination: result.pagination,
    instance: result.instance
  });
});

/**
 * 檢查 Bundle 實例有效性
 * GET /brands/:brandId/bundles/instances/:id/validate
 */
export const validateBundleInstance = asyncHandler(async (req, res) => {
  const { brandId, id } = req.params;

  const validation = await bundleInstanceService.validateInstance(id, brandId);

  res.json({
    success: true,
    isValid: validation.isValid,
    validation
  });
});
