/**
 * 用戶認證服務
 * 處理用戶登入、註冊、認證等業務邏輯
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../../models/User/User.js';
import Admin from '../../models/User/Admin.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 用戶註冊
 * @param {Object} userData - 用戶數據
 * @returns {Promise<Object>} 用戶信息
 */
export const register = async (userData) => {
  // 基本驗證
  if (!userData.name || !userData.email || !userData.password || !userData.phone) {
    throw new AppError('姓名、電子郵件、密碼和電話為必填欄位', 400);
  }

  // 檢查電子郵件是否已被使用
  const existingUserEmail = await User.findOne({ email: userData.email });
  if (existingUserEmail) {
    throw new AppError('此電子郵件已被使用', 400);
  }

  // 檢查電話是否已被使用
  const existingUserPhone = await User.findOne({ phone: userData.phone });
  if (existingUserPhone) {
    throw new AppError('此電話號碼已被使用', 400);
  }

  // 密碼強度驗證
  if (userData.password.length < 8) {
    throw new AppError('密碼長度至少需要8個字元', 400);
  }

  // 創建用戶
  const newUser = new User(userData);
  await newUser.save();

  // 移除密碼後返回
  const userResponse = newUser.toObject();
  delete userResponse.password;
  delete userResponse.resetPasswordToken;
  delete userResponse.resetPasswordExpire;

  return userResponse;
};

/**
 * 用戶登入
 * @param {Object} credentials - 登入憑證
 * @param {String} credentials.email - 電子郵件
 * @param {String} credentials.password - 密碼
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 用戶信息
 */
export const login = async (credentials, session) => {
  const { email, password } = credentials;

  if (!email || !password) {
    throw new AppError('電子郵件和密碼為必填欄位', 400);
  }

  // 查找用戶
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('電子郵件或密碼錯誤', 401);
  }

  // 檢查用戶是否啟用
  if (!user.isActive) {
    throw new AppError('此帳號已被停用，請聯繫客服', 403);
  }

  // 驗證密碼
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError('電子郵件或密碼錯誤', 401);
  }

  // 設置會話
  session.userId = user._id;

  // 移除密碼後返回
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.resetPasswordToken;
  delete userResponse.resetPasswordExpire;

  return userResponse;
};

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

  // 查找管理員
  const admin = await Admin.findOne({ name }).select('+password');

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
  session.user_id = admin._id;
  session.role = admin.role;

  // 處理管理權限
  const manageInfo = Array.isArray(admin.manage)
    ? admin.manage.map(m => ({
      store: m.store,
      permission: m.permission
    }))
    : [];

  session.manage = manageInfo;

  return {
    role: admin.role,
    manage: manageInfo
  };
};

/**
 * 登出
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 登出結果
 */
export const logout = async (session) => {
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
 * 忘記密碼
 * @param {String} email - 電子郵件
 * @returns {Promise<Object>} 重設token
 */
export const forgotPassword = async (email) => {
  if (!email) {
    throw new AppError('電子郵件為必填欄位', 400);
  }

  // 查找用戶
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('找不到使用此電子郵件的用戶', 404);
  }

  // 生成重設密碼token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // 加密token並保存到用戶
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30分鐘後過期

  await user.save();

  // 在實際應用中，這裡應該發送重設密碼郵件
  // TODO: 整合郵件發送服務

  return {
    success: true,
    message: '密碼重設連結已發送到您的電子郵件',
    resetToken // 注意：實際應用中不應直接返回token
  };
};

/**
 * 重設密碼
 * @param {String} token - 重設token
 * @param {String} newPassword - 新密碼
 * @returns {Promise<Object>} 重設結果
 */
export const resetPassword = async (token, newPassword) => {
  if (!token || !newPassword) {
    throw new AppError('token和新密碼為必填欄位', 400);
  }

  // 密碼強度驗證
  if (newPassword.length < 8) {
    throw new AppError('密碼長度至少需要8個字元', 400);
  }

  // 將token加密以匹配存儲的格式
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // 查找擁有此token且未過期的用戶
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('無效或過期的token', 400);
  }

  // 更新密碼
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return { success: true, message: '密碼已成功重設，請使用新密碼登入' };
};

/**
 * 驗證token
 * @param {String} token - 重設token
 * @returns {Promise<Object>} 驗證結果
 */
export const verifyToken = async (token) => {
  if (!token) {
    throw new AppError('token為必填欄位', 400);
  }

  // 將token加密以匹配存儲的格式
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // 查找擁有此token且未過期的用戶
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('無效或過期的token', 400);
  }

  return { success: true, valid: true, email: user.email };
};

/**
 * 修改密碼
 * @param {String} userId - 用戶ID
 * @param {String} currentPassword - 當前密碼
 * @param {String} newPassword - 新密碼
 * @returns {Promise<Object>} 修改結果
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new AppError('當前密碼和新密碼為必填欄位', 400);
  }

  // 密碼強度驗證
  if (newPassword.length < 8) {
    throw new AppError('新密碼長度至少需要8個字元', 400);
  }

  // 查找用戶
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError('找不到用戶', 404);
  }

  // 驗證當前密碼
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new AppError('當前密碼不正確', 401);
  }

  // 確保新舊密碼不同
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new AppError('新密碼不能與當前密碼相同', 400);
  }

  // 更新密碼
  user.password = newPassword;
  await user.save();

  return { success: true, message: '密碼修改成功' };
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
  const isSamePassword = await bcrypt.compare(newPassword, admin.password);
  if (isSamePassword) {
    throw new AppError('新密碼不能與當前密碼相同', 400);
  }

  // 更新密碼
  admin.password = newPassword;
  await admin.save();

  return { success: true, message: '密碼修改成功' };
};
