// tests/integration/store.integration.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import storeApiFactory from '@/api/modules/store';

// 模擬 axios 請求
vi.mock('axios');

describe('店鋪 API 整合測試', () => {
  let mockAxiosInstance;
  let storeApi;

  beforeEach(() => {
    // 重置所有 mock
    vi.resetAllMocks();

    // 創建模擬的 axios 實例
    mockAxiosInstance = {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };

    // 模擬 axios.create 返回我們的 mock 實例
    axios.create.mockReturnValue(mockAxiosInstance);

    // 創建 API 實例
    storeApi = storeApiFactory(mockAxiosInstance);
  });

  it('應該能夠獲取所有店鋪並處理成功回應', async () => {
    // 設置模擬的回應數據
    const mockStores = [
      { _id: '123', name: '台北店', brand: '456', isActive: true },
      { _id: '789', name: '高雄店', brand: '456', isActive: false }
    ];

    const mockResponse = {
      success: true,
      stores: mockStores,
      pagination: {
        total: 2,
        totalPages: 1,
        currentPage: 1,
        limit: 10
      }
    };

    mockAxiosInstance.get.mockResolvedValue(mockResponse);

    // 執行 API 請求
    const params = { brandId: '456', activeOnly: true, page: 1, limit: 10 };
    const response = await storeApi.getAllStores(params);

    // 驗證結果
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/store', { params });
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠獲取特定店鋪並處理成功回應', async () => {
    // 設置模擬的回應數據
    const mockStore = {
      _id: '123',
      name: '台北店',
      brand: '456',
      businessHours: [
        {
          day: 1,
          periods: [{ open: '09:00', close: '18:00' }],
          isClosed: false
        }
      ],
      isActive: true
    };

    const mockResponse = {
      success: true,
      store: mockStore
    };

    mockAxiosInstance.get.mockResolvedValue(mockResponse);

    // 執行 API 請求
    const storeId = '123';
    const response = await storeApi.getStoreById(storeId);

    // 驗證結果
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/store/${storeId}`);
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠創建店鋪並處理成功回應', async () => {
    // 設置模擬的回應數據
    const mockNewStore = {
      _id: '123',
      name: '新店鋪',
      brand: '456',
      businessHours: [
        {
          day: 1,
          periods: [{ open: '09:00', close: '18:00' }],
          isClosed: false
        }
      ],
      image: {
        url: 'https://example.com/image.jpg',
        key: 'image.jpg',
        alt: '店鋪圖片'
      },
      isActive: true
    };

    const mockResponse = {
      success: true,
      message: 'Store created successfully',
      store: mockNewStore
    };

    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    // 執行 API 請求
    const storeData = {
      name: '新店鋪',
      brand: '456',
      businessHours: [
        {
          day: 1,
          periods: [{ open: '09:00', close: '18:00' }],
          isClosed: false
        }
      ],
      image: {
        url: 'https://example.com/image.jpg',
        key: 'image.jpg',
        alt: '店鋪圖片'
      },
      isActive: true
    };

    const response = await storeApi.createStore(storeData);

    // 驗證結果
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/store', storeData);
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠更新店鋪並處理成功回應', async () => {
    // 設置模擬的回應數據
    const mockUpdatedStore = {
      _id: '123',
      name: '更新的店鋪名稱',
      brand: '456',
      businessHours: [
        {
          day: 1,
          periods: [{ open: '10:00', close: '19:00' }],
          isClosed: false
        }
      ],
      isActive: true
    };

    const mockResponse = {
      success: true,
      message: 'Store updated successfully',
      store: mockUpdatedStore
    };

    mockAxiosInstance.put.mockResolvedValue(mockResponse);

    // 執行 API 請求
    const storeId = '123';
    const updateData = {
      name: '更新的店鋪名稱',
      businessHours: [
        {
          day: 1,
          periods: [{ open: '10:00', close: '19:00' }],
          isClosed: false
        }
      ]
    };

    const response = await storeApi.updateStore({ id: storeId, data: updateData });

    // 驗證結果
    expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/store/${storeId}`, updateData);
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠刪除店鋪並處理成功回應', async () => {
    // 設置模擬的回應數據
    const mockResponse = {
      success: true,
      message: 'Store deleted successfully'
    };

    mockAxiosInstance.delete.mockResolvedValue(mockResponse);

    // 執行 API 請求
    const storeId = '123';
    const response = await storeApi.deleteStore(storeId);

    // 驗證結果
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/store/${storeId}`);
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠處理獲取店鋪失敗的情況', async () => {
    // 設置模擬的錯誤回應
    const errorResponse = {
      response: {
        data: {
          success: false,
          message: 'Server error'
        },
        status: 500
      }
    };

    mockAxiosInstance.get.mockRejectedValue(errorResponse);

    // 執行 API 請求並期待失敗
    try {
      await storeApi.getAllStores();
      // 如果沒有拋出錯誤，測試失敗
      expect(true).toBe(false);
    } catch (error) {
      // 驗證錯誤資訊
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/store', { params: {} });
      expect(error).toEqual(errorResponse);
    }
  });
});
