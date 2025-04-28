# 測試文檔

本專案使用多種測試方法確保代碼質量和功能正確性。主要分為單元測試、整合測試、API 測試和端對端 (E2E) 測試。

## 測試環境設置

所有測試依賴都已在 `package.json` 中定義，包括:

- Vitest: 用於單元測試和整合測試
- Cypress: 用於端對端測試
- Supertest: 用於 API 測試

## 測試檔案結構

```
tests/
├── setup.js                   # 測試環境設定
├── unit/                      # 單元測試
│   ├── api/                   # 前端API模組單元測試
│   │   ├── auth.spec.js       # 認證API測試
│   │   ├── brand.spec.js      # 品牌API測試
│   │   ├── store.spec.js      # 店鋪API測試
│   │   └── ...
│   └── controllers/           # 後端控制器單元測試
│       ├── auth.controller.spec.js
│       └── ...
├── integration/               # 整合測試
│   ├── auth.integration.spec.js
│   └── ...
└── api/                       # API端點測試
    ├── auth.api.spec.js
    └── ...

cypress/
├── e2e/                       # 端對端測試
│   ├── admin/                 # 管理後台測試
│   │   ├── login.cy.js
│   │   └── stores.cy.js
│   └── ...
├── fixtures/                  # 測試資料
└── ...
```

## 執行測試

### 單元測試和整合測試

使用 Vitest 執行單元測試和整合測試:

```bash
# 執行所有單元和整合測試
yarn test:unit

# 監視模式
yarn test:unit:watch

# 執行特定測試檔案
yarn test:unit tests/unit/api/auth.spec.js

# 執行測試並產生覆蓋率報告
yarn test:unit:coverage
```

### API 測試

API 測試也使用 Vitest 執行:

```bash
# 執行所有 API 測試
yarn test:api

# 執行特定 API 測試
yarn test:api tests/api/auth.api.spec.js
```

### E2E 測試

使用 Cypress 執行端對端測試:

```bash
# 開啟 Cypress 互動式測試介面
yarn test:e2e:dev

# 執行所有 E2E 測試 (無界面)
yarn test:e2e

# 執行特定 E2E 測試
yarn cypress run --spec "cypress/e2e/admin/login.cy.js"
```

## 測試注意事項

### 模擬外部依賴

- 在 `tests/setup.js` 中設置了常用依賴的模擬，包括 Vue Router、axios、bcrypt、mongoose 等。
- 圖片上傳功能尚未實現 Cloudflare R2 的整合，相關測試中有標註。
- 使用 `vi.mock()` 和 `vi.fn()` 來模擬依賴和函數。

### 資料庫

測試環境不使用實際資料庫，而是模擬 Mongoose 模型和方法。如果需要使用實際資料庫進行測試，可以設置測試資料庫並在 `setup.js` 中進行配置。

### 身份驗證

- 單元測試和整合測試中模擬了身份驗證狀態。
- API 測試和 E2E 測試中模擬了認證中間件或設置了模擬的認證 cookie。

### 常見問題和解決方案

1. **測試超時**: 對於可能需要較長時間的測試，可以設置更長的超時時間:

   ```javascript
   // 在測試檔案中設置
   vi.setConfig({ testTimeout: 10000 })
   ```

2. **模擬檔案上傳**: 在 Cypress 測試中，使用 `cy.fixture()` 和 `cy.get('input[type="file"]').attachFile()` 來模擬檔案上傳。

3. **解決 Vue 組件渲染問題**: 在測試 Vue 組件時，確保正確設置了 JSDOM 環境並等待組件渲染完成。

4. **API 請求攔截**: 在 E2E 測試中使用 `cy.intercept()` 來模擬 API 請求和響應。

## 添加新測試

添加新測試時，請遵循以下規範:

1. 測試檔案應該放在對應的目錄中 (unit/, integration/, api/, e2e/)。
2. 測試檔案應該使用 `.spec.js` 或 `.cy.js` 作為副檔名。
3. 單元測試應該專注於測試單個函數或組件。
4. 整合測試應該專注於測試多個組件或模組之間的交互。
5. API 測試應該專注於測試 API 端點的行為。
6. E2E 測試應該模擬實際用戶交互流程。

## 未實現的功能測試

請注意，以下功能的測試尚未完全實現:

1. CloudFlare R2 圖片上傳功能 - 目前僅模擬了上傳過程
2. 某些需要複雜用戶界面交互的測試 - 需要根據實際 UI 設計調整

## 測試覆蓋率

執行 `yarn test:unit:coverage` 可以產生覆蓋率報告，報告將顯示在控制台並在 `coverage/` 目錄中生成 HTML 報告。
