/**
 * 訂單管理員控制器
 * server/controllers/Order/orderAdmin.js
 */

import * as orderService from '../../services/order/orderAdmin.js'
import { asyncHandler } from '../../middlewares/error.js'

// 獲取店鋪訂單列表（後台）
export const getStoreOrders = asyncHandler(async (req, res) => {
  const { storeId } = req.params

  const options = {
    status: req.query.status,
    orderType: req.query.orderType,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
  }

  const result = await orderService.getStoreOrders(storeId, options)

  res.json({
    success: true,
    orders: result.orders,
    pagination: result.pagination,
  })
})

// 🆕 獲取特定用戶的訂單列表（管理員功能）
export const getUserOrders = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { brandId } = req.params

  const options = {
    brandId,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
    sortBy: req.query.sortBy || 'createdAt',
    sortOrder: req.query.sortOrder || 'desc',
  }

  const result = await orderService.getUserOrders(userId, options)

  res.json({
    success: true,
    orders: result.orders,
    pagination: result.pagination,
  })
})

// 獲取訂單詳情（後台）
export const getOrderById = asyncHandler(async (req, res) => {
  const { storeId, orderId } = req.params

  const order = await orderService.getOrderById(orderId, storeId)

  res.json({
    success: true,
    order,
  })
})

// 更新訂單（統一接口）- 支援混合購買
export const updateOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params
  const updateData = req.body
  const adminId = req.auth.id

  const result = await orderService.updateOrder(orderId, updateData, adminId)

  res.json({
    success: true,
    message: '訂單更新成功',
    order: result,
    // 混合購買相關資訊（當狀態變為 paid 時）
    pointsAwarded: result.pointsAwarded || 0,
    generatedCoupons: result.generatedCoupons || [],
  })
})

// 取消訂單（後台）
export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params
  const { reason } = req.body
  const adminId = req.auth.id

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: '缺少取消原因',
    })
  }

  const cancelledOrder = await orderService.cancelOrder(orderId, reason, adminId)

  res.json({
    success: true,
    message: '訂單取消成功',
    order: cancelledOrder,
  })
})
