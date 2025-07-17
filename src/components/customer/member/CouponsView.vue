<template>
  <div class="main-container">
    <!-- 頂部導航欄 -->
    <div class="nav-container">
      <div class="nav-wrapper">
        <nav class="navbar navbar-light">
          <div class="container-fluid px-3">
            <a class="navbar-brand" href="#" @click.prevent="goBack">
              <i class="bi bi-arrow-left me-2"></i>返回
            </a>
            <div class="navbar-title">我的優惠券</div>
            <div class="nav-placeholder"></div>
          </div>
        </nav>
        <div class="nav-border"></div>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
        <p class="mt-3">載入您的券資料中，請稍候...</p>
      </div>

      <div v-else-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
        <button class="btn btn-outline-danger btn-sm mt-2" @click="loadCouponsData">
          <i class="bi bi-arrow-clockwise me-1"></i>重新載入
        </button>
      </div>

      <div v-else class="coupons-content">
        <!-- 券類型切換 -->
        <div class="type-navigation">
          <button
            class="type-btn"
            :class="{ active: activeType === 'all' }"
            @click="activeType = 'all'"
          >
            全部 ({{ allItems.length }})
          </button>
          <button
            class="type-btn"
            :class="{ active: activeType === 'coupon' }"
            @click="activeType = 'coupon'"
          >
            優惠券 ({{ couponItems.length }})
          </button>
          <button
            class="type-btn"
            :class="{ active: activeType === 'voucher' }"
            @click="activeType = 'voucher'"
          >
            兌換券 ({{ voucherItems.length }})
          </button>
        </div>

        <!-- 券總覽 -->
        <div class="coupons-overview">
          <div class="overview-stats">
            <div class="stat-item">
              <div class="stat-number">{{ availableItems.length }}</div>
              <div class="stat-label">可用</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ usedItems.length }}</div>
              <div class="stat-label">已使用</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ expiredItems.length }}</div>
              <div class="stat-label">已過期</div>
            </div>
          </div>
        </div>

        <!-- 狀態標籤頁切換 -->
        <div class="tab-navigation">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'available' }"
            @click="activeTab = 'available'"
          >
            可使用 ({{ availableItems.length }})
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'used' }"
            @click="activeTab = 'used'"
          >
            已使用 ({{ usedItems.length }})
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'expired' }"
            @click="activeTab = 'expired'"
          >
            已過期 ({{ expiredItems.length }})
          </button>
        </div>

        <!-- 券列表 -->
        <div class="coupons-list">
          <!-- 可使用的券 -->
          <div v-if="activeTab === 'available'">
            <div v-if="availableItems.length > 0">
              <div v-for="item in availableItems" :key="item._id" class="coupon-card available">
                <div class="coupon-left">
                  <div class="coupon-type-icon">
                    <i :class="getItemIcon(item)"></i>
                  </div>
                  <div class="coupon-value">
                    <span
                      v-if="item._type === 'coupon' && item.discountInfo?.discountType === 'fixed'"
                      class="discount-amount"
                    >
                      ${{ item.discountInfo.discountValue }}
                    </span>
                    <span
                      v-else-if="
                        item._type === 'coupon' && item.discountInfo?.discountType === 'percentage'
                      "
                      class="discount-amount"
                    >
                      {{ item.discountInfo.discountValue }}%
                    </span>
                    <span v-else class="exchange-label">
                      {{ item._type === 'voucher' ? '兌換券' : '優惠券' }}
                    </span>
                  </div>
                  <div class="coupon-type-tag">
                    <span :class="getTypeTagClass(item._type)">
                      {{ getTypeLabel(item._type) }}
                    </span>
                  </div>
                </div>
                <div class="coupon-content">
                  <h6 class="coupon-title">{{ getItemName(item) }}</h6>
                  <p class="coupon-desc">{{ getItemDescription(item) }}</p>
                  <div class="coupon-validity">
                    <i class="bi bi-calendar3 me-1"></i>
                    有效期至：{{ formatDate(item.expiryDate) }}
                  </div>
                  <div class="coupon-acquired">
                    <i class="bi bi-clock me-1"></i>
                    獲得時間：{{ formatDate(item.acquiredAt) }}
                  </div>
                </div>
                <div class="coupon-actions">
                  <button class="btn btn-primary btn-sm" @click="showItemDetail(item)">
                    查看詳情
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-ticket-perforated text-muted" style="font-size: 4rem"></i>
              <h5 class="mt-3 text-muted">沒有可用的券</h5>
              <p class="text-muted">完成訂單或達成條件即可獲得優惠券和兌換券！</p>
            </div>
          </div>

          <!-- 已使用的券 -->
          <div v-if="activeTab === 'used'">
            <div v-if="usedItems.length > 0">
              <div v-for="item in usedItems" :key="item._id" class="coupon-card used">
                <div class="coupon-left">
                  <div class="coupon-type-icon">
                    <i :class="getItemIcon(item)"></i>
                  </div>
                  <div class="coupon-value">
                    <span
                      v-if="item._type === 'coupon' && item.discountInfo?.discountType === 'fixed'"
                      class="discount-amount"
                    >
                      ${{ item.discountInfo.discountValue }}
                    </span>
                    <span
                      v-else-if="
                        item._type === 'coupon' && item.discountInfo?.discountType === 'percentage'
                      "
                      class="discount-amount"
                    >
                      {{ item.discountInfo.discountValue }}%
                    </span>
                    <span v-else class="exchange-label">
                      {{ item._type === 'voucher' ? '兌換券' : '優惠券' }}
                    </span>
                  </div>
                  <div class="coupon-type-tag">
                    <span :class="getTypeTagClass(item._type)">
                      {{ getTypeLabel(item._type) }}
                    </span>
                  </div>
                </div>
                <div class="coupon-content">
                  <h6 class="coupon-title">{{ getItemName(item) }}</h6>
                  <p class="coupon-desc">{{ getItemDescription(item) }}</p>
                  <div class="coupon-used-info">
                    <i class="bi bi-check-circle-fill me-1 text-success"></i>
                    於 {{ formatDate(item.usedAt) }} 使用
                  </div>
                  <div class="coupon-order" v-if="item.order">
                    <i class="bi bi-bag me-1"></i>
                    訂單ID：{{ item.order }}
                  </div>
                </div>
                <div class="coupon-status">
                  <span class="badge bg-success">已使用</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-check2-circle text-muted" style="font-size: 4rem"></i>
              <h5 class="mt-3 text-muted">沒有使用記錄</h5>
              <p class="text-muted">您還沒有使用過任何券</p>
            </div>
          </div>

          <!-- 已過期的券 -->
          <div v-if="activeTab === 'expired'">
            <div v-if="expiredItems.length > 0">
              <div v-for="item in expiredItems" :key="item._id" class="coupon-card expired">
                <div class="coupon-left">
                  <div class="coupon-type-icon">
                    <i :class="getItemIcon(item)"></i>
                  </div>
                  <div class="coupon-value">
                    <span
                      v-if="item._type === 'coupon' && item.discountInfo?.discountType === 'fixed'"
                      class="discount-amount"
                    >
                      ${{ item.discountInfo.discountValue }}
                    </span>
                    <span
                      v-else-if="
                        item._type === 'coupon' && item.discountInfo?.discountType === 'percentage'
                      "
                      class="discount-amount"
                    >
                      {{ item.discountInfo.discountValue }}%
                    </span>
                    <span v-else class="exchange-label">
                      {{ item._type === 'voucher' ? '兌換券' : '優惠券' }}
                    </span>
                  </div>
                  <div class="coupon-type-tag">
                    <span :class="getTypeTagClass(item._type)">
                      {{ getTypeLabel(item._type) }}
                    </span>
                  </div>
                </div>
                <div class="coupon-content">
                  <h6 class="coupon-title">{{ getItemName(item) }}</h6>
                  <p class="coupon-desc">{{ getItemDescription(item) }}</p>
                  <div class="coupon-expired-info">
                    <i class="bi bi-x-circle-fill me-1 text-danger"></i>
                    於 {{ formatDate(item.expiryDate) }} 過期
                  </div>
                </div>
                <div class="coupon-status">
                  <span class="badge bg-danger">已過期</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-clock-history text-muted" style="font-size: 4rem"></i>
              <h5 class="mt-3 text-muted">沒有過期的券</h5>
              <p class="text-muted">很好！您沒有浪費任何券</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 券詳情模態框 -->
  <BModal id="itemDetailModal" title="券詳情" size="lg" ref="itemDetailModal">
    <div v-if="selectedItem" class="coupon-detail">
      <div class="detail-header">
        <div class="detail-icon">
          <i :class="getItemIcon(selectedItem)"></i>
        </div>
        <div class="detail-info">
          <h4>{{ getItemName(selectedItem) }}</h4>
          <span :class="getTypeTagClass(selectedItem._type)" class="me-2">
            {{ getTypeLabel(selectedItem._type) }}
          </span>
          <p class="text-muted">{{ getItemDescription(selectedItem) }}</p>
        </div>
      </div>

      <div class="detail-content">
        <!-- 優惠券詳情 -->
        <div v-if="selectedItem._type === 'coupon'">
          <div class="detail-item">
            <strong>優惠內容：</strong>
            <span v-if="selectedItem.discountInfo?.discountType === 'fixed'">
              折抵 ${{ selectedItem.discountInfo.discountValue }} 元
            </span>
            <span v-else-if="selectedItem.discountInfo?.discountType === 'percentage'">
              {{ selectedItem.discountInfo.discountValue }}% 折扣
            </span>
            <span v-else>優惠券</span>
          </div>
          <div class="detail-item" v-if="selectedItem.discountInfo?.maxDiscountAmount">
            <strong>最高折抵：</strong>
            ${{ selectedItem.discountInfo.maxDiscountAmount }} 元
          </div>
          <div class="detail-item" v-if="selectedItem.discountInfo?.minPurchaseAmount">
            <strong>最低消費：</strong>
            ${{ selectedItem.discountInfo.minPurchaseAmount }} 元
          </div>
        </div>

        <!-- 兌換券詳情 -->
        <div v-else-if="selectedItem._type === 'voucher'">
          <div class="detail-item">
            <strong>兌換內容：</strong>
            <span v-if="selectedItem.exchangeDishTemplate">
              {{ selectedItem.exchangeDishTemplate.name || '指定餐點' }}
            </span>
            <span v-else>兌換券</span>
          </div>
          <div class="detail-item" v-if="selectedItem.exchangeDishTemplate?.basePrice">
            <strong>餐點價值：</strong>
            ${{ selectedItem.exchangeDishTemplate.basePrice }} 元
          </div>
        </div>

        <!-- 共同資訊 -->
        <div class="detail-item">
          <strong>獲得時間：</strong>
          {{ formatDateTime(selectedItem.acquiredAt) }}
        </div>

        <div class="detail-item">
          <strong>有效期限：</strong>
          {{ formatDateTime(selectedItem.expiryDate) }}
        </div>

        <div class="detail-item" v-if="selectedItem.usedAt">
          <strong>使用時間：</strong>
          {{ formatDateTime(selectedItem.usedAt) }}
        </div>

        <div class="detail-item" v-if="selectedItem.order">
          <strong>使用訂單：</strong>
          {{ selectedItem.order }}
        </div>
      </div>
    </div>

    <template #footer>
      <BButton variant="secondary" @click="$refs.itemDetailModal.hide()">關閉</BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/customerAuth'
import { BModal, BButton } from 'bootstrap-vue-next'
import api from '@/api'

// 路由和認證
const router = useRouter()
const authStore = useAuthStore()

// 模態框參考
const itemDetailModal = ref(null)

// 狀態管理
const isLoading = ref(true)
const errorMessage = ref('')
const activeTab = ref('available') // 狀態標籤：available, used, expired
const activeType = ref('all') // 類型標籤：all, coupon, voucher
const selectedItem = ref(null)

// 券資料
const allItems = ref([]) // 存放所有券（優惠券+兌換券）

// 品牌ID計算屬性
const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId')
})

// 按類型篩選
const couponItems = computed(() => {
  return allItems.value.filter((item) => item._type === 'coupon')
})

const voucherItems = computed(() => {
  return allItems.value.filter((item) => item._type === 'voucher')
})

// 根據選擇的類型獲取當前顯示的項目
const currentTypeItems = computed(() => {
  if (activeType.value === 'coupon') return couponItems.value
  if (activeType.value === 'voucher') return voucherItems.value
  return allItems.value // all
})

// 按狀態分類券
const availableItems = computed(() => {
  const now = new Date()
  return currentTypeItems.value.filter((item) => !item.isUsed && new Date(item.expiryDate) > now)
})

const usedItems = computed(() => {
  return currentTypeItems.value.filter((item) => item.isUsed)
})

const expiredItems = computed(() => {
  const now = new Date()
  return currentTypeItems.value.filter((item) => !item.isUsed && new Date(item.expiryDate) <= now)
})

// 返回上一頁
const goBack = () => {
  router.push('/member')
}

// 獲取券類型標籤樣式
const getTypeTagClass = (type) => {
  return type === 'coupon' ? 'badge bg-warning text-dark' : 'badge bg-info'
}

// 獲取券類型標籤文字
const getTypeLabel = (type) => {
  return type === 'coupon' ? '優惠券' : '兌換券'
}

// 獲取券圖標
const getItemIcon = (item) => {
  if (item._type === 'voucher') {
    return 'bi bi-gift text-primary' // 兌換券圖標
  }

  // 優惠券圖標
  const iconMap = {
    percentage: 'bi bi-percent text-success',
    fixed: 'bi bi-cash text-success',
  }
  return iconMap[item.discountInfo?.discountType] || 'bi bi-ticket-perforated text-secondary'
}

// 獲取券名稱
const getItemName = (item) => {
  if (item._type === 'coupon') {
    return item.couponName || '優惠券'
  } else {
    return item.voucherName || item.name || '兌換券'
  }
}

// 獲取券描述
const getItemDescription = (item) => {
  if (item._type === 'voucher') {
    // 兌換券描述
    if (item.exchangeDishTemplate) {
      return `可兌換：${item.exchangeDishTemplate.name || '指定餐點'}`
    }
    return '兌換券'
  }

  // 優惠券描述
  if (!item.discountInfo) {
    return '優惠券'
  }

  const { discountType, discountValue, maxDiscountAmount, minPurchaseAmount } = item.discountInfo

  let description = ''

  if (discountType === 'fixed') {
    description = `折抵 $${discountValue} 元`
  } else if (discountType === 'percentage') {
    description = `${discountValue}% 折扣`
    if (maxDiscountAmount) {
      description += `（最高折抵 $${maxDiscountAmount} 元）`
    }
  }

  if (minPurchaseAmount > 0) {
    description += `，滿 $${minPurchaseAmount} 元可用`
  }

  return description || '優惠券'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未設定'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '無效日期'
  return date.toLocaleDateString('zh-TW')
}

// 格式化日期時間
const formatDateTime = (dateString) => {
  if (!dateString) return '未設定'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '無效日期'
  return date.toLocaleString('zh-TW')
}

// 顯示券詳情
const showItemDetail = (item) => {
  selectedItem.value = item
  if (itemDetailModal.value) {
    itemDetailModal.value.show()
  }
}

// 載入券資料
const loadCouponsData = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const currentBrandId = brandId.value

    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊')
    }

    // 檢查用戶是否已登入
    if (!authStore.isLoggedIn) {
      throw new Error('請先登入以查看券資料')
    }

    // console.log('🔍 開始同時載入優惠券和兌換券...')

    // 🔥 同時獲取優惠券和兌換券
    const [couponsResponse, vouchersResponse] = await Promise.all([
      // 獲取優惠券 (折價券)
      api.promotion
        .getUserCoupons(currentBrandId, {
          includeUsed: true,
          includeExpired: true,
        })
        .catch((error) => {
          console.warn('獲取優惠券失敗:', error)
          return { coupons: [] }
        }),

      // 獲取兌換券
      api.promotion
        .getUserVouchers(currentBrandId, {
          includeUsed: true,
          includeExpired: true,
        })
        .catch((error) => {
          console.warn('獲取兌換券失敗:', error)
          return { vouchers: [] }
        }),
    ])

    // console.log('📥 優惠券回應:', couponsResponse)
    // console.log('📥 兌換券回應:', vouchersResponse)

    // 合併兩種券，並添加類型標識
    const mergedItems = []

    // 處理優惠券 (Coupon)
    if (couponsResponse && couponsResponse.coupons) {
      couponsResponse.coupons.forEach((coupon) => {
        mergedItems.push({
          ...coupon,
          _type: 'coupon', // 添加類型標識
        })
      })
      // console.log(`✅ 載入了 ${couponsResponse.coupons.length} 個優惠券`)
    }

    // 處理兌換券 (Voucher)
    if (vouchersResponse && vouchersResponse.vouchers) {
      vouchersResponse.vouchers.forEach((voucher) => {
        mergedItems.push({
          ...voucher,
          _type: 'voucher', // 添加類型標識
        })
      })
      // console.log(`✅ 載入了 ${vouchersResponse.vouchers.length} 個兌換券`)
    }

    allItems.value = mergedItems
    // console.log(`🎉 總共載入了 ${mergedItems.length} 個券`)
    // console.log('合併後的券資料:', allItems.value)
  } catch (error) {
    console.error('❌ 載入券資料失敗:', error)

    if (error.response) {
      if (error.response.status === 401) {
        errorMessage.value = '請先登入以查看券資料'
      } else if (error.response.data && error.response.data.message) {
        errorMessage.value = error.response.data.message
      } else {
        errorMessage.value = `載入失敗：${error.response.status}`
      }
    } else if (error.message) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '無法載入券資料，請稍後再試'
    }
  } finally {
    isLoading.value = false
  }
}

// 組件掛載後載入資料
onMounted(async () => {
  // 確保認證狀態是最新的
  if (!authStore.isLoggedIn) {
    await authStore.checkAuthStatus()
  }

  // 等待下一個tick，確保組件完全掛載
  await nextTick()

  // 載入券資料
  await loadCouponsData()
})
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* 導航欄樣式 */
.nav-container {
  position: fixed;
  top: 0;
  width: 100%;
  max-width: 736px;
  z-index: 1030;
  left: 50%;
  transform: translateX(-50%);
}

.nav-wrapper {
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar {
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 0;
  padding: 0.8rem 1rem;
}

.navbar-brand {
  color: #333;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.navbar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 700;
  font-size: 1.1rem;
  color: #333;
}

.nav-placeholder {
  width: 30px;
}

.nav-border {
  height: 3px;
  background: linear-gradient(to right, #d35400, #e67e22);
  width: 100%;
}

/* 內容容器 */
.content-wrapper {
  width: 100%;
  max-width: 736px;
  margin: 0 auto;
  padding: 80px 15px 30px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.coupons-content {
  margin-bottom: 2rem;
}

/* 券類型導航 */
.type-navigation {
  display: flex;
  background-color: white;
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.type-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background-color: transparent;
  border-radius: 8px;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.2s;
}

.type-btn.active {
  background-color: #17a2b8;
  color: white;
}

.type-btn:hover:not(.active) {
  background-color: #f8f9fa;
}

/* 券總覽 */
.coupons-overview {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #d35400;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
}

/* 標籤頁導航 */
.tab-navigation {
  display: flex;
  background-color: white;
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tab-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background-color: transparent;
  border-radius: 8px;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.2s;
}

.tab-btn.active {
  background-color: #d35400;
  color: white;
}

.tab-btn:hover:not(.active) {
  background-color: #f8f9fa;
}

/* 券卡片 */
.coupons-list {
  margin-bottom: 2rem;
}

.coupon-card {
  display: flex;
  background-color: white;
  border-radius: 12px;
  margin-bottom: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid;
}

.coupon-card.available {
  border-left-color: #28a745;
}

.coupon-card.used {
  border-left-color: #6c757d;
  opacity: 0.8;
}

.coupon-card.expired {
  border-left-color: #dc3545;
  opacity: 0.6;
}

.coupon-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: #f8f9fa;
  min-width: 120px;
  position: relative;
}

.coupon-type-icon i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.coupon-value {
  text-align: center;
}

.discount-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #d35400;
}

.exchange-label {
  font-size: 1rem;
  font-weight: 600;
  color: #007bff;
}

.coupon-type-tag {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.coupon-type-tag .badge {
  font-size: 0.7rem;
}

.coupon-content {
  flex: 1;
  padding: 1.5rem;
}

.coupon-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.coupon-desc {
  color: #6c757d;
  margin-bottom: 0.75rem;
}

.coupon-validity,
.coupon-acquired,
.coupon-used-info,
.coupon-expired-info,
.coupon-order {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 0.25rem;
}

.coupon-validity:last-child,
.coupon-acquired:last-child,
.coupon-used-info:last-child,
.coupon-expired-info:last-child,
.coupon-order:last-child {
  margin-bottom: 0;
}

.coupon-actions {
  display: flex;
  align-items: center;
  padding: 1.5rem;
}

.coupon-status {
  display: flex;
  align-items: center;
  padding: 1.5rem;
}

/* 空狀態 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 券詳情模態框 */
.coupon-detail {
  padding: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.detail-icon {
  margin-right: 1rem;
}

.detail-icon i {
  font-size: 2.5rem;
}

.detail-info h4 {
  margin-bottom: 0.5rem;
}

.detail-content {
  margin: 0;
}

.detail-item {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f1f1;
}

.detail-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

/* 按鈕樣式 */
.btn-primary {
  background-color: #d35400;
  border-color: #d35400;
}

.btn-primary:hover,
.btn-primary:focus {
  background-color: #e67e22;
  border-color: #e67e22;
}

/* 響應式設計 */
@media (max-width: 576px) {
  .content-wrapper {
    padding-top: 70px;
  }

  .overview-stats {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .type-navigation,
  .tab-navigation {
    flex-direction: column;
    gap: 0.5rem;
  }

  .coupon-card {
    flex-direction: column;
  }

  .coupon-left {
    flex-direction: row;
    min-width: auto;
    padding: 1rem;
  }

  .coupon-type-icon {
    margin-right: 1rem;
  }

  .coupon-type-icon i {
    margin-bottom: 0;
  }

  .coupon-type-tag {
    position: static;
    margin-left: auto;
  }

  .coupon-actions,
  .coupon-status {
    padding: 1rem;
    padding-top: 0;
  }

  .detail-header {
    flex-direction: column;
    text-align: center;
  }

  .detail-icon {
    margin-right: 0;
    margin-bottom: 1rem;
  }
}
</style>
