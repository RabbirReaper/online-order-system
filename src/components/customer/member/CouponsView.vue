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
        <p class="mt-3">載入您的優惠券資料中，請稍候...</p>
      </div>

      <div v-else-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <div v-else class="coupons-content">
        <!-- 優惠券總覽 -->
        <div class="coupons-overview">
          <div class="overview-stats">
            <div class="stat-item">
              <div class="stat-number">{{ availableCoupons.length }}</div>
              <div class="stat-label">可用優惠券</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ usedCoupons.length }}</div>
              <div class="stat-label">已使用</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ expiredCoupons.length }}</div>
              <div class="stat-label">已過期</div>
            </div>
          </div>
        </div>

        <!-- 標籤頁切換 -->
        <div class="tab-navigation">
          <button class="tab-btn" :class="{ active: activeTab === 'available' }" @click="activeTab = 'available'">
            可使用 ({{ availableCoupons.length }})
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'used' }" @click="activeTab = 'used'">
            已使用 ({{ usedCoupons.length }})
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'expired' }" @click="activeTab = 'expired'">
            已過期 ({{ expiredCoupons.length }})
          </button>
        </div>

        <!-- 優惠券列表 -->
        <div class="coupons-list">
          <!-- 可使用的優惠券 -->
          <div v-if="activeTab === 'available'">
            <div v-if="availableCoupons.length > 0">
              <div v-for="coupon in availableCoupons" :key="coupon.id" class="coupon-card available">
                <div class="coupon-left">
                  <div class="coupon-type-icon">
                    <i :class="getCouponIcon(coupon.type)"></i>
                  </div>
                  <div class="coupon-value">
                    <span v-if="coupon.type === 'discount'" class="discount-amount">
                      ${{ coupon.discount }}
                    </span>
                    <span v-else class="exchange-label">兌換券</span>
                  </div>
                </div>
                <div class="coupon-content">
                  <h6 class="coupon-title">{{ coupon.name }}</h6>
                  <p class="coupon-desc">{{ getCouponDescription(coupon) }}</p>
                  <div class="coupon-validity">
                    <i class="bi bi-calendar3 me-1"></i>
                    有效期至：{{ formatDate(coupon.expiryDate) }}
                  </div>
                  <div class="coupon-points">
                    <i class="bi bi-star-fill me-1"></i>
                    使用了 {{ coupon.pointsUsed }} 點數兌換
                  </div>
                </div>
                <div class="coupon-actions">
                  <button class="btn btn-primary btn-sm" @click="showCouponDetail(coupon)">
                    查看詳情
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-ticket-perforated text-muted" style="font-size: 4rem;"></i>
              <h5 class="mt-3 text-muted">沒有可用的優惠券</h5>
              <p class="text-muted">快去賺取點數兌換優惠券吧！</p>
            </div>
          </div>

          <!-- 已使用的優惠券 -->
          <div v-if="activeTab === 'used'">
            <div v-if="usedCoupons.length > 0">
              <div v-for="coupon in usedCoupons" :key="coupon.id" class="coupon-card used">
                <div class="coupon-left">
                  <div class="coupon-type-icon">
                    <i :class="getCouponIcon(coupon.type)"></i>
                  </div>
                  <div class="coupon-value">
                    <span v-if="coupon.type === 'discount'" class="discount-amount">
                      ${{ coupon.discount }}
                    </span>
                    <span v-else class="exchange-label">兌換券</span>
                  </div>
                </div>
                <div class="coupon-content">
                  <h6 class="coupon-title">{{ coupon.name }}</h6>
                  <p class="coupon-desc">{{ getCouponDescription(coupon) }}</p>
                  <div class="coupon-used-info">
                    <i class="bi bi-check-circle-fill me-1 text-success"></i>
                    於 {{ formatDate(coupon.usedAt) }} 使用
                  </div>
                  <div class="coupon-order" v-if="coupon.orderInfo">
                    <i class="bi bi-bag me-1"></i>
                    訂單編號：{{ coupon.orderInfo.orderNumber }}
                  </div>
                </div>
                <div class="coupon-status">
                  <span class="badge bg-success">已使用</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-check2-circle text-muted" style="font-size: 4rem;"></i>
              <h5 class="mt-3 text-muted">沒有使用記錄</h5>
              <p class="text-muted">您還沒有使用過任何優惠券</p>
            </div>
          </div>

          <!-- 已過期的優惠券 -->
          <div v-if="activeTab === 'expired'">
            <div v-if="expiredCoupons.length > 0">
              <div v-for="coupon in expiredCoupons" :key="coupon.id" class="coupon-card expired">
                <div class="coupon-left">
                  <div class="coupon-type-icon">
                    <i :class="getCouponIcon(coupon.type)"></i>
                  </div>
                  <div class="coupon-value">
                    <span v-if="coupon.type === 'discount'" class="discount-amount">
                      ${{ coupon.discount }}
                    </span>
                    <span v-else class="exchange-label">兌換券</span>
                  </div>
                </div>
                <div class="coupon-content">
                  <h6 class="coupon-title">{{ coupon.name }}</h6>
                  <p class="coupon-desc">{{ getCouponDescription(coupon) }}</p>
                  <div class="coupon-expired-info">
                    <i class="bi bi-x-circle-fill me-1 text-danger"></i>
                    於 {{ formatDate(coupon.expiryDate) }} 過期
                  </div>
                </div>
                <div class="coupon-status">
                  <span class="badge bg-danger">已過期</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-clock-history text-muted" style="font-size: 4rem;"></i>
              <h5 class="mt-3 text-muted">沒有過期的優惠券</h5>
              <p class="text-muted">很好！您沒有浪費任何優惠券</p>
            </div>
          </div>
        </div>

        <!-- 優惠券兌換區域 -->
        <div class="exchange-section">
          <div class="exchange-card">
            <div class="exchange-header">
              <h5 class="mb-0">
                <i class="bi bi-gift me-2"></i>兌換新優惠券
              </h5>
            </div>
            <div class="exchange-body">
              <p class="text-muted">使用您的點數兌換更多優惠券，享受更多優惠！</p>
              <button class="btn btn-outline-primary" @click="goToExchange">
                <i class="bi bi-arrow-right-circle me-1"></i>前往兌換
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 優惠券詳情模態框 -->
  <BModal id="couponDetailModal" title="優惠券詳情" size="lg" ref="couponDetailModal">
    <div v-if="selectedCoupon" class="coupon-detail">
      <div class="detail-header">
        <div class="detail-icon">
          <i :class="getCouponIcon(selectedCoupon.type)"></i>
        </div>
        <div class="detail-info">
          <h4>{{ selectedCoupon.name }}</h4>
          <p class="text-muted">{{ getCouponDescription(selectedCoupon) }}</p>
        </div>
      </div>

      <div class="detail-content">
        <div class="detail-item">
          <strong>優惠內容：</strong>
          <span v-if="selectedCoupon.type === 'discount'">
            折抵 ${{ selectedCoupon.discount }} 元
          </span>
          <span v-else>
            可兌換指定餐點
          </span>
        </div>

        <div class="detail-item" v-if="selectedCoupon.exchangeItems && selectedCoupon.exchangeItems.length > 0">
          <strong>可兌換餐點：</strong>
          <ul class="exchange-items-list">
            <li v-for="item in selectedCoupon.exchangeItems" :key="item.id">
              {{ item.name }} x{{ item.quantity }}
            </li>
          </ul>
        </div>

        <div class="detail-item">
          <strong>獲得時間：</strong>
          {{ formatDateTime(selectedCoupon.acquiredAt) }}
        </div>

        <div class="detail-item">
          <strong>有效期限：</strong>
          {{ formatDateTime(selectedCoupon.expiryDate) }}
        </div>

        <div class="detail-item">
          <strong>使用點數：</strong>
          {{ selectedCoupon.pointsUsed }} 點
        </div>

        <div class="detail-item" v-if="selectedCoupon.usedAt">
          <strong>使用時間：</strong>
          {{ formatDateTime(selectedCoupon.usedAt) }}
        </div>

        <div class="detail-item" v-if="selectedCoupon.orderInfo">
          <strong>使用訂單：</strong>
          {{ selectedCoupon.orderInfo.orderNumber }}
        </div>
      </div>
    </div>

    <template #footer>
      <BButton variant="secondary" @click="$refs.couponDetailModal.hide()">
        關閉
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { BModal, BButton } from 'bootstrap-vue-next';

// 路由
const router = useRouter();

// 模態框參考
const couponDetailModal = ref(null);

// 狀態管理
const isLoading = ref(true);
const errorMessage = ref('');
const activeTab = ref('available');
const selectedCoupon = ref(null);

// 假資料 (後續會被 API 替換)
const coupons = ref([
  {
    id: 1,
    name: '消費折抵券',
    type: 'discount',
    discount: 100,
    pointsUsed: 500,
    isUsed: false,
    expiryDate: '2025-01-15T23:59:59Z',
    acquiredAt: '2024-11-15T10:30:00Z',
    usedAt: null,
    orderInfo: null,
    exchangeItems: []
  },
  {
    id: 2,
    name: '免費飲料兌換券',
    type: 'exchange',
    discount: 0,
    pointsUsed: 300,
    isUsed: false,
    expiryDate: '2025-02-28T23:59:59Z',
    acquiredAt: '2024-11-20T14:15:00Z',
    usedAt: null,
    orderInfo: null,
    exchangeItems: [
      { id: 1, name: '珍珠奶茶', quantity: 1 },
      { id: 2, name: '紅茶', quantity: 1 }
    ]
  },
  {
    id: 3,
    name: '消費折抵券',
    type: 'discount',
    discount: 50,
    pointsUsed: 250,
    isUsed: true,
    expiryDate: '2024-12-31T23:59:59Z',
    acquiredAt: '2024-10-10T09:20:00Z',
    usedAt: '2024-11-25T12:30:00Z',
    orderInfo: {
      orderNumber: 'ORD-20241125-001'
    },
    exchangeItems: []
  },
  {
    id: 4,
    name: '消費折抵券',
    type: 'discount',
    discount: 200,
    pointsUsed: 800,
    isUsed: false,
    expiryDate: '2024-11-30T23:59:59Z', // 已過期
    acquiredAt: '2024-08-15T16:45:00Z',
    usedAt: null,
    orderInfo: null,
    exchangeItems: []
  }
]);

// 品牌ID計算屬性
const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId');
});

// 分類優惠券
const availableCoupons = computed(() => {
  const now = new Date();
  return coupons.value.filter(coupon =>
    !coupon.isUsed && new Date(coupon.expiryDate) > now
  );
});

const usedCoupons = computed(() => {
  return coupons.value.filter(coupon => coupon.isUsed);
});

const expiredCoupons = computed(() => {
  const now = new Date();
  return coupons.value.filter(coupon =>
    !coupon.isUsed && new Date(coupon.expiryDate) <= now
  );
});

// 返回上一頁
const goBack = () => {
  router.push('/member');
};

// 獲取優惠券圖標
const getCouponIcon = (type) => {
  const iconMap = {
    'discount': 'bi bi-percent text-success',
    'exchange': 'bi bi-gift text-primary'
  };
  return iconMap[type] || 'bi bi-ticket-perforated text-secondary';
};

// 獲取優惠券描述
const getCouponDescription = (coupon) => {
  if (coupon.type === 'discount') {
    return `可折抵 $${coupon.discount} 元`;
  } else {
    const itemNames = coupon.exchangeItems.map(item => item.name).join('、');
    return `可兌換：${itemNames}`;
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未設定';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '無效日期';

  return date.toLocaleDateString('zh-TW');
};

// 格式化日期時間
const formatDateTime = (dateString) => {
  if (!dateString) return '未設定';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '無效日期';

  return date.toLocaleString('zh-TW');
};

// 顯示優惠券詳情
const showCouponDetail = (coupon) => {
  selectedCoupon.value = coupon;
  if (couponDetailModal.value) {
    couponDetailModal.value.show();
  }
};

// 前往兌換頁面
const goToExchange = () => {
  // TODO: 後續實作兌換頁面路由
  router.push('/member/points');
};

// 載入優惠券資料
const loadCouponsData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const currentBrandId = brandId.value;

    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊');
    }

    // TODO: 後續實作 API 調用
    // const response = await api.promotion.getUserCoupons(currentBrandId);
    // coupons.value = response.coupons;

    // 模擬載入延遲
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error('載入優惠券資料失敗:', error);

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '無法載入優惠券資料';
    } else {
      errorMessage.value = '無法載入優惠券資料，請稍後再試';
    }
  } finally {
    isLoading.value = false;
  }
};

// 組件掛載後載入資料
onMounted(() => {
  loadCouponsData();
});
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

/* 優惠券總覽 */
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

/* 優惠券卡片 */
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
.coupon-points,
.coupon-used-info,
.coupon-expired-info,
.coupon-order {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 0.25rem;
}

.coupon-validity:last-child,
.coupon-points:last-child,
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

/* 兌換區域 */
.exchange-section {
  margin-top: 2rem;
}

.exchange-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.exchange-header {
  background: linear-gradient(135deg, #d35400, #e67e22);
  color: white;
  padding: 1rem 1.25rem;
}

.exchange-body {
  padding: 1.25rem;
  text-align: center;
}

/* 優惠券詳情模態框 */
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
  margin-bottom: 0.25rem;
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

.exchange-items-list {
  margin-top: 0.5rem;
  margin-bottom: 0;
  padding-left: 1.5rem;
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
