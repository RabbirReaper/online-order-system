/**
 * 身份驗證 middleware
 * 處理用戶和管理員的身份驗證
 */

import mongoose from 'mongoose'
import Admin from '../../models/User/Admin.js'
import User from '../../models/User/User.js'

/**
 * 統一的身份驗證 middleware
 * @param {String} userType - 用戶類型 ('admin' 或 'user')
 */
export const authenticate =
  (userType = 'admin') =>
  async (req, res, next) => {
    try {
      if (userType === 'admin') {
        // 管理員身份驗證
        if (!req.session?.adminId) {
          return res.status(401).json({
            success: false,
            message: '請先登入',
          })
        }

        // 驗證 adminId 格式
        if (!mongoose.Types.ObjectId.isValid(req.session.adminId)) {
          req.session.destroy()
          return res.status(401).json({
            success: false,
            message: '無效的使用者憑證',
          })
        }

        // 查詢管理員資料，包含新的 brand 和 store 字段
        const admin = await Admin.findById(req.session.adminId).select('role brand store isActive')

        if (!admin) {
          req.session.destroy()
          return res.status(401).json({
            success: false,
            message: '找不到管理員帳號',
          })
        }

        if (!admin.isActive) {
          req.session.destroy()
          return res.status(403).json({
            success: false,
            message: '此帳號已被停用',
          })
        }

        // 設置認證資訊到 req 物件
        req.auth = {
          id: admin._id,
          type: 'admin',
          role: admin.role,
          brand: admin.brand,
          store: admin.store,
        }
      } else if (userType === 'user') {
        // 用戶身份驗證
        if (!req.session?.userId) {
          return res.status(401).json({
            success: false,
            message: '請先登入',
          })
        }

        // 驗證 userId 格式
        if (!mongoose.Types.ObjectId.isValid(req.session.userId)) {
          req.session.destroy()
          return res.status(401).json({
            success: false,
            message: '無效的使用者憑證',
          })
        }

        // 查詢用戶資料
        const user = await User.findById(req.session.userId).select('-password')

        if (!user) {
          req.session.destroy()
          return res.status(401).json({
            success: false,
            message: '使用者不存在',
          })
        }

        if (!user.isActive) {
          req.session.destroy()
          return res.status(403).json({
            success: false,
            message: '帳號已被停用',
          })
        }

        // 設置認證資訊到 req 物件
        req.auth = {
          userId: user._id,
          type: 'user',
          brand: user.brand,
        }
      }

      next()
    } catch (error) {
      console.error('Authentication error:', error)
      return res.status(500).json({
        success: false,
        message: '伺服器錯誤',
      })
    }
  }

/**
 * 可選身份驗證 middleware - 支援匿名和登入用戶
 * @param {String} userType - 用戶類型 ('admin' 或 'user')
 */
export const optionalAuth =
  (userType = 'user') =>
  async (req, res, next) => {
    try {
      if (userType === 'user') {
        // 檢查是否有用戶 session
        if (req.session?.userId && mongoose.Types.ObjectId.isValid(req.session.userId)) {
          // 查詢用戶資料
          const user = await User.findById(req.session.userId).select('-password')

          if (user && user.isActive) {
            // 設置認證資訊到 req 物件
            req.auth = {
              userId: user._id,
              type: 'user',
              brand: user.brand,
            }
          }
        }
        // 如果沒有 session 或查詢失敗，繼續執行（匿名用戶）
        // req.auth 將為 undefined，在控制器中需要處理這種情況
      } else if (userType === 'admin') {
        // 管理員可選認證邏輯（如果需要的話）
        if (req.session?.adminId && mongoose.Types.ObjectId.isValid(req.session.adminId)) {
          const admin = await Admin.findById(req.session.adminId).select(
            'role brand store isActive',
          )

          if (admin && admin.isActive) {
            req.auth = {
              adminId: admin._id,
              type: 'admin',
              role: admin.role,
              brand: admin.brand,
              store: admin.store,
            }
          }
        }
      }

      next()
    } catch (error) {
      console.error('Optional authentication error:', error)
      // 可選認證失敗時不阻止請求繼續執行
      next()
    }
  }
