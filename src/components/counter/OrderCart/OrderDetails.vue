<template>
  <div>
    <h5 class="mb-3">訂單詳情 #{{ selectedOrder.sequence }}</h5>

    <!-- 餐點明細 -->
    <h6 class="fw-bold mb-2">餐點明細</h6>
    <div class="list-group mb-3">
      <div v-for="(item, index) in selectedOrder.items" :key="index" class="list-group-item">
        <div class="d-flex justify-content-between">
          <div class="item-details">
            <!-- 餐點名稱 -->
            <h6 class="mb-2 fw-bold">{{ item.dishInstance.name }}</h6>

            <!-- 選項列表 -->
            <div class="options small">
              <div
                v-for="optionCategory in item.dishInstance.options"
                :key="optionCategory.optionCategoryId"
                class="mb-1"
              >
                <span class="text-muted">{{ optionCategory.optionCategoryName }}:</span>
                <span
                  v-for="selection in optionCategory.selections"
                  :key="selection.optionId"
                  class="ms-1"
                >
                  {{ selection.name
                  }}<span v-if="selection.price > 0">(+${{ selection.price }})</span>
                </span>
              </div>

              <div v-if="item.note" class="mb-1">
                <span class="text-muted">備註:</span> {{ item.note }}
              </div>
            </div>
          </div>

          <div class="text-end d-flex flex-column justify-content-between">
            <span class="badge bg-secondary mb-2">x{{ item.quantity }}</span>
            <span class="fw-bold text-primary">${{ item.subtotal.toLocaleString('en-US') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 訂單總計 -->
    <div class="card">
      <div class="card-body">
        <div class="d-flex justify-content-between mb-2">
          <span>小計</span>
          <span
            >${{ counterStore.calculateOrderSubtotal(selectedOrder).toLocaleString('en-US') }}</span
          >
        </div>

        <!-- 訂單調帳 -->
        <div class="d-flex justify-content-between mb-2">
          <div class="d-flex align-items-center">
            <span>訂單調帳</span>
            <button
              class="btn btn-sm btn-outline-secondary ms-2"
              @click="counterStore.openAdjustmentModal(selectedOrder)"
              :disabled="selectedOrder.status === 'cancelled'"
            >
              <i class="bi bi-pencil-square"></i>
            </button>
          </div>
          <span
            :class="{
              'text-success': selectedOrder.manualAdjustment > 0,
              'text-danger': selectedOrder.manualAdjustment < 0,
            }"
          >
            {{ selectedOrder.manualAdjustment > 0 ? '+' : '' }}${{
              Math.abs(selectedOrder.manualAdjustment || 0)
            }}
          </span>
        </div>

        <!-- 訂單折扣 - 只顯示，不可編輯 -->
        <div
          v-if="counterStore.calculateOrderTotalDiscount(selectedOrder) > 0"
          class="d-flex justify-content-between mb-2"
        >
          <span>訂單折扣</span>
          <span class="text-danger"
            >-${{ counterStore.calculateOrderTotalDiscount(selectedOrder) }}</span
          >
        </div>

        <div class="d-flex justify-content-between fw-bold border-top pt-2 mt-2">
          <span>總計</span>
          <span
            >${{ counterStore.calculateOrderTotal(selectedOrder).toLocaleString('en-US') }}</span
          >
        </div>
      </div>
    </div>

    <!-- 訂單資訊 -->
    <div class="mt-3">
      <small class="text-muted">
        <div>訂單時間: {{ counterStore.formatDateTime(selectedOrder.createdAt) }}</div>
        <div>取餐方式: {{ formatOrderType(selectedOrder.orderType) }}</div>
        <div v-if="selectedOrder.dineInInfo?.tableNumber">
          桌號: {{ selectedOrder.dineInInfo.tableNumber }}
        </div>
        <div v-if="selectedOrder.deliveryInfo?.address">
          配送地址: {{ selectedOrder.deliveryInfo.address }}
        </div>
        <div>付款方式: {{ selectedOrder.paymentMethod }}</div>
        <div v-if="selectedOrder.notes">備註: {{ selectedOrder.notes }}</div>
      </small>
    </div>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

const props = defineProps({
  selectedOrder: {
    type: Object,
    required: true,
  },
})

const counterStore = useCounterStore()

// 格式化訂單類型
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
.list-group-item {
  border-radius: 8px;
  margin-bottom: 8px;
}
</style>
