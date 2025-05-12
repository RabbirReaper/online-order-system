/**
 * 促銷服務入口文件
 * 匯總並導出所有促銷相關服務
 */

// 導入各促銷相關服務
import * as couponService from './couponService.js';
import * as pointService from './pointService.js';
import * as pointRuleService from './pointRuleService.js';

// 導出所有促銷服務
export const coupon = couponService;
export const point = pointService;
export const pointRule = pointRuleService;

// 簡單導出，方便直接調用
export const {
  getAllCouponTemplates,
  getCouponTemplateById,
  createCouponTemplate,
  updateCouponTemplate,
  deleteCouponTemplate,
  getAvailableCouponTemplates
} = couponService;

export const {
  getUserPoints,
  getUserPointsBalance,
  addPointsToUser,
  usePoints,
  refundPointsForOrder,
  markExpiredPoints,
  getUserPointHistory
} = pointService;

export const {
  getAllPointRules,
  getPointRuleById,
  createPointRule,
  updatePointRule,
  deletePointRule,
  getActivePointRules,
  calculateOrderPoints
} = pointRuleService;
