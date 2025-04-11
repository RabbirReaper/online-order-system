# online-order-system

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
yarn
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Compile and Minify for Production

```sh
yarn build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
yarn test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
yarn test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
yarn build
yarn test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
yarn lint
```

# 命名風格

## **資料夾命名規則**

- 頂層目錄命名 (使用 camelCase)
- 業務邏輯子目錄 (使用 PascalCase)
- 組件目錄 (使用 PascalCase)
- 視圖目錄 (使用 camelCase)

## **檔案命名規則詳解**

1. 模型檔案 (Models)

命名風格：PascalCase + 單數
原因：代表類或構造函數，符合OOP原則
範例：MainDish.js, Order.js

2. Vue組件檔案 (Components)

命名風格：PascalCase
原因：Vue官方建議，與元件註冊名稱一致
範例：CartItem.vue, MenuList.vue

3. 視圖檔案 (Views)

命名風格：PascalCase
原因：實際上也是Vue組件，遵循相同規則
範例：Dashboard.vue, MenuPage.vue

4. 工具函數檔案

命名風格：camelCase
原因：包含普通函數，符合JavaScript慣例
範例：priceCalculator.js, dateFormatter.js

5. Store檔案

命名風格：camelCase
原因：主要導出物件或函數，符合模組命名慣例
範例：cartStore.js, userStore.js

# 程式流程圖

![系統架構圖](./public/system-flow-chart3.svg)

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

# 資料庫ER圖

```mermaid
---
config:
  theme: default
---
erDiagram
    %% 調整排列順序和方向以減少重疊

    %% 核心業務實體
    Brand {
        ObjectId _id
        String name
        String description
        Object image
        Date createdAt
        Date updatedAt
    }

    Store {
        ObjectId _id
        String name
        ObjectId brand
        Array businessHours
        ObjectId menuId
        Array announcements
        Object image
        Boolean isActive
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

    %% 餐點相關實體
    DishTemplate {
        ObjectId _id
        String name
        Number basePrice
        Array optionCategories
        Object image
        String description
        Array tags
    }

    DishInstance {
        ObjectId _id
        ObjectId templateId
        String name
        Number basePrice
        Array options
        String specialInstructions
        Number finalPrice
        Date createdAt
        Date updatedAt
    }

    OptionCategory {
        ObjectId _id
        String name
        String inputType
        Array options
    }

    Option {
        ObjectId _id
        String name
        ObjectId refDishTemplate
        Number price
    }

    %% 庫存相關實體
    Inventory {
        ObjectId _id
        ObjectId store
        ObjectId dish
        String dishName
        Number stock
        Number dailyLimit
        Boolean isInventoryTracked
        Date createdAt
        Date updatedAt
    }

    StockLog {
        ObjectId _id
        ObjectId store
        ObjectId dish
        String dishName
        Number previousStock
        Number newStock
        Number changeAmount
        String changeType
        String reason
        ObjectId order
        ObjectId admin
        Date createdAt
        Date updatedAt
    }

    %% 用戶相關實體
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
        Array manage
        Boolean isActive
        Date lastLogin
        Date createdAt
        Date updatedAt
    }

    %% 訂單相關實體
    Order {
        ObjectId _id
        String orderDateCode
        Number sequence
        ObjectId store
        ObjectId brand
        ObjectId user
        String orderType
        String status
        Array items
        Number subtotal
        Number serviceCharge
        Array discounts
        Number totalDiscount
        Number total
        String paymentType
        String paymentMethod
        String onlinePaymentCode
        Object customerInfo
        Object deliveryInfo
        Object dineInInfo
        Date estimatedPickupTime
        String notes
        String cancelReason
        ObjectId cancelledBy
        String cancelledByModel
        Date cancelledAt
        Date createdAt
        Date updatedAt
    }

    %% 優惠與點數相關實體
    PointRule {
        ObjectId _id
        ObjectId brand
        String name
        String description
        String type
        Number conversionRate
        Number minimumAmount
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
        Date startDate
        Date endDate
        Number totalIssued
        Number maxIssuance
        Date createdAt
        Date updatedAt
    }

    CouponInstance {
        ObjectId _id
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
    }

    %% 品牌相關關係
    Brand ||--o{ Store : "擁有"
    Brand ||--o{ Admin : "雇用"
    Brand ||--o{ PointRule : "定義"
    Brand ||--o{ CouponTemplate : "提供"
    Brand ||--o{ DishTemplate : "提供餐點"

    %% 店鋪相關關係
    Store ||--o{ Inventory : "管理庫存"
    Store ||--o{ Order : "接收訂單"
    Store ||--o{ StockLog : "記錄庫存變動"
    Store ||--|| Menu : "使用菜單"

    %% 菜單與餐點關係
    Menu }o--o{ DishTemplate : "包含餐點"

    %% 餐點相關關係
    DishTemplate ||--o{ DishInstance : "實例化"
    DishTemplate ||--o{ Inventory : "追蹤庫存"
    DishTemplate }o--o{ OptionCategory : "擁有選項類別"
    OptionCategory ||--o{ Option : "包含選項"

    %% 訂單相關關係
    Order }o--o{ DishInstance : "包含餐點"
    Order ||--o{ StockLog : "影響庫存"
    Order }o--|| User : "由用戶下單"

    %% 用戶相關關係
    User ||--o{ CouponInstance : "持有優惠券"
    User ||--o{ PointInstance : "擁有點數"

    %% 管理員相關關係
    Admin }o--o{ Store : "管理店鋪"

    %% 點數與優惠券關係
    PointRule ||--o{ PointInstance : "創建點數"
    CouponTemplate ||--o{ CouponInstance : "創建優惠券"
    CouponInstance }o--o{ Order : "使用於訂單"
```
