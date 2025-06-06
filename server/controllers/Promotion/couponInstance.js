import * as couponService from '../../services/promotion/index.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取所有優惠券實例（後台）
export const getAllCouponInstances = asyncHandler(async (req, res) => {
  const brandId = req.adminRole === 'boss' ? req.query.brandId : req.adminBrand;

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數'
    });
  }

  const options = {
    userId: req.query.userId,
    templateId: req.query.templateId,
    isUsed: req.query.isUsed === 'true',
    includeExpired: req.query.includeExpired === 'true',
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20
  };

  // 假設在服務層中有一個獲取所有優惠券實例的方法
  const result = await couponService.getAllCouponInstances(brandId, options);

  res.json({
    success: true,
    coupons: result.coupons,
    pagination: result.pagination
  });
});

// 獲取用戶優惠券
export const getUserCoupons = asyncHandler(async (req, res) => {
  const userId = req.auth.userId;

  const options = {
    includeUsed: req.query.includeUsed === 'true',
    includeExpired: req.query.includeExpired === 'true'
  };

  const coupons = await couponService.coupon.getUserCoupons(userId, options);

  res.json({
    success: true,
    coupons
  });
});

// 兌換優惠券
export const redeemCoupon = asyncHandler(async (req, res) => {
  const userId = req.auth.userId;
  const { templateId } = req.body;

  if (!templateId) {
    return res.status(400).json({
      success: false,
      message: '優惠券模板ID為必填欄位'
    });
  }

  const result = await couponService.coupon.redeemCoupon(userId, templateId);

  res.json({
    success: true,
    message: result.message,
    coupon: result.coupon
  });
});

// 發放優惠券給用戶（後台）
export const issueCouponToUser = asyncHandler(async (req, res) => {
  const { userId, templateId } = req.body;
  const adminId = req.adminId;

  if (!userId || !templateId) {
    return res.status(400).json({
      success: false,
      message: '用戶ID和優惠券模板ID為必填欄位'
    });
  }

  const result = await couponService.coupon.issueCouponToUser(userId, templateId, adminId);

  res.json({
    success: true,
    message: result.message,
    coupon: result.coupon
  });
});
