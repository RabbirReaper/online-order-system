// tests/setup.js
import { vi, beforeEach, afterEach } from 'vitest';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';

// 設置測試環境變數 - 支付服務配置
process.env.NEWEBPAY_MerchantID = 'test_merchant_id';
process.env.NEWEBPAY_HASHKEY = 'test_hash_key_32_characters_long';
process.env.NEWEBPAY_HASHIV = 'test_hash_iv_16_char';

// 全域 Mock 設置
global.vi = vi;
global.fetch = vi.fn();

// 模擬 Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  }),
  useRoute: () => ({
    params: {},
    query: {},
    path: '/',
    name: '',
    meta: {}
  }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}));

// 模擬 axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn().mockReturnValue({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    })
  }
}));

// 模擬 localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// 模擬 bcrypt (可能會在單元測試中需要)
vi.mock('bcrypt', () => ({
  genSalt: vi.fn().mockResolvedValue('salt'),
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true)
}));

// 模擬 mongoose
vi.mock('mongoose', () => {
  const mockSchema = {
    pre: vi.fn().mockReturnThis(),
    index: vi.fn().mockReturnThis(),
    methods: {},
    statics: {},
    virtual: vi.fn().mockImplementation(() => ({
      get: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    })),
    plugin: vi.fn().mockReturnThis()
  };

  const mockMongoose = {
    Schema: vi.fn().mockImplementation(() => {
      const schema = {
        ...mockSchema,
        Types: {
          ObjectId: vi.fn().mockImplementation(() => '507f1f77bcf86cd799439011')
        }
      };
      
      // 為了支援 mongoose.Schema.Types.ObjectId 的使用方式
      schema.constructor = {
        Types: {
          ObjectId: vi.fn().mockImplementation(() => '507f1f77bcf86cd799439011')
        }
      };
      
      return schema;
    }),
    model: vi.fn().mockReturnValue({
      find: vi.fn().mockReturnThis(),
      findOne: vi.fn().mockReturnThis(),
      findById: vi.fn().mockReturnThis(),
      findByIdAndUpdate: vi.fn().mockReturnThis(),
      findByIdAndDelete: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      save: vi.fn().mockResolvedValue({}),
      new: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      countDocuments: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue([]),
      exec: vi.fn().mockResolvedValue([])
    }),
    Types: {
      ObjectId: vi.fn().mockImplementation(() => '507f1f77bcf86cd799439011')
    },
    connect: vi.fn(),
    connection: {
      on: vi.fn()
    }
  };

  // 為 Schema 添加靜態 Types 屬性
  mockMongoose.Schema.Types = {
    ObjectId: vi.fn().mockImplementation(() => '507f1f77bcf86cd799439011')
  };

  return {
    default: mockMongoose,
    ...mockMongoose
  };
});

// 模擬 express-session
vi.mock('express-session', () => vi.fn().mockReturnValue((req, res, next) => next()));

// 模擬 dotenv
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn()
  },
  config: vi.fn()
}));

// 模擬 CloudFlare R2（未實作的部分）
vi.mock('@cloudflare/r2', () => ({
  // 此處為模擬的CloudFlare R2 API，實際實作時需要更新
  R2Client: vi.fn().mockReturnValue({
    uploadFile: vi.fn().mockResolvedValue({ url: 'https://r2.example.com/image.jpg', key: 'image.jpg' }),
    deleteFile: vi.fn().mockResolvedValue(true)
  })
}));

// 模擬 window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 模擬 window.scrollTo
window.scrollTo = vi.fn();

// 測試資料工廠
export class TestDataFactory {
  // 創建用戶資料
  static createUser(overrides = {}) {
    return {
      _id: '507f1f77bcf86cd799439011',
      name: 'TestUser',
      email: 'test@example.com',
      phone: '0912345678',
      points: 0,
      status: 'active',
      createdAt: new Date(),
      ...overrides
    };
  }

  // 創建管理員資料
  static createAdmin(overrides = {}) {
    return {
      _id: '507f1f77bcf86cd799439012',
      name: 'TestAdmin',
      password: 'hashed_password',
      role: 'brand_admin',
      manage: [],
      createdAt: new Date(),
      ...overrides
    };
  }

  // 創建品牌資料
  static createBrand(overrides = {}) {
    return {
      _id: '507f1f77bcf86cd799439013',
      name: 'TestBrand',
      description: '測試品牌描述',
      logo: 'brand-logo.jpg',
      isActive: true,
      createdAt: new Date(),
      ...overrides
    };
  }

  // 創建店鋪資料
  static createStore(overrides = {}) {
    return {
      _id: '507f1f77bcf86cd799439014',
      name: 'TestStore',
      brand: '507f1f77bcf86cd799439013',
      address: '台北市測試區測試路123號',
      phone: '02-12345678',
      isActive: true,
      settings: {
        acceptsOrders: true,
        requiresTableNumber: true
      },
      createdAt: new Date(),
      ...overrides
    };
  }

  // 創建菜單資料
  static createMenu(overrides = {}) {
    return {
      _id: '507f1f77bcf86cd799439015',
      name: 'TestMenu',
      store: '507f1f77bcf86cd799439014',
      brand: '507f1f77bcf86cd799439013',
      categories: [
        {
          name: '主餐',
          dishes: [
            {
              dishTemplate: '507f1f77bcf86cd799439016',
              price: 150,
              isPublished: true,
              order: 1
            }
          ]
        }
      ],
      isActive: true,
      createdAt: new Date(),
      ...overrides
    };
  }

  // 創建菜品模板資料
  static createDishTemplate(overrides = {}) {
    return {
      _id: '507f1f77bcf86cd799439016',
      name: 'TestDish',
      description: '測試菜品描述',
      brand: '507f1f77bcf86cd799439013',
      category: 'main',
      basePrice: 150,
      image: {
        url: 'https://example.com/dish-image.jpg',
        key: 'dishes/test/dish-image.jpg',
        alt: 'TestDish'
      },
      options: [],
      isActive: true,
      createdAt: new Date(),
      ...overrides
    };
  }

  // 創建無圖片的菜品模板資料
  static createDishTemplateWithoutImage(overrides = {}) {
    return {
      ...this.createDishTemplate(overrides),
      image: undefined
    };
  }

  // 創建 Bundle 資料
  static createBundle(overrides = {}) {
    return {
      _id: '507f1f77bcf86cd799439020',
      brand: '507f1f77bcf86cd799439013',
      name: 'TestBundle',
      description: '測試包裝商品',
      image: {
        url: 'https://example.com/bundle-image.jpg',
        key: 'bundles/test/bundle-image.jpg'
      },
      bundleItems: [
        {
          voucherTemplate: '507f1f77bcf86cd799439021',
          quantity: 1,
          voucherName: 'Test Voucher'
        }
      ],
      cashPrice: {
        original: 100,
        selling: 90
      },
      voucherValidityDays: 30,
      isActive: true,
      totalSold: 0,
      createdAt: new Date(),
      ...overrides
    };
  }

  // 創建無圖片的 Bundle 資料
  static createBundleWithoutImage(overrides = {}) {
    return {
      ...this.createBundle(overrides),
      image: undefined
    };
  }

  // 創建訂單資料
  static createOrder(overrides = {}) {
    return {
      _id: '507f1f77bcf86cd799439017',
      orderNumber: 'T20240101001',
      user: '507f1f77bcf86cd799439011',
      store: '507f1f77bcf86cd799439014',
      brand: '507f1f77bcf86cd799439013',
      orderDateCode: '20240101',
      sequence: 1,
      items: [
        {
          itemType: 'dish',
          templateId: '507f1f77bcf86cd799439016',
          itemName: 'TestDish',
          dishInstance: '507f1f77bcf86cd799439020',
          quantity: 1,
          basePrice: 150,
          finalPrice: 150,
          options: [],
          subtotal: 150,
          note: ''
        }
      ],
      orderType: 'dine_in',
      tableNumber: 'A1',
      status: 'unpaid',
      paymentMethod: 'cash',
      dishSubtotal: 150,
      bundleSubtotal: 0,
      subtotal: 150,
      serviceCharge: 0,
      discounts: [],
      totalDiscount: 0,
      manualAdjustment: 0,
      total: 150,
      createdAt: new Date(),
      ...overrides
    };
  }

  // 創建庫存資料
  static createInventory(overrides = {}) {
    return {
      _id: '507f1f77bcf86cd799439018',
      store: '507f1f77bcf86cd799439014',
      dishTemplate: '507f1f77bcf86cd799439016',
      currentStock: 100,
      reservedStock: 0,
      availableStock: 100,
      minThreshold: 10,
      maxThreshold: 200,
      autoReplenish: true,
      isActive: true,
      lastUpdated: new Date(),
      ...overrides
    };
  }

  // 創建庫存項目（別名方法）
  static createInventoryItem(overrides = {}) {
    return this.createInventory(overrides);
  }

  // 創建庫存資料（用於創建新庫存）
  static createInventoryData(overrides = {}) {
    return {
      dishTemplate: '507f1f77bcf86cd799439016',
      totalStock: 100,
      availableStock: 100,
      minThreshold: 10,
      maxThreshold: 200,
      autoReplenish: true,
      isActive: true,
      ...overrides
    };
  }

  // 創建庫存日誌
  static createInventoryLog(overrides = {}) {
    return {
      _id: '507f1f77bcf86cd799439021',
      store: '507f1f77bcf86cd799439014',
      itemId: '507f1f77bcf86cd799439016',
      inventoryType: 'DishTemplate',
      changeType: 'reduce',
      stockType: 'totalStock',
      quantity: 5,
      reason: 'Order consumption',
      orderId: '507f1f77bcf86cd799439017',
      adminId: '507f1f77bcf86cd799439012',
      createdAt: new Date(),
      ...overrides
    };
  }

  // 創建優惠券資料
  static createCoupon(overrides = {}) {
    return {
      _id: '507f1f77bcf86cd799439019',
      code: 'TEST50',
      name: '測試折扣券',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 100,
      maxDiscountAmount: 50,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
      ...overrides
    };
  }
}

// 測試輔助函式
export class TestHelpers {
  // 創建模擬的 API Client
  static createMockApiClient() {
    return {
      get: vi.fn().mockResolvedValue({ success: true }),
      post: vi.fn().mockResolvedValue({ success: true }),
      put: vi.fn().mockResolvedValue({ success: true }),
      delete: vi.fn().mockResolvedValue({ success: true }),
      patch: vi.fn().mockResolvedValue({ success: true })
    };
  }

  // 創建模擬的 Axios 實例
  static createMockAxiosInstance() {
    return {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      get: vi.fn().mockResolvedValue({ data: {} }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
      patch: vi.fn().mockResolvedValue({ data: {} })
    };
  }

  // 等待異步操作完成
  static async waitForAsync() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  // 創建模擬的 Express Request
  static createMockRequest(overrides = {}) {
    return {
      params: {},
      query: {},
      body: {},
      headers: {},
      user: null,
      session: {},
      ...overrides
    };
  }

  // 創建模擬的 Express Response
  static createMockResponse() {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis()
    };
    return res;
  }

  // 創建模擬的 Next 函式
  static createMockNext() {
    return vi.fn();
  }
}

// 全域測試清理
beforeEach(() => {
  // 清理所有模擬函式
  vi.clearAllMocks();
});

afterEach(() => {
  // 重置所有模擬狀態
  vi.resetAllMocks();
});
