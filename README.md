<div align="center">

# 🍽️ Multi-Brand Restaurant Ordering System

# 多品牌餐廳訂餐管理系統

[![License](https://img.shields.io/badge/license-Modified%20MIT-blue.svg)](./LICENSE)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-brightgreen.svg)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)

A modern, full-stack restaurant management system supporting multiple brands, real-time inventory tracking, and comprehensive order management.

現代化全端餐廳管理系統，支援多品牌管理、即時庫存追蹤與完整訂單管理功能。

[English](#english) | [繁體中文](#繁體中文)

</div>

---

## English

### 📋 Overview

This is a comprehensive multi-brand restaurant ordering and management system built with modern web technologies. The platform enables restaurant groups to manage multiple brands, each with multiple store locations, providing a complete solution for restaurant operations.

### ✨ Key Features

#### 🏢 **Multi-Brand Architecture**

- System administrators can manage multiple restaurant brands
- Each brand can have multiple store locations
- Centralized menu templates shared across brand locations
- Flexible store-specific customization

#### 📦 **Order Management**

- Support for dine-in, takeout, and delivery orders
- **Mixed cart system**: Combine food items and promotional bundles in a single transaction
- Real-time order tracking and status updates
- Multiple payment methods: cash, credit card, LINE Pay

#### 📊 **Inventory Control**

- Real-time stock tracking for all menu items
- Automatic inventory reduction on order completion
- Low stock alerts and sold-out management
- Detailed stock change logs with reasons

#### 🎁 **Promotion System**

- **Points accumulation**: Earn points based on order total
- **Discount coupons**: Percentage or fixed amount discounts
- **Exchange vouchers**: Redeem free items with points
- **Bundle deals**: Special promotional packages
- Points expiration management (FIFO)

#### 👥 **User & Permission Management**

- **Customer accounts**: Registration, profile management, order history
- **Boss (System Admin)**: Full system access, manage all brands
- **Brand Admin**: Manage specific brand's stores and settings
- **Store Admin**: Granular permissions (P1-P4) for store operations
  - P1: POS access, inventory management
  - P2: View backend data, accounting
  - P3: Edit backend data
  - P4: Employee permission management

#### 🛒 **Point-of-Sale (POS) System**

- Staff-focused ordering interface
- Quick order creation and modification
- Payment processing and confirmation
- Order queue management

### 🛠️ Tech Stack

**Frontend**

- Vue 3 + Composition API
- Vite (build tool)
- Pinia (state management)
- Vue Router 4
- Bootstrap Vue Next
- Vue i18n (internationalization)

**Backend**

- Express.js (Node.js framework)
- MongoDB + Mongoose ODM
- Express Session
- RESTful API architecture

**Testing**

- Vitest (unit testing)
- Cypress (E2E testing)

**External Integrations**

- UberEats API (delivery integration)
- KotSMS (SMS verification)
- LINE LIFF (LINE integration)
- TapPay (payment gateway)
- Cloudflare R2 (file storage)

### 🚀 Getting Started

#### Prerequisites

- Node.js 18+ and Yarn
- MongoDB 6.x
- Git

#### Installation

```bash
# Clone the repository
git clone <repository-url>
cd online-order-system

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env and configure:
# - MongoDB_url
# - SESSION_SECRET
# - Payment gateway credentials
# - SMS service credentials
```

#### Development

```bash
# Start frontend development server (port 5173)
yarn dev

# Start backend server (port 8700) in another terminal
node server.js

# Run unit tests
yarn test:unit

# Run E2E tests
yarn test:e2e:dev
```

#### Production Build

```bash
# Build for production
yarn build

# Preview production build
yarn preview

# Run production server
NODE_ENV=production node server.js
```

### 📁 Project Structure

```
online-order-system/
├── src/                      # Frontend source code
│   ├── views/               # Page components
│   │   ├── auth/           # Authentication pages
│   │   ├── boss/           # System admin dashboard
│   │   ├── brandAdmin/     # Brand manager dashboard
│   │   ├── counter/        # POS interface
│   │   ├── customer/       # Customer-facing pages
│   │   └── landing/        # Marketing pages
│   ├── components/          # Reusable Vue components
│   ├── stores/             # Pinia state management
│   ├── router/             # Route definitions
│   ├── api/                # API client modules
│   └── i18n/               # Internationalization
├── server/                  # Backend source code
│   ├── models/             # Mongoose schemas
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic layer
│   ├── routes/             # Express routes
│   ├── middlewares/        # Auth, validation, error handling
│   └── utils/              # Utility functions
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   └── e2e/                # E2E tests
└── public/                  # Static assets
```

### 🎯 Core Domain Models

- **Brand**: Top-level restaurant brand
- **Store**: Individual store locations
- **DishTemplate**: Centralized menu item templates
- **DishInstance**: Specific dish instances in orders
- **Menu**: Store-specific menu configurations
- **Order**: Customer orders (supports mixed items)
- **Inventory**: Real-time stock management
- **User**: Customer accounts
- **Admin**: System/brand/store administrators
- **PointRule**: Points accumulation rules
- **PointInstance**: Individual point records
- **CouponTemplate**: Reusable coupon templates
- **CouponInstance**: User-specific coupon instances
- **PromotionMenu**: Bundle promotion packages

### 🔐 API Structure

```
/api
├── /auth                    # Authentication
├── /user-profile           # Customer profile management
├── /order-customer         # Customer order operations
├── /order-admin            # Admin order management
├── /store                  # Store management
├── /menu                   # Menu management
├── /inventory              # Inventory operations
├── /promotion              # Promotion system
└── /admin                  # Admin user management
```

### 📊 System Architecture

![System Architecture](./public/system-flow-chart3.svg)

See the [full documentation](#程式流程圖) for detailed flow diagrams and ER diagrams.

### 🧪 Testing

```bash
# Run all unit tests
NODE_ENV=test yarn test:unit

# Run specific test file
NODE_ENV=test yarn test:unit tests/unit/path/to/test.js --reporter=verbose --no-watch

# Run E2E tests
yarn test:e2e
```

### 🌐 Internationalization

The system supports:

- Traditional Chinese (繁體中文)
- English

### 📄 License

This project is licensed under a [Modified MIT License](./LICENSE) — for non-commercial use only.

### 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

## 繁體中文

### 📋 專案簡介

這是一個採用現代化技術棧開發的全端多品牌餐廳訂餐管理系統。本平台讓餐飲集團能夠管理多個品牌，每個品牌可擁有多家分店，提供完整的餐廳營運解決方案。

### ✨ 核心功能

#### 🏢 **多品牌架構**

- 系統管理員可管理多個餐飲品牌
- 每個品牌下可有多家分店
- 集中化的菜單模板可跨店共用
- 支援店鋪個別化設定

#### 📦 **訂單管理**

- 支援內用、外帶、外送訂單
- **混合購物車系統**：可同時訂購餐點與促銷套餐
- 即時訂單追蹤與狀態更新
- 多元支付方式：現金、信用卡、LINE Pay

#### 📊 **庫存控制**

- 所有菜單項目的即時庫存追蹤
- 訂單完成時自動扣減庫存
- 低庫存警示與售完管理
- 詳細的庫存變動記錄

#### 🎁 **促銷系統**

- **點數累積**：根據訂單金額獲得點數
- **折價券**：百分比或固定金額折扣
- **兌換券**：使用點數兌換免費商品
- **套餐優惠**：特殊促銷組合
- 點數到期管理（先進先出）

#### 👥 **用戶與權限管理**

- **顧客帳戶**：註冊、個人資料管理、訂單歷史
- **系統管理員（Boss）**：完整系統權限，管理所有品牌
- **品牌管理員**：管理特定品牌的店鋪與設定
- **店鋪管理員**：細分權限（P1-P4）管理店鋪營運
  - P1：登入前台點餐系統、庫存管理
  - P2：查看後台資料、記帳
  - P3：編輯後台資料
  - P4：員工權限管理

#### 🛒 **櫃檯系統（POS）**

- 店員專用點餐介面
- 快速建立與修改訂單
- 付款處理與確認
- 訂單佇列管理

### 🛠️ 技術棧

**前端**

- Vue 3 + Composition API
- Vite（建置工具）
- Pinia（狀態管理）
- Vue Router 4
- Bootstrap Vue Next
- Vue i18n（國際化）

**後端**

- Express.js（Node.js 框架）
- MongoDB + Mongoose ODM
- Express Session
- RESTful API 架構

**測試**

- Vitest（單元測試）
- Cypress（端對端測試）

**外部整合**

- UberEats API（外送整合）
- KotSMS（簡訊驗證）
- LINE LIFF（LINE 整合）
- TapPay（金流閘道）
- Cloudflare R2（檔案儲存）

### 🚀 快速開始

#### 環境需求

- Node.js 18+ 與 Yarn
- MongoDB 6.x
- Git

#### 安裝步驟

```bash
# 複製專案
git clone <repository-url>
cd online-order-system

# 安裝相依套件
yarn install

# 設定環境變數
cp .env.example .env
# 編輯 .env 並設定：
# - MongoDB_url
# - SESSION_SECRET
# - 金流閘道憑證
# - 簡訊服務憑證
```

#### 開發環境

```bash
# 啟動前端開發伺服器（port 5173）
yarn dev

# 在另一個終端啟動後端伺服器（port 8700）
node server.js

# 執行單元測試
yarn test:unit

# 執行端對端測試
yarn test:e2e:dev
```

#### 正式環境建置

```bash
# 建置正式版本
yarn build

# 預覽正式版本
yarn preview

# 執行正式環境伺服器
NODE_ENV=production node server.js
```

### 📁 專案結構

```
online-order-system/
├── src/                      # 前端原始碼
│   ├── views/               # 頁面元件
│   │   ├── auth/           # 認證頁面
│   │   ├── boss/           # 系統管理員儀表板
│   │   ├── brandAdmin/     # 品牌管理員儀表板
│   │   ├── counter/        # 櫃檯系統介面
│   │   ├── customer/       # 顧客前台頁面
│   │   └── landing/        # 行銷頁面
│   ├── components/          # 可重用 Vue 元件
│   ├── stores/             # Pinia 狀態管理
│   ├── router/             # 路由定義
│   ├── api/                # API 客戶端模組
│   └── i18n/               # 國際化
├── server/                  # 後端原始碼
│   ├── models/             # Mongoose 資料模型
│   ├── controllers/        # 請求處理器
│   ├── services/           # 商業邏輯層
│   ├── routes/             # Express 路由
│   ├── middlewares/        # 中介層（認證、驗證、錯誤處理）
│   └── utils/              # 工具函數
├── tests/                   # 測試檔案
│   ├── unit/               # 單元測試
│   └── e2e/                # 端對端測試
└── public/                  # 靜態資源
```

### 🎯 核心資料模型

- **Brand**：頂層餐飲品牌
- **Store**：個別店鋪據點
- **DishTemplate**：集中式菜單項目模板
- **DishInstance**：訂單中的特定餐點實例
- **Menu**：店鋪專屬菜單配置
- **Order**：顧客訂單（支援混合商品）
- **Inventory**：即時庫存管理
- **User**：顧客帳戶
- **Admin**：系統/品牌/店鋪管理員
- **PointRule**：點數累積規則
- **PointInstance**：個別點數記錄
- **CouponTemplate**：可重用優惠券模板
- **CouponInstance**：使用者專屬優惠券實例
- **PromotionMenu**：套餐促銷組合

### 🔐 API 架構

```
/api
├── /auth                    # 認證
├── /user-profile           # 顧客個人資料管理
├── /order-customer         # 顧客訂單操作
├── /order-admin            # 管理員訂單管理
├── /store                  # 店鋪管理
├── /menu                   # 菜單管理
├── /inventory              # 庫存操作
├── /promotion              # 促銷系統
└── /admin                  # 管理員用戶管理
```

### 📊 系統架構

![系統架構圖](./public/system-flow-chart3.svg)

詳細的流程圖與 ER 圖請參閱[完整文件](#程式流程圖)。

### 🧪 測試

```bash
# 執行所有單元測試
NODE_ENV=test yarn test:unit

# 執行特定測試檔案
NODE_ENV=test yarn test:unit tests/unit/path/to/test.js --reporter=verbose --no-watch

# 執行端對端測試
yarn test:e2e
```

### 🌐 國際化支援

系統支援：

- 繁體中文
- English

### 📝 開發指南

#### 命名規範

**資料夾命名**

- 頂層目錄：camelCase
- 業務邏輯子目錄：PascalCase
- 組件目錄：PascalCase
- 視圖目錄：camelCase

**檔案命名**

- 模型檔案（Models）：PascalCase + 單數（例：`Order.js`, `DishTemplate.js`）
- Vue 組件檔案：PascalCase（例：`MenuList.vue`, `CartItem.vue`）
- 視圖檔案（Views）：PascalCase（例：`Dashboard.vue`）
- 工具函數檔案：camelCase（例：`priceCalculator.js`, `dateFormatter.js`）
- Store 檔案：camelCase（例：`cartStore.js`, `userStore.js`）

#### 架構分層

| 層級           | 職責                       | 應包含                                       | 不應包含                |
| -------------- | -------------------------- | -------------------------------------------- | ----------------------- |
| **Model**      | 定義資料結構、與資料庫互動 | Schema 定義、欄位驗證、hooks、實例方法       | ❌ 處理請求與回應       |
| **Controller** | 接收請求與回應             | 取得 req/params、呼叫 service、回傳 response | ❌ 商業邏輯             |
| **Service**    | 處理業務邏輯與流程決策     | 建立/更新資料、套用規則、發送通知            | ❌ 接觸 req/res         |
| **Utils**      | 可重用的純函數工具         | 格式化、驗證、計算等通用函數                 | ❌ 依賴資料庫或商業資料 |

### 📄 授權條款

本專案採用 [Modified MIT License](./LICENSE) 授權 — 僅限非商業用途使用。

### 🤝 貢獻

歡迎提交 issue、功能請求與貢獻！

---

## 📊 程式流程圖

### 系統架構圖

```mermaid
---
config:
  theme: default
  layout: elk
  look: neo
---
flowchart TD
 subgraph s3["新架構"]
        brand_CEO_A["品牌總管理員 A"]
        Boss["Boss"]
        brand_CEO_B["品牌總管理員 B"]
        brand_A_database["主資料庫"]
        Dishs_A["菜品"]
        CategoryOptionsA["類別選項"]
        OptionsA["選項"]
        StoreA2["店鋪A2"]
        AdminAssignment["管理員分配"]
        StoreAdminA1["店鋪管理員A1"]
        StoreAdminA2["店鋪管理員A2"]
        StoreAdminA3["店鋪管理員A3"]
        MenuA2["菜單A2"]
        StoreAreaA1["StoreAreaA1"]
  end
 subgraph StoreAreaA1["店鋪A1區域"]
        StoreA1["店鋪A1"]
        MenuA1["菜單A1"]
        NetpageA1["前端網頁"]
        Promotion["促銷系統"]
        ExCoupon["兌換券"]
        DiscountCoupon["折價券"]
        MenuPage["菜單頁面"]
        CustomerCountPage["客人帳戶相關頁面"]
        ShoppingCartPage["購物車頁面"]
        CheckOutPage["客人結帳確認頁面"]
        n1["庫存與銷售控制"]
        n2["資料耦合"]
        n3["點餐頁面"]
        n4["完成頁面"]
        n5["店員前端頁面"]
        n6["訂單查看頁面"]
        n7["庫存增減頁面<br>餐點啟用/停賣頁面"]
  end
    Boss --> brand_CEO_A & brand_CEO_B
    brand_CEO_A --> brand_A_database & AdminAssignment
    brand_CEO_A -.-> StoreA1 & StoreA2
    brand_A_database -- 包含 --- Dishs_A & CategoryOptionsA & OptionsA
    CategoryOptionsA -- 連接 --> OptionsA
    Dishs_A -- 連接 --> CategoryOptionsA
    AdminAssignment --> StoreAdminA1 & StoreAdminA2 & StoreAdminA3
    StoreAdminA1 -- 擁有權限P1,P2,P3 --> StoreA1
    StoreAdminA2 -- 擁有權限P1,P2 --> StoreA1
    StoreAdminA3 -- 擁有權限P1,P2,P3,P4 --> StoreA2
    StoreA1 --> MenuA1 & n1 & n5
    brand_A_database -- 資料提供 --> MenuA1 & MenuA2
    StoreA2 --> MenuA2
    StoreA1 -- 資料提供 --> NetpageA1
    Promotion -- 包含 --- ExCoupon & DiscountCoupon
    brand_A_database --> Promotion
    NetpageA1 --- MenuPage & CustomerCountPage & ShoppingCartPage
    Promotion --> ShoppingCartPage
    Promotion -- 提供客人的Coupon --> CustomerCountPage
    ShoppingCartPage --> CheckOutPage
    brand_A_database -- 提供客人個資 --> CustomerCountPage
    n1 -- 資料提供 --> n2
    MenuA1 -- 資料提供 --> n2
    n2 --> MenuPage & n3
    CheckOutPage -- 提交訂單 --> n4
    n4 L_n4_n1_0@-- 根據販售的餐點減少庫存 --> n1
    n5 --- n3
    n5 --> n6 & n7
    n7 --> n1
    style brand_CEO_A fill:#f9f,stroke:#333
    style Boss fill:#f9f,stroke:#333,stroke-width:2px
    style brand_CEO_B fill:#f9f,stroke:#333
    style brand_A_database fill:#90EE90,stroke:#006400
    style Dishs_A fill:#C1FFC1,stroke:#006400
    style CategoryOptionsA fill:#C1FFC1,stroke:#006400
    style OptionsA fill:#C1FFC1,stroke:#006400
    style StoreA2 fill:#D8BFD8,stroke:#333
    style AdminAssignment fill:#FFB6C1,stroke:#333
    style StoreAdminA1 fill:#FFE4E1,stroke:#333
    style StoreAdminA2 fill:#FFE4E1,stroke:#333
    style StoreAdminA3 fill:#FFE4E1,stroke:#333
    style MenuA2 fill:#E6E6FA,stroke:#333
    style StoreAreaA1 fill:#B0F0FD,stroke:#1E90FF,stroke-width:4px,stroke-dasharray: 5 5
    style StoreA1 fill:#00CED1,stroke:#333,color:white,font-weight:bold
    style MenuA1 fill:#00BFFF,stroke:#333,color:white,font-weight:bold
    style NetpageA1 fill:#1E90FF,stroke:#333,color:white,font-weight:bold
    style Promotion fill:#4169E1,stroke:#333,color:white
    style ExCoupon fill:#B0E0E6,stroke:#333
    style DiscountCoupon fill:#B0E0E6,stroke:#333
    style MenuPage fill:#87CEFA,stroke:#333
    style CustomerCountPage fill:#87CEFA,stroke:#333
    style ShoppingCartPage fill:#87CEFA,stroke:#333
    style CheckOutPage fill:#87CEFA,stroke:#333
    style n1 fill:#5F9EA0,stroke:#333,color:white,font-weight:bold
    style n2 fill:#4682B4,stroke:#333,color:white,font-weight:bold
    style n3 fill:#6495ED,stroke:#333,color:white
    style n4 fill:#AA00FF,color:white,stroke:#333,font-weight:bold
    style n5 fill:#6495ED,stroke:#333,color:white
    style n6 fill:#6495ED,stroke:#333,color:white
    style n7 fill:#5F9EA0,stroke:#333,color:white,font-weight:bold
    style s3 fill:#E0FFE0,stroke:#50b050,stroke-width:2px
    L_n4_n1_0@{ animation: fast }
```

### 權限管理邏輯

```mermaid
---
config:
  theme: default
  look: neo
  layout: elk
---
flowchart TB
 subgraph s2["權限類型"]
        P1["P1: 登入前台點餐系統<br>庫存管理"]
        P2["P2: 查看後台資料<br>記帳"]
        P3["P3: 編輯後臺資料"]
        P4["P4: 員工權限管理"]
  end
  subgraph PermissionLogic["權限管理邏輯"]
        AllStores["AllStores"]
        StoreCheck["StoreCheck"]
        brand_admin["brand_admin"]
        HasPermission["HasPermission"]
        PermissionCheck["PermissionCheck"]
        store_admin["store_admin"]
        ExecuteActions["ExecuteActions"]
  end
  brand_admin -- 檢查 manage 陣列內的 store --> StoreCheck
  StoreCheck -- 若 store 存在則擁有權限 --> HasPermission
  store_admin -- 檢查 manage 陣列內的 store & permission --> PermissionCheck
  PermissionCheck -- "確認 P1-P4 權限" --> ExecuteActions
```

### 資料庫 ER 圖

```mermaid
---
config:
  theme: default
---
erDiagram
    %% 基礎架構實體
    Brand {
        ObjectId _id
        String name
        String description
        Object image
        Boolean isActive
        Date createdAt
        Date updatedAt
    }

    Store {
        ObjectId _id
        String name
        ObjectId brand
        Array businessHours
        Array announcements
        Object image
        Object serviceSettings
        Boolean isActive
        Date createdAt
        Date updatedAt
    }

    User {
        ObjectId _id
        String name
        String email
        String password
        String phone
        Array addresses
        Date dateOfBirth
        String gender
        Boolean isActive
        String resetPasswordToken
        Date resetPasswordExpire
        Date createdAt
        Date updatedAt
    }

    Admin {
        ObjectId _id
        String name
        String password
        String role
        ObjectId brand
        ObjectId store
        Boolean isActive
        Date lastLogin
        ObjectId createdBy
        Date createdAt
        Date updatedAt
    }

    %% 餐點相關實體
    DishTemplate {
        ObjectId _id
        ObjectId brand
        String name
        Number basePrice
        Array optionCategories
        Object image
        String description
        Array tags
        Date createdAt
        Date updatedAt
    }

    DishInstance {
        ObjectId _id
        ObjectId brand
        ObjectId templateId
        String name
        Number basePrice
        Array options
        Number finalPrice
        Date createdAt
        Date updatedAt
    }

    OptionCategory {
        ObjectId _id
        ObjectId brand
        String name
        String inputType
        Array options
        Date createdAt
        Date updatedAt
    }

    Option {
        ObjectId _id
        ObjectId brand
        String name
        ObjectId refDishTemplate
        Number price
        Array tags
        Date createdAt
        Date updatedAt
    }

    Menu {
        ObjectId _id
        String name
        ObjectId store
        ObjectId brand
        Array categories
        Boolean isActive
        Date createdAt
        Date updatedAt
    }

    %% 庫存管理實體
    Inventory {
        ObjectId _id
        ObjectId brand
        ObjectId store
        String inventoryType
        ObjectId dish
        String itemName
        Number totalStock
        Boolean enableAvailableStock
        Number availableStock
        Number minStockAlert
        Number targetStockLevel
        Boolean isInventoryTracked
        Boolean isSoldOut
        Date createdAt
        Date updatedAt
    }

    StockLog {
        ObjectId _id
        ObjectId brand
        ObjectId store
        String inventoryType
        ObjectId dish
        String itemName
        Number previousStock
        Number newStock
        Number changeAmount
        String changeType
        String reason
        ObjectId order
        ObjectId admin
        Date createdAt
    }

    %% 訂單系統實體 (支援混合購買)
    Order {
        ObjectId _id
        ObjectId store
        ObjectId brand
        ObjectId user
        String orderDateCode
        Number sequence
        String orderType
        String status
        Array items
        Number dishSubtotal
        Number couponSubtotal
        Number subtotal
        Number serviceCharge
        Array discounts
        Number totalDiscount
        Number total
        Number pointsEarned
        Number pointsCalculationBase
        Object pointsRule
        String paymentType
        String paymentMethod
        Object customerInfo
        Object deliveryInfo
        Object dineInInfo
        String notes
        Date createdAt
        Date updatedAt
    }

    %% 促銷系統實體
    PointRule {
        ObjectId _id
        ObjectId brand
        String name
        String description
        String type
        Number conversionRate
        Number minimumAmount
        Number validityDays
        Boolean isActive
        Date createdAt
        Date updatedAt
    }

    PointInstance {
        ObjectId _id
        ObjectId user
        ObjectId brand
        Number amount
        String source
        String sourceModel
        ObjectId sourceId
        String status
        Date expiryDate
        Date usedAt
        Object usedIn
        Date createdAt
        Date updatedAt
    }

    CouponTemplate {
        ObjectId _id
        ObjectId brand
        String name
        String description
        String couponType
        Number pointCost
        Object discountInfo
        Object exchangeInfo
        Number validityPeriod
        Boolean isActive
        Array stores
        Number totalIssued
        Date createdAt
        Date updatedAt
    }

    CouponInstance {
        ObjectId _id
        ObjectId brand
        ObjectId template
        String couponName
        String couponType
        Number discount
        Array exchangeItems
        ObjectId user
        Boolean isUsed
        Date usedAt
        ObjectId order
        Date acquiredAt
        Date expiryDate
        Number pointsUsed
        Date createdAt
        Date updatedAt
    }

    PromotionMenu {
        ObjectId _id
        ObjectId brand
        String name
        String description
        Array items
        Object pricing
        Object purchaseTypes
        Boolean isActive
        Number totalSold
        Date validFrom
        Date validUntil
        Array stores
        Date createdAt
        Date updatedAt
    }

    %% 實體關係
    Brand ||--o{ Store : "owns"
    Brand ||--o{ Admin : "employs"
    Brand ||--o{ DishTemplate : "provides"
    Brand ||--o{ OptionCategory : "defines"
    Brand ||--o{ Option : "defines"
    Brand ||--o{ PointRule : "sets"
    Brand ||--o{ CouponTemplate : "offers"
    Brand ||--o{ PromotionMenu : "creates"

    Store ||--o{ Admin : "managed_by"
    Store ||--o{ Order : "receives"
    Store ||--o{ Inventory : "manages"
    Store ||--o{ StockLog : "logs"
    Store ||--|| Menu : "uses"

    User ||--o{ Order : "places"
    User ||--o{ PointInstance : "owns"
    User ||--o{ CouponInstance : "holds"

    DishTemplate ||--o{ DishInstance : "instantiates"
    DishTemplate ||--o{ Inventory : "tracked_in"
    DishTemplate }o--o{ OptionCategory : "has_options"
    OptionCategory ||--o{ Option : "contains"

    Order }o--o{ DishInstance : "includes"
    Order ||--o{ StockLog : "affects_inventory"
    Order ||--o{ PointInstance : "generates"
    Order }o--o{ CouponInstance : "uses_coupons"

    PointRule ||--o{ PointInstance : "creates"
    CouponTemplate ||--o{ CouponInstance : "instantiates"
    PromotionMenu }o--o{ CouponTemplate : "bundles"

    Menu }o--o{ DishTemplate : "displays"
```

### 核心業務流程

#### 用戶認證與註冊流程

```mermaid
flowchart TD
    Start([用戶進入系統]) --> CheckLogin{已登入?}
    CheckLogin -->|是| Dashboard[進入主頁面]
    CheckLogin -->|否| LoginPage[登入頁面]

    LoginPage --> LoginChoice{選擇操作}
    LoginChoice -->|登入| LoginForm[輸入帳號密碼]
    LoginChoice -->|註冊| RegisterForm[註冊表單]
    LoginChoice -->|忘記密碼| ForgotPwd[忘記密碼]

    LoginForm --> Authenticate{驗證}
    Authenticate -->|成功| Dashboard
    Authenticate -->|失敗| LoginError[顯示錯誤訊息] --> LoginPage

    RegisterForm --> VerifyPhone[電話驗證]
    VerifyPhone --> CreateAccount[創建帳號]
    CreateAccount --> Dashboard

    ForgotPwd --> SendSMS[發送簡訊驗證碼]
    SendSMS --> VerifyCode[驗證碼驗證]
    VerifyCode --> ResetPassword[重設密碼]
    ResetPassword --> LoginPage
```

#### 混合購買訂單流程

```mermaid
flowchart TD
    Start([開始購物]) --> Cart[加入購物車]
    Cart --> ItemChoice{選擇商品類型}

    ItemChoice -->|餐點| AddDish[添加餐點到購物車]
    ItemChoice -->|兌換券套餐| AddCoupon[添加券套餐到購物車]

    AddDish --> Cart
    AddCoupon --> Cart
    Cart --> CheckOut[結帳]

    CheckOut --> CalcPoints[計算點數獎勵<br/>基於總金額]
    CalcPoints --> PaymentChoice{選擇支付方式}

    PaymentChoice -->|現金| CreateOrderCash[創建訂單<br/>status: unpaid]
    PaymentChoice -->|線上支付| CreateOrderOnline[創建訂單<br/>進入支付流程]

    CreateOrderCash --> ProcessDish[處理餐點項目<br/>生成DishInstance<br/>扣減庫存]
    CreateOrderOnline --> PaymentGateway[支付閘道]

    PaymentGateway --> PaymentResult{支付結果}
    PaymentResult -->|成功| OrderPaid[訂單狀態: paid]
    PaymentResult -->|失敗| PaymentFailed[支付失敗] --> PaymentChoice

    OrderPaid --> ProcessDish
    ProcessDish --> ProcessCoupons[處理兌換券項目<br/>生成CouponInstance]
    ProcessCoupons --> AwardPoints[發放點數獎勵<br/>基於訂單總額]
    AwardPoints --> OrderComplete[訂單完成]

    CreateOrderCash --> WaitPayment[等待現金支付確認]
    WaitPayment --> StaffConfirm{店員確認收款}
    StaffConfirm -->|確認| OrderPaid
    StaffConfirm -->|取消| CancelOrder[取消訂單]
```

#### 訂單提交流程

```mermaid
flowchart TD
    Start[顧客下單頁面] --> Submit[顧客提交訂單]
    Submit --> PaymentChoice{選擇付款方式}

    %% 現場付款流程
    PaymentChoice -->|現場付款<br/>On-site| CreateOnsite[創建訂單<br/>isFinalized: true<br/>status: unpaid]
    CreateOnsite --> SuccessDetail[訂單詳情頁面<br/>付款成功]

    %% 線上付款流程
    PaymentChoice -->|線上付款<br/>Online| CreateTemp[創建臨時訂單<br/>isFinalized: false<br/>status: pending_payment]
    CreateTemp --> CreateTxn[創建 Transaction<br/>tempOrderData: Order._id]
    CreateTxn --> RedirectPlatform[跳轉到金流平台]
    RedirectPlatform --> SelectMethod[選擇線上支付方式<br/>信用卡/LINE Pay/Apple Pay]
    SelectMethod --> Processing[支付處理中...]

    Processing --> PaymentResult{支付結果}

    %% 支付成功
    PaymentResult -->|成功| FinalizeOrder[完成訂單<br/>isFinalized: true<br/>status: paid<br/>補充 orderDateCode, sequence]
    FinalizeOrder --> UpdateTxn[更新 Transaction<br/>orderId: Order._id<br/>status: completed]
    UpdateTxn --> RedirectSuccess[重定向到訂單詳情]
    RedirectSuccess --> SuccessDetail[訂單成功<br/>訂單詳情頁面]

    %% 支付失敗
    PaymentResult -->|失敗| CancelOrder[標記訂單<br/>status: cancelled]
    CancelOrder --> UpdateTxnFail[更新 Transaction<br/>status: failed]
    UpdateTxnFail --> RedirectFail[重定向回下單頁面<br/>顯示錯誤訊息]
    RedirectFail --> Start

    %% 樣式
    classDef successStyle fill:#d4edda,stroke:#28a745,stroke-width:2px
    classDef errorStyle fill:#f8d7da,stroke:#dc3545,stroke-width:2px
    classDef processStyle fill:#d1ecf1,stroke:#17a2b8,stroke-width:2px
    classDef decisionStyle fill:#fff3cd,stroke:#ffc107,stroke-width:2px

    class FinalizeOrder,UpdateTxn,SuccessDetail successStyle
    class CancelOrder,UpdateTxnFail,RedirectFail errorStyle
    class CreateTemp,CreateTxn,RedirectPlatform,SelectMethod,Processing processStyle
    class PaymentChoice,PaymentResult decisionStyle
```

#### 促銷系統流程

```mermaid
flowchart TD
    UserLogin([用戶登入]) --> ViewPromo[查看促銷活動]
    ViewPromo --> PromoType{促銷類型}

    PromoType -->|點數兌換券| PointExchange[點數兌換流程]
    PromoType -->|現金買券| CashPurchase[現金購買流程]
    PromoType -->|套餐優惠| BundlePurchase[套餐購買流程]

    PointExchange --> CheckPoints[檢查點數餘額]
    CheckPoints --> EnoughPoints{點數足夠?}
    EnoughPoints -->|是| DeductPoints[扣除點數]
    EnoughPoints -->|否| InsufficientPoints[點數不足提示]

    DeductPoints --> GenerateCoupon[生成兌換券實例]
    GenerateCoupon --> NotifyUser[通知用戶]

    CashPurchase --> CreatePayment[創建支付訂單]
    CreatePayment --> PaymentProcess[支付流程]
    PaymentProcess --> PaymentSuccess{支付成功?}
    PaymentSuccess -->|是| GenerateCoupon
    PaymentSuccess -->|否| PaymentFail[支付失敗]

    BundlePurchase --> SelectBundle[選擇套餐組合]
    SelectBundle --> CalcDiscount[計算套餐折扣]
    CalcDiscount --> PaymentProcess

    NotifyUser --> UseCoupon[使用兌換券]
    UseCoupon --> OrderDiscount[訂單折扣/免費兌換]
```

#### 庫存管理流程

```mermaid
flowchart TD
    OrderComplete([訂單完成]) --> CheckInventory{檢查庫存設定}
    CheckInventory -->|啟用庫存追蹤| AutoDeduct[自動扣減庫存]
    CheckInventory -->|未啟用| SkipInventory[跳過庫存處理]

    AutoDeduct --> UpdateStock[更新庫存數量]
    UpdateStock --> LogChange[記錄庫存變動日誌]
    LogChange --> CheckAlert{達到警告門檻?}

    CheckAlert -->|是| SendAlert[發送補貨警告]
    CheckAlert -->|否| StockComplete[庫存處理完成]

    SendAlert --> CheckSoldOut{庫存歸零?}
    CheckSoldOut -->|是| SetSoldOut[設定為售完]
    CheckSoldOut -->|否| StockComplete

    SetSoldOut --> NotifyStaff[通知店員]
    NotifyStaff --> StockComplete

    StaffRestock([店員補貨]) --> ManualAdd[手動增加庫存]
    ManualAdd --> UpdateStock

    ManagerAdjust([管理員調整]) --> StockAdjust[庫存調整]
    StockAdjust --> UpdateStock
```

#### 點數系統流程

```mermaid
flowchart TD
    OrderPaid([訂單支付完成]) --> CheckUser{用戶已登入?}
    CheckUser -->|否| SkipPoints[跳過點數發放]
    CheckUser -->|是| GetRules[獲取品牌點數規則]

    GetRules --> RuleActive{規則啟用?}
    RuleActive -->|否| SkipPoints
    RuleActive -->|是| CheckMinimum{達到最低消費?}

    CheckMinimum -->|否| SkipPoints
    CheckMinimum -->|是| CalcPoints[計算點數<br/>總額/轉換率]

    CalcPoints --> CreatePoints[創建點數實例]
    CreatePoints --> SetExpiry[設定過期日期]
    SetExpiry --> NotifyUser[通知用戶獲得點數]

    UserViewPoints([用戶查看點數]) --> AutoCheckExpired[自動檢查過期點數]
    AutoCheckExpired --> MarkExpired[標記過期點數]
    MarkExpired --> DisplayBalance[顯示當前餘額]

    UsePoints([用戶使用點數]) --> CheckBalance{餘額足夠?}
    CheckBalance -->|否| InsufficientBalance[餘額不足]
    CheckBalance -->|是| DeductFIFO[按到期日扣除點數]

    DeductFIFO --> MarkUsed[標記點數為已使用]
    MarkUsed --> UpdateBalance[更新點數餘額]
    UpdateBalance --> ProcessComplete[點數使用完成]
```

#### 管理員權限控制流程

```mermaid
flowchart TD
    AdminLogin([管理員登入]) --> VerifyRole[驗證角色]
    VerifyRole --> RoleLevel{角色層級}

    RoleLevel -->|系統級| SystemAccess[系統全權限<br/>管理所有品牌店鋪]
    RoleLevel -->|品牌級| BrandAccess[品牌權限<br/>管理品牌下店鋪]
    RoleLevel -->|店鋪級| StoreAccess[店鋪權限<br/>管理單一店鋪]

    SystemAccess --> ManageAll[管理所有資源]
    BrandAccess --> CheckBrand{驗證品牌權限}
    StoreAccess --> CheckStore{驗證店鋪權限}

    CheckBrand -->|通過| ManageBrand[管理品牌資源]
    CheckBrand -->|拒絕| AccessDenied[拒絕訪問]

    CheckStore -->|通過| ManageStore[管理店鋪資源]
    CheckStore -->|拒絕| AccessDenied

    ManageAll --> AdminAction[執行管理操作]
    ManageBrand --> AdminAction
    ManageStore --> AdminAction

    AdminAction --> LogActivity[記錄操作日誌]
    LogActivity --> Result[返回操作結果]
```

---

<div align="center">

Made with ❤️ for the restaurant industry

</div>
