/**
 * 記帳管理服務
 * 處理現金流記錄相關業務邏輯
 */

import CashFlow from '../../models/Store/CashFlow.js'
import CashFlowCategory from '../../models/Store/CashFlowCategory.js'
import Store from '../../models/Store/Store.js'
import Admin from '../../models/User/Admin.js'
import { AppError } from '../../middlewares/error.js'

/**
 * 獲取店舖的現金流記錄
 * @param {String} storeId - 店舖ID
 * @param {Object} options - 查詢選項
 * @returns {Promise<Object>} 記帳記錄和分頁資訊
 */
export const getCashFlowsByStore = async (storeId, options = {}) => {
  const {
    startDate,
    endDate,
    type,
    categoryId,
    page = 1,
    limit = 20,
    search
  } = options

  // 驗證店舖是否存在
  const store = await Store.findById(storeId)
  if (!store) {
    throw new AppError('店舖不存在', 404)
  }

  // 構建查詢條件
  const queryConditions = { store: storeId }

  // 日期範圍查詢
  if (startDate || endDate) {
    queryConditions.time = {}
    if (startDate) {
      queryConditions.time.$gte = new Date(startDate)
    }
    if (endDate) {
      // 將結束日期設為當日的23:59:59
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      queryConditions.time.$lte = endDateTime
    }
  }

  // 類型過濾
  if (type && ['income', 'expense'].includes(type)) {
    queryConditions.type = type
  }

  // 分類過濾
  if (categoryId) {
    queryConditions.category = categoryId
  }

  // 搜尋功能（名稱或描述）
  if (search) {
    queryConditions.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ]
  }

  // 計算分頁
  const skip = (page - 1) * limit
  const total = await CashFlow.countDocuments(queryConditions)

  // 獲取記錄
  const cashFlows = await CashFlow.find(queryConditions)
    .populate('category', 'name type')
    .populate('admin', 'name email')
    .populate('brand', 'name')
    .populate('store', 'name')
    .sort({ time: -1 })
    .skip(skip)
    .limit(limit)

  return {
    data: cashFlows,
    pagination: {
      current: page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

/**
 * 根據ID獲取記帳記錄
 * @param {String} cashFlowId - 記帳記錄ID
 * @returns {Promise<Object>} 記帳記錄
 */
export const getCashFlowById = async (cashFlowId) => {
  const cashFlow = await CashFlow.findById(cashFlowId)
    .populate('category', 'name type')
    .populate('admin', 'name email')
    .populate('brand', 'name')
    .populate('store', 'name')

  if (!cashFlow) {
    throw new AppError('記帳記錄不存在', 404)
  }

  return cashFlow
}

/**
 * 創建記帳記錄
 * @param {Object} cashFlowData - 記帳數據
 * @param {String} adminId - 執行操作的管理員ID
 * @returns {Promise<Object>} 創建的記帳記錄
 */
export const createCashFlow = async (cashFlowData, adminId) => {
  // 基本驗證
  if (!cashFlowData.name || !cashFlowData.amount || !cashFlowData.category || !cashFlowData.store) {
    throw new AppError('名稱、金額、分類和店舖為必填欄位', 400)
  }

  if (cashFlowData.amount <= 0) {
    throw new AppError('金額必須大於0', 400)
  }

  if (!['income', 'expense'].includes(cashFlowData.type)) {
    throw new AppError('類型必須為 income 或 expense', 400)
  }

  // 驗證店舖是否存在
  const store = await Store.findById(cashFlowData.store).populate('brand')
  if (!store) {
    throw new AppError('店舖不存在', 404)
  }

  // 驗證分類是否存在且屬於該店舖
  const category = await CashFlowCategory.findOne({
    _id: cashFlowData.category,
    store: cashFlowData.store
  })
  if (!category) {
    throw new AppError('分類不存在或不屬於該店舖', 400)
  }

  // 驗證類型是否與分類類型一致
  if (cashFlowData.type !== category.type) {
    throw new AppError('記帳類型必須與分類類型一致', 400)
  }

  // 驗證管理員是否存在
  const admin = await Admin.findById(adminId)
  if (!admin) {
    throw new AppError('管理員不存在', 404)
  }

  // 設定品牌ID和管理員ID
  cashFlowData.brand = store.brand._id
  cashFlowData.admin = adminId

  // 如果沒有指定時間，使用當前時間
  if (!cashFlowData.time) {
    cashFlowData.time = new Date()
  }

  // 創建記帳記錄
  const cashFlow = new CashFlow(cashFlowData)
  await cashFlow.save()

  // 返回完整的記帳記錄
  return await getCashFlowById(cashFlow._id)
}

/**
 * 更新記帳記錄
 * @param {String} cashFlowId - 記帳記錄ID
 * @param {Object} updateData - 更新數據
 * @param {String} adminId - 執行操作的管理員ID
 * @returns {Promise<Object>} 更新後的記帳記錄
 */
export const updateCashFlow = async (cashFlowId, updateData, adminId) => {
  const cashFlow = await CashFlow.findById(cashFlowId)
  if (!cashFlow) {
    throw new AppError('記帳記錄不存在', 404)
  }

  // 驗證管理員是否存在
  const admin = await Admin.findById(adminId)
  if (!admin) {
    throw new AppError('管理員不存在', 404)
  }

  // 驗證金額
  if (updateData.amount !== undefined && updateData.amount <= 0) {
    throw new AppError('金額必須大於0', 400)
  }

  // 驗證類型
  if (updateData.type && !['income', 'expense'].includes(updateData.type)) {
    throw new AppError('類型必須為 income 或 expense', 400)
  }

  // 如果更新分類，驗證分類是否存在且屬於該店舖
  if (updateData.category) {
    const category = await CashFlowCategory.findOne({
      _id: updateData.category,
      store: cashFlow.store
    })
    if (!category) {
      throw new AppError('分類不存在或不屬於該店舖', 400)
    }

    // 驗證類型是否與分類類型一致
    const recordType = updateData.type || cashFlow.type
    if (recordType !== category.type) {
      throw new AppError('記帳類型必須與分類類型一致', 400)
    }
  }

  // 不允許修改 brand, store
  delete updateData.brand
  delete updateData.store
  
  // 更新操作者
  updateData.admin = adminId

  // 更新記帳記錄
  const updatedCashFlow = await CashFlow.findByIdAndUpdate(
    cashFlowId,
    updateData,
    { new: true }
  ).populate('category', 'name type')
   .populate('admin', 'name email')
   .populate('brand', 'name')
   .populate('store', 'name')

  return updatedCashFlow
}

/**
 * 刪除記帳記錄
 * @param {String} cashFlowId - 記帳記錄ID
 * @returns {Promise<Boolean>} 刪除結果
 */
export const deleteCashFlow = async (cashFlowId) => {
  const cashFlow = await CashFlow.findById(cashFlowId)
  if (!cashFlow) {
    throw new AppError('記帳記錄不存在', 404)
  }

  await CashFlow.findByIdAndDelete(cashFlowId)
  return true
}

/**
 * 獲取現金流統計資料
 * @param {String} storeId - 店舖ID
 * @param {Object} options - 統計選項
 * @returns {Promise<Object>} 統計資料
 */
export const getCashFlowStatistics = async (storeId, options = {}) => {
  const { startDate, endDate, groupBy = 'month' } = options

  // 驗證店舖是否存在
  const store = await Store.findById(storeId)
  if (!store) {
    throw new AppError('店舖不存在', 404)
  }

  // 構建查詢條件
  const matchConditions = { store: storeId }
  
  if (startDate || endDate) {
    matchConditions.time = {}
    if (startDate) {
      matchConditions.time.$gte = new Date(startDate)
    }
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      matchConditions.time.$lte = endDateTime
    }
  }

  // 總收入、總支出統計
  const [totalStats] = await CashFlow.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        totalExpense: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        },
        totalTransactions: { $sum: 1 }
      }
    }
  ])

  // 按分類統計
  const categoryStats = await CashFlow.aggregate([
    { $match: matchConditions },
    {
      $lookup: {
        from: 'cashflowcategories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    { $unwind: '$categoryInfo' },
    {
      $group: {
        _id: {
          categoryId: '$category',
          categoryName: '$categoryInfo.name',
          categoryType: '$categoryInfo.type'
        },
        totalAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } }
  ])

  // 按時間統計（支援不同的分組方式）
  let timeGroupFormat = {}
  switch (groupBy) {
    case 'day':
      timeGroupFormat = {
        year: { $year: '$time' },
        month: { $month: '$time' },
        day: { $dayOfMonth: '$time' }
      }
      break
    case 'week':
      timeGroupFormat = {
        year: { $year: '$time' },
        week: { $week: '$time' }
      }
      break
    case 'month':
    default:
      timeGroupFormat = {
        year: { $year: '$time' },
        month: { $month: '$time' }
      }
      break
  }

  const timeStats = await CashFlow.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: timeGroupFormat,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        totalExpense: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        },
        transactionCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ])

  return {
    summary: {
      totalIncome: totalStats?.totalIncome || 0,
      totalExpense: totalStats?.totalExpense || 0,
      netIncome: (totalStats?.totalIncome || 0) - (totalStats?.totalExpense || 0),
      totalTransactions: totalStats?.totalTransactions || 0
    },
    categoryStats,
    timeStats
  }
}

/**
 * 導出現金流流水帳 (CSV格式)
 * @param {String} storeId - 店舖ID
 * @param {Object} options - 導出選項
 * @returns {Promise<String>} CSV字符串
 */
export const exportCashFlowCSV = async (storeId, options = {}) => {
  const { startDate, endDate, type, categoryId } = options

  // 驗證店舖是否存在
  const store = await Store.findById(storeId)
  if (!store) {
    throw new AppError('店舖不存在', 404)
  }

  // 構建查詢條件
  const queryConditions = { store: storeId }

  // 日期範圍查詢
  if (startDate || endDate) {
    queryConditions.time = {}
    if (startDate) {
      queryConditions.time.$gte = new Date(startDate)
    }
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      queryConditions.time.$lte = endDateTime
    }
  }

  // 類型過濾
  if (type && ['income', 'expense'].includes(type)) {
    queryConditions.type = type
  }

  // 分類過濾
  if (categoryId) {
    queryConditions.category = categoryId
  }

  // 獲取所有記錄（不分頁）
  const cashFlows = await CashFlow.find(queryConditions)
    .populate('category', 'name type')
    .populate('admin', 'name')
    .sort({ time: -1 })

  // 構建CSV內容
  const csvHeaders = ['日期', '類型', '分類', '金額', '名稱', '描述', '操作人員']
  
  // 格式化數據
  const csvRows = cashFlows.map(flow => {
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }

    const formatType = (type) => {
      return type === 'income' ? '收入' : '支出'
    }

    return [
      formatDate(flow.time),
      formatType(flow.type),
      flow.category?.name || '未分類',
      flow.amount,
      flow.name,
      flow.description || '',
      flow.admin?.name || ''
    ]
  })

  // 組合CSV字符串
  const csvContent = [csvHeaders, ...csvRows]
    .map(row => 
      row.map(field => {
        // 處理包含逗號、引號或換行的字段
        const stringField = String(field)
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`
        }
        return stringField
      }).join(',')
    )
    .join('\n')

  // 添加UTF-8 BOM以支援Excel正確顯示中文
  return '\ufeff' + csvContent
}