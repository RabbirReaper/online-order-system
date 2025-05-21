/**
 * 用戶認證服務
 * 處理用戶登入、註冊、認證等業務邏輯
 */

import bcrypt from 'bcrypt';
import User from '../../models/User/User.js';
import VerificationCode from '../../models/User/VerificationCode.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 用戶註冊
 * @param {Object} userData - 用戶數據
 * @returns {Promise<Object>} 用戶信息
 */
export const register = async (userData) => {
  // 基本驗證
  if (!userData.name || !userData.password || !userData.phone) {
    throw new AppError('姓名、密碼和電話為必填欄位', 400);
  }

  // 檢查電話是否已被使用
  const existingUserPhone = await User.findOne({ phone: userData.phone });
  if (existingUserPhone) {
    throw new AppError('此電話號碼已被使用', 400);
  }

  // 如果提供了電子郵件，檢查是否已被使用
  if (userData.email) {
    const existingUserEmail = await User.findOne({ email: userData.email });
    if (existingUserEmail) {
      throw new AppError('此電子郵件已被使用', 400);
    }
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
 * @param {String} credentials.phone - 手機號碼
 * @param {String} credentials.password - 密碼
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 用戶信息
 */
export const login = async (credentials, session) => {
  const { phone, password } = credentials;

  if (!phone || !password) {
    throw new AppError('手機號碼和密碼為必填欄位', 400);
  }

  // 查找用戶
  const user = await User.findOne({ phone }).select('+password');

  if (!user) {
    throw new AppError('手機號碼或密碼錯誤', 401);
  }

  // 檢查用戶是否啟用
  if (!user.isActive) {
    throw new AppError('此帳號已被停用，請聯繫客服', 403);
  }

  // 驗證密碼
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError('手機號碼或密碼錯誤', 401);
  }

  // 設置會話
  session.userId = user._id;
  session.role = 'user';
  session.brandId = user.brand;

  // 移除密碼後返回
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.resetPasswordToken;
  delete userResponse.resetPasswordExpire;

  return userResponse;
};

/**
 * 用戶登出
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
 * 生成驗證碼
 * @param {Number} length - 驗證碼長度
 * @returns {String} 驗證碼
 */
const generateVerificationCode = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

/**
 * 發送手機驗證碼
 * @param {String} phone - 電話號碼
 * @param {String} brandId - 品牌ID
 * @param {String} purpose - 用途 (register, reset_password, login)
 * @returns {Promise<Object>} 發送結果
 */
export const sendPhoneVerification = async (phone, brandId, purpose = 'register') => {
  // 檢查電話號碼是否有效
  if (!phone || !/^\d{10,}$/.test(phone)) {
    throw new AppError('請提供有效的電話號碼', 400);
  }

  // 檢查是否在短時間內重複發送
  const recentCode = await VerificationCode.findOne({
    phone,
    purpose,
    createdAt: { $gt: new Date(Date.now() - 60 * 1000) } // 1分鐘內
  });

  if (recentCode) {
    const timeLeft = Math.ceil((recentCode.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000);
    throw new AppError(`請等待 ${timeLeft} 秒後再次發送驗證碼`, 400);
  }

  // 生成驗證碼
  const code = generateVerificationCode(6);

  // 儲存驗證碼
  await VerificationCode.create({
    phone,
    code,
    purpose,
    brand: brandId,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10分鐘後過期
  });

  // TODO: 整合簡訊發送服務
  // 這裡應該調用簡訊服務API，例如：sendSMS(phone, `您的驗證碼是：${code}，10分鐘內有效`);

  console.log(`向 ${phone} 發送驗證碼：${code}`); // 開發環境用

  return {
    success: true,
    message: '驗證碼已發送到您的手機',
    expiresIn: 600 // 10分鐘，單位秒
  };
};

/**
 * 驗證手機驗證碼
 * @param {String} phone - 電話號碼
 * @param {String} code - 驗證碼
 * @param {String} purpose - 用途
 * @returns {Promise<Boolean>} 驗證結果
 */
export const verifyPhoneCode = async (phone, code, purpose = 'register') => {
  if (!phone || !code) {
    throw new AppError('電話號碼和驗證碼為必填欄位', 400);
  }
  console.log(phone, code, purpose);
  const verificationCode = await VerificationCode.findOne({
    phone,
    code,
    purpose,
    expiresAt: { $gt: new Date() },
    used: false
  });

  if (!verificationCode) {
    throw new AppError('驗證碼無效或已過期', 400);
  }

  // 標記為已使用
  verificationCode.used = true;
  await verificationCode.save();

  return { success: true, verified: true, phone };
};

/**
 * 忘記密碼 - 使用手機驗證
 * @param {String} phone - 電話號碼
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 發送結果
 */
export const forgotPassword = async (phone, brandId) => {
  if (!phone) {
    throw new AppError('電話號碼為必填欄位', 400);
  }

  // 查找用戶
  const user = await User.findOne({ phone, brand: brandId });

  if (!user) {
    throw new AppError('找不到使用此電話號碼的用戶', 404);
  }

  // 發送重設密碼驗證碼
  return await sendPhoneVerification(phone, brandId, 'reset_password');
};

/**
 * 重設密碼
 * @param {String} phone - 電話號碼
 * @param {String} code - 驗證碼
 * @param {String} newPassword - 新密碼
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 重設結果
 */
export const resetPassword = async (phone, code, newPassword, brandId) => {
  if (!phone || !code || !newPassword) {
    throw new AppError('電話號碼、驗證碼和新密碼為必填欄位', 400);
  }

  // 密碼強度驗證
  if (newPassword.length < 8) {
    throw new AppError('密碼長度至少需要8個字元', 400);
  }

  // 驗證驗證碼
  await verifyPhoneCode(phone, code, 'reset_password');

  // 查找用戶
  const user = await User.findOne({ phone, brand: brandId });

  if (!user) {
    throw new AppError('找不到使用此電話號碼的用戶', 404);
  }

  // 更新密碼
  user.password = newPassword;
  await user.save();

  return { success: true, message: '密碼已成功重設，請使用新密碼登入' };
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
 * 檢查用戶登入狀態
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 登入狀態信息
 */
export const checkUserStatus = async (session) => {
  if (!session.userId) {
    return { loggedIn: false, role: null, brandId: null };
  }

  const user = await User.findById(session.userId).select('brand');

  if (!user) {
    return { loggedIn: false, role: null, brandId: null };
  }

  return {
    loggedIn: true,
    role: 'user',
    brandId: user.brand
  };
};
