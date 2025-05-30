/**
 * Auth middleware 匯出檔
 * 統一匯出所有認證與授權相關的 middleware
 */

import { authenticate } from './authentication.js';
import {
  requireRole,
  requireSystemLevel,
  requireBrandAccess,
  requireStoreAccess,
  requireMemberManagement,
  requireHigherRole,
  requireScopeMatch
} from './authorization.js';

// 統一匯出
export {
  authenticate,
  requireRole,
  requireSystemLevel,
  requireBrandAccess,
  requireStoreAccess,
  requireMemberManagement,
  requireHigherRole,
  requireScopeMatch
};

// 預設的管理員認證
export const adminAuth = authenticate('admin');

// 預設的用戶認證
export const userAuth = authenticate('user');
