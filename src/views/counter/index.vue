<template>
  <div class="app-container">
    <div class="row h-100 g-0">
      <!-- 左側邊欄 -->
      <div class="sidebar-fixed bg-dark text-white sidebar d-flex flex-column">
        <div class="sidebar-content flex-grow-1 d-flex flex-column p-3">
          <div class="time-display text-center mb-3">
            <div class="fs-6">{{ currentTime }}</div>
          </div>
          <button
            class="btn mb-3"
            :class="counterStore.activeComponent === 'DineIn' ? 'btn-primary' : 'btn-outline-light'"
            @click="counterStore.setActiveComponent('DineIn')"
          >
            內用
          </button>
          <button
            class="btn mb-3"
            :class="
              counterStore.activeComponent === 'TakeOut' ? 'btn-primary' : 'btn-outline-light'
            "
            @click="counterStore.setActiveComponent('TakeOut')"
          >
            外帶
          </button>
          <button
            class="btn mb-3"
            :class="counterStore.activeComponent === 'Orders' ? 'btn-primary' : 'btn-outline-light'"
            @click="counterStore.setActiveComponent('Orders')"
          >
            訂單
          </button>
          <button
            class="btn mb-3"
            :class="
              counterStore.activeComponent === 'Inventory' ? 'btn-primary' : 'btn-outline-light'
            "
            @click="counterStore.setActiveComponent('Inventory')"
          >
            庫存
          </button>
          <button
            class="btn mb-3"
            :class="counterStore.activeComponent === 'Coupon' ? 'btn-primary' : 'btn-outline-light'"
            @click="counterStore.setActiveComponent('Coupon')"
          >
            優惠券
          </button>

          <!-- 增強版更新資料按鈕 -->
          <button
            class="btn mt-auto refresh-btn"
            :class="{
              'btn-warning': !isRefreshing && !isOnCooldown && !refreshSuccess,
              'btn-secondary': isRefreshing,
              'btn-dark': isOnCooldown,
              'btn-success': refreshSuccess && showSuccessMessage,
              refreshing: isRefreshing,
              disabled: isOnCooldown,
            }"
            :disabled="isRefreshing || isOnCooldown"
            @click="handleRefreshData"
          >
            <!-- 載入中的動畫 -->
            <span
              v-if="isRefreshing"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>

            <!-- 更新圖示 -->
            <i
              v-else-if="!isOnCooldown"
              class="bi bi-arrow-clockwise me-1"
              :class="{ 'spin-once': showSpinAnimation }"
            ></i>

            <!-- 冷卻時間圖示 -->
            <i v-else class="bi bi-clock me-1"></i>
            <br />
            <!-- 按鈕文字 -->
            <span v-if="isRefreshing">更新中</span>
            <span v-else-if="isOnCooldown">{{ cooldownSeconds }}s</span>
            <span v-else-if="refreshSuccess && showSuccessMessage">完成!</span>
            <span v-else class="fs-6">更新</span>
          </button>
        </div>
      </div>

      <!-- 中間內容區 -->
      <div class="col-md-8 main-content-wrapper">
        <div class="main-content h-100">
          <component :is="currentActiveComponent" :brand-id="brandId" :store-id="storeId" />
        </div>
      </div>

      <!-- 右側邊欄 - 購物車 -->
      <div class="col-md-3 cart-wrapper">
        <div class="cart-content h-100 p-2">
          <OrderCart :active-component="counterStore.activeComponent" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, markRaw, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCounterStore } from '@/stores/counter'
import DineIn from '@/components/counter/DineIn.vue'
import TakeOut from '@/components/counter/TakeOut.vue'
import OrderList from '@/components/counter/OrderList.vue'
import Inventory from '@/components/counter/Inventory.vue' // 新增
import OrderCart from '@/components/counter/OrderCart/index.vue'

// 路由和參數
const route = useRoute()
const router = useRouter()
const brandId = route.params.brandId
const storeId = route.params.storeId

const currentTime = ref('')

// 每秒更新一次時間（你也可以改成每 10 秒、60 秒）
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}
let timer = null

// 使用 Pinia store
const counterStore = useCounterStore()

// 新增的按鈕狀態
const isRefreshing = ref(false)
const isOnCooldown = ref(false)
const cooldownSeconds = ref(0)
const refreshSuccess = ref(false)
const showSuccessMessage = ref(false)
const showSpinAnimation = ref(false)

// 計時器引用
let cooldownTimer = null
let successTimer = null
let spinTimer = null

// 組件映射（新增 Inventory）
const componentMap = {
  DineIn: markRaw(DineIn),
  TakeOut: markRaw(TakeOut),
  Orders: markRaw(OrderList),
  Inventory: markRaw(Inventory), // 新增
}

// 計算屬性獲取當前活動組件
const currentActiveComponent = computed(() => {
  return componentMap[counterStore.activeComponent]
})

// 原有的重新整理數據函數
const refreshData = async () => {
  await counterStore.refreshData(brandId, storeId)
}

// 處理更新資料點擊（增強版）
const handleRefreshData = async () => {
  if (isRefreshing.value || isOnCooldown.value) return

  try {
    // 開始更新動畫
    isRefreshing.value = true
    refreshSuccess.value = false
    showSuccessMessage.value = false

    // 觸發一次旋轉動畫
    triggerSpinAnimation()

    // 呼叫實際的更新函數
    await refreshData()

    // 更新成功
    refreshSuccess.value = true
    showSuccessMessage.value = true

    // 2秒後隱藏成功訊息
    successTimer = setTimeout(() => {
      showSuccessMessage.value = false
      refreshSuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('更新資料失敗:', error)
    // 可以添加錯誤提示，但保持簡潔
    // alert('更新失敗，請稍後再試');
  } finally {
    isRefreshing.value = false
    startCooldown()
  }
}

// 開始冷卻倒計時
const startCooldown = () => {
  isOnCooldown.value = true
  cooldownSeconds.value = 5

  cooldownTimer = setInterval(() => {
    cooldownSeconds.value--

    if (cooldownSeconds.value <= 0) {
      clearInterval(cooldownTimer)
      isOnCooldown.value = false
      cooldownSeconds.value = 0
    }
  }, 1000)
}

// 觸發旋轉動畫
const triggerSpinAnimation = () => {
  showSpinAnimation.value = true
  spinTimer = setTimeout(() => {
    showSpinAnimation.value = false
  }, 600)
}

// 清理計時器
const cleanup = () => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
  }
  if (successTimer) {
    clearTimeout(successTimer)
  }
  if (spinTimer) {
    clearTimeout(spinTimer)
  }
  if (timer) {
    clearInterval(timer)
  }
}

// 生命周期鉤子
onMounted(async () => {
  // 設置品牌和店鋪ID
  counterStore.setBrandAndStore(brandId, storeId)

  updateTime()
  timer = setInterval(updateTime, 1000 * 60) // 每分鐘更新

  // 載入初始數據
  await counterStore.fetchStoreData(brandId, storeId)
  await counterStore.fetchMenuData(brandId, storeId)
  await counterStore.fetchTodayOrders(brandId, storeId)
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
/* 只針對這個組件進行樣式設置 */
.app-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  z-index: 1;
}

/* 確保 row 填滿容器 */
.app-container .row {
  margin: 0 !important;
  height: 100vh !important;
  --bs-gutter-x: 0;
  --bs-gutter-y: 0;
}

/* 側邊欄樣式 */
.sidebar {
  height: 100vh;
  min-height: 100vh;
  overflow-y: auto;
  position: relative;
}

.sidebar-content {
  height: 100%;
}

/* 主要內容區樣式 */
.main-content-wrapper {
  height: 100vh;
  padding: 0;
  position: relative;
}

.main-content {
  height: 100vh;
  overflow-y: auto;
}

/* 購物車區樣式 */
.cart-wrapper {
  height: 100vh;
  padding: 0;
  position: relative;
}

.cart-content {
  height: 100vh;
  overflow-y: auto;
}

/* 覆蓋 Bootstrap 的 col 樣式 */
.app-container .col-md-1,
.app-container .col-md-8,
.app-container .col-md-3 {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* ==================== 新增的更新按鈕樣式 ==================== */

.refresh-btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  font-size: 0.875rem;
  min-height: 38px;
}

/* 按鈕點擊效果 */
.refresh-btn:active:not(:disabled) {
  transform: scale(0.95);
}

/* 更新中狀態 */
.refresh-btn.refreshing {
  cursor: wait;
}

/* 冷卻中狀態 */
.refresh-btn.disabled {
  cursor: not-allowed !important;
  opacity: 0.7;
}

/* 旋轉動畫 */
.spin-once {
  animation: spinOnce 0.6s ease-in-out;
}

@keyframes spinOnce {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 懸停效果 */
.refresh-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 成功狀態的閃爍效果 */
.refresh-btn.btn-success {
  animation: successFlash 0.5s ease-in-out;
}

@keyframes successFlash {
  0% {
    background-color: #ffc107;
    transform: scale(1);
  }

  50% {
    background-color: #28a745;
    transform: scale(1.05);
  }

  100% {
    background-color: #28a745;
    transform: scale(1);
  }
}

/* 載入動畫的自定義樣式 */
.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
}

/* 冷卻時間數字的脈衝效果 */
.refresh-btn.disabled span {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }

  100% {
    opacity: 1;
  }
}

/* 適應側邊欄的緊湊樣式 */
.sidebar .refresh-btn {
  font-size: 0.8rem;
  padding: 0.375rem 0.5rem;
}

.sidebar .refresh-btn i {
  font-size: 0.875rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .refresh-btn {
    font-size: 0.75rem;
  }
}

.sidebar-fixed {
  width: 100px; /* 或你想要的固定寬度 */
  min-width: 100px;
  flex-shrink: 0; /* 防止被壓縮 */
}

/* 同時調整主要內容區 */
.main-content-wrapper {
  flex: 1; /* 佔據剩餘空間 */
}

/* 保持購物車區域 */
.cart-wrapper {
  width: 400px; /* 固定寬度 */
  min-width: 400px;
  flex-shrink: 0;
}

.sidebar .btn {
  aspect-ratio: 1 / 1; /* 1:1 比例 = 正方形 */
}
</style>
