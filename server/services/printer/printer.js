/**
 * 訂單列印服務
 * 處理訂單列印相關業務邏輯
 */

import axios from 'axios'
import CryptoJS from 'crypto-js'
import Order from '../../models/Order/Order.js'
import Store from '../../models/Store/Store.js'
import PlatformToken from '../../models/DeliverPlatform/platformToken.js'
import { AppError } from '../../middlewares/error.js'
import { DateTime } from 'luxon'
import { fromUTCDate } from '../../utils/date.js'

const BASE_URL = 'https://open.sw-aiot.com/api'
const PRINTER_USERNAME = process.env.PRINTER_USERNAME
const PRINTER_SECRET = process.env.PRINTER_SECRET

/**
 * 獲取列印機 Access Token
 * @returns {Promise<String>} Access Token
 */
const getPrinterAccessToken = async () => {
  try {
    // 檢查是否有未過期的 token
    const existingToken = await PlatformToken.findOne({
      platform: 'printer',
      expiresAt: { $gt: new Date() },
    })

    if (existingToken) {
      console.log('✓ 使用現有的列印機 token')
      return existingToken.accessToken
    }

    // 獲取新 token
    const currentTime = Date.now()

    const params = {
      secret: PRINTER_SECRET,
      times: currentTime,
      username: PRINTER_USERNAME,
    }

    // 按 ASCII 碼排序並拼接
    const sortedKeys = Object.keys(params).sort()
    const signString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&')

    // MD5 加密並轉大寫
    const md5Hash = CryptoJS.MD5(signString).toString().toUpperCase()

    const jsonData = {
      username: PRINTER_USERNAME,
      password: md5Hash,
      times: currentTime,
    }

    const response = await axios.post(`${BASE_URL}/getToken`, jsonData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.data?.data?.token) {
      throw new AppError('獲取列印機 token 失敗', 500)
    }

    const newToken = response.data.data.token

    // 儲存 token（預設過期時間 24 小時）
    const expiresAt = new Date(Date.now() + 30 * 1000)

    await PlatformToken.findOneAndUpdate(
      { platform: 'printer' },
      {
        accessToken: newToken,
        expiresAt,
      },
      { upsert: true, new: true },
    )

    console.log('✓ 成功獲取新的列印機 token')
    return newToken
  } catch (error) {
    console.error('❌ 獲取列印機 token 失敗:', error.message)
    throw new AppError('獲取列印機認證失敗', 500)
  }
}

/**
 * 格式化訂單類型顯示
 * @param {Object} order - 訂單物件
 * @returns {String} 訂單類型文字
 */
const formatOrderType = (order) => {
  const platform = order.platformInfo?.platform || 'direct'

  if (platform === 'foodpanda') return 'foodpanda'
  if (platform === 'ubereats') return 'UberEats'
  if (order.orderType === 'dine_in') return '內用'
  if (order.orderType === 'takeout') return '自取'
  if (order.orderType === 'delivery') return '外送'

  return '未知'
}

/**
 * 格式化訂單編號顯示
 * @param {Object} order - 訂單物件
 * @returns {String} 訂單編號文字
 */
const formatOrderNumber = (order) => {
  const platform = order.platformInfo?.platform || 'direct'

  if (platform === 'foodpanda') {
    return `${order.platformInfo.platformOrderId || order.platformOrderId || 'N/A'}`
  }

  if (platform === 'ubereats') {
    const displayId = order.platformOrderId || 'N/A'
    return displayId.toUpperCase()
  }

  // 內部訂單編號
  return `${String(order.sequence)}`
}

/**
 * 建立訂單列印內容
 * @param {Object} order - 訂單物件（需包含 populated items）
 * @returns {Object} 列印訊息 JSON
 */
const buildOrderPrintMessage = (order) => {
  const printContent = []

  // 1. 訂單創建時間
  const createTime = fromUTCDate(order.createdAt).toFormat('yyyy/MM/dd HH:mm:ss')

  printContent.push({
    cont: `點餐時間: ${createTime}`,
  })

  // 2. 顧客資訊（如果有）
  if (order.customerInfo?.name) {
    printContent.push({
      cont: `顧客姓名: ${order.customerInfo.name}`,
    })
  }

  if (order.customerInfo?.phone) {
    printContent.push({
      cont: `聯絡電話: ${order.customerInfo.phone}`,
    })
  }

  printContent.push({
    cont: '',
  })
  printContent.push({
    cont: '',
  })

  // 3. 訂單類型
  printContent.push({
    cont: formatOrderType(order),
    type: 'title',
  })

  printContent.push({
    cont: '',
  })

  // 4. 桌號和訂單編號
  if (order.orderType === 'dine_in' && order.dineInInfo?.tableNumber) {
    // 標題行：桌號 和 編號
    printContent.push({
      cont: ` 桌號     單號`,
      type: 'text',
      align: 'center',
      size: '11',
    })
    // 數值行：桌號數字 和 編號數字
    printContent.push({
      cont: ` ${String(order.dineInInfo.tableNumber).padEnd(9)}${formatOrderNumber(order)}`,
      type: 'text',
      align: 'center',
      size: '11',
    })
  } else {
    printContent.push({
      cont: ` ${formatOrderNumber(order)}`,
      type: 'title',
    })
  }

  printContent.push({
    cont: '',
  })

  // 取餐時間，如果有的話
  if (order.estimatedPickupTime) {
    const pickupTime = fromUTCDate(order.estimatedPickupTime).toFormat('yyyy/MM/dd HH:mm')
    printContent.push({
      cont: `預約取餐時間: ${pickupTime}`,
    })
    printContent.push({
      cont: '',
    })
  }

  // 5. 外送地址（如果是外送訂單）
  if (order.orderType === 'delivery' && order.deliveryInfo?.address) {
    printContent.push({
      cont: `外送地址: ${order.deliveryInfo.address}`,
    })
  }

  // 6. 分隔線
  printContent.push({
    type: 'div_line',
  })

  // 8. 餐點清單
  printContent.push({
    cont: '【訂單明細】',
  })

  order.items.forEach((item, index) => {
    // 餐點名稱和數量
    const itemName = item.itemName || '未知餐點'
    const quantity = item.quantity || 1

    printContent.push({
      cont: `${quantity} X ${itemName}`,
      bold: true,
      type: 'text',
      size: '11',
    })

    // 如果是餐點，顯示選項
    if (item.itemType === 'dish' && item.dishInstance?.options) {
      item.dishInstance.options.forEach((optionCategory) => {
        if (optionCategory.selections && optionCategory.selections.length > 0) {
          const optionNames = optionCategory.selections.map((sel) => sel.name).join(', ')

          printContent.push({
            cont: `- ${optionCategory.optionCategoryName || '選項'}: ${optionNames}`,
            type: 'text',
            size: '01',
          })
        }
      })
    }

    // 備註
    if (item.note) {
      printContent.push({
        cont: `  備註: ${item.note}`,
        type: 'text',
        size: '01',
      })
    }

    // 項目間加空行
    printContent.push({
      cont: '',
    })
  })

  printContent.push({
    cont: `總共 ${order.items.length} 項`,
    type: 'title',
  })

  // 9. 分隔線
  printContent.push({
    type: 'div_line',
  })

  // 11. 訂單備註（如果有）
  if (order.notes) {
    printContent.push({
      cont: `備註: ${order.notes}`,
      type: 'text',
      bold: true,
    })
    printContent.push({
      type: 'div_line',
    })
  }

  // 10. 總金額
  printContent.push({
    cont: `$ ${order.total}`,
    type: 'title',
    bold: true,
  })

  printContent.push({
    cont: '',
  })

  if (order.status === 'paid') {
    printContent.push({
      cont: `已付款`,
      type: 'text',
      align: 'center',
      size: '11',
      bold: true,
    })
  } else if (order.status === 'unpaid') {
    printContent.push({
      cont: `未付款`,
      type: 'text',
      align: 'center',
      size: '11',
      bold: true,
    })
  } else {
    printContent.push({
      cont: `已取消`,
      type: 'text',
      align: 'center',
      size: '11',
      bold: true,
    })
  }

  printContent.push({
    cont: '',
  })

  // 12. 切紙
  printContent.push({
    cont: '1',
    type: 'cut',
  })

  return {
    print: printContent,
  }
}

/**
 * 發送列印訊息到列印機
 * @param {String} token - Access Token
 * @param {String} deviceId - 列印機設備ID
 * @param {Object} message - 列印訊息內容
 * @param {String} orderId - 訂單ID（用於追蹤）
 * @returns {Promise<Object>} 列印結果
 */
const sendPrintMessage = async (token, deviceId, message, orderId) => {
  try {
    const params = {
      devid: deviceId,
      reqid: `order_${orderId}_${Date.now()}`,
      message: JSON.stringify(message),
      type: 5, // JSON 格式
      orderid: orderId,
      vtype: 0,
    }

    const response = await axios.post(`${BASE_URL}/message/printMsg`, params, {
      headers: {
        'Content-Type': 'application/json',
        token: token,
      },
      timeout: 30000,
    })

    if (response.data?.code !== 200 || !response.data?.success) {
      throw new AppError(`列印失敗: ${response.data?.message || '未知錯誤'}`, 500)
    }

    console.log('✓ 列印訊息已發送:', {
      deviceId,
      orderId,
      taskId: response.data.data?.taskid,
    })

    return response.data
  } catch (error) {
    console.error('❌ 發送列印訊息失敗:', error.message)
    throw new AppError('發送列印訊息失敗', 500)
  }
}

/**
 * 列印訂單 core
 * @param {String} brandId - 品牌ID
 * @param {String} storeId - 店鋪ID
 * @param {String} orderId - 訂單ID
 * @returns {Promise<Object>} 列印結果
 */
export const printOrder = async (brandId, storeId, orderId) => {
  try {
    console.log(`🖨️  開始列印訂單 - Brand: ${brandId}, Store: ${storeId}, Order: ${orderId}`)

    // 1. 驗證並獲取店鋪資訊
    const store = await Store.findOne({
      _id: storeId,
      brand: brandId,
    })

    if (!store) {
      throw new AppError('店鋪不存在或不屬於該品牌', 404)
    }

    if (!store.printer || store.printer.length === 0) {
      throw new AppError('該店鋪未設定列印機', 400)
    }

    // 2. 獲取訂單詳情（包含 populated 資料）
    const order = await Order.findOne({
      _id: orderId,
      store: storeId,
      brand: brandId,
    })
      .populate('items.dishInstance', 'name options')
      .populate('items.bundleInstance', 'name')
      .lean()

    if (!order) {
      throw new AppError('訂單不存在或不屬於該店鋪', 404)
    }

    // 3. 獲取列印機 token
    const token = await getPrinterAccessToken()

    // 4. 建立列印訊息
    const printMessage = buildOrderPrintMessage(order)

    // 5. 發送列印到所有設定的列印機
    const printResults = []

    for (const deviceId of store.printer) {
      try {
        const result = await sendPrintMessage(token, deviceId, printMessage, orderId)
        printResults.push({
          deviceId,
          success: true,
          taskId: result.data?.taskid,
        })
      } catch (error) {
        console.error(`❌ 列印機 ${deviceId} 列印失敗:`, error.message)
        printResults.push({
          deviceId,
          success: false,
          error: error.message,
        })
      }
    }

    console.log('✅ 訂單列印完成:', {
      orderId,
      printersCount: store.printer.length,
      successCount: printResults.filter((r) => r.success).length,
    })

    return {
      success: true,
      orderId,
      printResults,
    }
  } catch (error) {
    console.error('❌ 列印訂單失敗:', error.message)
    throw error
  }
}
