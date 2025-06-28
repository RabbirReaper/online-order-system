import * as voucherService from '../../services/promotion/index.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取所有兌換券實例（後台）
export const getAllVoucherInstances = asyncHandler(async (req, res) => {
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

  const result = await voucherService.voucher.getAllVoucherInstances(brandId, options);

  res.json({
    success: true,
    vouchers: result.vouchers,
    pagination: result.pagination
  });
});

// 獲取用戶兌換券
export const getUserVouchers = asyncHandler(async (req, res) => {
  const userId = req.auth.userId;

  const options = {
    includeUsed: req.query.includeUsed === 'true',
    includeExpired: req.query.includeExpired === 'true'
  };

  const vouchers = await voucherService.voucher.getUserVouchers(userId, options);

  res.json({
    success: true,
    vouchers
  });
});

// 使用兌換券
export const useVoucher = asyncHandler(async (req, res) => {
  const userId = req.auth.userId;
  const { voucherId, orderId } = req.body;

  if (!voucherId) {
    return res.status(400).json({
      success: false,
      message: '兌換券ID為必填欄位'
    });
  }

  const result = await voucherService.voucher.useVoucher(voucherId, userId, orderId);

  res.json({
    success: true,
    message: result.message,
    voucher: result.voucher
  });
});

// 驗證兌換券
export const validateVoucher = asyncHandler(async (req, res) => {
  const { voucherId } = req.params;
  const userId = req.auth.userId;

  const result = await voucherService.voucher.validateVoucher(voucherId, userId);

  res.json({
    success: true,
    isValid: result.isValid,
    message: result.message,
    voucher: result.voucher
  });
});
