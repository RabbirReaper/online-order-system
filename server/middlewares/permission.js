import Store from '../models/Store/Store.js';
import Admin from '../models/User/Admin.js';

/**
 * 角色檢查中間軟體
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

// 品牌驗證中間件
export const brandMiddleware = async (req, res, next) => {
  try {
    // 確認使用者已通過驗證
    if (!req.adminId || !req.adminRole) {
      return res.status(401).json({
        success: false,
        message: '請先登入'
      });
    }

    // 從 URL 參數中獲取 brandId
    const brandId = req.params.brandId;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        message: '缺少品牌ID參數'
      });
    }

    // 如果是 boss 角色，允許訪問所有品牌
    if (req.adminRole === 'boss') {
      req.brandId = brandId;
      return next();
    }

    // 其他角色需要檢查是否有該品牌的權限
    const admin = await Admin.findById(req.adminId).select('brand');

    if (!admin || !admin.brand) {
      return res.status(403).json({
        success: false,
        message: '管理員帳號未設置品牌資訊'
      });
    }

    // 檢查管理員的品牌是否與請求的品牌匹配
    if (admin.brand.toString() !== brandId) {
      return res.status(403).json({
        success: false,
        message: '無權訪問此品牌的資源'
      });
    }

    // 設置品牌ID到請求對象
    req.brandId = brandId;
    return next();
  } catch (error) {
    console.error('Brand validation error:', error);
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

    // 獲取店鋪參數（可能來自 URL 參數或請求體）
    const storeId = req.params.storeId || req.body.storeId;

    // 如果是 boss 角色，直接通過權限檢查
    if (req.adminRole === 'boss') {
      return next();
    }

    // 如果是 brand_admin 角色
    if (req.adminRole === 'brand_admin') {
      // 如果沒有特定店鋪參數，允許品牌管理員操作其品牌下的所有資源
      if (!storeId) {
        return next();
      }

      // 如果有店鋪參數，檢查店鋪是否屬於該品牌
      const store = await Store.findById(storeId).select('brand');
      if (!store) {
        return res.status(404).json({
          success: false,
          message: '店鋪不存在'
        });
      }

      // 從 URL 中獲取的 brandId（由 brandMiddleware 設置）
      const brandId = req.brandId || req.params.brandId;

      if (store.brand.toString() !== brandId) {
        return res.status(403).json({
          success: false,
          message: '無權操作此店鋪'
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

/**
 * 店鋪驗證中間件
 * 驗證店鋪是否屬於指定品牌
 */
export const storeMiddleware = async (req, res, next) => {
  try {
    const storeId = req.params.storeId;
    const brandId = req.params.brandId || req.brandId;

    if (!storeId || !brandId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數'
      });
    }

    // 檢查店鋪是否存在且屬於指定品牌
    const store = await Store.findById(storeId).select('brand');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: '店鋪不存在'
      });
    }

    if (store.brand.toString() !== brandId) {
      return res.status(403).json({
        success: false,
        message: '店鋪不屬於指定品牌'
      });
    }

    req.store = store;
    return next();
  } catch (error) {
    console.error('Store validation error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
