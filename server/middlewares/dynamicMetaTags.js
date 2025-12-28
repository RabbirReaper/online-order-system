import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Store from '../models/Store/Store.js'
import Brand from '../models/Brand/Brand.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 動態注入 Meta Tags 中間件
 * 為店家頁面提供動態的 title 和 Open Graph tags
 * 使分享到 LINE、Facebook 等平台時顯示正確的店家名稱
 */
export const dynamicMetaTags = async (req, res, next) => {
  try {
    // 檢查是否為店家頁面路徑
    const storePathMatch = req.path.match(/^\/stores\/([^/]+)\/([^/]+)/)

    if (!storePathMatch) {
      // 不是店家頁面，繼續正常流程
      return next()
    }

    const [, brandId, storeId] = storePathMatch

    // 查詢店家資料（利用 brand 索引提高效率，同時驗證 brandId）
    const store = await Store.findOne({ _id: storeId, brand: brandId }).populate('brand').lean()

    if (!store) {
      // 店家不存在，繼續正常流程（會顯示預設標題）
      return next()
    }

    // 讀取原始 HTML
    const htmlPath = path.resolve(__dirname, '../../dist/index.html')
    let html = fs.readFileSync(htmlPath, 'utf-8')

    // 準備動態內容
    const storeName = store.name
    const brandName = store.brand?.name || '光兔點餐'
    const title = `${storeName}`
    const description = `立即查看菜單並線上點餐。`
    const imageUrl = store.image?.url || ''

    // 取得完整 URL (用於 Open Graph)
    const protocol = req.protocol
    const host = req.get('host')
    const fullUrl = `${protocol}://${host}${req.originalUrl}`

    // 動態替換 title
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)

    // 注入 Open Graph meta tags（在 </head> 之前插入）
    const metaTags = `
    <!-- Open Graph / 社交媒體分享 -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    ${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ''}
    <meta property="og:site_name" content="${brandName}" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}" />` : ''}

    <!-- 基本 SEO -->
    <meta name="description" content="${description}" />
  `

    html = html.replace('</head>', `${metaTags}</head>`)

    // 發送修改後的 HTML
    res.send(html)
  } catch (error) {
    console.error('Dynamic meta tags error:', error)
    // 發生錯誤時繼續正常流程
    next()
  }
}
