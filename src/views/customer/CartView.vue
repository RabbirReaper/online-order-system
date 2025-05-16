<template>
  <div class="cart-view">
    <!-- 頂部導航欄 -->
    <BNavbar toggleable="lg" type="dark" variant="dark" class="fixed-top">
      <BButton variant="link" class="text-white p-0 me-3" @click="$router.back()">
        <i class="bi bi-arrow-left fs-4"></i>
      </BButton>
      <BNavbarBrand class="me-auto">購物車</BNavbarBrand>
    </BNavbar>

    <div class="container mt-4 mb-5 pb-5">
      <!-- 空購物車提示 -->
      <div v-if="isCartEmpty" class="empty-cart-container text-center py-5">
        <i class="bi bi-cart-x text-muted display-1"></i>
        <h3 class="mt-3">購物車是空的</h3>
        <p class="text-muted">快去選擇美味的餐點吧！</p>
        <BButton variant="primary" class="mt-3" @click="$router.back()">
          <i class="bi bi-arrow-left me-2"></i>返回菜單
        </BButton>
      </div>

      <!-- 購物車內容 -->
      <template v-else>
        <!-- 店家信息 -->
        <div class="store-info mb-4">
          <h3>{{ store?.name || '購物車' }}</h3>
        </div>

        <!-- 購物車項目列表 -->
        <div class="cart-items mb-4">
          <CartItem v-for="(item, index) in cartItems" :key="index" :item="item"
            @update-quantity="updateItemQuantity(index, $event)" @remove="removeItem(index)" />
        </div>

        <hr>

        <!-- 訂單類型選擇 -->
        <div class="order-type-section mb-4">
          <h4 class="section-title">訂單類型</h4>
          <OrderTypeSelector v-model="orderType" @pickup-time-selected="onPickupTimeSelected"
            @dine-in-info-updated="onDineInInfoUpdated" @delivery-info-updated="onDeliveryInfoUpdated" />
        </div>

        <hr>

        <!-- 顧客信息 -->
        <div class="customer-info-section mb-4">
          <h4 class="section-title">聯絡資訊</h4>
          <CustomerInfoForm v-model="customerInfo" />
        </div>

        <hr>

        <!-- 備註欄位 -->
        <div class="notes-section mb-4">
          <h4 class="section-title">訂單備註</h4>
          <BFormTextarea v-model="notes" rows="3" placeholder="如有特殊需求，請在此說明..."></BFormTextarea>
        </div>

        <hr class="mb-4">

        <!-- 價格摘要 -->
        <div class="price-summary">
          <div class="d-flex justify-content-between mb-2">
            <span>小計</span>
            <span>{{ formatPrice(subtotal) }}</span>
          </div>

          <div v-if="serviceCharge > 0" class="d-flex justify-content-between mb-2">
            <span>服務費</span>
            <span>{{ formatPrice(serviceCharge) }}</span>
          </div>

          <div v-if="orderType === 'delivery' && deliveryInfo.deliveryFee > 0"
            class="d-flex justify-content-between mb-2">
            <span>外送費</span>
            <span>{{ formatPrice(deliveryInfo.deliveryFee) }}</span>
          </div>

          <div v-if="discountAmount > 0" class="d-flex justify-content-between mb-2 text-danger">
            <span>折扣</span>
            <span>-{{ formatPrice(discountAmount) }}</span>
          </div>

          <div class="d-flex justify-content-between mt-3 total-row">
            <span class="fw-bold">總計</span>
            <span class="fw-bold fs-5">{{ formatPrice(total) }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 底部固定結帳按鈕 -->
    <div v-if="!isCartEmpty" class="checkout-container">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center">
          <div class="checkout-total">
            <span>總計</span>
            <span class="price fw-bold ms-2">{{ formatPrice(total) }}</span>
          </div>
          <BButton variant="primary" size="lg" class="checkout-btn" :disabled="!isFormValid" @click="proceedToCheckout">
            前往結帳
          </BButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useCartStore } from '@/stores/cart';
import CartItem from '@/components/customer/cart/CartItem.vue';
import OrderTypeSelector from '@/components/customer/cart/OrderTypeSelector.vue';
import CustomerInfoForm from '@/components/customer/cart/CustomerInfoForm.vue';
import api from '@/api';

// 路由相關
const router = useRouter();
const route = useRoute();

// 購物車 store
const cartStore = useCartStore();
const {
  items: cartItems,
  orderType,
  customerInfo,
  deliveryInfo,
  dineInInfo,
  estimatedPickupTime,
  notes,
  subtotal,
  serviceCharge,
  discountAmount,
  total,
  isCartEmpty,
  currentBrand: brandId,
  currentStore: storeId
} = storeToRefs(cartStore);

// 店鋪信息
const store = ref(null);
const isLoading = ref(true);

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
  } finally {
    isLoading.value = false;
  }
};

// 更新商品數量
const updateItemQuantity = (index, quantity) => {
  cartStore.updateItemQuantity(index, quantity);
};

// 移除商品
const removeItem = (index) => {
  cartStore.removeItem(index);
};

// 處理取餐時間選擇
const onPickupTimeSelected = (time) => {
  cartStore.setPickupTime(time);
};

// 處理內用信息更新
const onDineInInfoUpdated = (info) => {
  cartStore.setDineInInfo(info);
};

// 處理外送信息更新
const onDeliveryInfoUpdated = (info) => {
  cartStore.setDeliveryInfo(info);
};

// 表單驗證
const isFormValid = computed(() => {
  // 基本檢查
  if (isCartEmpty.value) return false;
  if (!orderType.value) return false;
  if (!customerInfo.value.name || !customerInfo.value.phone) return false;

  // 根據訂單類型檢查必填字段
  if (orderType.value === 'dine_in') {
    if (!dineInInfo.value.tableNumber) return false;
  } else if (orderType.value === 'takeout') {
    if (!estimatedPickupTime.value) return false;
  } else if (orderType.value === 'delivery') {
    if (!deliveryInfo.value.address) return false;
  }

  return true;
});

// 前往結帳
const proceedToCheckout = () => {
  if (!isFormValid.value) {
    alert('請填寫所有必要的信息');
    return;
  }

  router.push({
    name: 'order-confirm',
    params: {
      brandId: brandId.value,
      storeId: storeId.value
    }
  });
};

// 格式化價格
const formatPrice = (price) => {
  return `$${price.toLocaleString('zh-TW')}`;
};

// 生命週期鉤子
onMounted(() => {
  loadStoreData();
});
</script>

<style scoped>
.cart-view {
  padding-top: 56px;
  /* 頂部導航欄高度 */
  padding-bottom: 80px;
  /* 底部結帳按鈕高度 */
}

.empty-cart-container {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
}

.price-summary {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  font-size: 1rem;
}

.total-row {
  font-size: 1.1rem;
  padding-top: 10px;
  border-top: 1px solid #dee2e6;
}

.checkout-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding: 16px 0;
  z-index: 1000;
}

.checkout-total {
  font-size: 1rem;
}

.checkout-total .price {
  font-size: 1.3rem;
  color: #e74c3c;
}

.checkout-btn {
  min-width: 140px;
}
</style>
