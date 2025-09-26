<template>
  <div class="container-fluid p-0">
    <div class="component-header bg-secondary text-white p-3">
      <h4>訂單管理 {{ counterStore.currentDate }}</h4>
      <div class="d-flex justify-content-between align-items-center mt-2">
        <div class="d-flex align-items-center">
          <div class="input-group input-group-sm me-2" style="max-width: 200px">
            <input type="date" class="form-control" v-model="selectedDate" :max="maxDate" />
          </div>
          <button
            class="btn btn-light btn-sm me-2"
            @click="fetchOrdersByDate"
            :disabled="isLoading"
          >
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            {{ isLoading ? '載入中...' : '搜尋' }}
          </button>
        </div>
        <div class="d-flex">
          <select
            class="form-select form-select-sm me-2"
            style="max-width: 150px"
            v-model="filterType"
          >
            <option value="all">所有類型</option>
            <option value="dine_in">內用</option>
            <option value="takeout">外帶</option>
            <option value="delivery">外送</option>
          </select>
          <select
            class="form-select form-select-sm"
            style="max-width: 150px"
            v-model="filterStatus"
          >
            <option value="all">所有狀態</option>
            <option value="unpaid">未結帳</option>
            <option value="paid">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div v-if="errorMessage" class="alert alert-danger m-3" role="alert">
      {{ errorMessage }}
      <button class="btn btn-outline-danger btn-sm ms-2" @click="fetchOrdersByDate">重試</button>
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
          <tr v-if="isLoading && filteredOrders.length === 0">
            <td colspan="5" class="text-center py-4">
              <div class="spinner-border text-secondary" role="status">
                <span class="visually-hidden">載入中...</span>
              </div>
              <p class="mt-2">載入訂單資料中...</p>
            </td>
          </tr>
          <tr v-else-if="filteredOrders.length === 0">
            <td colspan="5" class="text-center py-4">
              <p class="text-muted">沒有符合條件的訂單</p>
            </td>
          </tr>
          <tr
            v-for="order in filteredOrders"
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

    <!-- 訂單詳情模態框 -->
    <div
      class="modal fade"
      id="orderDetailsModal"
      tabindex="-1"
      aria-labelledby="orderDetailsModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="orderDetailsModalLabel">
              訂單詳情 #{{
                counterStore.selectedOrder?.orderNumber || counterStore.selectedOrder?._id.slice(-6)
              }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body" v-if="counterStore.selectedOrder">
            <div class="row mb-3">
              <div class="col-md-6">
                <p>
                  <strong>訂單時間：</strong>
                  {{ counterStore.formatDateTime(counterStore.selectedOrder.createdAt) }}
                </p>
                <p>
                  <strong>取餐方式：</strong>
                  {{ formatOrderType(counterStore.selectedOrder.orderType) }}
                </p>
                <p v-if="counterStore.selectedOrder.dineInInfo?.tableNumber">
                  <strong>桌號：</strong> {{ counterStore.selectedOrder.dineInInfo.tableNumber }}
                </p>
                <p v-if="counterStore.selectedOrder.deliveryInfo?.address">
                  <strong>外送地址：</strong> {{ counterStore.selectedOrder.deliveryInfo.address }}
                </p>
              </div>
              <div class="col-md-6">
                <p><strong>付款方式：</strong> {{ counterStore.selectedOrder.paymentMethod }}</p>
                <p>
                  <strong>狀態：</strong>
                  {{ counterStore.formatStatus(counterStore.selectedOrder.status) }}
                </p>
                <p v-if="counterStore.selectedOrder.notes">
                  <strong>備註：</strong> {{ counterStore.selectedOrder.notes }}
                </p>
              </div>
            </div>

            <h6 class="mb-3">餐點明細</h6>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead class="table-light">
                  <tr>
                    <th>餐點</th>
                    <th>選項</th>
                    <th>數量</th>
                    <th>金額</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in counterStore.selectedOrder.items" :key="index">
                    <td>{{ item.name }}</td>
                    <td>
                      <div
                        v-for="optionCategory in item.options"
                        :key="optionCategory.optionCategoryId"
                        class="mb-1"
                      >
                        <small>{{ optionCategory.optionCategoryName }}:</small>
                        <small
                          v-for="selection in optionCategory.selections"
                          :key="selection.optionId"
                          class="ms-1"
                        >
                          {{ selection.name
                          }}<span v-if="selection.price > 0">(+${{ selection.price }})</span>
                        </small>
                      </div>
                      <small v-if="item.note" class="text-muted d-block"
                        >備註: {{ item.note }}</small
                      >
                    </td>
                    <td>{{ item.quantity }}</td>
                    <td>${{ item.subtotal }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="text-end"><strong>總計：</strong></td>
                    <td>
                      <strong>${{ calculateOrderTotal(counterStore.selectedOrder) }}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
            <button
              type="button"
              class="btn btn-success"
              @click="printOrder"
              :disabled="!counterStore.selectedOrder || isPrinting"
            >
              <span
                v-if="isPrinting"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {{ isPrinting ? '列印中...' : '列印訂單' }}
            </button>
          </div>
        </div>
      </div>
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
const selectedDate = ref('')
const filterType = ref('all')
const filterStatus = ref('all')
const isLoading = ref(false)
const isPrinting = ref(false)
const errorMessage = ref('')
const maxDate = ref('')

// 🎯 新增：防重複點擊和視覺回饋狀態
const isSelectingOrder = ref(false) // 是否有訂單正在載入
const selectedOrderId = ref(null) // 哪個訂單正在載入

// 計算屬性
const filteredOrders = computed(() => {
  let filtered = [...counterStore.todayOrders]

  // 過濾取餐方式
  if (filterType.value !== 'all') {
    filtered = filtered.filter((order) => order.orderType === filterType.value)
  }

  // 過濾訂單狀態
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter((order) => order.status === filterStatus.value)
  }

  // 按時間排序（最新的在前）
  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

// 簡化的日期處理 - 讓瀏覽器處理本地時區
const getLocalDate = (date = null) => {
  const targetDate = date ? new Date(date) : new Date()
  return targetDate.toLocaleDateString('en-CA') // 返回 YYYY-MM-DD 格式
}

// 方法
const fetchOrdersByDate = async () => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    if (selectedDate.value) {
      await counterStore.fetchOrdersByDate(props.brandId, props.storeId, selectedDate.value)
    } else {
      await counterStore.fetchTodayOrders(props.brandId, props.storeId)
    }
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
    takeout: '外帶',
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
  const today = getLocalDate()
  selectedDate.value = today
  maxDate.value = today

  fetchOrdersByDate()

  // 初始化 Bootstrap Modal
  import('bootstrap/js/dist/modal').then((module) => {
    const Modal = module.default
    const modalElement = document.getElementById('orderDetailsModal')
    if (modalElement) {
      new Modal(modalElement)
    }
  })
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
