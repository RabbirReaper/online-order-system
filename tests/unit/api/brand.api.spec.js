// tests/unit/api/brand.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import brandApiFactory from '@/api/modules/brand';

describe('品牌 API 模組', () => {
  let mockApiClient;
  let brandApi;

  beforeEach(() => {
    // 創建模擬的 API client
    mockApiClient = {
      get: vi.fn().mockResolvedValue({ brands: [] }),
      post: vi.fn().mockResolvedValue({ success: true }),
      put: vi.fn().mockResolvedValue({ success: true }),
      delete: vi.fn().mockResolvedValue({ success: true })
    };

    // 使用模擬的 client 創建 brandApi 實例
    brandApi = brandApiFactory(mockApiClient);
  });

  it('getAllBrands 函數應該發送 GET 請求到 /store/brands 路徑', async () => {
    const params = { page: 1, limit: 10 };

    await brandApi.getAllBrands(params);

    expect(mockApiClient.get).toHaveBeenCalledWith('/store/brands', { params });
  });

  it('getAllBrands 函數不傳參數時應該使用空物件', async () => {
    await brandApi.getAllBrands();

    expect(mockApiClient.get).toHaveBeenCalledWith('/store/brands', { params: {} });
  });

  it('getBrandById 函數應該發送 GET 請求到 /store/brands/:id 路徑', async () => {
    const brandId = '123456';

    await brandApi.getBrandById(brandId);

    expect(mockApiClient.get).toHaveBeenCalledWith(`/store/brands/${brandId}`);
  });

  it('createBrand 函數應該發送 POST 請求到 /store/brands 路徑', async () => {
    const brandData = {
      name: '測試品牌',
      description: '這是一個測試品牌',
      image: {
        url: 'https://example.com/image.jpg',
        key: 'image.jpg',
        alt: '品牌圖片'
      }
    };

    await brandApi.createBrand(brandData);

    expect(mockApiClient.post).toHaveBeenCalledWith('/store/brands', brandData);
  });

  it('updateBrand 函數應該發送 PUT 請求到 /store/brands/:id 路徑', async () => {
    const brandId = '123456';
    const brandData = {
      name: '更新的品牌名稱',
      description: '更新的品牌描述'
    };

    await brandApi.updateBrand({ id: brandId, data: brandData });

    expect(mockApiClient.put).toHaveBeenCalledWith(`/store/brands/${brandId}`, brandData);
  });

  it('deleteBrand 函數應該發送 DELETE 請求到 /store/brands/:id 路徑', async () => {
    const brandId = '123456';

    await brandApi.deleteBrand(brandId);

    expect(mockApiClient.delete).toHaveBeenCalledWith(`/store/brands/${brandId}`);
  });
});
