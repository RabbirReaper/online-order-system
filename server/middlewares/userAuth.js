import mongoose from 'mongoose';
import User from '../models/User/User.js';

/**
 * 用戶身份驗證中介軟體
 * 檢查前台用戶是否已登入，並將用戶資訊附加到 req 物件上
 */
export const userAuthMiddleware = async (req, res, next) => {
  try {
    // 檢查 session 中是否有 userId
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: '請先登入'
      });
    }

    // 檢查 userId 是否有效
    if (!mongoose.Types.ObjectId.isValid(req.session.userId)) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: '無效的使用者憑證'
      });
    }

    // 從資料庫中獲取用戶資訊 (不包含密碼)
    const user = await User.findById(req.session.userId).select('-password');

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

    // 將用戶資訊附加到 req 物件上
    req.user = user;

    // 繼續執行下一個中介軟體或路由處理器
    next();
  } catch (error) {
    console.error('User authentication error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
