/**
 * 促銷服務入口文件
 * 匯總並導出所有促銷相關服務
 */

// 導入各促銷相關服務
import * as couponService from './couponService.js';
import * as pointService from './pointService.js';

// 導出所有促銷服務
export const coupon = couponService;
export const point = pointService;

// 簡單導出，方便直接調用
export const {
  getAvailableCouponTemplates,
  redeemCoupon,
  applyCouponToOrder,
  validateCoupon
} = couponService;

export const {
  getUserPoints,
  getUserPointsBalance,
  addPointsToUser,
  usePoints,
  refundPointsForOrder,
  markExpiredPoints
} = pointService;
