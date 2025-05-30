/**
 * 授權 middleware
 * 處理角色、品牌、店鋪和權限的授權檢查
 */

import Store from '../../models/Store/Store.js';
import { PERMISSIONS, ROLE_PERMISSIONS, ROLE_LEVELS, ROLE_SCOPES } from '../../config/permissions.js';

/**
 * 角色檢查 middleware
 * @param {...String} allowedRoles - 允許的角色列表
 */
export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.auth || req.auth.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理員權限'
    });
  }

  if (!allowedRoles.includes(req.auth.role)) {
    return res.status(403).json({
      success: false,
      message: '角色權限不足'
    });
  }

  next();
};

/**
 * 系統級權限檢查
 */
export const requireSystemLevel = (req, res, next) => {
  if (!req.auth || req.auth.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理員權限'
    });
  }

  const systemRoles = ['primary_system_admin', 'system_admin'];
  if (!systemRoles.includes(req.auth.role)) {
    return res.status(403).json({
      success: false,
      message: '需要系統級權限'
    });
  }

  next();
};

/**
 * 品牌存取檢查 middleware
 */
export const requireBrandAccess = async (req, res, next) => {
  try {
    // 從 URL 參數或 body 獲取 brandId
    const brandId = req.params.brandId || req.body.brandId;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        message: '缺少品牌參數'
      });
    }

    const userScope = ROLE_SCOPES[req.auth.role];

    // 系統級管理員可以存取所有品牌
    if (userScope === 'system') {
      req.brandId = brandId;
      return next();
    }

    // 品牌級管理員只能存取自己的品牌
    if (userScope === 'brand') {
      if (!req.auth.brand || req.auth.brand.toString() !== brandId) {
        return res.status(403).json({
          success: false,
          message: '無權存取此品牌'
        });
      }
    }

    // 店鋪級管理員需要檢查品牌是否匹配
    if (userScope === 'store') {
      if (!req.auth.brand || req.auth.brand.toString() !== brandId) {
        return res.status(403).json({
          success: false,
          message: '無權存取此品牌'
        });
      }
    }

    req.brandId = brandId;
    next();
  } catch (error) {
    console.error('Brand access check error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

/**
 * 店鋪存取檢查 middleware
 */
export const requireStoreAccess = async (req, res, next) => {
  try {
    // 從 URL 參數或 body 獲取 storeId
    const storeId = req.params.storeId || req.body.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: '缺少店鋪參數'
      });
    }

    const userScope = ROLE_SCOPES[req.auth.role];

    // 系統級管理員可以存取所有店鋪
    if (userScope === 'system') {
      req.storeId = storeId;
      return next();
    }

    // 檢查店鋪是否存在
    const store = await Store.findById(storeId).select('brand');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: '店鋪不存在'
      });
    }

    // 品牌級管理員可以存取品牌下所有店鋪
    if (userScope === 'brand') {
      if (store.brand.toString() !== req.auth.brand?.toString()) {
        return res.status(403).json({
          success: false,
          message: '此店鋪不屬於您的品牌'
        });
      }
      req.storeId = storeId;
      return next();
    }

    // 店鋪級管理員只能存取自己的店鋪
    if (userScope === 'store') {
      if (req.auth.store?.toString() !== storeId) {
        return res.status(403).json({
          success: false,
          message: '無權存取此店鋪'
        });
      }
    }

    req.storeId = storeId;
    next();
  } catch (error) {
    console.error('Store access check error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

/**
 * 權限檢查 middleware
 * @param {...String} permissions - 需要的權限列表
 */
export const requirePermission = (...permissions) => (req, res, next) => {
  if (!req.auth || req.auth.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理員權限'
    });
  }

  const userPermissions = ROLE_PERMISSIONS[req.auth.role] || [];

  // 檢查是否擁有所需權限（只需要擁有其中一個）
  const hasPermission = permissions.some(permission =>
    userPermissions.includes(permission)
  );

  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: '權限不足'
    });
  }

  next();
};

/**
 * 成員管理權限檢查
 */
export const requireMemberManagement = (req, res, next) => {
  if (!req.auth || req.auth.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理員權限'
    });
  }

  // 只有 primary 角色才能管理成員
  const isPrimary = req.auth.role.startsWith('primary_');

  if (!isPrimary) {
    return res.status(403).json({
      success: false,
      message: '只有主管理員才能管理成員'
    });
  }

  next();
};

/**
 * 檢查是否可以操作目標管理員
 */
export const requireHigherRole = (targetRole) => (req, res, next) => {
  if (!req.auth || req.auth.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理員權限'
    });
  }

  const currentLevel = ROLE_LEVELS[req.auth.role] || 0;
  const targetLevel = ROLE_LEVELS[targetRole] || 0;

  if (currentLevel <= targetLevel) {
    return res.status(403).json({
      success: false,
      message: '無法操作同級或更高級別的管理員'
    });
  }

  next();
};

/**
 * 角色範圍檢查 - 確保操作在權限範圍內
 */
export const requireScopeMatch = (req, res, next) => {
  if (!req.auth || req.auth.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理員權限'
    });
  }

  const userScope = ROLE_SCOPES[req.auth.role];

  // 系統級可以操作所有
  if (userScope === 'system') {
    return next();
  }

  // 品牌級需要檢查品牌匹配
  if (userScope === 'brand') {
    const brandId = req.params.brandId || req.body.brandId;
    if (brandId && req.auth.brand?.toString() !== brandId) {
      return res.status(403).json({
        success: false,
        message: '超出品牌管轄範圍'
      });
    }
  }

  // 店鋪級需要檢查店鋪匹配
  if (userScope === 'store') {
    const storeId = req.params.storeId || req.body.storeId;
    if (storeId && req.auth.store?.toString() !== storeId) {
      return res.status(403).json({
        success: false,
        message: '超出店鋪管轄範圍'
      });
    }
  }

  next();
};
