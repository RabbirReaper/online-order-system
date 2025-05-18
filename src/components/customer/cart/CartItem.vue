<template>
  <div class="cart-item card mb-3 border-0 shadow-sm">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h6 class="card-title mb-0 fw-bold">{{ item.dishInstance.name }}</h6>
        <div class="item-price fw-bold">${{ item.subtotal }}</div>
      </div>

      <div class="item-details mb-3">
        <!-- 顯示所有選項 -->
        <template v-if="item.dishInstance.options && item.dishInstance.options.length > 0">
          <p class="card-text small mb-1" v-for="(category, catIndex) in item.dishInstance.options" :key="catIndex">
            {{ category.optionCategoryName }}:
            {{ formatSelections(category.selections) }}
          </p>
        </template>

        <!-- 特殊要求 -->
        <p class="card-text small mb-1" v-if="item.dishInstance.specialInstructions">
          備註: {{ item.dishInstance.specialInstructions }}
        </p>
      </div>

      <div class="d-flex justify-content-between align-items-center">
        <div class="d-flex">
          <button class="btn btn-sm btn-outline-danger me-2" @click="$emit('remove', index)">
            <i class="bi bi-trash"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary" @click="$emit('edit', index)">
            <i class="bi bi-pencil"></i>
          </button>
        </div>

        <div class="quantity-control d-flex align-items-center">
          <button class="btn btn-sm btn-outline-secondary" @click="$emit('quantity-change', index, -1)"
            :disabled="item.quantity <= 1">-</button>
          <span class="mx-2">{{ item.quantity }}</span>
          <button class="btn btn-sm btn-outline-secondary" @click="$emit('quantity-change', index, 1)">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['remove', 'edit', 'quantity-change']);

// 格式化選項為字符串
const formatSelections = (selections) => {
  if (!selections || selections.length === 0) return '';

  return selections.map(selection => {
    let text = selection.name;
    if (selection.price > 0) {
      text += ` (+$${selection.price})`;
    }
    return text;
  }).join(', ');
};
</script>

<style scoped>
.cart-item {
  border-radius: 10px;
  overflow: hidden;
}

.quantity-control {
  min-width: 100px;
}

.quantity-control button {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 50%;
}

.card-title {
  color: #333;
}

.item-price {
  color: #d35400;
}

.item-details {
  color: #666;
}

.btn-outline-danger {
  color: #dc3545;
  border-color: #dc3545;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  color: white;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  color: white;
}
</style>
