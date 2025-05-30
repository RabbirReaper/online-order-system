/**
 * RBAC 權限配置檔
 * 在純 RBAC 設計中，角色本身就定義了權限範圍
 */

// 角色層級定義 - 用於比較角色高低
export const ROLE_LEVELS = {
  primary_system_admin: 7,
  system_admin: 6,
  primary_brand_admin: 5,
  brand_admin: 4,
  primary_store_admin: 3,
  store_admin: 2,
  employee: 1
};

// 角色範圍定義 - 決定管理範圍
export const ROLE_SCOPES = {
  primary_system_admin: 'system',  // 可管理整個系統
  system_admin: 'system',          // 可管理整個系統
  primary_brand_admin: 'brand',    // 可管理特定品牌
  brand_admin: 'brand',            // 可管理特定品牌
  primary_store_admin: 'store',    // 可管理特定店鋪
  store_admin: 'store',            // 可管理特定店鋪
  employee: 'store'                // 只能在特定店鋪工作
};

// 角色能力描述 - 用於前端顯示和文檔
export const ROLE_CAPABILITIES = {
  primary_system_admin: {
    name: '系統主管理員',
    description: '系統最高權限，可管理所有品牌、店鋪和管理員',
    scope: '全系統',
    canManage: ['所有品牌', '所有店鋪', '所有管理員', '系統設定']
  },
  system_admin: {
    name: '系統管理員',
    description: '系統級操作權限，可管理品牌和店鋪，但不能管理其他系統管理員',
    scope: '全系統',
    canManage: ['所有品牌', '所有店鋪', '品牌和店鋪管理員']
  },
  primary_brand_admin: {
    name: '品牌主管理員',
    description: '品牌完整管理權限，可管理品牌下所有店鋪和人員',
    scope: '單一品牌',
    canManage: ['品牌設定', '所有店鋪', '品牌內所有管理員和員工']
  },
  brand_admin: {
    name: '品牌管理員',
    description: '品牌營運管理權限，可管理店鋪和業務，但不能管理人員',
    scope: '單一品牌',
    canManage: ['品牌設定', '所有店鋪', '菜單', '庫存', '訂單', '促銷']
  },
  primary_store_admin: {
    name: '店鋪主管理員',
    description: '店鋪完整管理權限，可管理店鋪所有功能和員工',
    scope: '單一店鋪',
    canManage: ['店鋪設定', '菜單', '庫存', '訂單', '促銷', '店鋪員工']
  },
  store_admin: {
    name: '店鋪管理員',
    description: '店鋪營運管理權限，可管理日常營運，但不能管理員工',
    scope: '單一店鋪',
    canManage: ['店鋪設定', '菜單', '庫存', '訂單', '促銷']
  },
  employee: {
    name: '員工',
    description: '基本操作權限，可使用點餐系統和基本庫存管理',
    scope: '單一店鋪',
    canManage: ['點餐系統', '基本庫存操作']
  }
};

// 角色管理權限 - 定義誰可以管理誰
export const ROLE_MANAGEMENT_MATRIX = {
  primary_system_admin: [
    'primary_system_admin', 'system_admin', 'primary_brand_admin',
    'brand_admin', 'primary_store_admin', 'store_admin', 'employee'
  ],
  system_admin: [
    'primary_brand_admin', 'brand_admin', 'primary_store_admin',
    'store_admin', 'employee'
  ],
  primary_brand_admin: [
    'brand_admin', 'primary_store_admin', 'store_admin', 'employee'
  ],
  brand_admin: ['primary_store_admin', 'store_admin', 'employee'],
  primary_store_admin: ['store_admin', 'employee'],
  store_admin: [], // 不能管理其他管理員
  employee: [] // 不能管理其他管理員
};

// 輔助函數 - 檢查角色是否可以管理目標角色
export const canManageRole = (managerRole, targetRole) => {
  const allowedRoles = ROLE_MANAGEMENT_MATRIX[managerRole] || [];
  return allowedRoles.includes(targetRole);
};

// 輔助函數 - 檢查是否為主管理員角色
export const isPrimaryRole = (role) => {
  return role.startsWith('primary_');
};

// 輔助函數 - 獲取角色範圍
export const getRoleScope = (role) => {
  return ROLE_SCOPES[role] || 'unknown';
};

// 輔助函數 - 獲取角色層級
export const getRoleLevel = (role) => {
  return ROLE_LEVELS[role] || 0;
};
