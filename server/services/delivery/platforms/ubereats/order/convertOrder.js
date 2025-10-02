/**
 * Uber Eats 訂單轉換服務 - 修正版
 * 處理 Uber Eats 訂單格式轉換為內部格式
 */

import DishTemplate from '../../../../../models/Dish/DishTemplate.js'
import Option from '../../../../../models/Dish/Option.js'
import DishInstance from '../../../../../models/Dish/DishInstance.js'
import { generateOrderNumber } from '../../../../order/orderUtils.js'
import { AppError } from '../../../../../middlewares/error.js'

/**
 * 轉換 Uber Eats 訂單格式為內部格式
 */
export const convertUberOrderToInternal = async (uberOrder, platformStore) => {
  try {
    // 生成內部訂單編號
    const orderNumber = await generateOrderNumber(platformStore.store._id)

    // 🔧 輔助函數：提取 Uber Eats 金額數值（amount_e5 需要除以 100000）
    const extractAmount = (moneyObject) => {
      if (!moneyObject || typeof moneyObject !== 'object') {
        return 0
      }
      // Uber Eats 使用 amount_e5 格式（例如：750000 = $7.50）
      const amountE5 = moneyObject.gross?.amount_e5 || moneyObject.amount_e5 || 0
      return Math.round((amountE5 / 100000) * 100) / 100
    }

    // 🔧 建立 cart_item_id 到價格的映射
    const priceMap = buildPriceMap(uberOrder.payment?.payment_detail?.item_charges?.price_breakdown || [])

    // 🔧 提取各種金額
    const totalAmount = extractAmount(uberOrder.payment?.payment_detail?.order_total)
    const subtotalAmount = extractAmount(uberOrder.payment?.payment_detail?.item_charges?.total)
    const totalFeeAmount = extractAmount(uberOrder.payment?.payment_detail?.fees?.total)

    console.log('💰 金額轉換結果:', {
      總金額: totalAmount,
      商品小計: subtotalAmount,
      總手續費: totalFeeAmount,
    })

    // 🍽️ 轉換訂單項目（使用正確的路徑：carts[0].items）
    const cartItems = uberOrder.carts?.[0]?.items || []
    const { processedItems, itemSubtotal } = await processUberOrderItems(
      cartItems,
      priceMap,
      platformStore.brand._id,
    )

    const internalOrder = {
      // 基本資訊
      store: platformStore.store._id,
      brand: platformStore.brand._id,
      orderDateCode: orderNumber.orderDateCode,
      sequence: orderNumber.sequence,

      // 外送平台資訊
      deliveryPlatform: 'ubereats',
      platformOrderId: uberOrder.display_id,
      platformInfo: {
        platform: 'ubereats',
        platformOrderId: uberOrder.id,
        platformStatus: uberOrder.state,
        platformCustomerInfo: {
          customerId: uberOrder.customers?.[0]?.id,
          customerName: uberOrder.customers?.[0]?.name?.display_name,
          customerPhone: uberOrder.customers?.[0]?.contact?.phone?.number,
        },
        rawOrderData: {},
        lastSyncAt: new Date(),
      },

      // 訂單類型和狀態
      orderType: uberOrder.fulfillment_type === 'DELIVERY_BY_UBER' ? 'delivery' : 'takeout',
      status: 'paid',

      // 客戶資訊
      customerInfo: {
        name: uberOrder.customers?.[0]?.name?.display_name || 'Uber Eats 顧客',
        phone: uberOrder.customers?.[0]?.contact?.phone?.number || '',
      },

      // 配送資訊
      deliveryInfo: {
        address: formatUberDeliveryAddress(uberOrder.deliveries?.[0]?.location),
        estimatedTime: uberOrder.preparation_time?.ready_for_pickup_time
          ? new Date(uberOrder.preparation_time.ready_for_pickup_time)
          : null,
        deliveryFee: 0,
        platformDeliveryInfo: {
          courierName: uberOrder.deliveries?.[0]?.delivery_partner?.name?.display_name,
          courierPhone: uberOrder.deliveries?.[0]?.delivery_partner?.contact?.phone?.number,
          trackingUrl: uberOrder.order_tracking_metadata?.url,
          estimatedArrival: uberOrder.deliveries?.[0]?.estimated_dropoff_time
            ? new Date(uberOrder.deliveries[0].estimated_dropoff_time)
            : null,
        },
      },

      // 訂單項目與金額資訊
      items: processedItems,
      subtotal: itemSubtotal,
      dishSubtotal: itemSubtotal,
      bundleSubtotal: 0,
      serviceCharge: totalFeeAmount,
      discounts: [],
      manualAdjustment: 0,
      totalDiscount: 0,
      total: totalAmount,

      // 付款資訊
      paymentType: 'Online',
      paymentMethod: 'other',

      // 備註
      notes: uberOrder.carts?.[0]?.special_instructions || uberOrder.store_instructions || '',
    }

    console.log('🔄 Uber Eats 訂單轉換完成:', {
      platformOrderId: uberOrder.id,
      internalOrderNumber: `${orderNumber.orderDateCode}${orderNumber.sequence.toString().padStart(3, '0')}`,
      itemsCount: processedItems.length,
      total: internalOrder.total,
      subtotal: internalOrder.subtotal,
    })

    return internalOrder
  } catch (error) {
    console.error('❌ 轉換 Uber Eats 訂單格式失敗:', error)
    throw new AppError('訂單格式轉換失敗', 500)
  }
}

/**
 * 🆕 建立價格映射表（cart_item_id -> 價格資訊）
 */
const buildPriceMap = (priceBreakdown) => {
  const priceMap = new Map()

  priceBreakdown.forEach((item) => {
    if (item.cart_item_id) {
      // 提取數量（使用 quantity.amount）
      const quantity = item.quantity?.amount || 1

      // 提取單價（amount_e5 格式）
      const unitPriceE5 = item.unit?.gross?.amount_e5 || 0
      const unitPrice = Math.round((unitPriceE5 / 100000) * 100) / 100

      // 提取總價
      const totalPriceE5 = item.total?.gross?.amount_e5 || 0
      const totalPrice = Math.round((totalPriceE5 / 100000) * 100) / 100

      priceMap.set(item.cart_item_id, {
        quantity,
        unitPrice,
        totalPrice,
      })
    }
  })

  return priceMap
}

/**
 * 處理 Uber Eats 訂單項目（使用價格映射表）
 */
const processUberOrderItems = async (uberItems, priceMap, brandId) => {
  const processedItems = []
  let itemSubtotal = 0

  console.log(`🍽️ 開始處理 ${uberItems.length} 個 Uber Eats 訂單項目`)

  for (const uberItem of uberItems) {
    try {
      const cartItemId = uberItem.cart_item_id
      const itemName = uberItem.title || '未知餐點'

      // 🔥 從價格映射表獲取準確的價格和數量
      const priceInfo = priceMap.get(cartItemId) || {
        quantity: uberItem.quantity?.amount || 1,
        unitPrice: 0,
        totalPrice: 0,
      }

      console.log(`處理項目: ${itemName}`, {
        cartItemId,
        數量: priceInfo.quantity,
        單價: priceInfo.unitPrice,
        小計: priceInfo.totalPrice,
      })

      // 🔍 嘗試匹配 DishTemplate
      const matchedTemplate = await findMatchingDishTemplate(uberItem.id, brandId)

      // 🔍 處理選項組合
      const processedOptions = await processModifierGroups(
        uberItem.selected_modifier_groups || [],
        brandId,
      )

      // 📋 創建 DishInstance
      const dishInstanceData = {
        brand: brandId,
        templateId: matchedTemplate?._id || null,
        name: itemName,
        basePrice: matchedTemplate?.basePrice || priceInfo.unitPrice,
        options: processedOptions,
        finalPrice: priceInfo.unitPrice, // ✅ 使用正確的單價
      }

      const dishInstance = new DishInstance(dishInstanceData)
      await dishInstance.save()

      // 📦 添加到訂單項目
      const orderItem = {
        itemType: 'dish',
        itemName: itemName,
        dishInstance: dishInstance._id,
        quantity: priceInfo.quantity, // ✅ 使用正確的數量
        subtotal: priceInfo.totalPrice, // ✅ 使用正確的總價
        note: uberItem.customer_request?.special_instructions || '',
        platformItemId: uberItem.id,
      }

      processedItems.push(orderItem)
      itemSubtotal += orderItem.subtotal

      console.log(
        `✅ 項目處理完成: ${itemName}${matchedTemplate ? ' (已匹配模板)' : ' (無匹配模板)'}`,
      )
    } catch (error) {
      console.error(`❌ 處理項目失敗: ${uberItem.title}`, error)
      // 繼續處理其他項目
    }
  }

  console.log(`🎯 項目處理總結: 共 ${processedItems.length} 個項目，小計 $${itemSubtotal}`)

  return { processedItems, itemSubtotal }
}

/**
 * 尋找匹配的餐點模板
 */
const findMatchingDishTemplate = async (uberItemId, brandId) => {
  if (!uberItemId || !isValidMongoId(uberItemId)) {
    return null
  }

  try {
    const template = await DishTemplate.findOne({
      _id: uberItemId,
      brand: brandId,
    })

    if (template) {
      console.log(`✅ 找到匹配的餐點模板: ${template.name}`)
    }
    return template
  } catch (error) {
    console.error(`❌ 查找餐點模板時發生錯誤:`, error)
    return null
  }
}

/**
 * 處理 Uber Eats 選項組合
 */
const processModifierGroups = async (modifierGroups, brandId) => {
  const processedOptions = []

  for (const group of modifierGroups) {
    try {
      const groupName = group.title || '未知選項組'
      const selections = []

      for (const selectedItem of group.selected_items || []) {
        const optionName = selectedItem.title || '未知選項'

        // 🔍 嘗試匹配選項ID
        const matchedOption = await findMatchingOption(selectedItem.id, brandId)

        // 從 price_info 獲取價格（如果有的話）
        const optionPriceE5 = selectedItem.price_info?.price || 0
        const optionPrice = Math.round((optionPriceE5 / 100000) * 100) / 100

        const selection = {
          optionId: matchedOption?._id || null,
          name: optionName,
          price: matchedOption?.price !== undefined ? matchedOption.price : optionPrice,
        }

        selections.push(selection)
      }

      if (selections.length > 0) {
        processedOptions.push({
          optionCategoryId: null,
          optionCategoryName: groupName,
          selections: selections,
        })
      }
    } catch (error) {
      console.error(`❌ 處理選項組合失敗: ${group.title}`, error)
    }
  }

  return processedOptions
}

/**
 * 尋找匹配的選項
 */
const findMatchingOption = async (uberOptionId, brandId) => {
  if (!uberOptionId || !isValidMongoId(uberOptionId)) {
    return null
  }

  try {
    const option = await Option.findOne({
      _id: uberOptionId,
      brand: brandId,
    })

    return option
  } catch (error) {
    console.error(`❌ 查找選項時發生錯誤:`, error)
    return null
  }
}

/**
 * 驗證是否為有效的 MongoDB ObjectId
 */
const isValidMongoId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

/**
 * 格式化 Uber Eats 配送地址
 */
const formatUberDeliveryAddress = (location) => {
  if (!location) return ''

  const addressParts = [
    location.street_address_line_one,
    location.street_address_line_two,
    location.city,
    location.postal_code,
    location.country,
  ].filter(Boolean)

  return addressParts.join(', ')
}
