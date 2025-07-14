/**
 * 日期時間工具函數
 * 集中處理日期時間相關的工具函數
 */

import { DateTime } from 'luxon'

// 台灣時區常數
const TAIWAN_TIMEZONE = 'Asia/Taipei'

/**
 * 獲取台灣時區的當前日期時間
 * @returns {DateTime} Luxon DateTime 物件 (台灣時區)
 */
export const getTaiwanDateTime = () => {
  return DateTime.now().setZone(TAIWAN_TIMEZONE)
}

/**
 * 解析前端傳來的日期字串，假設為台灣時區
 * @param {String} dateString - 日期字串 (YYYY-MM-DD 格式)
 * @returns {DateTime} 台灣時區的 DateTime 物件
 */
export const parseDateString = (dateString) => {
  if (!dateString) {
    throw new Error('日期字串不能為空')
  }

  // 解析 YYYY-MM-DD 格式，假設為台灣時區
  const parsed = DateTime.fromISO(dateString, { zone: TAIWAN_TIMEZONE })

  if (!parsed.isValid) {
    throw new Error(`無效的日期格式: ${dateString}，期望格式為 YYYY-MM-DD`)
  }

  return parsed
}

/**
 * 解析前端傳來的日期時間字串，假設為台灣時區
 * @param {String} dateTimeString - 日期時間字串 (ISO 格式)
 * @returns {DateTime} 台灣時區的 DateTime 物件
 */
export const parseDateTimeString = (dateTimeString) => {
  if (!dateTimeString) {
    throw new Error('日期時間字串不能為空')
  }

  // 如果沒有時區信息，假設為台灣時區
  const parsed = DateTime.fromISO(dateTimeString, { zone: TAIWAN_TIMEZONE })

  if (!parsed.isValid) {
    throw new Error(`無效的日期時間格式: ${dateTimeString}`)
  }

  return parsed
}

/**
 * 安全地將輸入轉換為 DateTime 物件
 * @param {Date|DateTime|String} input - 輸入的日期
 * @returns {DateTime} DateTime 物件
 */
export const toDateTime = (input) => {
  if (!input) {
    throw new Error('輸入不能為空')
  }

  if (input instanceof DateTime) {
    return input
  } else if (input instanceof Date) {
    return DateTime.fromJSDate(input).setZone(TAIWAN_TIMEZONE)
  } else if (typeof input === 'string') {
    return parseDateTimeString(input)
  } else {
    throw new Error('無效的輸入類型，需要 Date、DateTime 或 String')
  }
}

/**
 * 獲取指定日期的開始時間 (00:00:00.000)
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {DateTime} 該日期的開始時間
 */
export const getStartOfDay = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.startOf('day')
}

/**
 * 獲取指定日期的結束時間 (23:59:59.999)
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {DateTime} 該日期的結束時間
 */
export const getEndOfDay = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.endOf('day')
}

/**
 * 獲取指定週的開始時間 (週一 00:00:00.000)
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {DateTime} 該週的開始時間
 */
export const getStartOfWeek = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.startOf('week')
}

/**
 * 獲取指定週的結束時間 (週日 23:59:59.999)
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {DateTime} 該週的結束時間
 */
export const getEndOfWeek = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.endOf('week')
}

/**
 * 獲取指定月份的開始時間 (1日 00:00:00.000)
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {DateTime} 該月份的開始時間
 */
export const getStartOfMonth = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.startOf('month')
}

/**
 * 獲取指定月份的結束時間 (最後一日 23:59:59.999)
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {DateTime} 該月份的結束時間
 */
export const getEndOfMonth = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.endOf('month')
}

/**
 * 獲取指定季度的開始時間
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {DateTime} 該季度的開始時間
 */
export const getStartOfQuarter = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.startOf('quarter')
}

/**
 * 獲取指定季度的結束時間
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {DateTime} 該季度的結束時間
 */
export const getEndOfQuarter = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.endOf('quarter')
}

/**
 * 獲取指定年份的開始時間
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {DateTime} 該年份的開始時間
 */
export const getStartOfYear = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.startOf('year')
}

/**
 * 獲取指定年份的結束時間
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {DateTime} 該年份的結束時間
 */
export const getEndOfYear = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.endOf('year')
}

/**
 * 格式化日期時間為特定格式
 * @param {Date|DateTime|String} date - 日期物件
 * @param {String} format - 格式字串 (luxon 格式)
 * @returns {String} 格式化後的日期時間字串
 */
export const formatDateTime = (date, format = 'yyyy-MM-dd HH:mm:ss') => {
  const dateTime = toDateTime(date)
  return dateTime.toFormat(format)
}

/**
 * 格式化為常用的顯示格式
 */
export const formatDate = (date) => formatDateTime(date, 'yyyy-MM-dd')
export const formatTime = (date) => formatDateTime(date, 'HH:mm:ss')
export const formatDateTimeShort = (date) => formatDateTime(date, 'MM-dd HH:mm')
export const formatDateTimeFull = (date) => formatDateTime(date, 'yyyy-MM-dd HH:mm:ss')

/**
 * 格式化為中文顯示格式
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {String} 中文格式的日期時間字串
 */
export const formatDateTimeChinese = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.toFormat('yyyy年MM月dd日 HH:mm:ss')
}

/**
 * 格式化為相對時間顯示
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {String} 相對時間字串
 */
export const formatRelativeTime = (date) => {
  const dateTime = toDateTime(date)
  const now = getTaiwanDateTime()
  const diff = now.diff(dateTime, ['days', 'hours', 'minutes'])

  if (diff.days > 0) {
    return `${Math.floor(diff.days)}天前`
  } else if (diff.hours > 0) {
    return `${Math.floor(diff.hours)}小時前`
  } else if (diff.minutes > 0) {
    return `${Math.floor(diff.minutes)}分鐘前`
  } else {
    return '剛剛'
  }
}

/**
 * 判斷日期是否為今天
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {Boolean} 是否為今天
 */
export const isToday = (date) => {
  const dateTime = toDateTime(date)
  const today = getTaiwanDateTime()
  return dateTime.hasSame(today, 'day')
}

/**
 * 判斷日期是否為昨天
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {Boolean} 是否為昨天
 */
export const isYesterday = (date) => {
  const dateTime = toDateTime(date)
  const yesterday = getTaiwanDateTime().minus({ days: 1 })
  return dateTime.hasSame(yesterday, 'day')
}

/**
 * 判斷日期是否為本週
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {Boolean} 是否為本週
 */
export const isThisWeek = (date) => {
  const dateTime = toDateTime(date)
  const now = getTaiwanDateTime()
  return dateTime.hasSame(now, 'week')
}

/**
 * 判斷日期是否為本月
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {Boolean} 是否為本月
 */
export const isThisMonth = (date) => {
  const dateTime = toDateTime(date)
  const now = getTaiwanDateTime()
  return dateTime.hasSame(now, 'month')
}

/**
 * 計算兩個日期之間的差異
 * @param {Date|DateTime|String} dateFrom - 開始日期
 * @param {Date|DateTime|String} dateTo - 結束日期
 * @param {String} unit - 單位 ('days', 'hours', 'minutes', 'seconds')
 * @returns {Number} 相差的數量
 */
export const dateDifference = (dateFrom, dateTo, unit = 'days') => {
  const from = toDateTime(dateFrom)
  const to = toDateTime(dateTo)
  const diff = to.diff(from, unit)
  return Math.round(diff[unit])
}

/**
 * 計算兩個日期之間的天數差異 (向後相容)
 * @param {Date|DateTime|String} dateFrom - 開始日期
 * @param {Date|DateTime|String} dateTo - 結束日期
 * @returns {Number} 相差的天數
 */
export const daysDifference = (dateFrom, dateTo) => {
  return dateDifference(dateFrom, dateTo, 'days')
}

/**
 * 創建日期範圍
 * @param {String} period - 期間類型 ('today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear')
 * @param {Date|DateTime|String} baseDate - 基準日期 (默認為今天)
 * @returns {Object} { start: DateTime, end: DateTime }
 */
export const createDateRange = (period, baseDate = null) => {
  const base = baseDate ? toDateTime(baseDate) : getTaiwanDateTime()

  switch (period) {
    case 'today':
      return {
        start: getStartOfDay(base),
        end: getEndOfDay(base),
      }
    case 'yesterday':
      const yesterday = base.minus({ days: 1 })
      return {
        start: getStartOfDay(yesterday),
        end: getEndOfDay(yesterday),
      }
    case 'thisWeek':
      return {
        start: getStartOfWeek(base),
        end: getEndOfWeek(base),
      }
    case 'lastWeek':
      const lastWeekStart = getStartOfWeek(base).minus({ weeks: 1 })
      return {
        start: lastWeekStart,
        end: getEndOfWeek(lastWeekStart),
      }
    case 'thisMonth':
      return {
        start: getStartOfMonth(base),
        end: getEndOfMonth(base),
      }
    case 'lastMonth':
      const lastMonthStart = getStartOfMonth(base).minus({ months: 1 })
      return {
        start: lastMonthStart,
        end: getEndOfMonth(lastMonthStart),
      }
    case 'thisQuarter':
      return {
        start: getStartOfQuarter(base),
        end: getEndOfQuarter(base),
      }
    case 'lastQuarter':
      const lastQuarterStart = getStartOfQuarter(base).minus({ quarters: 1 })
      return {
        start: lastQuarterStart,
        end: getEndOfQuarter(lastQuarterStart),
      }
    case 'thisYear':
      return {
        start: getStartOfYear(base),
        end: getEndOfYear(base),
      }
    case 'lastYear':
      const lastYearStart = getStartOfYear(base).minus({ years: 1 })
      return {
        start: lastYearStart,
        end: getEndOfYear(lastYearStart),
      }
    case 'last7Days':
      const last7DaysStart = base.minus({ days: 7 }).startOf('day')
      return {
        start: last7DaysStart,
        end: getEndOfDay(base.minus({ days: 1 })), // 不包含今天
      }

    case 'last30Days':
      const last30DaysStart = base.minus({ days: 30 }).startOf('day')
      return {
        start: last30DaysStart,
        end: getEndOfDay(base.minus({ days: 1 })), // 不包含今天
      }

    case 'last90Days':
      const last90DaysStart = base.minus({ days: 90 }).startOf('day')
      return {
        start: last90DaysStart,
        end: getEndOfDay(base.minus({ days: 1 })), // 不包含今天
      }
    default:
      throw new Error(`不支援的期間類型: ${period}`)
  }
}

/**
 * 驗證時區
 * @param {String} timezone - 時區字串
 * @returns {Boolean} 是否為有效時區
 */
export const validateTimezone = (timezone) => {
  try {
    const testDate = DateTime.local().setZone(timezone)
    return testDate.isValid
  } catch (error) {
    return false
  }
}

/**
 * 驗證日期
 * @param {Any} input - 輸入值
 * @returns {Boolean} 是否為有效日期
 */
export const isValidDate = (input) => {
  try {
    const dateTime = toDateTime(input)
    return dateTime.isValid
  } catch (error) {
    return false
  }
}

/**
 * 獲取日期的星期幾 (1=週一, 7=週日)
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {Number} 星期幾
 */
export const getWeekday = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.weekday
}

/**
 * 獲取日期的中文星期顯示
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {String} 中文星期
 */
export const getWeekdayChinese = (date) => {
  const weekday = getWeekday(date)
  const weekdays = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日']
  return weekdays[weekday]
}

/**
 * 將 DateTime 轉換為 UTC 並返回 JS Date (用於資料庫儲存)
 * @param {Date|DateTime|String} date - 日期物件
 * @returns {Date} UTC 的 JS Date 物件
 */
export const toUTCDate = (date) => {
  const dateTime = toDateTime(date)
  return dateTime.toUTC().toJSDate()
}

/**
 * 從 UTC JS Date 轉換為台灣時區 DateTime (用於資料庫讀取)
 * @param {Date} utcDate - UTC 的 JS Date 物件
 * @returns {DateTime} 台灣時區的 DateTime 物件
 */
export const fromUTCDate = (utcDate) => {
  return DateTime.fromJSDate(utcDate, { zone: 'UTC' }).setZone(TAIWAN_TIMEZONE)
}

/**
 * 生成台灣時區的日期代碼 (YYMMDD)
 * @param {Date|DateTime|String} date - 日期物件 (默認為今天)
 * @returns {String} 日期代碼
 */
export const generateDateCode = (date = null) => {
  const dateTime = date ? toDateTime(date) : getTaiwanDateTime()
  return dateTime.toFormat('yyMMdd')
}

/**
 * 檢查是否為營業時間 (可自訂)
 * @param {Date|DateTime|String} date - 檢查的時間
 * @param {Object} businessHours - 營業時間設定 { start: 'HH:mm', end: 'HH:mm' }
 * @returns {Boolean} 是否在營業時間內
 */
export const isBusinessHours = (date, businessHours = { start: '09:00', end: '22:00' }) => {
  const dateTime = toDateTime(date)
  const hour = dateTime.hour
  const minute = dateTime.minute
  const currentTime = hour * 60 + minute // 轉換為分鐘

  const [startHour, startMinute] = businessHours.start.split(':').map(Number)
  const [endHour, endMinute] = businessHours.end.split(':').map(Number)

  const startTime = startHour * 60 + startMinute
  const endTime = endHour * 60 + endMinute

  return currentTime >= startTime && currentTime <= endTime
}
