import * as voucherService from '../../services/promotion/index.js'
import { asyncHandler } from '../../middlewares/error.js'

// =============================================================================
// 管理員功能
// =============================================================================

/**
 * 獲取指定用戶的兌換券實例（管理員功能）
 */
export const getUserVoucherInstancesAdmin = asyncHandler(async (req, res) => {
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

  const result = await voucherService.voucher.getUserVouchersAdmin(userId, brandId, options)

  res.json({
    success: true,
    ...result,
  })
})

// =============================================================================
// 用戶功能
// =============================================================================

/**
 * 獲取用戶兌換券
 */
export const getUserVouchers = asyncHandler(async (req, res) => {
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

  const vouchers = await voucherService.voucher.getUserVouchers(userId, options)

  res.json({
    success: true,
    vouchers,
  })
})

/**
 * 使用兌換券
 */
export const useVoucher = asyncHandler(async (req, res) => {
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

  const { voucherId, orderId } = req.body

  if (!voucherId) {
    return res.status(400).json({
      success: false,
      message: '兌換券ID為必填欄位',
    })
  }

  const result = await voucherService.voucher.useVoucher(voucherId, userId, orderId)

  res.json({
    success: true,
    message: result.message,
    voucher: result.voucher,
  })
})

/**
 * 驗證兌換券（檢查是否可用）
 */
export const validateVoucher = asyncHandler(async (req, res) => {
  const brandId = req.params.brandId
  const { voucherId } = req.params
  const userId = req.auth?.userId || req.userId

  if (!brandId || !voucherId) {
    return res.status(400).json({
      success: false,
      message: 'brandId 和 voucherId 為必須參數',
    })
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '需要用戶認證',
    })
  }

  try {
    // 獲取用戶的兌換券列表，找到指定的兌換券
    const vouchers = await voucherService.voucher.getUserVouchers(userId, {
      includeUsed: true,
      includeExpired: true,
    })

    const voucher = vouchers.find((v) => v._id.toString() === voucherId)

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: '兌換券不存在或無權使用',
        isValid: false,
      })
    }

    if (voucher.isUsed) {
      return res.json({
        success: false,
        message: '兌換券已使用',
        isValid: false,
        voucher,
      })
    }

    if (voucher.expiryDate < new Date()) {
      return res.json({
        success: false,
        message: '兌換券已過期',
        isValid: false,
        voucher,
      })
    }

    // 兌換券有效
    res.json({
      success: true,
      message: '兌換券有效',
      isValid: true,
      voucher,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '驗證兌換券時發生錯誤',
      isValid: false,
    })
  }
})
