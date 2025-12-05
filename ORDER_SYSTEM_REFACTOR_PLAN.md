# 訂單系統重構計劃

## 執行摘要

本計劃旨在重構訂單系統的後端 API 與前端調用邏輯，解決技術債，提升代碼可維護性。

**核心問題**：
- 後端：Controller 包含過多業務邏輯（137 行）、Service 層不必要的轉發層、代碼重複
- 前端：CartView.vue 過於龐大（1233 行）、API 調用分散、錯誤處理不一致
- 測試：Service 層核心邏輯測試不足（60%）、前端組件測試不足（10%）

**預估工作量**：6-7 週（30-35 個工作日，1 人專職）

## 重構策略

**採用激進式重構 + 小步快跑**：
- ✅ 每完成一小部分立即測試前後端
- ✅ 測試通過後才進行下一步
- ✅ 測試環境驗證 → 生產環境無縫接軌
- ✅ 不使用 Feature Flag（流量不大，可接受直接替換）
- ✅ 不引入 TypeScript（保持現狀）

**最高優先級**：API 統一格式（階段 2 提前）

---

## 階段 0：測試補充（1 週，5-7 天）

### 目標
為重構建立安全網，確保核心功能有充分的測試覆蓋。

### 任務清單

#### 1. 補充後端服務層測試（3-4 天）
- [ ] `orderCreation.createOrder()` 單元測試
  - 測試現場付款流程
  - 測試線上付款流程（臨時訂單創建）
  - 測試庫存扣除邏輯
  - 測試優惠券標記
  - 測試錯誤處理
- [ ] `orderCreation.finalizeOnlinePaymentOrder()` 單元測試
- [ ] `orderValidation.validateOrderBeforeCreation()` 單元測試
- [ ] 訂單狀態轉換測試（狀態機）
- [ ] 訂單編號生成邏輯測試（並發場景）

#### 2. 建立基礎 E2E 測試（2-3 天）
- [ ] 現場付款訂單流程（內用/外帶/外送）
- [ ] 線上付款訂單流程（NewebPay）
- [ ] 訂單取消流程

### 完成標準
- Service 層測試覆蓋率 ≥ 85%
- E2E 測試涵蓋關鍵路徑
- 所有測試在 CI 中穩定運行

---

## 階段 1：後端重構（2 週，10 天）

### 1.1 創建共用模組（2 天）

#### 新建文件
1. **`server/services/order/orderStateMachine.js`**
   - 定義訂單狀態轉換規則
   - 提供狀態驗證函數

2. **`server/services/order/orderPopulateConfig.js`**
   - 統一管理 Mongoose populate 配置
   - 避免重複的 populate 定義

3. **`server/middlewares/orderValidationMiddleware.js`**
   - 使用 express-validator 統一參數驗證
   - 移除 Controller 中的驗證邏輯

4. **`server/utils/errorCodes.js`**
   - 定義所有業務錯誤碼
   - 統一錯誤訊息格式

### 1.2 重構 Controller 層（2 天）

#### 重構文件
**`server/controllers/Order/orderCustomer.js`** (最關鍵)

**問題**：
- `createOrder()` 方法包含 137 行業務邏輯
- 包含現場/線上付款分支、Transaction 創建、NewebPay 整合

**重構策略**：
1. 將付款流程邏輯移至新的 Service 層
2. Controller 只負責 HTTP 處理（提取參數、返回回應）
3. 目標：每個 Controller 方法 < 50 行

**重構後結構**：
```javascript
export const createOrder = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params
  const { orderData, paymentType, paymentMethod } = req.body

  // 組裝訂單數據
  const completeOrderData = {
    ...orderData,
    paymentType,
    paymentMethod,
    brand: brandId,
    store: storeId,
    user: req.auth?.userId,
  }

  // 調用 Service 層統一處理
  const result = await orderOrchestrator.createOrder(completeOrderData)

  // 返回統一格式回應
  res.json(formatSuccessResponse(result))
})
```

#### 同時重構
- **`server/controllers/Order/orderAdmin.js`** - 簡化業務邏輯
- **`server/routes/orderCustomer.js`** - 添加驗證中間件

### 1.3 簡化 Service 層（3 天）

#### 移除不必要的轉發層
**刪除文件**：
- `server/services/order/orderCustomer.js` (129 行轉發層)
- `server/services/order/orderAdmin.js` (198 行轉發層)

**新建文件**：
1. **`server/services/order/orderOrchestrator.js`** (協調層)
   - 統一導出所有訂單服務
   - 提供清晰的服務調用入口

2. **`server/services/order/createOrderFlow.js`** (創建訂單流程)
   - 整合現場付款和線上付款流程
   - 封裝 Transaction 創建邏輯
   - 封裝 NewebPay 表單生成邏輯

3. **`server/services/order/updateOrderFlow.js`** (更新訂單流程)
   - 整合訂單更新邏輯
   - 處理狀態轉換副作用（點數給予、券生成等）

4. **`server/services/order/cancelOrderFlow.js`** (取消訂單流程)
   - 整合取消訂單邏輯
   - 處理庫存恢復、券還原

**調用鏈變化**：
```
重構前：Controller → orderCustomer.js → orderCreation.js
重構後：Controller → orderOrchestrator.js → createOrderFlow.js
```

### 1.4 統一查詢邏輯（2 天）

#### 新建文件
**`server/services/order/queryBuilder.js`** (查詢構建器)

**解決的問題**：
- 分頁計算重複
- Populate 配置重複
- `isFinalized: true` 硬編碼

**實作範例**：
```javascript
export class OrderQueryBuilder {
  filter(conditions) { ... }
  finalized(value = true) { ... }  // 彈性設定 isFinalized
  populate(fields) { ... }
  sort(field, order) { ... }
  paginate(page, limit) { ... }
  async execute() { ... }
}
```

#### 重構文件
**`server/services/order/orderQueries.js`** (273 行)
- 使用 QueryBuilder 重構所有查詢函數
- 消除重複的分頁邏輯
- 統一 populate 配置

### 1.5 移除模擬 API（1 天）

#### 處理模擬實作
**`server/services/order/orderPayment.js`** (392 行)

**問題**：
- `processPayment()` 和 `paymentCallback()` 是模擬實作
- 但暴露為公開 API 端點

**解決方案**（三選一）：
1. 移至內部測試路由 `/api/internal/test/orders/:orderId/payment`
2. 完全移除（如果沒有實際使用）
3. 實作真實的付款處理（整合 NewebPay）

---

## 階段 2：API 統一格式（提前至第 2 週，3 天）⭐ 最高優先級

**為什麼提前**：
- 這是您的最高優先級需求
- API 格式統一後，後續重構會更順暢
- 可以立即改善前後端溝通一致性

### 2.1 統一 API 回應格式（1.5 天）

#### 小步驟 1：創建錯誤碼系統（0.5 天）

#### 新建文件 1：`server/utils/errorCodes.js`

```javascript
export const ERROR_CODES = {
  // 訂單相關（1000-1999）
  ORDER_NOT_FOUND: { code: 1001, message: '訂單不存在', status: 404 },
  ORDER_ALREADY_PAID: { code: 1002, message: '訂單已付款', status: 400 },
  ORDER_CREATION_FAILED: { code: 1003, message: '訂單創建失敗', status: 500 },

  // 庫存相關（2000-2999）
  INSUFFICIENT_STOCK: { code: 2001, message: '庫存不足', status: 400 },

  // 優惠券相關（3000-3999）
  VOUCHER_NOT_FOUND: { code: 3001, message: '兌換券不存在', status: 404 },
  VOUCHER_EXPIRED: { code: 3002, message: '兌換券已過期', status: 400 },

  // ...更多
}
```

**✅ 驗證點**：運行 `yarn lint`，確保文件格式正確

#### 小步驟 2：創建回應格式化中間件（0.5 天）

**新建文件 2：`server/middlewares/responseFormatter.js`**

**統一成功回應**：
```json
{
  "success": true,
  "data": {
    "order": { ... },
    "pagination": { ... }
  },
  "message": "訂單創建成功"
}
```

**統一錯誤回應**：
```json
{
  "success": false,
  "error": {
    "code": 1001,
    "message": "訂單不存在"
  }
}
```

**✅ 驗證點**：撰寫單元測試，測試格式化函數

#### 小步驟 3：更新全局錯誤處理器（0.5 天）

**更新文件**：`server/middlewares/error.js`

```javascript
export function globalErrorHandler(err, req, res, next) {
  console.error('[ERROR]', err)

  // 如果是 AppError，使用預定義的錯誤碼
  if (err.name === 'AppError') {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || err.statusCode,
        message: err.message,
      }
    })
  }

  // Mongoose 驗證錯誤
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: '資料驗證失敗',
        details: err.errors,
      }
    })
  }

  // 預設錯誤
  return res.status(500).json({
    success: false,
    error: {
      code: 500,
      message: process.env.NODE_ENV === 'production' ? '伺服器錯誤' : err.message,
    }
  })
}
```

**✅ 驗證點**：
1. 故意觸發錯誤，檢查回應格式
2. 運行現有測試，確保行為一致

#### 小步驟 4：更新訂單 Controller（0.5 天）

**更新文件**：`server/controllers/Order/orderCustomer.js`

**重構前**：
```javascript
res.json({
  success: true,
  order: result,
  message: '訂單已送出',
})
```

**重構後**：
```javascript
res.json({
  success: true,
  data: { order: result },
  message: '訂單已送出',
})
```

**✅ 驗證點**：
1. 運行訂單相關測試：`NODE_ENV=test yarn test:unit tests/unit/server/controllers/Order/`
2. 手動測試創建訂單 API
3. 手動測試獲取訂單列表 API
4. 確認前端可以正常顯示訂單

#### 小步驟 5：更新前端 API 層（0.5 天）

**更新文件**：
- `src/api/modules/orderCustomer.js`
- `src/api/modules/orderAdmin.js`

**適配新的回應格式**：
```javascript
// 更新 axios 攔截器
axiosInstance.interceptors.response.use(
  (response) => {
    // 新格式：{ success, data, message }
    if (response.data.success) {
      return response.data.data  // 返回 data 字段
    }
    return response.data
  },
  (error) => {
    // 統一錯誤格式：{ success: false, error: { code, message } }
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.message)
    }
    throw error
  }
)
```

**✅ 驗證點**：
1. 在測試環境部署後端
2. 在測試環境部署前端
3. 手動測試所有訂單相關功能
4. 確認錯誤訊息正確顯示

### 2.2 API 文檔生成（1 天）

#### 安裝工具
```bash
yarn add swagger-jsdoc swagger-ui-express
```

#### 新建文件
**`server/docs/swagger.js`** - Swagger 配置

#### 添加 JSDoc 註解
在所有路由文件中添加 Swagger 註解：
- `server/routes/orderCustomer.js`
- `server/routes/orderAdmin.js`

**完成後**：訪問 `http://localhost:8700/api-docs` 查看完整 API 文檔

### 2.3 API 版本控制（0.5 天）

**決策**：由於採用激進式重構，暫時不需要版本控制

**可選**：如果未來需要，可以簡單添加版本前綴
```javascript
// v1（當前）
app.use('/api/order-customer', orderCustomerRoutes)

// v2（未來）
app.use('/api/v2/order-customer', orderCustomerRoutesV2)
```

**✅ 驗證點**：
- 階段 2 完成後，進行完整回歸測試
- 在測試環境驗證 1-2 天
- 確認無問題後進入階段 1

---

## 階段 3：前端重構（2 週，10 天）

### 3.1 創建統一的訂單 Store（2 天）

#### 新建文件
**`src/stores/orderStore.js`** (統一訂單狀態管理)

**功能**：
- 管理訂單列表（`orders`）
- 管理當前訂單詳情（`currentOrder`）
- 統一 Loading 狀態（`isLoading`, `isLoadingDetail`, `isCreatingOrder`）
- 統一錯誤處理（`error`）
- 提供所有訂單操作方法（`fetchOrders`, `fetchOrderById`, `createOrder`）

**解決的問題**：
- 組件直接調用 API，繞過狀態管理
- 錯誤處理不一致
- Loading 狀態分散

### 3.2 創建 Composables（2 天）

#### 新建文件
1. **`src/composables/useOrderFormatter.js`**
   - 訂單狀態格式化（`formatOrderStatus`）
   - 訂單類型格式化（`formatOrderType`）
   - 付款方式格式化（`formatPaymentMethod`）
   - 價格格式化（`formatPrice`）
   - 日期格式化（`formatDate`）

2. **`src/composables/useErrorHandler.js`**
   - 統一錯誤顯示邏輯
   - 統一 API 錯誤處理

3. **`src/composables/useLoadingState.js`**
   - 統一 Loading 狀態管理
   - 提供 `withLoading()` 高階函數

**解決的問題**：
- 格式化邏輯重複
- 錯誤處理不一致（showError / errorMessage / alert 混用）
- Loading 狀態管理混亂

### 3.3 重構 CartView.vue（4 天）

#### 重構文件
**`src/views/customer/CartView.vue`** (1233 行 → 100-200 行)

**拆分策略**：

**主容器**：`CartView.vue` (100-200 行)
- 協調所有子組件
- 處理訂單提交邏輯
- 使用 orderStore 和 composables

**新建子組件**：
1. `src/components/customer/cart/CartHeader.vue` (導航標題)
2. `src/components/customer/cart/EmptyCart.vue` (空購物車提示)
3. `src/components/customer/cart/CartItemList.vue` (訂單項目列表)
4. `src/components/customer/cart/OrderNotes.vue` (訂單備註)
5. `src/components/customer/cart/VoucherSelector.vue` (兌換券選擇器)
6. `src/components/customer/cart/CouponSelector.vue` (折價券選擇器)
7. `src/components/customer/cart/OrderSummary.vue` (訂單摘要)
8. `src/components/customer/cart/PaymentMethodSelector.vue` (支付方式選擇)

**每個子組件**：
- 單一職責
- 使用 props 接收數據
- 使用 emits 發送事件
- < 200 行代碼

### 3.4 統一錯誤處理和 Loading（1 天）

#### 新建共用組件
1. **`src/components/common/ErrorAlert.vue`**
   - 統一的錯誤提示組件
   - **重要**：直接顯示後端的錯誤訊息（`error.message`），不要自定義

2. **`src/components/common/LoadingOverlay.vue`**
   - 統一的 Loading 遮罩

#### 更新所有組件
替換所有自定義錯誤處理為統一的 `useErrorHandler` composable

**錯誤處理原則**：
- ✅ 直接顯示後端 `throw new AppError(message)` 的訊息
- ❌ 不要在前端自定義錯誤訊息
- ✅ 保持後端錯誤訊息的語義完整性

### 3.5 移除直接 API 調用（1 天）

#### 搜索並重構
```bash
# 搜索直接調用 API 的組件
grep -r "import api from '@/api'" src/views/ src/components/
```

**重構原則**：
- 所有 API 調用必須通過 Store
- 移除組件內的 `import api from '@/api'`
- 使用 `useOrderStore()` 替代

**受影響的文件**：
- `src/views/customer/CartView.vue` (line 670)
- `src/views/customer/OrderHistoryView.vue` (line 545)
- 其他發現的組件

---

## 階段 4：測試與優化（1 週，5 天）

### 4.1 補充前端組件測試（2 天）

**目標**：將前端組件測試覆蓋率從 10% 提升至 70%

#### 優先測試
1. `CartView.vue` (重構後的主容器)
2. 所有新創建的子組件（OrderSummary, VoucherSelector 等）
3. `orderStore.js`（Pinia Store）

#### 測試工具
- Vitest + @vue/test-utils

### 4.2 E2E 測試完善（2 天）

#### 測試場景
1. **現場付款訂單流程**
   - 添加商品 → 選擇支付方式 → 提交訂單 → 驗證訂單確認頁

2. **線上付款訂單流程**
   - 添加商品 → 選擇線上付款 → 提交訂單 → 驗證導航至付款頁

3. **訂單取消流程**
   - 管理員登入 → 選擇訂單 → 取消訂單 → 驗證狀態變更

#### 測試工具
- Cypress

### 4.3 性能優化（1 天）

#### 後端優化
1. **資料庫索引優化**
   ```javascript
   orderSchema.index({ store: 1, createdAt: -1 })
   orderSchema.index({ user: 1, createdAt: -1 })
   orderSchema.index({ brand: 1, isFinalized: 1, createdAt: -1 })
   ```

2. **查詢優化**
   - 使用 `.lean()` 提升查詢性能
   - 避免 N+1 查詢問題

#### 前端優化
1. **組件懶加載**
   ```javascript
   const CartView = () => import('@/views/customer/CartView.vue')
   ```

2. **防抖搜索**
   ```javascript
   const debouncedSearch = debounce(async (keyword) => {
     await orderStore.searchOrders(keyword)
   }, 300)
   ```

---

## 風險控制策略

### 小步快跑 + 充分測試

**每個小步驟的流程**：
1. ✅ 完成一個小模組的重構（例如：統一 API 回應格式）
2. ✅ 運行所有相關測試（單元測試 + 整合測試）
3. ✅ 手動測試前後端功能
4. ✅ 在測試環境部署並驗證
5. ✅ 確認無問題後進行下一步

**測試環境 → 生產環境流程**：
1. 在測試環境完成所有重構和測試
2. 進行完整的回歸測試
3. 準備部署到生產環境
4. 生產環境部署（無縫接軌）
5. 監控關鍵指標 24-48 小時

### Git 分支策略

```bash
main (生產環境)
  ↑
test (測試環境)
  ↑
feature/order-system-refactor (開發分支)
```

**工作流程**：
1. 在 `feature/order-system-refactor` 開發
2. 每完成一小步，合併到 `test` 分支
3. 測試環境驗證通過
4. 所有重構完成後，合併到 `main` 分支

### 快速回滾

**回滾決策標準**：
- 任何關鍵功能異常（訂單創建、支付、查詢）
- 錯誤率明顯上升
- 用戶反饋有問題

**回滾方式**：
1. Git 回滾：`git revert <commit-hash>` 或 `git reset --hard <commit-hash>`
2. 重新部署上一個穩定版本
3. 分析問題原因，修復後再次部署

### 監控和告警

**關鍵指標**：
- 訂單創建成功率
- 訂單創建回應時間（P50, P95, P99）
- 錯誤率（按錯誤碼分類）

**告警規則**：
- 訂單創建失敗率 > 5% → 立即告警
- 訂單創建 P95 > 5 秒 → 告警

---

## 成功指標

### 代碼質量
| 指標 | 重構前 | 目標 |
|------|--------|------|
| Controller 平均行數 | 137 行 | < 50 行/方法 |
| Service 層深度 | 3 層（轉發） | 2 層（直接） |
| 代碼重複率 | ~30% | < 10% |

### 測試覆蓋率
| 指標 | 重構前 | 目標 |
|------|--------|------|
| 後端 Controller | 90% | 90% (維持) |
| 後端 Service | 60% | 85%+ |
| 前端 Store | 90% | 90% (維持) |
| 前端組件 | 10% | 70%+ |
| E2E 測試 | 0% | 80% (關鍵路徑) |

### 性能指標
| 指標 | 重構前 | 目標 |
|------|--------|------|
| 訂單創建回應時間 | ~500ms | < 300ms |
| 訂單查詢回應時間 | ~200ms | < 150ms |
| CartView 組件大小 | 1233 行 | < 200 行 |

### 可維護性
| 指標 | 重構前 | 目標 |
|------|--------|------|
| API 文檔覆蓋率 | 0% | 100% |
| 錯誤訊息一致性 | 50% | 100% |

---

## 關鍵文件清單

### 優先級 P0（最關鍵，必須重構）

#### 後端
1. **`server/controllers/Order/orderCustomer.js`** ⭐⭐⭐
   - 問題：包含 137 行業務邏輯
   - 重構：移動邏輯至 Service 層

2. **`server/services/order/orderCreation.js`** ⭐⭐⭐
   - 問題：缺少單元測試
   - 重構：補充測試，優化線上付款流程

3. **`server/services/order/orderQueries.js`** ⭐⭐⭐
   - 問題：查詢邏輯重複
   - 重構：使用 QueryBuilder

4. **`server/services/order/orderCustomer.js`** ⭐⭐
   - 問題：不必要的轉發層
   - 重構：刪除，創建 orderOrchestrator.js

#### 前端
5. **`src/views/customer/CartView.vue`** ⭐⭐⭐
   - 問題：1233 行過於龐大
   - 重構：拆分為 6-8 個子組件

6. **（新建）`src/stores/orderStore.js`** ⭐⭐⭐
   - 問題：缺少統一訂單狀態管理
   - 重構：創建新 Store

### 需要新建的關鍵文件

#### 後端（優先級 P0）
- `server/services/order/orderOrchestrator.js` - 協調層
- `server/services/order/createOrderFlow.js` - 創建訂單流程
- `server/services/order/queryBuilder.js` - 查詢構建器
- `server/middlewares/orderValidationMiddleware.js` - 統一驗證
- `server/utils/errorCodes.js` - 錯誤碼定義

#### 前端（優先級 P0）
- `src/stores/orderStore.js` - 訂單 Store
- `src/composables/useOrderFormatter.js` - 格式化邏輯
- `src/composables/useErrorHandler.js` - 錯誤處理
- `src/composables/useLoadingState.js` - Loading 管理
- `src/components/customer/cart/OrderSummary.vue` (及其他 5-7 個子組件)

#### 測試（優先級 P0）
- `tests/unit/server/services/order/orderCreation.test.js` - 核心服務測試
- `tests/e2e/order/onsitePayment.cy.js` - E2E 測試
- `tests/e2e/order/onlinePayment.cy.js` - E2E 測試

---

## 調整後的時間表（優先 API 統一格式）

### 重新排序的階段

| 週 | 階段 | 主要任務 | 工作日 | 驗證點 |
|----|------|---------|--------|--------|
| 1 | 階段 0 | 補充測試 | 5-7 | ✅ Service 層測試覆蓋率 ≥ 85% |
| 2 | **階段 2（提前）** | **API 統一格式** | 3 | ✅ 所有 API 回應格式一致 |
| 2-3 | 階段 1.1-1.2 | 創建共用模組 + 重構 Controller | 4 | ✅ Controller < 50 行/方法 |
| 3-4 | 階段 1.3-1.4 | 簡化 Service + 統一查詢 | 5 | ✅ 移除轉發層，調用鏈縮短 |
| 4 | 階段 1.5 | 移除模擬 API | 1 | ✅ 清理無用 API |
| 5 | 階段 3.1-3.2 | 創建 Store + Composables | 4 | ✅ Store 測試通過 |
| 6 | 階段 3.3-3.4 | 重構 CartView + 統一錯誤處理 | 5 | ✅ CartView < 200 行 |
| 7 | 階段 3.5 + 4 | 移除直接調用 + 測試優化 | 5 | ✅ 所有測試通過 |

**總計**：6-7 週（30-35 個工作日，1 人專職）

### 每個階段的小步驟

每個階段都會拆分為多個小步驟，每完成一步就測試驗證：

**範例（階段 2：API 統一格式）**：
1. 創建 `errorCodes.js` → 測試
2. 創建 `responseFormatter.js` → 測試
3. 更新 `error.js` 全局錯誤處理 → 測試
4. 更新 1 個 Controller（orderCustomer） → 測試前後端
5. 更新其他 Controller → 測試前後端
6. 更新前端 API 層適配新格式 → 測試前後端
7. 完整回歸測試 → 部署到測試環境
8. 測試環境驗證通過 → 繼續下一階段

---

## 下一步行動

### 立即行動（本週內）
1. ✅ 審查並批准重構計劃
2. ⬜ 設置開發分支：`feature/order-system-refactor`
3. ⬜ 開始階段 0：補充核心測試

### 第 1 個月
- 完成後端重構（階段 1-2）
- 每週代碼審查

### 第 2 個月
- 完成前端重構（階段 3）
- 補充測試和性能優化（階段 4）
- 準備灰度發布

### 第 3 個月
- 生產環境灰度發布
- 監控關鍵指標
- 全量發布

---

## 關鍵決策點

需要在以下時間點進行決策：

1. **Week 3 結束**：是否繼續前端重構？（基於後端測試結果）
2. **Week 6 結束**：是否開始灰度發布？（基於整體測試結果）
3. **灰度發布 Week 1**：是否擴大流量？（基於錯誤率和性能）
4. **灰度發布 Week 3**：是否全量發布？（基於用戶反饋）

---

**文件版本**：v1.0
**創建日期**：2025-01-09
**預估完成日期**：2025-02-28
**最後更新**：2025-01-09
