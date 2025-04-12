/**
 * server/services/order/index.js
 *
 * 訂單服務入口文件
 * 匯總並導出所有訂單相關服務
 */

// 導入訂單計算服務
import * as calculateService from './calculateOrder.js';

// 將來導入其他訂單服務
// import * as createService from './createOrder.js';
// import * as processService from './processOrder.js';
// import * as paymentService from './paymentService.js';

// 導出所有訂單服務
export const calculateOrder = calculateService;
// export const createOrder = createService;
// export const processOrder = processService;
// export const paymentOrder = paymentService;
