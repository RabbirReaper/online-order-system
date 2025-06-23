import * as bundleInstanceService from '../../services/bundle/bundleInstance.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取所有 Bundle 實例
export const getAllBundleInstances = asyncHandler(async (req, res) => {
  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20
  };

  const result = await bundleInstanceService.getAllInstances(options);

  res.json({
    success: true,
    instances: result.instances,
    pagination: result.pagination
  });
});

// 獲取單個 Bundle 實例
export const getBundleInstanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const instance = await bundleInstanceService.getInstanceById(id);

  res.json({
    success: true,
    instance
  });
});

// 創建 Bundle 實例
export const createBundleInstance = asyncHandler(async (req, res) => {
  const instanceData = req.body;

  // 檢查必要欄位
  if (!instanceData.templateId || !instanceData.brand) {
    return res.status(400).json({
      success: false,
      message: 'Bundle 模板ID和品牌ID為必填欄位'
    });
  }

  const newInstance = await bundleInstanceService.createInstance(instanceData);

  res.status(201).json({
    success: true,
    message: 'Bundle 實例創建成功',
    instance: newInstance
  });
});

// 更新 Bundle 實例
export const updateBundleInstance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedInstance = await bundleInstanceService.updateInstance(id, updateData);

  res.json({
    success: true,
    message: 'Bundle 實例更新成功',
    instance: updatedInstance
  });
});

// 刪除 Bundle 實例
export const deleteBundleInstance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await bundleInstanceService.deleteInstance(id);

  res.json({
    success: true,
    message: 'Bundle 實例刪除成功'
  });
});

// 計算 Bundle 最終價格
export const calculateFinalPrice = asyncHandler(async (req, res) => {
  const instanceData = req.body;

  // 檢查必要欄位
  if (!instanceData.sellingPrice && !instanceData.originalPrice) {
    return res.status(400).json({
      success: false,
      message: '銷售價格或原價為必填欄位'
    });
  }

  const finalPrice = bundleInstanceService.calculateFinalPrice(instanceData);

  res.json({
    success: true,
    finalPrice
  });
});
