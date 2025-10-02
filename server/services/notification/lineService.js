import axios from 'axios'

/**
 * 發送LINE訊息
 * @param {string} accessToken - LINE Channel Access Token
 * @param {string} userId - LINE用戶ID（lineUniqueId）
 * @param {Object} message - 要發送的訊息內容（可以是文字或Flex Message）
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
        messages: [message],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 10000,
      },
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
 * 格式化日期時間
 * @param {Date} date - 日期物件
 * @returns {Object} 格式化後的日期和時間
 */
const formatDateTime = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return {
    date: `${year}/${month}/${day}`,
    time: `${hours}:${minutes}`,
  }
}

/**
 * 建立訂單確認訊息內容（Flex Message）
 * @param {Object} order - 訂單物件
 * @param {string} confirmUrl - 確認訂單的網址
 * @returns {Object} Flex Message 物件
 */
export const buildOrderConfirmationMessage = (order, confirmUrl) => {
  const orderTypeText = {
    takeout: '🛍️ 自取',
    delivery: '🚗 外送',
    dine_in: '🍽️ 內用',
  }

  const orderTypeIcon = {
    takeout: '🛍️',
    delivery: '🚗',
    dine_in: '🍽️',
  }

  // 只顯示序號
  const orderNumber = order.sequence.toString().padStart(3, '0')

  // 格式化日期時間
  const { date, time } = formatDateTime(order.createdAt || new Date())

  return {
    type: 'flex',
    altText: `訂單確認通知 - 編號 ${orderNumber}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '訂單確認通知',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
            align: 'center',
          },
        ],
        backgroundColor: '#FF6B35',
        paddingAll: '20px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          // 訂單編號區塊
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '訂單編號',
                size: 'sm',
                color: '#999999',
                align: 'center',
              },
              {
                type: 'text',
                text: `#${orderNumber}`,
                size: 'xxl',
                weight: 'bold',
                color: '#FF6B35',
                align: 'center',
                margin: 'xs',
              },
            ],
            margin: 'none',
            paddingBottom: 'lg',
          },

          // 分隔線
          {
            type: 'separator',
            margin: 'lg',
          },

          // 訂單資訊區塊
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            margin: 'lg',
            contents: [
              // 日期
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '📅 日期',
                    size: 'md',
                    color: '#555555',
                    flex: 0,
                    gravity: 'center',
                  },
                  {
                    type: 'text',
                    text: date,
                    size: 'md',
                    color: '#111111',
                    align: 'end',
                    gravity: 'center',
                    weight: 'bold',
                  },
                ],
              },

              // 時間
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🕐 時間',
                    size: 'md',
                    color: '#555555',
                    flex: 0,
                    gravity: 'center',
                  },
                  {
                    type: 'text',
                    text: time,
                    size: 'md',
                    color: '#111111',
                    align: 'end',
                    gravity: 'center',
                    weight: 'bold',
                  },
                ],
              },

              // 取餐方式
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '📦 取餐方式',
                    size: 'md',
                    color: '#555555',
                    flex: 0,
                    gravity: 'center',
                  },
                  {
                    type: 'text',
                    text: orderTypeText[order.orderType] || order.orderType,
                    size: 'md',
                    color: '#FF6B35',
                    align: 'end',
                    gravity: 'center',
                    weight: 'bold',
                  },
                ],
              },
            ],
          },

          // 分隔線
          {
            type: 'separator',
            margin: 'xl',
          },

          // 金額區塊
          {
            type: 'box',
            layout: 'vertical',
            margin: 'xl',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '訂單金額',
                    size: 'lg',
                    color: '#555555',
                    flex: 0,
                    gravity: 'center',
                  },
                  {
                    type: 'text',
                    text: `NT$ ${order.total}`,
                    size: 'xxl',
                    color: '#FF6B35',
                    align: 'end',
                    gravity: 'center',
                    weight: 'bold',
                  },
                ],
              },
            ],
          },
        ],
        paddingAll: '20px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📋 訂單明細',
              uri: confirmUrl,
            },
            color: '#FF6B35',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '如有任何問題，請聯繫店家',
                color: '#999999',
                size: 'xs',
                align: 'center',
                wrap: true,
              },
            ],
            paddingTop: 'md',
          },
        ],
        flex: 0,
      },
    },
  }
}
