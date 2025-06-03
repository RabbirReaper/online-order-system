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
            <div class="navbar-title">我的訂單</div>
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
        <p class="mt-3">載入您的訂單資料中，請稍候...</p>
      </div>

      <div v-else-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <div v-else class="orders-content">
        <!-- 訂單統計 -->
        <div class="orders-overview">
          <div class="overview-stats">
            <div class="stat-item">
              <div class="stat-number">{{ totalOrders }}</div>
              <div class="stat-label">總訂單數</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${{ totalAmount.toLocaleString() }}</div>
              <div class="stat-label">總消費金額</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ pendingOrders.length }}</div>
              <div class="stat-label">待處理訂單</div>
            </div>
          </div>
        </div>

        <!-- 狀態篩選 -->
        <div class="status-filter">
          <button class="filter-btn" :class="{ active: selectedStatus === 'all' }" @click="selectedStatus = 'all'">
            全部 ({{ orders.length }})
          </button>
          <button class="filter-btn" :class="{ active: selectedStatus === 'pending' }"
            @click="selectedStatus = 'pending'">
            待處理 ({{ pendingOrders.length }})
          </button>
          <button class="filter-btn" :class="{ active: selectedStatus === 'confirmed' }"
            @click="selectedStatus = 'confirmed'">
            已確認 ({{ confirmedOrders.length }})
          </button>
          <button class="filter-btn" :class="{ active: selectedStatus === 'completed' }"
            @click="selectedStatus = 'completed'">
            已完成 ({{ completedOrders.length }})
          </button>
          <button class="filter-btn" :class="{ active: selectedStatus === 'cancelled' }"
            @click="selectedStatus = 'cancelled'">
            已取消 ({{ cancelledOrders.length }})
          </button>
        </div>

        <!-- 訂單列表 -->
        <div class="orders-list">
          <div v-if="filteredOrders.length > 0">
            <div v-for="order in filteredOrders" :key="order.id" class="order-card" @click="showOrderDetail(order)">
              <div class="order-header">
                <div class="order-info">
                  <h6 class="order-number">訂單編號：{{ order.orderNumber }}</h6>
                  <p class="order-date">{{ formatDateTime(order.createdAt) }}</p>
                </div>
                <div class="order-status">
                  <span :class="getStatusClass(order.status)">{{ formatStatus(order.status) }}</span>
                </div>
              </div>

              <div class="order-content">
                <div class="order-store">
                  <i class="bi bi-shop me-1"></i>
                  {{ order.storeName }}
                </div>

                <div class="order-items">
                  <div v-for="item in order.items.slice(0, 2)" :key="item.id" class="order-item">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-quantity">x{{ item.quantity }}</span>
                  </div>
                  <div v-if="order.items.length > 2" class="more-items">
                    還有 {{ order.items.length - 2 }} 項商品...
                  </div>
                </div>

                <div class="order-summary">
                  <div class="payment-info">
                    <span class="payment-method">
                      <i class="bi bi-credit-card me-1"></i>
                      {{ formatPaymentMethod(order.paymentMethod) }}
                    </span>
                    <span v-if="order.pointsUsed > 0" class="points-used">
                      <i class="bi bi-star-fill me-1"></i>
                      使用 {{ order.pointsUsed }} 點數
                    </span>
                  </div>
                  <div class="order-total">
                    總計：${{ order.totalAmount }}
                  </div>
                </div>
              </div>

              <div class="order-actions">
                <button class="btn btn-outline-primary btn-sm" @click.stop="showOrderDetail(order)">
                  查看詳情
                </button>
                <button v-if="canReorder(order)" class="btn btn-primary btn-sm ms-2" @click.stop="reorder(order)">
                  再次訂購
                </button>
                <button v-if="canCancel(order)" class="btn btn-outline-danger btn-sm ms-2"
                  @click.stop="cancelOrder(order)">
                  取消訂單
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <i class="bi bi-bag text-muted" style="font-size: 4rem;"></i>
            <h5 class="mt-3 text-muted">
              {{ selectedStatus === 'all' ? '沒有訂單記錄' : `沒有${getStatusLabel(selectedStatus)}的訂單` }}
            </h5>
            <p class="text-muted">
              {{ selectedStatus === 'all' ? '快去點餐吧！' : '切換到其他狀態查看訂單' }}
            </p>
          </div>
        </div>

        <!-- 載入更多按鈕 -->
        <div v-if="hasMoreOrders" class="load-more-section">
          <button class="btn btn-outline-secondary" @click="loadMoreOrders" :disabled="isLoadingMore">
            <span v-if="isLoadingMore" class="spinner-border spinner-border-sm me-2" role="status"
              aria-hidden="true"></span>
            載入更多訂單
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 訂單詳情模態框 -->
  <BModal id="orderDetailModal" title="訂單詳情" size="lg" ref="orderDetailModal">
    <div v-if="selectedOrder" class="order-detail">
      <div class="detail-header">
        <div class="detail-status">
          <span :class="getStatusClass(selectedOrder.status)">{{ formatStatus(selectedOrder.status) }}</span>
        </div>
        <div class="detail-info">
          <h5>訂單編號：{{ selectedOrder.orderNumber }}</h5>
          <p class="text-muted">下單時間：{{ formatDateTime(selectedOrder.createdAt) }}</p>
          <p class="text-muted">
            <i class="bi bi-shop me-1"></i>
            {{ selectedOrder.storeName }}
          </p>
        </div>
      </div>

      <div class="detail-content">
        <div class="detail-section">
          <h6>訂單項目</h6>
          <div class="items-list">
            <div v-for="item in selectedOrder.items" :key="item.id" class="item-detail">
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div v-if="item.options && item.options.length > 0" class="item-options">
                  <span v-for="option in item.options" :key="option.id" class="option-tag">
                    {{ option.name }}
                  </span>
                </div>
                <div class="item-note" v-if="item.note">
                  備註：{{ item.note }}
                </div>
              </div>
              <div class="item-pricing">
                <div class="item-quantity">x{{ item.quantity }}</div>
                <div class="item-price">${{ item.price * item.quantity }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h6>配送資訊</h6>
          <div class="delivery-info">
            <div class="info-item">
              <strong>取餐方式：</strong>
              {{ formatDeliveryType(selectedOrder.deliveryType) }}
            </div>
            <div v-if="selectedOrder.customerInfo" class="info-item">
              <strong>聯絡人：</strong>
              {{ selectedOrder.customerInfo.name }}
            </div>
            <div v-if="selectedOrder.customerInfo" class="info-item">
              <strong>聯絡電話：</strong>
              {{ selectedOrder.customerInfo.phone }}
            </div>
            <div v-if="selectedOrder.address" class="info-item">
              <strong>配送地址：</strong>
              {{ selectedOrder.address }}
            </div>
            <div v-if="selectedOrder.note" class="info-item">
              <strong>訂單備註：</strong>
              {{ selectedOrder.note }}
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h6>付款資訊</h6>
          <div class="payment-detail">
            <div class="payment-row">
              <span>小計</span>
              <span>${{ selectedOrder.subtotal }}</span>
            </div>
            <div v-if="selectedOrder.deliveryFee > 0" class="payment-row">
              <span>外送費</span>
              <span>${{ selectedOrder.deliveryFee }}</span>
            </div>
            <div v-if="selectedOrder.pointsUsed > 0" class="payment-row text-success">
              <span>點數折抵</span>
              <span>-${{ selectedOrder.pointsUsed }}</span>
            </div>
            <div v-if="selectedOrder.discount > 0" class="payment-row text-success">
              <span>優惠折扣</span>
              <span>-${{ selectedOrder.discount }}</span>
            </div>
            <div class="payment-row total">
              <span>總計</span>
              <span>${{ selectedOrder.totalAmount }}</span>
            </div>
            <div class="payment-method">
              <strong>付款方式：</strong>
              {{ formatPaymentMethod(selectedOrder.paymentMethod) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer-actions">
        <BButton variant="secondary" @click="$refs.orderDetailModal.hide()">
          關閉
        </BButton>
        <BButton v-if="selectedOrder && canReorder(selectedOrder)" variant="primary" @click="reorder(selectedOrder)">
          再次訂購
        </BButton>
        <BButton v-if="selectedOrder && canCancel(selectedOrder)" variant="outline-danger"
          @click="cancelOrder(selectedOrder)">
          取消訂單
        </BButton>
      </div>
    </template>
  </BModal>

  <!-- 取消訂單確認模態框 -->
  <BModal id="cancelOrderModal" title="確認取消訂單" ok-title="確認取消" ok-variant="danger" cancel-title="保留訂單"
    @ok="confirmCancelOrder" ref="cancelOrderModal">
    <div v-if="orderToCancel">
      <p>確定要取消訂單「{{ orderToCancel.orderNumber }}」嗎？</p>
      <div class="alert alert-warning">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>注意：</strong>取消後將無法恢復，如有使用點數或優惠券將會退還。
      </div>
    </div>
  </BModal>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { BModal, BButton } from 'bootstrap-vue-next';

// 路由
const router = useRouter();

// 模態框參考
const orderDetailModal = ref(null);
const cancelOrderModal = ref(null);

// 狀態管理
const isLoading = ref(true);
const isLoadingMore = ref(false);
const errorMessage = ref('');
const selectedStatus = ref('all');
const selectedOrder = ref(null);
const orderToCancel = ref(null);
const hasMoreOrders = ref(false);

// 假資料 (後續會被 API 替換)
const orders = ref([
  {
    id: 1,
    orderNumber: 'ORD-20241201-001',
    status: 'completed',
    storeName: '台北信義店',
    createdAt: '2024-12-01T12:30:00Z',
    totalAmount: 450,
    subtotal: 400,
    deliveryFee: 50,
    pointsUsed: 0,
    discount: 0,
    paymentMethod: 'credit_card',
    deliveryType: 'delivery',
    address: '台北市信義區信義路五段7號',
    note: '不要辣',
    customerInfo: {
      name: '王小明',
      phone: '0912345678'
    },
    items: [
      {
        id: 1,
        name: '雞排便當',
        quantity: 1,
        price: 120,
        options: [{ id: 1, name: '白飯' }, { id: 2, name: '不要青菜' }],
        note: '微辣'
      },
      {
        id: 2,
        name: '珍珠奶茶',
        quantity: 2,
        price: 65,
        options: [{ id: 3, name: '正常甜' }, { id: 4, name: '正常冰' }],
        note: ''
      }
    ]
  },
  {
    id: 2,
    orderNumber: 'ORD-20241130-002',
    status: 'pending',
    storeName: '台北信義店',
    createdAt: '2024-11-30T18:15:00Z',
    totalAmount: 280,
    subtotal: 330,
    deliveryFee: 0,
    pointsUsed: 50,
    discount: 0,
    paymentMethod: 'cash',
    deliveryType: 'pickup',
    address: '',
    note: '',
    customerInfo: {
      name: '王小明',
      phone: '0912345678'
    },
    items: [
      {
        id: 3,
        name: '牛肉麵',
        quantity: 1,
        price: 150,
        options: [{ id: 5, name: '清湯' }],
        note: '麵條軟一點'
      },
      {
        id: 4,
        name: '小菜拼盤',
        quantity: 1,
        price: 180,
        options: [],
        note: ''
      }
    ]
  },
  {
    id: 3,
    orderNumber: 'ORD-20241129-003',
    status: 'cancelled',
    storeName: '台北信義店',
    createdAt: '2024-11-29T14:20:00Z',
    totalAmount: 0,
    subtotal: 200,
    deliveryFee: 30,
    pointsUsed: 0,
    discount: 0,
    paymentMethod: 'credit_card',
    deliveryType: 'delivery',
    address: '台北市信義區信義路五段7號',
    note: '',
    customerInfo: {
      name: '王小明',
      phone: '0912345678'
    },
    items: [
      {
        id: 5,
        name: '炸雞腿便當',
        quantity: 1,
        price: 140,
        options: [{ id: 6, name: '白飯' }],
        note: ''
      },
      {
        id: 6,
        name: '冬瓜茶',
        quantity: 1,
        price: 30,
        options: [{ id: 7, name: '少糖' }],
        note: ''
      }
    ]
  }
]);

// 品牌ID計算屬性
const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId');
});

// 計算屬性
const totalOrders = computed(() => orders.value.length);

const totalAmount = computed(() => {
  return orders.value
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.totalAmount, 0);
});

const pendingOrders = computed(() => {
  return orders.value.filter(order => order.status === 'pending');
});

const confirmedOrders = computed(() => {
  return orders.value.filter(order => order.status === 'confirmed');
});

const completedOrders = computed(() => {
  return orders.value.filter(order => order.status === 'completed');
});

const cancelledOrders = computed(() => {
  return orders.value.filter(order => order.status === 'cancelled');
});

const filteredOrders = computed(() => {
  if (selectedStatus.value === 'all') {
    return orders.value;
  }
  return orders.value.filter(order => order.status === selectedStatus.value);
});

// 返回上一頁
const goBack = () => {
  router.push('/member');
};

// 格式化狀態
const formatStatus = (status) => {
  const statusMap = {
    'pending': '待處理',
    'confirmed': '已確認',
    'preparing': '準備中',
    'ready': '待取餐',
    'delivering': '配送中',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
};

// 獲取狀態樣式
const getStatusClass = (status) => {
  const statusClasses = {
    'pending': 'badge bg-warning',
    'confirmed': 'badge bg-info',
    'preparing': 'badge bg-primary',
    'ready': 'badge bg-success',
    'delivering': 'badge bg-primary',
    'completed': 'badge bg-success',
    'cancelled': 'badge bg-danger'
  };
  return statusClasses[status] || 'badge bg-secondary';
};

// 獲取狀態標籤
const getStatusLabel = (status) => {
  const statusLabels = {
    'pending': '待處理',
    'confirmed': '已確認',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusLabels[status] || status;
};

// 格式化支付方式
const formatPaymentMethod = (method) => {
  const methodMap = {
    'credit_card': '信用卡',
    'cash': '現金',
    'line_pay': 'LINE Pay',
    'apple_pay': 'Apple Pay'
  };
  return methodMap[method] || method;
};

// 格式化配送方式
const formatDeliveryType = (type) => {
  const typeMap = {
    'pickup': '店內自取',
    'delivery': '外送'
  };
  return typeMap[type] || type;
};

// 格式化日期時間
const formatDateTime = (dateString) => {
  if (!dateString) return '未設定';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '無效日期';

  return date.toLocaleString('zh-TW');
};

// 判斷是否可以重新訂購
const canReorder = (order) => {
  return ['completed', 'cancelled'].includes(order.status);
};

// 判斷是否可以取消
const canCancel = (order) => {
  return ['pending', 'confirmed'].includes(order.status);
};

// 顯示訂單詳情
const showOrderDetail = (order) => {
  selectedOrder.value = order;
  if (orderDetailModal.value) {
    orderDetailModal.value.show();
  }
};

// 重新訂購
const reorder = (order) => {
  // TODO: 實作重新訂購邏輯
  console.log('重新訂購:', order);
  // 可以跳轉到購物車頁面，預填訂單項目
  // router.push('/cart');
};

// 取消訂單
const cancelOrder = (order) => {
  orderToCancel.value = order;
  if (cancelOrderModal.value) {
    cancelOrderModal.value.show();
  }
};

// 確認取消訂單
const confirmCancelOrder = async () => {
  if (!orderToCancel.value) return;

  try {
    // TODO: 調用取消訂單 API
    // await api.orderCustomer.cancelOrder({
    //   brandId: brandId.value,
    //   orderId: orderToCancel.value.id
    // });

    // 更新本地狀態
    const orderIndex = orders.value.findIndex(o => o.id === orderToCancel.value.id);
    if (orderIndex !== -1) {
      orders.value[orderIndex].status = 'cancelled';
    }

    console.log('訂單已取消:', orderToCancel.value.orderNumber);

  } catch (error) {
    console.error('取消訂單失敗:', error);
    errorMessage.value = '取消訂單失敗，請稍後再試';
  } finally {
    orderToCancel.value = null;
  }
};

// 載入更多訂單
const loadMoreOrders = async () => {
  try {
    isLoadingMore.value = true;

    // TODO: 實作載入更多 API
    // const response = await api.orderCustomer.getUserOrders({
    //   brandId: brandId.value,
    //   page: currentPage + 1
    // });
    // orders.value = [...orders.value, ...response.orders];
    // hasMoreOrders.value = response.hasMore;

    // 模擬載入延遲
    await new Promise(resolve => setTimeout(resolve, 1000));
    hasMoreOrders.value = false; // 暫時設為 false

  } catch (error) {
    console.error('載入更多訂單失敗:', error);
  } finally {
    isLoadingMore.value = false;
  }
};

// 載入訂單資料
const loadOrdersData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const currentBrandId = brandId.value;

    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊');
    }

    // TODO: 實作 API 調用
    // const response = await api.orderCustomer.getUserOrders(currentBrandId);
    // orders.value = response.orders;
    // hasMoreOrders.value = response.hasMore;

    // 模擬載入延遲
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error('載入訂單資料失敗:', error);

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '無法載入訂單資料';
    } else {
      errorMessage.value = '無法載入訂單資料，請稍後再試';
    }
  } finally {
    isLoading.value = false;
  }
};

// 組件掛載後載入資料
onMounted(() => {
  loadOrdersData();
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

.orders-content {
  margin-bottom: 2rem;
}

/* 訂單統計 */
.orders-overview {
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
  font-size: 1.5rem;
  font-weight: 700;
  color: #d35400;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
}

/* 狀態篩選 */
.status-filter {
  display: flex;
  background-color: white;
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  gap: 0.25rem;
}

.filter-btn {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1rem;
  border: none;
  background-color: transparent;
  border-radius: 8px;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-btn.active {
  background-color: #d35400;
  color: white;
}

.filter-btn:hover:not(.active) {
  background-color: #f8f9fa;
}

/* 訂單卡片 */
.orders-list {
  margin-bottom: 2rem;
}

.order-card {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.order-number {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #333;
}

.order-date {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
}

.order-content {
  margin-bottom: 1rem;
}

.order-store {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.75rem;
}

.order-items {
  margin-bottom: 1rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.item-name {
  color: #333;
}

.item-quantity {
  color: #6c757d;
  font-size: 0.9rem;
}

.more-items {
  color: #6c757d;
  font-size: 0.85rem;
  font-style: italic;
}

.order-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f1f1;
}

.payment-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.payment-method,
.points-used {
  font-size: 0.85rem;
  color: #6c757d;
}

.order-total {
  font-weight: 600;
  font-size: 1.1rem;
  color: #d35400;
}

.order-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* 空狀態 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 載入更多 */
.load-more-section {
  text-align: center;
  padding: 1rem;
}

/* 訂單詳情模態框 */
.order-detail {
  padding: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.detail-status {
  margin-right: 1rem;
}

.detail-info {
  flex: 1;
}

.detail-info h5 {
  margin-bottom: 0.5rem;
}

.detail-content {
  margin: 0;
}

.detail-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f1f1;
}

.detail-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.detail-section h6 {
  color: #333;
  margin-bottom: 1rem;
  font-weight: 600;
}

.items-list {
  margin: 0;
}

.item-detail {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.item-detail:last-child {
  border-bottom: none;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.item-options {
  margin-bottom: 0.25rem;
}

.option-tag {
  display: inline-block;
  background-color: #f8f9fa;
  color: #6c757d;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
}

.item-note {
  font-size: 0.85rem;
  color: #6c757d;
}

.item-pricing {
  text-align: right;
  margin-left: 1rem;
}

.item-quantity {
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.item-price {
  font-weight: 500;
  color: #333;
}

.delivery-info,
.payment-detail {
  margin: 0;
}

.info-item {
  margin-bottom: 0.75rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.payment-row.total {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
  padding-top: 0.5rem;
  border-top: 1px solid #dee2e6;
  margin-top: 0.5rem;
}

.payment-method {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f1f1;
}

.modal-footer-actions {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  justify-content: flex-end;
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

  .status-filter {
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-btn {
    min-width: auto;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-status {
    margin-top: 0.5rem;
  }

  .order-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .order-actions {
    width: 100%;
  }

  .order-actions .btn {
    flex: 1;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-status {
    margin-right: 0;
    margin-bottom: 1rem;
  }

  .item-detail {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-pricing {
    margin-left: 0;
    margin-top: 0.5rem;
    text-align: left;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .modal-footer-actions {
    flex-direction: column;
  }

  .modal-footer-actions .btn {
    width: 100%;
  }
}
</style>
