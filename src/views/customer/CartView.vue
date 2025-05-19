<template>
  <div class="cart-page">
    <div class="container-wrapper">
      <!-- Header -->
      <div class="cart-header p-3 d-flex align-items-center bg-white shadow-sm">
        <button class="btn btn-link text-dark p-0" @click="goBack">
          <i class="bi bi-arrow-left fs-4"></i>
        </button>
        <h5 class="mb-0 mx-auto">購物車</h5>
      </div>

      <div class="divider"></div>

      <!-- Empty Cart Message -->
      <div v-if="cartItems.length === 0" class="text-center p-5 text-muted">
        <i class="bi bi-cart-x fs-1"></i>
        <p class="mt-3">購物車是空的</p>
        <button class="btn btn-primary mt-3" @click="goBack">返回菜單</button>
      </div>

      <!-- Cart Content -->
      <div v-else class="cart-content p-3">
        <!-- Order Items -->
        <div class="order-items mb-4">
          <h6 class="mb-3 fw-bold">訂單內容</h6>
          <CartItem v-for="(item, index) in cartItems" :key="index" :item="item" :index="index" @remove="removeFromCart"
            @edit="editItem" @quantity-change="updateCartItemQuantity" />
        </div>

        <div class="divider"></div>

        <!-- Order Notes -->
        <div class="order-notes mb-4">
          <h6 class="mb-3 fw-bold">訂單備註</h6>
          <textarea class="form-control" rows="2" placeholder="有特殊需求嗎？請告訴我們" v-model="orderRemarks"></textarea>
        </div>

        <div class="divider"></div>

        <!-- Member Coupon -->
        <div class="member-coupon mb-4">
          <h6 class="mb-3 fw-bold">會員折價券</h6>
          <div class="d-flex align-items-center">
            <select class="form-select" v-model="selectedCoupon">
              <option value="">不使用優惠券</option>
              <option v-for="coupon in availableCoupons" :key="coupon.id" :value="coupon.id">
                {{ coupon.name }} - 折抵 ${{ coupon.value }}
              </option>
            </select>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Order Type Selection -->
        <OrderTypeSelector v-model:order-type="orderType" v-model:table-number="tableNumber"
          v-model:delivery-address="deliveryAddress" v-model:pickup-time="pickupTime"
          v-model:scheduled-time="scheduledTime" @update:delivery-fee="updateDeliveryFee" />

        <div class="divider"></div>

        <!-- Customer Information -->
        <CustomerInfoForm v-model:customer-info="customerInfo" v-model:payment-method="paymentMethod" />

        <div class="divider"></div>

        <!-- Order Total -->
        <div class="order-total mb-4">
          <div class="d-flex justify-content-between mb-2">
            <span>小計</span>
            <span>${{ calculateSubtotal() }}</span>
          </div>
          <div class="d-flex justify-content-between mb-2" v-if="couponDiscount > 0">
            <span>優惠折扣</span>
            <span>-${{ couponDiscount }}</span>
          </div>
          <div class="d-flex justify-content-between mb-2" v-if="deliveryFee > 0">
            <span>外送費</span>
            <span>${{ deliveryFee }}</span>
          </div>
          <div class="d-flex justify-content-between fw-bold">
            <span>總計</span>
            <span>${{ calculateTotal() }}</span>
          </div>
        </div>
      </div>

      <!-- Fixed Bottom Button -->
      <div v-if="cartItems.length > 0"
        class="checkout-button position-fixed bottom-0 start-50 translate-middle-x w-100 bg-white p-3 shadow-lg d-flex justify-content-center"
        style="max-width: 540px;">
        <div class="container-button" style="max-width: 540px;">
          <button class="btn w-100 py-2 checkout-btn" @click="checkout" :disabled="!isFormValid">
            前往結帳 - ${{ calculateTotal() }}
          </button>
        </div>
      </div>

      <!-- Modal Components will be implemented here -->
      <!-- 結帳確認框 -->
      <div class="modal fade" id="confirmOrderModal" tabindex="-1" aria-labelledby="confirmOrderModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="confirmOrderModalLabel">確認訂單</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <!-- 確認訂單內容 -->
              <p>請確認您的訂單資訊</p>
              <!-- 這裡顯示訂單摘要 -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">返回修改</button>
              <button type="button" class="btn btn-primary" @click="submitOrder">確認送出</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import CartItem from '@/components/customer/cart/CartItem.vue';
import OrderTypeSelector from '@/components/customer/cart/OrderTypeSelector.vue';
import CustomerInfoForm from '@/components/customer/cart/CustomerInfoForm.vue';

const router = useRouter();
const cartStore = useCartStore();

// 購物車內容
const cartItems = computed(() => cartStore.items);

// 表單資料
const orderRemarks = ref('');
const selectedCoupon = ref('');
const orderType = ref('selfPickup'); // 'dineIn', 'selfPickup', 'delivery'
const tableNumber = ref('');
const deliveryAddress = ref('');
const pickupTime = ref('asap'); // 'asap', 'scheduled'
const scheduledTime = ref('');
const deliveryFee = ref(0);
const couponDiscount = ref(0);
const paymentMethod = ref('現金');
const customerInfo = ref({
  name: '',
  phone: ''
});

// 模擬優惠券數據
const availableCoupons = ref([
  { id: 'coupon1', name: '新會員折扣', value: 50 },
  { id: 'coupon2', name: '生日特惠', value: 100 },
  { id: 'coupon3', name: '滿千折百', value: 100 }
]);

// Modals (會在onMounted中初始化)
let confirmModal = null;

// 計算屬性 - 修正響應式依賴
const isFormValid = computed(() => {
  // 如果是內用，姓名電話非必填
  if (orderType.value === 'dineIn') {
    // 內用只檢查桌號
    return tableNumber.value && tableNumber.value.trim() !== '';
  }

  // 外帶和外送檢查姓名電話必填
  const name = customerInfo.value?.name || '';
  const phone = customerInfo.value?.phone || '';

  if (!name.trim() || !phone.trim()) {
    return false;
  }

  // 根據訂單類型檢查額外字段
  if (orderType.value === 'delivery' && (!deliveryAddress.value || !deliveryAddress.value.trim())) {
    return false;
  }

  if (pickupTime.value === 'scheduled' && (!scheduledTime.value || !scheduledTime.value.trim())) {
    return false;
  }

  return true;
});

// 方法
const goBack = () => {
  if (cartStore.currentBrand && cartStore.currentStore) {
    router.push({
      name: 'menu',
      params: {
        brandId: cartStore.currentBrand,
        storeId: cartStore.currentStore
      }
    });
  } else {
    router.go(-1);
  }
};

const removeFromCart = (index) => {
  cartStore.removeItem(index);
};

// 修正後的 editItem 函數
const editItem = (index) => {
  const item = cartItems.value[index];

  // 確保有品牌和店鋪ID
  if (!cartStore.currentBrand || !cartStore.currentStore) {
    console.error('缺少品牌或店鋪ID:', {
      brandId: cartStore.currentBrand,
      storeId: cartStore.currentStore
    });
    alert('無法編輯商品：缺少必要資訊');
    return;
  }

  // 導航到商品詳情頁面進行編輯
  router.push({
    name: 'dish-detail',
    params: {
      brandId: cartStore.currentBrand,
      storeId: cartStore.currentStore,
      dishId: item.dishInstance.templateId || item.dishInstance._id
    }
  });
};

const updateCartItemQuantity = (index, change) => {
  const item = cartItems.value[index];
  const newQuantity = item.quantity + change;
  cartStore.updateItemQuantity(index, newQuantity);
};

const updateDeliveryFee = (fee) => {
  deliveryFee.value = fee;
};

const calculateSubtotal = () => {
  return cartStore.subtotal;
};

const calculateTotal = () => {
  return cartStore.subtotal - couponDiscount.value + deliveryFee.value;
};

const checkout = () => {
  if (!isFormValid.value) {
    alert('請填寫所有必要資訊');
    return;
  }

  // 顯示確認對話框
  if (confirmModal) {
    confirmModal.show();
  }
};

const submitOrder = async () => {
  // 準備符合Order schema的訂單資料
  const orderData = {
    // 基本訂單資訊 - 符合schema
    store: cartStore.currentStore,  // ObjectId
    brand: cartStore.currentBrand,  // ObjectId
    orderType: orderType.value,     // 'dine_in', 'takeout', 'delivery'

    // 訂單項目 - 注意：這裡假設dishInstance已經先在後端創建
    items: cartItems.value.map(item => ({
      // 前端需要先創建DishInstance，這裡只傳ID
      dishInstance: item.dishInstance.templateId, // 實際應該是創建後的DishInstance ObjectId
      quantity: item.quantity,
      subtotal: item.subtotal,
      note: item.note || ''
    })),

    // 價格計算 - 符合schema
    subtotal: calculateSubtotal(),
    serviceCharge: 0, // 目前沒有服務費
    totalDiscount: couponDiscount.value,
    total: calculateTotal(),

    // 付款資訊 - 符合schema格式
    paymentType: 'On-site', // 目前都是現場付款
    paymentMethod: (() => {
      switch (paymentMethod.value) {
        case '現金': return 'cash';
        case '信用卡': return 'credit_card';
        case 'Line Pay': return 'line_pay';
        default: return 'other';
      }
    })(),

    // 客戶資訊 - 符合schema
    customerInfo: {
      name: customerInfo.value.name || null,
      phone: customerInfo.value.phone || null
    },

    // 根據訂單類型設置特定資訊
    ...(orderType.value === 'delivery' && {
      deliveryInfo: {
        address: deliveryAddress.value,
        deliveryFee: deliveryFee.value,
        estimatedTime: pickupTime.value === 'scheduled' ? new Date(scheduledTime.value) : null
      }
    }),

    ...(orderType.value === 'dineIn' && {
      dineInInfo: {
        tableNumber: tableNumber.value,
        numberOfGuests: 1
      }
    }),

    ...(orderType.value === 'takeout' && pickupTime.value === 'scheduled' && {
      estimatedPickupTime: new Date(scheduledTime.value)
    }),

    // 折扣資訊 - 符合schema array格式
    discounts: selectedCoupon.value ? [{
      couponId: selectedCoupon.value,
      amount: couponDiscount.value
    }] : [],

    // 訂單備註
    notes: orderRemarks.value || null,

    // 外送平台相關（目前為空）
    deliveryPlatform: '',
    platformOrderId: '',

    // 其他預設值
    status: 'pending',
    manualAdjustment: 0
  };

  // Console log 訂單資料
  console.log('=== 準備送出的訂單資料 (符合Order Schema) ===');
  console.log(JSON.stringify(orderData, null, 2));
  console.log('===========================================');

  try {
    // 設置訂單類型和客戶資訊
    cartStore.setOrderType(orderType.value);
    cartStore.setCustomerInfo(customerInfo.value);

    // 根據訂單類型設置相關資訊
    if (orderType.value === 'dineIn') {
      cartStore.setDineInInfo({ tableNumber: tableNumber.value, numberOfGuests: 1 });
    } else if (orderType.value === 'delivery') {
      cartStore.setDeliveryInfo({
        address: deliveryAddress.value,
        deliveryFee: deliveryFee.value
      });
    }

    // 設置訂單備註
    cartStore.setNotes(orderRemarks.value);

    // 設置付款方式
    cartStore.setPaymentMethod(paymentMethod.value);

    // 優惠券處理（示範）
    if (selectedCoupon.value) {
      const coupon = availableCoupons.value.find(c => c.id === selectedCoupon.value);
      if (coupon) {
        cartStore.applyCoupon({
          couponId: coupon.id,
          amount: coupon.value
        });
      }
    }

    // 這裡應該使用api提交訂單
    // const result = await cartStore.submitOrder();

    // 關閉模態框
    if (confirmModal) {
      confirmModal.hide();
    }

    // 導航到訂單確認頁面 - 提供必要的路由參數
    router.push({
      name: 'order-confirm',
      params: {
        brandId: cartStore.currentBrand,
        storeId: cartStore.currentStore
      }
    });

  } catch (error) {
    console.error('提交訂單失敗:', error);
    alert('訂單提交失敗，請稍後再試');
  }
};

// 監聽優惠券選擇變更
watch(selectedCoupon, (newValue) => {
  if (newValue) {
    const coupon = availableCoupons.value.find(c => c.id === newValue);
    if (coupon) {
      couponDiscount.value = coupon.value;
      return;
    }
  }
  couponDiscount.value = 0;
});

// 生命週期鉤子
onMounted(() => {
  window.scrollTo(0, 0)
  // 設置默認預約時間
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30);
  scheduledTime.value = date.toISOString().slice(0, 16);

  // 初始化模態框
  import('bootstrap/js/dist/modal').then(module => {
    const Modal = module.default;
    const modalElement = document.getElementById('confirmOrderModal');
    if (modalElement) {
      confirmModal = new Modal(modalElement);
    }
  });
});
</script>

<style scoped>
.cart-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 80px;
  /* Space for the fixed bottom button */
  display: flex;
  justify-content: center;
}

.container-wrapper {
  max-width: 540px;
  width: 100%;
  background-color: white;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  min-height: 100vh;
  position: relative;
}

.cart-header {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.divider {
  height: 8px;
  background-color: #f0f0f0;
  margin-bottom: 15px;
  width: 100%
}

.checkout-btn {
  border-radius: 8px;
  background-color: #7a5b0c;
  color: white;
  transition: background-color 0.3s;
}

.checkout-btn:hover:not(:disabled) {
  background-color: #4a7dde;
}

.checkout-btn:disabled {
  background-color: #b9cdf2;
  color: #ffffff;
}

.container-button {
  width: 100%;
  padding: 0 15px;
}

/* Fix for iOS input styling */
input[type="datetime-local"] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

@media (max-width: 576px) {
  .container-wrapper {
    max-width: 100%;
  }
}
</style>
