<template>
  <div>
    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div class="alert alert-danger" v-if="error">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <div v-if="coupon && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ coupon.name }}</h4>
        <div class="d-flex">
          <router-link :to="`/admin/${brandId}/coupons/edit/${coupon._id}`" class="btn btn-primary me-2">
            <i class="bi bi-pencil me-1"></i>編輯優惠券
          </router-link>
          <router-link :to="`/admin/${brandId}/coupons`" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 優惠券詳情卡片 -->
      <div class="row">
        <!-- 左側基本資訊 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">基本資訊</h5>

              <div class="mb-3">
                <h6 class="text-muted mb-1">優惠券名稱</h6>
                <p>{{ coupon.name }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">優惠券描述</h6>
                <p>{{ coupon.description || '無描述' }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">優惠券類型</h6>
                <p>
                  <span class="badge" :class="coupon.couponType === 'discount' ? 'bg-primary' : 'bg-success'">
                    {{ coupon.couponType === 'discount' ? '折扣券' : '兌換券' }}
                  </span>
                </p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">所需點數</h6>
                <p class="fs-4 text-primary">{{ coupon.pointCost }} 點</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">有效期限</h6>
                <p>{{ coupon.validityPeriod }} 天</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">狀態</h6>
                <p>
                  <span class="badge" :class="coupon.isActive ? 'bg-success' : 'bg-secondary'">
                    {{ coupon.isActive ? '啟用中' : '已停用' }}
                  </span>
                </p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">已發行數量</h6>
                <p class="fs-4">{{ coupon.totalIssued || 0 }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">創建時間</h6>
                <p>{{ formatDate(coupon.createdAt) }}</p>
              </div>

              <div class="mb-0">
                <h6 class="text-muted mb-1">最後更新</h6>
                <p>{{ formatDate(coupon.updatedAt) }}</p>
              </div>
            </div>

            <div class="card-footer bg-transparent">
              <div class="d-flex justify-content-between">
                <!-- 切換狀態按鈕 -->
                <button type="button" class="btn"
                  :class="coupon.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                  @click="showToggleStatusModal" :disabled="isToggling">
                  <span v-if="isToggling" class="spinner-border spinner-border-sm me-1" role="status"
                    aria-hidden="true"></span>
                  <i v-else class="bi bi-power me-1"></i>
                  {{ coupon.isActive ? '停用優惠券' : '啟用優惠券' }}
                </button>

                <!-- 刪除按鈕 -->
                <button type="button" class="btn btn-outline-danger" data-bs-toggle="modal"
                  data-bs-target="#deleteCouponModal">
                  <i class="bi bi-trash me-1"></i>刪除優惠券
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側優惠內容 -->
        <div class="col-md-6">
          <!-- 折扣資訊卡片 -->
          <div class="card mb-4" v-if="coupon.couponType === 'discount' && coupon.discountInfo">
            <div class="card-body">
              <h5 class="card-title mb-3">折扣資訊</h5>

              <div class="mb-3">
                <h6 class="text-muted mb-1">折扣類型</h6>
                <p>{{ coupon.discountInfo.discountType === 'percentage' ? '百分比折扣' : '固定金額折扣' }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">折扣值</h6>
                <p class="fs-4 text-success">
                  <template v-if="coupon.discountInfo.discountType === 'percentage'">
                    {{ coupon.discountInfo.discountValue }}%
                  </template>
                  <template v-else>
                    ${{ formatPrice(coupon.discountInfo.discountValue) }}
                  </template>
                </p>
              </div>

              <div class="mb-3" v-if="coupon.discountInfo.maxDiscountAmount">
                <h6 class="text-muted mb-1">最大折扣金額</h6>
                <p>${{ formatPrice(coupon.discountInfo.maxDiscountAmount) }}</p>
              </div>

              <div class="mb-0">
                <h6 class="text-muted mb-1">最低消費金額</h6>
                <p>${{ formatPrice(coupon.discountInfo.minPurchaseAmount || 0) }}</p>
              </div>
            </div>
          </div>

          <!-- 兌換資訊卡片 -->
          <div class="card mb-4" v-if="coupon.couponType === 'exchange' && coupon.exchangeInfo">
            <div class="card-body">
              <h5 class="card-title mb-3">兌換品項</h5>

              <div v-if="coupon.exchangeInfo.items && coupon.exchangeInfo.items.length > 0">
                <div v-for="(item, index) in coupon.exchangeInfo.items" :key="index"
                  class="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                  <div>
                    <h6 class="mb-1">{{ item.dishTemplate?.name || '未知餐點' }}</h6>
                    <p class="mb-0 text-muted">數量：{{ item.quantity }}</p>
                  </div>
                  <div>
                    <span class="badge bg-info">
                      ${{ formatPrice(item.dishTemplate?.basePrice || 0) }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="text-muted text-center py-3">
                尚未設定兌換品項
              </div>
            </div>
          </div>

          <!-- 適用店鋪卡片 -->
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title mb-3">適用店鋪</h5>
              <p class="text-muted">
                {{ coupon.stores && coupon.stores.length > 0 ? '指定店鋪' : '所有店鋪' }}
              </p>
              <button class="btn btn-sm btn-outline-primary" disabled>
                <i class="bi bi-shop me-1"></i>管理適用店鋪
              </button>
            </div>
          </div>

          <!-- 使用統計卡片 -->
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title mb-3">使用統計</h5>
              <p class="text-muted">此功能尚未開發完成</p>
              <button class="btn btn-sm btn-outline-primary" disabled>
                <i class="bi bi-bar-chart me-1"></i>查看統計
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <div class="modal fade" id="deleteCouponModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal-body" v-if="coupon">
            <p>您確定要刪除優惠券 <strong>{{ coupon.name }}</strong> 嗎？</p>
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              此操作無法撤銷，優惠券相關的所有資料都將被永久刪除。
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-danger" @click="handleDelete" :disabled="isDeleting">
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              {{ isDeleting ? '處理中...' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- 狀態切換確認對話框 -->
    <div class="modal fade" id="statusToggleModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認變更狀態</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="coupon">
            <p>
              確定要將「<strong>{{ coupon.name }}</strong>」
              {{ coupon.isActive ? '停用' : '啟用' }}嗎？
            </p>

            <div v-if="coupon.isActive" class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>停用注意事項：</strong>
              <ul class="mb-0 mt-2">
                <li>優惠券仍會顯示在兌換頁面，但無法兌換</li>
                <li>如要完全移除請到兌換券菜單修改</li>
                <li>客人將無法購買此優惠券</li>
                <li>客人將無法使用此優惠券</li>
              </ul>
              <p class="mb-0 mt-2 fw-bold">請謹慎使用此功能</p>
            </div>

            <div v-else class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              <strong>啟用注意事項：</strong>
              <ul class="mb-0 mt-2">
                <li>客人將可以開始購買此優惠券</li>
                <li>客人將可以使用此優惠券</li>
                <li>請確認優惠券設定正確</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn" :class="coupon && coupon.isActive ? 'btn-warning' : 'btn-success'"
              @click="confirmToggleStatus" :disabled="isToggling">
              <span v-if="isToggling" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              {{ coupon ? (coupon.isActive ? '停用' : '啟用') : '' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Modal } from 'bootstrap';
import api from '@/api';

// 路由
const router = useRouter();
const route = useRoute();

// 從路由中獲取品牌ID和優惠券ID
const brandId = computed(() => route.params.brandId);
const couponId = computed(() => route.params.id);

// 狀態
const coupon = ref(null);
const isLoading = ref(true);
const error = ref('');
const isDeleting = ref(false);
const isToggling = ref(false);
const statusModal = ref(null);

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無資料';

  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化價格
const formatPrice = (price) => {
  return price.toLocaleString('zh-TW');
};

// 獲取優惠券資料
const fetchCouponData = async () => {
  if (!couponId.value) return;

  isLoading.value = true;
  error.value = '';

  try {
    const response = await api.promotion.getCouponTemplateById({
      id: couponId.value,
      brandId: brandId.value
    });

    if (response && response.template) {
      coupon.value = response.template;
    } else {
      error.value = '獲取優惠券資料失敗';
    }
  } catch (err) {
    console.error('獲取優惠券資料時發生錯誤:', err);
    error.value = '獲取優惠券資料時發生錯誤，請稍後再試';
  } finally {
    isLoading.value = false;
  }
};

// 顯示狀態切換確認對話框
const showToggleStatusModal = () => {
  statusModal.value.show();
};

// 確認切換狀態
const confirmToggleStatus = async () => {
  if (!coupon.value) return;

  isToggling.value = true;

  try {
    const newStatus = !coupon.value.isActive;
    await api.promotion.updateCouponTemplate({
      id: coupon.value._id,
      data: {
        brand: brandId.value,
        isActive: newStatus
      }
    });

    // 更新本地狀態
    coupon.value.isActive = newStatus;

    // 關閉對話框
    statusModal.value.hide();
  } catch (err) {
    console.error('切換狀態失敗:', err);
    alert('切換狀態失敗，請稍後再試');
  } finally {
    isToggling.value = false;
  }
};

// 處理刪除確認
const handleDelete = async () => {
  if (!coupon.value) return;

  isDeleting.value = true;

  try {
    await api.promotion.deleteCouponTemplate({
      id: coupon.value._id,
      brandId: brandId.value
    });

    // 關閉模態對話框
    const modalElement = document.getElementById('deleteCouponModal');
    const modal = Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }

    // 確保模態背景被移除後再導航
    setTimeout(() => {
      // 手動移除可能殘留的 backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
        document.body.classList.remove('modal-open');
      }

      // 返回優惠券列表
      router.push(`/admin/${brandId.value}/coupons`);

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-coupon-list'));
    }, 300);
  } catch (err) {
    console.error('刪除優惠券失敗:', err);

    if (err.response && err.response.data && err.response.data.message) {
      alert(`刪除失敗: ${err.response.data.message}`);
    } else {
      alert('刪除優惠券時發生錯誤');
    }
  } finally {
    isDeleting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 初始化狀態切換對話框
  const statusModalElement = document.getElementById('statusToggleModal');
  if (statusModalElement) {
    statusModal.value = new Modal(statusModalElement);
  }

  // 獲取優惠券資料
  fetchCouponData();
});
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

.bg-light {
  background-color: #f8f9fa !important;
}
</style>
