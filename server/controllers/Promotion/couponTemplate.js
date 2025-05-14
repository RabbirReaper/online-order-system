import * as couponService from '../../services/promotion/index.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取所有優惠券模板
export const getAllCouponTemplates = asyncHandler(async (req, res) => {
  const brandId = req.brandId || req.params.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const templates = await couponService.coupon.getAllCouponTemplates(brandId);

  res.json({
    success: true,
    templates
  });
});

// 獲取單個優惠券模板
export const getCouponTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.brandId || req.params.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const template = await couponService.coupon.getCouponTemplateById(id, brandId);

  res.json({
    success: true,
    template
  });
});

// 創建優惠券模板
export const createCouponTemplate = asyncHandler(async (req, res) => {
  const brandId = req.brandId || req.params.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const templateData = req.body;
  templateData.brand = brandId;

  const newTemplate = await couponService.coupon.createCouponTemplate(templateData);

  res.status(201).json({
    success: true,
    message: '優惠券模板創建成功',
    template: newTemplate
  });
});

// 更新優惠券模板
export const updateCouponTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.brandId || req.params.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  const updateData = req.body;

  const updatedTemplate = await couponService.coupon.updateCouponTemplate(id, updateData, brandId);

  res.json({
    success: true,
    message: '優惠券模板更新成功',
    template: updatedTemplate
  });
});

// 刪除優惠券模板
export const deleteCouponTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brandId = req.brandId || req.params.brandId;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: '品牌ID為必須參數'
    });
  }

  await couponService.coupon.deleteCouponTemplate(id, brandId);

  res.json({
    success: true,
    message: '優惠券模板刪除成功'
  });
});
