// tests/integration/auth.integration.spec.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import authApiFactory from '@/api/modules/auth';

// 模擬 axios 請求
vi.mock('axios');

describe('認證 API 整合測試', () => {
  let mockAxiosInstance;

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
  });

  it('應該能夠正確呼叫登入 API 並處理成功回應', async () => {
    // 設置模擬的登入成功回應
    const mockLoginResponse = {
      success: true,
      role: 'boss',
      manage: []
    };
    mockAxiosInstance.post.mockResolvedValue(mockLoginResponse);

    // 創建 API 實例
    const authApi = authApiFactory(mockAxiosInstance);

    // 執行登入
    const loginData = { name: 'admin', password: 'password123' };
    const response = await authApi.login(loginData);

    // 驗證結果
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', loginData);
    expect(response).toEqual(mockLoginResponse);
  });

  it('應該能夠正確處理登入失敗的情況', async () => {
    // 設置模擬的登入失敗回應
    const errorResponse = {
      response: {
        data: {
          success: false,
          message: '用戶名或密碼錯誤'
        },
        status: 401
      }
    };
    mockAxiosInstance.post.mockRejectedValue(errorResponse);

    // 創建 API 實例
    const authApi = authApiFactory(mockAxiosInstance);

    // 執行登入並期待失敗
    const loginData = { name: 'wrongadmin', password: 'wrongpassword' };

    try {
      await authApi.login(loginData);
      // 如果沒有拋出錯誤，測試失敗
      expect(true).toBe(false);
    } catch (error) {
      // 驗證錯誤資訊
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(error).toEqual(errorResponse);
    }
  });

  it('應該能夠正確呼叫創建管理員 API', async () => {
    // 設置模擬的創建管理員成功回應
    const mockResponse = {
      success: true,
      message: '管理員創建成功',
      admin: {
        _id: '123456',
        name: 'newadmin',
        role: 'store_admin'
      }
    };
    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    // 創建 API 實例
    const authApi = authApiFactory(mockAxiosInstance);

    // 執行創建管理員
    const adminData = {
      name: 'newadmin',
      password: 'password123',
      role: 'store_admin',
      manage: [
        {
          store: '654321',
          permission: ['order_system']
        }
      ]
    };
    const response = await authApi.createAdmin(adminData);

    // 驗證結果
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/admin', adminData);
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠正確呼叫登出 API', async () => {
    // 設置模擬的登出成功回應
    const mockResponse = {
      success: true,
      message: '登出成功'
    };
    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    // 創建 API 實例
    const authApi = authApiFactory(mockAxiosInstance);

    // 執行登出
    const response = await authApi.logout();

    // 驗證結果
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout');
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠正確呼叫修改密碼 API', async () => {
    // 設置模擬的修改密碼成功回應
    const mockResponse = {
      success: true,
      message: '密碼修改成功'
    };
    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    // 創建 API 實例
    const authApi = authApiFactory(mockAxiosInstance);

    // 執行修改密碼
    const passwordData = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword'
    };
    const response = await authApi.changePassword(passwordData);

    // 驗證結果
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/change-password', passwordData);
    expect(response).toEqual(mockResponse);
  });

  it('應該能夠正確呼叫檢查登入狀態 API', async () => {
    // 設置模擬的檢查登入狀態成功回應
    const mockResponse = {
      success: true,
      loggedIn: true,
      user: {
        _id: '123456',
        role: 'boss'
      }
    };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);

    // 創建 API 實例
    const authApi = authApiFactory(mockAxiosInstance);

    // 執行檢查登入狀態
    const response = await authApi.checkLoginStatus();

    // 驗證結果
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/check-status');
    expect(response).toBe(true);
  });

  it('應該在檢查登入狀態 API 失敗時返回 false', async () => {
    // 設置模擬的檢查登入狀態失敗回應
    mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

    // 創建 API 實例
    const authApi = authApiFactory(mockAxiosInstance);

    // 執行檢查登入狀態
    const response = await authApi.checkLoginStatus();

    // 驗證結果
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/check-status');
    expect(response).toBe(false);
  });
});
