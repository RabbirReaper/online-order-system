<template>
  <!-- Toast 容器組件，用於全局顯示 Toast 通知 -->
  <!-- 使用 BToastOrchestrator 來管理所有的 toast -->
  <BToastOrchestrator
    ref="orchestratorRef"
    teleport-to="body"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { BToastOrchestrator } from 'bootstrap-vue-next'

const orchestratorRef = ref(null)

// 監聽全局 toast 事件
const handleToastEvent = (event) => {
  const { message, options } = event.detail

  // 使用 orchestrator 的 show 方法顯示 toast
  if (orchestratorRef.value && orchestratorRef.value.show) {
    orchestratorRef.value.show({
      props: {
        body: message,
        modelValue: true, // 立即顯示
        isStatus: true, // 啟用狀態樣式
        noCloseButton: false, // 顯示關閉按鈕
        ...options,
      },
    })
  }
}

onMounted(() => {
  window.addEventListener('show-toast', handleToastEvent)

  // 將 orchestrator 儲存到全局，供其他地方使用
  const instance = getCurrentInstance()
  if (instance && orchestratorRef.value) {
    instance.appContext.config.globalProperties.$toastOrchestrator = orchestratorRef.value
  }
})

onUnmounted(() => {
  window.removeEventListener('show-toast', handleToastEvent)
})
</script>

<style scoped>
/* Bootstrap toast 淡出動畫 */
:deep(.toast) {
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

:deep(.toast.hide) {
  opacity: 0;
  transform: translateY(-10px);
}

:deep(.toast.showing) {
  opacity: 1;
  transform: translateY(0);
}
</style>
