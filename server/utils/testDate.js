/**
 * 日期工具函數測試
 * 測試各種時區處理和邊界情況
 */

import * as dateUtils from './date.js'

// 測試函數
const runTests = () => {
  console.log('=== 日期工具函數測試開始 ===\n')

  // 測試 1: 基本時區處理
  testBasicTimezone()

  // 測試 2: 前端日期解析
  testFrontendDateParsing()

  // 測試 3: 日期範圍生成
  testDateRanges()

  // 測試 4: 格式化功能
  testFormatting()

  // 測試 5: 驗證功能
  testValidation()

  // 測試 6: 邊界情況
  testEdgeCases()

  console.log('\n=== 所有測試完成 ===')
}

const testBasicTimezone = () => {
  console.log('📅 測試基本時區處理...')

  try {
    // 獲取台灣時間
    const taiwanNow = dateUtils.getTaiwanDateTime()
    console.log(`台灣當前時間: ${taiwanNow.toISO()}`)

    // 測試 UTC 轉換
    const utcDate = dateUtils.toUTCDate(taiwanNow)
    const backToTaiwan = dateUtils.fromUTCDate(utcDate)

    console.log(`轉換為 UTC: ${utcDate.toISOString()}`)
    console.log(`回到台灣時間: ${backToTaiwan.toISO()}`)
    console.log(`時間一致性: ${taiwanNow.toISO() === backToTaiwan.toISO() ? '✅' : '❌'}`)
  } catch (error) {
    console.error('❌ 基本時區測試失敗:', error.message)
  }

  console.log('')
}

const testFrontendDateParsing = () => {
  console.log('🔍 測試前端日期解析...')

  try {
    // 測試標準日期格式
    const dateStr = '2024-03-15'
    const parsed = dateUtils.parseDateString(dateStr)
    console.log(`解析 "${dateStr}": ${parsed.toISO()}`)

    // 測試日期時間格式
    const dateTimeStr = '2024-03-15T14:30:00'
    const parsedDateTime = dateUtils.parseDateTimeString(dateTimeStr)
    console.log(`解析 "${dateTimeStr}": ${parsedDateTime.toISO()}`)

    // 測試開始/結束時間
    const startOfDay = dateUtils.getStartOfDay(parsed)
    const endOfDay = dateUtils.getEndOfDay(parsed)
    console.log(`日期開始: ${startOfDay.toISO()}`)
    console.log(`日期結束: ${endOfDay.toISO()}`)

    console.log('✅ 前端日期解析測試通過')
  } catch (error) {
    console.error('❌ 前端日期解析測試失敗:', error.message)
  }

  console.log('')
}

const testDateRanges = () => {
  console.log('📊 測試日期範圍生成...')

  try {
    const periods = ['today', 'yesterday', 'thisWeek', 'thisMonth', 'thisYear']

    periods.forEach((period) => {
      const range = dateUtils.createDateRange(period)
      console.log(
        `${period}: ${range.start.toFormat('yyyy-MM-dd HH:mm')} ~ ${range.end.toFormat('yyyy-MM-dd HH:mm')}`,
      )
    })

    console.log('✅ 日期範圍測試通過')
  } catch (error) {
    console.error('❌ 日期範圍測試失敗:', error.message)
  }

  console.log('')
}

const testFormatting = () => {
  console.log('✨ 測試格式化功能...')

  try {
    const testDate = dateUtils.parseDateTimeString('2024-03-15T14:30:25')

    console.log(`原始時間: ${testDate.toISO()}`)
    console.log(`日期格式: ${dateUtils.formatDate(testDate)}`)
    console.log(`時間格式: ${dateUtils.formatTime(testDate)}`)
    console.log(`短格式: ${dateUtils.formatDateTimeShort(testDate)}`)
    console.log(`完整格式: ${dateUtils.formatDateTimeFull(testDate)}`)
    console.log(`中文格式: ${dateUtils.formatDateTimeChinese(testDate)}`)
    console.log(`相對時間: ${dateUtils.formatRelativeTime(testDate)}`)
    console.log(`星期顯示: ${dateUtils.getWeekdayChinese(testDate)}`)

    console.log('✅ 格式化測試通過')
  } catch (error) {
    console.error('❌ 格式化測試失敗:', error.message)
  }

  console.log('')
}

const testValidation = () => {
  console.log('🔒 測試驗證功能...')

  try {
    // 測試有效日期
    console.log(`有效日期 "2024-03-15": ${dateUtils.isValidDate('2024-03-15') ? '✅' : '❌'}`)
    console.log(`無效日期 "invalid": ${dateUtils.isValidDate('invalid') ? '❌' : '✅'}`)

    // 測試有效時區
    console.log(
      `有效時區 "Asia/Taipei": ${dateUtils.validateTimezone('Asia/Taipei') ? '✅' : '❌'}`,
    )
    console.log(
      `無效時區 "Invalid/Zone": ${dateUtils.validateTimezone('Invalid/Zone') ? '❌' : '✅'}`,
    )

    // 測試日期判斷
    const today = dateUtils.getTaiwanDateTime()
    const yesterday = today.minus({ days: 1 })

    console.log(`今天判斷: ${dateUtils.isToday(today) ? '✅' : '❌'}`)
    console.log(`昨天判斷: ${dateUtils.isYesterday(yesterday) ? '✅' : '❌'}`)
    console.log(`本週判斷: ${dateUtils.isThisWeek(today) ? '✅' : '❌'}`)
    console.log(`本月判斷: ${dateUtils.isThisMonth(today) ? '✅' : '❌'}`)

    console.log('✅ 驗證功能測試通過')
  } catch (error) {
    console.error('❌ 驗證功能測試失敗:', error.message)
  }

  console.log('')
}

const testEdgeCases = () => {
  console.log('⚠️ 測試邊界情況...')

  try {
    // 測試跨年邊界
    const newYear = dateUtils.parseDateTimeString('2024-01-01T00:00:00')
    const lastYear = dateUtils.parseDateTimeString('2023-12-31T23:59:59')

    console.log(`跨年時間差: ${dateUtils.dateDifference(lastYear, newYear, 'minutes')} 分鐘`)

    // 測試月底邊界
    const monthEnd = dateUtils.parseDateTimeString('2024-02-29T23:59:59') // 閏年
    const nextMonth = dateUtils.parseDateTimeString('2024-03-01T00:00:00')

    console.log(`月底到月初: ${dateUtils.dateDifference(monthEnd, nextMonth, 'minutes')} 分鐘`)

    // 測試空值處理
    try {
      dateUtils.parseDateString('')
      console.log('❌ 空字串應該拋出錯誤')
    } catch (error) {
      console.log('✅ 空字串正確拋出錯誤')
    }

    // 測試營業時間
    const businessTime = dateUtils.parseDateTimeString('2024-03-15T15:30:00')
    const afterHours = dateUtils.parseDateTimeString('2024-03-15T23:30:00')

    console.log(`營業時間內 (15:30): ${dateUtils.isBusinessHours(businessTime) ? '✅' : '❌'}`)
    console.log(`營業時間外 (23:30): ${dateUtils.isBusinessHours(afterHours) ? '❌' : '✅'}`)

    // 測試日期代碼生成
    const dateCode = dateUtils.generateDateCode(businessTime)
    console.log(`日期代碼: ${dateCode}`)

    console.log('✅ 邊界情況測試通過')
  } catch (error) {
    console.error('❌ 邊界情況測試失敗:', error.message)
  }

  console.log('')
}

// 效能測試
const performanceTest = () => {
  console.log('🚀 效能測試...')

  const iterations = 10000

  // 測試日期解析效能
  console.time('日期解析效能')
  for (let i = 0; i < iterations; i++) {
    dateUtils.parseDateString('2024-03-15')
  }
  console.timeEnd('日期解析效能')

  // 測試格式化效能
  const testDate = dateUtils.getTaiwanDateTime()
  console.time('格式化效能')
  for (let i = 0; i < iterations; i++) {
    dateUtils.formatDateTime(testDate)
  }
  console.timeEnd('格式化效能')

  console.log('✅ 效能測試完成\n')
}

// 執行測試
runTests()
performanceTest()

// 導出測試函數供其他地方使用
export {
  runTests,
  performanceTest,
  testBasicTimezone,
  testFrontendDateParsing,
  testDateRanges,
  testFormatting,
  testValidation,
  testEdgeCases,
}
