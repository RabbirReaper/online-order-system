/**
 * 付款相關路由
 * server/routes/payment.js
 */

import express from 'express'
import * as paymentCallbackService from '../services/payment/paymentCallbackService.js'

const router = express.Router()

/**
 * NewebPay 幕後通知 (NotifyURL)
 * POST /api/payment/newebpay/notify
 *
 * NewebPay 會在付款完成後發送幕後通知到這個 URL
 * 這是主要的付款結果處理路由
 */
router.post('/newebpay/notify', async (req, res) => {
  try {
    console.log('📥 [NotifyURL] 收到 NewebPay 幕後通知')
    console.log('Request body:', req.body)

    // 處理回調
    const result = await paymentCallbackService.handleNewebpayNotify(req.body)

    console.log('✅ [NotifyURL] 處理成功:', {
      success: result.success,
      orderId: result.order._id,
      duplicate: result.duplicate,
    })

    // 必須回傳純文字 'SUCCESS' 給 NewebPay
    res.send('SUCCESS')
  } catch (error) {
    console.error('❌ [NotifyURL] 處理 NewebPay 通知失敗:', error)

    // 即使發生錯誤也要回傳 200 狀態碼，避免 NewebPay 重試
    // 但回傳 'FAIL' 表示處理失敗
    res.status(200).send('FAIL')
  }
})

/**
 * NewebPay 前景返回 (ReturnURL)
 * POST /api/payment/newebpay/return
 *
 * 付款完成後，NewebPay 會將使用者重定向回這個 URL
 * 這是給使用者看的返回頁面
 */
router.post('/newebpay/return', async (req, res) => {
  try {
    console.log('🔙 [ReturnURL] 收到 NewebPay 前景返回')
    console.log('Request body:', req.body)

    // 處理返回
    const result = await paymentCallbackService.handleNewebpayReturn(req.body)

    console.log('✅ [ReturnURL] 處理成功:', {
      orderId: result.orderId,
      orderStatus: result.orderStatus,
      paymentSuccess: result.paymentSuccess,
    })

    // 重定向到訂單詳情頁
    const frontendURL = process.env.NEWEBPAY_NotifyUrl
    const redirectURL = `${frontendURL}/stores/${result.brandId}/${result.storeId}/order-confirm/${result.orderId}`

    console.log('↪️ [ReturnURL] 重定向到:', redirectURL)

    res.redirect(redirectURL)
  } catch (error) {
    console.error('❌ [ReturnURL] 處理前景返回失敗:', error)

    // 發生錯誤時重定向回購物車，並帶上錯誤訊息
    const frontendURL = process.env.NEWEBPAY_NotifyUrl
    const errorURL = `${frontendURL}/cart?error=payment_failed`

    console.log('↪️ [ReturnURL] 錯誤重定向到:', errorURL)

    res.redirect(errorURL)
  }
})

/**
 * NewebPay 客戶返回 (ClientBackURL)
 * GET /api/payment/newebpay/client-back
 *
 * 使用者在 NewebPay 頁面點擊「返回」按鈕時會導向這個 URL
 */
router.get('/newebpay/client-back', (req, res) => {
  try {
    console.log('⬅️ [ClientBackURL] 使用者點擊返回按鈕')

    // 導回購物車頁面
    const frontendURL = process.env.NEWEBPAY_NotifyUrl
    const redirectURL = `${frontendURL}/cart`

    console.log('↪️ [ClientBackURL] 重定向到:', redirectURL)

    res.redirect(redirectURL)
  } catch (error) {
    console.error('❌ [ClientBackURL] 處理客戶返回失敗:', error)

    // 發生錯誤也導回首頁
    const frontendURL = process.env.NEWEBPAY_NotifyUrl
    res.redirect(frontendURL)
  }
})

export default router
