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

```mermaid
---
config:
  theme: default
  look: neo
  layout: elk
---
flowchart TB
 subgraph s1["原本架構"]
    direction TB
        O_StoreAdmin["StoreAdmin"]
        O_Admin["Admin"]
        O_Store["Store"]
        O_Menu["Menu"]
        O_Dish["Dish"]
        O_Option["OptionCategory"]
        O_Choice["Options"]
  end
 subgraph s2["權限類型"]
        P1["P1: 登入前台點餐系統<br>庫存管理"]
        P2["P2: 查看後台資料<br>記帳"]
        P3["P3: 編輯後臺資料"]
        P4["P4: 員工權限管理"]
  end
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
        s2
        StoreAreaA1["StoreAreaA1"]
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
    O_Admin --> O_StoreAdmin & O_Store
    O_StoreAdmin --> O_Store
    O_Store --> O_Menu
    O_Menu --> O_Dish
    O_Dish --> O_Option
    O_Option --> O_Choice
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
    brand_admin -- 檢查 manage 陣列內的 store --> StoreCheck
    StoreCheck -- 若 store 存在則擁有權限 --> HasPermission
    store_admin -- 檢查 manage 陣列內的 store & permission --> PermissionCheck
    PermissionCheck -- "確認 P1-P4 權限" --> ExecuteActions
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
    n4 -- 根據販售的餐點減少庫存 --> n1
    n5 --- n3
    n5 --> n6 & n7
    n7 --> n1
    style s1 fill:#E6E6FA,stroke:#9370DB,stroke-width:2px
    style s2 fill:#FFE4E1,stroke:#ff7070,stroke-width:2px
    style s3 fill:#E0FFE0,stroke:#50b050,stroke-width:2px
    style PermissionLogic fill:#FFEFD5,stroke:#DAA520,stroke-width:2px
    style StoreAreaA1 fill:#B0F0FD,stroke:#1E90FF,stroke-width:4px
    style Boss fill:#f9f,stroke:#333,stroke-width:2px
    style brand_A_database fill:#90EE90,stroke:#006400
    style n4 fill:#AA00FF,color:white,stroke:#333
```

# 資料庫ER圖

```mermaid
---
config:
  theme: default
---
erDiagram
    Admin {
        ObjectId _id
        String name
        String password
        String role
        ObjectId brand
        Object[] manage
        Boolean isActive
        Date lastLogin
        Date createdAt
        Date updatedAt
    }
    Brand {
        ObjectId _id
        String name
        String description
        Object image
        Date createdAt
        Date updatedAt
    }
    User {
        ObjectId _id
        String name
        String email
        String password
        String phone
        Object[] addresses
        ObjectId[] orderHistory
        Object preferences
        Object[] brandPoints
        Date dateOfBirth
        String gender
        Boolean isActive
        String resetPasswordToken
        Date resetPasswordExpire
        Date createdAt
        Date updatedAt
    }
    DishTemplate {
        ObjectId _id
        String name
        Number basePrice
        Object[] optionCategories
        Object image
        String description
        String[] tags
    }
    DishInstance {
        ObjectId _id
        ObjectId templateId
        String name
        Number basePrice
        Object[] options
        String specialInstructions
        Number finalPrice
        Date createdAt
        Date updatedAt
    }
    OptionCategory {
        ObjectId _id
        String name
        String inputType
        Object[] options
    }
    Option {
        ObjectId _id
        String name
        ObjectId refDishTemplate
        Number price
    }
    Menu {
        ObjectId _id
        String name
        ObjectId store
        ObjectId brand
        Object[] categories
        Boolean isActive
        Date createdAt
        Date updatedAt
    }
    Store {
        ObjectId _id
        String name
        ObjectId brand
        Object[] businessHours
        ObjectId menuId
        Object[] announcements
        Object image
        Boolean isActive
        Date createdAt
        Date updatedAt
    }
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
    Order {
        ObjectId _id
        String orderDateCode
        Number sequence
        ObjectId store
        ObjectId brand
        ObjectId user
        String orderType
        String status
        Object[] items
        Number subtotal
        Number serviceCharge
        Object[] discounts
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
    PointTransaction {
        ObjectId _id
        ObjectId user
        ObjectId brand
        String type
        Number points
        Number balance
        String source
        String sourceModel
        ObjectId sourceId
        ObjectId order
        ObjectId couponInstance
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
        ObjectId[] stores
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
        Object[] exchangeItems
        ObjectId user
        Boolean isUsed
        Date usedAt
        ObjectId order
        Date acquiredAt
        Date expiryDate
        Number pointsUsed
    }
    Admin ||--o{ Store : "manages"
    Brand ||--o{ Store : "has"
    Brand ||--o{ Admin : "has"
    Brand ||--o{ PointRule : "has"
    Brand ||--o{ CouponTemplate : "has"
    User ||--o{ CouponInstance : "owns"
    User ||--o{ Order : "places"
    User ||--o{ PointTransaction : "has"
    Store ||--o{ Inventory : "tracks"
    Store ||--o{ Order : "receives"
    Store ||--o{ StockLog : "has"
    Store ||--o| Menu : "has"
    DishTemplate ||--o{ DishInstance : "instantiates"
    DishTemplate ||--o{ Inventory : "tracked_in"
    OptionCategory ||--o{ Option : "contains"
    DishTemplate }o--o{ OptionCategory : "uses"
    Menu }o--o{ DishTemplate : "includes"
    Order ||--o{ DishInstance : "contains"
    CouponTemplate ||--o{ CouponInstance : "instantiates"
    CouponInstance ||--o{ Order : "applied_to"
    Order ||--o{ StockLog : "generates"
    Order ||--o{ PointTransaction : "generates"
```
