// tests/unit/api/auth.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import authApiFactory from '@/api/modules/auth';

describe('認證 API 模組', () => {
  let mockApiClient;
  let authApi;

  beforeEach(() => {
    // 創建模擬的 API client
    mockApiClient = {
      post: vi.fn().mockResolvedValue({ success: true }),
      get: vi.fn().mockResolvedValue({ success: true })
    };

    // 使用模擬的 client 創建 authApi 實例
    authApi = authApiFactory(mockApiClient);
  });

  it('login 函數應該發送 POST 請求到 /auth/login 路徑', async () => {
    const loginData = { name: 'testadmin', password: 'password123' };

    await authApi.login(loginData);

    expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
  });

  it('createAdmin 函數應該發送 POST 請求到 /auth/admin 路徑', async () => {
    const adminData = {
      name: 'newadmin',
      password: 'password123',
      role: 'store_admin',
      manage: [{ store: '123456', permission: ['order_system'] }]
    };

    await authApi.createAdmin(adminData);

    expect(mockApiClient.post).toHaveBeenCalledWith('/auth/admin', adminData);
  });

  it('logout 函數應該發送 POST 請求到 /auth/logout 路徑', async () => {
    await authApi.logout();

    expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('changePassword 函數應該發送 POST 請求到 /auth/change-password 路徑', async () => {
    const passwordData = {
      currentPassword: 'old_password',
      newPassword: 'new_password'
    };

    await authApi.changePassword(passwordData);

    expect(mockApiClient.post).toHaveBeenCalledWith('/auth/change-password', passwordData);
  });

  it('checkLoginStatus 函數應該發送 GET 請求到 /auth/check-status 路徑', async () => {
    mockApiClient.get.mockResolvedValue({ success: true });

    const result = await authApi.checkLoginStatus();

    expect(mockApiClient.get).toHaveBeenCalledWith('/auth/check-status');
    expect(result).toBe(true);
  });

  it('checkLoginStatus 函數在請求失敗時應返回 false', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Network error'));

    const result = await authApi.checkLoginStatus();

    expect(mockApiClient.get).toHaveBeenCalledWith('/auth/check-status');
    expect(result).toBe(false);
  });
});
