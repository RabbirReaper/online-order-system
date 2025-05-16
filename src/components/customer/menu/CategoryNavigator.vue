<template>
  <div class="category-navigator">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <i class="bi bi-list-ul me-2"></i>菜單類別
      </div>
      <div class="card-body p-0">
        <ul class="list-group list-group-flush">
          <li v-for="(category, index) in categories" :key="index" class="list-group-item list-group-item-action"
            :class="{ active: activeCategory === category.name }" @click="$emit('select-category', category.name)">
            <div class="d-flex justify-content-between align-items-center">
              <span>{{ category.name }}</span>
              <span class="badge bg-light text-dark">{{ category.dishes.length }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
// 定義 props
const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  activeCategory: {
    type: String,
    default: ''
  }
});

// 定義 emits
const emit = defineEmits(['select-category']);
</script>

<style scoped>
.category-navigator {
  position: sticky;
  top: 76px;
  /* 導航欄高度 + 一點間距 */
}

.card {
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  font-weight: 500;
}

.list-group-item {
  cursor: pointer;
  transition: all 0.2s;
  padding: 12px 16px;
}

.list-group-item:hover {
  background-color: rgba(13, 110, 253, 0.1);
}

.list-group-item.active {
  background-color: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.list-group-item.active .badge {
  background-color: white !important;
  color: #0d6efd !important;
}
</style>
