import * as pointService from '../../services/promotion/index.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取所有點數規則
export const getAllPointRules = asyncHandler(async (req, res) => {
  const brandId = req.adminRole === 'boss' ? req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const rules = await pointService.pointRule.getAllPointRules(brandId);

  res.json({
    success: true,
    rules
  });
});

// 獲取單個點數規則
export const getPointRuleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.adminRole === 'boss' ? req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const rule = await pointService.pointRule.getPointRuleById(id, brandId);

  res.json({
    success: true,
    rule
  });
});

// 創建點數規則
export const createPointRule = asyncHandler(async (req, res) => {
  const brandId = req.adminRole === 'boss' ? req.body.brand : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const ruleData = req.body;
  ruleData.brand = brandId;

  const newRule = await pointService.pointRule.createPointRule(ruleData);

  res.status(201).json({
    success: true,
    message: '點數規則創建成功',
    rule: newRule
  });
});

// 更新點數規則
export const updatePointRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.adminRole === 'boss' ? req.body.brand || req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const updateData = req.body;

  const updatedRule = await pointService.pointRule.updatePointRule(id, updateData, brandId);

  res.json({
    success: true,
    message: '點數規則更新成功',
    rule: updatedRule
  });
});

// 刪除點數規則
export const deletePointRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.adminRole === 'boss' ? req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  await pointService.pointRule.deletePointRule(id, brandId);

  res.json({
    success: true,
    message: '點數規則刪除成功'
  });
});
