/**
 * 用戶認證服務
 * 處理用戶登入、註冊、認證等業務邏輯
 */

import bcrypt from 'bcrypt'
import User from '../../models/User/User.js'
import VerificationCode from '../../models/User/VerificationCode.js'
import { AppError } from '../../middlewares/error.js'
import smsService from '../notification/smsService.js'

// 驗證規則常數
const VALIDATION_PATTERNS = {
  phone: /^09\d{8}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^[a-zA-Z0-9!@#$%^&*]+$/,
}

const VALIDATION_RULES = {
  name: { minLength: 1, maxLength: 25 },
  password: { minLength: 6, maxLength: 32 },
  verificationCode: { minLength: 6, maxLength: 6 },
}

/**
 * 驗證欄位格式
 * @param {String} fieldName - 欄位名稱
 * @param {String} value - 欄位值
 * @param {Boolean} required - 是否必填
 * @returns {Object} 驗證結果
 */
const validateField = (fieldName, value, required = true) => {
  // 必填驗證
  if (required && (!value || value.trim() === '')) {
    switch (fieldName) {
      case 'name':
        return { valid: false, message: '姓名為必填欄位' }
      case 'phone':
        return { valid: false, message: '手機號碼為必填欄位' }
      case 'password':
        return { valid: false, message: '密碼為必填欄位' }
      case 'email':
        return { valid: false, message: '電子郵件為必填欄位' }
      case 'verificationCode':
        return { valid: false, message: '驗證碼為必填欄位' }
      default:
        return { valid: false, message: `${fieldName}為必填欄位` }
    }
  }

  // 如果不是必填且為空，則跳過其他驗證
  if (!required && (!value || value.trim() === '')) {
    return { valid: true }
  }

  // 長度驗證
  const rule = VALIDATION_RULES[fieldName]
  if (rule) {
    if (rule.minLength && value.length < rule.minLength) {
      switch (fieldName) {
        case 'name':
          return { valid: false, message: '姓名至少需要1個字元' }
        case 'password':
          return { valid: false, message: '密碼必須6-32個字元，只能包含英文、數字和符號(!@#$%^&*)' }
        case 'verificationCode':
          return { valid: false, message: '驗證碼格式不正確' }
        default:
          return { valid: false, message: `${fieldName}長度至少需要${rule.minLength}個字元` }
      }
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      switch (fieldName) {
        case 'name':
          return { valid: false, message: '姓名長度不能超過25個字元' }
        case 'password':
          return { valid: false, message: '密碼必須6-32個字元，只能包含英文、數字和符號(!@#$%^&*)' }
        case 'verificationCode':
          return { valid: false, message: '驗證碼格式不正確' }
        default:
          return { valid: false, message: `${fieldName}長度不能超過${rule.maxLength}個字元` }
      }
    }
  }

  // 格式驗證
  const pattern = VALIDATION_PATTERNS[fieldName]
  if (pattern && !pattern.test(value)) {
    switch (fieldName) {
      case 'phone':
        return { valid: false, message: '請輸入有效的手機號碼格式 (09xxxxxxxx)' }
      case 'email':
        return { valid: false, message: '請輸入有效的電子郵件格式' }
      case 'password':
        return { valid: false, message: '密碼必須8-64個字元，只能包含英文、數字和符號(!@#$%^&*)' }
      default:
        return { valid: false, message: `${fieldName}格式不正確` }
    }
  }

  return { valid: true }
}

/**
 * 用戶註冊
 * @param {Object} userData - 用戶數據
 * @param {String} verificationCode - 驗證碼（用於標記為已使用）
 * @returns {Promise<Object>} 用戶信息
 */
export const register = async (userData, verificationCode = null) => {
  // 基本必填欄位驗證
  const requiredFields = ['name', 'phone', 'password']
  for (const field of requiredFields) {
    const validation = validateField(field, userData[field], true)
    if (!validation.valid) {
      throw new AppError(validation.message, 400)
    }
  }

  // 電子郵件驗證（選填）
  if (userData.email) {
    const emailValidation = validateField('email', userData.email, false)
    if (!emailValidation.valid) {
      throw new AppError(emailValidation.message, 400)
    }
  }

  // 如果提供了驗證碼，先驗證
  if (verificationCode) {
    await verifyPhoneCode(userData.phone, verificationCode, 'register')
  }

  // 檢查手機號碼是否已被使用（同品牌內）
  const existingUserPhone = await User.findOne({ phone: userData.phone, brand: userData.brand })
  if (existingUserPhone) {
    throw new AppError('該手機號碼已被註冊，請使用其他號碼或前往登入', 400)
  }

  // 如果提供了電子郵件，檢查是否已被使用（同品牌內）
  if (userData.email) {
    const existingUserEmail = await User.findOne({ email: userData.email, brand: userData.brand })
    if (existingUserEmail) {
      throw new AppError('此電子郵件已被使用', 400)
    }
  }

  // 在創建用戶之前，標記驗證碼為已使用
  if (verificationCode) {
    const codeRecord = await VerificationCode.findOne({
      phone: userData.phone,
      code: verificationCode,
      purpose: 'register',
      used: false,
    })

    if (codeRecord) {
      codeRecord.used = true
      await codeRecord.save()
    }
  }

  // 創建用戶
  const newUser = new User(userData)
  await newUser.save()

  // 移除敏感資料後返回
  const userResponse = newUser.toObject()
  delete userResponse.password
  delete userResponse.resetPasswordToken
  delete userResponse.resetPasswordExpire

  return userResponse
}

/**
 * 用戶登入
 * @param {Object} credentials - 登入憑證
 * @param {String} credentials.phone - 手機號碼
 * @param {String} credentials.password - 密碼
 * @param {String} credentials.brand - 品牌ID
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 用戶信息
 */
export const login = async (credentials, session) => {
  const { phone, password, brand, rememberMe } = credentials

  // 驗證必填欄位
  const phoneValidation = validateField('phone', phone, true)
  if (!phoneValidation.valid) {
    throw new AppError(phoneValidation.message, 400)
  }

  if (!password) {
    throw new AppError('密碼為必填欄位', 400)
  }

  // 查找用戶（加入品牌隔離）
  const user = await User.findOne({ phone, brand }).select('+password')

  if (!user) {
    throw new AppError('手機號碼或密碼錯誤', 401)
  }

  // 檢查用戶是否啟用
  if (!user.isActive) {
    throw new AppError('此帳號已被停用，請聯繫客服', 403)
  }

  // 驗證密碼
  const isPasswordValid = await user.comparePassword(password)

  if (!isPasswordValid) {
    throw new AppError('手機號碼或密碼錯誤', 401)
  }

  // 根據 rememberMe 動態設置 session cookie maxAge
  if (rememberMe) {
    // 保持登入: 60 天（配合 rolling: true 實現「有活動就永不過期」）
    session.cookie.maxAge = 60 * 24 * 60 * 60 * 1000
  } else {
    // 一般登入: 1 小時
    session.cookie.maxAge = 60 * 60 * 1000
  }

  // 設置會話
  session.userId = user._id
  session.role = 'user'
  session.brandId = user.brand

  // 移除敏感資料後返回
  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.resetPasswordToken
  delete userResponse.resetPasswordExpire

  return userResponse
}

/**
 * 用戶登出
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 登出結果
 */
export const logout = async (session) => {
  return new Promise((resolve, reject) => {
    session.destroy((err) => {
      if (err) {
        return reject(new AppError('登出失敗', 500))
      }

      resolve({ success: true, message: '登出成功' })
    })
  })
}

/**
 * 生成驗證碼
 * @param {Number} length - 驗證碼長度
 * @returns {String} 驗證碼
 */
const generateVerificationCode = (length = 6) => {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

/**
 * 發送手機驗證碼
 * @param {String} phone - 電話號碼
 * @param {String} brandId - 品牌ID
 * @param {String} purpose - 用途 (register, reset_password, login)
 * @returns {Promise<Object>} 發送結果
 */
export const sendPhoneVerification = async (phone, brandId, purpose = 'register') => {
  // 驗證手機號碼格式
  const phoneValidation = validateField('phone', phone, true)
  if (!phoneValidation.valid) {
    throw new AppError(phoneValidation.message, 400)
  }

  // 根據用途進行額外檢查
  if (purpose === 'register') {
    // 註冊時檢查手機號碼是否已被使用
    const existingUser = await User.findOne({ phone, brand: brandId })
    if (existingUser) {
      throw new AppError('該手機號碼已被註冊，請使用其他號碼或前往登入', 400)
    }
  } else if (purpose === 'reset_password') {
    // 重設密碼時檢查用戶是否存在
    const user = await User.findOne({ phone, brand: brandId })
    if (!user) {
      throw new AppError('找不到使用此電話號碼的用戶', 404)
    }
  }

  // 檢查是否在短時間內重複發送
  const recentCode = await VerificationCode.findOne({
    phone,
    purpose,
    createdAt: { $gt: new Date(Date.now() - 60 * 1000) }, // 1分鐘內
  })

  if (recentCode) {
    const timeLeft = Math.ceil((recentCode.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000)
    throw new AppError(`請等待 ${timeLeft} 秒後再次發送驗證碼`, 429)
  }

  // 生成驗證碼
  const code = generateVerificationCode(6)

  // 儲存驗證碼
  const verificationRecord = await VerificationCode.create({
    phone,
    code,
    purpose,
    brand: brandId,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5分鐘後過期
  })

  // 發送簡訊驗證碼
  try {
    const newline = String.fromCharCode(6)
    const message = `【光兔點餐】您的驗證碼是：${code}。${newline}此驗證碼僅用於本次身份驗證，5分鐘內有效。${newline}請勿將驗證碼透露給任何人，我們的工作人員不會向您索取驗證碼。`

    const smsResult = await smsService.sendSMS(phone, message)

    // 簡訊發送成功
    return {
      success: true,
      message: '驗證碼已發送到您的手機',
      expiresIn: 300, // 5分鐘，單位秒
    }
  } catch (smsError) {
    console.error('簡訊發送失敗:', smsError)

    // 刪除已創建的驗證碼記錄（因為用戶無法收到）
    await VerificationCode.deleteOne({ _id: verificationRecord._id })

    // 重新拋出錯誤，讓控制器處理並返回給前端
    throw smsError
  }
}

/**
 * 驗證手機驗證碼（純驗證，不修改狀態）
 * @param {String} phone - 電話號碼
 * @param {String} code - 驗證碼
 * @param {String} purpose - 用途
 * @returns {Promise<Boolean>} 驗證結果
 */
export const verifyPhoneCode = async (phone, code, purpose = 'register') => {
  // 驗證必填欄位
  const phoneValidation = validateField('phone', phone, true)
  if (!phoneValidation.valid) {
    throw new AppError(phoneValidation.message, 400)
  }

  const codeValidation = validateField('verificationCode', code, true)
  if (!codeValidation.valid) {
    throw new AppError(codeValidation.message, 400)
  }

  const verificationCode = await VerificationCode.findOne({
    phone,
    code,
    purpose,
    expiresAt: { $gt: new Date() },
    used: false,
  })

  if (!verificationCode) {
    throw new AppError('驗證碼錯誤或已過期，請重新獲取驗證碼', 400)
  }

  // 只驗證，不標記為已使用
  return { success: true, verified: true, phone }
}

/**
 * 忘記密碼 - 使用手機驗證
 * @param {String} phone - 電話號碼
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 發送結果
 */
export const forgotPassword = async (phone, brandId) => {
  // 驗證手機號碼格式
  const phoneValidation = validateField('phone', phone, true)
  if (!phoneValidation.valid) {
    throw new AppError(phoneValidation.message, 400)
  }

  // 查找用戶
  const user = await User.findOne({ phone, brand: brandId })

  if (!user) {
    throw new AppError('找不到使用此電話號碼的用戶', 404)
  }

  // 發送重設密碼驗證碼
  return await sendPhoneVerification(phone, brandId, 'reset_password')
}

/**
 * 重設密碼
 * @param {String} phone - 電話號碼
 * @param {String} code - 驗證碼
 * @param {String} newPassword - 新密碼
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 重設結果
 */
export const resetPassword = async (phone, code, newPassword, brandId) => {
  // 基本必填驗證
  if (!phone || !code || !newPassword) {
    throw new AppError('電話號碼、驗證碼和新密碼為必填欄位', 400)
  }

  // 驗證手機號碼格式
  const phoneValidation = validateField('phone', phone, true)
  if (!phoneValidation.valid) {
    throw new AppError(phoneValidation.message, 400)
  }

  // 驗證新密碼格式
  const passwordValidation = validateField('password', newPassword, true)
  if (!passwordValidation.valid) {
    throw new AppError(passwordValidation.message, 400)
  }

  // 驗證驗證碼
  await verifyPhoneCode(phone, code, 'reset_password')

  // 查找用戶
  const user = await User.findOne({ phone, brand: brandId }).select('+password')
  if (!user) {
    throw new AppError('找不到使用此電話號碼的用戶', 404)
  }

  // 檢查新密碼是否與當前密碼相同
  const isSamePassword = await user.comparePassword(newPassword)
  if (isSamePassword) {
    throw new AppError('新密碼不能與當前密碼相同', 400)
  }

  // 在更新密碼之前，標記驗證碼為已使用
  const codeRecord = await VerificationCode.findOne({
    phone,
    code,
    purpose: 'reset_password',
    used: false,
  })

  if (codeRecord) {
    codeRecord.used = true
    await codeRecord.save()
  }

  // 更新密碼
  user.password = newPassword
  await user.save()

  return { success: true, message: '密碼已成功重設，請使用新密碼登入' }
}

/**
 * 修改密碼
 * @param {String} userId - 用戶ID
 * @param {String} currentPassword - 當前密碼
 * @param {String} newPassword - 新密碼
 * @returns {Promise<Object>} 修改結果
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  // 基本必填驗證
  if (!currentPassword || !newPassword) {
    throw new AppError('當前密碼和新密碼為必填欄位', 400)
  }

  // 驗證新密碼格式
  const passwordValidation = validateField('password', newPassword, true)
  if (!passwordValidation.valid) {
    throw new AppError(passwordValidation.message, 400)
  }

  // 查找用戶
  const user = await User.findById(userId).select('+password')
  if (!user) {
    throw new AppError('找不到用戶', 404)
  }

  // 驗證當前密碼
  const isPasswordValid = await user.comparePassword(currentPassword)
  if (!isPasswordValid) {
    throw new AppError('當前密碼不正確', 401)
  }

  // 確保新舊密碼不同
  const isSamePassword = await user.comparePassword(newPassword)
  if (isSamePassword) {
    throw new AppError('新密碼不能與當前密碼相同', 400)
  }

  // 更新密碼
  user.password = newPassword
  await user.save()

  return { success: true, message: '密碼修改成功' }
}

/**
 * 檢查用戶登入狀態
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 登入狀態信息
 */
export const checkUserStatus = async (session) => {
  if (!session.userId) {
    return { loggedIn: false, role: null, brandId: null }
  }

  const user = await User.findById(session.userId).select('brand')

  if (!user) {
    return { loggedIn: false, role: null, brandId: null }
  }

  return {
    loggedIn: true,
    role: 'user',
    brandId: user.brand,
  }
}

/**
 * 驗證用戶資料更新
 * @param {Object} updateData - 要更新的資料
 * @returns {Object} 驗證結果
 */
export const validateUserUpdate = (updateData) => {
  const errors = []

  // 姓名驗證
  if (updateData.name !== undefined) {
    const nameValidation = validateField('name', updateData.name, true)
    if (!nameValidation.valid) {
      errors.push(nameValidation.message)
    }
  }

  // 電子郵件驗證（可選）
  if (updateData.email !== undefined && updateData.email !== '') {
    const emailValidation = validateField('email', updateData.email, false)
    if (!emailValidation.valid) {
      errors.push(emailValidation.message)
    }
  }

  // 手機號碼驗證
  if (updateData.phone !== undefined) {
    const phoneValidation = validateField('phone', updateData.phone, true)
    if (!phoneValidation.valid) {
      errors.push(phoneValidation.message)
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  }
}
