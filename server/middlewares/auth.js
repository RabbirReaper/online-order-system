import mongoose from 'mongoose';
import Admin from '../models/User/Admin.js';

/**
 * 管理員身份驗證中介軟體
 * 檢查用戶是否已登入，並將用戶資訊附加到 req 物件上
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // 檢查 session 中是否有 user_id
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({
        success: false,
        message: '請先登入'
      });
    }

    // 檢查 user_id 是否有效
    if (!mongoose.Types.ObjectId.isValid(req.session.user_id)) {
      return res.status(401).json({
        success: false,
        message: '無效的使用者憑證'
      });
    }

    // 查找管理員並加載品牌資訊
    const admin = await Admin.findById(req.session.user_id).select('role brand');

    if (!admin) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: '找不到管理員帳號'
      });
    }

    // 將管理員角色附加到 req 物件上，以便在後續路由中使用
    if (!req.session.role) {
      return res.status(401).json({
        success: false,
        message: '無效的使用者憑證'
      });
    }

    // 將用戶資訊附加到 req 物件上
    req.adminId = req.session.user_id;
    req.adminRole = req.session.role;
    req.adminManage = req.session.manage || [];

    // 如果不是boss角色，設置品牌ID
    if (admin.role !== 'boss' && admin.brand) {
      req.adminBrand = admin.brand;
    }

    // 繼續執行下一個中介軟體或路由處理器
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
