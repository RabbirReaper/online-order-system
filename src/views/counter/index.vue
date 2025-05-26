<template>
  <div class="app-container">
    <div class="row h-100 g-0">
      <!-- 左側邊欄 -->
      <div class="col-md-1 bg-dark text-white sidebar d-flex flex-column">
        <div class="sidebar-content flex-grow-1 d-flex flex-column p-3">
          <div class="time-display text-center mb-3">
            <div class="fs-6">{{ currentTime }}</div>
          </div>
          <button class="btn mb-3"
            :class="counterStore.activeComponent === 'DineIn' ? 'btn-primary' : 'btn-outline-light'"
            @click="counterStore.setActiveComponent('DineIn')">
            內用
          </button>
          <button class="btn mb-3"
            :class="counterStore.activeComponent === 'TakeOut' ? 'btn-primary' : 'btn-outline-light'"
            @click="counterStore.setActiveComponent('TakeOut')">
            外帶
          </button>
          <button class="btn mb-3"
            :class="counterStore.activeComponent === 'Orders' ? 'btn-primary' : 'btn-outline-light'"
            @click="counterStore.setActiveComponent('Orders')">
            訂單
          </button>
          <button class="btn btn-warning mt-auto" @click="refreshData">更新資料</button>
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
import { computed, onMounted, markRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCounterStore } from '@/stores/counter';
import DineIn from '@/components/counter/DineIn.vue';
import TakeOut from '@/components/counter/TakeOut.vue';
import OrderList from '@/components/counter/OrderList.vue';
import OrderCart from '@/components/counter/OrderCart/index.vue';

// 路由和參數
const route = useRoute();
const router = useRouter();
const brandId = route.params.brandId;
const storeId = route.params.storeId;
const currentTime = computed(() => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});
// 使用 Pinia store
const counterStore = useCounterStore();

// 組件映射
const componentMap = {
  DineIn: markRaw(DineIn),
  TakeOut: markRaw(TakeOut),
  Orders: markRaw(OrderList)
};

// 計算屬性獲取當前活動組件
const currentActiveComponent = computed(() => {
  return componentMap[counterStore.activeComponent];
});

// 重新整理數據
const refreshData = async () => {
  await counterStore.refreshData(brandId, storeId);
};

// 生命周期鉤子
onMounted(async () => {
  // 設置品牌和店鋪ID
  counterStore.setBrandAndStore(brandId, storeId);

  // 載入初始數據
  await counterStore.fetchStoreData(brandId, storeId);
  await counterStore.fetchMenuData(brandId, storeId);
  await counterStore.fetchTodayOrders(brandId, storeId);
});
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
  overflow: hidden;
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
</style>
