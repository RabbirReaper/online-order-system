import * as cashFlowService from '../../services/store/cashFlowService.js'
import { asyncHandler } from '../../middlewares/error.js'

// 獲取店舖的現金流記錄
export const getCashFlowsByStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params
  const options = {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    type: req.query.type,
    categoryId: req.query.categoryId,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    search: req.query.search
  }

  const result = await cashFlowService.getCashFlowsByStore(storeId, options)

  res.json({
    success: true,
    message: '獲取現金流記錄成功',
    ...result
  })
})

// 根據ID獲取記帳記錄
export const getCashFlowById = asyncHandler(async (req, res) => {
  const { cashFlowId } = req.params
  const cashFlow = await cashFlowService.getCashFlowById(cashFlowId)

  res.json({
    success: true,
    message: '獲取記帳記錄詳情成功',
    data: cashFlow
  })
})

// 創建記帳記錄
export const createCashFlow = asyncHandler(async (req, res) => {
  // 從認證中間件獲取管理員ID
  const adminId = req.auth.id || req.auth.adminId
  
  if (!adminId) {
    return res.status(401).json({
      success: false,
      message: '無法獲取管理員身份資訊'
    })
  }

  const cashFlow = await cashFlowService.createCashFlow(req.body, adminId)

  res.status(201).json({
    success: true,
    message: '創建記帳記錄成功',
    data: cashFlow
  })
})

// 更新記帳記錄
export const updateCashFlow = asyncHandler(async (req, res) => {
  const { cashFlowId } = req.params
  // 從認證中間件獲取管理員ID
  const adminId = req.auth.id || req.auth.adminId

  if (!adminId) {
    return res.status(401).json({
      success: false,
      message: '無法獲取管理員身份資訊'
    })
  }

  const updatedCashFlow = await cashFlowService.updateCashFlow(cashFlowId, req.body, adminId)

  res.json({
    success: true,
    message: '更新記帳記錄成功',
    data: updatedCashFlow
  })
})

// 刪除記帳記錄
export const deleteCashFlow = asyncHandler(async (req, res) => {
  const { cashFlowId } = req.params
  await cashFlowService.deleteCashFlow(cashFlowId)

  res.json({
    success: true,
    message: '刪除記帳記錄成功'
  })
})

// 獲取現金流統計資料
export const getCashFlowStatistics = asyncHandler(async (req, res) => {
  const { storeId } = req.params
  const options = {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    groupBy: req.query.groupBy || 'month'
  }

  const statistics = await cashFlowService.getCashFlowStatistics(storeId, options)

  res.json({
    success: true,
    message: '獲取統計資料成功',
    data: statistics
  })
})

// 導出現金流流水帳 (CSV)
export const exportCashFlowCSV = asyncHandler(async (req, res) => {
  const { storeId } = req.params
  const options = {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    type: req.query.type,
    categoryId: req.query.categoryId
  }

  const csvContent = await cashFlowService.exportCashFlowCSV(storeId, options)

  // 設定響應標頭
  const filename = `cash-flow-${storeId}-${new Date().toISOString().split('T')[0]}.csv`
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  res.send(csvContent)
})