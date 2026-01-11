<template>
  <div>
    <h5 class="mb-3">訂單詳情 #{{ selectedOrder.sequence }}</h5>

    <!-- 餐點明細 -->
    <h6 class="fw-bold mb-2">餐點明細</h6>
    <div class="list-group mb-3">
      <div v-for="(item, index) in selectedOrder.items" :key="index" class="list-group-item">
        <div class="d-flex justify-content-between">
          <div class="item-details">
            <!-- 項目名稱 -->
            <h6 class="mb-2 fw-bold">{{ getItemDisplayName(item) }}</h6>

            <!-- 項目類型標籤 -->
            <div class="mb-2">
              <span class="badge" :class="getItemTypeBadgeClass(item)">
                {{ getItemTypeLabel(item) }}
              </span>
            </div>

            <!-- 餐點選項列表 -->
            <template v-if="isDish(item) && item.dishInstance?.options">
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
              </div>
            </template>

            <!-- 套餐內容顯示 -->
            <template v-if="isBundle(item) && item.bundleInstance?.bundleItems">
              <div class="options small">
                <div class="mb-1">
                  <span class="text-muted">購買內容:</span>
                </div>
                <div
                  v-for="bundleItem in item.bundleInstance.bundleItems"
                  :key="bundleItem._id || bundleItem.voucherTemplate?._id"
                  class="ms-2 mb-1"
                >
                  <span class="badge bg-light text-dark me-1">{{ bundleItem.quantity }}x</span>
                  <span>{{ getBundleItemName(bundleItem) }}</span>
                </div>
              </div>
            </template>

            <!-- 備註 -->
            <div v-if="item.note" class="options small">
              <div class="mb-1"><span class="text-muted">備註:</span> {{ item.note }}</div>
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
          v-for="(discount, discountIndex) in selectedOrder.discounts || []"
          :key="discountIndex"
          class="d-flex justify-content-between mb-2"
        >
          <span>
            <i :class="getDiscountIcon(discount.discountModel)" class="me-1"></i>
            {{ formatDiscountType(discount.discountModel) }}
          </span>
          <span class="text-danger">-${{ discount.amount || 0 }}</span>
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
        <div v-if="selectedOrder.estimatedPickupTime" class="fw-bold">
          預約取餐時間: {{ counterStore.formatDateTime(selectedOrder.estimatedPickupTime) }}
        </div>
        <div>付款方式: {{ selectedOrder.paymentMethod || '未設定' }}</div>
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

// 項目類型判斷方法
const isDish = (item) => {
  return item.itemType === 'dish' && item.dishInstance
}

const isBundle = (item) => {
  return item.itemType === 'bundle' && item.bundleInstance
}

const getItemType = (item) => {
  if (isDish(item)) return 'dish'
  if (isBundle(item)) return 'bundle'
  return 'unknown'
}

const getItemTypeLabel = (item) => {
  const type = getItemType(item)
  switch (type) {
    case 'dish':
      return '餐點'
    case 'bundle':
      return '兌換券'
    default:
      return '未知'
  }
}

const getItemTypeBadgeClass = (item) => {
  const type = getItemType(item)
  switch (type) {
    case 'dish':
      return 'bg-primary'
    case 'bundle':
      return 'bg-success'
    default:
      return 'bg-secondary'
  }
}

const getItemDisplayName = (item) => {
  if (isDish(item)) {
    return item.dishInstance?.name || item.itemName || '未知餐點'
  } else if (isBundle(item)) {
    return item.bundleInstance?.name || item.itemName || '未知套餐'
  }
  return item.itemName || '未知項目'
}

const getBundleItemName = (bundleItem) => {
  // 根據 bundle item 的類型返回對應的名稱
  if (bundleItem.voucherTemplate) {
    // 兌換券項目
    return bundleItem.voucherTemplate.name || bundleItem.voucherName || '兌換券'
  } else if (bundleItem.dishTemplate) {
    // 餐點項目（如果有的話）
    return bundleItem.dishTemplate.name || bundleItem.dishName || '餐點'
  } else if (bundleItem.couponTemplate) {
    // 優惠券項目（如果有的話）
    return bundleItem.couponTemplate.name || bundleItem.couponName || '優惠券'
  }

  // 備用：使用冗餘儲存的名稱
  return bundleItem.voucherName || bundleItem.dishName || bundleItem.couponName || '未知項目'
}

// 格式化折扣類型顯示文字
const formatDiscountType = (discountModel) => {
  const discountTypes = {
    VoucherInstance: '兌換券優惠',
    CouponInstance: '折價券優惠',
  }
  return discountTypes[discountModel] || '訂單折扣'
}

// 獲取折扣圖示
const getDiscountIcon = (discountModel) => {
  const discountIcons = {
    VoucherInstance: 'bi-ticket-perforated',
    CouponInstance: 'bi-percent',
  }
  return discountIcons[discountModel] || 'bi-tag'
}

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

.options {
  padding-left: 0.5rem;
}

.badge {
  font-size: 0.75rem;
}
</style>
