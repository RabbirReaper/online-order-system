/**
 * 菜單工具函數
 * 前端使用的菜單相關工具函數
 */

/**
 * 獲取菜單類型文字
 * @param {String} menuType - 菜單類型
 * @returns {String} 菜單類型文字
 */
export const getMenuTypeText = (menuType) => {
  const typeMap = {
    food: '現金購買餐點',
    cash_coupon: '現金購買預購券',
    point_exchange: '點數兌換',
  }
  return typeMap[menuType] || menuType
}

/**
 * 獲取菜單類型描述
 * @param {String} menuType - 菜單類型
 * @returns {String} 菜單類型描述
 */
export const getMenuTypeDescription = (menuType) => {
  const descriptions = {
    food: '顧客使用現金購買餐點，直接享用（支援價格覆蓋）',
    cash_coupon: '顧客使用現金購買預購券套餐，價格由套餐設定',
    point_exchange: '顧客使用點數兌換預購券套餐，價格由套餐設定',
  }
  return descriptions[menuType] || ''
}

/**
 * 獲取商品類型文字
 * @param {String} itemType - 商品類型
 * @returns {String} 商品類型文字
 */
export const getItemTypeText = (itemType) => {
  const typeMap = {
    dish: '餐點',
    bundle: '套餐',
  }
  return typeMap[itemType] || itemType
}

/**
 * 獲取商品類型標記樣式
 * @param {String} itemType - 商品類型
 * @returns {String} Bootstrap CSS 類名
 */
export const getItemTypeBadgeClass = (itemType) => {
  const classMap = {
    dish: 'bg-primary',
    bundle: 'bg-success',
  }
  return classMap[itemType] || 'bg-secondary'
}

/**
 * 格式化價格顯示
 * @param {Number} price - 價格
 * @returns {String} 格式化後的價格字串
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null) return '$0'
  return `$${price}`
}

/**
 * 格式化點數顯示
 * @param {Number} points - 點數
 * @returns {String} 格式化後的點數字串
 */
export const formatPoints = (points) => {
  if (points === undefined || points === null || points === 0) return '-'
  return `${points} 點`
}

/**
 * 計算菜單總商品數量
 * @param {Object} menu - 菜單物件
 * @returns {Number} 總商品數量
 */
export const countTotalItems = (menu) => {
  if (!menu || !menu.categories) return 0
  return menu.categories.reduce((total, category) => {
    return total + (category.items ? category.items.length : 0)
  }, 0)
}

/**
 * 計算菜單已啟用商品數量
 * @param {Object} menu - 菜單物件
 * @returns {Number} 已啟用商品數量
 */
export const countActiveItems = (menu) => {
  if (!menu || !menu.categories) return 0
  return menu.categories.reduce((total, category) => {
    if (!category.items) return total
    return total + category.items.filter((item) => item.isShowing).length
  }, 0)
}

/**
 * 按照順序排序分類
 * @param {Array} categories - 分類陣列
 * @returns {Array} 排序後的分類陣列
 */
export const sortCategories = (categories) => {
  if (!categories) return []
  return [...categories].sort((a, b) => a.order - b.order)
}

/**
 * 按照順序排序商品
 * @param {Array} items - 商品陣列
 * @returns {Array} 排序後的商品陣列
 */
export const sortItems = (items) => {
  if (!items) return []
  return [...items].sort((a, b) => a.order - b.order)
}

/**
 * 格式化日期顯示
 * @param {String} dateString - 日期字串
 * @returns {String} 格式化後的日期字串
 */
export const formatDate = (dateString) => {
  if (!dateString) return '無資料'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 獲取商品名稱
 * @param {Object} item - 商品物件
 * @param {Array} dishTemplates - 餐點模板陣列
 * @param {Array} bundles - 套餐陣列
 * @returns {String} 商品名稱
 */
export const getItemName = (item, dishTemplates = [], bundles = []) => {
  if (!item) return '未知商品'

  if (item.itemType === 'dish' && item.dishTemplate) {
    // 如果 dishTemplate 已經是物件，直接返回名稱
    if (typeof item.dishTemplate === 'object' && item.dishTemplate !== null) {
      return item.dishTemplate.name
    }
    // 如果是 ID，從陣列中查找
    const template = dishTemplates.find((t) => t._id === item.dishTemplate)
    return template ? template.name : '未知餐點'
  }

  if (item.itemType === 'bundle' && item.bundle) {
    // 如果 bundle 已經是物件，直接返回名稱
    if (typeof item.bundle === 'object' && item.bundle !== null) {
      return item.bundle.name
    }
    // 如果是 ID，從陣列中查找
    const bundle = bundles.find((b) => b._id === item.bundle)
    return bundle ? bundle.name : '未知套餐'
  }

  return '未知商品'
}

/**
 * 獲取商品描述
 * @param {Object} item - 商品物件
 * @param {Array} dishTemplates - 餐點模板陣列
 * @param {Array} bundles - 套餐陣列
 * @returns {String} 商品描述
 */
export const getItemDescription = (item, dishTemplates = [], bundles = []) => {
  if (!item) return ''

  if (item.itemType === 'dish' && item.dishTemplate) {
    if (typeof item.dishTemplate === 'object' && item.dishTemplate !== null) {
      return item.dishTemplate.description || ''
    }
    const template = dishTemplates.find((t) => t._id === item.dishTemplate)
    return template ? template.description || '' : ''
  }

  if (item.itemType === 'bundle' && item.bundle) {
    if (typeof item.bundle === 'object' && item.bundle !== null) {
      return item.bundle.description || ''
    }
    const bundle = bundles.find((b) => b._id === item.bundle)
    return bundle ? bundle.description || '' : ''
  }

  return ''
}

/**
 * 獲取商品圖片
 * @param {Object} item - 商品物件
 * @param {Array} dishTemplates - 餐點模板陣列
 * @param {Array} bundles - 套餐陣列
 * @returns {String} 商品圖片URL
 */
export const getItemImage = (item, dishTemplates = [], bundles = []) => {
  if (!item) return '/placeholder.jpg'

  if (item.itemType === 'dish' && item.dishTemplate) {
    if (typeof item.dishTemplate === 'object' && item.dishTemplate !== null) {
      return item.dishTemplate.image?.url || '/placeholder.jpg'
    }
    const template = dishTemplates.find((t) => t._id === item.dishTemplate)
    return template && template.image && template.image.url
      ? template.image.url
      : '/placeholder.jpg'
  }

  if (item.itemType === 'bundle' && item.bundle) {
    if (typeof item.bundle === 'object' && item.bundle !== null) {
      return item.bundle.image?.url || '/placeholder.jpg'
    }
    const bundle = bundles.find((b) => b._id === item.bundle)
    return bundle && bundle.image && bundle.image.url ? bundle.image.url : '/placeholder.jpg'
  }

  return '/placeholder.jpg'
}

/**
 * 獲取商品原始價格
 * @param {Object} item - 商品物件
 * @param {Array} dishTemplates - 餐點模板陣列
 * @param {Array} bundles - 套餐陣列
 * @returns {Number} 商品原始價格
 */
export const getItemOriginalPrice = (item, dishTemplates = [], bundles = []) => {
  if (!item) return 0

  if (item.itemType === 'dish' && item.dishTemplate) {
    if (typeof item.dishTemplate === 'object' && item.dishTemplate !== null) {
      return item.dishTemplate.basePrice || 0
    }
    const template = dishTemplates.find((t) => t._id === item.dishTemplate)
    return template ? template.basePrice || 0 : 0
  }

  if (item.itemType === 'bundle' && item.bundle) {
    if (typeof item.bundle === 'object' && item.bundle !== null) {
      return item.bundle.cashPrice?.selling || item.bundle.cashPrice?.original || 0
    }
    const bundle = bundles.find((b) => b._id === item.bundle)
    return bundle ? bundle.cashPrice?.selling || bundle.cashPrice?.original || 0 : 0
  }

  return 0
}

/**
 * 獲取商品原始點數
 * @param {Object} item - 商品物件
 * @param {Array} dishTemplates - 餐點模板陣列
 * @param {Array} bundles - 套餐陣列
 * @returns {Number} 商品原始點數
 */
export const getItemOriginalPoints = (item, dishTemplates = [], bundles = []) => {
  if (!item) return 0

  if (item.itemType === 'bundle' && item.bundle) {
    if (typeof item.bundle === 'object' && item.bundle !== null) {
      return item.bundle.pointPrice?.selling || item.bundle.pointPrice?.original || 0
    }
    const bundle = bundles.find((b) => b._id === item.bundle)
    return bundle ? bundle.pointPrice?.selling || bundle.pointPrice?.original || 0 : 0
  }

  // 餐點暫時沒有點數價格
  return 0
}

/**
 * 驗證菜單表單
 * @param {Object} formData - 表單資料
 * @returns {Object} 驗證結果 { isValid: boolean, errors: object }
 */
export const validateMenuForm = (formData) => {
  const errors = {
    name: '',
    menuType: '',
    categories: [],
  }
  let isValid = true

  // 驗證菜單名稱
  if (!formData.name || !formData.name.trim()) {
    errors.name = '請輸入菜單名稱'
    isValid = false
  }

  // 驗證菜單類型
  if (!formData.menuType) {
    errors.menuType = '請選擇菜單類型'
    isValid = false
  }

  // 驗證分類
  if (!formData.categories || formData.categories.length === 0) {
    isValid = false
  } else {
    formData.categories.forEach((category, categoryIndex) => {
      if (!errors.categories[categoryIndex]) {
        errors.categories[categoryIndex] = { items: [] }
      }

      // 驗證分類名稱
      if (!category.name || !category.name.trim()) {
        errors.categories[categoryIndex].name = '請輸入分類名稱'
        isValid = false
      }

      // 驗證商品
      if (!category.items || category.items.length === 0) {
        isValid = false
      } else {
        category.items.forEach((item, itemIndex) => {
          if (!errors.categories[categoryIndex].items[itemIndex]) {
            errors.categories[categoryIndex].items[itemIndex] = {}
          }

          if (formData.menuType === 'food') {
            if (!item.dishTemplate) {
              errors.categories[categoryIndex].items[itemIndex].dishTemplate = '請選擇餐點'
              isValid = false
            }
          } else {
            if (!item.bundle) {
              errors.categories[categoryIndex].items[itemIndex].bundle = '請選擇套餐'
              isValid = false
            }
          }
        })
      }
    })
  }

  return { isValid, errors }
}
