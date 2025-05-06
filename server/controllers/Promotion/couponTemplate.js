import * as couponService from '../../services/promotion/index.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取所有優惠券模板
export const getAllCouponTemplates = asyncHandler(async (req, res) => {
  const brandId = req.adminRole === 'boss' ? req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  // 假設在服務層中有一個獲取所有優惠券模板的方法
  const templates = await couponService.getAllCouponTemplates(brandId);

  res.json({
    success: true,
    templates
  });
});

// 獲取單個優惠券模板
export const getCouponTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.adminRole === 'boss' ? req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  // 假設在服務層中有一個獲取單個優惠券模板的方法
  const template = await couponService.getCouponTemplateById(id, brandId);

  res.json({
    success: true,
    template
  });
});

// 創建優惠券模板
export const createCouponTemplate = asyncHandler(async (req, res) => {
  const brandId = req.adminRole === 'boss' ? req.body.brand : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const templateData = req.body;
  templateData.brand = brandId;

  // 假設在服務層中有一個創建優惠券模板的方法
  const newTemplate = await couponService.createCouponTemplate(templateData);

  res.status(201).json({
    success: true,
    message: '優惠券模板創建成功',
    template: newTemplate
  });
});

// 更新優惠券模板
export const updateCouponTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.adminRole === 'boss' ? req.body.brand || req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const updateData = req.body;

  // 假設在服務層中有一個更新優惠券模板的方法
  const updatedTemplate = await couponService.updateCouponTemplate(id, updateData, brandId);

  res.json({
    success: true,
    message: '優惠券模板更新成功',
    template: updatedTemplate
  });
});

// 刪除優惠券模板
export const deleteCouponTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.adminRole === 'boss' ? req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  // 假設在服務層中有一個刪除優惠券模板的方法
  await couponService.deleteCouponTemplate(id, brandId);

  res.json({
    success: true,
    message: '優惠券模板刪除成功'
  });
});

// 獲取可用的優惠券模板（前台使用）
export const getAvailableCouponTemplates = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { brandId, storeId } = req.query;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const templates = await couponService.coupon.getAvailableCouponTemplates(brandId, storeId);

  res.json({
    success: true,
    templates
  });
});
