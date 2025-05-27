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

# License

This project is licensed under a [Modified MIT License](./LICENSE) — for non-commercial use only.

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

# 內部各元件流程圖

### 客戶登入按鈕

```mermaid
flowchart TD
    Start[登入按鈕] --> Login[登入介面]
    Login -->|登入成功| Profile[個人資料]

    Login --> Register[註冊按鈕]
    Register --> RegPage[註冊頁面<br>輸入電話號碼和密碼]
    RegPage --> VerifyPhone[驗證電話號碼<br>輸入驗證碼]
    VerifyPhone -->|沒有獲得驗證碼| ResendCode[重新獲取驗證碼<br>60s延遲]
    ResendCode --> VerifyPhone
    VerifyPhone -->|驗證成功| Login

    Login --> ForgotPwd[忘記密碼]
    ForgotPwd --> ResetPwd[重設密碼<br>發送簡訊驗證碼]
    ResetPwd --> VerifyCode[驗證成功]
    VerifyCode --> NewPwd[重設密碼]
    NewPwd --> Login
```

### 訂單流程

```mermaid
flowchart TD
    Start([客人填寫訂單資訊]) --> PaymentChoice{選擇付款方式}

    PaymentChoice -->|現場付款| CashSubmit[送出訂單<br/>創建訂單 status: unpaid]
    PaymentChoice -->|Credit Card| CreditCard[跳轉 Credit Card<br/>驗證畫面]
    PaymentChoice -->|LINE Pay| LinePay[跳轉 LINE Pay<br/>驗證畫面]

    CreditCard --> CreditVerify{Credit Card 驗證}
    LinePay --> LinePayVerify{LINE Pay 驗證}

    CreditVerify -->|付款成功| CreditSubmit[送出訂單<br/>創建訂單 status: paid]
    CreditVerify -->|付款失敗| PaymentFailed[付款失敗<br/>返回付款選擇]

    LinePayVerify -->|付款成功| LineSubmit[送出訂單<br/>創建訂單 status: paid]
    LinePayVerify -->|付款失敗| PaymentFailed

    PaymentFailed --> PaymentChoice

    CashSubmit --> OrderConfirmCash[OrderConfirmView<br/>顯示訂單送出成功<br/>尚未付款]
    CreditSubmit --> OrderConfirmPaid[OrderConfirmView<br/>顯示訂單送出成功<br/>付款完成]
    LineSubmit --> OrderConfirmPaid

    OrderConfirmCash --> ProgressBarUnpaid[進度條顯示:<br/>✅ 送出訂單<br/>🔄 未付款<br/>⏳ 付款完成]
    OrderConfirmPaid --> ProgressBarPaid[進度條顯示:<br/>✅ 送出訂單<br/>✅ 已付款<br/>✅ 付款完成]

    ProgressBarUnpaid --> WaitStaff[等待前台人員<br/>點選付款完成]
    ProgressBarPaid --> OrderComplete[訂單完成<br/>開始製作]

    WaitStaff --> StaffAction[前台人員操作]
    StaffAction --> StaffConfirm{確認收到款項}
    StaffConfirm -->|是| UpdatePaidCash[更新訂單狀態<br/>status: paid]
    StaffConfirm -->|否| WaitStaff

    UpdatePaidCash --> FinalConfirm[OrderConfirmView<br/>更新為付款完成]

    FinalConfirm --> FinalProgress[進度條顯示:<br/>✅ 送出訂單<br/>✅ 已付款<br/>✅ 付款完成]

    FinalProgress --> OrderComplete

    %% 樣式設定

    class Start startNode
    class CashSubmit,CreditSubmit,LineSubmit,CreditCard,LinePay,UpdatePaidCash processNode
    class PaymentChoice,CreditVerify,LinePayVerify,StaffConfirm decisionNode
    class OrderComplete,FinalProgress successNode
    class ProgressBarUnpaid,WaitStaff,StaffAction waitNode
    class PaymentFailed failNode
    class OrderConfirmCash,OrderConfirmPaid,FinalConfirm,ProgressBarPaid confirmNode
```

### 訂單時序圖

```mermaid
sequenceDiagram
    participant Client as 客人前端
    participant API as 後端API
    participant PaymentGW as 付款閘道
    participant Admin as 前台管理

    Note over Client, Admin: 🏪 現場付款流程

    Client->>Client: 選擇付款方式: 現場付款
    Client->>API: POST /order-customer/brands/{brandId}/stores/{storeId}/create<br/>{orderData, paymentMethod: "cash"}
    API->>API: 創建訂單 status: "unpaid"
    API->>Client: 200 OK {success: true, order: {status: "unpaid"}}

    Client->>Client: 跳轉 OrderConfirmView<br/>顯示: 尚未付款

    Note over Admin: 等待前台確認收款
    Admin->>API: PUT /order-admin/brands/{brandId}/stores/{storeId}/orders/{orderId}<br/>{status: "paid"}
    API->>Admin: 200 OK {success: true, order: {status: "paid"}}

    API-->>Client: 訂單狀態更新通知
    Client->>Client: 更新頁面: 付款完成

    Note over Client, PaymentGW: 💳 Credit Card 流程

    Client->>Client: 選擇付款方式: Credit Card
    Client->>PaymentGW: 跳轉信用卡付款頁面
    PaymentGW->>PaymentGW: 處理付款

    alt 付款成功
        PaymentGW->>Client: 付款成功回調
        Client->>API: POST /order-customer/brands/{brandId}/stores/{storeId}/create<br/>{orderData, paymentMethod: "credit_card"}
        API->>API: 創建訂單 status: "paid"
        API->>Client: 200 OK {success: true, order: {status: "paid"}}
        Client->>Client: 跳轉 OrderConfirmView<br/>顯示: 付款完成

    else 付款失敗
        PaymentGW->>Client: 付款失敗
        Client->>Client: 返回付款選擇頁面
    end

    Note over Client, PaymentGW: 📱 LINE Pay 流程

    Client->>Client: 選擇付款方式: LINE Pay
    Client->>PaymentGW: 跳轉 LINE Pay 頁面
    PaymentGW->>PaymentGW: 處理付款

    alt 付款成功
        PaymentGW->>API: POST /order-customer/brands/{brandId}/orders/{orderId}/payment/callback<br/>{success: true}
        API->>API: 更新訂單 status: "paid"
        API->>PaymentGW: 200 OK

        PaymentGW->>Client: 重導向到成功頁面
        Client->>Client: 跳轉 OrderConfirmView<br/>顯示: 付款完成

    else 付款失敗
        PaymentGW->>Client: 付款失敗
        Client->>Client: 返回付款選擇頁面
    end
```

# 各個資料夾裡面應該放什麼邏輯

## 📦 分層責任對照表（MVC 架構＋服務層）

| 層級           | 職責重點                                    | 應該包含的邏輯範例                                                                                                     | 不應該包含什麼                        |
| -------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Model**      | 定義資料結構、與資料庫互動的邏輯            | - Schema 定義<br>- 欄位驗證（required, enum）<br>- pre/post hooks（如自動編號）<br>- 實例方法（如 `calculateTotal()`） | ❌ 不要處理使用者請求、回應格式       |
| **Controller** | 負責接收請求與回應：像是 API 的「門口人員」 | - 取得 `req.body`、`req.params`<br>- 呼叫 service 處理邏輯<br>- 根據結果回傳 `res.json()`                              | ❌ 不要處理商業邏輯（例如：金額計算） |
| **Service**    | 處理實際的「業務邏輯」與流程決策            | - 建立/更新訂單邏輯<br>- 套用優惠券<br>- 根據用戶狀態篩選餐點<br>- 發送 email、計算小計與折扣                          | ❌ 不要接觸 `req`、`res`              |
| **Utils**      | 可重用、無狀態的通用工具函數（純函數）      | - 格式化日期、驗證 email<br>- 產生亂數、字串處理<br>- 格式化地址、計算距離                                             | ❌ 不應依賴資料庫、也不該存取商業資料 |

---

## 🧩 範例拆解：以「訂單系統」為例

| 功能                                         | 應該放哪裡？    | 為什麼                                                                                                         |
| -------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| 訂單 `schema`、欄位驗證                      | Model           | 屬於資料結構定義                                                                                               |
| 計算訂單總額（包含小計、服務費、折扣）       | Model / Service | 若是「單一訂單實例」方法 ➝ Model（如 `calculateTotal()`）<br>若有更多邏輯（查優惠券、用戶資訊） ➝ Service 處理 |
| 使用者送出訂單                               | Controller      | 負責接收請求、解析 `req.body`、丟給 Service 處理                                                               |
| 處理送出訂單邏輯（包含驗證、金額計算、儲存） | Service         | 包含整個「商業邏輯流程」                                                                                       |
| 格式化顯示日期、手機號碼                     | Utils           | 可在 controller 或 service 呼叫的「純邏輯工具」                                                                |
| 驗證 ObjectId 是否有效                       | Utils           | 與資料庫結構無關的工具函數，可在 middleware、service 或 controller 中使用                                      |

---