<template>
  <ToastContainer />
  <router-view v-slot="{ Component, route }">
    <keep-alive :include="keepAliveList" :max="maxCacheCount">
      <component :is="Component" :key="isAdminRoute(route) ? undefined : route.fullPath" />
    </keep-alive>
  </router-view>
</template>

<script setup>
import { ref } from 'vue'
import ToastContainer from '@/components/ToastContainer.vue'

// 需要緩存的組件名稱列表
const keepAliveList = ref(['MenuView'])
const maxCacheCount = ref(3)

// 判斷是否為 admin 路由
const isAdminRoute = (route) => {
  return route.path.includes('/admin/')
}
</script>
