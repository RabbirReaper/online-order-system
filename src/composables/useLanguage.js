import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

// 全域語言狀態
const currentLanguage = ref(localStorage.getItem('preferred-language') || 'zh-TW')

// 可用語言選項
const availableLanguages = [
  {
    code: 'zh-TW',
    name: '繁體中文',
    flag: '🇹🇼',
  },
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
  },
]

export function useLanguage() {
  const { locale } = useI18n()

  // 當前語言資訊
  const currentLanguageInfo = computed(() => {
    return (
      availableLanguages.find((lang) => lang.code === currentLanguage.value) ||
      availableLanguages[0]
    )
  })

  // 切換語言
  const switchLanguage = (languageCode) => {
    if (availableLanguages.some((lang) => lang.code === languageCode)) {
      currentLanguage.value = languageCode
      locale.value = languageCode
      localStorage.setItem('preferred-language', languageCode)

      // 更新頁面標題和 meta 標籤
      updatePageMeta()
    }
  }

  // 更新頁面 meta 資訊
  const updatePageMeta = () => {
    // 這個函數可以根據當前語言更新頁面的 meta 標籤
    // 例如 lang 屬性、meta description 等
    document.documentElement.lang = currentLanguage.value === 'zh-TW' ? 'zh-TW' : 'en'
  }

  // 初始化語言設定
  const initializeLanguage = () => {
    locale.value = currentLanguage.value
    updatePageMeta()
  }

  return {
    currentLanguage: computed(() => currentLanguage.value),
    currentLanguageInfo,
    availableLanguages,
    switchLanguage,
    initializeLanguage,
  }
}
