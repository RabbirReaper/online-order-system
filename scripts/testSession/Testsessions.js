import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

async function testSessions() {
  try {
    console.log('🔗 正在連接 MongoDB...\n')
    await mongoose.connect(process.env.MongoDB_url)
    console.log('✅ 已連接到 MongoDB\n')

    const db = mongoose.connection.db
    const sessions = await db.collection('sessions').find().toArray()

    console.log(`📊 總共有 ${sessions.length} 個 sessions\n`)
    console.log('='.repeat(70))

    if (sessions.length === 0) {
      console.log('\n⚠️  沒有找到任何 session')
      console.log('\n建議：請先登入系統，然後再執行此腳本\n')
      await mongoose.disconnect()
      return
    }

    const now = new Date()
    let hasRememberMe = false
    let hasShortSession = false

    sessions.forEach((session, index) => {
      console.log(`\n📋 Session ${index + 1}`)
      console.log('-'.repeat(70))

      // 時間計算
      const expires = new Date(session.expires)
      const lastModified = new Date(session.lastModified)
      const maxAgeMs = expires - lastModified
      const maxAgeHours = maxAgeMs / (1000 * 60 * 60)
      const hoursToExpire = (expires - now) / (1000 * 60 * 60)

      console.log(`Session ID: ${session._id}`)
      console.log(`過期時間: ${expires.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`)
      console.log(`最後修改: ${lastModified.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`)
      console.log(`距離過期: ${hoursToExpire.toFixed(2)} 小時`)

      // 判斷 session 類型
      let sessionType = ''
      if (maxAgeHours >= 300) {
        // >= 12.5 天
        sessionType = '✅ 記住我 (14天)'
        hasRememberMe = true
      } else if (maxAgeHours >= 20) {
        // >= 20 小時
        sessionType = '📅 長期 (24小時)'
      } else if (maxAgeHours >= 1.5 && maxAgeHours <= 3) {
        // 1.5-3 小時
        sessionType = '⏰ 短期 (2小時)'
        hasShortSession = true
      } else {
        sessionType = `⚠️  異常 (${maxAgeHours.toFixed(2)}小時)`
      }

      console.log(`\nSession 類型: ${sessionType}`)
      console.log(`MaxAge 設定: ${maxAgeHours.toFixed(2)} 小時`)

      // 狀態
      if (hoursToExpire < 0) {
        console.log(`狀態: ❌ 已過期`)
      } else if (hoursToExpire < 1) {
        console.log(`狀態: ⚠️  即將過期`)
      } else {
        console.log(`狀態: ✅ 有效`)
      }
    })

    console.log('\n' + '='.repeat(70))
    console.log('\n🔍 診斷結果:\n')

    // 診斷報告
    const activeCount = sessions.filter((s) => new Date(s.expires) > now).length
    const expiredCount = sessions.length - activeCount

    console.log(`✓ 有效 sessions: ${activeCount}`)
    console.log(`✗ 已過期 sessions: ${expiredCount}`)

    if (!hasRememberMe && sessions.length > 0) {
      console.log(`\n❌ 問題: 沒有找到「記住我」類型的 session（應該是 14 天 / 336 小時）`)
      console.log(`   → 這表示「記住我」功能沒有正常執行`)
      console.log(`\n🔧 可能的原因:`)
      console.log(`   1. rememberMe 參數沒有正確傳遞到後端`)
      console.log(`   2. session.cookie.maxAge 設定沒有生效`)
      console.log(`   3. session.cookie.expires 沒有同步設定`)
      console.log(`   4. server.js 的預設值覆蓋了動態設定`)
    } else if (hasRememberMe) {
      console.log(`\n✅ 找到「記住我」的 session，功能正常`)
    }

    if (hasShortSession) {
      console.log(`\n✓ 找到短期 session (2小時)，這是正常的「不記住我」登入`)
    }

    console.log('\n' + '='.repeat(70))
    console.log('\n💡 測試建議:\n')
    console.log('1. 清空現有 sessions:')
    console.log('   db.sessions.deleteMany({})')
    console.log('\n2. 測試「勾選」記住我:')
    console.log('   → 登入時勾選「保持登入」')
    console.log('   → 應該看到 336 小時 (14天) 的 session')
    console.log('\n3. 測試「不勾選」記住我:')
    console.log('   → 登入時不勾選「保持登入」')
    console.log('   → 應該看到 2 小時的 session')
    console.log('\n4. 重新執行此腳本驗證:')
    console.log('   node testSessions.js')
    console.log('')

    await mongoose.disconnect()
    console.log('✅ 已斷開連接\n')
  } catch (error) {
    console.error('❌ 錯誤:', error)
    process.exit(1)
  }
}

testSessions()
