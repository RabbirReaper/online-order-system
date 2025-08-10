<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive :include="keepAliveList">
      <component :is="Component" :key="route.fullPath" />
    </keep-alive>
  </router-view>
</template>

<script setup>
import { ref } from 'vue'

// 需要緩存的組件名稱列表
const keepAliveList = ref(['MenuView'])
</script>
