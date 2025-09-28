/**
 * LINE通知服務
 * 處理LINE Bot訊息發送
 */

import axios from 'axios'

/**
 * 發送LINE訊息
 * @param {string} accessToken - LINE Channel Access Token
 * @param {string} userId - LINE用戶ID（lineUniqueId）
 * @param {string} message - 要發送的訊息內容
 * @returns {Promise<boolean>} 是否發送成功
 */
export const sendLineMessage = async (accessToken, userId, message) => {
  try {
    if (!accessToken || !userId || !message) {
      console.error('LINE訊息發送失敗：缺少必要參數')
      return false
    }

    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: userId,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 10000, // 10秒超時
      }
    )

    if (response.status === 200) {
      console.log(`LINE訊息發送成功 - 用戶ID: ${userId}`)
      return true
    } else {
      console.error(`LINE訊息發送失敗 - 狀態碼: ${response.status}`)
      return false
    }
  } catch (error) {
    console.error('LINE訊息發送錯誤:', error.message)
    if (error.response) {
      console.error('LINE API回應錯誤 - 狀態碼:', error.response.status)
      console.error('LINE API回應內容:', error.response.data)
    } else if (error.request) {
      console.error('LINE API請求失敗，無回應')
    }
    return false
  }
}

/**
 * 建立訂單確認訊息內容
 * @param {Object} order - 訂單物件
 * @param {string} confirmUrl - 確認訂單的網址
 * @returns {string} 格式化的訊息內容
 */
export const buildOrderConfirmationMessage = (order, confirmUrl) => {
  const orderTypeText = {
    takeout: '外帶',
    delivery: '外送',
    dine_in: '內用'
  }

  const message = `
🛒 訂單確認通知

訂單編號：${order.orderDateCode}-${order.sequence.toString().padStart(3, '0')}
訂單類型：${orderTypeText[order.orderType] || order.orderType}
訂單金額：$${order.total}

請點擊以下連結確認您的訂單：
${confirmUrl}

如有任何問題，請聯繫店家。
  `.trim()

  return message
}