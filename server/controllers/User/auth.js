import bcrypt from 'bcrypt';
import Admin from '../../models/User/Admin.js';
import mongoose from 'mongoose';

// 管理員登入
export const authLogin = async (req, res) => {
  try {
    const { name, password } = req.body;

    // lean() 加快查詢，避免不必要 Mongoose 實例開銷
    const admin = await Admin.findOne({ name }).select('+password').lean();

    if (!admin) {
      return res.status(401).json({ success: false, message: '用戶名或密碼錯誤' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: '用戶名或密碼錯誤' });
    }

    // 建立 Session
    req.session.user_id = admin._id;
    req.session.role = admin.role;

    // 安全處理 manage 欄位
    const manageInfo = Array.isArray(admin.manage)
      ? admin.manage.map(m => ({
        store: m.store,
        permission: m.permission
      }))
      : [];

    req.session.manage = manageInfo;

    return res.json({
      success: true,
      role: admin.role,
      manage: manageInfo
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
};

// 創建管理員帳號
export const createAdmin = async (req, res) => {
  try {
    const { name, password, role, manage } = req.body;

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

    // 檢查角色是否有效
    const validRoles = ['boss', 'brain_admin', 'store_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: '角色無效'
      });
    }

    // 檢查 manage 欄位
    if (role !== 'boss' && (!manage || !Array.isArray(manage) || manage.length === 0)) {
      return res.status(400).json({
        success: false,
        message: '非 boss 角色必須指定管理的店舖'
      });
    }

    // 驗證每個 manage 項目
    if (Array.isArray(manage)) {
      for (const item of manage) {
        // 檢查 store 是否為有效的 ObjectId
        if (!item.store || !mongoose.Types.ObjectId.isValid(item.store)) {
          return res.status(400).json({
            success: false,
            message: '無效的店舖 ID'
          });
        }

        // 檢查權限
        if (!item.permission || !Array.isArray(item.permission) || item.permission.length === 0) {
          return res.status(400).json({
            success: false,
            message: '必須指定至少一個權限'
          });
        }

        // 檢查每個權限是否有效
        const validPermissions = ['order_system', 'view_reports', 'edit_backend', 'manage_staff'];
        for (const perm of item.permission) {
          if (!validPermissions.includes(perm)) {
            return res.status(400).json({
              success: false,
              message: `無效的權限: ${perm}`
            });
          }
        }
      }
    }

    // 密碼加密
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 創建管理員
    const newAdmin = new Admin({
      name,
      password: hashedPassword,
      role,
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
    // 清除 session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '登出失敗'
        });
      }

      // 清除 cookie
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
    const adminId = req.session.user_id;

    // 檢查用戶是否已登入
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: '請先登入'
      });
    }

    // 檢查請求是否包含必要欄位
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '缺少必要欄位'
      });
    }

    // 檢查新密碼長度與複雜度
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: '新密碼長度至少需要8個字元'
      });
    }

    // 查詢管理員資料（需要包含密碼欄位）
    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '找不到用戶'
      });
    }

    // 驗證當前密碼是否正確
    const validPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: '當前密碼不正確'
      });
    }

    // 確保新舊密碼不同
    const isSamePassword = await bcrypt.compare(newPassword, admin.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: '新密碼不能與當前密碼相同'
      });
    }

    // 加密新密碼
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 更新密碼
    admin.password = hashedPassword;
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
