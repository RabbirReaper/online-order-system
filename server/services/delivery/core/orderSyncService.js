/**
 * 外送平台訂單同步服務
 * 處理各平台的 webhook 事件和訂單同步
 */

import Order from '../../../models/Order/Order.js'
import PlatformStore from '../../../models/DeliverPlatform/platformStore.js'
import * as ubereatsOrders from '../platforms/ubereats/order/index.js'
import * as foodpandaOrders from '../platforms/foodpanda/foodpandaOrders.js'
import { convertUberOrderToInternal } from '../platforms/ubereats/order/convertOrder.js'
import { AppError } from '../../../middlewares/error.js'

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
      state: orderDetails.current_state,
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
