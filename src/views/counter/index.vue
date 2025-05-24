<template>
  <div class="container-fluid h-100">
    <div class="row h-100">
      <!-- 左側邊欄 -->
      <div class="col-md-1 bg-dark text-white sidebar py-3 d-flex flex-column">
        <button class="btn mb-3" :class="counterStore.activeComponent === 'DineIn' ? 'btn-primary' : 'btn-outline-light'"
          @click="counterStore.setActiveComponent('DineIn')">
          內用
        </button>
        <button class="btn mb-3" :class="counterStore.activeComponent === 'TakeOut' ? 'btn-primary' : 'btn-outline-light'"
          @click="counterStore.setActiveComponent('TakeOut')">
          外帶
        </button>
        <button class="btn mb-3" :class="counterStore.activeComponent === 'Orders' ? 'btn-primary' : 'btn-outline-light'"
          @click="counterStore.setActiveComponent('Orders')">
          訂單
        </button>
        <button class="btn btn-warning mt-auto" @click="refreshData">更新資料</button>
      </div>

      <!-- 中間內容區 -->
      <div class="col-md-8 p-0"
        :class="{ 'main-content': counterStore.activeComponent === 'Orders', 'main-content-rigid': counterStore.activeComponent !== 'Orders' }">
        <component :is="currentActiveComponent" :brand-id="brandId" :store-id="storeId" />
      </div>

      <!-- 右側邊欄 - 購物車 -->
      <div class="col-md-3 p-2">
        <OrderCart :active-component="counterStore.activeComponent" />
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
.h-100 {
  height: 100vh;
}

.sidebar {
  height: 100vh;
  overflow-y: auto;
}

.main-content {
  height: 100vh;
  overflow-y: auto;
}

.main-content-rigid {
  height: auto;
  overflow-y: auto;
}
</style>
