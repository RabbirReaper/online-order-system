<template>
  <div class="p-6 text-center text-gray-600 bg-gray-100 rounded-lg border border-dashed border-gray-300">
    <p class="text-xl font-semibold mb-2">{{ title }}</p>
    <p class="text-sm">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '功能尚未開發'
  },
  message: {
    type: String,
    default: '敬請期待未來更新。'
  }
})
</script>
