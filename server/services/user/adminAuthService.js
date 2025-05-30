/**
 * 管理員認證服務
 * 處理管理員登入、登出、認證等業務邏輯
 */

import bcrypt from 'bcrypt';
import Admin from '../../models/User/Admin.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 管理員登入
 * @param {Object} credentials - 登入憑證
 * @param {String} credentials.name - 用戶名
 * @param {String} credentials.password - 密碼
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 管理員信息
 */
export const adminLogin = async (credentials, session) => {
  const { name, password } = credentials;

  if (!name || !password) {
    throw new AppError('用戶名和密碼為必填欄位', 400);
  }

  // 查找管理員，包含新的字段
  const admin = await Admin.findOne({ name })
    .populate('brand', 'name')
    .populate('store', 'name');

  if (!admin) {
    throw new AppError('用戶名或密碼錯誤', 401);
  }

  // 檢查管理員是否啟用
  if (!admin.isActive) {
    throw new AppError('此帳號已被停用', 403);
  }

  // 驗證密碼
  const isPasswordValid = await admin.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError('用戶名或密碼錯誤', 401);
  }

  // 更新最後登入時間
  admin.lastLogin = new Date();
  await admin.save();

  // 設置會話
  session.adminId = admin._id;
  session.adminRole = admin.role;
  session.adminBrand = admin.brand?._id;
  session.adminStore = admin.store?._id;

  return {
    role: admin.role,
    brand: admin.brand,
    store: admin.store
  };
};

/**
 * 管理員登出
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 登出結果
 */
export const adminLogout = async (session) => {
  return new Promise((resolve, reject) => {
    session.destroy((err) => {
      if (err) {
        return reject(new AppError('登出失敗', 500));
      }

      resolve({ success: true, message: '登出成功' });
    });
  });
};

/**
 * 管理員修改密碼
 * @param {String} adminId - 管理員ID
 * @param {String} currentPassword - 當前密碼
 * @param {String} newPassword - 新密碼
 * @returns {Promise<Object>} 修改結果
 */
export const changeAdminPassword = async (adminId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new AppError('當前密碼和新密碼為必填欄位', 400);
  }

  // 密碼強度驗證
  if (newPassword.length < 8) {
    throw new AppError('新密碼長度至少需要8個字元', 400);
  }

  // 查找管理員
  const admin = await Admin.findById(adminId).select('+password');

  if (!admin) {
    throw new AppError('找不到管理員', 404);
  }

  // 驗證當前密碼
  const isPasswordValid = await admin.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new AppError('當前密碼不正確', 401);
  }

  // 確保新舊密碼不同
  const isSamePassword = await admin.comparePassword(newPassword);
  if (isSamePassword) {
    throw new AppError('新密碼不能與當前密碼相同', 400);
  }

  // 更新密碼
  admin.password = newPassword;
  await admin.save();

  return { success: true, message: '密碼修改成功' };
};

/**
 * 檢查管理員登入狀態
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 登入狀態信息
 */
export const checkAdminStatus = async (session) => {
  if (!session.adminId) {
    return { loggedIn: false, role: null, brand: null, store: null };
  }

  const admin = await Admin.findById(session.adminId)
    .select('role brand store')
    .populate('brand', 'name')
    .populate('store', 'name');

  if (!admin) {
    return { loggedIn: false, role: null, brand: null, store: null };
  }

  return {
    loggedIn: true,
    role: admin.role,
    brand: admin.brand,
    store: admin.store
  };
};
