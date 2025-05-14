/**
 * 權限配置檔
 * 定義系統中所有的權限和角色權限映射
 */

// 權限定義
export const PERMISSIONS = {
  ORDER_SYSTEM: 'order_system',      // 訂單系統管理
  VIEW_REPORTS: 'view_reports',      // 查看報表
  EDIT_BACKEND: 'edit_backend',      // 編輯後台資料
  MANAGE_STAFF: 'manage_staff'       // 管理員工
};

// 角色權限映射
export const ROLE_PERMISSIONS = {
  boss: Object.values(PERMISSIONS),        // 老闆擁有所有權限
  brand_admin: Object.values(PERMISSIONS), // 品牌管理員擁有所有權限
  store_admin: []                         // 店鋪管理員權限需要個別指派
};

// 權限描述
export const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.ORDER_SYSTEM]: '登入前台點餐系統，庫存管理',
  [PERMISSIONS.VIEW_REPORTS]: '查看後台資料，記帳',
  [PERMISSIONS.EDIT_BACKEND]: '編輯後臺資料',
  [PERMISSIONS.MANAGE_STAFF]: '員工權限管理'
};
