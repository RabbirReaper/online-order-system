<template>
  <div class="order-confirm-view">
    <!-- 頂部導航欄 -->
    <BNavbar toggleable="lg" type="dark" variant="dark" class="fixed-top">
      <BButton variant="link" class="text-white p-0 me-3" @click="$router.push('/cart')">
        <i class="bi bi-arrow-left fs-4"></i>
      </BButton>
      <BNavbarBrand class="me-auto">訂單確認</BNavbarBrand>
    </BNavbar>

    <div class="container mt-4 mb-5 pb-5">
      <!-- 載入中提示 -->
      <div v-if="isSubmitting" class="loading-container d-flex justify-content-center align-items-center">
        <div class="text-center">
          <BSpinner variant="primary" label="處理中..."></BSpinner>
          <p class="mt-3">正在處理您的訂單，請稍候...</p>
        </div>
      </div>

      <!-- 訂單確認內容 -->
      <template v-else-if="!isSubmitting && !orderSuccess">
        <!-- 訂單摘要 -->
        <div class="order-summary-section mb-4">
          <h4 class="section-title">訂單摘要</h4>
          <OrderSummary />
        </div>

        <hr>

        <!-- 支付方式 -->
        <div class="payment-section mb-4">
          <h4 class="section-title">付款方式</h4>
          <PaymentSelector v-model="paymentMethod" v-model:paymentType="paymentType" />
        </div>

        <hr>

        <!-- 確認提示 -->
        <div class="terms-confirmation mb-4">
          <BFormCheckbox v-model="termsAccepted">
            我已閱讀並同意<a href="#" @click.prevent="showTermsModal = true">服務條款</a>和<a href="#"
              @click.prevent="showPrivacyModal = true">隱私政策</a>
          </BFormCheckbox>
        </div>
      </template>

      <!-- 訂單成功訊息 -->
      <div v-else-if="orderSuccess" class="order-success-container text-center py-5">
        <div class="success-icon-container mb-4">
          <i class="bi bi-check-circle-fill text-success display-1"></i>
        </div>
        <h2 class="mb-3">訂單已成功送出！</h2>
        <p class="lead mb-4">感謝您的訂購，訂單編號：{{ orderNumber }}</p>
        <div class="order-details-card p-4 mb-4 text-start">
          <h5 class="mb-3">訂單明細</h5>
          <div class="row mb-2">
            <div class="col-5"><strong>訂單時間：</strong></div>
            <div class="col-7">{{ formatOrderDateTime(orderDetails.createdAt) }}</div>
          </div>
          <div class="row mb-2">
            <div class="col-5"><strong>訂單類型：</strong></div>
            <div class="col-7">{{ formatOrderType(orderDetails.orderType) }}</div>
          </div>
          <div class="row mb-2">
            <div class="col-5"><strong>付款方式：</strong></div>
            <div class="col-7">{{ formatPaymentMethod(orderDetails.paymentMethod) }}</div>
          </div>
          <div class="row mb-2">
            <div class="col-5"><strong>訂單總額：</strong></div>
            <div class="col-7">${{ orderDetails.total }}</div>
          </div>
        </div>
        <BButton variant="primary" @click="goToMenu" class="me-2">
          <i class="bi bi-shop me-2"></i>返回菜單
        </BButton>
        <BButton variant="outline-primary" @click="viewOrderDetails">
          <i class="bi bi-receipt me-2"></i>查看訂單詳情
        </BButton>
      </div>
    </div>

    <!-- 底部確認訂單按鈕 -->
    <div v-if="!isSubmitting && !orderSuccess" class="place-order-container">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center">
          <div class="order-total">
            <span>總計</span>
            <span class="price fw-bold ms-2">{{ formatPrice(total) }}</span>
          </div>
          <BButton variant="primary" size="lg" class="place-order-btn" :disabled="!isFormValid" @click="placeOrder">
            確認訂單
          </BButton>
        </div>
      </div>
    </div>

    <!-- 服務條款彈窗 -->
    <BModal v-model="showTermsModal" title="服務條款" hide-footer centered>
      <div class="terms-content">
        <h5>1. 訂單與配送</h5>
        <p>訂單一旦確認後無法取消或更改。配送時間可能因天氣、交通等因素而有所變動。</p>

        <h5>2. 退款政策</h5>
        <p>如果收到的餐點有明顯問題，請在收到訂單後30分鐘內聯繫客服處理退款事宜。</p>

        <h5>3. 餐點品質</h5>
        <p>我們致力於提供新鮮、優質的餐點，但餐點的實際外觀可能與圖片略有不同。</p>
      </div>
      <BButton class="mt-3 w-100" variant="primary" @click="showTermsModal = false">
        我已了解
      </BButton>
    </BModal>

    <!-- 隱私政策彈窗 -->
    <BModal v-model="showPrivacyModal" title="隱私政策" hide-footer centered>
      <div class="privacy-content">
        <h5>1. 資料收集</h5>
        <p>我們會收集您的姓名、電話、電子郵件等信息，僅用於處理訂單和提升服務品質。</p>

        <h5>2. 資料安全</h5>
        <p>您的個人資料將被安全存儲，不會在未經您同意的情況下與第三方分享。</p>

        <h5>3. Cookie 使用</h5>
        <p>我們使用 Cookie 來改善用戶體驗和網站功能。您可以在瀏覽器設置中隨時禁用 Cookie。</p>
      </div>
      <BButton class="mt-3 w-100" variant="primary" @click="showPrivacyModal = false">
        我已了解
      </BButton>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useCartStore } from '@/stores/cart';
import OrderSummary from '@/components/customer/order/OrderSummary.vue';
import PaymentSelector from '@/components/customer/order/PaymentSelector.vue';

// 路由相關
const router = useRouter();
const route = useRoute();

// 購物車 store
const cartStore = useCartStore();
const {
  total,
  paymentMethod: storePaymentMethod,
  paymentType: storePaymentType,
  isCartEmpty
} = storeToRefs(cartStore);

// 狀態變數
const isSubmitting = ref(false);
const orderSuccess = ref(false);
const termsAccepted = ref(false);
const paymentMethod = ref(storePaymentMethod.value || 'cash');
const paymentType = ref(storePaymentType.value || 'On-site');
const showTermsModal = ref(false);
const showPrivacyModal = ref(false);
const orderNumber = ref('');
const orderDetails = ref({});

// 檢查購物車是否為空
onMounted(() => {
  if (isCartEmpty.value) {
    router.replace('/cart');
  }
});

// 表單驗證
const isFormValid = computed(() => {
  return termsAccepted.value && paymentMethod.value;
});

// 提交訂單
const placeOrder = async () => {
  if (!isFormValid.value) {
    alert('請閱讀並同意服務條款和隱私政策');
    return;
  }

  // 設置支付方式
  cartStore.setPaymentMethod(paymentMethod.value, paymentType.value);

  isSubmitting.value = true;

  try {
    // 提交訂單
    const result = await cartStore.submitOrder();

    if (result.success) {
      orderSuccess.value = true;
      orderNumber.value = result.order.orderNumber || `${result.order._id}`.substring(0, 8);
      orderDetails.value = result.order;
    } else {
      alert(result.error || '訂單提交失敗，請稍後再試');
    }
  } catch (error) {
    console.error('訂單提交錯誤', error);
    alert('訂單提交發生錯誤，請稍後再試');
  } finally {
    isSubmitting.value = false;
  }
};

// 返回菜單頁面
const goToMenu = () => {
  router.push({
    name: 'menu',
    params: {
      brandId: route.params.brandId,
      storeId: route.params.storeId
    }
  });
};

// 查看訂單詳情
const viewOrderDetails = () => {
  // 此功能需要用戶登入系統才能實現
  // 暫時先返回菜單頁面
  goToMenu();
};

// 格式化價格
const formatPrice = (price) => {
  return `$${price.toLocaleString('zh-TW')}`;
};

// 格式化訂單時間
const formatOrderDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '-';
  const date = new Date(dateTimeStr);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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

// 格式化支付方式
const formatPaymentMethod = (method) => {
  const methods = {
    'cash': '現金支付',
    'credit_card': '信用卡',
    'line_pay': 'LINE Pay',
    'other': '其他方式'
  };
  return methods[method] || method;
};
</script>

<style scoped>
.order-confirm-view {
  padding-top: 56px;
  /* 頂部導航欄高度 */
  padding-bottom: 80px;
  /* 底部按鈕高度 */
}

.loading-container,
.order-success-container {
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

.place-order-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding: 16px 0;
  z-index: 1000;
}

.order-total {
  font-size: 1rem;
}

.order-total .price {
  font-size: 1.3rem;
  color: #e74c3c;
}

.place-order-btn {
  min-width: 140px;
}

.success-icon-container {
  height: 120px;
  width: 120px;
  background-color: rgba(40, 167, 69, 0.1);
  border-radius: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.order-details-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 0 auto;
  max-width: 500px;
}

.terms-content,
.privacy-content {
  max-height: 400px;
  overflow-y: auto;
}
</style>
