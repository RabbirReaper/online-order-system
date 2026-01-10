<template>
  <div class="cart-item card mb-3 border-0 shadow-sm">
    <div class="card-body" v-if="item">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <!-- ✅ 動態顯示名稱，支援 dish 和 bundle -->
        <h6 class="card-title mb-0 fw-bold">{{ itemName }}</h6>
        <div class="item-price fw-bold">${{ item?.subtotal || 0 }}</div>
      </div>

      <div class="item-details mb-3">
        <!-- ✅ 條件顯示 - 只對 dish 顯示選項 -->
        <template
          v-if="
            item?.dishInstance &&
            item.dishInstance.options &&
            item.dishInstance.options.length > 0
          "
        >
          <p
            class="card-text small mb-1"
            v-for="(category, catIndex) in item.dishInstance.options"
            :key="catIndex"
          >
            {{ category.optionCategoryName }}:
            {{ formatSelections(category.selections) }}
          </p>
        </template>

        <!-- ✅ 新增 - Bundle 內容顯示 -->
        <template
          v-if="
            item?.bundleInstance &&
            item.bundleInstance.bundleItems &&
            item.bundleInstance.bundleItems.length > 0
          "
        >
          <div class="bundle-content">
            <p class="card-text small mb-1 text-muted">購買內容：</p>
            <div
              v-for="(bundleItem, bundleIdx) in item.bundleInstance.bundleItems"
              :key="bundleIdx"
              class="card-text small mb-1 ms-2"
            >
              • {{ bundleItem.quantity }}x {{ bundleItem.voucherName }}
            </div>
          </div>
        </template>

        <!-- ✅ 顯示備註 - 支援兩種格式 -->
        <p class="card-text small mb-1" v-if="itemNote">備註: {{ itemNote }}</p>

        <!-- ✅ Bundle 類型標籤 -->
        <div v-if="item?.bundleInstance" class="mt-2">
          <span class="badge bg-info text-dark">
            {{ item.bundleInstance.purchaseType === 'points' ? '點數兌換' : '現金購買' }}
          </span>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center">
        <div class="d-flex">
          <button class="btn btn-sm btn-outline-danger me-2" @click="removeItem">
            <i class="bi bi-trash"></i>
          </button>
          <!-- ✅ 條件顯示編輯按鈕 - 只有 dish 可以編輯 -->
          <button
            v-if="item?.dishInstance"
            class="btn btn-sm btn-outline-secondary"
            @click="editItem"
          >
            <i class="bi bi-pencil"></i>
          </button>
        </div>

        <div class="quantity-control d-flex align-items-center">
          <button
            class="btn btn-sm btn-outline-secondary"
            @click="decreaseQuantity"
            :disabled="!item || item.quantity <= 1"
          >
            -
          </button>
          <span class="mx-2">{{ item?.quantity || 0 }}</span>
          <button class="btn btn-sm btn-outline-secondary" @click="increaseQuantity">
            +
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const props = defineProps({
  index: {
    type: Number,
    required: true,
  },
})

// 從 store 獲取項目資料
const item = computed(() => cartStore.getCartItemByIndex(props.index))

// ✅ 計算屬性 - 動態獲取項目名稱
const itemName = computed(() => {
  if (!item.value) return '未知商品'
  if (item.value.dishInstance) {
    return item.value.dishInstance.name || '未知餐點'
  } else if (item.value.bundleInstance) {
    return item.value.bundleInstance.name || '未知套餐'
  }
  return '未知商品'
})

// ✅ 計算屬性 - 動態獲取備註
const itemNote = computed(() => {
  if (!item.value) return ''
  if (item.value.dishInstance && item.value.dishInstance.note) {
    return item.value.dishInstance.note
  } else if (item.value.note) {
    return item.value.note
  }
  return ''
})

// 格式化選項為字符串
const formatSelections = (selections) => {
  if (!selections || selections.length === 0) return ''

  return selections
    .map((selection) => {
      let text = selection.name
      if (selection.price > 0) {
        text += ` (+$${selection.price})`
      }
      return text
    })
    .join(', ')
}

// 刪除項目
const removeItem = () => {
  cartStore.removeItem(props.index)
}

// 減少數量
const decreaseQuantity = () => {
  if (!item.value || item.value.quantity <= 1) return
  const newQuantity = item.value.quantity - 1
  cartStore.updateItemQuantity(props.index, newQuantity)
}

// 增加數量
const increaseQuantity = () => {
  if (!item.value) return
  const newQuantity = item.value.quantity + 1
  cartStore.updateItemQuantity(props.index, newQuantity)
}

// ✅ 修正後的 editItem 函數 - 只對 dish 有效
const editItem = () => {
  if (!item.value) return

  // 只有 dishInstance 才能編輯
  if (!item.value.dishInstance) {
    alert('套餐商品無法編輯')
    return
  }

  // 確保有品牌和店鋪ID
  if (!cartStore.currentBrand || !cartStore.currentStore) {
    console.error('缺少品牌或店鋪ID:', {
      brandId: cartStore.currentBrand,
      storeId: cartStore.currentStore,
    })
    alert('無法編輯商品：缺少必要資訊')
    return
  }

  // 導航到商品詳情頁面進行編輯，傳遞編輯模式參數
  router.push({
    name: 'dish-detail',
    params: {
      brandId: cartStore.currentBrand,
      storeId: cartStore.currentStore,
      dishId: item.value.dishInstance.templateId || item.value.dishInstance._id,
    },
    query: {
      edit: 'true',
      editIndex: props.index.toString(),
    },
  })
}
</script>

<style scoped>
.cart-item {
  border-radius: 10px;
  overflow: hidden;
}

.quantity-control {
  min-width: 100px;
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

.card-title {
  color: #333;
}

.item-price {
  color: #d35400;
}

.item-details {
  color: #666;
}

.btn-outline-danger {
  color: #dc3545;
  border-color: #dc3545;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  color: white;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  color: white;
}

.bundle-content {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 8px;
  margin-top: 4px;
}

.badge {
  font-size: 0.7em;
}
</style>
