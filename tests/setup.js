// tests/setup.js
import { vi } from 'vitest';

// 模擬 Vue Router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn(),
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
    index: vi.fn().mockReturnThis()
  };

  return {
    Schema: vi.fn().mockImplementation(() => mockSchema),
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
});

// 模擬 express-session
vi.mock('express-session', () => vi.fn().mockReturnValue((req, res, next) => next()));

// 模擬 dotenv
vi.mock('dotenv', () => ({
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
