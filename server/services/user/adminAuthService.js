/**
 * 管理員認證服務
 * 處理管理員登入、登出、認證等業務邏輯
 */

import bcrypt from 'bcrypt'
import Admin from '../../models/User/Admin.js'
import { AppError } from '../../middlewares/error.js'

/**
 * 管理員登入
 * @param {Object} credentials - 登入憑證
 * @param {String} credentials.name - 用戶名
 * @param {String} credentials.password - 密碼
 * @param {String} [credentials.brandId] - 品牌ID（用於驗證）
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 管理員信息
 */
export const adminLogin = async (credentials, session) => {
  const { name, password, brandId, rememberMe } = credentials

  if (!name || !password) {
    throw new AppError('用戶名和密碼為必填欄位', 400)
  }

  // 構建查詢條件
  const query = { name }

  if (brandId) {
    // 如果有 brandId，查詢時必須匹配該品牌的管理員
    query.brand = brandId
  } else {
    // 如果沒有 brandId，只查詢系統管理員（brand 為 null）
    query.brand = null
  }

  // 查找管理員
  const admin = await Admin.findOne(query)
    .select('+password')
    .populate('brand', 'name isActive')
    .populate('store', 'name isActive')

  if (!admin) {
    throw new AppError('用戶名或密碼錯誤', 401)
  }

  // 檢查管理員是否啟用
  if (!admin.isActive) {
    throw new AppError('此帳號已被停用', 403)
  }

  // 驗證密碼
  const isPasswordValid = await admin.comparePassword(password)

  if (!isPasswordValid) {
    throw new AppError('用戶名或密碼錯誤', 401)
  }

  // 額外的權限和狀態檢查
  if (brandId) {
    // 透過品牌登入頁面的額外檢查
    if (admin.brand && !admin.brand.isActive) {
      throw new AppError('此品牌已停用，無法登入', 403)
    }

    // 確保找到的管理員確實屬於該品牌
    if (!admin.brand || admin.brand._id.toString() !== brandId) {
      throw new AppError('用戶名或密碼錯誤', 401)
    }
  } else {
    // 透過系統管理員登入頁面的額外檢查
    const isSystemAdmin = ['primary_system_admin', 'system_admin'].includes(admin.role)
    if (!isSystemAdmin) {
      throw new AppError('用戶名或密碼錯誤', 401)
    }
  }

  // 店鋪權限額外檢查
  if (admin.store && !admin.store.isActive) {
    throw new AppError('您管理的店鋪已停用，請聯繫品牌管理員', 403)
  }

  // 更新最後登入時間
  admin.lastLogin = new Date()
  await admin.save()

  // 設置會話
  session.adminId = admin._id
  session.adminRole = admin.role
  session.adminBrand = admin.brand?._id
  session.adminStore = admin.store?._id

  // 根據 rememberMe 動態設置 session cookie maxAge
  if (rememberMe) {
    // 保持登入: 14 天
    session.cookie.maxAge = 14 * 24 * 60 * 60 * 1000
  } else {
    // 一般登入: 2 小時
    session.cookie.maxAge = 2 * 60 * 60 * 1000
  }

  // 顯式保存 session 到 MongoDB
  return new Promise((resolve, reject) => {
    session.save((err) => {
      if (err) {
        return reject(new AppError('Session 保存失敗', 500))
      }

      resolve({
        role: admin.role,
        brand: admin.brand,
        store: admin.store,
      })
    })
  })
}

/**
 * 管理員登出
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 登出結果
 */
export const adminLogout = async (session) => {
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
 * 驗證密碼強度
 * @param {string} password - 要驗證的密碼
 * @returns {Object} 驗證結果
 */
const validatePasswordStrength = (password) => {
  const errors = []

  // 長度驗證
  if (password.length < 8) {
    errors.push('密碼長度至少需要8個字元')
  }

  if (password.length > 64) {
    errors.push('密碼長度不能超過64個字元')
  }

  // 字符格式驗證
  if (!/^[a-zA-Z0-9!@#$%^&*]+$/.test(password)) {
    errors.push('密碼只能包含英文、數字和符號(!@#$%^&*)')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 管理員修改密碼（增強版）
 * @param {String} adminId - 管理員ID
 * @param {String} currentPassword - 當前密碼
 * @param {String} newPassword - 新密碼
 * @returns {Promise<Object>} 修改結果
 */
export const changeAdminPassword = async (adminId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new AppError('當前密碼和新密碼為必填欄位', 400)
  }

  // 密碼強度驗證
  const passwordValidation = validatePasswordStrength(newPassword)
  if (!passwordValidation.isValid) {
    throw new AppError(passwordValidation.errors.join('；'), 400)
  }

  // 查找管理員
  const admin = await Admin.findById(adminId).select('+password')

  if (!admin) {
    throw new AppError('找不到管理員', 404)
  }

  // 驗證當前密碼
  const isPasswordValid = await admin.comparePassword(currentPassword)

  if (!isPasswordValid) {
    throw new AppError('當前密碼不正確', 401)
  }

  // 確保新舊密碼不同
  const isSamePassword = await admin.comparePassword(newPassword)
  if (isSamePassword) {
    throw new AppError('新密碼不能與當前密碼相同', 400)
  }

  // 更新密碼
  admin.password = newPassword
  await admin.save()

  return { success: true, message: '密碼修改成功' }
}

/**
 * 檢查管理員登入狀態
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 登入狀態信息
 */
export const checkAdminStatus = async (session) => {
  if (!session.adminId) {
    return { loggedIn: false, role: null, brand: null, store: null }
  }

  const admin = await Admin.findById(session.adminId)
    .select('role brand store')
    .populate('brand', 'name')
    .populate('store', 'name')

  if (!admin) {
    return { loggedIn: false, role: null, brand: null, store: null }
  }

  return {
    loggedIn: true,
    role: admin.role,
    brand: admin.brand,
    store: admin.store,
  }
}

/**
 * 獲取當前登入管理員的完整資料
 * @param {Object} session - 會話對象
 * @returns {Promise<Object>} 管理員完整資料
 */
export const getCurrentAdminProfile = async (session) => {
  if (!session.adminId) {
    throw new AppError('未登入', 401)
  }

  const admin = await Admin.findById(session.adminId)
    .select('-password')
    .populate('brand', 'name')
    .populate('store', 'name')
    .populate('createdBy', 'name')

  if (!admin) {
    throw new AppError('管理員不存在', 404)
  }

  // 檢查管理員是否啟用
  if (!admin.isActive) {
    throw new AppError('此帳號已被停用', 403)
  }

  return admin
}

/**
 * 更新當前登入管理員的基本資料
 * @param {Object} session - 會話對象
 * @param {Object} updateData - 更新資料
 * @param {string} updateData.name - 用戶名
 * @param {string} [updateData.phone] - 電話號碼
 * @returns {Promise<Object>} 更新後的管理員資料
 */
export const updateCurrentAdminProfile = async (session, updateData) => {
  if (!session.adminId) {
    throw new AppError('未登入', 401)
  }

  const { name, phone } = updateData

  // 基本驗證
  if (!name || !name.trim()) {
    throw new AppError('用戶名為必填項', 400)
  }

  if (name.trim().length < 2) {
    throw new AppError('用戶名至少需要2個字元', 400)
  }

  // 電話號碼格式驗證（如果有提供）
  if (phone && !/^[\d\-\+\(\)\s]+$/.test(phone)) {
    throw new AppError('請輸入有效的電話號碼', 400)
  }

  const admin = await Admin.findById(session.adminId)

  if (!admin) {
    throw new AppError('管理員不存在', 404)
  }

  // 檢查管理員是否啟用
  if (!admin.isActive) {
    throw new AppError('此帳號已被停用', 403)
  }

  // 檢查用戶名是否已被其他管理員使用
  if (name.trim() !== admin.name) {
    // 檢查 60 天修改限制
    if (admin.lastNameChange) {
      const daysSinceLastChange = Math.floor(
        (Date.now() - admin.lastNameChange.getTime()) / (1000 * 60 * 60 * 24),
      )
      if (daysSinceLastChange < 60) {
        const daysRemaining = 60 - daysSinceLastChange
        throw new AppError(`用戶名 60 天內只能修改一次，還需等待 ${daysRemaining} 天`, 400)
      }
    }

    // 確定檢查範圍 - 根據管理員類型
    let checkBrandId
    if (['primary_system_admin', 'system_admin'].includes(admin.role)) {
      checkBrandId = null // 系統級
    } else {
      checkBrandId = admin.brand // 品牌級
    }

    const existingAdmin = await Admin.findOne({
      name: name.trim(),
      brand: checkBrandId,
      _id: { $ne: admin._id },
    })

    if (existingAdmin) {
      const scope = checkBrandId ? '此品牌內' : '系統內'
      throw new AppError(`此用戶名在${scope}已被使用`, 400)
    }

    // 記錄本次名稱修改時間
    admin.lastNameChange = new Date()
  }

  // 更新資料
  admin.name = name.trim()
  admin.phone = phone ? phone.trim() : ''

  await admin.save()

  // 返回更新後的資料（不包含密碼）
  const updatedAdmin = await Admin.findById(admin._id)
    .select('-password')
    .populate('brand', 'name')
    .populate('store', 'name')
    .populate('createdBy', 'name')

  return updatedAdmin
}
