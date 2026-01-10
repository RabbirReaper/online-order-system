<template>
  <nav class="navbar navbar-expand-lg navbar-dark fixed-top">
    <div class="container">
      <!-- Brand -->
      <router-link class="navbar-brand" to="/home">
        <i class="bi bi-shop me-2"></i>
        光速點餐
      </router-link>

      <!-- Mobile toggle button -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Navbar content -->
      <div class="collapse navbar-collapse" id="navbarNav">
        <!-- Main navigation links -->
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/home" active-class="active">
              {{ $t('nav.home') }}
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/features" active-class="active">
              {{ $t('nav.features') }}
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/pricing" active-class="active">
              {{ $t('nav.pricing') }}
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/about" active-class="active">
              {{ $t('nav.about') }}
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/contact" active-class="active">
              {{ $t('nav.contact') }}
            </router-link>
          </li>
        </ul>

        <!-- Language switcher -->
        <div class="navbar-nav">
          <div class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle language-switcher"
              href="#"
              id="languageDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span class="language-flag">{{ currentLanguageInfo.flag }}</span>
              <span class="language-name d-none d-lg-inline">{{ currentLanguageInfo.name }}</span>
            </a>
            <ul
              class="dropdown-menu dropdown-menu-end language-menu"
              aria-labelledby="languageDropdown"
            >
              <li v-for="language in availableLanguages" :key="language.code">
                <a
                  class="dropdown-item language-option"
                  href="#"
                  @click.prevent="switchLanguage(language.code)"
                  :class="{ active: currentLanguage === language.code }"
                >
                  <span class="language-flag">{{ language.flag }}</span>
                  <span class="language-name">{{ language.name }}</span>
                  <i v-if="currentLanguage === language.code" class="bi bi-check ms-auto"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useLanguage } from '@/composables/useLanguage'
import { onMounted, nextTick } from 'vue'

const { currentLanguage, currentLanguageInfo, availableLanguages, switchLanguage } = useLanguage()
// 動態載入 Bootstrap JavaScript
const loadBootstrapJS = () => {
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js'
  script.onload = () => {
    initializeAccordion()
  }
  document.head.appendChild(script)
}

// 初始化 accordion
const initializeAccordion = () => {
  // 確保所有 accordion 元素都已正確初始化
  const accordionElements = document.querySelectorAll('.accordion')
}

onMounted(async () => {
  // 確保語言切換器在組件掛載後正確初始化
  await nextTick()
  // 檢查 Bootstrap 是否已載入
  if (typeof window.bootstrap === 'undefined') {
    // 如果需要，可以動態載入 Bootstrap
    loadBootstrapJS()
  } else {
    // 手動初始化 accordion（可選）
    initializeAccordion()
  }
})
</script>

<style scoped>
.navbar {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(45, 52, 54, 0.08);
  backdrop-filter: none;
  border-bottom: 1px solid #e9ecef;
  padding: 0.75rem 0;
  z-index: 1000;
}

.navbar-brand {
  font-weight: 700;
  font-size: 1.25rem;
  color: #2d3436 !important;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.navbar-brand:hover {
  color: #ff6b35 !important;
  transform: translateY(-1px);
}

.navbar-brand i {
  color: #ff6b35;
  font-size: 1.5rem;
}

.nav-link {
  color: #636e72 !important;
  font-weight: 500;
  padding: 0.5rem 1rem !important;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: #ff6b35 !important;
  background-color: rgba(255, 107, 53, 0.1);
}

.nav-link.active {
  color: #ff6b35 !important;
  background-color: rgba(255, 107, 53, 0.1);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background-color: #ff6b35;
  border-radius: 1px;
}

/* Language switcher styles */
.language-switcher {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem !important;
  border-radius: 6px;
  transition: all 0.3s ease;
  min-width: 120px;
}

.language-switcher:hover {
  background-color: rgba(255, 107, 53, 0.1);
  color: #ff6b35 !important;
}

.language-flag {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.language-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.language-menu {
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 0.5rem 0;
  min-width: 160px;
}

.language-option {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  color: #2d3436;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
  background: none;
}

.language-option:hover {
  background-color: #f8f9fa;
  color: #ff6b35;
}

.language-option.active {
  background-color: #ffe8e0;
  color: #2d3436;
  font-weight: 600;
}

.language-option .language-flag {
  margin-right: 0.75rem;
}

.language-option .language-name {
  flex: 1;
}

/* Mobile responsive */
@media (max-width: 991.98px) {
  .navbar-brand {
    font-size: 1.1rem;
  }

  .navbar-nav {
    margin-top: 1rem;
  }

  .nav-link {
    margin: 0.25rem 0;
  }

  .language-switcher {
    justify-content: flex-start;
    min-width: auto;
  }

  .language-switcher .language-flag {
    font-size: 1.5rem;
    margin-right: 0.25rem;
  }

  .language-menu {
    position: relative !important;
    transform: none !important;
    box-shadow: none;
    border: none;
    background-color: rgba(255, 255, 255, 0.1);
    margin-top: 0.5rem;
  }

  .language-option {
    color: #636e72;
  }

  .language-option:hover,
  .language-option.active {
    background-color: rgba(255, 107, 53, 0.2);
    color: #ff6b35;
  }
}

/* 確保頁面內容不被固定導航欄遮擋 */
:global(body) {
  padding-top: 80px;
}

/* Navbar toggler 自定義樣式 */
.navbar-toggler {
  border: 1px solid rgba(255, 107, 53, 0.5);
  padding: 0.25rem 0.5rem;
}

.navbar-toggler:focus {
  box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25);
}

.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 107, 53, 1%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}

/* Dropdown 箭頭動畫 */
.dropdown-toggle::after {
  transition: transform 0.3s ease;
}

.dropdown-toggle[aria-expanded='true']::after {
  transform: rotate(180deg);
}
</style>
