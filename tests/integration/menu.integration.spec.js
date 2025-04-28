// tests/integration/menu.integration.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import menuApiFactory from '@/api/modules/menu';

// 模擬 axios 請求
vi.mock('axios');

describe('菜單 API 整合測試', () => {
  let mockAxiosInstance;
  let menuApi;

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
    menuApi = menuApiFactory(mockAxiosInstance);
  });

  it('應該能夠獲取店鋪菜單並處理成功回應', async () => {
    // 設置模擬的回應數據
    const mockMenu = {
      _id: '123',
      name: '午餐菜單',
      store: '456',
      brand: '789',
      categories: [
        {
          name: '主餐',
          dishes: [
            {
              dishTemplate: '101112',
              price: 150,
              isPublished: true
            }
          ]
        },
        {
          name: '飲料',
          dishes: [
            {
              dishTemplate: '131415',
              price: 50,
              isPublished: true
            }
          ]
        }
      ],
      isActive: true
    };

    const mockResponse = {
      success: true,
      menu: mockMenu
    };

    mockAxiosInstance.get.mockResolvedValue(mockResponse);

    // 執行 API 請求
    const storeId = '456';
    const response = await menuApi.getStoreMenu(storeId);

    // 驗證結果
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/store/${storeId}/menu`);
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠創建菜單並處理成功回應', async () => {
    // 設置模擬的回應數據
    const mockNewMenu = {
      _id: '123',
      name: '新菜單',
      store: '456',
      brand: '789',
      categories: [
        {
          name: '主餐',
          dishes: [
            {
              dishTemplate: '101112',
              price: 150,
              isPublished: true
            }
          ]
        }
      ],
      isActive: true
    };

    const mockResponse = {
      success: true,
      message: '菜單創建成功',
      menu: mockNewMenu
    };

    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    // 執行 API 請求
    const storeId = '456';
    const menuData = {
      name: '新菜單',
      categories: [
        {
          name: '主餐',
          dishes: [
            {
              dishTemplate: '101112',
              price: 150,
              isPublished: true
            }
          ]
        }
      ],
      isActive: true
    };

    const response = await menuApi.createMenu({ storeId, data: menuData });

    // 驗證結果
    expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/store/${storeId}/menu`, menuData);
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠更新菜單並處理成功回應', async () => {
    // 設置模擬的回應數據
    const mockUpdatedMenu = {
      _id: '123',
      name: '更新的菜單',
      store: '456',
      brand: '789',
      categories: [
        {
          name: '更新的分類',
          dishes: [
            {
              dishTemplate: '101112',
              price: 180,
              isPublished: true
            }
          ]
        }
      ],
      isActive: true
    };

    const mockResponse = {
      success: true,
      message: '菜單更新成功',
      menu: mockUpdatedMenu
    };

    mockAxiosInstance.put.mockResolvedValue(mockResponse);

    // 執行 API 請求
    const storeId = '456';
    const menuId = '123';
    const menuData = {
      name: '更新的菜單',
      categories: [
        {
          name: '更新的分類',
          dishes: [
            {
              dishTemplate: '101112',
              price: 180,
              isPublished: true
            }
          ]
        }
      ]
    };

    const response = await menuApi.updateMenu({ storeId, menuId, data: menuData });

    // 驗證結果
    expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/store/${storeId}/menu/${menuId}`, menuData);
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠刪除菜單並處理成功回應', async () => {
    // 設置模擬的回應數據
    const mockResponse = {
      success: true,
      message: '菜單刪除成功'
    };

    mockAxiosInstance.delete.mockResolvedValue(mockResponse);

    // 執行 API 請求
    const storeId = '456';
    const menuId = '123';
    const response = await menuApi.deleteMenu({ storeId, menuId });

    // 驗證結果
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/store/${storeId}/menu/${menuId}`);
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠切換菜單啟用狀態並處理成功回應', async () => {
    // 設置模擬的回應數據
    const mockResponse = {
      success: true,
      message: '菜單狀態更新成功',
      isActive: true
    };

    mockAxiosInstance.put.mockResolvedValue(mockResponse);

    // 執行 API 請求
    const storeId = '456';
    const menuId = '123';
    const active = true;
    const response = await menuApi.toggleMenuActive({ storeId, menuId, active });

    // 驗證結果
    expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/store/${storeId}/menu/${menuId}/toggle`, { active });
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠處理獲取菜單失敗的情況', async () => {
    // 設置模擬的錯誤回應
    const errorResponse = {
      response: {
        data: {
          success: false,
          message: '菜單不存在'
        },
        status: 404
      }
    };

    mockAxiosInstance.get.mockRejectedValue(errorResponse);

    // 執行 API 請求並期待失敗
    try {
      await menuApi.getStoreMenu('456');
      // 如果沒有拋出錯誤，測試失敗
      expect(true).toBe(false);
    } catch (error) {
      // 驗證錯誤資訊
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/store/456/menu`);
      expect(error).toEqual(errorResponse);
    }
  });
});
