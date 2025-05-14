/**
 * 授權 middleware
 * 處理角色、品牌、店鋪和權限的授權檢查
 */

import Store from '../../models/Store/Store.js';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../../config/permissions.js';

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

    // Boss 可以存取所有品牌
    if (req.auth.role === 'boss') {
      req.brandId = brandId;
      return next();
    }

    // 其他角色只能存取自己的品牌
    if (!req.auth.brand || req.auth.brand.toString() !== brandId) {
      return res.status(403).json({
        success: false,
        message: '無權存取此品牌'
      });
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

    // Boss 可以存取所有店鋪
    if (req.auth.role === 'boss') {
      req.storeId = storeId;
      return next();
    }

    // 檢查店鋪是否存在且屬於管理員的品牌
    const store = await Store.findById(storeId).select('brand');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: '店鋪不存在'
      });
    }

    if (store.brand.toString() !== req.auth.brand?.toString()) {
      return res.status(403).json({
        success: false,
        message: '此店鋪不屬於您的品牌'
      });
    }

    // Brand Admin 可以存取品牌下所有店鋪
    if (req.auth.role === 'brand_admin') {
      req.storeId = storeId;
      return next();
    }

    // Store Admin 只能存取被指派的店鋪
    const hasStoreAccess = req.auth.manage?.some(
      manage => manage.store.toString() === storeId
    );

    if (!hasStoreAccess) {
      return res.status(403).json({
        success: false,
        message: '無權存取此店鋪'
      });
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
  // Boss 和 Brand Admin 擁有所有權限
  if (['boss', 'brand_admin'].includes(req.auth.role)) {
    return next();
  }

  // Store Admin 需要檢查特定權限
  if (req.auth.role === 'store_admin') {
    const storeId = req.storeId || req.params.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: '缺少店鋪參數'
      });
    }

    // 找到該店鋪的管理設定
    const storeManage = req.auth.manage?.find(
      manage => manage.store.toString() === storeId
    );

    if (!storeManage) {
      return res.status(403).json({
        success: false,
        message: '沒有此店鋪的管理權限'
      });
    }

    // 檢查是否擁有所需權限（只需要擁有其中一個）
    const hasPermission = permissions.some(
      permission => storeManage.permission.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '權限不足'
      });
    }
  }

  next();
};
