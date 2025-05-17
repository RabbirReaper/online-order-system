<template>
  <div id="menu-section" class="menu-container">
    <div class="content-wrapper">
      <div class="section-header">
        <i class="bi bi-journal-text me-2 menu-icon"></i>
        <h3 class="fw-bold mb-0">精選菜單</h3>
      </div>

      <div v-for="category in menuList" :key="category.categoryId" class="menu-category"
        :id="'category-' + category.categoryId">
        <div class="category-header">
          <h4 class="fw-bold">{{ category.categoryName }}</h4>
        </div>
        <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
          <div v-for="item in getItemsInCategory(category)" :key="item._id" class="col">
            <DishCard :item="item" @select-item="$emit('select-item', item._id)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import DishCard from './DishCard.vue';

const props = defineProps({
  menuList: {
    type: Array,
    required: true,
    default: () => []
  },
  menuItems: {
    type: Array,
    required: true,
    default: () => []
  }
});

const emit = defineEmits(['select-item']);

// 取得分類中的菜單項目並排序
const getItemsInCategory = (category) => {
  return props.menuItems.filter(item => {
    return category.items.some(catItem => catItem.itemId === item._id);
  }).sort((a, b) => {
    const aOrder = category.items.find(item => item.itemId === a._id)?.order || 0;
    const bOrder = category.items.find(item => item.itemId === b._id)?.order || 0;
    return aOrder - bOrder;
  });
};
</script>

<style scoped>
/* 顏色變數定義 */
:root {
  --primary-color: #d35400;
  --accent-color: #e67e22;
  --text-color: #2c3e50;
  --bg-light: #f8f9fa;
  --price-color: #dceeda;
}

/* 菜單樣式 */
.menu-container {
  padding: 2rem 0;
}

.menu-icon {
  color: #28a745;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--accent-color);
}

.menu-category {
  margin-bottom: 2.5rem;
  scroll-margin-top: 70px;
  /* 確保滾動到類別時，標題不會被導航欄遮擋 */
}

.category-header {
  margin-bottom: 1rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  border-bottom: 1px dashed #e0e0e0;
  padding-bottom: 0.5rem;
}

.category-header h4 {
  font-family: 'Noto Sans TC', '微軟正黑體', 'Microsoft JhengHei', '蘋方-繁', 'PingFang TC', sans-serif !important;
  font-weight: 700 !important;
  color: var(--primary-color);
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  position: relative;
  padding-left: 15px;
}

.category-header h4:before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 24px;
  background-color: var(--accent-color);
  border-radius: 3px;
}

.content-wrapper {
  width: 100%;
  padding: 0 15px;
}
</style>
