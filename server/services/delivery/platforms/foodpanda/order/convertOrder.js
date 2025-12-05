/**
 * Foodpanda 訂單轉換服務
 * 處理 Foodpanda 訂單格式轉換為內部格式
 */

import DishTemplate from '../../../../../models/Dish/DishTemplate.js'
import Option from '../../../../../models/Dish/Option.js'
import DishInstance from '../../../../../models/Dish/DishInstance.js'
import { generateOrderNumber } from '../../../../order/orderUtils.js'
import { AppError } from '../../../../../middlewares/error.js'

/**
 * 轉換 Foodpanda 訂單格式為內部格式
 * @param {Object} foodpandaOrder - Foodpanda 訂單資料
 * @param {Object} platformStore - 平台店鋪配置
 * @returns {Promise<Object>} 內部訂單格式
 */
export const convertFoodpandaOrderToInternal = async (foodpandaOrder, platformStore) => {
  try {
    // 生成內部訂單編號
    const orderNumber = await generateOrderNumber(platformStore.store._id)

    // 🔧 提取各種金額 - Foodpanda 金額通常已經是正確格式
    const totalAmount = parseFloat(foodpandaOrder.order_total?.total_price || 0)
    const subtotalAmount = parseFloat(foodpandaOrder.order_total?.subtotal || 0)
    const deliveryFee = parseFloat(foodpandaOrder.order_total?.delivery_fee || 0)
    const serviceFee = parseFloat(foodpandaOrder.order_total?.service_fee || 0)

    console.log('💰 金額轉換結果:', {
      總金額: totalAmount,
      小計: subtotalAmount,
      配送費: deliveryFee,
      服務費: serviceFee,
    })

    // 🍽️ 轉換訂單項目
    const { processedItems, itemSubtotal } = await processFoodpandaOrderItems(
      foodpandaOrder.products || [],
      platformStore.brand._id,
    )

    const internalOrder = {
      // 基本資訊
      store: platformStore.store._id,
      brand: platformStore.brand._id,
      orderDateCode: orderNumber.orderDateCode,
      sequence: orderNumber.sequence,

      // 外送平台資訊
      deliveryPlatform: 'foodpanda',
      platformOrderId: foodpandaOrder.order_code,
      platformInfo: {
        platform: 'foodpanda',
        platformOrderId: foodpandaOrder.order_id,
        platformStatus: foodpandaOrder.order_status,
        platformCustomerInfo: {
          customerId: foodpandaOrder.customer?.customer_id,
          customerName: foodpandaOrder.customer?.name,
          customerPhone: foodpandaOrder.customer?.phone_number,
        },
        rawOrderData: {},
        lastSyncAt: new Date(),
      },

      // 訂單類型和狀態
      orderType: foodpandaOrder.is_delivery ? 'delivery' : 'takeout',
      status: 'paid', // 外送平台訂單預設為已付款

      // 客戶資訊
      customerInfo: {
        name: foodpandaOrder.customer?.name || 'Foodpanda 顧客',
        phone: foodpandaOrder.customer?.phone_number || '',
      },

      // 配送資訊
      deliveryInfo: {
        address: formatFoodpandaDeliveryAddress(foodpandaOrder.customer?.address),
        estimatedTime: foodpandaOrder.estimated_delivery_time
          ? new Date(foodpandaOrder.estimated_delivery_time)
          : null,
        deliveryFee: deliveryFee,
        platformDeliveryInfo: {
          orderScheduledAt: foodpandaOrder.order_scheduled_at
            ? new Date(foodpandaOrder.order_scheduled_at)
            : null,
          expeditedOrder: foodpandaOrder.expedited_order || false,
        },
      },

      // 訂單項目與金額資訊
      items: processedItems,
      subtotal: itemSubtotal,
      dishSubtotal: itemSubtotal, // 目前全部視為餐點小計
      bundleSubtotal: 0,
      serviceCharge: serviceFee,
      discounts: [],
      manualAdjustment: 0,
      totalDiscount: 0,
      total: totalAmount,

      // 付款資訊
      paymentType: 'Online',
      paymentMethod: foodpandaOrder.payment_method || 'other',

      // 備註
      notes: foodpandaOrder.customer_note || '',
    }

    console.log('🔄 Foodpanda 訂單轉換完成:', {
      platformOrderId: foodpandaOrder.order_id,
      internalOrderNumber: `${orderNumber.orderDateCode}${orderNumber.sequence.toString().padStart(3, '0')}`,
      itemsCount: processedItems.length,
      total: internalOrder.total,
      subtotal: internalOrder.subtotal,
      serviceCharge: internalOrder.serviceCharge,
    })

    return internalOrder
  } catch (error) {
    console.error('❌ 轉換 Foodpanda 訂單格式失敗:', error)
    throw new AppError('訂單格式轉換失敗', 500)
  }
}

/**
 * 處理 Foodpanda 訂單項目
 * @param {Array} foodpandaProducts - Foodpanda 訂單項目
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 處理後的項目和小計
 */
const processFoodpandaOrderItems = async (foodpandaProducts, brandId) => {
  const processedItems = []
  let itemSubtotal = 0

  console.log(`🍽️ 開始處理 ${foodpandaProducts.length} 個 Foodpanda 訂單項目`)

  for (const product of foodpandaProducts) {
    try {
      // 提取基本資訊
      const itemName = product.name || '未知餐點'
      const itemQuantity = product.quantity || 1
      const itemPrice = parseFloat(product.price || 0)

      console.log(`處理項目: ${itemName} x${itemQuantity} = $${itemPrice * itemQuantity}`)

      // 🔍 嘗試匹配 DishTemplate
      const matchedTemplate = await findMatchingDishTemplate(product.id, brandId)

      // 🔍 處理選項/配料
      const processedOptions = await processToppings(product.toppings || [], brandId)

      // 📋 創建 DishInstance
      const dishInstanceData = {
        brand: brandId,
        templateId: matchedTemplate?._id || null,
        name: itemName,
        basePrice: matchedTemplate?.basePrice || itemPrice,
        options: processedOptions,
        finalPrice: itemPrice,
      }

      const dishInstance = new DishInstance(dishInstanceData)
      await dishInstance.save()

      // 📦 添加到訂單項目
      const orderItem = {
        itemType: 'dish',
        itemName: itemName,
        dishInstance: dishInstance._id,
        quantity: itemQuantity,
        subtotal: itemPrice * itemQuantity,
        note: product.instructions || '',
        platformItemId: product.id,
      }

      processedItems.push(orderItem)
      itemSubtotal += orderItem.subtotal

      console.log(
        `✅ 項目處理完成: ${itemName}${matchedTemplate ? ' (已匹配模板)' : ' (無匹配模板)'}`,
      )
    } catch (error) {
      console.error(`❌ 處理項目失敗: ${product.name}`, error)
      // 繼續處理其他項目
    }
  }

  console.log(`🎯 項目處理總結: 共 ${processedItems.length} 個項目，小計 $${itemSubtotal}`)

  return { processedItems, itemSubtotal }
}

/**
 * 尋找匹配的餐點模板
 * @param {String} foodpandaProductId - Foodpanda 產品ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object|null>} 匹配的餐點模板
 */
const findMatchingDishTemplate = async (foodpandaProductId, brandId) => {
  if (!foodpandaProductId || !isValidMongoId(foodpandaProductId)) {
    return null
  }

  try {
    const template = await DishTemplate.findOne({
      _id: foodpandaProductId,
      brand: brandId,
    })

    if (template) {
      console.log(`✅ 找到匹配的餐點模板: ${template.name}`)
      return template
    } else {
      console.log(`⚠️ 未找到匹配的餐點模板: ${foodpandaProductId}`)
      return null
    }
  } catch (error) {
    console.error(`❌ 查找餐點模板時發生錯誤:`, error)
    return null
  }
}

/**
 * 處理 Foodpanda 配料/選項
 * @param {Array} toppings - Foodpanda 配料清單
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Array>} 處理後的選項
 */
const processToppings = async (toppings, brandId) => {
  const processedOptions = []

  for (const topping of toppings) {
    try {
      const groupName = topping.name || '未知選項組'
      const selections = []

      // 處理該組合中的選項
      for (const product of topping.products || []) {
        const optionName = product.name || '未知選項'
        const optionPrice = parseFloat(product.price || 0)

        // 🔍 嘗試匹配選項ID
        const matchedOption = await findMatchingOption(product.id, brandId)

        const selection = {
          optionId: matchedOption?._id || null,
          name: optionName,
          price: matchedOption?.price !== undefined ? matchedOption.price : optionPrice,
        }

        selections.push(selection)
        console.log(`  ├─ 選項: ${optionName}${matchedOption ? ' (已匹配)' : ' (無匹配)'}`)
      }

      if (selections.length > 0) {
        processedOptions.push({
          optionCategoryId: null,
          optionCategoryName: groupName,
          selections: selections,
        })
      }
    } catch (error) {
      console.error(`❌ 處理選項組合失敗: ${topping.name}`, error)
    }
  }

  return processedOptions
}

/**
 * 尋找匹配的選項
 * @param {String} foodpandaOptionId - Foodpanda 選項ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object|null>} 匹配的選項
 */
const findMatchingOption = async (foodpandaOptionId, brandId) => {
  if (!foodpandaOptionId || !isValidMongoId(foodpandaOptionId)) {
    return null
  }

  try {
    const option = await Option.findOne({
      _id: foodpandaOptionId,
      brand: brandId,
    })

    if (option) {
      console.log(`✅ 找到匹配的選項: ${option.name}`)
      return option
    } else {
      console.log(`⚠️ 未找到匹配的選項: ${foodpandaOptionId}`)
      return null
    }
  } catch (error) {
    console.error(`❌ 查找選項時發生錯誤:`, error)
    return null
  }
}

/**
 * 驗證是否為有效的 MongoDB ObjectId
 * @param {String} id - 要驗證的ID
 * @returns {Boolean} 是否有效
 */
const isValidMongoId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

/**
 * 格式化 Foodpanda 配送地址
 * @param {Object} address - Foodpanda 地址資訊
 * @returns {String} 格式化的地址
 */
const formatFoodpandaDeliveryAddress = (address) => {
  if (!address) return ''

  const addressParts = [
    address.street_name,
    address.street_number,
    address.city,
    address.postcode,
  ].filter(Boolean)

  return addressParts.join(', ')
}
