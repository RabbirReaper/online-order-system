/**
 * 外送平台訂單同步服務
 * 處理各平台的 webhook 事件和訂單同步
 */

import Order from '../../../models/Order/Order.js'
import PlatformStore from '../../../models/DeliverPlatform/platformStore.js'
import * as ubereatsOrders from '../platforms/ubereats/ubereatsOrders.js'
import * as foodpandaOrders from '../platforms/foodpanda/foodpandaOrders.js'
import { AppError } from '../../../middlewares/error.js'
import { generateOrderNumber } from '../../order/orderUtils.js'

/**
 * 處理 Uber Eats webhook 事件
 * @param {Object} webhookData - webhook 資料
 */
export const processUberEatsWebhook = async (webhookData) => {
  const { event_type, resource_href, meta } = webhookData

  try {
    switch (event_type) {
      case 'orders.notification':
        console.log('🍔 處理新訂單通知')
        await handleUberEatsOrderNotification(resource_href, meta)
        break

      default:
        console.log(`⚠️ 未處理的 Uber Eats 事件類型: ${event_type}`)
    }
  } catch (error) {
    console.error('❌ 處理 Uber Eats webhook 失敗:', error)
    throw error
  }
}

/**
 * 處理 Foodpanda webhook 事件
 * @param {Object} webhookData - webhook 資料
 */
export const processFoodpandaWebhook = async (webhookData) => {
  const { event_type, order_id, vendor_code } = webhookData

  try {
    switch (event_type) {
      case 'order.created':
        console.log('🐼 處理新訂單創建')
        await handleFoodpandaOrderCreated(order_id, vendor_code)
        break

      case 'order.updated':
        console.log('🐼 處理訂單更新')
        await handleFoodpandaOrderUpdated(order_id, vendor_code)
        break

      default:
        console.log(`⚠️ 未處理的 Foodpanda 事件類型: ${event_type}`)
    }
  } catch (error) {
    console.error('❌ 處理 Foodpanda webhook 失敗:', error)
    throw error
  }
}

/**
 * 處理 Uber Eats 訂單通知 (最重要的事件)
 * @param {String} resourceHref - 訂單資源連結
 * @param {Object} meta - webhook meta 資料
 */
const handleUberEatsOrderNotification = async (resourceHref, meta) => {
  try {
    // 1. 從 resource_href 獲取完整訂單資料
    const orderDetails = await ubereatsOrders.getOrderDetails(resourceHref)
    console.log('📋 獲取到訂單詳情:', {
      orderId: orderDetails.id,
      displayId: orderDetails.display_id,
      state: orderDetails.state,
      storeId: orderDetails.store?.id,
    })

    // 2. 查找對應的平台店鋪配置
    const platformStore = await findPlatformStoreByUberStoreId(orderDetails.store?.id)
    if (!platformStore) {
      console.error('❌ 找不到對應的平台店鋪配置:', orderDetails.store?.id)
      return
    }

    // 3. 檢查訂單是否已存在
    const existingOrder = await Order.findOne({
      'platformInfo.platformOrderId': orderDetails.id,
      'platformInfo.platform': 'ubereats',
    })

    if (existingOrder) {
      console.log('⚠️ 訂單已存在，跳過處理:', orderDetails.id)
      return
    }

    // 4. 轉換訂單格式並保存到資料庫
    const internalOrder = await convertUberOrderToInternal(orderDetails, platformStore)
    const savedOrder = await saveOrderToDatabase(internalOrder)

    console.log('✅ 外送訂單已保存至資料庫:', {
      internalOrderId: savedOrder._id,
      platformOrderId: orderDetails.id,
      displayId: orderDetails.display_id,
    })

    // 5. 自動接受訂單 (重要：必須在 11.5 分鐘內)
    await ubereatsOrders.acceptOrder(orderDetails.id)
    console.log('✅ 已自動接受 Uber Eats 訂單:', orderDetails.id)

    // 6. 更新訂單的平台同步狀態
    await updateOrderSyncStatus(savedOrder._id, 'accepted')
  } catch (error) {
    console.error('❌ 處理 Uber Eats 訂單通知失敗:', error)
    // TODO: 考慮拒絕訂單或記錄錯誤到資料庫
    throw error
  }
}

/**
 * 處理 Foodpanda 訂單創建
 * @param {String} orderId - 訂單ID
 * @param {String} vendorCode - 店鋪代碼
 */
const handleFoodpandaOrderCreated = async (orderId, vendorCode) => {
  try {
    // TODO: 實作 Foodpanda 訂單處理
    console.log('🐼 Foodpanda 訂單處理待實作:', { orderId, vendorCode })
  } catch (error) {
    console.error('❌ 處理 Foodpanda 訂單失敗:', error)
    throw error
  }
}

/**
 * 處理 Foodpanda 訂單更新
 * @param {String} orderId - 訂單ID
 * @param {String} vendorCode - 店鋪代碼
 */
const handleFoodpandaOrderUpdated = async (orderId, vendorCode) => {
  try {
    // TODO: 實作 Foodpanda 訂單更新處理
    console.log('🐼 Foodpanda 訂單更新處理待實作:', { orderId, vendorCode })
  } catch (error) {
    console.error('❌ 處理 Foodpanda 訂單更新失敗:', error)
    throw error
  }
}

/**
 * 根據 Uber 店鋪 ID 查找平台店鋪配置
 * @param {String} uberStoreId - Uber 店鋪 ID
 * @returns {Promise<Object|null>} 平台店鋪配置
 */
const findPlatformStoreByUberStoreId = async (uberStoreId) => {
  if (!uberStoreId) return null

  try {
    const platformStore = await PlatformStore.findOne({
      platform: 'ubereats',
      platformStoreId: uberStoreId,
      isActive: true,
    })
      .populate('brand')
      .populate('store')

    return platformStore
  } catch (error) {
    console.error('❌ 查找平台店鋪配置失敗:', error)
    return null
  }
}

/**
 * 轉換 Uber Eats 訂單格式為內部格式
 * @param {Object} uberOrder - Uber Eats 訂單資料
 * @param {Object} platformStore - 平台店鋪配置
 * @returns {Promise<Object>} 內部訂單格式
 */
const convertUberOrderToInternal = async (uberOrder, platformStore) => {
  try {
    // 生成內部訂單編號
    const orderNumber = await generateOrderNumber(platformStore.store._id)

    // 🔧 輔助函數：提取 Uber Eats 金額數值
    const extractAmount = (uberMoneyObject) => {
      if (!uberMoneyObject || typeof uberMoneyObject !== 'object') {
        return 0
      }
      // Uber Eats 金額通常以分為單位，需要轉換為元
      const amountInCents = uberMoneyObject.amount || 0
      return Math.round((amountInCents / 100) * 100) / 100 // 轉為元並保留兩位小數
    }

    // 🔧 提取各種金額
    const totalAmount = extractAmount(uberOrder.payment?.charges?.total)
    const subtotalAmount = extractAmount(uberOrder.payment?.charges?.subtotal)
    const serviceFeeAmount = extractAmount(uberOrder.payment?.charges?.service_fee)
    const deliveryFeeAmount = extractAmount(uberOrder.payment?.charges?.delivery_fee)

    console.log('💰 金額轉換結果:', {
      原始總金額: uberOrder.payment?.charges?.total,
      轉換後總金額: totalAmount,
      小計: subtotalAmount,
      服務費: serviceFeeAmount,
      配送費: deliveryFeeAmount,
    })

    const internalOrder = {
      // 基本資訊
      store: platformStore.store._id,
      brand: platformStore.brand._id,
      orderDateCode: orderNumber.orderDateCode,
      sequence: orderNumber.sequence,

      // 外送平台資訊
      deliveryPlatform: 'ubereats',
      platformOrderId: uberOrder.id,
      platformInfo: {
        platform: 'ubereats',
        platformOrderId: uberOrder.id,
        platformStatus: uberOrder.state,
        platformCustomerInfo: {
          customerId: uberOrder.eater?.uuid,
          customerName: uberOrder.eater?.first_name,
          customerPhone: uberOrder.eater?.phone_number,
        },
        rawOrderData: uberOrder,
        lastSyncAt: new Date(),
      },

      // 訂單類型和狀態
      orderType: 'delivery',
      status: 'paid', // 外送平台訂單預設為已付款

      // 客戶資訊
      customerInfo: {
        name: uberOrder.eater?.first_name || 'Uber Eats 顧客',
        phone: uberOrder.eater?.phone_number || '',
      },

      // 配送資訊
      deliveryInfo: {
        address: formatUberDeliveryAddress(uberOrder.delivery?.location),
        estimatedTime: uberOrder.estimated_ready_for_pickup_at
          ? new Date(uberOrder.estimated_ready_for_pickup_at)
          : null,
        deliveryFee: deliveryFeeAmount,
        platformDeliveryInfo: {
          trackingUrl: uberOrder.tracking_url,
          estimatedArrival: uberOrder.delivery?.estimated_delivery_time
            ? new Date(uberOrder.delivery.estimated_delivery_time)
            : null,
        },
      },

      // 🔧 修復後的金額資訊
      items: [], // TODO: 轉換訂單項目
      subtotal: subtotalAmount,
      dishSubtotal: subtotalAmount, // 目前先設為相同，待完善項目轉換後調整
      bundleSubtotal: 0,
      serviceCharge: serviceFeeAmount,
      discounts: [],
      manualAdjustment: 0,
      totalDiscount: 0,
      total: totalAmount,

      // 付款資訊
      paymentType: 'Online',
      paymentMethod: 'other', // Uber Eats 處理付款

      // 備註
      notes: uberOrder.special_instructions || '',
    }

    console.log('🔄 Uber Eats 訂單轉換完成:', {
      platformOrderId: uberOrder.id,
      internalOrderNumber: `${orderNumber.orderDateCode}${orderNumber.sequence.toString().padStart(3, '0')}`,
      total: internalOrder.total,
      subtotal: internalOrder.subtotal,
      serviceCharge: internalOrder.serviceCharge,
    })

    return internalOrder
  } catch (error) {
    console.error('❌ 轉換 Uber Eats 訂單格式失敗:', error)
    throw new AppError('訂單格式轉換失敗', 500)
  }
}

/**
 * 格式化 Uber Eats 配送地址
 * @param {Object} location - Uber Eats 位置資訊
 * @returns {String} 格式化的地址
 */
const formatUberDeliveryAddress = (location) => {
  if (!location) return ''

  const addressParts = [
    location.street_address_1,
    location.street_address_2,
    location.city,
    location.state,
    location.country,
  ].filter(Boolean)

  return addressParts.join(', ')
}

/**
 * 保存訂單到資料庫
 * @param {Object} orderData - 訂單資料
 * @returns {Promise<Object>} 保存的訂單
 */
const saveOrderToDatabase = async (orderData) => {
  try {
    const newOrder = new Order(orderData)
    const savedOrder = await newOrder.save()

    console.log('💾 訂單已保存至資料庫:', savedOrder._id)
    return savedOrder
  } catch (error) {
    console.error('❌ 保存訂單到資料庫失敗:', error)
    throw new AppError('保存訂單失敗', 500)
  }
}

/**
 * 更新訂單同步狀態
 * @param {String} orderId - 內部訂單ID
 * @param {String} status - 同步狀態
 */
const updateOrderSyncStatus = async (orderId, status) => {
  try {
    await Order.findByIdAndUpdate(orderId, {
      'platformInfo.lastSyncAt': new Date(),
      'platformInfo.syncStatus': status,
    })

    console.log('🔄 訂單同步狀態已更新:', { orderId, status })
  } catch (error) {
    console.error('❌ 更新訂單同步狀態失敗:', error)
    // 不拋出錯誤，避免影響主流程
  }
}

/**
 * 獲取外送平台訂單列表
 * @param {String} brandId - 品牌ID
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 訂單列表和分頁資訊
 */
export const getDeliveryOrders = async (brandId, storeId, options = {}) => {
  const { platform, status, startDate, endDate, page = 1, limit = 20 } = options

  // 構建查詢條件
  const queryConditions = {
    brand: brandId,
    store: storeId,
    deliveryPlatform: { $ne: '' }, // 只查詢外送訂單
  }

  if (platform) {
    queryConditions['platformInfo.platform'] = platform
  }

  if (status) {
    queryConditions.status = status
  }

  if (startDate || endDate) {
    queryConditions.createdAt = {}
    if (startDate) {
      queryConditions.createdAt.$gte = new Date(startDate)
    }
    if (endDate) {
      queryConditions.createdAt.$lte = new Date(endDate)
    }
  }

  // 計算分頁
  const skip = (page - 1) * limit

  try {
    const total = await Order.countDocuments(queryConditions)
    const orders = await Order.find(queryConditions)
      .populate('store', 'name address')
      .populate('brand', 'name')
      .sort({ createdAt: -1 })
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
  } catch (error) {
    console.error('❌ 獲取外送訂單列表失敗:', error)
    throw new AppError('獲取外送訂單列表失敗', 500)
  }
}

/**
 * 手動同步特定平台訂單
 * @param {String} brandId - 品牌ID
 * @param {String} storeId - 店鋪ID
 * @param {String} platform - 平台名稱
 * @param {Object} options - 同步選項
 * @returns {Promise<Object>} 同步結果
 */
export const syncOrdersFromPlatform = async (brandId, storeId, platform, options = {}) => {
  try {
    console.log('🔄 開始手動同步訂單:', { brandId, storeId, platform })

    // 查找平台店鋪配置
    const platformStore = await PlatformStore.findOne({
      brand: brandId,
      store: storeId,
      platform: platform,
      isActive: true,
    })

    if (!platformStore) {
      throw new AppError(`找不到 ${platform} 平台配置`, 404)
    }

    // TODO: 根據不同平台實作同步邏輯
    let syncResult = { synced: 0, errors: [] }

    switch (platform) {
      case 'ubereats':
        syncResult = await syncUberEatsOrders(platformStore, options)
        break
      case 'foodpanda':
        syncResult = await syncFoodpandaOrders(platformStore, options)
        break
      default:
        throw new AppError(`不支援的平台: ${platform}`, 400)
    }

    console.log('✅ 訂單同步完成:', syncResult)
    return syncResult
  } catch (error) {
    console.error('❌ 手動同步訂單失敗:', error)
    throw error
  }
}

/**
 * 同步 Uber Eats 訂單 (TODO: 實作詳細邏輯)
 * @param {Object} platformStore - 平台店鋪配置
 * @param {Object} options - 同步選項
 * @returns {Promise<Object>} 同步結果
 */
const syncUberEatsOrders = async (platformStore, options) => {
  // TODO: 實作 Uber Eats 訂單批量同步
  console.log('🍔 Uber Eats 訂單同步待實作')
  return { synced: 0, errors: ['功能開發中'] }
}

/**
 * 同步 Foodpanda 訂單 (TODO: 實作詳細邏輯)
 * @param {Object} platformStore - 平台店鋪配置
 * @param {Object} options - 同步選項
 * @returns {Promise<Object>} 同步結果
 */
const syncFoodpandaOrders = async (platformStore, options) => {
  // TODO: 實作 Foodpanda 訂單批量同步
  console.log('🐼 Foodpanda 訂單同步待實作')
  return { synced: 0, errors: ['功能開發中'] }
}
