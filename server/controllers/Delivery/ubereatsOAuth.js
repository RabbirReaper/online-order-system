/**
 * Uber Eats OAuth 控制器
 * 處理 Authorization Code Flow 的 HTTP 請求
 */

import crypto from 'crypto'
import * as ubereatsOAuth from '../../services/delivery/platforms/ubereats/oauth/ubereatsOAuth.js'
import * as ubereatsStoreOAuth from '../../services/delivery/platforms/ubereats/oauth/ubereatsStoreOAuth.js'
import { asyncHandler, AppError } from '../../middlewares/error.js'

/**
 * 發起 OAuth 授權流程
 * GET /api/delivery/ubereats/oauth/authorize?brandId=xxx&storeId=xxx
 *
 * 流程：
 * 1. 生成 state（CSRF 防護）
 * 2. 將 state 和 brandId, storeId 存入 session
 * 3. 重新導向到 Uber 授權頁面
 */
export const initiateOAuth = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.query

  // 驗證必要參數
  if (!brandId || !storeId) {
    throw new AppError('缺少 brandId 或 storeId 參數', 400)
  }

  // 生成隨機 state（CSRF 防護）
  const state = crypto.randomBytes(32).toString('hex')

  // 將 state 和相關資訊存入 session
  req.session.uberOAuthState = {
    state: state,
    brandId: brandId,
    storeId: storeId,
    createdAt: Date.now(),
  }

  console.log('📝 已生成 OAuth state:', state)

  // 生成授權 URL
  const authorizationUrl = ubereatsOAuth.generateAuthorizationUrl(state)
  console.log('🔗 重新導向到 Uber 授權頁面:', authorizationUrl)
  // 重新導向到 Uber 授權頁面
  res.redirect(authorizationUrl)
})

/**
 * 處理 Uber OAuth Callback
 * GET /api/delivery/ubereats/oauth/callback?code=xxx&state=xxx
 *
 * 流程：
 * 1. 驗證 state（CSRF 防護）
 * 2. 用 code 換取 tokens
 * 3. Store Discovery（取得店舖列表）
 * 4. 更新 PlatformStore
 * 5. 渲染成功頁面（透過 postMessage 通知父視窗）
 */
export const handleCallback = asyncHandler(async (req, res) => {
  const { code, state, error, error_description } = req.query

  // ========================================
  // 1. 處理用戶拒絕授權的情況
  // ========================================
  if (error) {
    console.error('❌ OAuth 授權失敗:', error, error_description)

    // 清除 session state
    delete req.session.uberOAuthState

    // 渲染錯誤頁面
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>授權失敗</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; font-size: 20px; margin: 20px 0; }
          .message { color: #6c757d; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="error">✗ 授權失敗</div>
        <div class="message">
          ${error === 'access_denied' ? '您已取消授權' : error_description || '發生未知錯誤'}
        </div>
        <div class="message">此視窗將在 3 秒後自動關閉...</div>
        <script>
          // 通知父視窗
          if (window.opener) {
            window.opener.postMessage({
              type: 'uber-oauth-error',
              error: '${error === 'access_denied' ? '用戶取消授權' : error_description || '授權失敗'}'
            }, window.location.origin);
          }
          // 3 秒後關閉視窗
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
      </html>
    `)
  }

  // ========================================
  // 2. 驗證 state（CSRF 防護）
  // ========================================
  const sessionState = req.session.uberOAuthState

  if (!sessionState) {
    throw new AppError('Session state 不存在，請重新授權', 400)
  }

  if (sessionState.state !== state) {
    // 清除 session
    delete req.session.uberOAuthState
    throw new AppError('State 參數不匹配，可能的 CSRF 攻擊', 403)
  }

  // 檢查 state 是否過期（5 分鐘）
  const stateAge = Date.now() - sessionState.createdAt
  if (stateAge > 5 * 60 * 1000) {
    delete req.session.uberOAuthState
    throw new AppError('State 已過期，請重新授權', 400)
  }

  console.log('✓ State 驗證通過')

  // 取得 brandId 和 storeId
  const { brandId, storeId } = sessionState

  // 清除 session state（使用後立即刪除）
  delete req.session.uberOAuthState

  try {
    // ========================================
    // 3. 用 code 換取 tokens
    // ========================================
    const tokenData = await ubereatsOAuth.exchangeCodeForToken(code)

    // ========================================
    // 4. Store Discovery（取得店舖列表）
    // ========================================
    const discoveredStores = await ubereatsOAuth.getAuthorizedStores(tokenData.access_token)

    console.log(
      `✓ 發現 ${discoveredStores.length} 個店舖:`,
      discoveredStores.map((s) => s.name),
    )

    // ========================================
    // 5. 更新 PlatformStore
    // ========================================
    await ubereatsStoreOAuth.updatePlatformStoreWithOAuth(
      brandId,
      storeId,
      tokenData,
      discoveredStores,
    )

    // ========================================
    // 6. 渲染成功頁面
    // ========================================
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>授權成功</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: #28a745; font-size: 24px; margin: 20px 0; }
          .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #28a745; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .store-count { color: #6c757d; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="success">✓ 授權成功！</div>
        <div class="store-count">已發現 ${discoveredStores.length} 個店舖</div>
        <div class="spinner"></div>
        <div>正在更新資料...</div>
        <div style="color: #6c757d; margin-top: 20px;">此視窗將自動關閉</div>
        <script>
          // 通知父視窗授權成功
          if (window.opener) {
            window.opener.postMessage({
              type: 'uber-oauth-success',
              data: {
                brandId: '${brandId}',
                storeId: '${storeId}',
                storeCount: ${discoveredStores.length}
              }
            }, window.location.origin);
          }
          // 1 秒後關閉視窗
          setTimeout(() => window.close(), 1000);
        </script>
      </body>
      </html>
    `)
  } catch (error) {
    console.error('❌ OAuth callback 處理失敗:', error)

    // 渲染錯誤頁面
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>授權失敗</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; font-size: 20px; margin: 20px 0; }
          .message { color: #6c757d; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="error">✗ 授權處理失敗</div>
        <div class="message">${error.message || '發生未知錯誤'}</div>
        <div class="message">此視窗將在 3 秒後自動關閉...</div>
        <script>
          // 通知父視窗
          if (window.opener) {
            window.opener.postMessage({
              type: 'uber-oauth-error',
              error: '${error.message || '授權處理失敗'}'
            }, window.location.origin);
          }
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
      </html>
    `)
  }
})

/**
 * 查詢 OAuth 授權狀態
 * GET /api/delivery/ubereats/oauth/status/:brandId/:storeId
 */
export const getOAuthStatus = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params

  const status = await ubereatsStoreOAuth.getOAuthStatus(brandId, storeId)

  res.status(200).json({
    success: true,
    data: status,
  })
})

/**
 * 撤銷 OAuth 授權（解除連接）
 * DELETE /api/delivery/ubereats/oauth/revoke/:brandId/:storeId
 */
export const revokeOAuth = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params

  await ubereatsStoreOAuth.clearOAuthData(brandId, storeId)

  res.status(200).json({
    success: true,
    message: '已成功解除 Uber Eats 授權',
  })
})

/**
 * 更新選擇的店舖 ID
 * PATCH /api/delivery/ubereats/oauth/select-store/:brandId/:storeId
 */
export const updateSelectedStore = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params
  const { platformStoreId } = req.body

  if (!platformStoreId) {
    throw new AppError('缺少 platformStoreId 參數', 400)
  }

  const platformStore = await ubereatsStoreOAuth.updateSelectedStore(
    brandId,
    storeId,
    platformStoreId,
  )

  res.status(200).json({
    success: true,
    message: '已更新選擇的店舖',
    data: platformStore,
  })
})
