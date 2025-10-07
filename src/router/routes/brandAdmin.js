import Placeholder from '@/components/common/Placeholder.vue'

export const brandAdminRoutes = [
  // 品牌管理員後台
  {
    path: '/admin/:brandId',
    component: () => import('@/views/brandAdmin/index.vue'),
    meta: {
      requiresAdminAuth: true,
      role: [
        'primary_system_admin',
        'system_admin',
        'primary_brand_admin',
        'brand_admin',
        'primary_store_admin',
        'store_admin',
        'employee',
      ],
    },
    props: true,
    children: [
      {
        path: '',
        name: 'brand-admin-dashboard',
        component: () => import('@/components/BrandAdmin/DashBoard/Dashboard.vue'),
      },

      // 店鋪管理路由
      {
        path: 'stores',
        name: 'brand-admin-stores',
        component: () => import('@/components/BrandAdmin/Store/StoreList.vue'),
      },
      {
        path: 'stores/create',
        name: 'brand-admin-store-create',
        component: () => import('@/components/BrandAdmin/Store/StoreForm.vue'),
        meta: {
          role: ['primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'],
        },
      },
      {
        path: 'stores/edit/:id',
        name: 'brand-admin-store-edit',
        component: () => import('@/components/BrandAdmin/Store/StoreForm.vue'),
        props: true,
        meta: {
          role: ['primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'],
        },
      },
      {
        path: 'stores/detail/:id',
        name: 'brand-admin-store-detail',
        component: () => import('@/components/BrandAdmin/Store/StoreDetail.vue'),
        props: true,
      },

      // 菜單管理路由
      {
        path: 'menus',
        name: 'brand-admin-menus',
        component: () => import('@/components/BrandAdmin/Menu/MenuStoreSelect.vue'),
        meta: { requiresAuth: true, title: '選擇店鋪' },
      },
      {
        path: 'menus/store/:storeId',
        name: 'brand-admin-store-menu',
        component: () => import('@/components/BrandAdmin/Menu/MenuList.vue'),
        meta: { requiresAuth: true, title: '店鋪菜單' },
      },
      {
        path: 'menus/create/:storeId',
        name: 'brand-admin-menu-create',
        component: () => import('@/components/BrandAdmin/Menu/MenuForm.vue'),
        meta: { requiresAuth: true, title: '新增菜單' },
      },
      {
        path: 'menus/edit/:storeId/:menuId',
        name: 'brand-admin-menu-edit',
        component: () => import('@/components/BrandAdmin/Menu/MenuForm.vue'),
        meta: { requiresAuth: true, title: '編輯菜單' },
      },
      {
        path: 'menus/detail/:storeId/:menuId',
        name: 'brand-admin-menu-detail',
        component: () => import('@/components/BrandAdmin/Menu/MenuDetail.vue'),
        meta: { requiresAuth: true, title: '菜單詳情' },
      },

      // 餐點模板路由
      {
        path: 'dishes/template',
        name: 'DishTemplateList',
        component: () => import('@/components/BrandAdmin/Dish/DishTemplate/List.vue'),
        meta: { requiresAuth: true, title: '餐點模板' },
      },
      {
        path: 'dishes/template/create',
        name: 'DishTemplateCreate',
        component: () => import('@/components/BrandAdmin/Dish/DishTemplate/Form.vue'),
        meta: { requiresAuth: true, title: '新增餐點' },
      },
      {
        path: 'dishes/template/edit/:id',
        name: 'DishTemplateEdit',
        component: () => import('@/components/BrandAdmin/Dish/DishTemplate/Form.vue'),
        meta: { requiresAuth: true, title: '編輯餐點' },
      },
      {
        path: 'dishes/template/detail/:id',
        name: 'DishTemplateDetail',
        component: () => import('@/components/BrandAdmin/Dish/DishTemplate/Detail.vue'),
        meta: { requiresAuth: true, title: '餐點詳情' },
      },

      // 選項類別路由
      {
        path: 'option-categories',
        name: 'brand-admin-option-categories',
        component: () => import('@/components/BrandAdmin/Dish/OptionCategory/List.vue'),
        meta: { requiresAuth: true, title: '選項類別管理' },
      },
      {
        path: 'option-categories/create',
        name: 'brand-admin-option-category-create',
        component: () => import('@/components/BrandAdmin/Dish/OptionCategory/Form.vue'),
        meta: { requiresAuth: true, title: '新增選項類別' },
      },
      {
        path: 'option-categories/edit/:id',
        name: 'brand-admin-option-category-edit',
        component: () => import('@/components/BrandAdmin/Dish/OptionCategory/Form.vue'),
        props: true,
        meta: { requiresAuth: true, title: '編輯選項類別' },
      },
      {
        path: 'option-categories/detail/:id',
        name: 'brand-admin-option-category-detail',
        component: () => import('@/components/BrandAdmin/Dish/OptionCategory/Detail.vue'),
        props: true,
        meta: { requiresAuth: true, title: '選項類別詳情' },
      },

      // 選項管理路由
      {
        path: 'options',
        name: 'brand-admin-options',
        component: () => import('@/components/BrandAdmin/Dish/Option/List.vue'),
        meta: { requiresAuth: true, title: '選項管理' },
      },
      {
        path: 'options/create',
        name: 'brand-admin-option-create',
        component: () => import('@/components/BrandAdmin/Dish/Option/Form.vue'),
        meta: { requiresAuth: true, title: '新增選項' },
      },
      {
        path: 'options/edit/:id',
        name: 'brand-admin-option-edit',
        component: () => import('@/components/BrandAdmin/Dish/Option/Form.vue'),
        props: true,
        meta: { requiresAuth: true, title: '編輯選項' },
      },

      // 庫存管理
      {
        path: 'inventory',
        name: 'brand-admin-inventory',
        component: () => import('@/components/BrandAdmin/Inventory/StoreSelect.vue'),
        meta: { requiresAuth: true, title: '選擇店鋪' },
      },
      {
        path: 'inventory/store/:storeId',
        name: 'brand-admin-store-inventory',
        component: () => import('@/components/BrandAdmin/Inventory/StockStatus.vue'),
        meta: { requiresAuth: true, title: '店鋪庫存管理' },
      },
      {
        path: 'inventory/store/:storeId/detail/:id',
        name: 'brand-admin-inventory-detail',
        component: () => import('@/components/BrandAdmin/Inventory/StockDetail.vue'),
        meta: { requiresAuth: true, title: '庫存詳情' },
      },
      {
        path: 'inventory/logs',
        name: 'brand-admin-inventory-logs',
        component: () => import('@/components/BrandAdmin/Inventory/StockLog.vue'),
        meta: { requiresAuth: true, title: '庫存變更記錄' },
      },

      // 訂單管理路由
      {
        path: 'orders',
        name: 'brand-admin-orders',
        component: () => import('@/components/BrandAdmin/Order/OrderStoreSelect.vue'),
        meta: { requiresAuth: true, title: '選擇店鋪' },
      },
      {
        path: 'orders/store/:storeId',
        name: 'brand-admin-store-orders',
        component: () => import('@/components/BrandAdmin/Order/OrderList.vue'),
        meta: { requiresAuth: true, title: '訂單列表' },
      },
      {
        path: 'orders/reports',
        name: 'brand-admin-reports',
        component: () => import('@/components/BrandAdmin/Order/Reports/ReportsView.vue'),
        meta: { requiresAuth: true, title: '銷售報表' },
      },

      // 促銷管理 - 優惠券
      {
        path: 'coupons',
        name: 'brand-admin-coupons',
        component: () => import('@/components/BrandAdmin/Promotion/Coupon/List.vue'),
        meta: { requiresAuth: true, title: '折價券管理' },
      },
      {
        path: 'coupons/create',
        name: 'brand-admin-coupon-create',
        component: () => import('@/components/BrandAdmin/Promotion/Coupon/Form.vue'),
        meta: { requiresAuth: true, title: '新增折價券' },
      },
      {
        path: 'coupons/edit/:id',
        name: 'brand-admin-coupon-edit',
        component: () => import('@/components/BrandAdmin/Promotion/Coupon/Form.vue'),
        props: true,
        meta: { requiresAuth: true, title: '編輯折價券' },
      },
      {
        path: 'coupons/detail/:id',
        name: 'brand-admin-coupon-detail',
        component: () => import('@/components/BrandAdmin/Promotion/Coupon/Detail.vue'),
        props: true,
        meta: { requiresAuth: true, title: '折價券詳情' },
      },

      // 促銷管理 - 兌換券模板
      {
        path: 'vouchers',
        name: 'brand-admin-vouchers',
        component: () => import('@/components/BrandAdmin/Promotion/Voucher/List.vue'),
        meta: { requiresAuth: true, title: '兌換券模板管理' },
      },
      {
        path: 'vouchers/create',
        name: 'brand-admin-voucher-create',
        component: () => import('@/components/BrandAdmin/Promotion/Voucher/Form.vue'),
        meta: { requiresAuth: true, title: '新增兌換券模板' },
      },
      {
        path: 'vouchers/edit/:id',
        name: 'brand-admin-voucher-edit',
        component: () => import('@/components/BrandAdmin/Promotion/Voucher/Form.vue'),
        props: true,
        meta: { requiresAuth: true, title: '編輯兌換券模板' },
      },
      {
        path: 'vouchers/detail/:id',
        name: 'brand-admin-voucher-detail',
        component: () => import('@/components/BrandAdmin/Promotion/Voucher/Detail.vue'),
        props: true,
        meta: { requiresAuth: true, title: '兌換券模板詳情' },
      },

      // 促銷管理 - 包裝商品
      {
        path: 'bundles',
        name: 'brand-admin-bundles',
        component: () => import('@/components/BrandAdmin/Promotion/Bundle/List.vue'),
        meta: { requiresAuth: true, title: '包裝商品管理' },
      },
      {
        path: 'bundles/create',
        name: 'brand-admin-bundle-create',
        component: () => import('@/components/BrandAdmin/Promotion/Bundle/Form.vue'),
        meta: { requiresAuth: true, title: '新增包裝商品' },
      },
      {
        path: 'bundles/edit/:id',
        name: 'brand-admin-bundle-edit',
        component: () => import('@/components/BrandAdmin/Promotion/Bundle/Form.vue'),
        props: true,
        meta: { requiresAuth: true, title: '編輯包裝商品' },
      },
      {
        path: 'bundles/detail/:id',
        name: 'brand-admin-bundle-detail',
        component: () => import('@/components/BrandAdmin/Promotion/Bundle/Detail.vue'),
        props: true,
        meta: { requiresAuth: true, title: '包裝商品詳情' },
      },

      // 點數規則
      {
        path: 'point-rules',
        name: 'PointRuleList',
        component: () => import('@/components/BrandAdmin/Promotion/PointRule/List.vue'),
      },
      {
        path: 'point-rules/create',
        name: 'PointRuleCreate',
        component: () => import('@/components/BrandAdmin/Promotion/PointRule/Form.vue'),
      },
      {
        path: 'point-rules/edit/:id',
        name: 'PointRuleEdit',
        component: () => import('@/components/BrandAdmin/Promotion/PointRule/Form.vue'),
      },

      // 管理員管理
      {
        path: 'store-admins',
        name: 'brand-admin-admins',
        component: () => import('@/components/BrandAdmin/AdminManager/List.vue'),
        meta: {
          requiresAuth: true,
          title: '管理員管理',
          role: ['primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'],
        },
      },
      {
        path: 'store-admins/create',
        name: 'brand-admin-admin-create',
        component: () => import('@/components/BrandAdmin/AdminManager/Form.vue'),
        meta: {
          requiresAuth: true,
          title: '新增管理員',
          role: ['primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'],
        },
      },
      {
        path: 'store-admins/edit/:id',
        name: 'brand-admin-admin-edit',
        component: () => import('@/components/BrandAdmin/AdminManager/Form.vue'),
        props: true,
        meta: {
          requiresAuth: true,
          title: '編輯管理員',
          role: ['primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'],
        },
      },

      // 顧客管理
      {
        path: 'customers',
        name: 'brand-admin-customers',
        component: () => import('@/components/BrandAdmin/Customer/List.vue'),
        meta: { requiresAuth: true, title: '顧客管理' },
      },
      {
        path: 'customers/:customerId',
        name: 'brand-admin-customers-detail',
        component: () => import('@/components/BrandAdmin/Customer/Detail.vue'),
        meta: { requiresAuth: true, title: '顧客詳細資訊' },
      },

      // 記帳系統路由
      {
        path: 'cash-flow',
        name: 'brand-admin-cash-flow',
        component: () => import('@/views/brandAdmin/CashFlow.vue'),
        meta: { requiresAuth: true, title: '店家獨立記帳' },
      },
      {
        path: 'cash-flow/:storeId',
        name: 'brand-admin-cash-flow-store',
        component: () => import('@/views/brandAdmin/CashFlowStore.vue'),
        meta: { requiresAuth: true, title: '記帳管理' },
        children: [
          {
            path: 'show',
            name: 'brand-admin-cash-flow-show',
            component: () => import('@/components/BrandAdmin/CashFlow/Show.vue'),
            meta: { requiresAuth: true, title: '記帳記錄' },
          },
          {
            path: 'create',
            name: 'brand-admin-cash-flow-create',
            component: () => import('@/components/BrandAdmin/CashFlow/Create.vue'),
            meta: { requiresAuth: true, title: '新增記帳記錄' },
          },
          {
            path: 'edit/:recordId',
            name: 'brand-admin-cash-flow-edit',
            component: () => import('@/components/BrandAdmin/CashFlow/Edit.vue'),
            props: true,
            meta: { requiresAuth: true, title: '編輯記帳記錄' },
          },
          {
            path: 'category',
            name: 'brand-admin-cash-flow-category',
            component: () => import('@/components/BrandAdmin/CashFlow/Category.vue'),
            meta: { requiresAuth: true, title: '記帳分類管理' },
          },
          {
            path: 'statistics',
            name: 'brand-admin-cash-flow-statistics',
            component: () => import('@/components/BrandAdmin/CashFlow/Statistics.vue'),
            meta: { requiresAuth: true, title: '記帳統計' },
          },
        ],
      },
      // 系統設置
      {
        path: 'settings',
        name: 'brand-admin-settings',
        component: Placeholder,
        props: {
          title: '品牌設置功能',
          message: '這個區塊目前尚未開發，請稍後再試。',
        },
      },

      // 品牌管理員帳號設置
      {
        path: 'account-settings',
        name: 'brand-admin-account-settings',
        component: () => import('@/components/BrandAdmin/Account/Settings.vue'),
        meta: { requiresAuth: true, title: '帳號設置' },
      },
    ],
  },
]
