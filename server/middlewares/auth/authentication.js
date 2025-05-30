/**
 * 身份驗證 middleware
 * 處理用戶和管理員的身份驗證
 */

import mongoose from 'mongoose';
import Admin from '../../models/User/Admin.js';
import User from '../../models/User/User.js';

/**
 * 統一的身份驗證 middleware
 * @param {String} userType - 用戶類型 ('admin' 或 'user')
 */
export const authenticate = (userType = 'admin') => async (req, res, next) => {
  try {
    if (userType === 'admin') {
      // 管理員身份驗證
      if (!req.session?.adminId) {
        return res.status(401).json({
          success: false,
          message: '請先登入'
        });
      }

      // 驗證 adminId 格式
      if (!mongoose.Types.ObjectId.isValid(req.session.adminId)) {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          message: '無效的使用者憑證'
        });
      }

      // 查詢管理員資料，包含新的 brand 和 store 字段
      const admin = await Admin.findById(req.session.adminId)
        .select('role brand store isActive');

      if (!admin) {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          message: '找不到管理員帳號'
        });
      }

      if (!admin.isActive) {
        req.session.destroy();
        return res.status(403).json({
          success: false,
          message: '此帳號已被停用'
        });
      }

      // 設置認證資訊到 req 物件
      req.auth = {
        id: admin._id,
        type: 'admin',
        role: admin.role,
        brand: admin.brand,
        store: admin.store
      };

    } else if (userType === 'user') {
      // 用戶身份驗證
      if (!req.session?.userId) {
        return res.status(401).json({
          success: false,
          message: '請先登入'
        });
      }

      // 驗證 userId 格式
      if (!mongoose.Types.ObjectId.isValid(req.session.userId)) {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          message: '無效的使用者憑證'
        });
      }

      // 查詢用戶資料
      const user = await User.findById(req.session.userId)
        .select('-password');

      if (!user) {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          message: '使用者不存在'
        });
      }

      if (!user.isActive) {
        req.session.destroy();
        return res.status(403).json({
          success: false,
          message: '帳號已被停用'
        });
      }

      // 設置認證資訊到 req 物件
      req.auth = {
        id: user._id,
        type: 'user',
        brand: user.brand
      };
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
