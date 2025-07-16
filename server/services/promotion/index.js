/**
 * 促銷服務入口文件
 * 匯總並導出所有促銷相關服務
 * 完全分離 Coupon 和 Voucher 系統
 */

// 導入各促銷相關服務
import * as couponService from './couponService.js'
import * as voucherService from './voucherService.js'
import * as pointService from './pointService.js'
import * as pointRuleService from './pointRuleService.js'

// 導出所有促銷服務
export const coupon = couponService
export const voucher = voucherService
export const point = pointService
export const pointRule = pointRuleService

// Coupon 服務導出（折價券 - 只送不賣，活動獎勵用）
export const {
  getAllCouponTemplates,
  getCouponTemplateById,
  createCouponTemplate,
  updateCouponTemplate,
  deleteCouponTemplate,
  getUserCoupons,
  issueCouponToUser,
  useCoupon,
} = couponService

// Voucher 服務導出（兌換券 - 透過 Bundle 販賣）
export const {
  getAllVoucherTemplates,
  getVoucherTemplateById,
  createVoucherTemplate,
  updateVoucherTemplate,
  deleteVoucherTemplate,
  getAvailableVoucherTemplates, // 用於 Bundle 創建時選擇
  getUserVouchers,
  useVoucher,
  autoCreateVoucherTemplatesForDishes,
  getVoucherInstanceStatsByTemplate,
} = voucherService

// Point 服務導出
export const {
  getUserPoints,
  getUserPointsBalance,
  addPointsToUser,
  usePoints,
  refundPointsForOrder,
  markExpiredPoints,
  getUserPointHistory,
} = pointService

// Point Rule 服務導出
export const {
  getAllPointRules,
  getPointRuleById,
  createPointRule,
  updatePointRule,
  deletePointRule,
  getActivePointRules,
  calculateOrderPoints,
} = pointRuleService
