<template>
  <div>
    <!-- 固定導航欄 -->
    <div class="nav-container">
      <div class="nav-wrapper autohide" ref="navWrapper">
        <nav class="navbar navbar-expand-lg navbar-light">
          <div class="container-fluid">
            <a class="navbar-brand" href="#" style="font-weight: bold">
              {{ storeName }}
            </a>
            <div class="nav-icons">
              <template v-if="isLoggedIn">
                <div class="dropdown">
                  <button
                    class="btn nav-icon dropdown-toggle user-dropdown-btn"
                    type="button"
                    id="userMenuDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i class="bi bi-person-circle me-1"></i>
                    <span class="login-text">{{ customerName }}</span>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuDropdown">
                    <li><a class="dropdown-item" href="/member">會員專區</a></li>
                    <li>
                      <hr class="dropdown-divider" />
                    </li>
                    <li>
                      <a class="dropdown-item text-danger" href="#" @click.prevent="$emit('logout')"
                        >登出</a
                      >
                    </li>
                  </ul>
                </div>
              </template>
              <a v-else class="nav-icon" href="#" @click.prevent="$emit('login')">
                <i class="bi bi-person-circle"></i>
                <span class="login-text">登入</span>
              </a>
            </div>
          </div>
        </nav>
        <div class="nav-border"></div>
      </div>
    </div>

    <!-- 店家主圖 -->
    <div class="banner-container">
      <div class="content-wrapper p-0">
        <div class="store-banner">
          <img
            :src="storeImage && storeImage.url ? storeImage.url : ''"
            :alt="storeImage && storeImage.alt ? storeImage.alt : '店家圖片'"
            class="banner-img"
          />
          <div class="banner-overlay"></div>
          <div class="banner-content">
            <h1 class="banner-title">{{ storeName }}</h1>
            <br />
          </div>
        </div>
      </div>
    </div>

    <!-- 店家資訊 -->
    <div class="store-info-container">
      <div class="content-wrapper">
        <div class="store-info-card">
          <div class="store-info-item">
            <i class="bi bi-clock info-icon"></i>
            <div v-if="businessHours && businessHours.length > 0">
              <h6 class="mb-1">營業時間</h6>
              <p class="mb-0" v-for="(hours, index) in formattedBusinessHours" :key="index">
                {{ hours }}
              </p>
            </div>
          </div>
          <div class="divider-vertical"></div>
          <div class="store-info-item">
            <i class="bi bi-geo-alt location-icon"></i>
            <div>
              <h6 class="mb-1">地點</h6>
              <p class="mb-0">{{ storeName }}</p>
              <p v-if="storeAddress" class="mb-0 small text-muted">{{ storeAddress }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 公告區塊 -->
    <div v-if="announcements && announcements.length > 0" class="announcement-container">
      <div class="content-wrapper">
        <div class="section-header">
          <i class="bi bi-megaphone-fill me-2 announcement-icon"></i>
          <h3 class="fw-bold mb-0">最新公告</h3>
        </div>
        <div class="announcement-list">
          <div
            v-for="(announcement, index) in announcements"
            :key="index"
            class="announcement-card"
          >
            <h5 class="announcement-title">{{ announcement.title }}</h5>
            <p class="announcement-content">{{ announcement.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  storeName: {
    type: String,
    required: true,
    default: '',
  },
  storeImage: {
    type: Object,
    default: () => null,
  },
  announcements: {
    type: Array,
    default: () => [],
  },
  isLoggedIn: {
    type: Boolean,
    default: false,
  },
  customerName: {
    type: String,
    default: '',
  },
  businessHours: {
    type: Array,
    default: () => [],
  },
  storeAddress: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['login', 'logout', 'account'])
const router = useRouter()
const navWrapper = ref(null)

// 格式化營業時間為易讀格式
const formattedBusinessHours = computed(() => {
  if (!props.businessHours || props.businessHours.length === 0) {
    return []
  }

  const daysOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

  return props.businessHours.map((hours) => {
    const day = daysOfWeek[hours.day]

    if (hours.isClosed) {
      return `${day}: 公休`
    }

    // 處理多個營業時段
    const periodsText = hours.periods
      .map((period) => {
        const openTime = formatTime(period.open)
        const closeTime = formatTime(period.close)
        return `${openTime} ~ ${closeTime}`
      })
      .join(', ')

    return `${day}: ${periodsText}`
  })
})

// 將時間格式化為 HH:MM
const formatTime = (timeString) => {
  try {
    if (!timeString) return '未設定'

    // 如果是完整的日期時間字符串，只取時間部分
    if (timeString.includes('T')) {
      const date = new Date(timeString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // 如果只是時間字符串 (HH:MM:SS)
    if (timeString.includes(':')) {
      const parts = timeString.split(':')
      return `${parts[0]}:${parts[1]}`
    }

    return timeString
  } catch (error) {
    console.error('時間格式化錯誤:', error)
    return timeString
  }
}

// 監聽 scroll 事件控制導航欄顯示/隱藏
const initNavbarScrollBehavior = () => {
  const navbar = navWrapper.value
  if (!navbar) return

  const navbarHeight = navbar.querySelector('.navbar').offsetHeight

  // 為內容容器添加上邊距，避免被導航欄覆蓋
  const contentWrappers = document.querySelectorAll('.content-wrapper')
  contentWrappers.forEach((wrapper) => {
    if (wrapper.style.paddingTop === '') {
      wrapper.style.paddingTop = `${navbarHeight}px`
    }
  })

  let lastScrollTop = 0

  const handleScroll = () => {
    const scrollTop = window.scrollY

    if (scrollTop > navbarHeight) {
      if (scrollTop < lastScrollTop) {
        // 向上滾動，顯示導航欄
        navbar.classList.remove('scrolled-down')
        navbar.classList.add('scrolled-up')
      } else {
        // 向下滾動，隱藏導航欄
        navbar.classList.remove('scrolled-up')
        navbar.classList.add('scrolled-down')
      }
    }

    lastScrollTop = scrollTop
  }

  window.addEventListener('scroll', handleScroll)

  // 返回清除事件函數
  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
}

onMounted(() => {
  // 初始化導航欄滾動行為
  const cleanupFunction = initNavbarScrollBehavior()

  // 初始化 Bootstrap 的 dropdown 功能
  import('bootstrap/js/dist/dropdown').then((module) => {
    const Dropdown = module.default
    // 獲取所有的 dropdown toggler 並初始化
    const dropdownElementList = document.querySelectorAll('.dropdown-toggle')
    dropdownElementList.forEach((dropdownToggleEl) => {
      new Dropdown(dropdownToggleEl)
    })
  })

  // 清理函數
  onUnmounted(() => {
    if (typeof cleanupFunction === 'function') {
      cleanupFunction()
    }
  })
})
</script>

<style scoped>

/* 導航欄樣式 */
.nav-container {
  position: fixed;
  top: 0;
  width: 100%;
  max-width: 736px;
  z-index: 1030;
  left: 50%;
  transform: translateX(-50%);
}

.nav-wrapper {
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
}

.navbar {
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 0;
  padding: 0.8rem 1rem;
}

.navbar-brand {
  font-size: 1.3rem;
  color: var(--primary-color) !important;
  font-weight: 700 !important;
}

.brand-icon {
  color: #d21313;
}

.nav-icons {
  display: flex;
  align-items: center;
}

.nav-icon {
  color: var(--text-color);
  font-size: 1.2rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  background-color: #f8f9fa;
  transition: all 0.2s ease;
}

.nav-icon:hover {
  background-color: var(--primary-color);
  color: white;
}

/* 移除用戶下拉選單按鈕的 hover 效果 */
.user-dropdown-btn:hover {
  background-color: #f8f9fa;
  color: var(--text-color);
}

.login-text {
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-border {
  height: 3px;
  background: linear-gradient(to right, var(--primary-color), var(--accent-color));
  width: 100%;
}

.scrolled-down {
  transform: translateY(-100%);
}

.scrolled-up {
  transform: translateY(0);
}

/* 店家主圖橫幅 */
.banner-container {
  margin-top: 60px;
}

.store-banner {
  position: relative;
  width: 100%;
  height: 280px;
  overflow: hidden;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6));
}

.banner-content {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  color: white;
}

.banner-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 5px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.banner-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  font-weight: 500;
}

/* 店家信息卡片 */
.store-info-container {
  margin-top: -30px;
  padding-bottom: 1rem;
}

.store-info-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin: 0 0.5rem;
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
}

.store-info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
}

.store-info-item i {
  font-size: 1.5rem;
  margin-top: 0.2rem;
}

.info-icon {
  color: #007bff;
}

.location-icon {
  color: #dc3545;
}

.divider-vertical {
  width: 1px;
  align-self: stretch;
  background-color: #dee2e6;
}

/* 公告樣式 */
.announcement-container {
  padding: 2rem 0;
  background-color: #f8f9fa;
}

.announcement-icon {
  color: #ffc107;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--accent-color);
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.announcement-card {
  background-color: white;
  border-radius: 10px;
  padding: 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid var(--accent-color);
}

.announcement-title {
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.announcement-content {
  color: var(--text-color);
  margin-bottom: 0;
  font-size: 0.95rem;
}

.content-wrapper {
  width: 100%;
  padding: 0 15px;
}

/* 響應式調整 */
@media (max-width: 576px) {
  .store-banner {
    height: 220px;
  }

  .banner-title {
    font-size: 1.7rem;
  }

  .store-info-card {
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .divider-vertical {
    width: 100%;
    height: 1px;
    margin: 0.5rem 0;
  }
}
</style>
