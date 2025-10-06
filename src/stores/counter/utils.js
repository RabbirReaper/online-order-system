// 台灣時區日期處理工具函數
export const getTaiwanDate = (date = null) => {
  if (date) {
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date
    }
    const targetDate = new Date(date)
    return targetDate.toISOString().split('T')[0]
  }
  const now = new Date()
  const taiwanTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 8 * 3600000)
  return taiwanTime.toISOString().split('T')[0]
}

export const getTaiwanDateTime = (date = null) => {
  const targetDate = date ? new Date(date) : new Date()
  const taiwanTime = new Date(
    targetDate.getTime() + targetDate.getTimezoneOffset() * 60000 + 8 * 3600000,
  )
  return taiwanTime
}

// 生成購物車項目的唯一鍵值
export const generateItemKey = (templateId, options, note = '') => {
  let optionsKey = ''
  if (options && options.length > 0) {
    optionsKey = options
      .map((category) => {
        const selections = category.selections
          .map((s) => s.optionId)
          .sort()
          .join('-')
        return `${category.optionCategoryId}:${selections}`
      })
      .sort()
      .join('|')
  }
  const noteKey = note ? `:${note}` : ''
  return `${templateId}:${optionsKey}${noteKey}`
}

// 生成套餐項目的唯一鍵值
export const generateBundleKey = (bundleId, note = '') => {
  const noteKey = note ? `:${note}` : ''
  return `bundle:${bundleId}${noteKey}`
}

// 生成唯一的購物車項目 ID
export const generateUniqueItemId = () => {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 格式化時間
export const formatTime = (dateTime) => {
  const date = new Date(dateTime)
  return date.toLocaleString('zh-TW', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Taipei',
  })
}

// 格式化日期時間
export const formatDateTime = (dateTime) => {
  const date = new Date(dateTime)
  return date.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
  })
}

// 獲取取餐方式樣式
export const getPickupMethodClass = (method) => {
  const classMap = {
    內用: 'badge bg-primary',
    外帶: 'badge bg-success',
    外送: 'badge bg-warning text-dark',
  }
  return classMap[method] || 'badge bg-secondary'
}

// 獲取訂單狀態樣式
export const getStatusClass = (status) => {
  const classMap = {
    unpaid: 'badge bg-warning text-dark',
    paid: 'badge bg-success',
    cancelled: 'badge bg-danger',
  }
  return classMap[status] || 'badge bg-secondary'
}

// 格式化訂單狀態
export const formatStatus = (status) => {
  const statusMap = {
    unpaid: '未結帳',
    paid: '已完成',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}
