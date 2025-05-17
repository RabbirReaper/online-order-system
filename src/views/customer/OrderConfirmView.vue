<template>
  <div class="order-confirm-view bg-light">
    <div class="container-wrapper">
      <div class="header bg-white p-3 shadow-sm">
        <div class="d-flex align-items-center">
          <button class="btn btn-link text-dark p-0" @click="goToMenu">
            <i class="bi bi-arrow-left fs-4"></i>
          </button>
          <h5 class="mb-0 mx-auto">訂單確認</h5>
        </div>
      </div>

      <div class="container py-4">
        <div class="order-success-card bg-white rounded-3 shadow-sm p-4 mb-4 text-center">
          <div
            class="success-icon rounded-circle bg-success d-inline-flex align-items-center justify-content-center mb-3">
            <i class="bi bi-check-lg text-white fs-4"></i>
          </div>
          <h4 class="mb-2">訂單已成功送出！</h4>
          <p class="text-muted mb-0">您的訂單編號：{{ orderNumber }}</p>
        </div>

        <div class="order-details-card bg-white rounded-3 shadow-sm p-4 mb-4">
          <h5 class="mb-3 border-bottom pb-2">訂單詳情</h5>

          <div class="order-info">
            <div class="row mb-2">
              <div class="col-5 text-muted">取餐方式：</div>
              <div class="col-7">{{ formatOrderType(orderDetails.orderType) }}</div>
            </div>

            <div class="row mb-2" v-if="orderDetails.orderType === 'dine_in'">
              <div class="col-5 text-muted">桌號：</div>
              <div class="col-7">{{ orderDetails.dineInInfo?.tableNumber }}</div>
            </div>

            <div class="row mb-2" v-if="orderDetails.orderType === 'delivery'">
              <div class="col-5 text-muted">外送地址：</div>
              <div class="col-7">{{ orderDetails.deliveryInfo?.address }}</div>
            </div>

            <div class="row mb-2" v-if="orderDetails.orderType === 'takeout'">
              <div class="col-5 text-muted">預計取餐時間：</div>
              <div class="col-7">{{ formatPickupTime(orderDetails.estimatedPickupTime) }}</div>
            </div>

            <div class="row mb-2">
              <div class="col-5 text-muted">付款方式：</div>
              <div class="col-7">{{ orderDetails.paymentMethod }}</div>
            </div>

            <div class="row mb-2">
              <div class="col-5 text-muted">訂單備註：</div>
              <div class="col-7">{{ orderDetails.notes || '無' }}</div>
            </div>
          </div>
        </div>

        <div class="order-items-card bg-white rounded-3 shadow-sm p-4 mb-4">
          <h5 class="mb-3 border-bottom pb-2">訂購項目</h5>

          <div v-for="(item, index) in orderDetails.items" :key="index" class="order-item mb-3 pb-3 border-bottom">
            <div class="d-flex justify-content-between mb-2">
              <div>
                <h6 class="mb-1">{{ item.dishInstance.name }}</h6>
                <p class="text-muted small mb-0" v-if="item.options && item.options.length">
                  <span v-for="(option, optIdx) in item.options" :key="optIdx">
                    {{ option.optionCategoryName }}:
                    {{option.selections.map(s => s.name).join(', ')}}
                    <br v-if="optIdx < item.options.length - 1">
                  </span>
                </p>
                <p class="text-muted small mb-0" v-if="item.specialInstructions">
                  備註: {{ item.specialInstructions }}
                </p>
              </div>
              <div class="text-end">
                <p class="mb-0">x{{ item.quantity }}</p>
                <p class="mb-0">${{ item.subtotal }}</p>
              </div>
            </div>
          </div>

          <div class="order-total mt-4">
            <div class="d-flex justify-content-between mb-2">
              <span>小計</span>
              <span>${{ orderDetails.subtotal }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2" v-if="orderDetails.serviceCharge">
              <span>服務費</span>
              <span>${{ orderDetails.serviceCharge }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2" v-if="orderDetails.discountAmount">
              <span>優惠折扣</span>
              <span>-${{ orderDetails.discountAmount }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2" v-if="orderDetails.orderType === 'delivery'">
              <span>外送費</span>
              <span>${{ orderDetails.deliveryInfo?.deliveryFee || 0 }}</span>
            </div>
            <div class="d-flex justify-content-between fw-bold">
              <span>總計</span>
              <span>${{ orderDetails.total }}</span>
            </div>
          </div>
        </div>

        <div class="d-grid gap-2">
          <button class="btn btn-primary py-2" @click="goToMenu">返回菜單</button>
          <button class="btn btn-outline-secondary py-2" @click="checkOrderStatus">查詢訂單狀態</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();

// 訂單資訊
const orderNumber = ref('DEMO12345678');
const orderDetails = ref({
  orderType: 'takeout',
  paymentMethod: '現場支付',
  subtotal: 0,
  serviceCharge: 0,
  discountAmount: 0,
  total: 0,
  items: [],
  notes: '',
  dineInInfo: null,
  deliveryInfo: null,
  estimatedPickupTime: null
});

// 格式化取餐方式
const formatOrderType = (type) => {
  const types = {
    'dine_in': '內用',
    'takeout': '外帶',
    'delivery': '外送'
  };
  return types[type] || type;
};

// 格式化取餐時間
const formatPickupTime = (time) => {
  if (!time) return '盡快取餐';

  try {
    const date = new Date(time);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (e) {
    return time;
  }
};

// 返回菜單頁面
const goToMenu = () => {
  // 如果有品牌和店鋪ID，直接導航到對應的菜單頁面
  if (cartStore.currentBrand && cartStore.currentStore) {
    router.push({
      name: 'menu',
      params: {
        brandId: cartStore.currentBrand,
        storeId: cartStore.currentStore
      }
    });
  } else {
    // 否則返回首頁
    router.push('/');
  }

  // 清空購物車
  cartStore.clearCart();
};

// 查詢訂單狀態（示例）
const checkOrderStatus = () => {
  // 這裡應該是導航到訂單狀態查詢頁面
  // 實際應用中可能會有專門的訂單跟踪頁面
  alert('此功能尚未實現。在實際應用中，這裡會跳轉到訂單狀態查詢頁面。');
};

// 模擬獲取訂單詳情
const fetchOrderDetails = async () => {
  // 實際應用中應該從API獲取訂單詳情
  // 這裡我們模擬一個訂單

  // 使用購物車資料填充訂單詳情
  orderDetails.value = {
    orderType: cartStore.orderType,
    paymentMethod: cartStore.paymentMethod,
    subtotal: cartStore.subtotal,
    serviceCharge: cartStore.serviceCharge,
    discountAmount: cartStore.discountAmount,
    total: cartStore.total,
    items: cartStore.items.map(item => ({
      dishInstance: {
        name: item.dishInstance.name,
        _id: item.dishInstance._id
      },
      quantity: item.quantity,
      subtotal: item.subtotal,
      options: item.options || [],
      specialInstructions: item.specialInstructions
    })),
    notes: cartStore.notes,
    dineInInfo: cartStore.dineInInfo,
    deliveryInfo: cartStore.deliveryInfo,
    estimatedPickupTime: cartStore.estimatedPickupTime
  };
};

onMounted(async () => {
  // 實際應用中，這裡會根據路由參數獲取訂單ID，然後從API獲取訂單詳情
  // 這裡為了簡化，我們使用購物車中的數據模擬
  await fetchOrderDetails();
});
</script>

<style scoped>
.order-confirm-view {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
}

.container-wrapper {
  max-width: 540px;
  width: 100%;
  background-color: white;
  min-height: 100vh;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}

.header {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.success-icon {
  width: 60px;
  height: 60px;
}

.order-item:last-child {
  border-bottom: none !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}

@media (max-width: 576px) {
  .container-wrapper {
    max-width: 100%;
  }
}
</style>
