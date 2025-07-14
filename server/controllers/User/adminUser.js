/**
 * 管理員用戶管理控制器
 * 處理管理員獲取和管理用戶的功能
 */

import * as userService from '../../services/user/index.js'
import { asyncHandler } from '../../middlewares/error.js'

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
 * 獲取指定日期範圍內新加入的用戶 (admin功能)
 */
export const getNewUsersInRange = asyncHandler(async (req, res) => {
  const { brandId } = req.params
  const { startDate, endDate } = req.query

  // 驗證必要參數
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: '請提供開始日期 (startDate) 和結束日期 (endDate)',
    })
  }

  const options = {
    brandId,
    startDate,
    endDate,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
  }

  const result = await userService.profile.getNewUsersInRange(options)

  res.json({
    success: true,
    message: `成功獲取 ${result.dateRange.startDate} 至 ${result.dateRange.endDate} 期間新加入的用戶`,
    users: result.users,
    pagination: result.pagination,
    dateRange: result.dateRange,
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
