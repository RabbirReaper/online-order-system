/**
 * 集中式錯誤處理中介軟體
 * 處理路由處理器中捕獲的錯誤
 */
export const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err)

  // 如果已經設置了狀態碼和回應，則直接返回
  if (res.headersSent) {
    return next(err)
  }

  // 自定義錯誤處理
  if (err.name === 'ValidationError') {
    // Mongoose 驗證錯誤
    const errors = {}

    for (const field in err.errors) {
      errors[field] = err.errors[field].message
    }

    return res.status(400).json({
      success: false,
      message: '資料驗證失敗',
      errors,
    })
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    // 無效的ObjectId
    return res.status(400).json({
      success: false,
      message: '無效的ID格式',
    })
  }

  if (err.code === 11000) {
    // MongoDB 唯一索引衝突
    const field = Object.keys(err.keyValue)[0]
    const value = err.keyValue[field]

    return res.status(409).json({
      success: false,
      message: `${field} '${value}' 已存在`,
    })
  }

  // 自定義錯誤
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
  }

  // 預設錯誤回應
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? '伺服器錯誤' : err.message,
  })
}

/**
 * 404 錯誤處理中介軟體
 * 處理所有未匹配的路由請求
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: '找不到請求的資源',
  })
}

/**
 * 自定義錯誤類別
 * 用於在路由處理器中拋出特定錯誤
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 異步路由處理包裝器
 * 自動捕獲異步路由處理器中的錯誤並傳遞給錯誤處理中介軟體
 * @param {Function} fn - 異步路由處理函數
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
