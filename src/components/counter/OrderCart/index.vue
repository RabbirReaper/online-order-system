<template>
  <div class="bg-light sidebar py-3 d-flex flex-column">
    <!-- 購物車詳情 -->
    <div class="order-details flex-grow-1 overflow-auto">
      <template v-if="counterStore.selectedOrder && isOrdersActive">
        <!-- 訂單詳情模式 -->
        <OrderDetails :selected-order="counterStore.selectedOrder" />
      </template>

      <template v-else>
        <!-- 購物車模式 -->
        <ShoppingCart @select-current-item="handleSelectCurrentItem" />
      </template>
    </div>

    <!-- 操作按鈕 -->
    <ActionButtons
      :is-orders-active="isOrdersActive"
      :selected-order="counterStore.selectedOrder"
      :cart-length="counterStore.cart.length"
      :is-checking-out="counterStore.isCheckingOut"
      @update-order-status="updateOrderStatus"
      @print-order="printOrder"
      @cancel-order="counterStore.cancelOrder"
      @submit-order="submitOrder"
    />

    <!-- 模態框 -->
    <AdjustmentModal
      v-if="counterStore.modals.adjustment.show"
      :temp-adjustment="counterStore.modals.adjustment.tempAdjustment"
      :adjustment-type="counterStore.modals.adjustment.adjustmentType"
      @close="counterStore.closeModal('adjustment')"
      @set-adjustment-type="counterStore.setAdjustmentType"
      @append-adjustment="counterStore.appendToAdjustment"
      @clear-adjustment="counterStore.clearAdjustment"
      @confirm="handleConfirmAdjustment"
    />

    <CheckoutModal
      v-model="counterStore.modals.checkout.show"
      :total="counterStore.modals.checkout.total"
      @close="counterStore.closeModal('checkout')"
      @payment-selected="handlePaymentSelected"
    />

    <CashCalculatorModal
      v-if="counterStore.modals.cashCalculator.show"
      :total="counterStore.modals.cashCalculator.total"
      @close="counterStore.closeModal('cashCalculator')"
      @complete="handleCashPayment"
    />

    <!-- 桌號輸入模態框 -->
    <TableNumberModal
      v-if="counterStore.modals.tableNumber.show"
      @close="counterStore.closeModal('tableNumber')"
      @confirm="handleTableNumberConfirm"
    />

    <!-- 取消確認模態框 -->
    <CancelConfirmModal
      v-model="showCancelModal"
      :order-info="orderToCancel"
      @confirm="handleCancelConfirm"
      @cancel="handleCancelModalClose"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCounterStore } from '@/stores/counter'
import api from '@/api'

import OrderDetails from './OrderDetails.vue'
import ShoppingCart from './ShoppingCart.vue'
import ActionButtons from './ActionButtons.vue'
import AdjustmentModal from '../modals/AdjustmentModal.vue'
import CheckoutModal from '../modals/CheckoutModal.vue'
import CashCalculatorModal from '../modals/CashCalculatorModal.vue'
import TableNumberModal from '../modals/TableNumberModal.vue'
import CancelConfirmModal from '../modals/CancelConfirmModal.vue'

const props = defineProps({
  activeComponent: {
    type: String,
    default: 'DineIn',
  },
})

// 使用 Pinia store
const counterStore = useCounterStore()

// 取消確認modal相關狀態
const showCancelModal = ref(false)
const orderToCancel = ref(null)

// 計算屬性
const isOrdersActive = computed(() => counterStore.activeComponent === 'Orders')

// 更新訂單狀態
const updateOrderStatus = async (orderId, status) => {
  try {
    if (status === 'paid') {
      // 如果是完成訂單（結帳），顯示結帳模態框
      const total = counterStore.calculateOrderTotal(counterStore.selectedOrder)
      counterStore.openCheckoutModal(orderId, total)
    } else if (status === 'cancelled') {
      // 顯示取消確認modal
      orderToCancel.value = counterStore.selectedOrder
      showCancelModal.value = true
    } else {
      // 其他狀態變更 - 使用新的updateOrder API
      const response = await api.orderAdmin.updateOrder({
        brandId: counterStore.currentBrand,
        storeId: counterStore.currentStore,
        orderId: orderId,
        updateData: {
          status: status,
        },
      })

      if (response.success) {
        // 重新載入訂單列表
        await counterStore.fetchTodayOrders(counterStore.currentBrand, counterStore.currentStore)

        // 如果是當前選中的訂單，重新載入詳情
        if (counterStore.selectedOrder && counterStore.selectedOrder._id === orderId) {
          const updatedOrder = await api.orderAdmin.getOrderById({
            brandId: counterStore.currentBrand,
            storeId: counterStore.currentStore,
            orderId: orderId,
          })
          if (updatedOrder.success) {
            counterStore.selectOrder(updatedOrder.order)
          }
        }
      }
    }
  } catch (error) {
    console.error('更新訂單狀態失敗:', error)
    alert(error.message || '更新訂單狀態失敗')
  }
}

// 處理取消確認
const handleCancelConfirm = async (cancelData) => {
  try {
    const { orderId, reason } = cancelData

    // 使用專門的取消訂單API
    const response = await api.orderAdmin.cancelOrder({
      brandId: counterStore.currentBrand,
      storeId: counterStore.currentStore,
      orderId: orderId,
      reason: reason,
    })

    if (response.success) {
      // 關閉modal
      showCancelModal.value = false
      orderToCancel.value = null

      // 重新載入訂單列表
      await counterStore.fetchTodayOrders(counterStore.currentBrand, counterStore.currentStore)

      // 如果是當前選中的訂單，重新載入詳情
      if (counterStore.selectedOrder && counterStore.selectedOrder._id === orderId) {
        const updatedOrder = await api.orderAdmin.getOrderById({
          brandId: counterStore.currentBrand,
          storeId: counterStore.currentStore,
          orderId: orderId,
        })
        if (updatedOrder.success) {
          counterStore.selectOrder(updatedOrder.order)
        }
      }
    }
  } catch (error) {
    console.error('取消訂單失敗:', error)
    alert(error.message || '取消訂單失敗')
  }
}

// 處理取消modal關閉
const handleCancelModalClose = () => {
  showCancelModal.value = false
  orderToCancel.value = null
}

// 處理付款方式選擇
const handlePaymentSelected = async (paymentData) => {
  const { paymentMethod, paymentType } = paymentData

  try {
    if (paymentMethod === 'cash') {
      // 現金付款 - 開啟現金計算器
      counterStore.openCashCalculatorModal(counterStore.modals.checkout.total)
    } else {
      // 信用卡或 LINE Pay - 直接完成付款
      await completePayment(paymentMethod, paymentType)
    }
  } catch (error) {
    console.error('處理付款失敗:', error)
    alert('處理付款失敗: ' + error.message)
  }
}

// 完成付款
const completePayment = async (paymentMethod = 'cash', paymentType = 'On-site') => {
  try {
    const orderId = counterStore.selectedOrder._id
    // 使用新的updateOrder API更新訂單狀態為已付款，並記錄付款方式
    const response = await api.orderAdmin.updateOrder({
      brandId: counterStore.currentBrand,
      storeId: counterStore.currentStore,
      orderId: orderId, // 使用正確的 orderId
      updateData: {
        status: 'paid',
        paymentMethod: paymentMethod,
        paymentType: paymentType,
      },
    })

    if (response.success) {
      // 關閉模態框
      counterStore.closeModal('checkout')
      counterStore.closeModal('cashCalculator')

      // 重新載入訂單列表
      await counterStore.fetchTodayOrders(counterStore.currentBrand, counterStore.currentStore)

      // ✅ 重新載入當前選中訂單的詳情（這是關鍵！）
      if (counterStore.selectedOrder && counterStore.selectedOrder._id === orderId) {
        const updatedOrder = await api.orderAdmin.getOrderById({
          brandId: counterStore.currentBrand,
          storeId: counterStore.currentStore,
          orderId: orderId,
        })
        if (updatedOrder.success) {
          counterStore.selectOrder(updatedOrder.order)
        }
      }
    }
  } catch (error) {
    console.error('完成付款失敗:', error)
    throw error
  }
}

// 處理現金付款完成
const handleCashPayment = async () => {
  try {
    await completePayment('cash', 'On-site')
  } catch (error) {
    console.error('現金付款處理失敗:', error)
    alert('現金付款處理失敗')
  }
}

// 列印訂單
const printOrder = async () => {
  if (!counterStore.selectedOrder) return

  try {
    const response = await api.printer.printOrder({
      brandId: counterStore.currentBrand,
      storeId: counterStore.currentStore,
      orderId: counterStore.selectedOrder._id,
    })

    if (response.success) {
      console.log('訂單列印成功')
    }
  } catch (error) {
    console.error('列印訂單失敗:', error)
    alert(error.response?.data?.message || '列印訂單失敗')
  }
}

// 提交訂單
const submitOrder = async () => {
  if (counterStore.cart.length === 0) {
    alert('購物車是空的')
    return
  }

  try {
    // 根據當前組件決定訂單類型
    const orderType = props.activeComponent === 'DineIn' ? 'dine_in' : 'takeout'

    if (orderType === 'dine_in') {
      // 內用需要桌號
      counterStore.openTableNumberModal()
    } else {
      // 外帶直接結帳
      await counterStore.checkout(orderType)
      counterStore.setActiveComponent('Orders')
    }
  } catch (error) {
    console.error('提交訂單失敗:', error)
    alert(error.message || '提交訂單失敗')
  }
}

// 處理桌號確認
const handleTableNumberConfirm = async (tableNumber) => {
  counterStore.closeModal('tableNumber')

  try {
    await counterStore.checkout('dine_in', { tableNumber })
    counterStore.setActiveComponent('Orders')
  } catch (error) {
    console.error('提交訂單失敗:', error)
    alert(error.message || '提交訂單失敗')
  }
}

// 處理選擇當前編輯項目
const handleSelectCurrentItem = (item, index) => {
  // 直接設置編輯狀態
  counterStore.selectCurrentItem(item, index)
  console.log('開始編輯項目:', item, 'index:', index)
}

// 處理調帳確認
const handleConfirmAdjustment = async () => {
  try {
    await counterStore.confirmAdjustment()
  } catch (error) {
    console.error('調帳失敗:', error)
    alert(error.message || '調帳失敗')
  }
}

// 輔助函數
const formatOrderType = (orderType) => {
  const typeMap = {
    dine_in: '內用',
    takeout: '外帶',
    delivery: '外送',
  }
  return typeMap[orderType] || orderType
}
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
