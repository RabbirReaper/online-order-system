/**
 * 訂單同步服務
 * 基於實際的 Order schema 處理外送平台訂單與內部訂單系統的同步
 */

import Order from '../../models/Order/Order.js'
import Store from '../../models/Store/Store.js'
import DishTemplate from '../../models/Dish/DishTemplate.js'
import DishInstance from '../../models/Dish/DishInstance.js'
import { AppError } from '../../middlewares/error.js'
import { generateOrderNumber } from '../order/orderCustomer.js'
// import * as ubereatsService from './ubereatsService.js'

// 🔧 支援的平台列表（與 schema enum 保持一致）
const SUPPORTED_PLATFORMS = ['foodpanda', 'ubereats']

/**
 * 從外送平台同步訂單到內部系統
 * @param {String} platform - 平台名稱
 * @param {Object} platformOrderData - 平台訂單資料
 * @param {String} storeId - 店鋪ID
 */
export const syncOrderFromPlatform = async (platform, platformOrderData, storeId) => {
  try {
    console.log(`🔄 Syncing ${platform} order ${platformOrderData.id} to internal system`)

    // 驗證平台是否支援
    if (!SUPPORTED_PLATFORMS.includes(platform)) {
      throw new AppError(`不支援的平台: ${platform}`, 400)
    }

    // 檢查訂單是否已經存在 - 使用新的 platformInfo 結構
    const existingOrder = await Order.findOne({
      'platformInfo.platform': platform,
      'platformInfo.platformOrderId': platformOrderData.id,
    })

    if (existingOrder) {
      console.log(`⚠️  Order ${platformOrderData.id} already exists, updating existing order`)
      return await updateExistingPlatformOrder(existingOrder, platformOrderData)
    }

    // 轉換平台訂單為內部格式
    const internalOrderData = await convertPlatformOrderToInternal(
      platform,
      platformOrderData,
      storeId,
    )

    // 創建內部訂單
    const internalOrder = new Order(internalOrderData)
    await internalOrder.save()

    console.log(
      `✅ Created internal order ${internalOrder._id} from ${platform} order ${platformOrderData.id}`,
    )

    return internalOrder
  } catch (error) {
    console.error(`❌ Failed to sync ${platform} order:`, error)
    throw error
  }
}

/**
 * 轉換平台訂單為內部訂單格式
 * @param {String} platform - 平台名稱
 * @param {Object} platformOrderData - 平台訂單資料
 * @param {String} storeId - 店鋪ID
 */
export const convertPlatformOrderToInternal = async (platform, platformOrderData, storeId) => {
  const store = await Store.findById(storeId).populate('brand')

  if (!store) {
    throw new AppError('店鋪不存在', 404)
  }

  // 生成內部訂單編號
  const { orderDateCode, sequence } = await generateOrderNumber(storeId)

  // 根據平台類型轉換訂單
  switch (platform) {
    case 'ubereats':
      return await convertUberEatsOrder(platformOrderData, store, orderDateCode, sequence)
    case 'foodpanda':
      return await convertFoodpandaOrder(platformOrderData, store, orderDateCode, sequence)
    default:
      throw new AppError(`不支援的平台: ${platform}`, 400)
  }
}

/**
 * 轉換 UberEats 訂單格式 - 符合實際 schema
 * @param {Object} ubereatsOrder - UberEats 訂單資料
 * @param {Object} store - 店鋪資料
 * @param {String} orderDateCode - 訂單日期代碼
 * @param {Number} sequence - 序號
 */
const convertUberEatsOrder = async (ubereatsOrder, store, orderDateCode, sequence) => {
  try {
    console.log('🔄 Converting UberEats order structure:', ubereatsOrder.display_id)

    // 轉換訂單項目
    const items = await convertUberEatsItems(ubereatsOrder.cart?.items || [], store.brand._id)

    // 計算金額
    const dishSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const bundleSubtotal = 0 // UberEats 訂單目前不支援 bundle
    const subtotal = dishSubtotal + bundleSubtotal

    // 服務費（UberEats 不會傳遞餐廳的服務費）
    const serviceCharge = 0

    // 總金額
    const total = subtotal + serviceCharge

    // 顧客資訊
    const customerInfo = {
      name: ubereatsOrder.eater?.first_name
        ? `${ubereatsOrder.eater.first_name} ${ubereatsOrder.eater.last_name || ''}`.trim()
        : 'UberEats Customer',
      phone: ubereatsOrder.eater?.phone || ubereatsOrder.eater?.phone_code || '',
    }

    // 配送資訊
    const deliveryInfo = {
      address: formatUberEatsAddress(ubereatsOrder.delivery_location),
      estimatedTime: ubereatsOrder.estimated_ready_for_pickup_at
        ? new Date(ubereatsOrder.estimated_ready_for_pickup_at)
        : null,
      deliveryFee: 0, // 配送費由 UberEats 處理，不影響餐廳收入
      platformDeliveryInfo: {
        trackingUrl: '',
        estimatedArrival: null,
      },
    }

    // 建立訂單資料 - 符合實際 schema
    const orderData = {
      store: store._id,
      brand: store.brand._id,
      orderDateCode,
      sequence,
      orderType: 'delivery', // UberEats 主要是外送訂單
      status: 'paid', // 外送平台訂單通常已付款

      // 🔧 舊欄位（保持兼容）
      deliveryPlatform: 'ubereats',
      platformOrderId: ubereatsOrder.display_id || ubereatsOrder.id,

      // 🔧 新的 platformInfo 結構
      platformInfo: {
        platform: 'ubereats',
        platformOrderId: ubereatsOrder.id,
        platformStatus: ubereatsOrder.current_state || 'CREATED',
        platformCustomerInfo: {
          customerId: ubereatsOrder.eater?.id || '',
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
        },
        rawOrderData: ubereatsOrder, // 保存原始資料以供調試
        lastSyncAt: new Date(),
      },

      // 訂單項目
      items,

      // 金額資訊
      dishSubtotal,
      bundleSubtotal,
      subtotal,
      serviceCharge,
      discounts: [], // UberEats 訂單折扣處理
      manualAdjustment: 0,
      totalDiscount: 0,
      total,

      // 點數相關（外送平台訂單不給點數）
      pointsEarned: 0,

      // 付款資訊
      paymentType: 'Online',
      paymentMethod: 'other', // UberEats 內部處理付款

      // 顧客資訊
      customerInfo,

      // 配送資訊
      deliveryInfo,

      // 備註
      notes: ubereatsOrder.special_instructions || '',
    }

    return orderData
  } catch (error) {
    console.error('❌ Failed to convert UberEats order:', error)
    throw new AppError('UberEats 訂單格式轉換失敗', 500)
  }
}

/**
 * 轉換 Foodpanda 訂單格式 - 預留實作
 * @param {Object} foodpandaOrder - Foodpanda 訂單資料
 * @param {Object} store - 店鋪資料
 * @param {String} orderDateCode - 訂單日期代碼
 * @param {Number} sequence - 序號
 */
const convertFoodpandaOrder = async (foodpandaOrder, store, orderDateCode, sequence) => {
  // TODO: 實作 Foodpanda 訂單轉換
  console.log('🔄 Converting Foodpanda order - TO BE IMPLEMENTED')

  // 基本結構，實際實作時需要根據 Foodpanda API 調整
  const orderData = {
    store: store._id,
    brand: store.brand._id,
    orderDateCode,
    sequence,
    orderType: 'delivery',
    status: 'paid',

    // 舊欄位兼容
    deliveryPlatform: 'foodpanda',
    platformOrderId: foodpandaOrder.id,

    // 新的 platformInfo 結構
    platformInfo: {
      platform: 'foodpanda',
      platformOrderId: foodpandaOrder.id,
      platformStatus: foodpandaOrder.status || 'NEW',
      platformCustomerInfo: {
        customerId: foodpandaOrder.customer?.id || '',
        customerName: foodpandaOrder.customer?.name || 'Foodpanda Customer',
        customerPhone: foodpandaOrder.customer?.phone || '',
      },
      rawOrderData: foodpandaOrder,
      lastSyncAt: new Date(),
    },

    // 基本資料
    items: [], // TODO: 轉換項目
    dishSubtotal: 0,
    bundleSubtotal: 0,
    subtotal: 0,
    serviceCharge: 0,
    discounts: [],
    manualAdjustment: 0,
    totalDiscount: 0,
    total: 0,
    pointsEarned: 0,
    paymentType: 'Online',
    paymentMethod: 'other',
    customerInfo: {
      name: foodpandaOrder.customer?.name || 'Foodpanda Customer',
      phone: foodpandaOrder.customer?.phone || '',
    },
    deliveryInfo: {
      address: foodpandaOrder.delivery_address || '',
      estimatedTime: null,
      deliveryFee: 0,
      platformDeliveryInfo: {
        trackingUrl: '',
        estimatedArrival: null,
      },
    },
    notes: foodpandaOrder.notes || '',
  }

  return orderData
}

/**
 * 轉換 UberEats 訂單項目
 * @param {Array} ubereatsItems - UberEats 訂單項目
 * @param {String} brandId - 品牌ID
 */
const convertUberEatsItems = async (ubereatsItems, brandId) => {
  const items = []

  for (const item of ubereatsItems) {
    try {
      console.log(`🔄 Converting UberEats item: ${item.title}`)

      // 查找對應的餐點模板
      const dishTemplate = await findDishTemplateByUberEatsItem(item)

      // 創建 DishInstance
      const dishInstance = new DishInstance({
        brand: brandId,
        templateId: dishTemplate?._id || null,
        name: item.title || 'Unknown Item',
        basePrice: item.price?.base_unit_price?.amount || item.price?.unit_price?.amount || 0,
        options: convertUberEatsCustomizations(item.customizations || []),
        finalPrice: item.price?.total_price?.amount || item.price?.unit_price?.amount || 0,
      })

      await dishInstance.save()

      // 創建訂單項目 - 符合實際 schema
      const orderItem = {
        itemType: 'dish',
        itemName: item.title || 'Unknown Item',
        quantity: item.quantity || 1,
        subtotal:
          (item.price?.total_price?.amount || item.price?.unit_price?.amount || 0) *
          (item.quantity || 1),
        note: item.special_instructions || '',
        platformItemId: item.id, // 記錄平台商品ID
        dishInstance: dishInstance._id,
      }

      items.push(orderItem)
    } catch (error) {
      console.error(`❌ Failed to convert UberEats item ${item.id}:`, error)

      // 為無法轉換的項目創建基本記錄
      const fallbackItem = {
        itemType: 'dish',
        itemName: item.title || 'Unknown Item',
        quantity: item.quantity || 1,
        subtotal: (item.price?.total_price?.amount || 0) * (item.quantity || 1),
        note: `External platform item: ${item.id}`,
        platformItemId: item.id,
        dishInstance: null, // 無法創建對應的實例
      }

      items.push(fallbackItem)
    }
  }

  return items
}

/**
 * 轉換 UberEats 客製化選項
 * @param {Array} customizations - UberEats 客製化選項
 */
const convertUberEatsCustomizations = (customizations) => {
  const options = []

  customizations.forEach((customization) => {
    if (customization.options) {
      customization.options.forEach((option) => {
        options.push({
          categoryName: customization.title || 'Customization',
          optionName: option.title || 'Option',
          price: option.price?.amount || 0,
          quantity: option.quantity || 1,
        })
      })
    }
  })

  return options
}

/**
 * 根據 UberEats 商品項目查找內部餐點模板
 * @param {Object} ubereatsItem - UberEats 商品項目
 */
const findDishTemplateByUberEatsItem = async (ubereatsItem) => {
  // 策略 1: 根據 external_data 查找（如果有設定）
  if (ubereatsItem.external_data) {
    const template = await DishTemplate.findById(ubereatsItem.external_data)
    if (template) {
      console.log(`✅ Found dish template by external_data: ${template.name}`)
      return template
    }
  }

  // 策略 2: 根據商品名稱模糊匹配
  if (ubereatsItem.title) {
    const template = await DishTemplate.findOne({
      name: { $regex: ubereatsItem.title, $options: 'i' },
    })

    if (template) {
      console.log(`✅ Found dish template by name matching: ${template.name}`)
      return template
    }
  }

  // 策略 3: 返回 null，讓調用方處理
  console.warn(`⚠️  No dish template found for UberEats item: ${ubereatsItem.title}`)
  return null
}

/**
 * 格式化 UberEats 地址
 * @param {Object} deliveryLocation - UberEats 配送地址
 */
const formatUberEatsAddress = (deliveryLocation) => {
  if (!deliveryLocation) return 'UberEats Delivery'

  const addressParts = []

  if (deliveryLocation.address_1) addressParts.push(deliveryLocation.address_1)
  if (deliveryLocation.address_2) addressParts.push(deliveryLocation.address_2)
  if (deliveryLocation.city) addressParts.push(deliveryLocation.city)
  if (deliveryLocation.state) addressParts.push(deliveryLocation.state)
  if (deliveryLocation.postal_code) addressParts.push(deliveryLocation.postal_code)

  return addressParts.length > 0 ? addressParts.join(', ') : 'UberEats Delivery'
}

/**
 * 更新現有的平台訂單
 * @param {Object} existingOrder - 現有訂單
 * @param {Object} platformOrderData - 新的平台訂單資料
 */
const updateExistingPlatformOrder = async (existingOrder, platformOrderData) => {
  console.log(`🔄 Updating existing platform order: ${existingOrder._id}`)

  // 更新平台狀態
  if (existingOrder.platformInfo) {
    existingOrder.platformInfo.platformStatus =
      platformOrderData.current_state || platformOrderData.status
    existingOrder.platformInfo.lastSyncAt = new Date()

    // 更新原始資料
    existingOrder.platformInfo.rawOrderData = platformOrderData
  }

  await existingOrder.save()

  return existingOrder
}

// 註解掉狀態更新功能，只保留接收和轉換功能
/*
export const updatePlatformOrderStatus = async (orderId, status, additionalData = {}) => {
  // 更新平台訂單狀態功能
}
*/
