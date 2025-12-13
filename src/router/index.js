// router/index.js - 簡化的 scrollBehavior 配置

import { createRouter, createWebHistory } from 'vue-router'
import { globalBeforeEach } from './guards.js'

// 導入各個路由模組
import { adminRoutes } from './routes/admin.js'
import { bossRoutes } from './routes/boss.js'
import { brandAdminRoutes } from './routes/brandAdmin.js'
import { customerRoutes } from './routes/customer.js'
import { authRoutes } from './routes/auth.js'
import { memberRoutes } from './routes/member.js'
import { commonRoutes } from './routes/common.js'
import { landingRoutes } from './routes/landing.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...adminRoutes,
    ...bossRoutes,
    ...brandAdminRoutes,
    ...customerRoutes,
    ...authRoutes,
    ...memberRoutes,
    ...commonRoutes,
    ...landingRoutes,
  ],

  // 簡化的滾動行為 - 依賴瀏覽器自動機制
  scrollBehavior(to, from, savedPosition) {
    // 開發環境調試信息

    // 1. 優先使用瀏覽器提供的 savedPosition
    if (savedPosition) {
      return savedPosition
    }

    // 2. MenuView 使用 KeepAlive，完全依賴瀏覽器處理
    if (to.name === 'menu') {
      if (from.name === 'dish-detail' || from.name === 'bundle-detail') {
        // 從詳情頁返回菜單頁 - 讓瀏覽器自動處理
        return false // 不執行路由級別的滾動控制
      } else {
        return { top: 0 }
      }
    }

    // 3. 進入詳情頁 - 滾動到頂部
    if (to.name === 'dish-detail' || to.name === 'bundle-detail') {
      return { top: 0 }
    }

    return { top: 0 }
  },
})

// 全局前置守衛
router.beforeEach(globalBeforeEach)

// 全局後置守衛 - 動態更新 meta tags
router.afterEach((to) => {
  const { title, description, keywords, robots, ogType, ogSiteName } = to.meta

  // 更新頁面標題
  if (title) {
    document.title = title
  } else {
    document.title = '光兔點餐'
  }

  // 更新或移除 description meta
  const descriptionMeta = document.querySelector('meta[name="description"]')
  if (description) {
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', description)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = description
      document.head.appendChild(meta)
    }
  } else if (descriptionMeta) {
    descriptionMeta.remove()
  }

  // 更新或移除 keywords meta
  const keywordsMeta = document.querySelector('meta[name="keywords"]')
  if (keywords) {
    if (keywordsMeta) {
      keywordsMeta.setAttribute('content', keywords)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'keywords'
      meta.content = keywords
      document.head.appendChild(meta)
    }
  } else if (keywordsMeta) {
    keywordsMeta.remove()
  }

  // 更新 robots meta
  const robotsMeta = document.querySelector('meta[name="robots"]')
  if (robots) {
    if (robotsMeta) {
      robotsMeta.setAttribute('content', robots)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'robots'
      meta.content = robots
      document.head.appendChild(meta)
    }
  } else if (robotsMeta) {
    robotsMeta.remove()
  }

  // 更新 Open Graph meta tags
  const ogTitleMeta = document.querySelector('meta[property="og:title"]')
  if (title) {
    if (ogTitleMeta) {
      ogTitleMeta.setAttribute('content', title)
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:title')
      meta.content = title
      document.head.appendChild(meta)
    }
  } else if (ogTitleMeta) {
    ogTitleMeta.remove()
  }

  const ogDescMeta = document.querySelector('meta[property="og:description"]')
  if (description) {
    if (ogDescMeta) {
      ogDescMeta.setAttribute('content', description)
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:description')
      meta.content = description
      document.head.appendChild(meta)
    }
  } else if (ogDescMeta) {
    ogDescMeta.remove()
  }

  const ogTypeMeta = document.querySelector('meta[property="og:type"]')
  if (ogType) {
    if (ogTypeMeta) {
      ogTypeMeta.setAttribute('content', ogType)
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:type')
      meta.content = ogType
      document.head.appendChild(meta)
    }
  } else if (ogTypeMeta) {
    ogTypeMeta.remove()
  }

  const ogSiteNameMeta = document.querySelector('meta[property="og:site_name"]')
  if (ogSiteName) {
    if (ogSiteNameMeta) {
      ogSiteNameMeta.setAttribute('content', ogSiteName)
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:site_name')
      meta.content = ogSiteName
      document.head.appendChild(meta)
    }
  } else if (ogSiteNameMeta) {
    ogSiteNameMeta.remove()
  }

  const ogLocaleMeta = document.querySelector('meta[property="og:locale"]')
  if (description) {
    // 只在有 SEO 資訊的頁面顯示
    if (!ogLocaleMeta) {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:locale')
      meta.content = 'zh_TW'
      document.head.appendChild(meta)
    }
  } else if (ogLocaleMeta) {
    ogLocaleMeta.remove()
  }

  // 更新 Twitter Card meta tags
  const twitterCardMeta = document.querySelector('meta[name="twitter:card"]')
  if (description) {
    // 只在有 SEO 資訊的頁面顯示
    if (!twitterCardMeta) {
      const meta = document.createElement('meta')
      meta.name = 'twitter:card'
      meta.content = 'summary'
      document.head.appendChild(meta)
    }
  } else if (twitterCardMeta) {
    twitterCardMeta.remove()
  }

  const twitterTitleMeta = document.querySelector('meta[name="twitter:title"]')
  if (title) {
    if (twitterTitleMeta) {
      twitterTitleMeta.setAttribute('content', title)
    } else if (description) {
      // 只在有 SEO 資訊的頁面創建
      const meta = document.createElement('meta')
      meta.name = 'twitter:title'
      meta.content = title
      document.head.appendChild(meta)
    }
  } else if (twitterTitleMeta) {
    twitterTitleMeta.remove()
  }

  const twitterDescMeta = document.querySelector('meta[name="twitter:description"]')
  if (description) {
    if (twitterDescMeta) {
      twitterDescMeta.setAttribute('content', description)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'twitter:description'
      meta.content = description
      document.head.appendChild(meta)
    }
  } else if (twitterDescMeta) {
    twitterDescMeta.remove()
  }
})

export default router
