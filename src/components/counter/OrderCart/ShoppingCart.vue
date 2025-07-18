<template>
  <div>
    <h5 class="mb-3">訂單詳情</h5>
    <div v-if="counterStore.cart.length === 0" class="text-center p-5 text-muted">
      <p>尚未選擇餐點</p>
    </div>
    <div v-else>
      <div
        v-for="(item, index) in counterStore.cart"
        :key="index"
        class="cart-item card mb-3 border-0 shadow-sm"
        :class="{ editing: isCurrentlyEditing(index) }"
      >
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="item-info">
              <h6 class="card-title mb-0 fw-bold">{{ getItemDisplayName(item) }}</h6>
              <small v-if="getItemType(item)" class="text-muted">{{
                getItemTypeLabel(item)
              }}</small>
            </div>
            <div class="d-flex">
              <div class="item-price fw-bold me-2">${{ item.subtotal }}</div>
              <button
                class="btn btn-sm btn-outline-danger"
                @click="counterStore.removeFromCart(index)"
              >
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>

          <div class="item-details mb-3">
            <!-- 餐點選項顯示 -->
            <template v-if="isDish(item) && item.dishInstance.options">
              <div
                v-for="optionCategory in item.dishInstance.options"
                :key="optionCategory.optionCategoryId"
                class="mb-1"
              >
                <p class="card-text small mb-1">
                  <span class="text-muted">{{ optionCategory.optionCategoryName }}:</span>
                  <span
                    v-for="selection in optionCategory.selections"
                    :key="selection.optionId"
                    class="ms-1"
                  >
                    {{ selection.name
                    }}<span v-if="selection.price > 0">(+${{ selection.price }})</span>
                  </span>
                </p>
              </div>
            </template>

            <!-- 套餐內容顯示 -->
            <div v-if="isBundle(item) && item.bundleInstance.bundleItems" class="mb-2">
              <p class="card-text small text-muted mb-1">套餐內容:</p>
              <div
                v-for="bundleItem in item.bundleInstance.bundleItems"
                :key="bundleItem._id"
                class="ms-2"
              >
                <p class="card-text small mb-1">
                  <span class="badge bg-light text-dark me-1">{{ bundleItem.quantity }}x</span>
                  <span v-if="bundleItem.itemType === 'dish'">{{
                    bundleItem.dishTemplate?.name
                  }}</span>
                  <span v-else-if="bundleItem.itemType === 'coupon'">{{
                    bundleItem.couponTemplate?.name
                  }}</span>
                </p>
              </div>
            </div>

            <!-- 顯示備註 -->
            <p v-if="item.note" class="card-text small mb-1">
              <span class="text-muted">備註:</span> {{ item.note }}
            </p>
          </div>

          <div class="d-flex justify-content-between align-items-center">
            <!-- 編輯按鈕 - 只對餐點顯示 -->
            <button
              v-if="isDish(item)"
              class="btn btn-sm"
              :class="isCurrentlyEditing(index) ? 'btn-warning' : 'btn-outline-secondary'"
              @click="handleEditClick(item, index)"
            >
              <i class="bi bi-pencil"></i>
              {{ isCurrentlyEditing(index) ? '編輯中' : '編輯' }}
            </button>
            <!-- 套餐不可編輯 -->
            <button v-else class="btn btn-sm btn-outline-secondary" disabled>
              <i class="bi bi-box"></i>
              套餐
            </button>

            <div class="quantity-control d-flex align-items-center">
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="counterStore.updateQuantity(index, -1)"
              >
                -
              </button>
              <span class="mx-2">{{ item.quantity }}</span>
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="counterStore.updateQuantity(index, 1)"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="order-total mt-3 card">
        <div class="d-flex justify-content-between mb-2">
          <span>小計</span>
          <span>${{ counterStore.subtotal }}</span>
        </div>

        <!-- 訂單調帳 -->
        <div class="d-flex justify-content-between mb-2">
          <div class="d-flex align-items-center">
            <span>訂單調帳</span>
            <button
              class="btn btn-sm btn-outline-secondary ms-2"
              @click="counterStore.openAdjustmentModal()"
            >
              <i class="bi bi-pencil-square"></i>
            </button>
          </div>
          <span
            :class="{
              'text-success': counterStore.manualAdjustment > 0,
              'text-danger': counterStore.manualAdjustment < 0,
            }"
          >
            {{ counterStore.manualAdjustment > 0 ? '+' : '' }}${{
              Math.abs(counterStore.manualAdjustment)
            }}
          </span>
        </div>

        <!-- 訂單折扣 - 只顯示，不可編輯 -->
        <div v-if="counterStore.totalDiscount > 0" class="d-flex justify-content-between mb-2">
          <span>訂單折扣</span>
          <span class="text-danger">-${{ counterStore.totalDiscount }}</span>
        </div>

        <div class="d-flex justify-content-between fw-bold border-top pt-2 mt-2">
          <span>總計</span>
          <span>${{ counterStore.total }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCounterStore } from '@/stores/counter'

const emit = defineEmits(['selectCurrentItem'])

// 使用 counter store 獲取所有資料
const counterStore = useCounterStore()

// 項目類型判斷方法
const isDish = (item) => {
  return item.dishInstance && item.dishInstance.templateId
}

const isBundle = (item) => {
  return item.bundleInstance && item.bundleInstance.bundleId
}

const getItemType = (item) => {
  if (isDish(item)) return 'dish'
  if (isBundle(item)) return 'bundle'
  return null
}

const getItemTypeLabel = (item) => {
  const type = getItemType(item)
  switch (type) {
    case 'dish':
      return '餐點'
    case 'bundle':
      return '套餐'
    default:
      return ''
  }
}

const getItemDisplayName = (item) => {
  if (isDish(item)) {
    return item.dishInstance.name
  } else if (isBundle(item)) {
    return item.bundleInstance.name
  }
  return '未知項目'
}

// 檢查當前項目是否正在編輯
const isCurrentlyEditing = (index) => {
  return counterStore.isEditMode && counterStore.currentItemIndex === index
}

// 處理編輯按鈕點擊
const handleEditClick = (item, index) => {
  // 只有餐點可以編輯
  if (!isDish(item)) {
    return
  }

  if (isCurrentlyEditing(index)) {
    // 如果正在編輯，則退出編輯模式
    counterStore.clearCurrentItem()
  } else {
    // 否則進入編輯模式
    emit('selectCurrentItem', item, index)
  }
}
</script>

<style scoped>
.cart-item {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.cart-item.editing {
  border: 2px solid #ffc107;
  box-shadow: 0 0 10px rgba(255, 193, 7, 0.3);
}

.card-body {
  padding: 1rem 1.25rem;
}

.item-details {
  padding-left: 0.5rem;
}

.order-total {
  padding: 0.5rem;
}

.quantity-control button {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 50%;
}

.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #000;
}

.btn-warning:hover {
  background-color: #e0a800;
  border-color: #d39e00;
}
</style>
