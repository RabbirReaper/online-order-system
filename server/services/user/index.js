/**
 * 用戶服務入口文件
 * 匯總並導出所有用戶相關服務
 */

// 導入用戶相關服務
import * as userAuthService from './userAuthService.js';
import * as adminAuthService from './adminAuthService.js';
import * as adminService from './adminService.js';
import * as userProfileService from './userProfile.js';

// 導出所有用戶服務
export const userAuth = userAuthService;
export const adminAuth = adminAuthService;
export const admin = adminService;
export const profile = userProfileService;

// 簡單導出用戶認證服務，方便直接調用
export const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  sendPhoneVerification,
  verifyPhoneCode,
  checkUserStatus
} = userAuthService;

// 簡單導出管理員認證服務，方便直接調用
export const {
  adminLogin,
  adminLogout,
  changeAdminPassword,
  checkAdminStatus
} = adminAuthService;

// 簡單導出管理員服務，方便直接調用
export const {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus
} = adminService;

// 簡單導出用戶資料服務，方便直接調用
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
