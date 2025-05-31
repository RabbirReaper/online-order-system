import * as adminService from '../../services/user/index.js';
import { asyncHandler } from '../../middlewares/error.js';
import Admin from '../../models/User/Admin.js';

// 獲取所有管理員
export const getAllAdmins = asyncHandler(async (req, res) => {
  // 獲取當前登入的管理員完整資訊
  const currentAdmin = await Admin.findById(req.auth.id)
    .select('role brand store')
    .populate('brand')
    .populate('store');

  const options = {
    role: req.query.role,
    // 優先從路由參數取得 brandId，其次從查詢參數
    brandId: req.params.brandId || req.query.brandId,
    storeId: req.params.storeId || req.query.storeId,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20
  };

  const result = await adminService.getAllAdmins(currentAdmin, options);

  res.json({
    success: true,
    admins: result.admins,
    pagination: result.pagination
  });
});

// 獲取單個管理員
export const getAdminById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 獲取當前登入的管理員完整資訊
  const currentAdmin = await Admin.findById(req.auth.id)
    .select('role brand store')
    .populate('brand')
    .populate('store');

  const admin = await adminService.getAdminById(id, currentAdmin);

  res.json({
    success: true,
    admin
  });
});

// 創建管理員
export const createAdmin = asyncHandler(async (req, res) => {
  // 獲取當前登入的管理員完整資訊
  const currentAdmin = await Admin.findById(req.auth.id)
    .select('role brand store')
    .populate('brand')
    .populate('store');

  const adminData = req.body;

  const newAdmin = await adminService.createAdmin(currentAdmin, adminData);

  res.status(201).json({
    success: true,
    message: '管理員創建成功',
    admin: newAdmin
  });
});

// 更新管理員
export const updateAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // 獲取當前登入的管理員完整資訊
  const currentAdmin = await Admin.findById(req.auth.id)
    .select('role brand store')
    .populate('brand')
    .populate('store');

  const updatedAdmin = await adminService.updateAdmin(id, currentAdmin, updateData);

  res.json({
    success: true,
    message: '管理員更新成功',
    admin: updatedAdmin
  });
});

// 刪除管理員
export const deleteAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 獲取當前登入的管理員完整資訊
  const currentAdmin = await Admin.findById(req.auth.id)
    .select('role brand store')
    .populate('brand')
    .populate('store');

  const result = await adminService.deleteAdmin(id, currentAdmin);

  res.json({
    success: true,
    message: '管理員刪除成功'
  });
});

// 切換管理員啟用狀態
export const toggleAdminStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (isActive === undefined) {
    return res.status(400).json({
      success: false,
      message: '缺少參數 isActive'
    });
  }

  // 獲取當前登入的管理員完整資訊
  const currentAdmin = await Admin.findById(req.auth.id)
    .select('role brand store')
    .populate('brand')
    .populate('store');

  const admin = await adminService.toggleAdminStatus(id, currentAdmin, isActive);

  res.json({
    success: true,
    message: `管理員已${isActive ? '啟用' : '停用'}`,
    admin
  });
});
