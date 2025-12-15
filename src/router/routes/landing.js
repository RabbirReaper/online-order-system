export const landingRoutes = [
  // 根路徑重定向到首頁
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'landing-home',
    component: () => import('@/views/landing/LandingPage.vue'),
    meta: {
      title: '光兔點餐 - 專業餐飲管理系統',
      description:
        '提供完整的餐飲管理系統，包含會員積點、預購券、多店管理等功能。僅收取營業額0.3%，助您提升營運效率。',
      keywords: '光兔點餐,餐飲管理系統,POS系統,會員管理,預購券,點餐系統,餐廳管理',
      robots: 'index, follow', // 允許搜尋引擎索引
      ogType: 'website',
      ogSiteName: '光兔點餐',
    },
  },
  // 預留其他頁面路由
  {
    path: '/about',
    name: 'landing-about',
    component: () => import('@/views/landing/AboutPage.vue'),
    meta: {
      title: '關於我們 - 光兔點餐',
      description: '了解我們的團隊、使命與願景，以及我們如何協助餐飲業者數位轉型。',
      robots: 'index, follow',
    },
  },
  {
    path: '/features',
    name: 'landing-features',
    component: () => import('@/views/landing/FeaturesPage.vue'),
    meta: {
      title: '產品功能 - 光兔點餐',
      description: '詳細了解我們的核心功能：會員積點系統、預購券機制、多層級管理等創新功能。',
      robots: 'index, follow',
    },
  },
  {
    path: '/pricing',
    name: 'landing-pricing',
    component: () => import('@/views/landing/PricingPage.vue'),
    meta: {
      title: '收費方案 - 光兔點餐',
      description: '透明的收費制度，僅收取營業額0.3%，無隱藏費用，與您共同成長。',
      robots: 'index, follow',
    },
  },
  {
    path: '/contact',
    name: 'landing-contact',
    component: () => import('@/views/landing/ContactPage.vue'),
    meta: {
      title: '聯絡我們 - 光兔點餐',
      description: '聯絡我們的專業團隊，獲得個人化的餐飲管理解決方案。',
      robots: 'index, follow',
    },
  },
]
