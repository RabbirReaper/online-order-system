// tests/unit/api/menu.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import menuApiFactory from '@/api/modules/menu';

describe('菜單 API 模組', () => {
  let mockApiClient;
  let menuApi;

  beforeEach(() => {
    // 創建模擬的 API client
    mockApiClient = {
      get: vi.fn().mockResolvedValue({ menu: {} }),
      post: vi.fn().mockResolvedValue({ success: true }),
      put: vi.fn().mockResolvedValue({ success: true }),
      delete: vi.fn().mockResolvedValue({ success: true })
    };

    // 使用模擬的 client 創建 menuApi 實例
    menuApi = menuApiFactory(mockApiClient);
  });

  it('getStoreMenu 函數應該發送 GET 請求到 /store/:storeId/menu 路徑', async () => {
    const storeId = '123456';

    await menuApi.getStoreMenu(storeId);

    expect(mockApiClient.get).toHaveBeenCalledWith(`/store/${storeId}/menu`);
  });

  it('createMenu 函數應該發送 POST 請求到 /store/:storeId/menu 路徑', async () => {
    const storeId = '123456';
    const menuData = {
      name: '午餐菜單',
      categories: [
        {
          name: '主餐',
          dishes: [
            {
              dishTemplate: '789012',
              price: 150,
              isPublished: true,
              order: 1
            }
          ]
        }
      ],
      isActive: true
    };

    await menuApi.createMenu({ storeId, data: menuData });

    expect(mockApiClient.post).toHaveBeenCalledWith(`/store/${storeId}/menu`, menuData);
  });

  it('updateMenu 函數應該發送 PUT 請求到 /store/:storeId/menu/:menuId 路徑', async () => {
    const storeId = '123456';
    const menuId = '789012';
    const menuData = {
      name: '更新的菜單名稱',
      categories: [
        {
          name: '更新的分類名稱',
          dishes: [
            {
              dishTemplate: '345678',
              price: 180,
              isPublished: true,
              order: 2
            }
          ]
        }
      ]
    };

    await menuApi.updateMenu({ storeId, menuId, data: menuData });

    expect(mockApiClient.put).toHaveBeenCalledWith(`/store/${storeId}/menu/${menuId}`, menuData);
  });

  it('deleteMenu 函數應該發送 DELETE 請求到 /store/:storeId/menu/:menuId 路徑', async () => {
    const storeId = '123456';
    const menuId = '789012';

    await menuApi.deleteMenu({ storeId, menuId });

    expect(mockApiClient.delete).toHaveBeenCalledWith(`/store/${storeId}/menu/${menuId}`);
  });

  it('toggleMenuActive 函數應該發送 PUT 請求到 /store/:storeId/menu/:menuId/toggle 路徑', async () => {
    const storeId = '123456';
    const menuId = '789012';
    const active = true;

    await menuApi.toggleMenuActive({ storeId, menuId, active });

    expect(mockApiClient.put).toHaveBeenCalledWith(`/store/${storeId}/menu/${menuId}/toggle`, { active });
  });
});
