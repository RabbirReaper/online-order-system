/**
 * 訂單查詢服務
 * 處理所有訂單查詢相關的邏輯
 */

import Order from '../../models/Order/Order.js'
import { AppError } from '../../middlewares/error.js'
import { parseDateString, getStartOfDay, getEndOfDay } from '../../utils/date.js'

/**
 * 獲取用戶訂單列表
 * @param {String} userId - 用戶ID
 * @param {Object} options - 查詢選項
 * @param {String} options.brandId - 品牌ID（可選）
 * @param {Number} options.page - 頁碼（預設1）
 * @param {Number} options.limit - 每頁數量（預設10）
 * @param {String} options.sortBy - 排序欄位（預設createdAt）
 * @param {String} options.sortOrder - 排序方向（預設desc）
 */
export const getUserOrders = async (userId, options = {}) => {
  const { brandId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options

  const query = {
    user: userId,
    isFinalized: true, // 預設只查詢已完成（非等待付款）的訂單
  }
  if (brandId) query.brand = brandId

  const skip = (page - 1) * limit
  const sort = {}
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1

  const total = await Order.countDocuments(query)

  const orders = await Order.find(query)
    .populate('store', 'name address')
    .populate('brand', 'name')
    .populate('items.dishInstance', 'name finalPrice options')
    .populate('items.bundleInstance', 'name finalPrice')
    .sort(sort)
    .skip(skip)
    .limit(limit)

  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    orders,
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
 * 根據ID獲取用戶訂單詳情
 * @param {String} orderId - 訂單ID
 * @param {String} brandId - 品牌ID（可選，用於權限控制）
 */
export const getUserOrderById = async (orderId, brandId) => {
  const query = {
    _id: orderId,
    isFinalized: true, // 預設只查詢已完成（非等待付款）的訂單
  }
  if (brandId) {
    query.brand = brandId
  }

  const order = await Order.findOne(query)
    .populate('items.dishInstance', 'name options')
    .populate({
      path: 'items.bundleInstance',
      select: 'name templateId',
      populate: {
        path: 'templateId',
        select: 'bundleItems',
        populate: {
          path: 'bundleItems.voucherTemplate',
          select: 'name exchangeDishTemplate',
          populate: {
            path: 'exchangeDishTemplate',
            select: 'name basePrice',
          },
        },
      },
    })

  return order
}

/**
 * 獲取店鋪訂單列表（管理員功能）
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 查詢選項
 */
export const getStoreOrders = async (storeId, options = {}) => {
  const { status, orderType, fromDate, toDate, page = 1, limit = 20 } = options

  const query = {
    store: storeId,
    isFinalized: true, // 預設只查詢已完成（非等待付款）的訂單
  }

  if (status) {
    query.status = status
  }

  if (orderType) {
    query.orderType = orderType
  }

  // 處理日期範圍
  if (fromDate || toDate) {
    query.createdAt = {}

    if (fromDate) {
      try {
        const startDateTime = getStartOfDay(parseDateString(fromDate))
        query.createdAt.$gte = startDateTime.toJSDate()
      } catch (error) {
        console.error('解析開始日期失敗:', error)
        throw new AppError('無效的開始日期格式', 400)
      }
    }

    if (toDate) {
      try {
        const endDateTime = getEndOfDay(parseDateString(toDate))
        query.createdAt.$lte = endDateTime.toJSDate()
      } catch (error) {
        console.error('解析結束日期失敗:', error)
        throw new AppError('無效的結束日期格式', 400)
      }
    }
  }

  const skip = (page - 1) * limit
  const total = await Order.countDocuments(query)

  // 查詢訂單，包含 Bundle 資訊
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('items.dishInstance', 'name finalPrice options')
    .populate('items.bundleInstance', 'name finalPrice')
    .populate('user', 'name email phone')
    .lean()

  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    orders,
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
 * 獲取訂單詳情（管理員功能）
 * @param {String} orderId - 訂單ID
 * @param {String} storeId - 店鋪ID（可選，用於權限控制）
 */
export const getOrderById = async (orderId, storeId) => {
  const query = {
    _id: orderId,
    isFinalized: true, // 預設只查詢已完成（非等待付款）的訂單
  }
  if (storeId) query.store = storeId

  const order = await Order.findOne(query)
    .populate('items.dishInstance', 'name finalPrice options')
    .populate({
      path: 'items.bundleInstance',
      select: 'name finalPrice templateId',
      populate: {
        path: 'templateId',
        select: 'bundleItems',
        populate: {
          path: 'bundleItems.voucherTemplate',
          select: 'name exchangeDishTemplate',
          populate: {
            path: 'exchangeDishTemplate',
            select: 'name basePrice',
          },
        },
      },
    })
    .populate('user', 'name email phone')
    .lean()

  if (!order) {
    throw new AppError('訂單不存在', 404)
  }

  return order
}

/**
 * 根據多個條件查詢訂單（通用查詢函數）
 * @param {Object} filters - 過濾條件
 * @param {Object} options - 查詢選項
 */
export const queryOrders = async (filters = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    populateUser = false,
    populateStore = false,
    populateBrand = false,
  } = options

  const query = {
    ...filters,
    isFinalized: filters.isFinalized !== undefined ? filters.isFinalized : true, // 預設只查詢已完成的訂單，除非明確指定
  }
  const skip = (page - 1) * limit
  const sort = {}
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1

  let orderQuery = Order.find(query)
    .populate('items.dishInstance', 'name finalPrice options')
    .populate('items.bundleInstance', 'name finalPrice')
    .sort(sort)
    .skip(skip)
    .limit(limit)

  // 條件性 populate
  if (populateUser) {
    orderQuery = orderQuery.populate('user', 'name email phone')
  }
  if (populateStore) {
    orderQuery = orderQuery.populate('store', 'name address')
  }
  if (populateBrand) {
    orderQuery = orderQuery.populate('brand', 'name')
  }

  const total = await Order.countDocuments(query)
  const orders = await orderQuery

  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    orders,
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
