/**
 * 管理員服務
 * 處理管理員相關業務邏輯
 */

import mongoose from 'mongoose';
import Admin from '../../models/User/Admin.js';
import Brand from '../../models/Brand/Brand.js';
import Store from '../../models/Store/Store.js';
import { AppError } from '../../middlewares/error.js';
import { ROLE_LEVELS, ROLE_SCOPES, ROLE_MANAGEMENT_MATRIX, canManageRole } from '../../config/permissions.js';

/**
 * 獲取所有管理員
 * @param {Object} currentAdmin - 當前管理員
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 管理員列表與分頁資訊
 */
export const getAllAdmins = async (currentAdmin, options = {}) => {
  const { role, brandId, storeId, page = 1, limit = 20 } = options;

  // 根據當前管理員的權限範圍限制查詢
  const queryConditions = {};
  const currentScope = ROLE_SCOPES[currentAdmin.role];

  // 系統級管理員可以查看所有
  if (currentScope === 'system') {
    // 不限制查詢條件
  }
  // 品牌級管理員只能查看同品牌的
  else if (currentScope === 'brand') {
    queryConditions.brand = currentAdmin.brand;
  }
  // 店鋪級管理員只能查看同店鋪的
  else if (currentScope === 'store') {
    queryConditions.store = currentAdmin.store;
  }

  // 額外的篩選條件
  if (role) {
    queryConditions.role = role;
  }

  if (brandId && currentScope === 'system') {
    queryConditions.brand = brandId;
  }

  if (storeId && ['system', 'brand'].includes(currentScope)) {
    queryConditions.store = storeId;
  }

  // 計算分頁
  const skip = (page - 1) * limit;

  // 查詢總數
  const total = await Admin.countDocuments(queryConditions);

  // 查詢管理員
  const admins = await Admin.find(queryConditions)
    .select('-password')
    .populate('brand', 'name')
    .populate('store', 'name')
    .populate('createdBy', 'name')
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
 * @param {Object} currentAdmin - 當前管理員
 * @returns {Promise<Object>} 管理員
 */
export const getAdminById = async (adminId, currentAdmin) => {
  const admin = await Admin.findById(adminId)
    .select('-password')
    .populate('brand', 'name')
    .populate('store', 'name')
    .populate('createdBy', 'name');

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  // 檢查是否有權限查看此管理員
  const currentScope = ROLE_SCOPES[currentAdmin.role];

  if (currentScope === 'brand' && admin.brand?.toString() !== currentAdmin.brand?.toString()) {
    throw new AppError('無權查看此管理員', 403);
  }

  if (currentScope === 'store' && admin.store?.toString() !== currentAdmin.store?.toString()) {
    throw new AppError('無權查看此管理員', 403);
  }

  return admin;
};

/**
 * 創建管理員
 * @param {Object} currentAdmin - 當前管理員
 * @param {Object} adminData - 管理員數據
 * @returns {Promise<Object>} 創建的管理員
 */
export const createAdmin = async (currentAdmin, adminData) => {
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
  const validRoles = [
    'primary_system_admin', 'system_admin',
    'primary_brand_admin', 'brand_admin',
    'primary_store_admin', 'store_admin', 'employee'
  ];
  if (!validRoles.includes(adminData.role)) {
    throw new AppError('角色無效', 400);
  }

  // 檢查是否有權限創建此角色
  if (!canManageRole(currentAdmin.role, adminData.role)) {
    throw new AppError(`您無權創建 ${adminData.role} 角色的管理員`, 403);
  }

  // 密碼強度驗證
  if (adminData.password.length < 8) {
    throw new AppError('密碼長度至少需要8個字元', 400);
  }

  // 檢查primary角色的唯一性
  if (adminData.role.startsWith('primary_')) {
    const existingPrimary = await checkPrimaryRoleConflict(adminData.role, adminData.brand, adminData.store);
    if (existingPrimary) {
      throw new AppError('此層級已存在主管理員', 400);
    }
  }

  // 根據角色設定必要字段和權限範圍檢查
  const processedData = await processAdminData(currentAdmin, adminData);

  // 設定創建者
  processedData.createdBy = currentAdmin._id;

  // 創建管理員
  const newAdmin = new Admin(processedData);
  await newAdmin.save();

  // 移除密碼後返回
  const adminResponse = newAdmin.toObject();
  delete adminResponse.password;

  return adminResponse;
};

/**
 * 更新管理員
 * @param {String} adminId - 管理員ID
 * @param {Object} currentAdmin - 當前管理員
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的管理員
 */
export const updateAdmin = async (adminId, currentAdmin, updateData) => {
  // 檢查管理員是否存在
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  // 檢查是否有權限管理此角色
  if (!canManageRole(currentAdmin.role, admin.role)) {
    throw new AppError('無權編輯此管理員', 403);
  }

  // 不允許更改用戶名和密碼
  delete updateData.name;
  delete updateData.password;
  delete updateData.createdBy;

  // 檢查角色變更
  if (updateData.role && updateData.role !== admin.role) {
    if (!canManageRole(currentAdmin.role, updateData.role)) {
      throw new AppError('無權將管理員設置為此角色', 403);
    }

    // 檢查primary角色的唯一性
    if (updateData.role.startsWith('primary_')) {
      const existingPrimary = await checkPrimaryRoleConflict(updateData.role, updateData.brand || admin.brand, updateData.store || admin.store, adminId);
      if (existingPrimary) {
        throw new AppError('此層級已存在主管理員', 400);
      }
    }
  }

  // 處理更新數據
  const processedData = await processAdminData(currentAdmin, { ...admin.toObject(), ...updateData }, admin);

  // 更新管理員
  Object.keys(processedData).forEach(key => {
    if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
      admin[key] = processedData[key];
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
 * @param {Object} currentAdmin - 當前管理員
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteAdmin = async (adminId, currentAdmin) => {
  // 檢查管理員是否存在
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  // 檢查是否有權限刪除此角色
  if (!canManageRole(currentAdmin.role, admin.role)) {
    throw new AppError('無權刪除此管理員', 403);
  }

  // 防止刪除最後一個primary_system_admin
  if (admin.role === 'primary_system_admin') {
    const primaryCount = await Admin.countDocuments({ role: 'primary_system_admin' });
    if (primaryCount <= 1) {
      throw new AppError('無法刪除最後一個系統主管理員', 400);
    }
  }

  await admin.deleteOne();

  return { success: true, message: '管理員已刪除' };
};

/**
 * 切換管理員啟用狀態
 * @param {String} adminId - 管理員ID
 * @param {Object} currentAdmin - 當前管理員
 * @param {Boolean} isActive - 啟用狀態
 * @returns {Promise<Object>} 更新後的管理員
 */
export const toggleAdminStatus = async (adminId, currentAdmin, isActive) => {
  // 檢查管理員是否存在
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  // 檢查是否有權限操作此角色
  if (!canManageRole(currentAdmin.role, admin.role)) {
    throw new AppError('無權操作此管理員', 403);
  }

  // 防止停用最後一個primary_system_admin
  if (admin.role === 'primary_system_admin' && !isActive) {
    const activePrimaryCount = await Admin.countDocuments({
      role: 'primary_system_admin',
      isActive: true
    });
    if (activePrimaryCount <= 1) {
      throw new AppError('無法停用最後一個系統主管理員', 400);
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
 * 檢查primary角色衝突
 */
async function checkPrimaryRoleConflict(role, brandId, storeId, excludeId = null) {
  const query = { role };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  if (role === 'primary_system_admin') {
    // 系統級primary角色全局唯一
    return await Admin.findOne(query);
  } else if (role === 'primary_brand_admin') {
    // 品牌級primary角色在品牌內唯一
    query.brand = brandId;
    return await Admin.findOne(query);
  } else if (role === 'primary_store_admin') {
    // 店鋪級primary角色在店鋪內唯一
    query.store = storeId;
    return await Admin.findOne(query);
  }

  return null;
}

/**
 * 處理管理員數據
 */
async function processAdminData(currentAdmin, adminData, existingAdmin = null) {
  const processedData = { ...adminData };
  const targetRole = processedData.role;
  const currentScope = ROLE_SCOPES[currentAdmin.role];

  // 根據角色設定brand和store
  if (['primary_system_admin', 'system_admin'].includes(targetRole)) {
    // 系統級角色不需要brand和store
    delete processedData.brand;
    delete processedData.store;
  } else if (['primary_brand_admin', 'brand_admin'].includes(targetRole)) {
    // 品牌級角色需要brand，不需要store
    delete processedData.store;

    // 如果沒有指定brand，根據當前管理員設定
    if (!processedData.brand) {
      if (currentScope === 'system') {
        throw new AppError('系統管理員創建品牌管理員時必須指定品牌', 400);
      } else {
        processedData.brand = currentAdmin.brand;
      }
    }

    // 檢查brand是否存在
    const brand = await Brand.findById(processedData.brand);
    if (!brand) {
      throw new AppError('品牌不存在', 404);
    }

    // 檢查權限範圍
    if (currentScope === 'brand' && processedData.brand.toString() !== currentAdmin.brand.toString()) {
      throw new AppError('無權在其他品牌創建管理員', 403);
    }
  } else if (['primary_store_admin', 'store_admin', 'employee'].includes(targetRole)) {
    // 店鋪級角色需要brand和store

    // 如果沒有指定store，根據當前管理員設定
    if (!processedData.store) {
      if (currentScope === 'store') {
        processedData.store = currentAdmin.store;
        processedData.brand = currentAdmin.brand;
      } else {
        throw new AppError('創建店鋪管理員時必須指定店鋪', 400);
      }
    }

    // 檢查store是否存在並獲取brand
    const store = await Store.findById(processedData.store).populate('brand');
    if (!store) {
      throw new AppError('店鋪不存在', 404);
    }

    processedData.brand = store.brand._id;

    // 檢查權限範圍
    if (currentScope === 'brand' && store.brand._id.toString() !== currentAdmin.brand.toString()) {
      throw new AppError('無權在其他品牌的店鋪創建管理員', 403);
    }
    if (currentScope === 'store' && processedData.store.toString() !== currentAdmin.store.toString()) {
      throw new AppError('無權在其他店鋪創建管理員', 403);
    }
  }

  return processedData;
}
