<template>
  <div class="menu-item-card" :class="{ 'sold-out': isItemSoldOut }" @click="handleClick">
    <div class="item-img-container">
      <img :src="itemImage" :alt="itemName" class="item-img">
      <div class="item-img-overlay"></div>

      <!-- 商品類型標籤 -->
      <div v-if="item.itemType === 'bundle'" class="item-type-badge">
        <span class="badge bg-warning text-dark">套餐</span>
      </div>

      <!-- 售完遮罩 -->
      <div v-if="isItemSoldOut" class="sold-out-overlay">
        <span class="sold-out-text">{{ getSoldOutText() }}</span>
      </div>
    </div>

    <div class="item-content">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h5 class="item-title">{{ itemName }}</h5>

        <!-- 庫存狀態顯示（僅餐點） -->
        <div v-if="item.itemType === 'dish' && (inventoryInfo?.enableAvailableStock || inventoryInfo?.isSoldOut)"
          class="inventory-badge">
          <span v-if="inventoryInfo.isSoldOut" class="badge bg-danger text-white">
            售完
          </span>
          <span v-else-if="inventoryInfo.enableAvailableStock" class="badge" :class="stockBadgeClass">
            庫存{{ inventoryInfo.availableStock }}
          </span>
        </div>
      </div>

      <p class="item-desc" v-if="itemDescription">{{ truncateDescription(itemDescription, 30) }}</p>

      <!-- 價格顯示 -->
      <div class="item-price-section">
        <!-- 餐點價格 -->
        <div v-if="item.itemType === 'dish'" class="item-price-tag">
          <span>${{ displayPrice }}</span>
        </div>

        <!-- 套餐價格 -->
        <div v-else-if="item.itemType === 'bundle'" class="bundle-price-section">
          <!-- 現金價格 -->
          <div v-if="item.priceOverride || item.bundle?.sellingPrice" class="item-price-tag">
            <span class="price-label">現金價</span>
            <span>${{ bundleCashPrice }}</span>
            <span v-if="bundleOriginalCashPrice > bundleCashPrice" class="original-price">
              原價 ${{ bundleOriginalCashPrice }}
            </span>
          </div>

          <!-- 點數價格 -->
          <div v-if="item.pointOverride !== undefined || item.bundle?.sellingPoint !== undefined"
            class="item-price-tag point-price">
            <span class="price-label">點數價</span>
            <span>{{ bundlePointPrice }} 點</span>
            <span v-if="bundleOriginalPointPrice > bundlePointPrice" class="original-price">
              原價 {{ bundleOriginalPointPrice }} 點
            </span>
          </div>
        </div>
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
  inventoryInfo: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['select-item']);

// 計算屬性 - 商品基本資訊
const itemName = computed(() => {
  if (props.item.itemType === 'dish') {
    return props.item.dishTemplate?.name || '未命名餐點';
  } else if (props.item.itemType === 'bundle') {
    return props.item.bundle?.name || '未命名套餐';
  }
  return '未知商品';
});

const itemDescription = computed(() => {
  if (props.item.itemType === 'dish') {
    return props.item.dishTemplate?.description;
  } else if (props.item.itemType === 'bundle') {
    return props.item.bundle?.description;
  }
  return '';
});

const itemImage = computed(() => {
  let imageUrl = '';

  if (props.item.itemType === 'dish') {
    imageUrl = props.item.dishTemplate?.image?.url;
  } else if (props.item.itemType === 'bundle') {
    // 套餐可能沒有圖片，或者使用第一個商品的圖片
    imageUrl = props.item.bundle?.image?.url;
  }

  return imageUrl || '/placeholder.jpg';
});

// 計算屬性 - 價格相關
const displayPrice = computed(() => {
  if (props.item.itemType === 'dish') {
    // 如果有價格覆蓋，使用覆蓋價格，否則使用餐點基本價格
    return props.item.priceOverride || props.item.dishTemplate?.basePrice || 0;
  }
  return 0;
});

const bundleCashPrice = computed(() => {
  if (props.item.itemType === 'bundle') {
    return props.item.priceOverride || props.item.bundle?.sellingPrice || 0;
  }
  return 0;
});

const bundleOriginalCashPrice = computed(() => {
  if (props.item.itemType === 'bundle') {
    return props.item.bundle?.originalPrice || bundleCashPrice.value;
  }
  return 0;
});

const bundlePointPrice = computed(() => {
  if (props.item.itemType === 'bundle') {
    return props.item.pointOverride !== undefined ? props.item.pointOverride : (props.item.bundle?.sellingPoint || 0);
  }
  return 0;
});

const bundleOriginalPointPrice = computed(() => {
  if (props.item.itemType === 'bundle') {
    return props.item.bundle?.originalPoint || bundlePointPrice.value;
  }
  return 0;
});

// 計算屬性 - 庫存狀態
const isItemSoldOut = computed(() => {
  // 套餐目前不檢查庫存
  if (props.item.itemType === 'bundle') {
    return false;
  }

  // 餐點庫存檢查
  if (props.item.itemType === 'dish' && props.inventoryInfo) {
    // 最高優先級：手動設為售完
    if (props.inventoryInfo.isSoldOut) {
      return true;
    }

    // 次級：如果啟用庫存且庫存為0
    if (props.inventoryInfo.enableAvailableStock) {
      return props.inventoryInfo.availableStock <= 0;
    }
  }

  return false;
});

const stockBadgeClass = computed(() => {
  if (!props.inventoryInfo || props.inventoryInfo.isSoldOut) return '';

  if (!props.inventoryInfo.enableAvailableStock) return '';

  if (props.inventoryInfo.availableStock <= 0) {
    return 'bg-danger text-white';
  } else if (props.inventoryInfo.availableStock <= 5) {
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

const getSoldOutText = () => {
  if (props.inventoryInfo?.isSoldOut) {
    return '暫停供應';
  }
  return '售完';
};

const handleClick = () => {
  // 檢查商品是否售完
  if (isItemSoldOut.value) {
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

/* 商品類型標籤 */
.item-type-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
}

.item-type-badge .badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
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

/* 價格相關樣式 */
.item-price-section {
  margin-top: auto;
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
  margin-bottom: 0.5rem;
}

.bundle-price-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bundle-price-section .item-price-tag {
  font-size: 0.9rem;
  padding: 0.25rem 0.6rem;
  margin-bottom: 0;
}

.point-price {
  background-color: #e8f4ff;
  color: #0066cc;
}

.price-label {
  font-size: 0.7rem;
  margin-right: 0.25rem;
  opacity: 0.8;
}

.original-price {
  font-size: 0.75rem;
  text-decoration: line-through;
  opacity: 0.6;
  margin-left: 0.25rem;
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

  .bundle-price-section .item-price-tag {
    font-size: 0.85rem;
  }
}
</style>
