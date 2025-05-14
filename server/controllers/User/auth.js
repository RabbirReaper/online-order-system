import bcrypt from 'bcrypt';
import Admin from '../../models/User/Admin.js';
import User from '../../models/User/User.js';

// 管理員登入
export const authLogin = async (req, res) => {
  try {
    const { name, password } = req.body;

    const admin = await Admin.findOne({ name }).select('+password').lean();

    if (!admin) {
      return res.status(401).json({ success: false, message: '用戶名或密碼錯誤' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: '用戶名或密碼錯誤' });
    }

    // 設置 session
    req.session.adminId = admin._id;
    req.session.adminRole = admin.role;

    return res.json({
      success: true,
      message: '登入成功',
      role: admin.role
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
};

// 修改密碼
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.auth.id; // 從新的 auth 物件取得

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '缺少必要欄位'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: '新密碼長度至少需要8個字元'
      });
    }

    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '找不到用戶'
      });
    }

    const validPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: '當前密碼不正確'
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, admin.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: '新密碼不能與當前密碼相同'
      });
    }

    admin.password = newPassword;
    await admin.save();

    return res.json({
      success: true,
      message: '密碼修改成功'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 檢查管理員登入狀態
export const checkAdminLoginStatus = async (req, res) => {
  try {
    if (req.session.adminId) {
      const admin = await Admin.findById(req.session.adminId).select('role');
      if (admin) {
        return res.json({
          success: true,
          loggedIn: true,
          role: admin.role
        });
      }
    }

    return res.json({
      success: true,
      loggedIn: false,
      role: null
    });
  } catch (error) {
    console.error('Check status error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 檢查用戶登入狀態
export const checkUserLoginStatus = async (req, res) => {
  try {
    if (req.session.userId) {
      return res.json({
        success: true,
        loggedIn: true,
        role: 'customer'
      });
    }

    return res.json({
      success: true,
      loggedIn: false,
      role: null
    });
  } catch (error) {
    console.error('Check status error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
