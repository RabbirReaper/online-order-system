/**
 * 外送平台訂單同步服務
 * 處理各平台的 webhook 事件和訂單同步
 */

import Order from '../../../models/Order/Order.js'
import PlatformStore from '../../../models/DeliverPlatform/platformStore.js'
import * as ubereatsOrders from '../platforms/ubereats/order/index.js'
import * as foodpandaOrders from '../platforms/foodpanda/foodpandaOrders.js'
import { convertUberOrderToInternal } from '../platforms/ubereats/order/convertOrder.js'
import { convertFoodpandaOrderToInternal } from '../platforms/foodpanda/order/convertOrder.js'
import { validateDeliveryOrderInventory } from '../platforms/ubereats/order/orderInventoryValidation.js'
import { reduceDeliveryOrderInventory } from '../platforms/ubereats/order/orderInventoryReduction.js'
import { AppError } from '../../../middlewares/error.js'
import { printOrder } from '../../printer/printer.js'

/**
 * 處理 Uber Eats webhook 事件
 * @param {Object} webhookData - webhook 資料
 */
export const processUberEatsWebhook = async (webhookData) => {
  const { event_type, resource_href, meta } = webhookData

  try {
    switch (event_type) {
      case 'orders.notification':
        // console.log('🍔 處理新訂單通知')
        await handleUberEatsOrderNotification(resource_href, meta)
        break
      case 'orders.scheduled.notification':
        // console.log('🍔 處理預約訂單通知')
        await handleUberEatsOrderNotification(resource_href, meta)
        break

      default:
      // console.log(`⚠️ 未處理的 Uber Eats 事件類型: ${event_type}`)
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
  try {
    console.log('🐼 收到 Foodpanda webhook:', {
      orderId: webhookData.order_id,
      orderCode: webhookData.order_code,
      vendorCode: webhookData.vendor_code,
    })

    // Foodpanda webhook 直接包含完整訂單資料
    await handleFoodpandaOrderDispatch(webhookData)
  } catch (error) {
    console.error('❌ 處理 Foodpanda webhook 失敗:', error)
    throw error
  }
}

/**
 * 處理 Uber Eats 訂單通知 (最重要的事件) - 已整合庫存檢查
 * @param {String} resourceHref - 訂單資源連結
 * @param {Object} meta - webhook meta 資料
 */
const handleUberEatsOrderNotification = async (resourceHref, meta) => {
  try {
    // 1. 從 resource_href 獲取完整訂單資料
    const orderDetails = await ubereatsOrders.getOrderDetails(resourceHref)
    // console.log('📋 獲取到訂單詳情:', {
    //   orderId: orderDetails.id,
    //   displayId: orderDetails.display_id,
    //   state: orderDetails.current_state,
    //   storeId: orderDetails.store?.id,
    // })

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
      // console.log('⚠️ 訂單已存在，跳過處理:', orderDetails.id)
      return
    }

    // 4. 轉換訂單格式
    const internalOrder = await convertUberOrderToInternal(orderDetails, platformStore)

    // 🔍 4.5. 檢查庫存狀況 (新增)
    // console.log('🔍 開始檢查外送訂單庫存狀況...')
    const inventoryValidation = await validateDeliveryOrderInventory(internalOrder)

    if (!inventoryValidation.success) {
      console.warn('⚠️ 庫存檢查未通過，將不自動接受訂單:', {
        orderId: orderDetails.id,
        displayId: orderDetails.display_id,
        issues: inventoryValidation.issues,
      })

      // 記錄庫存問題到訂單備註
      const inventoryIssuesSummary = inventoryValidation.issues
        .map((issue) => `${issue.itemName}: ${issue.issue}`)
        .join('; ')

      internalOrder.notes =
        `${internalOrder.notes || ''} [庫存問題: ${inventoryIssuesSummary}]`.trim()
    }

    // 保存訂單到資料庫
    const savedOrder = await saveOrderToDatabase(internalOrder)

    // 🔽 4.6. 如果庫存檢查通過，嘗試扣除庫存 (新增)
    if (inventoryValidation.success && inventoryValidation.inventoryMap.size > 0) {
      // console.log('🔽 開始扣除外送訂單庫存...')
      const inventoryReduction = await reduceDeliveryOrderInventory(
        savedOrder,
        inventoryValidation.inventoryMap,
      )

      if (!inventoryReduction.success) {
        console.warn('⚠️ 庫存扣除時發生問題，但不影響訂單接受:', {
          processed: inventoryReduction.processed,
          errors: inventoryReduction.errors.length,
        })
      } else {
        // console.log(`✅ 成功扣除庫存: ${inventoryReduction.processed} 項`)
      }
    }

    // 5. 自動接受訂單 (只有在庫存檢查通過的情況下)
    if (inventoryValidation.success) {
      await ubereatsOrders.acceptOrder(orderDetails.id)
      // console.log('✅ 已自動接受 Uber Eats 訂單:', orderDetails.id)

      // 更新訂單狀態為已接受
      await updateOrderSyncStatus(savedOrder._id, 'accepted')

      // 6. 自動列印訂單
      try {
        await printOrder(
          platformStore.brand._id || platformStore.brand,
          platformStore.store._id || platformStore.store,
          savedOrder._id,
        )
        // console.log('🖨️ 外送訂單列印成功:', savedOrder._id)
      } catch (printError) {
        console.error('❌ 外送訂單自動列印失敗，但不影響訂單處理:', printError)
        // 列印失敗不影響訂單流程
      }
    } else {
      // console.log('⚠️ 由於庫存問題，未自動接受訂單，需手動處理:', orderDetails.id)

      // 更新訂單狀態為需手動處理
      await updateOrderSyncStatus(savedOrder._id, 'pending_manual_review')

      // TODO: 可以在這裡添加通知邏輯，提醒店家手動處理此訂單
    }

    // console.log('✅ 外送訂單處理完成:', {
    //   internalOrderId: savedOrder._id,
    //   platformOrderId: orderDetails.id,
    //   displayId: orderDetails.display_id,
    //   autoAccepted: inventoryValidation.success,
    // })
  } catch (error) {
    console.error('❌ 處理 Uber Eats 訂單通知失敗:', error)
    // TODO: 考慮拒絕訂單或記錄錯誤到資料庫
    throw error
  }
}

/**
 * 處理 Foodpanda 訂單派發 - 整合庫存檢查
 * @param {Object} orderData - Foodpanda webhook 訂單資料
 */
const handleFoodpandaOrderDispatch = async (orderData) => {
  try {
    console.log('📋 處理 Foodpanda 訂單:', {
      orderId: orderData.order_id,
      orderCode: orderData.order_code,
      vendorCode: orderData.vendor_code,
    })

    // 1. 查找對應的平台店鋪配置
    const platformStore = await findPlatformStoreByFoodpandaVendorCode(orderData.vendor_code)
    if (!platformStore) {
      console.error('❌ 找不到對應的平台店鋪配置:', orderData.vendor_code)
      // 嘗試拒絕訂單
      await foodpandaOrders.rejectOrder(
        orderData.order_id,
        orderData.vendor_code,
        'vendor_unavailable',
      )
      return
    }

    // 2. 檢查訂單是否已存在
    const existingOrder = await Order.findOne({
      'platformInfo.platformOrderId': orderData.order_id,
      'platformInfo.platform': 'foodpanda',
    })

    if (existingOrder) {
      console.log('⚠️ 訂單已存在，跳過處理:', orderData.order_id)
      return
    }

    // 3. 轉換訂單格式
    const internalOrder = await convertFoodpandaOrderToInternal(orderData, platformStore)

    // 4. 檢查庫存狀況
    console.log('🔍 開始檢查外送訂單庫存狀況...')
    const inventoryValidation = await validateDeliveryOrderInventory(internalOrder)

    if (!inventoryValidation.success) {
      console.warn('⚠️ 庫存檢查未通過，將拒絕訂單:', {
        orderId: orderData.order_id,
        orderCode: orderData.order_code,
        issues: inventoryValidation.issues,
      })

      // Foodpanda 直接整合模式下，如果庫存不足應該拒絕訂單
      const rejectReason = inventoryValidation.issues.some((issue) => issue.issue === 'sold_out')
        ? 'out_of_stock'
        : 'out_of_stock'

      await foodpandaOrders.rejectOrder(orderData.order_id, orderData.vendor_code, rejectReason)

      // 仍然保存訂單記錄，但標記為已拒絕
      internalOrder.status = 'cancelled'
      internalOrder.notes = `[庫存不足，已拒絕] ${inventoryValidation.issues.map((i) => `${i.itemName}: ${i.issue}`).join('; ')}`
      await saveOrderToDatabase(internalOrder)

      return
    }

    // 5. 保存訂單到資料庫
    const savedOrder = await saveOrderToDatabase(internalOrder)

    // 6. 扣除庫存
    if (inventoryValidation.inventoryMap.size > 0) {
      console.log('🔽 開始扣除外送訂單庫存...')
      const inventoryReduction = await reduceDeliveryOrderInventory(
        savedOrder,
        inventoryValidation.inventoryMap,
      )

      if (!inventoryReduction.success) {
        console.warn('⚠️ 庫存扣除時發生問題:', {
          processed: inventoryReduction.processed,
          errors: inventoryReduction.errors.length,
        })
      }
    }

    // 7. 自動接受訂單
    const estimatedReadyTime = calculateEstimatedReadyTime(20) // 預設 20 分鐘
    await foodpandaOrders.acceptOrder(orderData.order_id, orderData.vendor_code, estimatedReadyTime)
    console.log('✅ 已自動接受 Foodpanda 訂單:', orderData.order_id)

    // 8. 更新訂單狀態
    await updateOrderSyncStatus(savedOrder._id, 'accepted')

    // 9. 自動列印訂單
    try {
      await printOrder(
        platformStore.brand._id || platformStore.brand,
        platformStore.store._id || platformStore.store,
        savedOrder._id,
      )
      console.log('🖨️ 外送訂單列印成功:', savedOrder._id)
    } catch (printError) {
      console.error('❌ 外送訂單自動列印失敗，但不影響訂單處理:', printError)
    }

    console.log('✅ Foodpanda 訂單處理完成:', {
      internalOrderId: savedOrder._id,
      platformOrderId: orderData.order_id,
      orderCode: orderData.order_code,
    })
  } catch (error) {
    console.error('❌ 處理 Foodpanda 訂單派發失敗:', error)

    // 如果處理失敗，嘗試拒絕訂單
    try {
      await foodpandaOrders.rejectOrder(orderData.order_id, orderData.vendor_code, 'system_error')
    } catch (rejectError) {
      console.error('❌ 拒絕訂單也失敗了:', rejectError)
    }

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
      // 🔧 修復：確保只查找已授權的店鋪
      // 這樣可以避免找到已解除授權但仍保留 platformStoreId 的舊記錄
      'oauth.isAuthorized': true,
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
 * 根據 Foodpanda 店鋪代碼查找平台店鋪配置
 * @param {String} vendorCode - Foodpanda vendor code
 * @returns {Promise<Object|null>} 平台店鋪配置
 */
const findPlatformStoreByFoodpandaVendorCode = async (vendorCode) => {
  if (!vendorCode) return null

  try {
    const platformStore = await PlatformStore.findOne({
      platform: 'foodpanda',
      platformStoreId: vendorCode,
      isActive: true,
    })
      .populate('brand')
      .populate('store')

    return platformStore
  } catch (error) {
    console.error('❌ 查找 Foodpanda 平台店鋪配置失敗:', error)
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

    // console.log('💾 訂單已保存至資料庫:', savedOrder._id)
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

    // console.log('🔄 訂單同步狀態已更新:', { orderId, status })
  } catch (error) {
    console.error('❌ 更新訂單同步狀態失敗:', error)
    // 不拋出錯誤，避免影響主流程
  }
}

/**
 * 計算預計完成時間
 * @param {Number} minutesFromNow - 從現在開始的分鐘數
 * @returns {String} ISO 8601 格式的時間字串
 */
const calculateEstimatedReadyTime = (minutesFromNow) => {
  const now = new Date()
  const estimatedTime = new Date(now.getTime() + minutesFromNow * 60000)
  return estimatedTime.toISOString()
}
