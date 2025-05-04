<template>
  <div>
    <!-- 折疊標題區域 -->
    <div class="collapse-header px-3 py-2" @click="toggleCollapse">
      <span>
        <slot name="icon"></slot>{{ title }}
      </span>
      <i class="bi float-end" :class="isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
    </div>

    <!-- 折疊內容區域 -->
    <div class="collapse-content" ref="collapseContentRef" :style="{ maxHeight: contentStyle }">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue';

// 接收的屬性
const props = defineProps({
  title: {
    type: String,
    default: '折疊項目'
  },
  // 可選屬性：初始是否展開
  initialExpanded: {
    type: Boolean,
    default: false
  }
});

// 定義事件
const emit = defineEmits(['toggle']);

// 響應式狀態
const isExpanded = ref(props.initialExpanded); // 是否展開的狀態
const collapseContentRef = ref(null); // 對折疊內容的引用
const actualHeight = ref(0); // 保存實際高度值(數字形式)

// 使用computed來計算內容樣式
const contentStyle = computed(() => {
  if (!isExpanded.value) return '0px';

  if (collapseContentRef.value && actualHeight.value === 0) {
    // 需要計算高度
    updateActualHeight();
  }

  return actualHeight.value > 0 ? `${actualHeight.value}px` : 'auto';
});

// 更新實際高度的函數
const updateActualHeight = () => {
  if (!collapseContentRef.value) return;

  // 臨時移除高度限制來測量真實高度
  const originalStyle = collapseContentRef.value.style.maxHeight;
  collapseContentRef.value.style.maxHeight = 'none';

  // 獲取實際高度
  actualHeight.value = collapseContentRef.value.scrollHeight;

  // 恢復原始樣式
  collapseContentRef.value.style.maxHeight = originalStyle;
};

// 切換折疊狀態
const toggleCollapse = () => {
  isExpanded.value = !isExpanded.value;
  emit('toggle', isExpanded.value);
};

// 組件掛載後
onMounted(() => {
  // 初始計算內容高度
  nextTick(() => {
    updateActualHeight();
  });

});

// 公開方法讓父組件可以控制折疊狀態
defineExpose({
  expand: () => { isExpanded.value = true; },
  collapse: () => { isExpanded.value = false; },
  toggle: toggleCollapse,
  isExpanded: computed(() => isExpanded.value)
});
</script>

<style scoped>
.collapse-header {
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0.25rem;
  transition: all 0.2s;
  font-weight: 500;
}

.collapse-header:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.1);
}

.collapse-content {
  overflow: hidden;
  transition: max-height 0.3s ease;
}
</style>
