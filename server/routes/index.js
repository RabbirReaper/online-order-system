import express from 'express';
import adminAuthRoutes from './adminAuth.js';
import userAuthRoutes from './userAuth.js';
import adminUserRoutes from './adminUser.js';
import dishRoutes from './dish.js';
import storeRoutes from './store.js';
import brandRoutes from './brand.js';
import promotionRoutes from './promotion.js';
import userRoutes from './user.js';
import adminRoutes from './admin.js';
import { errorHandler, notFoundHandler } from '../middlewares/error.js';
import orderCustomerRoutes from './orderCustomer.js';
import orderAdminRoutes from './orderAdmin.js';

// 創建一個主要的 API 路由器
const apiRouter = express.Router();

// 將所有路由掛載到 API 路由器上
apiRouter.use('/admin-auth', adminAuthRoutes);    // 管理員認證路由
apiRouter.use('/user-auth', userAuthRoutes);      // 用戶認證路由
apiRouter.use('/admin-user', adminUserRoutes);    // 管理員用戶管理路由
apiRouter.use('/dish', dishRoutes);
apiRouter.use('/store', storeRoutes);
apiRouter.use('/brand', brandRoutes);
apiRouter.use('/promotion', promotionRoutes);
apiRouter.use('/user', userRoutes);
apiRouter.use('/admin', adminRoutes);

// 訂單路由 - 按權限分離
apiRouter.use('/order-customer', orderCustomerRoutes);  // 前台客戶訂單
apiRouter.use('/order-admin', orderAdminRoutes);        // 後台管理員訂單


// API 健康檢查
apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API 服務正常運行',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});


// 錯誤處理中介軟體
apiRouter.use(notFoundHandler);
apiRouter.use(errorHandler);

export default apiRouter;
