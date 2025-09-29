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
 * 建立訂單確認訊息內容（Flex Message）
 * @param {Object} order - 訂單物件
 * @param {string} confirmUrl - 確認訂單的網址
 * @returns {Object} Flex Message 物件
 */
export const buildOrderConfirmationMessage = (order, confirmUrl) => {
  const orderTypeText = {
    takeout: '自取',
    delivery: '外送',
    dine_in: '內用',
  }

  const orderNumber = `${order.orderDateCode}-${order.sequence.toString().padStart(3, '0')}`

  return {
    type: 'flex',
    altText: `訂單確認通知 - ${orderNumber}`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🛒 訂單確認通知',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
          },
        ],
        backgroundColor: '#17c964',
        paddingAll: '20px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '訂單編號',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: orderNumber,
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    align: 'end',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '訂單類型',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: orderTypeText[order.orderType] || order.orderType,
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    align: 'end',
                  },
                ],
              },
              {
                type: 'separator',
                margin: 'md',
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '訂單金額',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: `$${order.total}`,
                    wrap: true,
                    color: '#17c964',
                    size: 'xl',
                    weight: 'bold',
                    align: 'end',
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
              label: '查看訂單',
              uri: confirmUrl,
            },
            color: '#17c964',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '如有任何問題，請聯繫店家',
                color: '#aaaaaa',
                size: 'xxs',
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
