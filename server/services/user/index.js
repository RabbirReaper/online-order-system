/**
 * 用戶服務入口文件
 * 匯總並導出所有用戶相關服務
 */

// 導入用戶相關服務
import * as authService from './authService.js';
import * as adminService from './adminService.js';
import * as userProfileService from './userProfile.js';

// 導出所有用戶服務
export const auth = authService;
export const admin = adminService;
export const profile = userProfileService;

// 簡單導出，方便直接調用
export const {
  login,
  register,
  logout,
  forgotPassword,
  resetPassword,
  verifyToken,
  changePassword
} = authService;

export const {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus,
  updateAdminPermissions,
  checkPermission
} = adminService;

export const {
  getUserProfile,
  updateUserProfile,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
  getAllUsers,
  getUserById,
  toggleUserStatus
} = userProfileService;
