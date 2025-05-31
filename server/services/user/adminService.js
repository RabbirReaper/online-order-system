import mongoose from 'mongoose';
import Admin from '../../models/User/Admin.js';
import Brand from '../../models/Brand/Brand.js';
import Store from '../../models/Store/Store.js';
import { AppError } from '../../middlewares/error.js';
import { ROLE_LEVELS, ROLE_SCOPES, ROLE_MANAGEMENT_MATRIX, canManageRole } from '../../config/permissions.js';

/**
 * 檢查名稱唯一性 - Null 值方案
 */
async function checkNameUniqueness(name, brandId = null, excludeId = null) {
  const query = { name };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  // 核心邏輯：系統級用 null，品牌級用實際 brandId
  query.brand = brandId;

  const existingAdmin = await Admin.findOne(query);
  return !existingAdmin;
}

export const getAllAdmins = async (currentAdmin, options = {}) => {
  const { role, brandId, storeId, page = 1, limit = 20 } = options;

  const queryConditions = {};
  const currentScope = ROLE_SCOPES[currentAdmin.role];

  if (currentScope === 'system') {
    if (brandId) {
      queryConditions.brand = brandId;
      queryConditions.role = {
        $nin: ['primary_system_admin', 'system_admin']
      };
    }
  } else if (currentScope === 'brand') {
    queryConditions.brand = currentAdmin.brand;
    queryConditions.role = {
      $nin: ['primary_system_admin', 'system_admin']
    };
  } else if (currentScope === 'store') {
    queryConditions.store = currentAdmin.store;
    queryConditions.role = {
      $nin: ['primary_system_admin', 'system_admin']
    };
  }

  if (role) {
    if (queryConditions.role && queryConditions.role.$nin) {
      if (!queryConditions.role.$nin.includes(role)) {
        queryConditions.role = role;
      } else {
        return {
          admins: [],
          pagination: {
            total: 0,
            totalPages: 0,
            currentPage: page,
            limit,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }
    } else {
      queryConditions.role = role;
    }
  }

  if (storeId && ['system', 'brand'].includes(currentScope)) {
    queryConditions.store = storeId;
  }

  const skip = (page - 1) * limit;
  const total = await Admin.countDocuments(queryConditions);

  const admins = await Admin.find(queryConditions)
    .select('-password')
    .populate('brand', 'name')
    .populate('store', 'name')
    .populate('createdBy', 'name')
    .sort({ role: 1, name: 1 })
    .skip(skip)
    .limit(limit);

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

export const getAdminById = async (adminId, currentAdmin) => {
  const admin = await Admin.findById(adminId)
    .select('-password')
    .populate('brand', 'name')
    .populate('store', 'name')
    .populate('createdBy', 'name');

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  const currentScope = ROLE_SCOPES[currentAdmin.role];

  if (currentScope === 'brand' && admin.brand?.toString() !== currentAdmin.brand?.toString()) {
    throw new AppError('無權查看此管理員', 403);
  }

  if (currentScope === 'store' && admin.store?.toString() !== currentAdmin.store?.toString()) {
    throw new AppError('無權查看此管理員', 403);
  }

  return admin;
};

export const createAdmin = async (currentAdmin, adminData) => {
  if (!adminData.name || !adminData.password || !adminData.role) {
    throw new AppError('用戶名、密碼和角色為必填欄位', 400);
  }

  const validRoles = [
    'primary_system_admin', 'system_admin',
    'primary_brand_admin', 'brand_admin',
    'primary_store_admin', 'store_admin', 'employee'
  ];
  if (!validRoles.includes(adminData.role)) {
    throw new AppError('角色無效', 400);
  }

  if (!canManageRole(currentAdmin.role, adminData.role)) {
    throw new AppError(`您無權創建 ${adminData.role} 角色的管理員`, 403);
  }

  if (adminData.password.length < 8) {
    throw new AppError('密碼長度至少需要8個字元', 400);
  }

  const processedData = await processAdminData(currentAdmin, adminData);

  // 確定檢查範圍 - 極簡邏輯
  let checkBrandId;
  if (['primary_system_admin', 'system_admin'].includes(processedData.role)) {
    checkBrandId = null;  // 系統級
  } else {
    checkBrandId = processedData.brand;  // 品牌級
  }

  const isNameUnique = await checkNameUniqueness(adminData.name, checkBrandId);
  if (!isNameUnique) {
    const scope = checkBrandId ? '此品牌內' : '系統內';
    throw new AppError(`此用戶名在${scope}已被使用`, 400);
  }

  if (adminData.role.startsWith('primary_')) {
    const existingPrimary = await checkPrimaryRoleConflict(adminData.role, processedData.brand, processedData.store);
    if (existingPrimary) {
      throw new AppError('此層級已存在主管理員', 400);
    }
  }

  processedData.createdBy = currentAdmin._id;

  const newAdmin = new Admin(processedData);
  await newAdmin.save();

  const adminResponse = newAdmin.toObject();
  delete adminResponse.password;

  return adminResponse;
};

export const updateAdmin = async (adminId, currentAdmin, updateData) => {
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  if (!canManageRole(currentAdmin.role, admin.role)) {
    throw new AppError('無權編輯此管理員', 403);
  }

  delete updateData.password;
  delete updateData.createdBy;

  if (updateData.name && updateData.name !== admin.name) {
    let checkBrandId;
    const currentRole = updateData.role || admin.role;

    if (['primary_system_admin', 'system_admin'].includes(currentRole)) {
      checkBrandId = null;  // 系統級
    } else {
      checkBrandId = updateData.brand || admin.brand;  // 品牌級
    }

    const isNameUnique = await checkNameUniqueness(updateData.name, checkBrandId, adminId);
    if (!isNameUnique) {
      const scope = checkBrandId ? '此品牌內' : '系統內';
      throw new AppError(`此用戶名在${scope}已被使用`, 400);
    }
  }

  if (updateData.role && updateData.role !== admin.role) {
    if (!canManageRole(currentAdmin.role, updateData.role)) {
      throw new AppError('無權將管理員設置為此角色', 403);
    }

    if (updateData.role.startsWith('primary_')) {
      const existingPrimary = await checkPrimaryRoleConflict(updateData.role, updateData.brand || admin.brand, updateData.store || admin.store, adminId);
      if (existingPrimary) {
        throw new AppError('此層級已存在主管理員', 400);
      }
    }
  }

  const processedData = await processAdminData(currentAdmin, { ...admin.toObject(), ...updateData }, admin);

  Object.keys(processedData).forEach(key => {
    if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
      admin[key] = processedData[key];
    }
  });

  await admin.save();

  const adminResponse = admin.toObject();
  delete adminResponse.password;

  return adminResponse;
};

export const deleteAdmin = async (adminId, currentAdmin) => {
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  if (!canManageRole(currentAdmin.role, admin.role)) {
    throw new AppError('無權刪除此管理員', 403);
  }

  if (admin.role === 'primary_system_admin') {
    const primaryCount = await Admin.countDocuments({ role: 'primary_system_admin' });
    if (primaryCount <= 1) {
      throw new AppError('無法刪除最後一個系統主管理員', 400);
    }
  }

  await admin.deleteOne();

  return { success: true, message: '管理員已刪除' };
};

export const toggleAdminStatus = async (adminId, currentAdmin, isActive) => {
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new AppError('管理員不存在', 404);
  }

  if (!canManageRole(currentAdmin.role, admin.role)) {
    throw new AppError('無權操作此管理員', 403);
  }

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

  const adminResponse = admin.toObject();
  delete adminResponse.password;

  return adminResponse;
};

async function checkPrimaryRoleConflict(role, brandId, storeId, excludeId = null) {
  const query = { role };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  if (role === 'primary_system_admin') {
    return await Admin.findOne(query);
  } else if (role === 'primary_brand_admin') {
    query.brand = brandId;
    return await Admin.findOne(query);
  } else if (role === 'primary_store_admin') {
    query.store = storeId;
    return await Admin.findOne(query);
  }

  return null;
}

async function processAdminData(currentAdmin, adminData, existingAdmin = null) {
  const processedData = { ...adminData };
  const targetRole = processedData.role;
  const currentScope = ROLE_SCOPES[currentAdmin.role];

  if (['primary_system_admin', 'system_admin'].includes(targetRole)) {
    // 系統級角色設置為 null
    processedData.brand = null;
    delete processedData.store;
  } else if (['primary_brand_admin', 'brand_admin'].includes(targetRole)) {
    delete processedData.store;

    if (!processedData.brand) {
      if (currentScope === 'system') {
        throw new AppError('系統管理員創建品牌管理員時必須指定品牌', 400);
      } else {
        processedData.brand = currentAdmin.brand;
      }
    }

    const brand = await Brand.findById(processedData.brand);
    if (!brand) {
      throw new AppError('品牌不存在', 404);
    }

    if (currentScope === 'brand' && processedData.brand.toString() !== currentAdmin.brand.toString()) {
      throw new AppError('無權在其他品牌創建管理員', 403);
    }
  } else if (['primary_store_admin', 'store_admin', 'employee'].includes(targetRole)) {
    if (!processedData.store) {
      if (currentScope === 'store') {
        processedData.store = currentAdmin.store;
        processedData.brand = currentAdmin.brand;
      } else {
        throw new AppError('創建店鋪管理員時必須指定店鋪', 400);
      }
    }

    const store = await Store.findById(processedData.store).populate('brand');
    if (!store) {
      throw new AppError('店鋪不存在', 404);
    }

    processedData.brand = store.brand._id;

    if (currentScope === 'brand' && store.brand._id.toString() !== currentAdmin.brand.toString()) {
      throw new AppError('無權在其他品牌的店鋪創建管理員', 403);
    }
    if (currentScope === 'store' && processedData.store.toString() !== currentAdmin.store.toString()) {
      throw new AppError('無權在其他店鋪創建管理員', 403);
    }
  }

  return processedData;
}
