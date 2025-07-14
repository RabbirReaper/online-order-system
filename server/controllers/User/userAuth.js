import * as userAuthService from '../../services/user/index.js'
import { asyncHandler } from '../../middlewares/error.js'

/**
 * 用戶註冊
 */
export const register = asyncHandler(async (req, res) => {
  const { brandId } = req.params
  const { phone, code, ...userData } = req.body

  // 驗證手機驗證碼
  await userAuthService.verifyPhoneCode(phone, code, 'register')

  // 註冊用戶
  const userWithBrand = {
    ...userData,
    phone,
    brand: brandId,
  }

  const user = await userAuthService.register(userWithBrand)

  res.status(201).json({
    success: true,
    message: '註冊成功',
    user,
  })
})

/**
 * 用戶登入
 */
export const login = asyncHandler(async (req, res) => {
  const { brandId } = req.params
  const credentials = {
    ...req.body,
    brand: brandId,
  }

  const user = await userAuthService.login(credentials, req.session)

  res.json({
    success: true,
    message: '登入成功',
    user,
  })
})

/**
 * 用戶登出
 */
export const logout = asyncHandler(async (req, res) => {
  await userAuthService.logout(req.session)

  res.clearCookie('connect.sid')

  res.json({
    success: true,
    message: '登出成功',
  })
})

/**
 * 發送手機驗證碼
 */
export const sendVerificationCode = asyncHandler(async (req, res) => {
  const { brandId } = req.params
  const { phone, purpose = 'register' } = req.body

  const result = await userAuthService.sendPhoneVerification(phone, brandId, purpose)
  console.log('發送驗證碼結果:', result)
  res.json(result)
})

/**
 * 驗證手機驗證碼
 */
export const verifyCode = asyncHandler(async (req, res) => {
  const { phone, code, purpose = 'register' } = req.body

  const result = await userAuthService.verifyPhoneCode(phone, code, purpose)

  res.json({
    success: true,
    message: '驗證成功',
    verified: result.verified,
  })
})

/**
 * 忘記密碼
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { brandId } = req.params
  const { phone } = req.body

  const result = await userAuthService.forgotPassword(phone, brandId)

  res.json({
    success: true,
    message: '重設密碼驗證碼已發送至您的手機',
    expiresIn: result.expiresIn,
  })
})

/**
 * 重設密碼
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { brandId } = req.params
  const { phone, code, newPassword } = req.body

  const result = await userAuthService.resetPassword(phone, code, newPassword, brandId)

  res.json({
    success: true,
    message: '密碼重設成功，請使用新密碼登入',
  })
})

/**
 * 修改密碼
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.auth.userId

  const result = await userAuthService.changePassword(userId, currentPassword, newPassword)

  res.json({
    success: true,
    message: '密碼修改成功',
  })
})

/**
 * 檢查用戶登入狀態
 */
export const checkUserStatus = asyncHandler(async (req, res) => {
  const status = await userAuthService.checkUserStatus(req.session)

  res.json({
    success: true,
    ...status,
  })
})
