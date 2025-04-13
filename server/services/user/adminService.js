/**
 * 管理員服務
 * 處理管理員相關業務邏輯
 */

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import Admin from '../../models/User/Admin.js';
import Brand from '../../models/Brand/Brand.js';
import Store from '../../models/Store/Store.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取所有管理員
 * @param {Object} options - 查詢選項
 * @param {String} options.role - 按角色篩選
 * @param {String} options.brandId - 按品牌篩選
 * @param {Number} options.page - 頁碼
 * @param {Number} options.limit - 每頁數量
 * @returns {Promise<Object>} 管理員列表與分頁資訊
 */
export const getAllAdmins = async (options = {}) => {
  const { role, brandId, page = 1, limit = 20 } = options;

  // 構建查詢條件
  const queryConditions = {};

  if (role) {
    queryConditions.role = role;
  }

  if (brandId) {
    queryConditions.brand = brandId;
  }

  // 計算分頁
  const skip = (page - 1) * limit;

  // 查詢總數
  const total = await Admin.countDocuments(queryConditions);

  // 查詢管理員
  const admins = await Admin.find(queryConditions)
    .select('-password')
    .populate('brand', 'name')
    .populate('manage.store', 'name')
    .sort({ role: 1, name: 1 })
    .skip(skip)
    .limit(limit);

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    admins,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage
    }
  };
};

/**
 * 根據ID獲取管理員
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 管理員
 */
export const getAdminById = async (adminId) => {
  const admin = await Admin.findById(adminId)
    .select('-password')
    .populate('brand', 'name')
    .populate('manage.store', 'name');

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  return admin;
};

/**
 * 創建管理員
 * @param {Object} adminData - 管理員數據
 * @returns {Promise<Object>} 創建的管理員
 */
export const createAdmin = async (adminData) => {
  // 基本驗證
  if (!adminData.name || !adminData.password || !adminData.role) {
    throw new AppError('用戶名、密碼和角色為必填欄位', 400);
  }

  // 檢查用戶名是否已存在
  const existingAdmin = await Admin.findOne({ name: adminData.name });
  if (existingAdmin) {
    throw new AppError('此用戶名已被使用', 400);
  }

  // 檢查角色是否有效
  const validRoles = ['boss', 'brand_admin', 'store_admin'];
  if (!validRoles.includes(adminData.role)) {
    throw new AppError('角色無效', 400);
  }

  // 密碼強度驗證
  if (adminData.password.length < 8) {
    throw new AppError('密碼長度至少需要8個字元', 400);
  }

  // 品牌關聯驗證
  if ((adminData.role === 'brand_admin' || adminData.role === 'store_admin') && !adminData.brand) {
    throw new AppError('品牌管理員和店鋪管理員必須關聯品牌', 400);
  }

  if (adminData.brand) {
    const brand = await Brand.findById(adminData.brand);
    if (!brand) {
      throw new AppError('品牌不存在', 404);
    }
  }

  // 管理權限驗證
  if (adminData.role !== 'boss' && (!adminData.manage || !Array.isArray(adminData.manage) || adminData.manage.length === 0)) {
    throw new AppError('非老闆角色必須指定管理的店鋪', 400);
  }

  if (Array.isArray(adminData.manage)) {
    // 驗證每個 manage 項目
    for (const item of adminData.manage) {
      // 檢查 store 是否為有效的 ObjectId
      if (!item.store || !mongoose.Types.ObjectId.isValid(item.store)) {
        throw new AppError('無效的店鋪 ID', 400);
      }

      // 檢查店鋪是否存在
      const store = await Store.findById(item.store);
      if (!store) {
        throw new AppError(`店鋪 ${item.store} 不存在`, 404);
      }

      // 檢查權限
      if (!item.permission || !Array.isArray(item.permission) || item.permission.length === 0) {
        throw new AppError('必須指定至少一個權限', 400);
      }

      // 檢查每個權限是否有效
      const validPermissions = ['order_system', 'view_reports', 'edit_backend', 'manage_staff'];
      for (const perm of item.permission) {
        if (!validPermissions.includes(perm)) {
          throw new AppError(`無效的權限: ${perm}`, 400);
        }
      }
    }
  }

  // 創建管理員
  const newAdmin = new Admin(adminData);
  await newAdmin.save();

  // 移除密碼後返回
  const adminResponse = newAdmin.toObject();
  delete adminResponse.password;

  return adminResponse;
};

/**
 * 更新管理員
 * @param {String} adminId - 管理員ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的管理員
 */
export const updateAdmin = async (adminId, updateData) => {
  // 檢查管理員是否存在
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  // 不允許更改用戶名
  delete updateData.name;

  // 不允許直接更改密碼（應該使用專門的更改密碼接口）
  delete updateData.password;

  // 檢查角色是否有效
  if (updateData.role) {
    const validRoles = ['boss', 'brand_admin', 'store_admin'];
    if (!validRoles.includes(updateData.role)) {
      throw new AppError('角色無效', 400);
    }
  }

  // 品牌關聯驗證
  if (updateData.brand) {
    const brand = await Brand.findById(updateData.brand);
    if (!brand) {
      throw new AppError('品牌不存在', 404);
    }

    // 檢查角色是否需要關聯品牌
    const newRole = updateData.role || admin.role;
    if (newRole === 'boss') {
      // 老闆不需要關聯品牌
      updateData.brand = undefined;
    }
  }

  // 更新管理員
  Object.keys(updateData).forEach(key => {
    if (key !== 'manage') { // 管理權限單獨處理
      admin[key] = updateData[key];
    }
  });

  await admin.save();

  // 移除密碼後返回
  const adminResponse = admin.toObject();
  delete adminResponse.password;

  return adminResponse;
};

/**
 * 刪除管理員
 * @param {String} adminId - 管理員ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteAdmin = async (adminId) => {
  // 檢查管理員是否存在
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  // 防止刪除最後一個老闆帳號
  if (admin.role === 'boss') {
    const bossCount = await Admin.countDocuments({ role: 'boss' });
    if (bossCount <= 1) {
      throw new AppError('無法刪除最後一個老闆帳號', 400);
    }
  }

  await admin.deleteOne();

  return { success: true, message: '管理員已刪除' };
};

/**
 * 切換管理員啟用狀態
 * @param {String} adminId - 管理員ID
 * @param {Boolean} isActive - 啟用狀態
 * @returns {Promise<Object>} 更新後的管理員
 */
export const toggleAdminStatus = async (adminId, isActive) => {
  // 檢查管理員是否存在
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  // 防止停用最後一個老闆帳號
  if (admin.role === 'boss' && !isActive) {
    const activeBossCount = await Admin.countDocuments({ role: 'boss', isActive: true });
    if (activeBossCount <= 1) {
      throw new AppError('無法停用最後一個老闆帳號', 400);
    }
  }

  admin.isActive = isActive;
  await admin.save();

  // 移除密碼後返回
  const adminResponse = admin.toObject();
  delete adminResponse.password;

  return adminResponse;
};

/**
 * 更新管理員權限
 * @param {String} adminId - 管理員ID
 * @param {Array} manageData - 管理權限數據
 * @returns {Promise<Object>} 更新後的管理員
 */
export const updateAdminPermissions = async (adminId, manageData) => {
  // 檢查管理員是否存在
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  // 老闆角色不需要管理權限
  if (admin.role === 'boss') {
    throw new AppError('老闆角色不需要設置管理權限', 400);
  }

  // 驗證管理權限數據
  if (!Array.isArray(manageData) || manageData.length === 0) {
    throw new AppError('必須指定至少一個管理店鋪', 400);
  }

  // 驗證每個 manage 項目
  for (const item of manageData) {
    // 檢查 store 是否為有效的 ObjectId
    if (!item.store || !mongoose.Types.ObjectId.isValid(item.store)) {
      throw new AppError('無效的店鋪 ID', 400);
    }

    // 檢查店鋪是否存在
    const store = await Store.findById(item.store);
    if (!store) {
      throw new AppError(`店鋪 ${item.store} 不存在`, 404);
    }

    // 品牌管理員只能管理自己品牌的店鋪
    if (admin.role === 'brand_admin' && admin.brand) {
      if (store.brand.toString() !== admin.brand.toString()) {
        throw new AppError(`店鋪 ${item.store} 不屬於管理員的品牌`, 403);
      }
    }

    // 檢查權限
    if (!item.permission || !Array.isArray(item.permission) || item.permission.length === 0) {
      throw new AppError('必須指定至少一個權限', 400);
    }

    // 檢查每個權限是否有效
    const validPermissions = ['order_system', 'view_reports', 'edit_backend', 'manage_staff'];
    for (const perm of item.permission) {
      if (!validPermissions.includes(perm)) {
        throw new AppError(`無效的權限: ${perm}`, 400);
      }
    }
  }

  // 更新管理權限
  admin.manage = manageData;
  await admin.save();

  // 移除密碼後返回
  const adminResponse = admin.toObject();
  delete adminResponse.password;

  return adminResponse;
};

/**
 * 檢查管理員是否有指定權限
 * @param {String} adminId - 管理員ID
 * @param {String} storeId - 店鋪ID
 * @param {String|Array} requiredPermissions - 所需權限
 * @param {Boolean} requireAllPermissions - 是否需要擁有所有權限
 * @returns {Promise<Boolean>} 是否有權限
 */
export const checkPermission = async (adminId, storeId, requiredPermissions, requireAllPermissions = false) => {
  // 檢查管理員是否存在
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  // 檢查管理員是否啟用
  if (!admin.isActive) {
    throw new AppError('管理員帳號已停用', 403);
  }

  // 如果是老闆角色，擁有所有權限
  if (admin.role === 'boss') {
    return true;
  }

  // 規範化所需權限為陣列
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  // 查找指定店鋪的管理設定
  const storeManage = admin.manage.find(item => item.store.toString() === storeId);

  if (!storeManage) {
    return false;
  }

  // 檢查是否擁有所需權限
  if (requireAllPermissions) {
    // 需要具備所有指定的權限
    return permissions.every(permission => storeManage.permission.includes(permission));
  } else {
    // 只需具備其中一個權限
    return permissions.some(permission => storeManage.permission.includes(permission));
  }
};
