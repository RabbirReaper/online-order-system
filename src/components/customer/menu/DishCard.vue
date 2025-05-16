<template>
  <div class="dish-card" @click="$emit('click')">
    <div class="card h-100">
      <div class="row g-0">
        <div class="col-4">
          <img :src="dish.image?.url" :alt="dish.name" class="dish-image" :onerror="defaultImageHandler">
        </div>
        <div class="col-8">
          <div class="card-body py-2 px-3">
            <h5 class="dish-name">{{ dish.name }}</h5>

            <p v-if="dish.description" class="dish-description text-muted">
              {{ truncatedDescription }}
            </p>

            <div class="dish-tags" v-if="dish.tags && dish.tags.length > 0">
              <span v-for="(tag, index) in dish.tags" :key="index" class="dish-tag">
                {{ tag }}
              </span>
            </div>

            <div class="dish-price">
              {{ formattedPrice }}
            </div>

            <div v-if="hasOptions" class="dish-options">
              <span class="options-badge">
                <i class="bi bi-plus-circle-fill me-1"></i>可客製化
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 定義 props
const props = defineProps({
  dish: {
    type: Object,
    required: true
  },
  price: {
    type: Number,
    default: null
  }
});

// 定義 emits
const emit = defineEmits(['click']);

// 處理圖片載入失敗
const defaultImageHandler = "this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22sans-serif%22%20fill%3D%22%23aaa%22%3E%E6%9A%AB%E7%84%A1%E5%9C%96%E7%89%87%3C%2Ftext%3E%3C%2Fsvg%3E';";

// 計算屬性
const formattedPrice = computed(() => {
  // 如果提供了特定價格，優先使用它
  const priceToUse = props.price !== null ? props.price : props.dish.basePrice;
  return `$${priceToUse.toLocaleString('zh-TW')}`;
});

const truncatedDescription = computed(() => {
  if (!props.dish.description) return '';

  // 如果描述超過 50 個字符，截斷並加上省略號
  return props.dish.description.length > 50
    ? props.dish.description.substring(0, 50) + '...'
    : props.dish.description;
});

const hasOptions = computed(() => {
  return props.dish.optionCategories && props.dish.optionCategories.length > 0;
});
</script>

<style scoped>
.dish-card {
  cursor: pointer;
  transition: transform 0.15s ease-in-out;
}

.dish-card:hover {
  transform: translateY(-2px);
}

.card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.dish-card:hover .card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dish-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.dish-name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dish-description {
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dish-tags {
  margin-bottom: 0.5rem;
}

.dish-tag {
  display: inline-block;
  font-size: 0.7rem;
  background-color: #f1f1f1;
  color: #666;
  padding: 2px 6px;
  margin-right: 4px;
  margin-bottom: 4px;
  border-radius: 4px;
}

.dish-price {
  font-weight: 600;
  color: #e74c3c;
  font-size: 1.1rem;
}

.dish-options {
  margin-top: 0.5rem;
}

.options-badge {
  font-size: 0.75rem;
  background-color: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
