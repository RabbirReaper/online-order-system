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

      <div class="container py-4" v-if="!isLoading">
        <!-- 訂單成功卡片 -->
        <div class="order-success-card bg-white rounded-3 shadow-sm p-4 mb-4 text-center">
          <div
            class="success-icon rounded-circle bg-success d-inline-flex align-items-center justify-content-center mb-3">
            <i class="bi bi-check-lg text-white fs-4"></i>
          </div>
          <h4 class="mb-3">訂單已成功送出！</h4>

          <!-- 優化的訂單編號顯示 -->
          <div class="order-number-section mb-2">
            <p class="text-muted mb-2 fs-6">您的訂單編號</p>
            <div class="order-number-display bg-light border rounded-3 p-3 mx-auto" style="max-width: 300px;">
              <span class="badge bg-primary fs-1 px-3 py-2">
                {{ orderDetails.sequence }}
              </span>
            </div>
            <small class="text-muted d-block mt-2">
              <i class="bi bi-info-circle me-1"></i>請保存此編號以便查詢訂單狀態
            </small>
          </div>
        </div>

        <!-- 進度條 -->
        <div class="progress-container bg-white rounded-3 shadow-sm p-4 mb-4">
          <div class="progress-header text-center mb-4">
            <h5 class="mb-0">訂單進度</h5>
          </div>

          <div class="progress-steps">
            <!-- 進度線 -->
            <div class="progress-line">
              <div class="progress-fill" :style="{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
              }"></div>
            </div>

            <!-- 步驟項目 -->
            <div class="steps-wrapper">
              <div v-for="step in steps" :key="step.id" :class="['step-item', getStepStatus(step.id)]">
                <div class="step-circle">
                  <span class="step-icon">
                    {{ getStepStatus(step.id) === 'completed' ? '✓' : step.icon }}
                  </span>
                </div>
                <div class="step-label">
                  <span class="step-title">{{ step.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 訂單詳情卡片 -->
        <div class="order-details-card bg-white rounded-3 shadow-sm p-4 mb-4">
          <h5 class="mb-3 border-bottom pb-2">訂單詳情</h5>

          <div class="order-info">
            <div class="row mb-2">
              <div class="col-5 text-muted">取餐方式：</div>
              <div class="col-7">{{ formatOrderType(orderDetails.orderType) }}</div>
            </div>

            <div class="row mb-2" v-if="orderDetails.orderType === 'dine_in' && orderDetails.dineInInfo">
              <div class="col-5 text-muted">桌號：</div>
              <div class="col-7">{{ orderDetails.dineInInfo.tableNumber }}</div>
            </div>

            <div class="row mb-2" v-if="orderDetails.orderType === 'delivery' && orderDetails.deliveryInfo">
              <div class="col-5 text-muted">外送地址：</div>
              <div class="col-7">{{ orderDetails.deliveryInfo.address }}</div>
            </div>

            <div class="row mb-2" v-if="orderDetails.orderType === 'takeout' && orderDetails.estimatedPickupTime">
              <div class="col-5 text-muted">預計取餐時間：</div>
              <div class="col-7">{{ formatPickupTime(orderDetails.estimatedPickupTime) }}</div>
            </div>

            <div class="row mb-2">
              <div class="col-5 text-muted">付款方式：</div>
              <div class="col-7">{{ formatPaymentMethod(orderDetails.paymentMethod) }}</div>
            </div>

            <div class="row mb-2" v-if="orderDetails.customerInfo">
              <div class="col-5 text-muted">聯絡人：</div>
              <div class="col-7">{{ orderDetails.customerInfo.name }}</div>
            </div>

            <div class="row mb-2" v-if="orderDetails.customerInfo">
              <div class="col-5 text-muted">聯絡電話：</div>
              <div class="col-7">{{ orderDetails.customerInfo.phone }}</div>
            </div>

            <div class="row mb-2" v-if="orderDetails.notes">
              <div class="col-5 text-muted">訂單備註：</div>
              <div class="col-7">{{ orderDetails.notes }}</div>
            </div>
          </div>
        </div>

        <!-- 訂購項目卡片 -->
        <div class="order-items-card bg-white rounded-3 shadow-sm p-4 mb-4">
          <h5 class="mb-3 border-bottom pb-2">訂購項目</h5>

          <div v-for="(item, index) in orderDetails.items" :key="index" class="order-item mb-3 pb-3">
            <div class="d-flex justify-content-between mb-2">
              <div class="flex-grow-1">
                <h6 class="mb-1">{{ item.dishInstance.name }}</h6>

                <!-- 餐點選項 -->
                <div v-if="item.dishInstance.options && item.dishInstance.options.length" class="text-muted small mb-1">
                  <div v-for="(option, optIdx) in item.dishInstance.options" :key="optIdx">
                    {{ option.optionCategoryName }}:
                    {{option.selections.map(s => s.name + (s.price > 0 ? ` (+$${s.price})` : '')).join(', ')}}
                  </div>
                </div>

                <!-- 餐點備註 -->
                <div v-if="item.note" class="text-muted small">
                  備註: {{ item.note }}
                </div>
              </div>

              <div class="text-end ms-3">
                <div class="fw-bold">x{{ item.quantity }}</div>
                <div class="text-primary fw-bold">${{ item.subtotal }}</div>
              </div>
            </div>

            <hr v-if="index < orderDetails.items.length - 1" class="my-3">
          </div>

          <!-- 金額明細 -->
          <div class="order-total mt-4 pt-3 border-top">
            <div class="d-flex justify-content-between mb-2">
              <span>小計</span>
              <span>${{ orderDetails.subtotal }}</span>
            </div>

            <div class="d-flex justify-content-between mb-2" v-if="orderDetails.serviceCharge > 0">
              <span>服務費</span>
              <span>${{ orderDetails.serviceCharge }}</span>
            </div>

            <div class="d-flex justify-content-between mb-2"
              v-if="orderDetails.orderType === 'delivery' && orderDetails.deliveryInfo?.deliveryFee > 0">
              <span>外送費</span>
              <span>${{ orderDetails.deliveryInfo.deliveryFee }}</span>
            </div>

            <div class="d-flex justify-content-between mb-2" v-if="orderDetails.totalDiscount > 0">
              <span class="text-success">優惠折扣</span>
              <span class="text-success">-${{ orderDetails.totalDiscount }}</span>
            </div>

            <div class="d-flex justify-content-between mb-2" v-if="orderDetails.manualAdjustment !== 0">
              <span>{{ orderDetails.manualAdjustment > 0 ? '額外費用' : '額外優惠' }}</span>
              <span :class="orderDetails.manualAdjustment > 0 ? 'text-danger' : 'text-success'">
                {{ orderDetails.manualAdjustment > 0 ? '+' : '' }}${{ orderDetails.manualAdjustment }}
              </span>
            </div>

            <div class="d-flex justify-content-between fw-bold fs-5 text-primary pt-2 border-top">
              <span>總計</span>
              <span>${{ orderDetails.total }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="d-grid gap-2">
          <button class="btn btn-primary py-2" @click="goToMenu">返回菜單</button>
          <button class="btn btn-outline-secondary py-2" @click="checkOrderStatus">查詢訂單狀態</button>
        </div>
      </div>

      <!-- 載入中 -->
      <div v-else class="d-flex justify-content-center align-items-center" style="min-height: 50vh;">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">載入中...</span>
          </div>
          <p>載入訂單資訊中...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import api from '@/api';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();

// 訂單資訊
const orderDetails = ref({});
const orderNumber = ref('');
const isLoading = ref(true);
const errorMessage = ref('');

// 進度條配置
const steps = ref([
  { id: 1, title: '送出訂單', icon: '📄' },
  { id: 2, title: '未付款', icon: '⏳' },
  { id: 3, title: '已付款', icon: '✓' }
]);

// 當前步驟
const currentStep = computed(() => {
  if (!orderDetails.value.status) return 1;

  switch (orderDetails.value.status) {
    case 'unpaid':
      return 2;
    case 'paid':
      return 3;
    case 'cancelled':
      return 1;
    default:
      return 1;
  }
});

// 獲取步驟狀態
const getStepStatus = (stepId) => {
  if (orderDetails.value.status === 'paid' && stepId <= 3) {
    return 'completed';
  }

  if (stepId < currentStep.value) return 'completed';
  if (stepId === currentStep.value) return 'current';
  return 'pending';
};

// 格式化訂單類型
const formatOrderType = (type) => {
  const types = {
    'dine_in': '內用',
    'takeout': '外帶',
    'delivery': '外送'
  };
  return types[type] || type;
};

// 格式化付款方式
const formatPaymentMethod = (method) => {
  const methods = {
    'cash': '現金',
    'credit_card': '信用卡',
    'line_pay': 'LINE Pay',
    'other': '其他'
  };
  return methods[method] || method;
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
  if (sessionStorage.getItem('currentBrandId') && sessionStorage.getItem('currentStoreId')) {
    router.push({
      name: 'menu',
      params: {
        brandId: sessionStorage.getItem('currentBrandId'),
        storeId: sessionStorage.getItem('currentStoreId')
      }
    });
  } else {
    router.push('/');
  }

  // 清空購物車
  cartStore.clearCart();
};

// 查詢訂單狀態
const checkOrderStatus = () => {
  // 重新載入訂單資訊
  fetchOrderDetails();
};

// 獲取訂單詳情
const fetchOrderDetails = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    // 從路由參數或 sessionStorage 獲取必要資訊
    const orderId = route.params.orderId || sessionStorage.getItem('lastOrderId');
    const brandId = cartStore.currentBrand || sessionStorage.getItem('currentBrandId');

    if (!orderId || !brandId) {
      throw new Error('缺少訂單或品牌資訊');
    }

    // 調用 API 獲取訂單詳情
    const response = await api.orderCustomer.getUserOrderById({
      brandId: brandId,
      orderId: orderId
    });

    if (response && response.success) {
      orderDetails.value = response.order;

      // 生成訂單編號顯示
      orderNumber.value = `${orderDetails.value.orderDateCode}${orderDetails.value.sequence}`;
    } else {
      throw new Error('無法獲取訂單資訊');
    }

  } catch (error) {
    console.error('獲取訂單詳情失敗:', error);
    errorMessage.value = '無法載入訂單資訊，請稍後再試';

    // 如果無法獲取訂單，使用購物車的暫時資料
    if (cartStore.items.length > 0) {
      orderDetails.value = {
        orderType: cartStore.orderType,
        paymentMethod: cartStore.paymentMethod,
        subtotal: cartStore.subtotal,
        serviceCharge: cartStore.serviceCharge,
        totalDiscount: cartStore.discountAmount,
        total: cartStore.total,
        status: 'unpaid',
        items: cartStore.items.map(item => ({
          dishInstance: {
            name: item.dishInstance.name,
            options: item.dishInstance.options || []
          },
          quantity: item.quantity,
          subtotal: item.subtotal,
          note: item.note || ''
        })),
        notes: cartStore.notes,
        customerInfo: cartStore.customerInfo,
        dineInInfo: cartStore.dineInInfo,
        deliveryInfo: cartStore.deliveryInfo,
        estimatedPickupTime: cartStore.estimatedPickupTime
      };
      orderNumber.value = 'TEMP' + Date.now().toString().slice(-6);
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
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

.order-item:last-child hr {
  display: none;
}

/* 進度條樣式 */
.progress-container {
  position: relative;
}

.progress-steps {
  position: relative;
  padding: 20px 0;
  margin: 20px 0;
}

.progress-line {
  position: absolute;
  top: 50%;
  left: 60px;
  right: 60px;
  height: 4px;
  background: linear-gradient(90deg, #e9ecef 0%, #f8f9fa 100%);
  border-radius: 2px;
  transform: translateY(-50%);
  z-index: 1;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0d6efd 0%, #0b5ed7 50%, #0a58ca 100%);
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(13, 110, 253, 0.3);
}

.steps-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  max-width: 120px;
}

.step-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 12px;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.step-item.pending .step-circle {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 3px solid #dee2e6;
  color: #6c757d;
}

.step-item.current .step-circle {
  background: linear-gradient(135deg, #198754 0%, #20c997 100%);
  border: 3px solid #ffffff;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(25, 135, 84, 0.4);
}

.step-item.completed .step-circle {
  background: linear-gradient(135deg, #0d6efd 0%, #6610f2 100%);
  border: 3px solid #ffffff;
  color: white;
  box-shadow: 0 4px 16px rgba(13, 110, 253, 0.3);
}

.step-icon {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-label {
  text-align: center;
  margin-top: 4px;
}

.step-title {
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s ease;
  display: block;
  line-height: 1.3;
}

.step-item.pending .step-title {
  color: #6c757d;
}

.step-item.current .step-title {
  color: #198754;
  font-weight: 600;
}

.step-item.completed .step-title {
  color: #0d6efd;
  font-weight: 600;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .progress-line {
    left: 40px;
    right: 40px;
  }

  .step-circle {
    width: 48px;
    height: 48px;
  }

  .step-icon {
    font-size: 16px;
  }

  .step-title {
    font-size: 12px;
  }

  .step-item {
    max-width: 80px;
  }
}

/* 動畫效果 */
.step-item.current .step-circle::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 50%;
  background: linear-gradient(45deg, #198754, #20c997);
  z-index: -1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 576px) {
  .container-wrapper {
    max-width: 100%;
  }
}
</style>
