import * as adminAuthService from '../../services/user/index.js';
import { asyncHandler } from '../../middlewares/error.js';

/**
 * 管理員登入
 */
export const adminLogin = asyncHandler(async (req, res) => {
  const { name, password } = req.body;

  const result = await adminAuthService.adminLogin({ name, password }, req.session);

  res.json({
    success: true,
    message: '登入成功',
    role: result.role,
    manage: result.manage
  });
});

/**
 * 管理員登出
 */
export const adminLogout = asyncHandler(async (req, res) => {
  await adminAuthService.adminLogout(req.session);

  res.clearCookie('connect.sid');

  res.json({
    success: true,
    message: '登出成功'
  });
});

/**
 * 修改管理員密碼
 */
export const changeAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.auth.id; // 從認證中間件獲取

  const result = await adminAuthService.changeAdminPassword(adminId, currentPassword, newPassword);

  res.json({
    success: true,
    message: '密碼修改成功'
  });
});

/**
 * 檢查管理員登入狀態
 */
export const checkAdminStatus = asyncHandler(async (req, res) => {
  const status = await adminAuthService.checkAdminStatus(req.session);

  res.json({
    success: true,
    ...status
  });
});

/**
 * 獲取當前管理員資料
 */
export const getProfile = asyncHandler(async (req, res) => {
  const admin = await adminAuthService.getCurrentAdminProfile(req.session);

  res.json({
    success: true,
    admin
  });
});

/**
 * 更新當前管理員資料
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const updateData = req.body;

  const updatedAdmin = await adminAuthService.updateCurrentAdminProfile(req.session, updateData);

  res.json({
    success: true,
    message: '管理員資料更新成功',
    admin: updatedAdmin
  });
});
