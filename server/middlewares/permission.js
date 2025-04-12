import Store from '../models/Store/Store.js';

/**
 * 權限檢查中介軟體
 * 檢查管理員是否具有特定權限
 * @param {Array|String} requiredPermissions - 所需的權限
 * @param {Boolean} requireAllPermissions - 是否需要具備所有權限 (預設: false，只需擁有其中一個)
 */
/**
 * 角色檢查中介軟體
 * 限制只有特定角色的管理員才能訪問
 * @param {Array|String} allowedRoles - 允許的角色
 */
export const roleMiddleware = (allowedRoles) => async (req, res, next) => {
  try {
    // 確認使用者已通過驗證（由 authMiddleware 處理）
    if (!req.adminId || !req.adminRole) {
      return res.status(401).json({
        success: false,
        message: '請先登入'
      });
    }

    // 規範化允許的角色為陣列
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // 檢查是否有所需角色
    if (!roles.includes(req.adminRole)) {
      return res.status(403).json({
        success: false,
        message: '沒有執行此操作的權限'
      });
    }

    // 繼續執行下一步
    return next();
  } catch (error) {
    console.error('Role check error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

/**
 * 權限檢查中介軟體
 * 檢查管理員是否具有特定權限
 * @param {Array|String} requiredPermissions - 所需的權限
 * @param {Boolean} requireAllPermissions - 是否需要具備所有權限 (預設: false，只需擁有其中一個)
 */
export const permissionMiddleware = (requiredPermissions, requireAllPermissions = false) => async (req, res, next) => {
  try {
    // 確認使用者已通過驗證（由 authMiddleware 處理）
    if (!req.adminId || !req.adminRole) {
      return res.status(401).json({
        success: false,
        message: '請先登入'
      });
    }

    // 規範化所需權限為陣列
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    // 檢查店鋪參數
    const storeId = req.params.storeId || req.body.storeId;

    // 如果是 boss 角色，直接通過權限檢查
    if (req.adminRole === 'boss') {
      return next();
    }

    // 如果是 brand_admin 角色，檢查其管理的店鋪
    if (req.adminRole === 'brand_admin') {
      // 如果沒有特定店鋪參數，只要是 brand_admin 就允許操作
      if (!storeId) {
        return next();
      }

      // 檢查指定的店鋪是否屬於此 brand_admin 管理範圍
      const storeExists = req.adminManage.some(item => item.store.toString() === storeId);
      if (!storeExists) {
        return res.status(403).json({
          success: false,
          message: '沒有操作此店鋪的權限'
        });
      }

      return next();
    }

    // 如果是 store_admin 角色，需要檢查特定權限
    if (req.adminRole === 'store_admin') {
      // 沒有店鋪參數時不允許操作
      if (!storeId) {
        return res.status(403).json({
          success: false,
          message: '缺少店鋪參數'
        });
      }

      // 找到指定店鋪的管理設定
      const storeManage = req.adminManage.find(item => item.store.toString() === storeId);

      if (!storeManage) {
        return res.status(403).json({
          success: false,
          message: '沒有操作此店鋪的權限'
        });
      }

      // 檢查是否擁有所需權限
      let hasPermission = false;

      if (requireAllPermissions) {
        // 需要具備所有指定的權限
        hasPermission = permissions.every(permission =>
          storeManage.permission.includes(permission)
        );
      } else {
        // 只需具備其中一個權限
        hasPermission = permissions.some(permission =>
          storeManage.permission.includes(permission)
        );
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '沒有執行此操作的權限'
        });
      }

      return next();
    }

    // 未知角色
    return res.status(403).json({
      success: false,
      message: '未知的管理員角色'
    });

  } catch (error) {
    console.error('Permission check error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
