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

// 創建管理員帳號
export const createAdmin = async (req, res) => {
  try {
    const { name, password, role, brand, manage } = req.body;

    // 檢查必要欄位
    if (!name || !password || !role) {
      return res.status(400).json({
        success: false,
        message: '缺少必要欄位'
      });
    }

    // 檢查用戶名是否已存在
    const existingAdmin = await Admin.findOne({ name }).lean();
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: '此用戶名已被使用'
      });
    }

    // 驗證角色
    const validRoles = ['boss', 'brand_admin', 'store_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: '角色無效'
      });
    }

    // 如果不是 boss，需要指定品牌
    if (role !== 'boss' && !brand) {
      return res.status(400).json({
        success: false,
        message: '非 boss 角色必須指定品牌'
      });
    }

    // 創建管理員
    const newAdmin = new Admin({
      name,
      password,
      role,
      brand: role === 'boss' ? undefined : brand,
      manage: manage || []
    });

    await newAdmin.save();

    // 移除密碼後返回
    const adminData = newAdmin.toObject();
    delete adminData.password;

    return res.status(201).json({
      success: true,
      message: '管理員創建成功',
      admin: adminData
    });

  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 登出
export const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '登出失敗'
        });
      }

      res.clearCookie('connect.sid');

      return res.json({
        success: true,
        message: '登出成功'
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
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
