// tests/unit/api/store.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import storeApiFactory from '@/api/modules/store';

describe('店鋪 API 模組', () => {
  let mockApiClient;
  let storeApi;

  beforeEach(() => {
    // 創建模擬的 API client
    mockApiClient = {
      get: vi.fn().mockResolvedValue({ stores: [] }),
      post: vi.fn().mockResolvedValue({ success: true }),
      put: vi.fn().mockResolvedValue({ success: true }),
      delete: vi.fn().mockResolvedValue({ success: true })
    };

    // 使用模擬的 client 創建 storeApi 實例
    storeApi = storeApiFactory(mockApiClient);
  });

  it('getAllStores 函數應該發送 GET 請求到 /store 路徑', async () => {
    const params = {
      brandId: '123',
      activeOnly: true,
      page: 1,
      limit: 10
    };

    await storeApi.getAllStores(params);

    expect(mockApiClient.get).toHaveBeenCalledWith('/store', { params });
  });

  it('getAllStores 函數不傳參數時應該使用空物件', async () => {
    await storeApi.getAllStores();

    expect(mockApiClient.get).toHaveBeenCalledWith('/store', { params: {} });
  });

  it('getStoreById 函數應該發送 GET 請求到 /store/:id 路徑', async () => {
    const storeId = '123456';

    await storeApi.getStoreById(storeId);

    expect(mockApiClient.get).toHaveBeenCalledWith(`/store/${storeId}`);
  });

  it('createStore 函數應該發送 POST 請求到 /store 路徑', async () => {
    const storeData = {
      name: '測試店鋪',
      brand: '123456',
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

    await storeApi.createStore(storeData);

    expect(mockApiClient.post).toHaveBeenCalledWith('/store', storeData);
  });

  it('updateStore 函數應該發送 PUT 請求到 /store/:id 路徑', async () => {
    const storeId = '123456';
    const storeData = {
      name: '更新的店鋪名稱',
      businessHours: [
        {
          day: 1,
          periods: [{ open: '10:00', close: '19:00' }],
          isClosed: false
        }
      ]
    };

    await storeApi.updateStore({ id: storeId, data: storeData });

    expect(mockApiClient.put).toHaveBeenCalledWith(`/store/${storeId}`, storeData);
  });

  it('deleteStore 函數應該發送 DELETE 請求到 /store/:id 路徑', async () => {
    const storeId = '123456';

    await storeApi.deleteStore(storeId);

    expect(mockApiClient.delete).toHaveBeenCalledWith(`/store/${storeId}`);
  });
});
