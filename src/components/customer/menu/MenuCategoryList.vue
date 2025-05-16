<template>
  <div class="menu-category-list">
    <div v-for="(category, index) in categories" :key="index" :id="`category-${category.name}`"
      class="category-section mb-4 pb-2">
      <h3 class="category-title">{{ category.name }}</h3>
      <p v-if="category.description" class="category-description text-muted">
        {{ category.description }}
      </p>

      <div class="row g-3">
        <div v-for="dish in category.dishes.filter(d => d.isPublished)" :key="dish.dishTemplate._id" class="col-md-6">
          <DishCard :dish="dish.dishTemplate" :price="dish.price" @click="$emit('view-dish', dish.dishTemplate)" />
        </div>
      </div>

      <hr v-if="index < categories.length - 1" class="mt-4">
    </div>
  </div>
</template>

<script setup>
import DishCard from './DishCard.vue';

// 定義 props
const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  }
});

// 定義 emits
const emit = defineEmits(['view-dish']);
</script>

<style scoped>
.category-section {
  scroll-margin-top: 100px;
  /* 配合滾動到錨點的偏移量 */
}

.category-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #212529;
}

.category-description {
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
</style>
