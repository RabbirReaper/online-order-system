<template>
  <div>
    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div class="alert alert-danger" v-if="errorMessage">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
    </div>

    <div v-if="user && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ user.name }} - 用戶詳情</h4>
        <div class="d-flex">
          <button class="btn btn-success me-2" @click="showSendCouponModal">
            <i class="bi bi-gift me-1"></i>發送優惠券
          </button>
          <button class="btn btn-secondary me-2" @click="refreshData">
            <i class="bi bi-arrow-clockwise me-1"></i>重新整理
          </button>
          <router-link :to="`/admin/${brandId}/customers`" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 統計區域 -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">可用優惠券</h6>
                  <h3 class="mb-0">{{ statistics.activeCoupons }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-ticket-perforated fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">可用兌換券</h6>
                  <h3 class="mb-0">{{ statistics.activeVouchers }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-receipt fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">總訂單數</h6>
                  <h3 class="mb-0">{{ statistics.totalOrders }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-bag-check fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">累計消費</h6>
                  <h3 class="mb-0">${{ formatPrice(statistics.totalSpent) }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-currency-dollar fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 用戶基本資訊 -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">基本資訊</h5>

              <div class="mb-3">
                <h6 class="text-muted mb-1">姓名</h6>
                <p>{{ user.name }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">電話</h6>
                <p>{{ user.phone }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">電子郵件</h6>
                <p>{{ user.email || '未提供' }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">狀態</h6>
                <p>
                  <span class="badge" :class="user.isActive ? 'bg-success' : 'bg-secondary'">
                    {{ user.isActive ? '啟用' : '停用' }}
                  </span>
                </p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">註冊日期</h6>
                <p>{{ formatDate(user.createdAt) }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">生日</h6>
                <p>{{ user.dateOfBirth ? formatDate(user.dateOfBirth) : '未提供' }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">性別</h6>
                <p>{{ formatGender(user.gender) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">地址資訊</h5>

              <div v-if="user.addresses && user.addresses.length > 0">
                <div
                  v-for="(address, index) in user.addresses"
                  :key="index"
                  class="mb-3 p-3 border rounded"
                >
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="mb-1">
                        {{ address.name }}
                        <span v-if="address.isDefault" class="badge bg-primary ms-2">預設</span>
                      </h6>
                      <p class="text-muted mb-0">{{ address.address }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center text-muted py-3">
                <i class="bi bi-geo-alt fs-1"></i>
                <p class="mb-0">尚未新增地址</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 優惠券列表 -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="card-title mb-0">優惠券 ({{ coupons.length }})</h5>
                <div class="btn-group">
                  <button
                    class="btn btn-sm"
                    :class="couponFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="couponFilter = 'all'"
                  >
                    全部
                  </button>
                  <button
                    class="btn btn-sm"
                    :class="couponFilter === 'active' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="couponFilter = 'active'"
                  >
                    可用
                  </button>
                  <button
                    class="btn btn-sm"
                    :class="couponFilter === 'used' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="couponFilter = 'used'"
                  >
                    已使用
                  </button>
                  <button
                    class="btn btn-sm"
                    :class="couponFilter === 'expired' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="couponFilter = 'expired'"
                  >
                    已過期
                  </button>
                </div>
              </div>

              <div v-if="filteredCoupons.length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>優惠券名稱</th>
                      <th>折扣內容</th>
                      <th>狀態</th>
                      <th>獲得時間</th>
                      <th>到期時間</th>
                      <th>使用時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="coupon in filteredCoupons" :key="coupon._id">
                      <td>{{ coupon.couponName }}</td>
                      <td>
                        <template v-if="coupon.discountInfo.discountType === 'percentage'">
                          {{ coupon.discountInfo.discountValue }}% 折扣
                        </template>
                        <template v-else>
                          折抵 ${{ formatPrice(coupon.discountInfo.discountValue) }}
                        </template>
                      </td>
                      <td>
                        <span class="badge" :class="getCouponStatusClass(coupon)">
                          {{ getCouponStatusText(coupon) }}
                        </span>
                      </td>
                      <td>{{ formatDate(coupon.acquiredAt) }}</td>
                      <td>{{ formatDate(coupon.expiryDate) }}</td>
                      <td>{{ coupon.usedAt ? formatDate(coupon.usedAt) : '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="text-center text-muted py-4">
                <i class="bi bi-ticket-perforated fs-1"></i>
                <p class="mb-0">{{ getCouponEmptyMessage() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 兌換券列表 -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="card-title mb-0">兌換券 ({{ vouchers.length }})</h5>
                <div class="btn-group">
                  <button
                    class="btn btn-sm"
                    :class="voucherFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="voucherFilter = 'all'"
                  >
                    全部
                  </button>
                  <button
                    class="btn btn-sm"
                    :class="voucherFilter === 'active' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="voucherFilter = 'active'"
                  >
                    可用
                  </button>
                  <button
                    class="btn btn-sm"
                    :class="voucherFilter === 'used' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="voucherFilter = 'used'"
                  >
                    已使用
                  </button>
                  <button
                    class="btn btn-sm"
                    :class="voucherFilter === 'expired' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="voucherFilter = 'expired'"
                  >
                    已過期
                  </button>
                </div>
              </div>

              <div v-if="filteredVouchers.length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>兌換券名稱</th>
                      <th>可兌換餐點</th>
                      <th>狀態</th>
                      <th>獲得時間</th>
                      <th>到期時間</th>
                      <th>使用時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="voucher in filteredVouchers" :key="voucher._id">
                      <td>{{ voucher.voucherName }}</td>
                      <td>{{ voucher.exchangeDishTemplate?.name || '未知餐點' }}</td>
                      <td>
                        <span class="badge" :class="getVoucherStatusClass(voucher)">
                          {{ getVoucherStatusText(voucher) }}
                        </span>
                      </td>
                      <td>{{ formatDate(voucher.acquiredAt) }}</td>
                      <td>{{ formatDate(voucher.expiryDate) }}</td>
                      <td>{{ voucher.usedAt ? formatDate(voucher.usedAt) : '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="text-center text-muted py-4">
                <i class="bi bi-receipt fs-1"></i>
                <p class="mb-0">{{ getVoucherEmptyMessage() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 訂單歷史 -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="card-title mb-0">訂單歷史 ({{ orders.length }})</h5>
                <div
                  v-if="isLoadingOrders"
                  class="spinner-border spinner-border-sm text-primary"
                  role="status"
                >
                  <span class="visually-hidden">載入訂單中...</span>
                </div>
              </div>

              <div v-if="orders.length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>訂單編號</th>
                      <th>訂單類型</th>
                      <th>訂單金額</th>
                      <th>支付狀態</th>
                      <th>下單時間</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in paginatedOrders" :key="order._id">
                      <td>
                        <code
                          >{{ order.orderDateCode }}-{{
                            String(order.sequence).padStart(3, '0')
                          }}</code
                        >
                      </td>
                      <td>
                        <span class="badge bg-info">{{ getOrderTypeText(order.orderType) }}</span>
                      </td>
                      <td>${{ formatPrice(order.total) }}</td>
                      <td>
                        <span class="badge" :class="getOrderStatusClass(order.status)">
                          {{ getOrderStatusText(order.status) }}
                        </span>
                      </td>
                      <td>{{ formatDate(order.createdAt) }}</td>
                      <td>
                        <router-link
                          :to="`/admin/${brandId}/orders/${order._id}`"
                          class="btn btn-sm btn-outline-primary"
                        >
                          <i class="bi bi-eye me-1"></i>查看
                        </router-link>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- 訂單分頁 -->
                <nav aria-label="訂單列表分頁" v-if="orderTotalPages > 1" class="mt-3">
                  <b-pagination
                    v-model="orderCurrentPage"
                    :total-rows="orders.length"
                    :per-page="orderPerPage"
                    align="center"
                  >
                  </b-pagination>
                </nav>
              </div>

              <div v-else class="text-center text-muted py-4">
                <i class="bi bi-bag-x fs-1"></i>
                <p class="mb-0">尚無訂單記錄</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 發送優惠券模態框 -->
    <b-modal
      v-model="showSendCouponModalFlag"
      title="發送優惠券"
      @ok="sendCoupon"
      @cancel="cancelSendCoupon"
      ok-variant="success"
      cancel-variant="secondary"
      :ok-disabled="!selectedCouponTemplate || isSending"
      ok-title="確認送出"
      cancel-title="取消"
      no-close-on-backdrop
      no-close-on-esc
      :no-header-close="true"
    >
      <div v-if="isSending" class="text-center py-3">
        <div class="spinner-border text-primary me-2" role="status"></div>
        正在發送優惠券...
      </div>

      <div v-else>
        <div class="mb-3">
          <label for="couponTemplate" class="form-label">選擇優惠券模板</label>
          <select class="form-select" id="couponTemplate" v-model="selectedCouponTemplate">
            <option value="">請選擇優惠券模板</option>
            <option v-for="template in couponTemplates" :key="template._id" :value="template._id">
              {{ template.name }} -
              <template v-if="template.discountInfo.discountType === 'percentage'">
                {{ template.discountInfo.discountValue }}% 折扣
              </template>
              <template v-else>
                折抵 ${{ formatPrice(template.discountInfo.discountValue) }}
              </template>
            </option>
          </select>
        </div>

        <div class="mb-3">
          <label for="sendReason" class="form-label">發送原因</label>
          <input
            type="text"
            class="form-control"
            id="sendReason"
            v-model="sendReason"
            placeholder="例如：活動獎勵、客服補償等"
          />
        </div>

        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          <strong>注意：</strong>優惠券將立即發送給用戶「{{ user?.name }}」
        </div>
      </div>

      <template #modal-ok>
        <div v-if="isSending" class="spinner-border spinner-border-sm me-2" role="status"></div>
        {{ isSending ? '發送中...' : '確認發送' }}
      </template>
    </b-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { BModal, BPagination } from 'bootstrap-vue-next'
import api from '@/api'

// 路由
const route = useRoute()

// 從路由中獲取品牌ID和用戶ID
const brandId = computed(() => route.params.brandId)
const customerId = computed(() => route.params.customerId)

// 狀態變數
const isLoading = ref(true)
const isLoadingCoupons = ref(false)
const isLoadingVouchers = ref(false)
const isLoadingOrders = ref(false)
const isSending = ref(false)
const errorMessage = ref('')

// 用戶相關數據
const user = ref(null)
const coupons = ref([])
const vouchers = ref([])
const orders = ref([])
const couponTemplates = ref([])

// 統計數據
const statistics = ref({
  activeCoupons: 0,
  activeVouchers: 0,
  totalOrders: 0,
  totalSpent: 0,
})

// 篩選狀態
const couponFilter = ref('all')
const voucherFilter = ref('all')

// 分頁狀態 (訂單)
const orderCurrentPage = ref(1)
const orderPerPage = ref(10)

// 發送優惠券相關
const showSendCouponModalFlag = ref(false)
const selectedCouponTemplate = ref('')
const sendReason = ref('')

// 計算過濾後的優惠券
const filteredCoupons = computed(() => {
  const now = new Date()

  switch (couponFilter.value) {
    case 'active':
      return coupons.value.filter((coupon) => !coupon.isUsed && new Date(coupon.expiryDate) > now)
    case 'used':
      return coupons.value.filter((coupon) => coupon.isUsed)
    case 'expired':
      return coupons.value.filter((coupon) => !coupon.isUsed && new Date(coupon.expiryDate) <= now)
    default:
      return coupons.value
  }
})

// 計算過濾後的兌換券
const filteredVouchers = computed(() => {
  const now = new Date()

  switch (voucherFilter.value) {
    case 'active':
      return vouchers.value.filter(
        (voucher) => !voucher.isUsed && new Date(voucher.expiryDate) > now,
      )
    case 'used':
      return vouchers.value.filter((voucher) => voucher.isUsed)
    case 'expired':
      return vouchers.value.filter(
        (voucher) => !voucher.isUsed && new Date(voucher.expiryDate) <= now,
      )
    default:
      return vouchers.value
  }
})

// 計算分頁後的訂單
const paginatedOrders = computed(() => {
  const start = (orderCurrentPage.value - 1) * orderPerPage.value
  const end = start + orderPerPage.value
  return orders.value.slice(start, end)
})

// 計算訂單總頁數
const orderTotalPages = computed(() => {
  return Math.ceil(orders.value.length / orderPerPage.value)
})

// 格式化價格
const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化性別
const formatGender = (gender) => {
  const genderMap = {
    male: '男性',
    female: '女性',
    other: '其他',
    prefer_not_to_say: '不願透露',
  }
  return genderMap[gender] || '未提供'
}

// 獲取優惠券狀態樣式
const getCouponStatusClass = (coupon) => {
  if (coupon.isUsed) return 'bg-secondary'
  if (new Date(coupon.expiryDate) <= new Date()) return 'bg-danger'
  return 'bg-success'
}

// 獲取優惠券狀態文字
const getCouponStatusText = (coupon) => {
  if (coupon.isUsed) return '已使用'
  if (new Date(coupon.expiryDate) <= new Date()) return '已過期'
  return '可用'
}

// 獲取兌換券狀態樣式
const getVoucherStatusClass = (voucher) => {
  if (voucher.isUsed) return 'bg-secondary'
  if (new Date(voucher.expiryDate) <= new Date()) return 'bg-danger'
  return 'bg-success'
}

// 獲取兌換券狀態文字
const getVoucherStatusText = (voucher) => {
  if (voucher.isUsed) return '已使用'
  if (new Date(voucher.expiryDate) <= new Date()) return '已過期'
  return '可用'
}

// 獲取優惠券空狀態訊息
const getCouponEmptyMessage = () => {
  switch (couponFilter.value) {
    case 'active':
      return '沒有可用的優惠券'
    case 'used':
      return '沒有已使用的優惠券'
    case 'expired':
      return '沒有已過期的優惠券'
    default:
      return '尚無優惠券'
  }
}

// 獲取兌換券空狀態訊息
const getVoucherEmptyMessage = () => {
  switch (voucherFilter.value) {
    case 'active':
      return '沒有可用的兌換券'
    case 'used':
      return '沒有已使用的兌換券'
    case 'expired':
      return '沒有已過期的兌換券'
    default:
      return '尚無兌換券'
  }
}

// 獲取訂單類型文字
const getOrderTypeText = (type) => {
  const typeMap = {
    dine_in: '內用',
    takeout: '外帶',
    delivery: '外送',
  }
  return typeMap[type] || type
}

// 獲取訂單狀態樣式
const getOrderStatusClass = (status) => {
  const statusMap = {
    unpaid: 'bg-warning',
    paid: 'bg-success',
    cancelled: 'bg-danger',
  }
  return statusMap[status] || 'bg-secondary'
}

// 獲取訂單狀態文字
const getOrderStatusText = (status) => {
  const statusMap = {
    unpaid: '未付款',
    paid: '已付款',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

// 顯示發送優惠券模態框
const showSendCouponModal = () => {
  selectedCouponTemplate.value = ''
  sendReason.value = ''
  showSendCouponModalFlag.value = true
  fetchCouponTemplates()
}

// 取消發送優惠券
const cancelSendCoupon = () => {
  selectedCouponTemplate.value = ''
  sendReason.value = ''
  showSendCouponModalFlag.value = false
}

// 獲取用戶詳情
const fetchUserData = async () => {
  if (!customerId.value || !brandId.value) return

  try {
    const response = await api.adminUser.getUserById({
      brandId: brandId.value,
      id: customerId.value,
    })

    if (response && response.user) {
      user.value = response.user
    } else {
      errorMessage.value = '獲取用戶資料失敗'
    }
  } catch (error) {
    console.error('獲取用戶資料失敗:', error)
    if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message
    } else {
      errorMessage.value = '獲取用戶資料時發生錯誤'
    }
  }
}

// 獲取用戶優惠券 (管理員查詢) - 使用新的API
const fetchUserCoupons = async () => {
  if (!brandId.value || !customerId.value) return

  isLoadingCoupons.value = true

  try {
    // 使用新的管理員API查詢特定用戶的優惠券
    const response = await api.promotion.getUserCouponInstancesAdmin({
      brandId: brandId.value,
      userId: customerId.value,
      options: {
        includeUsed: true,
        includeExpired: true,
        limit: 100,
      },
    })

    if (response && response.coupons) {
      coupons.value = response.coupons
    }
  } catch (error) {
    console.error('獲取用戶優惠券失敗:', error)
    coupons.value = []
  } finally {
    isLoadingCoupons.value = false
  }
}

// 獲取用戶兌換券 - 使用新的管理員API
const fetchUserVouchers = async () => {
  if (!brandId.value || !customerId.value) return

  isLoadingVouchers.value = true

  try {
    // 使用新的管理員API查詢特定用戶的兌換券
    const response = await api.promotion.getUserVoucherInstancesAdmin({
      brandId: brandId.value,
      userId: customerId.value,
      options: {
        includeUsed: true,
        includeExpired: true,
        limit: 100,
      },
    })

    if (response && response.vouchers) {
      vouchers.value = response.vouchers
    }
  } catch (error) {
    console.error('獲取用戶兌換券失敗:', error)
    vouchers.value = []
  } finally {
    isLoadingVouchers.value = false
  }
}

// 🔧 修復的更新統計數據函數
const updateStatistics = async () => {
  console.log('=== 開始更新統計數據 ===')

  const now = new Date()

  // 計算優惠券和兌換券統計
  const activeCoupons = coupons.value.filter(
    (c) => !c.isUsed && new Date(c.expiryDate) > now,
  ).length
  const activeVouchers = vouchers.value.filter(
    (v) => !v.isUsed && new Date(v.expiryDate) > now,
  ).length

  console.log('📊 券類統計:', { activeCoupons, activeVouchers })
  console.log('📦 當前訂單數據:', {
    length: orders.value.length,
    firstOrder: orders.value[0] || null,
    allOrders: orders.value.map((o) => ({ id: o._id, status: o.status, total: o.total })),
  })

  // 嘗試使用後端統計
  console.log('📊 使用前端計算...')

  // 前端計算訂單統計
  const totalOrders = orders.value.length
  const paidOrders = orders.value.filter((o) => {
    console.log(`檢查訂單 ${o._id}: status=${o.status}, total=${o.total}`)
    return o.status === 'paid'
  })

  const totalSpent = paidOrders.reduce((sum, o) => {
    const orderTotal = Number(o.total) || 0
    console.log(`累加訂單 ${o._id}: $${orderTotal}`)
    return sum + orderTotal
  }, 0)

  console.log('📊 前端計算結果:', {
    totalOrders,
    paidOrdersCount: paidOrders.length,
    totalSpent,
  })

  // 更新統計數據
  statistics.value.totalOrders = totalOrders
  statistics.value.totalSpent = totalSpent

  // 更新其他統計數據
  statistics.value.activeCoupons = activeCoupons
  statistics.value.activeVouchers = activeVouchers

  console.log('✅ 最終統計數據:', {
    activeCoupons: statistics.value.activeCoupons,
    activeVouchers: statistics.value.activeVouchers,
    totalOrders: statistics.value.totalOrders,
    totalSpent: statistics.value.totalSpent,
  })
  console.log('=== 統計數據更新完成 ===')
}

// 🔧 修復的獲取用戶訂單函數
const fetchUserOrders = async () => {
  if (!brandId.value || !customerId.value) return

  isLoadingOrders.value = true

  try {
    console.log('📦 開始獲取用戶訂單，用戶ID:', customerId.value)

    const response = await api.orderAdmin.getUserOrders({
      brandId: brandId.value,
      userId: customerId.value,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })

    if (response && response.orders) {
      orders.value = response.orders
      console.log(`✅ 成功獲取 ${response.orders.length} 筆用戶訂單`)
      console.log(
        '📦 訂單詳情:',
        orders.value.map((o) => ({
          id: o._id,
          status: o.status,
          total: o.total,
          type: o.orderType,
          date: o.createdAt,
        })),
      )
    } else {
      orders.value = []
      console.warn('⚠️ API回應中沒有訂單數據')
    }
  } catch (error) {
    console.error('❌ 獲取用戶訂單失敗:', error)
    orders.value = []

    if (error.response?.status === 403) {
      errorMessage.value = '沒有權限查看訂單資料'
    } else if (error.response?.status === 404) {
      errorMessage.value = '找不到相關訂單資料'
    } else {
      errorMessage.value = '獲取訂單資料時發生錯誤，請稍後再試'
    }
  } finally {
    isLoadingOrders.value = false

    // 🔧 關鍵：確保在訂單載入完成後立即更新統計
    console.log('🔧 訂單載入完成，開始更新統計...')
    await updateStatistics()
  }
}

// 獲取優惠券模板
const fetchCouponTemplates = async () => {
  if (!brandId.value) return

  try {
    const response = await api.promotion.getAllCouponTemplates(brandId.value)

    if (response && response.templates) {
      couponTemplates.value = response.templates.filter((template) => template.isActive)
    }
  } catch (error) {
    console.error('獲取優惠券模板失敗:', error)
  }
}

// 發送優惠券 - 使用修正後的參數結構
const sendCoupon = async () => {
  if (!selectedCouponTemplate.value || !user.value) return

  isSending.value = true

  try {
    const response = await api.promotion.issueCouponToUser({
      brandId: brandId.value,
      data: {
        userId: user.value._id, // 修正：使用 userId 而不是 customerId
        templateId: selectedCouponTemplate.value,
        reason: sendReason.value || '管理員發送',
      },
    })

    if (response.success) {
      alert('優惠券發送成功！')
      showSendCouponModalFlag.value = false

      // 重新載入優惠券數據
      await fetchUserCoupons()
      await updateStatistics()
    } else {
      alert('發送失敗：' + (response.message || '未知錯誤'))
    }
  } catch (error) {
    console.error('發送優惠券失敗:', error)
    const errorMessage = error.response?.data?.message || '發送優惠券時發生錯誤'
    alert('發送失敗：' + errorMessage)
  } finally {
    isSending.value = false
  }
}

// 🔧 修復的重新整理函數
const refreshData = async () => {
  console.log('🔄 開始重新整理所有數據...')

  try {
    // 並行載入基本資料
    await Promise.all([fetchUserData(), fetchUserCoupons(), fetchUserVouchers()])

    // 載入訂單數據（會自動觸發統計更新）
    await fetchUserOrders()

    console.log('✅ 所有數據重新整理完成')
  } catch (error) {
    console.error('❌ 重新整理數據失敗:', error)
  }
}

// 🔧 修復的生命週期鉤子
onMounted(async () => {
  console.log('🚀 組件掛載，開始載入數據...')
  isLoading.value = true

  try {
    // 並行載入基本資料
    await Promise.all([fetchUserData(), fetchUserCoupons(), fetchUserVouchers()])

    // 載入訂單數據（會自動觸發統計更新）
    await fetchUserOrders()

    console.log('✅ 所有數據載入完成')
  } catch (error) {
    console.error('❌ 載入數據時發生錯誤:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-title {
  font-weight: 600;
}

.badge {
  font-weight: 500;
  font-size: 0.85rem;
}

.table th,
.table td {
  vertical-align: middle;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}

/* 統計卡片樣式 */
.card.bg-primary,
.card.bg-success,
.card.bg-info,
.card.bg-warning {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card.bg-primary .card-title,
.card.bg-success .card-title,
.card.bg-info .card-title,
.card.bg-warning .card-title {
  opacity: 0.9;
}
</style>
