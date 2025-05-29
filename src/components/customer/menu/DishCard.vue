<template>
  <div class="menu-item-card" :class="{ 'sold-out': isDishSoldOut }" @click="handleClick">
    <div class="item-img-container">
      <img :src="item.image && item.image.url ? item.image.url : ''" :alt="item.name" class="item-img">
      <div class="item-img-overlay"></div>
      <!-- 售完遮罩 -->
      <div v-if="isDishSoldOut" class="sold-out-overlay">
        <span class="sold-out-text">售完</span>
      </div>
    </div>
    <div class="item-content">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h5 class="item-title">{{ item.name }}</h5>
        <!-- 庫存狀態顯示 -->
        <div v-if="enableAvailableStock" class="inventory-badge">
          <span class="badge" :class="stockBadgeClass">
            庫存{{ availableStock }}
          </span>
        </div>
      </div>
      <p class="item-desc" v-if="item.description">{{ truncateDescription(item.description, 30) }}</p>
      <div class="item-price-tag">
        <span>${{ item.price || item.basePrice }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  enableAvailableStock: {
    type: Boolean,
    default: false
  },
  availableStock: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['select-item']);

// 計算屬性
const isDishSoldOut = computed(() => {
  if (props.enableAvailableStock) {
    return props.availableStock <= 0;
  }
  return false;
});

const stockBadgeClass = computed(() => {
  if (!props.enableAvailableStock) return '';

  if (props.availableStock <= 0) {
    return 'bg-danger text-white';
  } else if (props.availableStock <= 5) {
    return 'bg-warning text-dark';
  } else {
    return 'bg-success text-white';
  }
});

// 方法
const truncateDescription = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const handleClick = () => {
  // 檢查餐點是否售完
  if (isDishSoldOut.value) {
    return;
  }

  // 發出選擇事件
  emit('select-item', props.item);
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

.menu-item-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.menu-item-card:not(.sold-out):hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

/* 售完狀態樣式 - 變灰 */
.menu-item-card.sold-out {
  cursor: not-allowed;
  opacity: 0.5;
  filter: grayscale(50%);
  background-color: #f8f9fa;
}

.menu-item-card.sold-out:hover {
  transform: none;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.item-img-container {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.menu-item-card:not(.sold-out):hover .item-img {
  transform: scale(1.08);
}

.item-img-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
}

/* 售完遮罩 */
.sold-out-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.sold-out-text {
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  background-color: #dc3545;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.item-content {
  padding: 1rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.item-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-color);
  margin-bottom: 0.4rem;
  transition: color 0.2s;
  flex: 1;
}

.menu-item-card:not(.sold-out):hover .item-title {
  color: var(--primary-color);
}

.menu-item-card.sold-out .item-title {
  color: #6c757d;
}

.item-desc {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
  flex-grow: 1;
}

.item-price-tag {
  display: inline-block;
  background-color: var(--price-color);
  color: rgb(185, 127, 68);
  font-weight: 700;
  font-size: 1.1rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  box-shadow: 0 2px 5px rgba(199, 181, 181, 0.1);
  align-self: flex-end;
}

.menu-item-card.sold-out .item-price-tag {
  background-color: #e9ecef;
  color: #6c757d;
}

/* 庫存相關樣式 */
.inventory-badge {
  position: relative;
  z-index: 2;
  margin-left: 0.5rem;
}

.inventory-badge .badge {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  white-space: nowrap;
  text-align: center;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .item-content {
    padding: 0.75rem;
  }

  .item-title {
    font-size: 0.9rem;
  }

  .item-desc {
    font-size: 0.8rem;
  }

  .item-price-tag {
    font-size: 1rem;
    padding: 0.25rem 0.6rem;
  }

  .inventory-badge .badge {
    font-size: 0.6rem;
    padding: 0.2rem 0.4rem;
  }
}
</style>
