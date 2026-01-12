import axios from 'axios'
import { fromUTCDate, formatDateTime } from '../../utils/date.js'

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

  // 只顯示序號
  const orderNumber = order.sequence.toString().padStart(3, '0')

  // 將 UTC 時間轉換為台灣時區後再格式化
  const orderDateTime = fromUTCDate(order.createdAt || new Date())
  const orderDate = formatDateTime(orderDateTime, 'yyyy/MM/dd')
  const orderTime = formatDateTime(orderDateTime, 'HH:mm')

  // 處理預約取餐時間
  let pickupDateTime = null
  let pickupDate = null
  let pickupTime = null
  if (order.estimatedPickupTime) {
    pickupDateTime = fromUTCDate(order.estimatedPickupTime)
    pickupDate = formatDateTime(pickupDateTime, 'yyyy/MM/dd')
    pickupTime = formatDateTime(pickupDateTime, 'HH:mm')
  }

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
                    text: orderDate,
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
                    text: orderTime,
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

              // 預約取餐時間（如果有）
              ...(pickupDate && pickupTime
                ? [
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        {
                          type: 'text',
                          text: '⏰ 預約取餐',
                          size: 'md',
                          color: '#555555',
                          flex: 0,
                          gravity: 'center',
                        },
                        {
                          type: 'text',
                          text: `${pickupDate}\n${pickupTime}`,
                          size: 'md',
                          color: '#FF6B35',
                          align: 'end',
                          gravity: 'center',
                          weight: 'bold',
                          wrap: true,
                        },
                      ],
                      backgroundColor: '#FFF3E0',
                      paddingAll: 'sm',
                      cornerRadius: 'md',
                      margin: 'md',
                    },
                  ]
                : []),
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
