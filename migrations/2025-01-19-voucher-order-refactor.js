/**
 * 數據遷移腳本：重構 Order、BundleInstance、VoucherInstance 關聯
 *
 * 變更內容：
 * 1. 移除 Order.items.generatedVouchers
 * 2. 移除 BundleInstance.bundleItems.voucherTemplate（保留其他欄位）
 * 3. 移除 VoucherInstance.order
 * 4. 新增 VoucherInstance.createdBy
 *
 * 執行前建議：
 * 1. 備份資料庫
 * 2. 在測試環境先執行
 * 3. 確認應用程式已更新至新版本
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

// 連接資料庫的配置
const MONGODB_URI = process.env.MongoDB_url || 'mongodb://localhost:27017/your-database'

/**
 * 連接資料庫
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ 資料庫連接成功')
  } catch (error) {
    console.error('❌ 資料庫連接失敗:', error)
    process.exit(1)
  }
}

/**
 * 主要遷移函數
 */
async function migrate() {
  try {
    console.log('🚀 開始數據遷移...')

    await connectDB()

    // 執行遷移步驟
    await step1_createVoucherBundleRelations()
    await step2_verifyMigration()
    await step3_removeOldFields()

    console.log('🎉 數據遷移完成！')
  } catch (error) {
    console.error('❌ 遷移失敗:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('📴 資料庫連接已關閉')
  }
}

/**
 * 步驟1：建立 VoucherInstance 與 BundleInstance 的關聯
 */
async function step1_createVoucherBundleRelations() {
  console.log('\n📝 步驟1：建立 VoucherInstance 與 BundleInstance 的關聯')

  const db = mongoose.connection.db
  const ordersCollection = db.collection('orders')
  const voucherInstancesCollection = db.collection('voucherinstances')

  let processedCount = 0
  let successCount = 0
  let errorCount = 0
  let totalUpdatedVouchers = 0

  // 分批處理訂單，避免記憶體問題
  const batchSize = 100
  let skip = 0

  while (true) {
    // 查詢有 Bundle 項目且有 generatedVouchers 的訂單
    const orders = await ordersCollection
      .find({
        'items.itemType': 'bundle',
        'items.generatedVouchers.0': { $exists: true },
      })
      .skip(skip)
      .limit(batchSize)
      .toArray()

    if (orders.length === 0) {
      break
    }

    console.log(`處理批次 ${Math.floor(skip / batchSize) + 1}，訂單數量：${orders.length}`)

    for (const order of orders) {
      try {
        processedCount++

        for (const item of order.items) {
          if (
            item.itemType === 'bundle' &&
            item.generatedVouchers &&
            item.generatedVouchers.length > 0 &&
            item.bundleInstance // 確保有 bundleInstance
          ) {
            // 檢查 generatedVouchers 是否為有效的 ObjectId 陣列
            const validVoucherIds = item.generatedVouchers.filter((id) => {
              try {
                return mongoose.Types.ObjectId.isValid(id)
              } catch {
                return false
              }
            })

            if (validVoucherIds.length === 0) {
              console.log(`  ⚠️ 訂單 ${order._id}：沒有有效的 generatedVouchers ID`)
              continue
            }

            // 檢查 bundleInstance 是否為有效的 ObjectId
            if (!mongoose.Types.ObjectId.isValid(item.bundleInstance)) {
              console.log(`  ⚠️ 訂單 ${order._id}：bundleInstance ID 無效`)
              continue
            }

            // 更新相關的 VoucherInstance
            const updateResult = await voucherInstancesCollection.updateMany(
              {
                _id: { $in: validVoucherIds.map((id) => new mongoose.Types.ObjectId(id)) },
                order: new mongoose.Types.ObjectId(order._id), // 確保是這個訂單的券
              },
              {
                $set: {
                  createdBy: new mongoose.Types.ObjectId(item.bundleInstance),
                },
              },
            )

            totalUpdatedVouchers += updateResult.modifiedCount
            console.log(`  📋 訂單 ${order._id}：更新了 ${updateResult.modifiedCount} 個兌換券`)
          }
        }

        successCount++
      } catch (error) {
        errorCount++
        console.error(`  ❌ 處理訂單 ${order._id} 失敗:`, error.message)
        console.error(`  詳細錯誤:`, error)
      }
    }

    skip += batchSize
  }

  console.log(
    `✅ 步驟1完成：處理了 ${processedCount} 個訂單，成功 ${successCount} 個，失敗 ${errorCount} 個`,
  )
  console.log(`📊 總共更新了 ${totalUpdatedVouchers} 個 VoucherInstance`)
}

/**
 * 步驟2：驗證遷移結果
 */
async function step2_verifyMigration() {
  console.log('\n🔍 步驟2：驗證遷移結果')

  const db = mongoose.connection.db
  const ordersCollection = db.collection('orders')
  const bundleInstancesCollection = db.collection('bundleinstances')
  const voucherInstancesCollection = db.collection('voucherinstances')

  // 統計有 createdBy 的 VoucherInstance
  const vouchersWithBundle = await voucherInstancesCollection.countDocuments({
    createdBy: { $exists: true, $ne: null },
  })

  // 統計總的 VoucherInstance
  const totalVouchers = await voucherInstancesCollection.countDocuments()

  // 統計有 order 關聯的 VoucherInstance
  const vouchersWithOrder = await voucherInstancesCollection.countDocuments({
    order: { $exists: true, $ne: null },
  })

  // 統計有 bundleItems.voucherTemplate 的 BundleInstance
  const bundleInstancesWithVoucherTemplate = await bundleInstancesCollection.countDocuments({
    'bundleItems.voucherTemplate': { $exists: true },
  })

  console.log(`📊 驗證結果：`)
  console.log(`  - 總兌換券數量：${totalVouchers}`)
  console.log(`  - 有 bundleInstance 關聯的兌換券：${vouchersWithBundle}`)
  console.log(`  - 仍有 order 關聯的兌換券：${vouchersWithOrder}`)
  console.log(`  - 仍有 voucherTemplate 的 BundleInstance：${bundleInstancesWithVoucherTemplate}`)

  // 檢查是否有遺漏的
  const ordersWithGeneratedVouchers = await ordersCollection.countDocuments({
    'items.generatedVouchers.0': { $exists: true },
  })

  console.log(`  - 仍有 generatedVouchers 的訂單：${ordersWithGeneratedVouchers}`)

  if (vouchersWithBundle === 0) {
    console.warn('⚠️  警告：沒有任何兌換券建立了 bundleInstance 關聯')
  } else {
    console.log('✅ 驗證通過：已成功建立新的關聯')
  }
}

/**
 * 步驟3：移除舊欄位（謹慎操作）
 */
async function step3_removeOldFields() {
  console.log('\n🗑️  步驟3：移除舊欄位')

  const db = mongoose.connection.db
  const ordersCollection = db.collection('orders')
  const bundleInstancesCollection = db.collection('bundleinstances')
  const voucherInstancesCollection = db.collection('voucherinstances')

  console.log('⚠️  注意：即將移除舊欄位，請確認新的關聯已正確建立')

  // 移除 Order.items.generatedVouchers - 使用正確的語法
  let orderUpdateCount = 0
  const ordersWithGeneratedVouchers = await ordersCollection
    .find({
      'items.generatedVouchers': { $exists: true },
    })
    .toArray()

  for (const order of ordersWithGeneratedVouchers) {
    // 遍歷每個 item，移除 generatedVouchers 欄位
    const updatedItems = order.items.map((item) => {
      const { generatedVouchers, ...itemWithoutGeneratedVouchers } = item
      return itemWithoutGeneratedVouchers
    })

    await ordersCollection.updateOne({ _id: order._id }, { $set: { items: updatedItems } })
    orderUpdateCount++
  }
  console.log(`📋 移除了 ${orderUpdateCount} 個訂單的 generatedVouchers 欄位`)

  // 移除 BundleInstance.bundleItems.voucherTemplate（保留其他欄位）
  let bundleUpdateCount = 0
  const bundlesWithVoucherTemplate = await bundleInstancesCollection
    .find({
      'bundleItems.voucherTemplate': { $exists: true },
    })
    .toArray()

  for (const bundle of bundlesWithVoucherTemplate) {
    // 遍歷每個 bundleItem，移除 voucherTemplate 欄位
    const updatedBundleItems = bundle.bundleItems.map((item) => {
      const { voucherTemplate, ...itemWithoutVoucherTemplate } = item
      return itemWithoutVoucherTemplate
    })

    await bundleInstancesCollection.updateOne(
      { _id: bundle._id },
      { $set: { bundleItems: updatedBundleItems } },
    )
    bundleUpdateCount++
  }
  console.log(`📦 移除了 ${bundleUpdateCount} 個 BundleInstance 的 voucherTemplate 引用`)

  // 移除 VoucherInstance.order
  const voucherUpdateResult = await voucherInstancesCollection.updateMany(
    { order: { $exists: true } },
    { $unset: { order: '' } },
  )
  console.log(`🎫 移除了 ${voucherUpdateResult.modifiedCount} 個 VoucherInstance 的 order 欄位`)

  console.log('✅ 步驟3完成：舊欄位已移除')
}

/**
 * 回滾函數（緊急情況使用）
 */
async function rollback() {
  console.log('🔄 開始回滾操作...')

  try {
    await connectDB()

    const db = mongoose.connection.db
    const voucherInstancesCollection = db.collection('voucherinstances')

    // 這裡只能回滾部分操作，因為舊欄位資料已被移除
    // 主要是移除新增的 createdBy 欄位
    const result = await voucherInstancesCollection.updateMany(
      { createdBy: { $exists: true } },
      { $unset: { createdBy: '' } },
    )

    console.log(`🔄 回滾完成：移除了 ${result.modifiedCount} 個 VoucherInstance 的 createdBy 欄位`)
  } catch (error) {
    console.error('❌ 回滾失敗:', error)
    throw error
  } finally {
    await mongoose.disconnect()
  }
}

/**
 * 乾跑模式（只檢查，不修改）
 */
async function dryRun() {
  console.log('🧪 乾跑模式：只檢查，不進行實際修改')
  console.log('📊 正在連接資料庫...')

  try {
    await connectDB()

    const db = mongoose.connection.db
    const ordersCollection = db.collection('orders')
    const bundleInstancesCollection = db.collection('bundleinstances')
    const voucherInstancesCollection = db.collection('voucherinstances')

    console.log('🔍 開始檢查資料...')

    // 先檢查集合是否存在
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)
    console.log('📋 資料庫中的集合：', collectionNames)

    // 檢查需要遷移的資料量
    const ordersWithBundles = await ordersCollection.countDocuments({
      'items.itemType': 'bundle',
      'items.generatedVouchers.0': { $exists: true },
    })

    const bundlesWithVoucherTemplate = await bundleInstancesCollection.countDocuments({
      'bundleItems.voucherTemplate': { $exists: true },
    })

    const vouchersWithOrder = await voucherInstancesCollection.countDocuments({
      order: { $exists: true },
    })

    const vouchersWithCreatedBy = await voucherInstancesCollection.countDocuments({
      createdBy: { $exists: true },
    })

    // 額外檢查：看看實際的資料結構
    const sampleOrder = await ordersCollection.findOne({
      'items.itemType': 'bundle',
    })
    console.log(
      '📋 訂單資料範例：',
      sampleOrder
        ? {
            _id: sampleOrder._id,
            itemsCount: sampleOrder.items?.length || 0,
            hasBundle: sampleOrder.items?.some((item) => item.itemType === 'bundle') || false,
            bundleItemsWithVouchers:
              sampleOrder.items?.filter(
                (item) => item.itemType === 'bundle' && item.generatedVouchers?.length > 0,
              ).length || 0,
          }
        : '沒有找到包含 bundle 的訂單',
    )

    // 檢查一個具體的 bundle item 結構
    const orderWithBundleAndVouchers = await ordersCollection.findOne({
      'items.itemType': 'bundle',
      'items.generatedVouchers.0': { $exists: true },
    })

    if (orderWithBundleAndVouchers) {
      const bundleItem = orderWithBundleAndVouchers.items.find(
        (item) => item.itemType === 'bundle' && item.generatedVouchers?.length > 0,
      )
      console.log('📦 Bundle Item 結構範例：', {
        itemType: bundleItem.itemType,
        hasBundleInstance: !!bundleItem.bundleInstance,
        bundleInstanceId: bundleItem.bundleInstance,
        generatedVouchersCount: bundleItem.generatedVouchers?.length || 0,
        generatedVouchersIds: bundleItem.generatedVouchers?.slice(0, 2) || [], // 只顯示前兩個
      })
    }

    const sampleVoucher = await voucherInstancesCollection.findOne({})
    console.log(
      '🎫 VoucherInstance 資料範例：',
      sampleVoucher
        ? {
            _id: sampleVoucher._id,
            hasOrder: 'order' in sampleVoucher,
            hasCreatedBy: 'createdBy' in sampleVoucher,
            orderId: sampleVoucher.order,
            createdById: sampleVoucher.createdBy,
          }
        : '沒有找到 VoucherInstance',
    )

    const sampleBundle = await bundleInstancesCollection.findOne({
      'bundleItems.voucherTemplate': { $exists: true },
    })
    console.log(
      '📦 BundleInstance 資料範例：',
      sampleBundle
        ? {
            _id: sampleBundle._id,
            bundleItemsCount: sampleBundle.bundleItems?.length || 0,
            itemsWithVoucherTemplate:
              sampleBundle.bundleItems?.filter((item) => item.voucherTemplate).length || 0,
          }
        : '沒有找到包含 voucherTemplate 的 BundleInstance',
    )

    console.log('📊 遷移影響範圍：')
    console.log(`  - 需要處理的訂單：${ordersWithBundles}`)
    console.log(`  - 需要移除 voucherTemplate 引用的 BundleInstance：${bundlesWithVoucherTemplate}`)
    console.log(`  - 需要移除 order 欄位的 VoucherInstance：${vouchersWithOrder}`)
    console.log(`  - 已有 createdBy 欄位的 VoucherInstance：${vouchersWithCreatedBy}`)

    console.log('✅ 乾跑檢查完成')
  } catch (error) {
    console.error('❌ 乾跑檢查失敗:', error)
    throw error
  } finally {
    console.log('📴 關閉資料庫連接...')
    await mongoose.disconnect()
    console.log('📴 資料庫連接已關閉')
  }
}

// 主程式入口
async function main() {
  console.log('🚀 程式開始執行...')

  const args = process.argv.slice(2)
  const command = args[0]

  console.log(`📝 接收到的命令: ${command}`)
  console.log(`📝 所有參數: ${JSON.stringify(args)}`)

  switch (command) {
    case 'dry-run':
      console.log('🧪 開始乾跑模式...')
      await dryRun()
      break
    case 'migrate':
      console.log('🚀 開始執行遷移...')
      await migrate()
      break
    case 'rollback':
      console.log('🔄 開始回滾操作...')
      await rollback()
      break
    default:
      console.log('❌ 未知命令或缺少命令')
      console.log('使用方法:')
      console.log('  node 2025-01-19-voucher-order-refactor.js dry-run   # 乾跑檢查')
      console.log('  node 2025-01-19-voucher-order-refactor.js migrate   # 執行遷移')
      console.log('  node 2025-01-19-voucher-order-refactor.js rollback  # 回滾操作')
      process.exit(1)
  }

  console.log('✅ 程式執行完成')
}

// 執行主程式
if (process.argv[1].endsWith('2025-01-19-voucher-order-refactor.js')) {
  console.log('✅ 條件滿足，開始執行 main 函數...')
  main().catch((error) => {
    console.error('💥 程式執行失敗:', error)
    console.error('💥 錯誤堆疊:', error.stack)
    process.exit(1)
  })
} else {
  console.log('❌ 執行條件不滿足，腳本未啟動')
  console.log(`預期檔名包含: 2025-01-19-voucher-order-refactor.js`)
  console.log(`實際檔名: ${process.argv[1]}`)
}

export { migrate, rollback, dryRun }
