// 全局 Toast 通知系統
// 使用 bootstrap-vue-next 的 BToastOrchestrator

// Toast 類型對應 Bootstrap 的 variant
export const ToastType = {
  SUCCESS: 'success',
  ERROR: 'danger',
  WARNING: 'warning',
  INFO: 'info',
}

// 防抖機制：追蹤最近的 toast 觸發時間
const toastTimestamps = []
const DEBOUNCE_WINDOW = 500 // 0.5 秒時間窗口（毫秒）
const MAX_TOAST_COUNT = 2 // 時間窗口內最多觸發次數

// 檢查是否應該顯示 toast（防抖判斷）
const shouldShowToast = () => {
  const now = Date.now()

  // 移除超過時間窗口的舊記錄
  while (toastTimestamps.length > 0 && now - toastTimestamps[0] > DEBOUNCE_WINDOW) {
    toastTimestamps.shift()
  }

  // 檢查是否超過最大次數
  if (toastTimestamps.length >= MAX_TOAST_COUNT) {
    console.warn('Toast 觸發過於頻繁，已被限制')
    return false
  }

  // 記錄此次觸發時間
  toastTimestamps.push(now)
  return true
}

// 顯示 Toast 通知
export const showToast = (message, type = ToastType.INFO, options = {}) => {
  // 防抖檢查
  if (!shouldShowToast()) {
    return
  }

  const duration = options.delay || options.value || 1000 // 自動隱藏延遲時間（毫秒）

  const defaultOptions = {
    title: getDefaultTitle(type),
    variant: type,
    pos: 'top-center',
    value: duration, // modelValue - 設置為數字時會自動隱藏
    noCloseButton: false, // 顯示關閉按鈕
    ...options,
  }

  // 使用事件系統觸發 toast 顯示
  window.dispatchEvent(
    new CustomEvent('show-toast', {
      detail: { message, options: defaultOptions },
    }),
  )
}

// 根據類型獲取預設標題
const getDefaultTitle = (type) => {
  switch (type) {
    case ToastType.SUCCESS:
      return '成功'
    case ToastType.ERROR:
      return '錯誤'
    case ToastType.WARNING:
      return '警告'
    case ToastType.INFO:
      return '提示'
    default:
      return '通知'
  }
}

// 便捷方法
export const toastSuccess = (message, options = {}) => {
  showToast(message, ToastType.SUCCESS, options)
}

export const toastError = (message, options = {}) => {
  showToast(message, ToastType.ERROR, options)
}

export const toastWarning = (message, options = {}) => {
  showToast(message, ToastType.WARNING, options)
}

export const toastInfo = (message, options = {}) => {
  showToast(message, ToastType.INFO, options)
}

// Session 過期專用通知
export const toastSessionExpired = () => {
  showToast('登入已過期，請重新登入', ToastType.WARNING, {
    title: 'Session 過期',
    value: 1000,
  })
}
