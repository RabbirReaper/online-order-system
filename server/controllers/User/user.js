import * as userService from '../../services/user/index.js'
import { asyncHandler } from '../../middlewares/error.js'

/**
 * 獲取用戶資料
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.auth.userId

  const profile = await userService.profile.getUserProfile(userId)

  res.json({
    success: true,
    profile,
  })
})

/**
 * 更新用戶資料
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.auth.userId // 從中間件獲取
  const updateData = req.body

  const updatedProfile = await userService.profile.updateUserProfile(userId, updateData)

  res.json({
    success: true,
    message: '個人資料更新成功',
    profile: updatedProfile,
  })
})

/**
 * 添加地址
 */
export const addAddress = asyncHandler(async (req, res) => {
  const userId = req.auth.userId
  const addressData = req.body

  const user = await userService.profile.addUserAddress(userId, addressData)

  res.json({
    success: true,
    message: '地址新增成功',
    user,
  })
})

/**
 * 更新地址
 */
export const updateAddress = asyncHandler(async (req, res) => {
  const userId = req.auth.userId
  const { addressId } = req.params
  const updateData = req.body

  const user = await userService.profile.updateUserAddress(userId, addressId, updateData)

  res.json({
    success: true,
    message: '地址更新成功',
    user,
  })
})

/**
 * 刪除地址
 */
export const deleteAddress = asyncHandler(async (req, res) => {
  const userId = req.auth.userId
  const { addressId } = req.params

  const user = await userService.profile.deleteUserAddress(userId, addressId)

  res.json({
    success: true,
    message: '地址刪除成功',
    user,
  })
})

/**
 * 獲取所有用戶 (admin功能)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { brandId } = req.params

  const options = {
    brandId,
    search: req.query.search,
    activeOnly: req.query.activeOnly === 'true',
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
  }

  const result = await userService.profile.getAllUsers(options)

  res.json({
    success: true,
    users: result.users,
    pagination: result.pagination,
  })
})

/**
 * 獲取單個用戶 (admin功能)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await userService.profile.getUserById(id)

  res.json({
    success: true,
    user,
  })
})

/**
 * 切換用戶啟用狀態 (admin功能)
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { isActive } = req.body

  if (isActive === undefined) {
    return res.status(400).json({
      success: false,
      message: '缺少參數 isActive',
    })
  }

  const user = await userService.profile.toggleUserStatus(id, isActive)

  res.json({
    success: true,
    message: `用戶已${isActive ? '啟用' : '停用'}`,
    user,
  })
})
