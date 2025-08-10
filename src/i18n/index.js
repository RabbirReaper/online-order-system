import { createI18n } from 'vue-i18n'
import zhTW from './locales/zh-TW'
import en from './locales/en'

const messages = {
  'zh-TW': zhTW,
  en: en,
}

// 從 localStorage 讀取語言設定，預設為繁體中文
const savedLocale = localStorage.getItem('preferred-language') || 'zh-TW'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'zh-TW',
  messages,
})

export default i18n
