<template>
  <div class="order-summary">
    <div class="card mb-4">
      <div class="card-body">
        <!-- 店鋪信息 -->
        <div class="store-info mb-3 pb-2 border-bottom">
          <h5 class="store-name">{{ store?.name || '餐廳訂單' }}</h5>
          <div class="store-address text-muted small">
            <i class="bi bi-geo-alt me-1"></i>
            {{ store?.location || '店家位置' }}
          </div>
        </div>

        <!-- 訂單類型信息 -->
        <div class="order-type-info mb-3 pb-2 border-bottom">
          <div class="d-flex align-items-center">
            <i :class="orderTypeIcon" class="me-2 fs-5"></i>
            <div>
              <div class="fw-bold">{{ orderTypeLabel }}</div>
              <div class="text-muted small">
                <!-- 根據不同訂單類型顯示不同信息 -->
                <div v-if="orderType === 'dine_in'">
                  桌號: {{ dineInInfo.tableNumber || '-' }}
                </div>
                <div v-else-if="orderType === 'takeout'">
                  預計取餐時間: {{ formatPickupTime }}
                </div>
                <div v-else-if="orderType === 'delivery'">
                  配送地址: {{ deliveryInfo.address || '-' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 顧客信息 -->
        <div class="customer-info mb-3 pb-2 border-bottom">
          <div class="d-flex">
            <div class="me-4">
              <div class="text-muted small">姓名</div>
              <div>{{ customerInfo.name || '-' }}</div>
            </div>
            <div>
              <div class="text-muted small">電話</div>
              <div>{{ customerInfo.phone || '-' }}</div>
            </div>
          </div>
        </div>

        <!-- 訂單項目 -->
        <div class="order-items mb-3">
          <h6 class="mb-2">訂單項目</h6>
          <div class="order-item d-flex justify-content-between mb-2" v-for="(item, index) in cartItems" :key="index">
            <div class="item-info">
              <div class="d-flex align-items-baseline">
                <span class="item-quantity me-2">{{ item.quantity }}x</span>
                <span class="item-name">{{ item.dishInstance.name }}</span>
              </div>
              <!-- 選項 -->
              <div v-if="item.options && item.options.length > 0" class="item-options mt-1">
                <small class="text-muted">
                  <span v-for="(option, optIndex) in item.options" :key="optIndex">
                    {{ option.name }}
                    <span v-if="optIndex < item.options.length - 1" class="mx-1">+</span>
                  </span>
                </small>
              </div>
              <!-- 特殊要求 -->
              <div v-if="item.dishInstance.specialInstructions" class="item-note">
                <small class="text-muted fst-italic">
                  {{ item.dishInstance.specialInstructions }}
                </small>
              </div>
            </div>
            <div class="item-price text-end">
              ${{ item.subtotal }}
            </div>
          </div>
        </div>

        <!-- 備註 -->
        <div v-if="notes" class="order-note mb-3 pb-2 border-bottom">
          <h6 class="mb-2">備註</h6>
          <div class="text-muted small">{{ notes }}</div>
        </div>

        <!-- 價格摘要 -->
        <div class="price-summary">
          <div class="d-flex justify-content-between mb-2">
            <span>小計</span>
            <span>${{ subtotal }}</span>
          </div>

          <div v-if="serviceCharge > 0" class="d-flex justify-content-between mb-2">
            <span>服務費</span>
            <span>${{ serviceCharge }}</span>
          </div>

          <div v-if="orderType === 'delivery' && deliveryInfo.deliveryFee > 0"
            class="d-flex justify-content-between mb-2">
            <span>外送費</span>
            <span>${{ deliveryInfo.deliveryFee }}</span>
          </div>

          <div v-if="discountAmount > 0" class="d-flex justify-content-between mb-2 text-danger">
            <span>折扣</span>
            <span>-${{ discountAmount }}</span>
          </div>

          <div class="d-flex justify-content-between mt-3 pt-3 border-top total-row">
            <span class="fw-bold">總計</span>
            <span class="fw-bold fs-5 text-danger">${{ total }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useCartStore } from '@/stores/cart';
import api from '@/api';

// 購物車 store
const cartStore = useCartStore();
const {
  items: cartItems,
  subtotal,
  serviceCharge,
  discountAmount,
  total,
  orderType,
  customerInfo,
  deliveryInfo,
  dineInInfo,
  estimatedPickupTime,
  notes,
  currentBrand: brandId,
  currentStore: storeId
} = storeToRefs(cartStore);

// 店鋪信息
const store = ref(null);

// 訂單類型圖標
const orderTypeIcon = computed(() => {
  const icons = {
    'dine_in': 'bi bi-cup-hot',
    'takeout': 'bi bi-bag',
    'delivery': 'bi bi-truck'
  };
  return icons[orderType.value] || 'bi bi-question-circle';
});

// 訂單類型標籤
const orderTypeLabel = computed(() => {
  const labels = {
    'dine_in': '內用',
    'takeout': '外帶',
    'delivery': '外送'
  };
  return labels[orderType.value] || '未指定';
});

// 格式化取餐時間
const formatPickupTime = computed(() => {
  if (!estimatedPickupTime.value) return '-';

  const time = new Date(estimatedPickupTime.value);
  return time.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

// 載入店鋪信息
const loadStoreData = async () => {
  if (!brandId.value || !storeId.value) return;

  try {
    const response = await api.store.getStoreById({
      brandId: brandId.value,
      id: storeId.value
    });

    if (response && response.store) {
      store.value = response.store;
    }
  } catch (err) {
    console.error('獲取店鋪信息失敗', err);
  }
};

// 生命週期鉤子
onMounted(() => {
  loadStoreData();
});
</script>

<style scoped>
.order-summary {
  margin-bottom: 1.5rem;
}

.card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.store-name {
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
}

.order-item {
  padding: 8px 0;
}

.item-quantity {
  font-weight: 500;
  color: #666;
}

.item-name {
  font-weight: 500;
}

.item-price {
  font-weight: 500;
}

.total-row {
  font-size: 1.1rem;
}
</style>
