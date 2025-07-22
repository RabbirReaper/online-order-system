<template>
  <div v-if="visible" class="modal-backdrop show"></div>
  <div v-if="visible" class="modal fade show d-block" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">訂單詳情 #{{ getOrderNumber(order) }}</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div v-if="!order" class="text-center py-3">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">載入中...</span>
            </div>
          </div>
          <div v-else>
            <!-- 訂單基本信息 -->
            <div class="card mb-3">
              <div class="card-header bg-light">
                <h6 class="mb-0">基本信息</h6>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <p class="mb-1"><strong>訂單編號:</strong> {{ getOrderNumber(order) }}</p>
                    <p class="mb-1">
                      <strong>訂單時間:</strong> {{ formatDateTime(order.createdAt) }}
                    </p>
                    <p class="mb-1"><strong>店家:</strong> {{ props.storeName }}</p>
                    <p class="mb-1" v-if="order.deliveryPlatform">
                      <strong>外送平台:</strong> {{ order.deliveryPlatform }}
                    </p>
                    <p class="mb-1" v-if="order.platformOrderId">
                      <strong>平台訂單號:</strong> {{ order.platformOrderId }}
                    </p>
                  </div>
                  <div class="col-md-6">
                    <p class="mb-1">
                      <strong>訂單類型:</strong>
                      <span :class="getOrderTypeClass(order.orderType)">
                        {{ formatOrderType(order.orderType) }}
                      </span>
                    </p>
                    <p class="mb-1">
                      <strong>訂單狀態:</strong>
                      <span :class="getOrderStatusClass(order.status)">
                        {{ formatOrderStatus(order.status) }}
                      </span>
                    </p>
                    <p class="mb-1">
                      <strong>付款類型:</strong> {{ formatPaymentType(order.paymentType) }}
                    </p>
                    <p class="mb-1">
                      <strong>付款方式:</strong> {{ formatPaymentMethod(order.paymentMethod) }}
                    </p>
                    <p class="mb-1" v-if="order.onlinePaymentCode">
                      <strong>線上付款代碼:</strong> {{ order.onlinePaymentCode }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 顧客信息 -->
            <div class="card mb-3" v-if="order.customerInfo?.name || order.customerInfo?.phone">
              <div class="card-header bg-light">
                <h6 class="mb-0">顧客信息</h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6" v-if="order.customerInfo?.name">
                    <p class="mb-1"><strong>姓名:</strong> {{ order.customerInfo.name }}</p>
                  </div>
                  <div class="col-md-6" v-if="order.customerInfo?.phone">
                    <p class="mb-1"><strong>電話:</strong> {{ order.customerInfo.phone }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 配送/內用信息 -->
            <div class="card mb-3" v-if="order.orderType === 'delivery' && order.deliveryInfo">
              <div class="card-header bg-light">
                <h6 class="mb-0">配送信息</h6>
              </div>
              <div class="card-body">
                <p class="mb-1" v-if="order.deliveryInfo.address">
                  <strong>配送地址:</strong> {{ order.deliveryInfo.address }}
                </p>
                <p class="mb-1" v-if="order.deliveryInfo.estimatedTime">
                  <strong>預計送達:</strong> {{ formatDateTime(order.deliveryInfo.estimatedTime) }}
                </p>
                <p class="mb-1" v-if="order.deliveryInfo.actualTime">
                  <strong>實際送達:</strong> {{ formatDateTime(order.deliveryInfo.actualTime) }}
                </p>
                <p class="mb-1" v-if="order.deliveryInfo.deliveryFee">
                  <strong>配送費:</strong> ${{ order.deliveryInfo.deliveryFee }}
                </p>
              </div>
            </div>

            <div
              class="card mb-3"
              v-if="order.orderType === 'dine_in' && order.dineInInfo?.tableNumber"
            >
              <div class="card-header bg-light">
                <h6 class="mb-0">內用信息</h6>
              </div>
              <div class="card-body">
                <p class="mb-1"><strong>桌號:</strong> {{ order.dineInInfo.tableNumber }}</p>
              </div>
            </div>

            <div
              class="card mb-3"
              v-if="order.orderType === 'takeout' && order.estimatedPickupTime"
            >
              <div class="card-header bg-light">
                <h6 class="mb-0">外帶信息</h6>
              </div>
              <div class="card-body">
                <p class="mb-1">
                  <strong>預計取餐時間:</strong> {{ formatDateTime(order.estimatedPickupTime) }}
                </p>
              </div>
            </div>

            <!-- 訂單項目 -->
            <div class="card mb-3">
              <div class="card-header bg-light">
                <h6 class="mb-0">訂單項目</h6>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>類型</th>
                        <th>項目</th>
                        <th>內容/選項</th>
                        <th>數量</th>
                        <th>小計</th>
                        <th>備註</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in order.items" :key="index">
                        <!-- 項目類型 -->
                        <td>
                          <span :class="getItemTypeClass(item.itemType)">
                            {{ formatItemType(item.itemType) }}
                          </span>
                        </td>

                        <!-- 項目名稱 -->
                        <td>{{ getItemName(item) }}</td>

                        <!-- 內容/選項 -->
                        <td>
                          <!-- 餐點選項 -->
                          <div v-if="item.itemType === 'dish'">
                            <div v-if="getDishOptions(item).length > 0">
                              <div
                                v-for="option in getDishOptions(item)"
                                :key="option.optionCategoryName"
                                class="mb-1"
                              >
                                <small
                                  ><strong>{{ option.optionCategoryName }}:</strong></small
                                >
                                <div
                                  v-for="selection in option.selections"
                                  :key="selection.name"
                                  class="ms-2"
                                >
                                  <small
                                    >{{ selection.name }}
                                    <span v-if="selection.price > 0"
                                      >(+${{ selection.price }})</span
                                    >
                                  </small>
                                </div>
                              </div>
                            </div>
                            <span v-else class="text-muted">無選項</span>
                          </div>

                          <!-- Bundle 內容 -->
                          <div v-else-if="item.itemType === 'bundle'">
                            <div v-if="item.bundleInstance?.templateId?.bundleItems?.length > 0">
                              <div
                                v-for="bundleItem in item.bundleInstance.templateId.bundleItems"
                                :key="bundleItem._id"
                              >
                                <small class="text-primary">
                                  <i class="bi bi-ticket-perforated me-1"></i>
                                  {{ bundleItem.voucherName || bundleItem.voucherTemplate?.name }}
                                  x{{ bundleItem.quantity }}
                                </small>
                              </div>
                            </div>
                            <small v-else class="text-muted">Bundle 資訊</small>
                          </div>

                          <!-- 其他類型 -->
                          <div v-else>
                            <span class="text-muted">{{ item.itemType }}</span>
                          </div>
                        </td>

                        <!-- 數量 -->
                        <td>{{ item.quantity }}</td>

                        <!-- 小計 -->
                        <td>${{ item.subtotal }}</td>

                        <!-- 備註 -->
                        <td>{{ item.note || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- 金額摘要 -->
            <div class="card mb-3">
              <div class="card-header bg-light">
                <h6 class="mb-0">金額摘要</h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <!-- 分項小計 -->
                  <div class="d-flex justify-content-between mb-1" v-if="order.dishSubtotal > 0">
                    <span class="text-muted">餐點小計:</span>
                    <span>${{ order.dishSubtotal || 0 }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-1" v-if="order.bundleSubtotal > 0">
                    <span class="text-muted">套餐小計:</span>
                    <span>${{ order.bundleSubtotal || 0 }}</span>
                  </div>

                  <!-- 總小計 -->
                  <div class="d-flex justify-content-between mb-2 border-bottom pb-2">
                    <span><strong>商品小計:</strong></span>
                    <span
                      ><strong>${{ order.subtotal || 0 }}</strong></span
                    >
                  </div>

                  <!-- 其他費用 -->
                  <div class="d-flex justify-content-between mb-2" v-if="order.serviceCharge > 0">
                    <span>服務費:</span>
                    <span>${{ order.serviceCharge }}</span>
                  </div>
                  <div
                    class="d-flex justify-content-between mb-2"
                    v-if="order.deliveryInfo?.deliveryFee"
                  >
                    <span>配送費:</span>
                    <span>${{ order.deliveryInfo.deliveryFee }}</span>
                  </div>
                  <div
                    v-for="(discount, discountIndex) in order.discounts || []"
                    :key="discountIndex"
                    class="d-flex justify-content-between mb-2"
                  >
                    <span>
                      <i
                        :class="getDiscountIcon(discount.discountModel)"
                        class="me-1 text-muted"
                      ></i>
                      {{ formatDiscountType(discount.discountModel) }}:
                    </span>
                    <span class="text-success">-${{ discount.amount || 0 }}</span>
                  </div>
                  <div
                    class="d-flex justify-content-between mb-2"
                    v-if="order.manualAdjustment !== 0"
                  >
                    <span>手動調整:</span>
                    <span :class="order.manualAdjustment > 0 ? 'text-danger' : 'text-success'">
                      {{ order.manualAdjustment > 0 ? '+' : '' }}${{ order.manualAdjustment }}
                    </span>
                  </div>
                  <div class="d-flex justify-content-between fw-bold border-top pt-2 mt-2">
                    <span>實付金額:</span>
                    <span class="text-primary fs-5">${{ order.total }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 點數獎勵信息 -->
            <div class="card mb-3" v-if="order.pointsEarned > 0">
              <div class="card-header bg-light">
                <h6 class="mb-0"><i class="bi bi-star-fill text-warning me-2"></i>點數獎勵</h6>
              </div>
              <div class="card-body">
                <div class="alert alert-info">
                  <i class="bi bi-gift-fill me-2"></i>
                  本次消費獲得 <strong>{{ order.pointsEarned }}</strong> 點數獎勵
                </div>
              </div>
            </div>

            <!-- 訂單備註 -->
            <div v-if="order.notes" class="card mb-3">
              <div class="card-header bg-light">
                <h6 class="mb-0">訂單備註</h6>
              </div>
              <div class="card-body">
                <p class="mb-0">{{ order.notes }}</p>
              </div>
            </div>

            <!-- 取消信息 -->
            <div v-if="order.status === 'cancelled'" class="card mb-3">
              <div class="card-header bg-light">
                <h6 class="mb-0">取消信息</h6>
              </div>
              <div class="card-body">
                <p class="mb-1" v-if="order.cancelReason">
                  <strong>取消原因:</strong> {{ order.cancelReason }}
                </p>
                <p class="mb-1" v-if="order.cancelledAt">
                  <strong>取消時間:</strong> {{ formatDateTime(order.cancelledAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">關閉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  order: {
    type: Object,
    default: () => ({}),
  },
  storeName: {
    type: String,
    default: '未知店家',
  },
  visible: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close'])

// 獲取訂單編號
const getOrderNumber = (order) => {
  if (!order) return ''
  if (order.platformOrderId) return order.platformOrderId
  if (order.orderDateCode && order.sequence) {
    return `${order.orderDateCode}-${String(order.sequence).padStart(3, '0')}`
  }
  return order._id || ''
}

// 獲取項目名稱（支援 dish 和 bundle）
const getItemName = (item) => {
  if (!item) return '未知項目'

  // 統一使用 itemName 字段
  if (item.itemName) {
    return item.itemName
  }

  // 降級處理
  if (item.itemType === 'dish' && item.dishInstance) {
    if (typeof item.dishInstance === 'object') {
      return item.dishInstance.name || '未知餐點'
    }
  } else if (item.itemType === 'bundle' && item.bundleInstance) {
    if (typeof item.bundleInstance === 'object') {
      return item.bundleInstance.name || '未知套餐'
    }
  }

  return '未知項目'
}

// 格式化折扣類型顯示文字
const formatDiscountType = (discountModel) => {
  const discountTypes = {
    VoucherInstance: '兌換券優惠',
    CouponInstance: '折價券優惠',
  }
  return discountTypes[discountModel] || '優惠折扣'
}

// 獲取折扣圖示
const getDiscountIcon = (discountModel) => {
  const discountIcons = {
    VoucherInstance: 'bi-ticket-perforated',
    CouponInstance: 'bi-percent',
  }
  return discountIcons[discountModel] || 'bi-tag'
}

// 獲取餐點選項
const getDishOptions = (item) => {
  if (!item || item.itemType !== 'dish' || !item.dishInstance) return []

  if (typeof item.dishInstance === 'object' && item.dishInstance.options) {
    return item.dishInstance.options || []
  }

  return []
}

// 格式化項目類型
const formatItemType = (itemType) => {
  const typeMap = {
    dish: '餐點',
    bundle: '兌換券',
  }
  return typeMap[itemType] || itemType
}

// 獲取項目類型的樣式類別
const getItemTypeClass = (itemType) => {
  const classes = {
    dish: 'badge bg-primary',
    bundle: 'badge bg-success',
  }
  return classes[itemType] || 'badge bg-secondary'
}

// 格式化日期時間
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化訂單類型
const formatOrderType = (type) => {
  const typeMap = {
    dine_in: '內用',
    takeout: '外帶',
    delivery: '外送',
  }
  return typeMap[type] || type
}

// 格式化訂單狀態
const formatOrderStatus = (status) => {
  const statusMap = {
    unpaid: '未付款',
    paid: '已付款',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

// 格式化付款類型
const formatPaymentType = (type) => {
  const typeMap = {
    'On-site': '現場付款',
    Online: '線上付款',
  }
  return typeMap[type] || type || '未設定'
}

// 格式化付款方式
const formatPaymentMethod = (method) => {
  const methodMap = {
    cash: '現金',
    credit_card: '信用卡',
    line_pay: 'LINE Pay',
    other: '其他',
  }
  return methodMap[method] || method || '未設定'
}

// 獲取訂單類型的樣式類別
const getOrderTypeClass = (type) => {
  const classes = {
    dine_in: 'badge bg-primary',
    takeout: 'badge bg-success',
    delivery: 'badge bg-warning',
  }
  return classes[type] || 'badge bg-secondary'
}

// 獲取訂單狀態的樣式類別
const getOrderStatusClass = (status) => {
  const classes = {
    unpaid: 'badge bg-warning',
    paid: 'badge bg-success',
    cancelled: 'badge bg-danger',
  }
  return classes[status] || 'badge bg-secondary'
}
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.card {
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.badge {
  font-size: 0.75rem;
}

.table th {
  border-top: none;
  font-weight: 600;
  background-color: #f8f9fa;
}

.text-primary {
  color: #0d6efd !important;
}

.text-success {
  color: #198754 !important;
}

.text-warning {
  color: #ffc107 !important;
}

.text-muted {
  color: #6c757d !important;
}

.border-bottom {
  border-bottom: 1px solid #dee2e6 !important;
}

.border-top {
  border-top: 1px solid #dee2e6 !important;
}
</style>
