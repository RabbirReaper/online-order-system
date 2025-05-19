<template>
  <div class="customer-info-container mb-4">
    <!-- 顧客資訊 -->
    <h6 class="mb-3 fw-bold">顧客資訊</h6>
    <div class="row g-3 mb-3">
      <div class="col-md-6">
        <label for="customerName" class="form-label">姓名 <span class="text-danger">*</span></label>
        <input type="text" class="form-control" id="customerName" :value="localCustomerInfo.name" @input="updateName"
          placeholder="請輸入姓名">
      </div>
      <div class="col-md-6">
        <label for="customerPhone" class="form-label">電話 <span class="text-danger">*</span></label>
        <input type="tel" class="form-control" id="customerPhone" :value="localCustomerInfo.phone" @input="updatePhone"
          placeholder="請輸入聯絡電話">
      </div>
      <!-- Email 欄位暫時註解，後續採用手機號碼簡訊或Line訊息通知 -->
      <!--
      <div class="col-12">
        <label for="customerEmail" class="form-label">Email</label>
        <input type="email" class="form-control" id="customerEmail" v-model="localCustomerInfo.email"
          placeholder="選填，訂單確認將發送到您的信箱">
      </div>
      -->
    </div>

    <!-- 付款方式 -->
    <h6 class="mb-3 fw-bold">付款方式</h6>
    <div class="d-flex flex-wrap">
      <div class="form-check me-4 mb-3">
        <input class="form-check-input" type="radio" name="paymentMethod" id="cashPayment" value="現金"
          v-model="localPaymentMethod">
        <label class="form-check-label" for="cashPayment">現場付款</label>
      </div>
      <div class="form-check me-4 mb-3">
        <input class="form-check-input" type="radio" name="paymentMethod" id="creditCardPayment" value="信用卡"
          v-model="localPaymentMethod">
        <label class="form-check-label" for="creditCardPayment">信用卡付款</label>
      </div>
      <div class="form-check mb-3">
        <input class="form-check-input" type="radio" name="paymentMethod" id="linePayPayment" value="Line Pay"
          v-model="localPaymentMethod">
        <label class="form-check-label" for="linePayPayment">Line Pay</label>
      </div>
    </div>

    <!-- 信用卡資訊（僅在選擇信用卡付款時顯示） -->
    <div v-if="localPaymentMethod === '信用卡'" class="credit-card-form mt-3">
      <p class="text-info mb-3">
        <i class="bi bi-info-circle-fill me-2"></i>
        本網站使用 SSL 加密技術保護您的付款資訊
      </p>
      <div class="row g-3">
        <div class="col-12">
          <label for="cardNumber" class="form-label">卡號</label>
          <input type="text" class="form-control" id="cardNumber" placeholder="請輸入 16 位卡號" maxlength="19"
            v-model="creditCardInfo.number" @input="formatCardNumber">
        </div>
        <div class="col-md-6">
          <label for="expiryDate" class="form-label">有效期限</label>
          <input type="text" class="form-control" id="expiryDate" placeholder="MM/YY" maxlength="5"
            v-model="creditCardInfo.expiry" @input="formatExpiryDate">
        </div>
        <div class="col-md-6">
          <label for="cvv" class="form-label">安全碼</label>
          <input type="password" class="form-control" id="cvv" placeholder="CVV" maxlength="3"
            v-model="creditCardInfo.cvv">
        </div>
        <div class="col-12">
          <label for="cardHolder" class="form-label">持卡人姓名</label>
          <input type="text" class="form-control" id="cardHolder" placeholder="請輸入卡片上的姓名" v-model="creditCardInfo.name">
        </div>
      </div>

      <!-- 暫時隱藏電子支付選項，僅顯示提示 -->
      <div class="alert alert-warning mt-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        信用卡支付功能目前處於開發階段，暫時僅支援現場付款。
      </div>
    </div>

    <!-- Line Pay 提示（僅在選擇 Line Pay 時顯示） -->
    <div v-if="localPaymentMethod === 'Line Pay'" class="line-pay-info mt-3">
      <div class="alert alert-warning">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Line Pay 支付功能目前處於開發階段，暫時僅支援現場付款。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  customerInfo: {
    type: Object,
    default: () => ({
      name: '',
      phone: '',
      // email: '' // 暫時註解
    })
  },
  paymentMethod: {
    type: String,
    default: '現金'
  }
});

const emit = defineEmits(['update:customerInfo', 'update:paymentMethod']);

// 本地狀態 - 避免直接使用 reactive 物件的引用
const localCustomerInfo = ref({
  name: props.customerInfo.name || '',
  phone: props.customerInfo.phone || ''
});
const localPaymentMethod = ref(props.paymentMethod);

// 信用卡資訊
const creditCardInfo = ref({
  number: '',
  expiry: '',
  cvv: '',
  name: ''
});

// 手動處理輸入事件，避免遞歸更新
const updateName = (event) => {
  localCustomerInfo.value.name = event.target.value;
  emit('update:customerInfo', { ...localCustomerInfo.value });
};

const updatePhone = (event) => {
  localCustomerInfo.value.phone = event.target.value;
  emit('update:customerInfo', { ...localCustomerInfo.value });
};

// 只在 props 變化時更新本地狀態，避免雙向綁定造成的遞歸
watch(() => props.customerInfo, (newVal) => {
  if (newVal.name !== localCustomerInfo.value.name ||
    newVal.phone !== localCustomerInfo.value.phone) {
    localCustomerInfo.value = {
      name: newVal.name || '',
      phone: newVal.phone || ''
    };
  }
}, { deep: true });

watch(() => props.paymentMethod, (newVal) => {
  if (newVal !== localPaymentMethod.value) {
    localPaymentMethod.value = newVal;
  }
});

// 監聽付款方式變化
watch(localPaymentMethod, (newVal) => {
  emit('update:paymentMethod', newVal);
});

// 格式化信用卡號碼（每 4 位加一個空格）
const formatCardNumber = (e) => {
  let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

  if (value.length > 0) {
    value = value.match(new RegExp('.{1,4}', 'g')).join(' ');
  }

  creditCardInfo.value.number = value;
};

// 格式化有效期限（自動加入 / 分隔符）
const formatExpiryDate = (e) => {
  let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

  if (value.length > 2) {
    value = value.substr(0, 2) + '/' + value.substr(2, 2);
  }

  creditCardInfo.value.expiry = value;
};
</script>

<style scoped>
.form-check-input {
  border: 2px solid #495057;
}

.form-check-input:checked {
  background-color: #d35400;
  border-color: #d35400;
}

.customer-info-container label {
  font-weight: 500;
}

.credit-card-form {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #dee2e6;
}

.alert {
  margin-bottom: 0;
}

.text-danger {
  color: #dc3545;
}
</style>
