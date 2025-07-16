/**
 * 訂單客戶服務 - 完整版
 * 處理客戶相關的訂單操作（支援 Bundle 購買 + 混合購買）
 */

import Order from '../../models/Order/Order.js'
import DishInstance from '../../models/Dish/DishInstance.js'
import BundleInstance from '../../models/Promotion/BundleInstance.js'
import Bundle from '../../models/Promotion/Bundle.js'
import VoucherInstance from '../../models/Promotion/VoucherInstance.js'
import { AppError } from '../../middlewares/error.js'
import * as inventoryService from '../inventory/stockManagement.js'
import * as bundleService from '../bundle/bundleService.js'
import * as bundleInstanceService from '../bundle/bundleInstance.js'
import * as pointService from '../promotion/pointService.js'
import * as pointRuleService from '../promotion/pointRuleService.js'
import { getTaiwanDateTime, formatDateTime, generateDateCode } from '../../utils/date.js'

/**
 * 創建訂單 - 支援 Bundle 購買 + 預先庫存檢查
 */
export const createOrder = async (orderData) => {
  try {
    //console.log('Creating order with mixed purchase support...');

    // 設置預設手動調整金額
    orderData.manualAdjustment = orderData.manualAdjustment || 0
    orderData.serviceCharge = orderData.serviceCharge || 0
    orderData.discounts = orderData.discounts || []

    // 🔍 Step 1: 預先檢查所有餐點庫存 (不實際扣除)
    await validateInventoryBeforeOrder(orderData)

    // 🔍 Step 2: 預先檢查 Bundle 購買資格
    await validateBundlesBeforeOrder(orderData)

    // Step 3: 處理訂單項目
    const items = []
    let dishSubtotal = 0
    let bundleSubtotal = 0

    for (const item of orderData.items) {
      if (item.itemType === 'dish') {
        //console.log(`Processing dish: ${item.name}`);
        const dishItem = await createDishItem(item, orderData.brand)
        items.push(dishItem)
        dishSubtotal += dishItem.subtotal
      } else if (item.itemType === 'bundle') {
        //console.log(`Processing bundle: ${item.name}`);
        const bundleItem = await createBundleItem(
          item,
          orderData.user,
          orderData.store,
          orderData.brand,
        )
        items.push(bundleItem)
        bundleSubtotal += bundleItem.subtotal
      }
    }

    // Step 4: 更新訂單數據
    orderData.items = items
    orderData.dishSubtotal = dishSubtotal
    orderData.bundleSubtotal = bundleSubtotal

    // Step 5: 創建並保存訂單
    const order = new Order(orderData)
    updateOrderAmounts(order)
    await order.save()

    //console.log(`Order created: dishes $${dishSubtotal} + bundles $${bundleSubtotal} = total $${order.total}`);

    // Step 6: 實際扣除庫存 (這時應該不會失敗，因為已經預檢查過)
    try {
      await inventoryService.reduceInventoryForOrder(order)
    } catch (inventoryError) {
      console.error('Inventory reduction failed after pre-validation:', inventoryError)
      await cleanupFailedOrder(order._id, items)
      throw new AppError('庫存扣除失敗，請重新下單', 400)
    }

    // Step 7: 如果是即時付款，處理後續流程
    let result = { ...order.toObject(), pointsAwarded: 0, generatedVouchers: [] }

    if (order.status === 'paid') {
      //console.log('Processing immediate payment completion...');
      result = await processOrderPaymentComplete(order)
    }

    return result
  } catch (error) {
    console.error('Failed to create order:', error)
    throw error
  }
}

/**
 * 🔍 預先檢查所有餐點庫存
 */
const validateInventoryBeforeOrder = async (orderData) => {
  const dishItems = orderData.items.filter((item) => item.itemType === 'dish')

  if (dishItems.length === 0) {
    return // 沒有餐點項目，跳過檢查
  }

  //console.log(`Validating inventory for ${dishItems.length} dish items...`);

  for (const item of dishItems) {
    try {
      // 根據餐點模板ID查找庫存
      const inventoryItem = await inventoryService.getInventoryItemByDishTemplate(
        orderData.store,
        item.templateId,
      )

      // 如果沒有庫存記錄，跳過檢查
      if (!inventoryItem) {
        //console.log(`Dish ${item.name} has no inventory record, skipping check`);
        continue
      }

      // 檢查是否手動設為售完（這個總是要檢查）
      if (inventoryItem.isSoldOut) {
        throw new AppError(`很抱歉，${item.name} 目前已售完`, 400)
      }

      // 🔥 核心邏輯：enableAvailableStock 只有在 isInventoryTracked = true 時才有效
      if (inventoryItem.isInventoryTracked) {
        //console.log(`📊 ${item.name} inventory tracking enabled - will record stock changes`);

        // 只有在追蹤庫存 + 啟用可用庫存控制時，才檢查庫存限制
        if (inventoryItem.enableAvailableStock) {
          if (inventoryItem.availableStock < item.quantity) {
            throw new AppError(
              `很抱歉，${item.name} 庫存不足。需要：${item.quantity}，剩餘：${inventoryItem.availableStock}`,
              400,
            )
          }
          //console.log(`✅ ${item.name} stock limit check passed (need: ${item.quantity}, available: ${inventoryItem.availableStock})`);
        } else {
          //console.log(`✅ ${item.name} inventory tracked but no purchase limit`);
        }
      } else {
        //console.log(`📊 ${item.name} inventory tracking disabled - no stock recording or limits`);
        // isInventoryTracked = false 時，enableAvailableStock 應該也是 false
        if (inventoryItem.enableAvailableStock) {
          console.warn(
            `⚠️  ${item.name} has enableAvailableStock=true but isInventoryTracked=false - logical inconsistency!`,
          )
        }
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error // 重新拋出業務邏輯錯誤
      } else {
        console.error(`Error checking inventory for ${item.name}:`, error)
        throw new AppError(`檢查 ${item.name} 庫存時發生錯誤`, 500)
      }
    }
  }

  //console.log('✅ All dish inventory validation passed');
}

/**
 * 🔍 預先檢查 Bundle 購買資格
 */
const validateBundlesBeforeOrder = async (orderData) => {
  const bundleItems = orderData.items.filter((item) => item.itemType === 'bundle')

  if (bundleItems.length === 0) {
    return // 沒有Bundle項目，跳過檢查
  }

  //console.log(`Validating bundle purchase eligibility for ${bundleItems.length} bundle items...`);

  for (const item of bundleItems) {
    try {
      await bundleService.validateBundlePurchase(
        item.bundleId || item.templateId,
        orderData.user,
        item.quantity,
        orderData.store,
      )

      //console.log(`✅ Bundle ${item.name} purchase eligibility check passed`);
    } catch (error) {
      console.error(`Bundle ${item.name} purchase eligibility check failed:`, error)
      throw error // 直接拋出，因為 bundleService 已經包裝了適當的錯誤訊息
    }
  }

  //console.log('✅ All bundle purchase eligibility validation passed');
}

/**
 * 🧹 清理失敗訂單 (當預檢查通過但後續步驟失敗時)
 */
const cleanupFailedOrder = async (orderId, items) => {
  try {
    //console.log('Cleaning up failed order data...');

    // 刪除已創建的實例
    const dishInstanceIds = items
      .filter((item) => item.itemType === 'dish')
      .map((item) => item.dishInstance)

    const bundleInstanceIds = items
      .filter((item) => item.itemType === 'bundle')
      .map((item) => item.bundleInstance)

    if (dishInstanceIds.length > 0) {
      await DishInstance.deleteMany({ _id: { $in: dishInstanceIds } })
      //console.log(`Cleaned up ${dishInstanceIds.length} dish instances`);
    }

    if (bundleInstanceIds.length > 0) {
      await BundleInstance.deleteMany({ _id: { $in: bundleInstanceIds } })
      //console.log(`Cleaned up ${bundleInstanceIds.length} bundle instances`);
    }

    // 刪除訂單
    if (orderId) {
      await Order.findByIdAndDelete(orderId)
      //console.log('Cleaned up failed order');
    }

    //console.log('✅ Failed order cleanup completed');
  } catch (cleanupError) {
    console.error('❌ Error cleaning up failed order data:', cleanupError)
    // 不拋出錯誤，避免影響主要的錯誤處理
  }
}

/**
 * 創建餐點項目
 */
const createDishItem = async (item, brandId) => {
  // 建立餐點實例
  const dishInstance = new DishInstance({
    brand: brandId,
    templateId: item.templateId,
    name: item.name,
    basePrice: item.basePrice,
    options: item.options || [],
    finalPrice: item.finalPrice || item.subtotal || item.basePrice * item.quantity,
  })

  await dishInstance.save()

  return {
    itemType: 'dish',
    itemName: item.name,
    dishInstance: dishInstance._id,
    quantity: item.quantity,
    subtotal: item.subtotal || dishInstance.finalPrice * item.quantity,
    note: item.note || '',
  }
}

/**
 * 創建 Bundle 項目 (移除重複驗證，因為已經預檢查過)
 */
const createBundleItem = async (item, userId, storeId, brandId) => {
  // 創建 Bundle 實例 - 記錄購買的 Bundle
  const bundleInstanceData = {
    templateId: item.bundleId || item.templateId,
    brand: brandId,
    user: userId,
    purchasedAt: new Date(),
  }

  const bundleInstance = await bundleInstanceService.createInstance(bundleInstanceData)

  return {
    itemType: 'bundle',
    itemName: item.name || bundleInstance.name,
    bundleInstance: bundleInstance._id, // 記錄購買的 Bundle 實例
    quantity: item.quantity,
    subtotal: item.subtotal || bundleInstance.finalPrice * item.quantity,
    note: item.note || '',
    generatedVouchers: [], // 付款完成後才生成 Voucher
  }
}

/**
 * 處理訂單付款完成後的流程
 */
export const processOrderPaymentComplete = async (order) => {
  let pointsReward = { pointsAwarded: 0 }
  let generatedVouchers = []

  //console.log(`Processing payment completion for order ${order._id}...`);

  try {
    // 1. 拆解 Bundle 生成 VoucherInstance 給用戶
    for (const item of order.items) {
      if (item.itemType === 'bundle') {
        //console.log(`Generating vouchers for bundle: ${item.itemName}`);
        const bundleVouchers = await generateVouchersForBundle(item, order)
        generatedVouchers.push(...bundleVouchers)

        // 更新訂單項目的 generatedVouchers
        item.generatedVouchers = bundleVouchers.map((v) => v._id)
      }
    }

    // 2. 更新 Bundle 銷售統計
    await updateBundleSalesStats(order)

    // 3. 處理點數給予
    if (order.user) {
      //console.log('Processing points reward...');
      pointsReward = await processOrderPointsReward(order)
    }

    // 4. 保存訂單更新
    await order.save()

    //console.log(`✅ Payment completion processed:`);
    //console.log(`   - Generated vouchers: ${generatedVouchers.length}`);
    //console.log(`   - Points awarded: ${pointsReward.pointsAwarded}`);

    return {
      ...order.toObject(),
      pointsAwarded: pointsReward.pointsAwarded,
      generatedVouchers,
    }
  } catch (error) {
    console.error('Failed to process payment completion:', error)
    throw error
  }
}

/**
 * 拆解 Bundle 生成 VoucherInstance - 付款完成後執行
 */
const generateVouchersForBundle = async (bundleItem, order) => {
  const bundleInstance = await BundleInstance.findById(bundleItem.bundleInstance).populate(
    'bundleItems.voucherTemplate',
  )

  if (!bundleInstance) {
    throw new AppError('Bundle 實例不存在', 404)
  }

  const generatedVouchers = []

  //console.log(`Generating vouchers for bundle: ${bundleInstance.name} (qty: ${bundleItem.quantity})`);

  // 根據購買的 Bundle 數量生成 Voucher
  for (let i = 0; i < bundleItem.quantity; i++) {
    // 拆解 Bundle 中的每個 VoucherTemplate
    for (const bundleVoucherItem of bundleInstance.bundleItems) {
      // 只處理 exchange 類型的兌換券
      if (bundleVoucherItem.voucherTemplate.voucherType === 'exchange') {
        for (let j = 0; j < bundleVoucherItem.quantity; j++) {
          const voucherInstance = new VoucherInstance({
            brand: order.brand,
            template: bundleVoucherItem.voucherTemplate._id,
            voucherName: bundleVoucherItem.voucherTemplate.name,
            voucherType: bundleVoucherItem.voucherTemplate.voucherType,
            user: order.user,
            acquiredAt: new Date(),
            pointsUsed: 0, // Bundle 購買不直接消耗點數
            order: order._id,
            sourceBundle: bundleItem.bundleInstance, // 記錄來源 Bundle
          })

          // 設置兌換項目資訊
          if (bundleVoucherItem.voucherTemplate.voucherType === 'exchange') {
            voucherInstance.exchangeItems = bundleVoucherItem.voucherTemplate.exchangeInfo.items
          }

          // 設置過期日期（購買時間 + Bundle 設定的有效期天數）
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + bundleInstance.voucherValidityDays)
          voucherInstance.expiryDate = expiryDate

          await voucherInstance.save()
          generatedVouchers.push(voucherInstance)

          //console.log(`Generated voucher: ${bundleVoucherItem.voucherTemplate.name}`);
        }
      }
    }
  }

  //console.log(`✅ Generated ${generatedVouchers.length} vouchers total`);
  return generatedVouchers
}

/**
 * 更新 Bundle 銷售統計
 */
const updateBundleSalesStats = async (order) => {
  for (const item of order.items) {
    if (item.itemType === 'bundle') {
      const bundleInstance = await BundleInstance.findById(item.bundleInstance)
      if (bundleInstance) {
        await Bundle.findByIdAndUpdate(bundleInstance.templateId, {
          $inc: { totalSold: item.quantity },
        })
        //console.log(`Updated sales stats for bundle: ${bundleInstance.name} (+${item.quantity})`);
      }
    }
  }
}

/**
 * 🎊 處理訂單點數獎勵 (改進版 - 支援混合購買)
 */
export const processOrderPointsReward = async (order) => {
  try {
    //console.log(`Processing points reward for order ${order._id}`);

    if (!order.user) {
      //console.log('No user found, skipping points reward');
      return { pointsAwarded: 0 }
    }

    // 🎯 使用本地導入的 pointRuleService 計算點數
    const pointsCalculation = await pointRuleService.calculateOrderPoints(
      order.brand,
      order.total, // 使用訂單總額，包含 dishSubtotal + bundleSubtotal
    )

    if (!pointsCalculation || pointsCalculation.points === 0) {
      //console.log('No points awarded - rule not met or no active rules');
      return { pointsAwarded: 0 }
    }

    // 檢查是否已經給予過點數
    const existingPoints = await pointService.getUserPoints(order.user, order.brand)
    const alreadyRewarded = existingPoints.some(
      (point) =>
        point.sourceModel === 'Order' &&
        point.sourceId &&
        point.sourceId.toString() === order._id.toString(),
    )

    if (alreadyRewarded) {
      //console.log('Points already awarded, skipping duplicate reward');
      return { pointsAwarded: 0 }
    }

    // 更新訂單中的點數相關資訊
    order.pointsEarned = pointsCalculation.points
    order.pointsCalculationBase = order.total // 🔥 記錄用於計算的金額
    order.pointsRule = {
      ruleId: pointsCalculation.rule._id,
      ruleName: pointsCalculation.rule.name,
      conversionRate: pointsCalculation.rule.conversionRate,
      minimumAmount: pointsCalculation.rule.minimumAmount,
    }

    // 給用戶發放點數 - 使用正確的枚舉值和參數順序
    const sourceInfo = {
      model: 'Order',
      id: order._id,
    }

    await pointService.addPointsToUser(
      order.user, // userId
      order.brand, // brandId
      pointsCalculation.points, // amount
      '滿額贈送', // source - 使用 PointInstance 模型中的有效枚舉值
      sourceInfo, // sourceInfo
      pointsCalculation.rule.validityDays || 60, // validityDays，預設60天
    )

    //console.log(`✅ Awarded ${pointsCalculation.points} points to user ${order.user}`);
    //console.log(`💰 Calculation base: ${order.total} (dishes: ${order.dishSubtotal}, bundles: ${order.bundleSubtotal})`);

    return {
      pointsAwarded: pointsCalculation.points,
      calculationBase: order.total,
      rule: pointsCalculation.rule,
    }
  } catch (error) {
    console.error('Failed to process order points reward:', error)
    // 不拋出錯誤，避免影響訂單主流程
    return { pointsAwarded: 0 }
  }
}

/**
 * 🧮 更新訂單金額 (支援混合購買)
 */
export const updateOrderAmounts = (order) => {
  //console.log('Updating order amounts...');

  // Step 1: 計算小計 (dishes + bundles)
  order.subtotal = order.dishSubtotal + order.bundleSubtotal

  // Step 2: 確保服務費存在
  if (!order.serviceCharge) {
    order.serviceCharge = 0
  }

  // Step 3: 計算總折扣
  order.totalDiscount = order.discounts.reduce((sum, discount) => sum + discount.amount, 0)

  // Step 4: 計算最終總額
  order.total = order.subtotal + order.serviceCharge - order.totalDiscount + order.manualAdjustment

  // 確保金額不為負數
  if (order.total < 0) {
    order.total = 0
  }

  //console.log(`Order amounts updated:`);
  //console.log(`   - Dish subtotal: $${order.dishSubtotal}`);
  //console.log(`   - Bundle subtotal: $${order.bundleSubtotal}`);
  //console.log(`   - Subtotal: $${order.subtotal}`);
  //console.log(`   - Service charge: $${order.serviceCharge}`);
  //console.log(`   - Total discount: $${order.totalDiscount}`);
  //console.log(`   - Manual adjustment: $${order.manualAdjustment}`);
  //console.log(`   - Final total: $${order.total}`);

  return order
}

/**
 * 獲取用戶訂單
 */
export const getUserOrders = async (userId, options = {}) => {
  const { brandId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options

  const query = { user: userId }
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
    .populate('items.generatedVouchers', 'voucherName voucherType isUsed expiryDate')
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
 * 根據ID獲取訂單詳情（不限制用戶，支援匿名訂單）
 */
export const getUserOrderById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate('items.dishInstance', 'name options')
    .populate({
      path: 'items.bundleInstance',
      select: 'name bundleItems',
      populate: {
        path: 'bundleItems.voucherTemplate', // 修復：移除 dishTemplate，只保留 voucherTemplate
        select: 'name exchangeDishTemplate',
        populate: {
          path: 'exchangeDishTemplate', // 進一步 populate 餐點資料
          select: 'name basePrice',
        },
      },
    })

  if (!order) {
    throw new AppError('訂單不存在', 404)
  }

  return order
}

/**
 * 生成訂單編號
 * @param {String} storeId - 店鋪ID，用於查詢當天訂單數量
 * @returns {Promise<Object>} 包含 orderDateCode 和 sequence 的物件
 */
export const generateOrderNumber = async (storeId) => {
  const dateCode = generateDateCode() // 例如 '250109'

  // 查詢當天已有的訂單數量
  const todayOrderCount = await Order.countDocuments({
    store: storeId,
    orderDateCode: dateCode,
  })

  // 序號 = 當天訂單數 + 1
  const sequence = todayOrderCount + 1

  return {
    orderDateCode: dateCode,
    sequence: sequence,
  }
}

/**
 * 🧮 計算訂單金額 (工具函數)
 */
export const calculateOrderAmounts = (items) => {
  let dishSubtotal = 0
  let bundleSubtotal = 0

  items.forEach((item) => {
    if (item.itemType === 'dish') {
      dishSubtotal += item.subtotal || 0
    } else if (item.itemType === 'bundle') {
      bundleSubtotal += item.subtotal || 0
    }
  })

  return {
    dishSubtotal,
    bundleSubtotal,
    totalAmount: dishSubtotal + bundleSubtotal,
  }
}

/**
 * 處理支付
 */
export const processPayment = async (orderId, paymentData) => {
  const order = await Order.findById(orderId)

  if (!order) {
    throw new AppError('訂單不存在', 404)
  }

  if (order.status === 'paid') {
    throw new AppError('訂單已付款', 400)
  }

  // 更新支付資訊
  order.status = 'paid'
  order.paymentType = paymentData.paymentType
  order.paymentMethod = paymentData.paymentMethod

  await order.save()

  // 處理付款完成後的流程
  const result = await processOrderPaymentComplete(order)

  return result
}

/**
 * 處理支付回調
 */
export const handlePaymentCallback = async (orderId, callbackData) => {
  const order = await Order.findById(orderId)

  if (!order) {
    throw new AppError('訂單不存在', 404)
  }

  if (callbackData.status === 'success') {
    order.status = 'paid'
    order.transactionId = callbackData.transactionId
    await order.save()

    // 處理付款完成後的流程
    return await processOrderPaymentComplete(order)
  } else {
    order.status = 'cancelled'
    await order.save()
    return order
  }
}
