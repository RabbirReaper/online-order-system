<template>
  <div class="bg-light sidebar py-3 d-flex flex-column">
    <!-- 購物車詳情 -->
    <div class="order-details flex-grow-1 overflow-auto">
      <template v-if="counterStore.selectedOrder && isOrdersActive">
        <!-- 訂單詳情模式 -->
        <OrderDetails :selected-order="counterStore.selectedOrder" @open-adjustment-modal="openAdjustmentModal"
          @open-discount-modal="openDiscountModal" />
      </template>

      <template v-else>
        <!-- 購物車模式 -->
        <ShoppingCart :cart="counterStore.cart" :subtotal="counterStore.subtotal" :adjustment="counterStore.adjustment"
          :discount="counterStore.discount" :total="counterStore.total" @remove-from-cart="counterStore.removeFromCart"
          @select-current-item="handleSelectCurrentItem" @update-quantity="counterStore.updateQuantity"
          @open-adjustment-modal="openCartAdjustmentModal" @open-discount-modal="openCartDiscountModal" />
      </template>
    </div>

    <!-- 操作按鈕 -->
    <ActionButtons :is-orders-active="isOrdersActive" :selected-order="counterStore.selectedOrder"
      :cart-length="counterStore.cart.length" :is-checking-out="counterStore.isCheckingOut"
      @update-order-status="updateOrderStatus" @print-order="printOrder" @cancel-order="counterStore.cancelOrder"
      @submit-order="submitOrder" />

    <!-- 模態框 -->
    <AdjustmentModal v-if="showAdjustmentModal" :temp-adjustment="tempAdjustment" :adjustment-type="adjustmentType"
      @close="showAdjustmentModal = false" @set-adjustment-type="setAdjustmentType"
      @append-adjustment="appendToAdjustment" @clear-adjustment="clearAdjustment" @confirm="confirmAdjustment" />

    <DiscountModal v-if="showDiscountModal" :temp-discount="tempDiscount" @close="showDiscountModal = false"
      @append-discount="appendToDiscount" @clear-discount="clearDiscount" @confirm="confirmDiscount" />

    <CheckoutModal v-model="showCheckoutModal" :total="checkoutTotal" @close="handleCloseCheckoutModal"
      @payment-selected="handlePaymentSelected" />

    <CashCalculatorModal v-if="showCashCalculatorModal" :total="checkoutTotal" @close="handleCloseCashCalculator"
      @complete="handleCashPayment" />

    <!-- 桌號輸入模態框 -->
    <TableNumberModal v-if="showTableNumberModal" @close="showTableNumberModal = false"
      @confirm="handleTableNumberConfirm" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCounterStore } from '@/stores/counter';
import api from '@/api';

import OrderDetails from './OrderDetails.vue';
import ShoppingCart from './ShoppingCart.vue';
import ActionButtons from './ActionButtons.vue';
import AdjustmentModal from '../modals/AdjustmentModal.vue';
import DiscountModal from '../modals/DiscountModal.vue';
import CheckoutModal from '../modals/CheckoutModal.vue';
import CashCalculatorModal from '../modals/CashCalculatorModal.vue';
import TableNumberModal from '../modals/TableNumberModal.vue';

const props = defineProps({
  activeComponent: {
    type: String,
    default: 'DineIn'
  }
});

// 使用 Pinia store
const counterStore = useCounterStore();

// 調帳和折扣相關狀態
const showAdjustmentModal = ref(false);
const showDiscountModal = ref(false);
const tempAdjustment = ref(0);
const tempDiscount = ref(0);
const adjustmentType = ref('add'); // 'add' 或 'subtract'
const editingOrder = ref(null);

// 結帳相關狀態
const showCheckoutModal = ref(false);
const showCashCalculatorModal = ref(false);
const showTableNumberModal = ref(false);
const checkoutTotal = ref(0);
const checkoutOrderId = ref(null);

// 計算屬性
const isOrdersActive = computed(() => counterStore.activeComponent === 'Orders');

// 更新訂單狀態
const updateOrderStatus = async (orderId, status) => {
  try {
    if (status === 'paid') {
      // 如果是完成訂單（結帳），顯示結帳模態框
      checkoutOrderId.value = orderId;
      checkoutTotal.value = calculateOrderTotal(counterStore.selectedOrder);
      showCheckoutModal.value = true;
    } else {
      // 其他狀態變更
      const response = await api.orderAdmin.updateOrderStatus({
        brandId: counterStore.currentBrand,
        storeId: counterStore.currentStore,
        orderId: orderId,
        status: status
      });

      if (response.success) {
        // 重新載入訂單列表
        await counterStore.fetchTodayOrders(counterStore.currentBrand, counterStore.currentStore);

        // 如果是當前選中的訂單，重新載入詳情
        if (counterStore.selectedOrder && counterStore.selectedOrder._id === orderId) {
          const updatedOrder = await api.orderAdmin.getOrderById({
            brandId: counterStore.currentBrand,
            storeId: counterStore.currentStore,
            orderId: orderId
          });
          if (updatedOrder.success) {
            counterStore.selectOrder(updatedOrder.order);
          }
        }
      }
    }
  } catch (error) {
    console.error('更新訂單狀態失敗:', error);
    alert(error.message || '更新訂單狀態失敗');
  }
};

// 處理付款方式選擇
const handlePaymentSelected = async (paymentData) => {
  const { paymentMethod, paymentType } = paymentData;

  try {
    if (paymentMethod === 'cash') {
      // 現金付款 - 開啟現金計算器
      showCashCalculatorModal.value = true;
    } else {
      // 信用卡或 LINE Pay - 直接完成付款
      await completePayment(paymentMethod, paymentType);
    }
  } catch (error) {
    console.error('處理付款失敗:', error);
    alert('處理付款失敗: ' + error.message);
  }
};

// 完成付款
const completePayment = async (paymentMethod = 'cash', paymentType = 'On-site') => {
  try {
    // 更新訂單狀態為已付款，並記錄付款方式
    const response = await api.orderAdmin.updateOrder({
      brandId: counterStore.currentBrand,
      storeId: counterStore.currentStore,
      orderId: counterStore.selectedOrder._id,
      updateData: {
        status: 'paid',
        paymentMethod: paymentMethod,
        paymentType: paymentType
      }
    });

    if (response.success) {
      showCheckoutModal.value = false;
      showCashCalculatorModal.value = false;
      await counterStore.fetchTodayOrders(counterStore.currentBrand, counterStore.currentStore);
    }
  } catch (error) {
    console.error('完成付款失敗:', error);
    throw error;
  }
};

// 關閉現金計算器
const handleCloseCashCalculator = () => {
  showCashCalculatorModal.value = false;
};

// 關閉結帳模態窗
const handleCloseCheckoutModal = () => {
  showCheckoutModal.value = false;
  checkoutOrderId.value = null;
};

// 處理現金付款完成
const handleCashPayment = async () => {
  try {
    await completePayment('cash', 'On-site');
  } catch (error) {
    console.error('現金付款處理失敗:', error);
    alert('現金付款處理失敗');
  }
};

// 列印訂單
const printOrder = () => {
  if (!counterStore.selectedOrder) return;

  // 創建列印窗口（簡化版本）
  const printWindow = window.open('', '_blank');
  const order = counterStore.selectedOrder;

  let printContent = `
    <html>
      <head>
        <title>訂單 #${order.orderNumber || order._id.slice(-6)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { margin-bottom: 20px; }
          .order-info { margin-bottom: 20px; }
          .items { margin-bottom: 20px; }
          .total { font-weight: bold; text-align: right; margin-top: 10px; }
        </style>
      </head>
      <body>
        <h1>訂單 #${order.orderNumber || order._id.slice(-6)}</h1>
        <div class="order-info">
          <p>訂單時間: ${counterStore.formatDateTime(order.createdAt)}</p>
          <p>取餐方式: ${formatOrderType(order.orderType)}</p>
          ${order.dineInInfo?.tableNumber ? `<p>桌號: ${order.dineInInfo.tableNumber}</p>` : ''}
        </div>
        <div class="items">
          <h3>餐點明細</h3>
          ${order.items.map(item => `
            <div>
              <strong>${item.name}</strong> x${item.quantity} - $${item.subtotal}
              ${item.note ? `<br><small>備註: ${item.note}</small>` : ''}
            </div>
          `).join('<br>')}
        </div>
        <div class="total">
          總計: $${calculateOrderTotal(order)}
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
};

// 提交訂單
const submitOrder = async () => {
  if (counterStore.cart.length === 0) {
    alert('購物車是空的');
    return;
  }

  try {
    // 根據當前組件決定訂單類型
    const orderType = props.activeComponent === 'DineIn' ? 'dine_in' : 'takeout';

    if (orderType === 'dine_in') {
      // 內用需要桌號
      showTableNumberModal.value = true;
    } else {
      // 外帶直接結帳
      await counterStore.checkout(orderType);
      counterStore.setActiveComponent('Orders');
    }
  } catch (error) {
    console.error('提交訂單失敗:', error);
    alert(error.message || '提交訂單失敗');
  }
};

// 處理桌號確認
const handleTableNumberConfirm = async (tableNumber) => {
  showTableNumberModal.value = false;

  try {
    await counterStore.checkout('dine_in', { tableNumber });
    counterStore.setActiveComponent('Orders');
  } catch (error) {
    console.error('提交訂單失敗:', error);
    alert(error.message || '提交訂單失敗');
  }
};

// 處理選擇當前編輯項目 - 簡化版本
const handleSelectCurrentItem = (item, index) => {
  // 直接設置編輯狀態
  counterStore.selectCurrentItem(item, index);
  console.log('開始編輯項目:', item, 'index:', index);
};

// 調帳相關函數
const openCartAdjustmentModal = () => {
  tempAdjustment.value = Math.abs(counterStore.adjustment);
  adjustmentType.value = counterStore.adjustment >= 0 ? 'add' : 'subtract';
  editingOrder.value = null;
  showAdjustmentModal.value = true;
};

const openAdjustmentModal = (order) => {
  if (order) {
    editingOrder.value = order;
    tempAdjustment.value = Math.abs(order.manualAdjustment || 0);
    adjustmentType.value = (order.manualAdjustment || 0) >= 0 ? 'add' : 'subtract';
    showAdjustmentModal.value = true;
  }
};

const setAdjustmentType = (type) => {
  adjustmentType.value = type;
  tempAdjustment.value = 0;
};

const appendToAdjustment = (num) => {
  tempAdjustment.value = parseInt(`${tempAdjustment.value}${num}`);
};

const clearAdjustment = () => {
  tempAdjustment.value = 0;
};

const confirmAdjustment = async () => {
  const newAdjustment = adjustmentType.value === 'add' ? tempAdjustment.value : -tempAdjustment.value;

  if (editingOrder.value) {
    // 更新訂單調帳
    try {
      const response = await api.orderAdmin.updateOrder({
        brandId: counterStore.currentBrand,
        storeId: counterStore.currentStore,
        orderId: editingOrder.value._id,
        updateData: { manualAdjustment: newAdjustment }
      });

      if (response.success) {
        await counterStore.fetchTodayOrders(counterStore.currentBrand, counterStore.currentStore);
        if (counterStore.selectedOrder && counterStore.selectedOrder._id === editingOrder.value._id) {
          const updatedOrder = await api.orderAdmin.getOrderById({
            brandId: counterStore.currentBrand,
            storeId: counterStore.currentStore,
            orderId: editingOrder.value._id
          });
          if (updatedOrder.success) {
            counterStore.selectOrder(updatedOrder.order);
          }
        }
      }
    } catch (error) {
      console.error('更新訂單調帳失敗:', error);
      alert('調整訂單失敗');
    }
  } else {
    // 更新購物車調帳
    counterStore.setAdjustment(newAdjustment);
  }

  showAdjustmentModal.value = false;
};

// 折扣相關函數
const openCartDiscountModal = () => {
  tempDiscount.value = counterStore.discount;
  editingOrder.value = null;
  showDiscountModal.value = true;
};

const openDiscountModal = (order) => {
  if (order) {
    editingOrder.value = order;
    const totalDiscount = order.discounts?.reduce((total, discount) => total + discount.amount, 0) || 0;
    tempDiscount.value = totalDiscount;
    showDiscountModal.value = true;
  }
};

const appendToDiscount = (num) => {
  tempDiscount.value = parseInt(`${tempDiscount.value}${num}`);
};

const clearDiscount = () => {
  tempDiscount.value = 0;
};

const confirmDiscount = async () => {
  if (editingOrder.value) {
    // 更新訂單折扣
    try {
      const response = await api.orderAdmin.updateOrder({
        brandId: counterStore.currentBrand,
        storeId: counterStore.currentStore,
        orderId: editingOrder.value._id,
        updateData: {
          discounts: tempDiscount.value > 0 ? [{ amount: tempDiscount.value }] : []
        }
      });

      if (response.success) {
        await counterStore.fetchTodayOrders(counterStore.currentBrand, counterStore.currentStore);
      }
    } catch (error) {
      console.error('更新訂單折扣失敗:', error);
      alert('調整訂單失敗');
    }
  } else {
    // 更新購物車折扣
    counterStore.setDiscount(tempDiscount.value);
  }

  showDiscountModal.value = false;
};

// 輔助函數
const calculateOrderTotal = (order) => {
  if (!order.items) return 0;

  const itemsTotal = order.items.reduce((total, item) => total + (item.subtotal || 0), 0);
  const adjustment = order.manualAdjustment || 0;
  const discounts = order.discounts?.reduce((total, discount) => total + discount.amount, 0) || 0;

  return Math.max(0, itemsTotal + adjustment - discounts);
};

const formatOrderType = (orderType) => {
  const typeMap = {
    'dine_in': '內用',
    'takeout': '外帶',
    'delivery': '外送'
  };
  return typeMap[orderType] || orderType;
};
</script>

<style scoped>
.sidebar {
  height: 100vh;
  overflow-y: auto;
}

.order-details {
  max-height: calc(100vh - 200px);
}
</style>
