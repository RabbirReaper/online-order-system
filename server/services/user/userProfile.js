/**
 * 用戶資料服務
 * 處理用戶個人資料相關業務邏輯
 */

import User from '../../models/User/User.js'
import { AppError } from '../../middlewares/error.js'
import mongoose from 'mongoose'
import { getStartOfDay, getEndOfDay } from '../../utils/date.js'

/**
 * 獲取用戶資料
 * @param {String} userId - 用戶ID
 * @returns {Promise<Object>} 用戶資料
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select(
    '-password -resetPasswordToken -resetPasswordExpire',
  )

  if (!user) {
    throw new AppError('用戶不存在', 404)
  }

  return user
}

/**
 * 更新用戶資料
 * @param {String} userId - 用戶ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的用戶資料
 */
export const updateUserProfile = async (userId, updateData) => {
  // 檢查用戶是否存在
  const user = await User.findById(userId)

  if (!user) {
    throw new AppError('用戶不存在', 404)
  }

  // 不允許通過此接口更改密碼和地址
  delete updateData.password
  delete updateData.addresses
  delete updateData.resetPasswordToken
  delete updateData.resetPasswordExpire

  // 如果要更改電子郵件，檢查是否已被使用
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await User.findOne({ email: updateData.email })
    if (existingUser) {
      throw new AppError('此電子郵件已被使用', 400)
    }
  }

  // 如果要更改電話，檢查是否已被使用
  if (updateData.phone && updateData.phone !== user.phone) {
    const existingUser = await User.findOne({ phone: updateData.phone })
    if (existingUser) {
      throw new AppError('此電話號碼已被使用', 400)
    }
  }

  // 更新用戶資料
  Object.keys(updateData).forEach((key) => {
    if (key !== 'isActive') {
      // 不允許用戶自行修改啟用狀態
      user[key] = updateData[key]
    }
  })

  await user.save()

  // 移除敏感資訊後返回
  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.resetPasswordToken
  delete userResponse.resetPasswordExpire

  return userResponse
}

/**
 * 添加用戶地址
 * @param {String} userId - 用戶ID
 * @param {Object} addressData - 地址數據
 * @returns {Promise<Object>} 更新後的用戶資料
 */
export const addUserAddress = async (userId, addressData) => {
  // 基本驗證
  if (!addressData.name || !addressData.address) {
    throw new AppError('地址名稱和詳細地址為必填欄位', 400)
  }

  // 檢查用戶是否存在
  const user = await User.findById(userId)

  if (!user) {
    throw new AppError('用戶不存在', 404)
  }

  // 生成地址ID
  const addressId = new mongoose.Types.ObjectId()

  // 設置為默認地址的邏輯
  let isDefault = Boolean(addressData.isDefault)

  // 如果這是第一個地址，自動設為默認
  if (user.addresses.length === 0) {
    isDefault = true
  }

  // 如果設為默認地址，先將其他地址的默認標記移除
  if (isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false
    })
  }

  // 添加新地址
  user.addresses.push({
    _id: addressId,
    name: addressData.name,
    address: addressData.address,
    isDefault: isDefault,
  })

  await user.save()

  // 移除敏感資訊後返回
  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.resetPasswordToken
  delete userResponse.resetPasswordExpire

  return userResponse
}

/**
 * 更新用戶地址
 * @param {String} userId - 用戶ID
 * @param {String} addressId - 地址ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的用戶資料
 */
export const updateUserAddress = async (userId, addressId, updateData) => {
  // 檢查用戶是否存在
  const user = await User.findById(userId)

  if (!user) {
    throw new AppError('用戶不存在', 404)
  }

  // 查找要更新的地址
  const address = user.addresses.id(addressId)

  if (!address) {
    throw new AppError('地址不存在', 404)
  }

  // 更新地址資訊
  if (updateData.name) {
    address.name = updateData.name
  }

  if (updateData.address) {
    address.address = updateData.address
  }

  // 處理默認地址設置
  if (updateData.isDefault === true && !address.isDefault) {
    // 將此地址設為默認，其他地址設為非默認
    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId
    })
  }

  await user.save()

  // 移除敏感資訊後返回
  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.resetPasswordToken
  delete userResponse.resetPasswordExpire

  return userResponse
}

/**
 * 刪除用戶地址
 * @param {String} userId - 用戶ID
 * @param {String} addressId - 地址ID
 * @returns {Promise<Object>} 更新後的用戶資料
 */
export const deleteUserAddress = async (userId, addressId) => {
  // 檢查用戶是否存在
  const user = await User.findById(userId)

  if (!user) {
    throw new AppError('用戶不存在', 404)
  }

  // 查找要刪除的地址
  const address = user.addresses.id(addressId)

  if (!address) {
    throw new AppError('地址不存在', 404)
  }

  // 刪除地址
  const isDefault = address.isDefault
  user.addresses.pull(addressId)

  // 如果刪除的是默認地址，設置一個新的默認地址
  if (isDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true
  }

  await user.save()

  // 移除敏感資訊後返回
  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.resetPasswordToken
  delete userResponse.resetPasswordExpire

  return userResponse
}

/**
 * 設置默認地址
 * @param {String} userId - 用戶ID
 * @param {String} addressId - 地址ID
 * @returns {Promise<Object>} 更新後的用戶資料
 */
export const setDefaultAddress = async (userId, addressId) => {
  // 檢查用戶是否存在
  const user = await User.findById(userId)

  if (!user) {
    throw new AppError('用戶不存在', 404)
  }

  // 查找要設為默認的地址
  const address = user.addresses.id(addressId)

  if (!address) {
    throw new AppError('地址不存在', 404)
  }

  // 將其他地址設為非默認，將選定地址設為默認
  user.addresses.forEach((addr) => {
    addr.isDefault = addr._id.toString() === addressId
  })

  await user.save()

  // 移除敏感資訊後返回
  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.resetPasswordToken
  delete userResponse.resetPasswordExpire

  return userResponse
}

/**
 * 獲取所有用戶（管理員接口）
 * @param {Object} options - 查詢選項
 * @param {String} options.search - 搜尋關鍵字（姓名、電子郵件或電話）
 * @param {Boolean} options.activeOnly - 是否只顯示啟用的用戶
 * @param {Number} options.page - 頁碼
 * @param {Number} options.limit - 每頁數量
 * @returns {Promise<Object>} 用戶列表與分頁資訊
 */
export const getAllUsers = async (options = {}) => {
  const { brandId, search, activeOnly = false, page = 1, limit = 20 } = options

  // 構建查詢條件
  const queryConditions = {}

  if (brandId) {
    queryConditions.brand = brandId
  } else {
    throw new AppError('缺少品牌ID', 400)
  }

  if (search) {
    queryConditions.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ]
  }

  if (activeOnly) {
    queryConditions.isActive = true
  }

  // 計算分頁
  const skip = (page - 1) * limit

  // 查詢總數
  const total = await User.countDocuments(queryConditions)

  // 查詢用戶
  const users = await User.find(queryConditions)
    .select('-password -resetPasswordToken -resetPasswordExpire')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    users,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage,
    },
  }
}

/**
 * 根據ID獲取用戶（管理員接口）
 * @param {String} userId - 用戶ID
 * @returns {Promise<Object>} 用戶資料
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId).select(
    '-password -resetPasswordToken -resetPasswordExpire',
  )

  if (!user) {
    throw new AppError('用戶不存在', 404)
  }

  return user
}

/**
 * 切換用戶啟用狀態（管理員接口）
 * @param {String} userId - 用戶ID
 * @param {Boolean} isActive - 啟用狀態
 * @returns {Promise<Object>} 更新後的用戶資料
 */
export const toggleUserStatus = async (userId, isActive) => {
  // 檢查用戶是否存在
  const user = await User.findById(userId)

  if (!user) {
    throw new AppError('用戶不存在', 404)
  }

  // 更新啟用狀態
  user.isActive = isActive
  await user.save()

  // 移除敏感資訊後返回
  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.resetPasswordToken
  delete userResponse.resetPasswordExpire

  return userResponse
}

/**
 * 獲取指定日期範圍內新加入的用戶
 * @param {Object} options - 查詢選項
 * @param {String} options.brandId - 品牌ID
 * @param {Date|String} options.startDate - 開始日期
 * @param {Date|String} options.endDate - 結束日期
 * @param {Number} options.page - 頁碼
 * @param {Number} options.limit - 每頁數量
 * @returns {Promise<Object>} 用戶列表與分頁資訊
 */
export const getNewUsersInRange = async (options = {}) => {
  const { brandId, startDate, endDate, page = 1, limit = 20 } = options

  // 使用日期工具處理開始和結束時間
  const start = getStartOfDay(startDate)
  const end = getEndOfDay(endDate)

  // 構建查詢條件
  const queryConditions = {
    brand: brandId,
    createdAt: {
      $gte: start.toJSDate(),
      $lte: end.toJSDate(),
    },
  }

  // 計算分頁
  const skip = (page - 1) * limit

  // 查詢總數
  const total = await User.countDocuments(queryConditions)

  // 查詢用戶
  const users = await User.find(queryConditions)
    .select('-password -resetPasswordToken -resetPasswordExpire')
    .sort({ createdAt: -1 }) // 按創建時間降序排列
    .skip(skip)
    .limit(limit)

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    users,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage,
    },
    dateRange: {
      startDate: start.toFormat('yyyy-MM-dd'),
      endDate: end.toFormat('yyyy-MM-dd'),
      startDateTime: start.toISO(),
      endDateTime: end.toISO(),
    },
  }
}
