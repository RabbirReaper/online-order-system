<template>
  <div class="cart-item card mb-3 border-0 shadow-sm">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <!-- ✅ 動態顯示名稱，支援 dish 和 bundle -->
        <h6 class="card-title mb-0 fw-bold">{{ itemName }}</h6>
        <div class="item-price fw-bold">${{ item.subtotal }}</div>
      </div>

      <div class="item-details mb-3">
        <!-- ✅ 條件顯示 - 只對 dish 顯示選項 -->
        <template
          v-if="
            item.dishInstance && item.dishInstance.options && item.dishInstance.options.length > 0
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
            item.bundleInstance &&
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
        <div v-if="item.bundleInstance" class="mt-2">
          <span class="badge bg-info text-dark">
            {{ item.bundleInstance.purchaseType === 'points' ? '點數兌換' : '現金購買' }}
          </span>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center">
        <div class="d-flex">
          <button class="btn btn-sm btn-outline-danger me-2" @click="$emit('remove', index)">
            <i class="bi bi-trash"></i>
          </button>
          <!-- ✅ 條件顯示編輯按鈕 - 只有 dish 可以編輯 -->
          <button
            v-if="item.dishInstance"
            class="btn btn-sm btn-outline-secondary"
            @click="editItem"
          >
            <i class="bi bi-pencil"></i>
          </button>
        </div>

        <div class="quantity-control d-flex align-items-center">
          <button
            class="btn btn-sm btn-outline-secondary"
            @click="$emit('quantity-change', index, -1)"
            :disabled="item.quantity <= 1"
          >
            -
          </button>
          <span class="mx-2">{{ item.quantity }}</span>
          <button
            class="btn btn-sm btn-outline-secondary"
            @click="$emit('quantity-change', index, 1)"
          >
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
  item: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['remove', 'edit', 'quantity-change'])

// ✅ 計算屬性 - 動態獲取項目名稱
const itemName = computed(() => {
  if (props.item.dishInstance) {
    return props.item.dishInstance.name || '未知餐點'
  } else if (props.item.bundleInstance) {
    return props.item.bundleInstance.name || '未知套餐'
  }
  return '未知商品'
})

// ✅ 計算屬性 - 動態獲取備註
const itemNote = computed(() => {
  if (props.item.dishInstance && props.item.dishInstance.note) {
    return props.item.dishInstance.note
  } else if (props.item.note) {
    return props.item.note
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

// ✅ 修正後的 editItem 函數 - 只對 dish 有效
const editItem = () => {
  const item = props.item

  // 只有 dishInstance 才能編輯
  if (!item.dishInstance) {
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
      dishId: item.dishInstance.templateId || item.dishInstance._id,
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
