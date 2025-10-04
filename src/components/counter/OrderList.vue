<template>
  <div class="container-fluid p-0">
    <div class="component-header bg-secondary text-white p-3">
      <h4>訂單管理 {{ counterStore.currentDate }}</h4>
    </div>

    <!-- 錯誤提示 -->
    <div v-if="errorMessage" class="alert alert-danger m-3" role="alert">
      {{ errorMessage }}
      <button class="btn btn-outline-danger btn-sm ms-2" @click="fetchTodayOrders">重試</button>
    </div>

    <!-- 訂單表格 -->
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>時間</th>
            <th>訂單號</th>
            <th>取餐方式</th>
            <th>金額</th>
            <th>狀態</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading && counterStore.todayOrders.length === 0">
            <td colspan="5" class="text-center py-4">
              <div class="spinner-border text-secondary" role="status">
                <span class="visually-hidden">載入中...</span>
              </div>
              <p class="mt-2">載入訂單資料中...</p>
            </td>
          </tr>
          <tr v-else-if="counterStore.todayOrders.length === 0">
            <td colspan="5" class="text-center py-4">
              <p class="text-muted">沒有訂單</p>
            </td>
          </tr>
          <tr
            v-for="order in sortedOrders"
            :key="order._id"
            :class="{
              'table-active':
                counterStore.selectedOrder && counterStore.selectedOrder._id === order._id,
              'table-loading': selectedOrderId === order._id && isSelectingOrder,
            }"
            @click="selectOrder(order)"
            class="order-row"
            :style="{
              cursor: isSelectingOrder ? 'wait' : 'pointer',
              pointerEvents: isSelectingOrder ? 'none' : 'auto',
            }"
          >
            <td>{{ counterStore.formatTime(order.createdAt) }}</td>
            <td v-if="order.platformOrderId" class="fs-5">{{ order.platformOrderId }}</td>
            <td v-else class="fs-5">{{ order.sequence }}</td>
            <td>
              <span :class="getOrderTypeClass(order.orderType)">
                {{ formatOrderType(order.orderType) }}
              </span>
              <span v-if="order.dineInInfo?.tableNumber" class="ms-1 badge bg-info">
                桌號: {{ order.dineInInfo.tableNumber }}
              </span>
              <span v-if="order.orderType === 'delivery'" class="ms-1 badge bg-info">
                {{ order.platformInfo.platform }}
              </span>
              <!-- 載入 spinner -->
              <div
                v-if="selectedOrderId === order._id && isSelectingOrder"
                class="spinner-border spinner-border-sm ms-2 text-primary d-inline-block"
                role="status"
              >
                <span class="visually-hidden">載入中...</span>
              </div>
            </td>
            <td class="fs-5">${{ calculateOrderTotal(order) }}</td>
            <td>
              <span :class="counterStore.getStatusClass(order.status)">
                {{ counterStore.formatStatus(order.status) }}
              </span>
              <span v-if="order.status === 'paid'" class="ms-1 badge bg-secondary">
                {{ order.paymentMethod }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCounterStore } from '@/stores/counter'
import api from '@/api'

const props = defineProps({
  brandId: {
    type: String,
    required: true,
  },
  storeId: {
    type: String,
    required: true,
  },
})

// 使用 Pinia store
const counterStore = useCounterStore()

// 本地狀態
const isLoading = ref(false)
const isPrinting = ref(false)
const errorMessage = ref('')

// 🎯 新增：防重複點擊和視覺回饋狀態
const isSelectingOrder = ref(false) // 是否有訂單正在載入
const selectedOrderId = ref(null) // 哪個訂單正在載入

// 計算屬性 - 按時間排序（最新的在前）
const sortedOrders = computed(() => {
  return [...counterStore.todayOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

// 方法
const fetchTodayOrders = async () => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    await counterStore.fetchTodayOrders(props.brandId, props.storeId)
  } catch (error) {
    console.error('獲取訂單失敗:', error)
    errorMessage.value = error.message || '獲取訂單失敗'
  } finally {
    isLoading.value = false
  }
}

// 🎯 改善的 selectOrder 函數
const selectOrder = async (order) => {
  // 防止重複點擊
  if (isSelectingOrder.value) {
    return
  }

  // 立即提供視覺回饋
  selectedOrderId.value = order._id
  isSelectingOrder.value = true
  errorMessage.value = ''

  try {
    // 獲取訂單詳情
    const response = await api.orderAdmin.getOrderById({
      brandId: props.brandId,
      storeId: props.storeId,
      orderId: order._id,
    })

    if (response.success) {
      counterStore.selectOrder(response.order)
    }
  } catch (error) {
    console.error('獲取訂單詳情失敗:', error)
    errorMessage.value = '獲取訂單詳情失敗'
    selectedOrderId.value = null // 錯誤時清除選中狀態
  } finally {
    isSelectingOrder.value = false
  }
}

const getOrderTypeClass = (orderType) => {
  const classMap = {
    dine_in: 'badge bg-primary',
    takeout: 'badge bg-success',
    delivery: 'badge bg-warning text-dark',
  }
  return classMap[orderType] || 'badge bg-secondary'
}

const formatOrderType = (orderType) => {
  const typeMap = {
    dine_in: '內用',
    takeout: '自取',
    delivery: '外送',
  }
  return typeMap[orderType] || orderType
}

const calculateOrderTotal = (order) => {
  if (!order.items) return 0
  console.log(order)
  return order.total
}

const printOrder = () => {
  if (!counterStore.selectedOrder || isPrinting.value) return

  isPrinting.value = true

  try {
    // 創建列印窗口
    const printWindow = window.open('', '_blank')
    const order = counterStore.selectedOrder

    let printContent = `
      <html>
        <head>
          <title>訂單 #${order.orderNumber || order._id.slice(-6)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>訂單 #${order.orderNumber || order._id.slice(-6)}</h1>
          <p><strong>訂單時間：</strong> ${counterStore.formatDateTime(order.createdAt)}</p>
          <p><strong>取餐方式：</strong> ${formatOrderType(order.orderType)}</p>
          ${order.dineInInfo?.tableNumber ? `<p><strong>桌號：</strong> ${order.dineInInfo.tableNumber}</p>` : ''}
          ${order.deliveryInfo?.address ? `<p><strong>外送地址：</strong> ${order.deliveryInfo.address}</p>` : ''}
          <p><strong>付款方式：</strong> ${order.paymentMethod}</p>
          ${order.notes ? `<p><strong>備註：</strong> ${order.notes}</p>` : ''}

          <h2>餐點明細</h2>
          <table>
            <thead>
              <tr>
                <th>餐點</th>
                <th>選項</th>
                <th>數量</th>
                <th>金額</th>
              </tr>
            </thead>
            <tbody>
    `

    // 添加餐點明細
    order.items.forEach((item) => {
      let optionsText = ''
      if (item.options && item.options.length > 0) {
        optionsText = item.options
          .map((category) => {
            const selections = category.selections
              .map(
                (selection) =>
                  `${selection.name}${selection.price > 0 ? `(+$${selection.price})` : ''}`,
              )
              .join(', ')
            return `${category.optionCategoryName}: ${selections}`
          })
          .join('<br>')
      }
      if (item.note) {
        optionsText += optionsText ? `<br>備註: ${item.note}` : `備註: ${item.note}`
      }

      printContent += `
        <tr>
          <td>${item.name}</td>
          <td>${optionsText}</td>
          <td>${item.quantity}</td>
          <td>${item.subtotal}</td>
        </tr>
      `
    })

    // 添加總計
    printContent += `
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: right;"><strong>總計：</strong></td>
                <td class="total">${calculateOrderTotal(order)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="text-align: center; margin-top: 40px;">
            <p>感謝您的惠顧！</p>
          </div>
        </body>
      </html>
    `

    // 寫入並列印
    printWindow.document.open()
    printWindow.document.write(printContent)
    printWindow.document.close()

    // 等待載入
    setTimeout(() => {
      printWindow.print()
      printWindow.onafterprint = () => {
        isPrinting.value = false
      }
      // 安全超時
      setTimeout(() => {
        isPrinting.value = false
      }, 3000)
    }, 500)
  } catch (error) {
    console.error('列印訂單失敗:', error)
    errorMessage.value = '列印訂單時發生錯誤'
    isPrinting.value = false
  }
}

// 初始化
onMounted(() => {
  fetchTodayOrders()
})
</script>

<style scoped>
.component-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

table {
  font-size: 0.9rem;
}

.order-row {
  height: 50px;
  vertical-align: middle;
  transition: all 0.3s ease;
}

.order-row:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.badge {
  font-size: 0.95rem;
}

.table-active {
  --bs-table-active-bg: rgba(83, 109, 254, 0.35) !important;
  --bs-table-active-color: #000 !important;
  --bs-table-hover-bg: var(--bs-table-active-bg) !important;
  --bs-table-hover-color: var(--bs-table-active-color) !important;
}

/* 🎯 新增：正在載入的訂單樣式 - 簡化版 */
.table-loading {
  --bs-table-bg: rgba(13, 202, 240, 0.1) !important;
  background: linear-gradient(
    45deg,
    rgba(13, 202, 240, 0.05) 0%,
    rgba(13, 202, 240, 0.15) 50%,
    rgba(13, 202, 240, 0.05) 100%
  );
  animation: gentle-pulse 2s ease-in-out infinite;
}

/* 🎯 新增：溫和的脈動動畫 */
@keyframes gentle-pulse {
  0%,
  100% {
    background: linear-gradient(
      45deg,
      rgba(13, 202, 240, 0.05) 0%,
      rgba(13, 202, 240, 0.15) 50%,
      rgba(13, 202, 240, 0.05) 100%
    );
  }

  50% {
    background: linear-gradient(
      45deg,
      rgba(13, 202, 240, 0.1) 0%,
      rgba(13, 202, 240, 0.2) 50%,
      rgba(13, 202, 240, 0.1) 100%
    );
  }
}
</style>
