// API 主入口

import axios from 'axios';
import authApi from './modules/auth';
import storeApi from './modules/store';
import brandApi from './modules/brand';
import inventoryApi from './modules/inventory';
import menuApi from './modules/menu';
import dishApi from './modules/dish';
import imageApi from './modules/image'; // 新增 image 模組

// 獲取 API 基礎 URL，從環境變數或預設值
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 創建基本 axios 實例，用於整個應用程式
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 確保跨域請求能攜帶cookie
});

// 回應攔截器，用於統一處理回應
apiClient.interceptors.response.use(
  (response) => {
    // 只返回實際資料部分，而不是整個回應物件
    return response.data;
  },
  (error) => {
    // 統一錯誤處理
    if (error.response && error.response.data) {
      // 處理後端返回的錯誤信息
      const errorMessage = error.response.data.message || '請求失敗';
      console.error('API 請求錯誤:', errorMessage);
    } else {
      console.error('連接服務器失敗:', error.message);
    }
    return Promise.reject(error);
  }
);

// 導出所有 API 模組
export default {
  auth: authApi(apiClient),
  store: storeApi(apiClient),
  brand: brandApi(apiClient),
  inventory: inventoryApi(apiClient),
  menu: menuApi(apiClient),
  dish: dishApi(apiClient),
  image: imageApi(apiClient), // 新增 image 模組
  // 導出 axios 實例，方便直接使用
  client: apiClient,
};
