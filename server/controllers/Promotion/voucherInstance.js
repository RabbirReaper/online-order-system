import * as voucherService from '../../services/promotion/index.js';
import { asyncHandler } from '../../middlewares/error.js';

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
