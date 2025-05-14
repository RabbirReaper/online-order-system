import express from 'express';
import authRoutes from './auth.js';
import dishRoutes from './dish.js';
import storeRoutes from './store.js';
import brandRoutes from './brand.js';
// import orderRoutes from './order.js';
import promotionRoutes from './promotion.js';
// import userRoutes from './user.js';
import adminRoutes from './admin.js';
import { errorHandler, notFoundHandler } from '../middlewares/error.js';

// 創建一個主要的 API 路由器
const apiRouter = express.Router();

// 將所有路由掛載到 API 路由器上
apiRouter.use('/auth', authRoutes);
apiRouter.use('/dish', dishRoutes);
apiRouter.use('/store', storeRoutes);
apiRouter.use('/brand', brandRoutes);
// apiRouter.use('/order', orderRoutes);
apiRouter.use('/promotion', promotionRoutes);
// apiRouter.use('/user', userRoutes);
apiRouter.use('/admin', adminRoutes);
// 錯誤處理中介軟體
apiRouter.use(notFoundHandler);
apiRouter.use(errorHandler);

export default apiRouter;
