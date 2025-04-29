import express from 'express';
import authRoutes from './auth.js';
// import dishRoutes from './dish.js';
import storeRoutes from './store.js';
// import orderRoutes from './order.js';
// import promotionRoutes from './promotion.js';
// import userRoutes from './user.js';

// 創建一個主要的 API 路由器
const apiRouter = express.Router();

// 將所有路由掛載到 API 路由器上
apiRouter.use('/auth', authRoutes);
// apiRouter.use('/dish', dishRoutes);
apiRouter.use('/store', storeRoutes);
// apiRouter.use('/order', orderRoutes);
// apiRouter.use('/promotion', promotionRoutes);
// apiRouter.use('/user', userRoutes);

export default apiRouter;
