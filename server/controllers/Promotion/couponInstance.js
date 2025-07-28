import * as couponService from '../../services/promotion/index.js'
import { asyncHandler } from '../../middlewares/error.js'

// =============================================================================
// 管理員功能
// =============================================================================

/**
 * 根據模板ID獲取優惠券統計（管理員功能）
 */
export const getCouponInstanceStatsByTemplate = asyncHandler(async (req, res) => {
  const { templateId } = req.params
  const brandId = req.brandId || req.params.brandId

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數',
    })
  }

  if (!templateId) {
    return res.status(400).json({
      success: false,
      message: 'templateId 為必須參數',
    })
  }

  const result = await couponService.coupon.getCouponInstanceStatsByTemplate(templateId, brandId)

  res.json({
    success: true,
    ...result,
  })
})

/**
 * 獲取指定用戶的優惠券實例（管理員功能）
 */
export const getUserCouponInstancesAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const brandId = req.brandId || req.params.brandId

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數',
    })
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'userId 為必須參數',
    })
  }

  const options = {
    includeUsed: req.query.includeUsed === 'true',
    includeExpired: req.query.includeExpired === 'true',
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
  }

  const result = await couponService.coupon.getUserCouponsAdmin(userId, brandId, options)

  res.json({
    success: true,
    ...result,
  })
})

/**
 * 發放優惠券給用戶（管理員功能）
 */
export const issueCouponToUser = asyncHandler(async (req, res) => {
  const brandId = req.brandId || req.params.brandId
  const adminId = req.auth.id // 從 auth middleware 獲取

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數',
    })
  }

  const { userId, templateId, reason = '活動獎勵' } = req.body

  if (!userId || !templateId) {
    return res.status(400).json({
      success: false,
      message: '用戶ID和優惠券模板ID為必填欄位',
    })
  }

  const result = await couponService.coupon.issueCouponToUser(userId, templateId, adminId, reason)

  res.status(201).json({
    success: true,
    message: result.message,
    coupon: result.coupon,
  })
})

// =============================================================================
// 用戶功能
// =============================================================================

/**
 * 獲取用戶優惠券
 */
export const getUserCoupons = asyncHandler(async (req, res) => {
  const brandId = req.params.brandId
  const userId = req.auth?.userId || req.userId // 從 auth middleware 獲取

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數',
    })
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '需要用戶認證',
    })
  }

  const options = {
    includeUsed: req.query.includeUsed === 'true',
    includeExpired: req.query.includeExpired === 'true',
  }

  const coupons = await couponService.coupon.getUserCoupons(userId, brandId, options)

  res.json({
    success: true,
    coupons,
  })
})

/**
 * 使用優惠券
 */
export const useCoupon = asyncHandler(async (req, res) => {
  const brandId = req.params.brandId
  const userId = req.auth?.userId || req.userId // 從 auth middleware 獲取

  if (!brandId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 為必須參數',
    })
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '需要用戶認證',
    })
  }

  const { couponId, orderId } = req.body

  if (!couponId) {
    return res.status(400).json({
      success: false,
      message: '優惠券ID為必填欄位',
    })
  }

  const result = await couponService.coupon.useCoupon(couponId, userId, brandId, orderId)

  res.json({
    success: true,
    message: result.message,
    coupon: result.coupon,
  })
})

/**
 * 驗證優惠券（檢查是否可用）
 */
export const validateCoupon = asyncHandler(async (req, res) => {
  const brandId = req.params.brandId
  const { couponId } = req.params
  const userId = req.auth?.userId || req.userId

  if (!brandId || !couponId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 和 couponId 為必須參數',
    })
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '需要用戶認證',
    })
  }

  try {
    // 獲取用戶的優惠券列表，找到指定的優惠券
    const coupons = await couponService.coupon.getUserCoupons(userId, brandId, {
      includeUsed: true,
      includeExpired: true,
    })

    const coupon = coupons.find((c) => c._id.toString() === couponId)

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: '優惠券不存在或無權使用',
        isValid: false,
      })
    }

    if (coupon.isUsed) {
      return res.json({
        success: false,
        message: '優惠券已使用',
        isValid: false,
        coupon,
      })
    }

    if (coupon.expiryDate < new Date()) {
      return res.json({
        success: false,
        message: '優惠券已過期',
        isValid: false,
        coupon,
      })
    }

    // 優惠券有效
    res.json({
      success: true,
      message: '優惠券有效',
      isValid: true,
      coupon,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '驗證優惠券時發生錯誤',
      isValid: false,
    })
  }
})
