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

# 系統核心流程圖

## 用戶認證與註冊流程

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

## 混合購買訂單流程 (新功能)

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

## 促銷系統流程

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

## 庫存管理流程

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

## 點數系統流程

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

## 管理員權限控制流程

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
