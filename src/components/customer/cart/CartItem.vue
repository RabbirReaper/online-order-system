<template>
  <div class="cart-item">
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex align-items-start">
          <!-- 商品信息 -->
          <div class="flex-grow-1">
            <h5 class="item-name">{{ item.dishInstance.name }}</h5>

            <!-- 選項 -->
            <div v-if="item.options && item.options.length > 0" class="item-options mt-1">
              <span v-for="(option, index) in item.options" :key="index" class="option-badge">
                {{ option.name }}
                <span v-if="option.price > 0" class="option-price">+${{ option.price }}</span>
              </span>
            </div>

            <!-- 特殊要求 -->
            <div v-if="item.dishInstance.specialInstructions" class="item-note mt-1">
              <small class="text-muted">
                <i class="bi bi-chat-left-text me-1"></i>
                {{ item.dishInstance.specialInstructions }}
              </small>
            </div>

            <!-- 價格 -->
            <div class="item-price mt-2">
              ${{ itemUnitPrice }}
            </div>
          </div>

          <!-- 數量控制區 -->
          <div class="item-quantity d-flex align-items-center">
            <BButton variant="outline-secondary" size="sm" class="quantity-btn"
              @click="updateQuantity(item.quantity - 1)" :disabled="item.quantity <= 1">
              <i class="bi bi-dash"></i>
            </BButton>

            <span class="mx-2">{{ item.quantity }}</span>

            <BButton variant="outline-secondary" size="sm" class="quantity-btn"
              @click="updateQuantity(item.quantity + 1)">
              <i class="bi bi-plus"></i>
            </BButton>
          </div>
        </div>

        <!-- 小計和刪除按鈕 -->
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="item-subtotal">
            <span class="text-muted">小計</span>
            <span class="fw-bold ms-2">${{ item.subtotal }}</span>
          </div>

          <BButton variant="link" class="text-danger p-0 delete-btn" @click="$emit('remove')">
            <i class="bi bi-trash me-1"></i>刪除
          </BButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 定義 props
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

// 定義 emits
const emit = defineEmits(['update-quantity', 'remove']);

// 計算單價
const itemUnitPrice = computed(() => {
  // 基本價格
  let price = props.item.dishInstance.finalPrice || props.item.dishInstance.basePrice;

  // 加上選項價格
  if (props.item.options && props.item.options.length > 0) {
    const optionsPrice = props.item.options.reduce((total, opt) => total + (opt.price || 0), 0);
    price += optionsPrice;
  }

  return price.toLocaleString('zh-TW');
});

// 更新數量方法
const updateQuantity = (quantity) => {
  if (quantity < 1) return;
  emit('update-quantity', quantity);
};
</script>

<style scoped>
.card {
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.item-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.item-options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.option-badge {
  display: inline-block;
  font-size: 0.8rem;
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 4px;
  margin-bottom: 4px;
}

.option-price {
  font-weight: 600;
  color: #e74c3c;
  margin-left: 2px;
}

.item-price {
  font-weight: 600;
  color: #e74c3c;
}

.quantity-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.delete-btn {
  font-size: 0.9rem;
}

.delete-btn:hover {
  text-decoration: underline;
}
</style>
