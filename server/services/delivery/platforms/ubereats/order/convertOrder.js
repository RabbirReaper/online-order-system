/**
 * Uber Eats 訂單轉換服務
 * 處理 Uber Eats 訂單格式轉換為內部格式
 */

import DishTemplate from '../../../../../models/Dish/DishTemplate.js'
import Option from '../../../../../models/Dish/Option.js'
import DishInstance from '../../../../../models/Dish/DishInstance.js'
import { generateOrderNumber } from '../../../../order/orderUtils.js'
import { AppError } from '../../../../../middlewares/error.js'

/**
 * 轉換 Uber Eats 訂單格式為內部格式
 * @param {Object} uberOrder - Uber Eats 訂單資料
 * @param {Object} platformStore - 平台店鋪配置
 * @returns {Promise<Object>} 內部訂單格式
 */
export const convertUberOrderToInternal = async (uberOrder, platformStore) => {
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
    const subtotalAmount = extractAmount(uberOrder.payment?.charges?.sub_total)
    const totalFeeAmount = extractAmount(uberOrder.payment?.charges?.total_fee)

    // console.log('💰 金額轉換結果:', {
    //   原始總金額: uberOrder.payment?.charges?.total,
    //   轉換後總金額: totalAmount,
    //   小計: subtotalAmount,
    //   總手續費: totalFeeAmount,
    // })

    // 🍽️ 轉換訂單項目
    const { processedItems, itemSubtotal } = await processUberOrderItems(
      uberOrder.cart?.items || [],
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
        platformStatus: uberOrder.current_state,
        platformCustomerInfo: {
          customerId: uberOrder.eater?.id || uberOrder.eaters?.[0]?.id,
          customerName: uberOrder.eater?.first_name || uberOrder.eaters?.[0]?.first_name,
          customerPhone: uberOrder.eater?.phone,
        },
        rawOrderData: {}, // 按要求先留空
        lastSyncAt: new Date(),
      },

      // 訂單類型和狀態
      orderType: uberOrder.type === 'DELIVERY_BY_UBER' ? 'delivery' : 'takeout',
      status: 'paid', // 外送平台訂單預設為已付款

      // 客戶資訊
      customerInfo: {
        name: uberOrder.eater?.first_name || uberOrder.eaters?.[0]?.first_name || 'Uber Eats 顧客',
        phone: uberOrder.eater?.phone || '',
      },

      // 配送資訊
      deliveryInfo: {
        address: formatUberDeliveryAddress(uberOrder.delivery?.location),
        estimatedTime: uberOrder.estimated_ready_for_pickup_at
          ? new Date(uberOrder.estimated_ready_for_pickup_at)
          : null,
        deliveryFee: 0, // Uber Eats 在 total_fee 中包含所有費用
        platformDeliveryInfo: {
          trackingUrl: uberOrder.tracking_url,
          estimatedArrival: uberOrder.delivery?.estimated_delivery_time
            ? new Date(uberOrder.delivery.estimated_delivery_time)
            : null,
        },
      },

      // 訂單項目與金額資訊
      items: processedItems,
      subtotal: itemSubtotal,
      dishSubtotal: itemSubtotal, // 目前全部視為餐點小計
      bundleSubtotal: 0,
      serviceCharge: totalFeeAmount, // 將平台手續費視為服務費
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

    // console.log('🔄 Uber Eats 訂單轉換完成:', {
    //   platformOrderId: uberOrder.id,
    //   internalOrderNumber: `${orderNumber.orderDateCode}${orderNumber.sequence.toString().padStart(3, '0')}`,
    //   itemsCount: processedItems.length,
    //   total: internalOrder.total,
    //   subtotal: internalOrder.subtotal,
    //   serviceCharge: internalOrder.serviceCharge,
    // })

    return internalOrder
  } catch (error) {
    console.error('❌ 轉換 Uber Eats 訂單格式失敗:', error)
    throw new AppError('訂單格式轉換失敗', 500)
  }
}

/**
 * 處理 Uber Eats 訂單項目
 * @param {Array} uberItems - Uber Eats 訂單項目
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 處理後的項目和小計
 */
const processUberOrderItems = async (uberItems, brandId) => {
  const processedItems = []
  let itemSubtotal = 0

  // console.log(`🍽️ 開始處理 ${uberItems.length} 個 Uber Eats 訂單項目`)

  for (const uberItem of uberItems) {
    try {
      // 提取基本資訊
      const itemName = uberItem.title || '未知餐點'
      const itemQuantity = uberItem.quantity || 1
      const itemPrice = extractItemPrice(uberItem.price)

      // console.log(`處理項目: ${itemName} x${itemQuantity} = $${itemPrice * itemQuantity}`)

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
        templateId: matchedTemplate?._id || null, // 有匹配的模板就設定，沒有就留空
        name: itemName, // 優先使用平台名稱
        basePrice: matchedTemplate?.basePrice || itemPrice, // 有模板用模板價格，否則用平台價格
        options: processedOptions,
        finalPrice: itemPrice, // 使用平台的實際價格
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
        note: '',
        // 🏷️ 新增：記錄平台項目ID
        platformItemId: uberItem.id,
      }

      processedItems.push(orderItem)
      itemSubtotal += orderItem.subtotal

      // console.log(
      //   `✅ 項目處理完成: ${itemName}${matchedTemplate ? ' (已匹配模板)' : ' (無匹配模板)'}`,
      // )
    } catch (error) {
      console.error(`❌ 處理項目失敗: ${uberItem.title}`, error)
      // 繼續處理其他項目，不因單一項目失敗而中斷整個訂單
    }
  }

  // console.log(`🎯 項目處理總結: 共 ${processedItems.length} 個項目，小計 $${itemSubtotal}`)

  return { processedItems, itemSubtotal }
}

/**
 * 尋找匹配的餐點模板
 * @param {String} uberItemId - Uber Eats 項目ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object|null>} 匹配的餐點模板
 */
const findMatchingDishTemplate = async (uberItemId, brandId) => {
  if (!uberItemId || !isValidMongoId(uberItemId)) {
    // console.log('🔍 無效的 Uber 項目ID，跳過模板匹配')
    return null
  }

  try {
    // 🔍 在品牌底下查找對應的餐點模板
    const template = await DishTemplate.findOne({
      _id: uberItemId,
      brand: brandId,
    })

    if (template) {
      // console.log(`✅ 找到匹配的餐點模板: ${template.name}`)
      return template
    } else {
      // console.log(`⚠️ 未找到匹配的餐點模板: ${uberItemId}`)
      return null
    }
  } catch (error) {
    console.error(`❌ 查找餐點模板時發生錯誤:`, error)
    return null
  }
}

/**
 * 處理 Uber Eats 選項組合
 * @param {Array} modifierGroups - Uber Eats 選項組合
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Array>} 處理後的選項
 */
const processModifierGroups = async (modifierGroups, brandId) => {
  const processedOptions = []

  for (const group of modifierGroups) {
    try {
      const groupName = group.title || '未知選項組'
      const selections = []

      // 處理該組合中的選項
      for (const selectedItem of group.selected_items || []) {
        const optionName = selectedItem.title || '未知選項'
        const optionPrice = extractItemPrice(selectedItem.price)

        // 🔍 嘗試匹配選項ID
        const matchedOption = await findMatchingOption(selectedItem.id, brandId)

        const selection = {
          optionId: matchedOption?._id || null, // 有匹配就設定，沒有就留空
          name: optionName, // 優先使用平台名稱
          price: matchedOption?.price !== undefined ? matchedOption.price : optionPrice, // 有匹配用模板價格
        }

        selections.push(selection)
        // console.log(`  ├─ 選項: ${optionName}${matchedOption ? ' (已匹配)' : ' (無匹配)'}`)
      }

      if (selections.length > 0) {
        processedOptions.push({
          optionCategoryId: null, // 暫時設為 null，因為 Uber 不提供類別ID對應
          optionCategoryName: groupName,
          selections: selections,
        })
      }
    } catch (error) {
      console.error(`❌ 處理選項組合失敗: ${group.title}`, error)
      // 繼續處理其他選項組合
    }
  }

  return processedOptions
}

/**
 * 尋找匹配的選項
 * @param {String} uberOptionId - Uber Eats 選項ID
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object|null>} 匹配的選項
 */
const findMatchingOption = async (uberOptionId, brandId) => {
  if (!uberOptionId || !isValidMongoId(uberOptionId)) {
    // console.log('🔍 無效的 Uber 選項ID，跳過選項匹配')
    return null
  }

  try {
    // 🔍 在品牌底下查找對應的選項
    const option = await Option.findOne({
      _id: uberOptionId,
      brand: brandId,
    })

    if (option) {
      // console.log(`✅ 找到匹配的選項: ${option.name}`)
      return option
    } else {
      // console.log(`⚠️ 未找到匹配的選項: ${uberOptionId}`)
      return null
    }
  } catch (error) {
    console.error(`❌ 查找選項時發生錯誤:`, error)
    return null
  }
}

/**
 * 提取項目價格
 * @param {Object} priceObject - Uber Eats 價格對象
 * @returns {Number} 價格（以元為單位）
 */
const extractItemPrice = (priceObject) => {
  if (!priceObject || !priceObject.total_price) {
    return 0
  }

  const amountInCents = priceObject.total_price.amount || 0
  return Math.round((amountInCents / 100) * 100) / 100
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
