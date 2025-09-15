# TapPay 支付整合計劃

## 專案概述

將 TapPay 支付閘道整合到線上點餐系統，支援信用卡支付和電子錢包（如 LINE Pay）。

## 整合資源

- **TapPay 官方文檔**: https://docs.tappaysdk.com/
- **GitHub 範例**: https://github.com/TapPay/tappay-web-example
- **測試卡號**: 4242 4242 4242 4242, CVV: 123
- **技術支援**: support@cherri.tech

## Phase 1: 環境設定與準備

### 1.1 TapPay Portal 設定

- [ ] 登入 TapPay Portal (已完成 - 用戶已有帳戶)
- [ ] 取得 APP_ID 和 APP_KEY (Sandbox & Production)
- [ ] 設定商家資訊和回調 URLs
- [ ] 設定支付方式 (Direct Pay, LINE Pay)

### 1.2 測試環境配置

- [ ] 確保開發環境支援 HTTPS (可使用 ngrok)
- [ ] 安裝 ngrok: `yarn global add ngrok`
- [ ] 測試 SSL 憑證設定

### 1.3 環境變數設定

```javascript
// .env
TAPPAY_APP_ID=160922
TAPPAY_APP_KEY=app_PTXFmsaMgILnDLwCfpQhDmYeVXfKw5sNSi2khZU6ASeL4oyJjVaF0uSDEsgx
TAPPAY_MERCHANT_ID=tppf_RabbirReaper_GP_POS_3
TAPPAY_SANDBOX_MODE=true
TAPPAY_API_BASE_URL=https://sandbox.tappaysdk.com
```

## Phase 2: 前端整合

### 2.1 TapPay SDK 引入

```html
<!-- 在 public/index.html 中加入 -->
<script src="https://js.tappaysdk.com/tpdirect/v4"></script>
```

### 2.2 修改付款組件

**檔案**: `src/components/customer/cart/CustomerInfoForm.vue`

#### 需要的修改:

- [ ] 初始化 TapPay SDK
- [ ] 設定信用卡欄位為 TapPay Fields
- [ ] 實作 Prime Token 生成
- [ ] 移除模擬警告訊息

```javascript
// 新增 TapPay 初始化
onMounted(() => {
  TPDirect.setupSDK(APP_ID, 'APP_KEY', 'sandbox')

  // 設定信用卡欄位
  TPDirect.card.setup({
    fields: {
      number: {
        element: '#cardNumber',
        placeholder: '**** **** **** ****',
      },
      expirationDate: {
        element: '#expiryDate',
        placeholder: 'MM / YY',
      },
      ccv: {
        element: '#cvv',
        placeholder: 'CVV',
      },
    },
    styles: {
      // 自定義樣式
    },
  })
})

// 新增獲取 Prime Token 方法
const getPrimeToken = () => {
  return new Promise((resolve, reject) => {
    TPDirect.card.getPrime((result) => {
      if (result.status !== 0) {
        reject(new Error('獲取 Prime Token 失敗'))
      } else {
        resolve(result.card.prime)
      }
    })
  })
}
```

### 2.3 建立支付處理組件

**新檔案**: `src/components/customer/payment/TapPayCreditCard.vue`

```vue
<template>
  <div class="tappay-credit-card">
    <div class="form-group">
      <label>卡號</label>
      <div id="cardNumber" class="tappay-field"></div>
    </div>
    <div class="form-group">
      <label>有效期限</label>
      <div id="expiryDate" class="tappay-field"></div>
    </div>
    <div class="form-group">
      <label>安全碼</label>
      <div id="cvv" class="tappay-field"></div>
    </div>
  </div>
</template>

<script setup>
// TapPay 信用卡組件實作
</script>
```

## Phase 3: 後端 API 開發

### 3.1 建立 TapPay 服務層

**新檔案**: `server/services/payment/tapPayService.js`

```javascript
import axios from 'axios'
import { AppError } from '../../middlewares/error.js'

class TapPayService {
  constructor() {
    this.baseURL = process.env.TAPPAY_API_BASE_URL
    this.partnerKey = process.env.TAPPAY_PARTNER_KEY
    this.merchantId = process.env.TAPPAY_MERCHANT_ID
  }

  // Pay by Prime API
  async payByPrime(primeToken, amount, orderDetails) {
    try {
      const response = await axios.post(`${this.baseURL}/tpc/payment/pay-by-prime`, {
        prime: primeToken,
        partner_key: this.partnerKey,
        merchant_id: this.merchantId,
        amount: amount,
        currency: 'TWD',
        details: orderDetails.description,
        cardholder: {
          phone_number: orderDetails.customerPhone,
          name: orderDetails.customerName,
        },
        remember: false,
      })

      return response.data
    } catch (error) {
      throw new AppError('TapPay 支付處理失敗', 400)
    }
  }

  // 查詢交易狀態
  async getTransactionStatus(transactionId) {
    // 實作交易狀態查詢
  }

  // 退款
  async refund(transactionId, amount, reason) {
    // 實作退款功能
  }
}

export default new TapPayService()
```

### 3.2 修改訂單控制器

**檔案**: `server/controllers/Order/orderCustomer.js`

```javascript
import tapPayService from '../../services/payment/tapPayService.js'

// 修改 processPayment 方法
export const processPayment = asyncHandler(async (req, res) => {
  const { orderId, brandId } = req.params
  const { primeToken, paymentMethod } = req.body

  const order = await Order.findOne({ _id: orderId, brand: brandId })

  if (!order) {
    throw new AppError('訂單不存在', 404)
  }

  if (paymentMethod === 'credit_card') {
    // 使用 TapPay 處理信用卡支付
    const paymentResult = await tapPayService.payByPrime(primeToken, order.total, {
      description: `訂單 ${order.orderNumber}`,
      customerName: order.customerInfo.name,
      customerPhone: order.customerInfo.phone,
    })

    if (paymentResult.status === 0) {
      // 支付成功
      order.status = 'paid'
      order.transactionId = paymentResult.rec_trade_id
      order.paymentDetails = {
        method: 'credit_card',
        processor: 'tappay',
        transactionId: paymentResult.rec_trade_id,
        bankTransactionId: paymentResult.bank_transaction_id,
      }
      await order.save()

      // 處理支付完成後續流程
      const result = await processOrderPaymentComplete(order)

      res.json({
        success: true,
        message: '支付成功',
        order: result,
        transactionId: paymentResult.rec_trade_id,
      })
    } else {
      throw new AppError(paymentResult.msg || '支付失敗', 400)
    }
  }
})
```

### 3.3 建立支付模型

**新檔案**: `server/models/Payment/Transaction.js`

```javascript
import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'TWD',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'line_pay'],
      required: true,
    },
    processor: {
      type: String,
      default: 'tappay',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    processorResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model('Transaction', transactionSchema)
```

## Phase 4: LINE Pay 整合

### 4.1 LINE Pay API 設定

```javascript
// TapPay LINE Pay 整合
const processLinePayment = async (amount, orderInfo) => {
  const response = await axios.post(`${this.baseURL}/tpc/line-pay/payment`, {
    partner_key: this.partnerKey,
    merchant_id: this.merchantId,
    amount: amount,
    currency: 'TWD',
    order_number: orderInfo.orderNumber,
    product_name: orderInfo.productName,
    return_url: `${process.env.FRONTEND_URL}/payment/line-pay/return`,
    notify_url: `${process.env.BACKEND_URL}/api/orders/payment/line-pay/notify`,
  })

  return response.data
}
```

## Phase 5: 測試計劃

### 5.1 單元測試

**新檔案**: `tests/unit/server/services/payment/tapPayService.test.js`

```javascript
import { describe, it, expect, vi } from 'vitest'
import tapPayService from '../../../../../server/services/payment/tapPayService.js'

describe('TapPay Service', () => {
  it('should process credit card payment successfully', async () => {
    // 測試信用卡支付
  })

  it('should handle payment failure correctly', async () => {
    // 測試支付失敗處理
  })
})
```

### 5.2 整合測試

- [ ] 測試完整支付流程 (前端 → 後端 → TapPay)
- [ ] 測試錯誤處理 (無效卡號、餘額不足等)
- [ ] 測試回調處理
- [ ] 測試退款功能

### 5.3 測試用例

```javascript
// 測試資料
const testCases = [
  {
    name: '成功支付',
    cardNumber: '4242424242424242',
    cvv: '123',
    expectedResult: 'success',
  },
  {
    name: '餘額不足',
    cardNumber: '4000000000000002',
    cvv: '123',
    expectedResult: 'insufficient_funds',
  },
]
```

## Phase 6: 部署與監控

### 6.1 生產環境設定

- [ ] 更新環境變數為生產環境
- [ ] 設定 HTTPS 憑證
- [ ] 配置回調 URL
- [ ] 設定錯誤監控 (Sentry)

### 6.2 監控與日誌

```javascript
// 支付日誌
const paymentLogger = {
  logPaymentAttempt: (orderId, amount, method) => {
    console.log(`Payment attempt: Order ${orderId}, Amount ${amount}, Method ${method}`)
  },
  logPaymentSuccess: (orderId, transactionId) => {
    console.log(`Payment success: Order ${orderId}, Transaction ${transactionId}`)
  },
  logPaymentFailure: (orderId, error) => {
    console.error(`Payment failed: Order ${orderId}, Error ${error}`)
  },
}
```

## 實作時程規劃

### Week 1: 基礎設定

- [ ] TapPay Portal 設定
- [ ] 開發環境 HTTPS 配置
- [ ] 環境變數配置

### Week 2: 前端整合

- [ ] TapPay SDK 整合
- [ ] 信用卡表單重構
- [ ] Prime Token 生成

### Week 3: 後端開發

- [ ] 支付服務層開發
- [ ] API 端點修改
- [ ] 資料庫模型更新

### Week 4: 測試與優化

- [ ] 單元測試
- [ ] 整合測試
- [ ] 錯誤處理優化

### Week 5: 部署與監控

- [ ] 生產環境部署
- [ ] 監控系統設定
- [ ] 用戶驗收測試

## 潛在風險與注意事項

1. **安全性**

   - 確保所有敏感資料加密傳輸
   - 定期輪換 API 金鑰
   - 實作 CSRF 保護

2. **效能**

   - 設定適當的超時時間 (建議 30 秒)
   - 實作重試機制
   - 監控 API 回應時間

3. **用戶體驗**

   - 提供清楚的錯誤訊息
   - 實作載入狀態指示
   - 支援多語言錯誤訊息

4. **合規性**
   - 遵守 PCI DSS 標準
   - 確保個資保護合規
   - 定期安全審查

## 後續功能擴展

- [ ] Apple Pay / Google Pay 整合
- [ ] 定期付款功能
- [ ] 多幣別支援
- [ ] 分期付款選項
- [ ] 退款自動化流程

---

**建議**: 建議先完成 Direct Pay (信用卡) 整合並充分測試後，再進行 LINE Pay 等其他支付方式的整合。

**聯繫方式**: 如有技術問題，請聯繫 TapPay 技術支援 support@cherri.tech
