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

    <div v-if="voucher && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ voucher.name }}</h4>
        <div class="d-flex">
          <router-link :to="`/admin/${brandId}/vouchers/edit/${voucher._id}`" class="btn btn-primary me-2">
            <i class="bi bi-pencil me-1"></i>編輯兌換券
          </router-link>
          <router-link :to="`/admin/${brandId}/vouchers`" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 兌換券詳情卡片 -->
      <div class="row">
        <!-- 左側基本資訊 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">基本資訊</h5>

              <div class="mb-3">
                <h6 class="text-muted mb-1">兌換券名稱</h6>
                <p>{{ voucher.name }}</p>
              </div>

              <div class="mb-3" v-if="voucher.sellingPoint">
                <h6 class="text-muted mb-1">賣點</h6>
                <p class="text-primary">{{ voucher.sellingPoint }}</p>
              </div>

              <div class="mb-3" v-if="voucher.description">
                <h6 class="text-muted mb-1">詳細描述</h6>
                <p>{{ voucher.description }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">狀態</h6>
                <p>
                  <span class="badge" :class="getStatusBadgeClass(voucher)">
                    {{ getStatusText(voucher) }}
                  </span>
                  <span v-if="voucher.autoStatusControl" class="badge bg-info ms-2">
                    自動控制
                  </span>
                </p>
              </div>

              <div class="mb-3" v-if="voucher.image">
                <h6 class="text-muted mb-1">兌換券圖片</h6>
                <img :src="voucher.image.url" class="img-fluid rounded" style="max-width: 300px;">
              </div>
            </div>
          </div>
        </div>

        <!-- 右側價格和期限資訊 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">價格設定</h5>

              <div class="row mb-3" v-if="voucher.cashPrice">
                <div class="col-6">
                  <h6 class="text-muted mb-1">現金價格</h6>
                  <p class="fs-4 text-success mb-0">
                    ${{ formatPrice(voucher.cashPrice.selling || voucher.cashPrice.original) }}
                  </p>
                  <small v-if="voucher.cashPrice.selling && voucher.cashPrice.selling < voucher.cashPrice.original"
                    class="text-muted text-decoration-line-through">
                    原價 ${{ formatPrice(voucher.cashPrice.original) }}
                  </small>
                </div>
              </div>

              <div class="row mb-3" v-if="voucher.pointPrice">
                <div class="col-6">
                  <h6 class="text-muted mb-1">點數價格</h6>
                  <p class="fs-4 text-primary mb-0">
                    {{ voucher.pointPrice.selling || voucher.pointPrice.original }} 點
                  </p>
                  <small v-if="voucher.pointPrice.selling && voucher.pointPrice.selling < voucher.pointPrice.original"
                    class="text-muted text-decoration-line-through">
                    原價 {{ voucher.pointPrice.original }} 點
                  </small>
                </div>
              </div>

              <div class="mb-3" v-if="voucher.validFrom && voucher.validTo">
                <h6 class="text-muted mb-1">販售期間</h6>
                <p>
                  {{ formatDateTime(voucher.validFrom) }}<br>
                  <span class="text-muted">至</span><br>
                  {{ formatDateTime(voucher.validTo) }}
                </p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">購買限制</h6>
                <p>
                  {{ voucher.purchaseLimitPerUser ?
                    `每人限購 ${voucher.purchaseLimitPerUser} 個` : '無限制' }}
                </p>
              </div>

              <!-- 計算節省金額 -->
              <div class="mb-3" v-if="bundleValue > 0">
                <h6 class="text-muted mb-1">價值分析</h6>
                <div class="border rounded p-3 bg-light">
                  <div class="row text-center">
                    <div class="col-6">
                      <div class="border-end">
                        <h5 class="text-primary mb-1">{{ bundleValue }}</h5>
                        <p class="text-muted mb-0 small">總價值（點數）</p>
                      </div>
                    </div>
                    <div class="col-6">
                      <h5 class="text-success mb-1">{{ savings }}</h5>
                      <p class="text-muted mb-0 small">節省（點數）</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 兌換內容 -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">兌換內容</h5>
              <div v-if="voucher.bundleItems && voucher.bundleItems.length > 0">
                <div class="row">
                  <div v-for="(item, index) in voucher.bundleItems" :key="index" class="col-md-6 col-lg-4 mb-3">
                    <div class="card border-light">
                      <div class="card-body">
                        <div class="d-flex align-items-center">
                          <div class="me-3">
                            <span class="badge bg-primary rounded-pill fs-6">{{ item.quantity }}x</span>
                          </div>
                          <div class="flex-grow-1">
                            <h6 class="mb-1">{{ item.couponTemplate?.name || '未知兌換券' }}</h6>
                            <p class="text-muted small mb-0">
                              價值: {{ item.couponTemplate?.pointCost || 0 }} 點
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-muted py-4">
                <i class="bi bi-inbox display-6 d-block mb-2"></i>
                <p>尚未設定兌換內容</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 統計資訊 -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">購買統計</h5>
              <div class="row text-center">
                <div class="col-md-3">
                  <div class="border-end">
                    <h3 class="text-primary mb-1">{{ voucher.totalSold || 0 }}</h3>
                    <p class="text-muted mb-0">總銷售</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border-end">
                    <h3 class="text-success mb-1">{{ voucher.totalRevenue || 0 }}</h3>
                    <p class="text-muted mb-0">總收益</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border-end">
                    <h3 class="text-warning mb-1">{{ voucher.totalUsed || 0 }}</h3>
                    <p class="text-muted mb-0">已使用</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <h3 class="text-info mb-1">{{ usageRate }}%</h3>
                  <p class="text-muted mb-0">使用率</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按鈕 -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">操作</h5>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-primary" @click="showToggleStatusModal">
                  <i class="bi bi-power me-1"></i>{{ voucher.isActive ? '停用' : '啟用' }}兌換券
                </button>
                <button class="btn btn-outline-info" @click="triggerAutoUpdate">
                  <i class="bi bi-arrow-clockwise me-1"></i>更新狀態
                </button>
                <button class="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteVoucherModal">
                  <i class="bi bi-trash me-1"></i>刪除兌換券
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 狀態切換確認對話框 -->
    <div class="modal fade" id="statusToggleModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認操作</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p v-if="voucher">
              您確定要{{ voucher.isActive ? '停用' : '啟用' }}「{{ voucher.name }}」嗎？
            </p>
            <div class="alert alert-info">
              <i class="bi bi-info-circle-fill me-2"></i>
              {{ voucher?.isActive ? '停用後顧客將無法購買此兌換券' : '啟用後顧客可以重新購買此兌換券' }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="confirmToggleStatus" :disabled="isToggling">
              <span v-if="isToggling" class="spinner-border spinner-border-sm me-1"></span>
              確認{{ voucher?.isActive ? '停用' : '啟用' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <div class="modal fade" id="deleteVoucherModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>警告：</strong>此操作無法復原
            </div>
            <p v-if="voucher">
              您確定要刪除兌換券「{{ voucher.name }}」嗎？
            </p>
            <p class="text-muted small">
              刪除後，所有相關的統計資料和已售出的兌換券實例也會一併移除。
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-danger" @click="handleDelete" :disabled="isDeleting">
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1"></span>
              {{ isDeleting ? '刪除中...' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Modal } from 'bootstrap';
import api from '@/api';

// 路由
const route = useRoute();
const router = useRouter();

// 從路由中獲取品牌ID和兌換券ID
const brandId = computed(() => route.params.brandId);
const voucherId = computed(() => route.params.id);

// 狀態
const isLoading = ref(false);
const isToggling = ref(false);
const isDeleting = ref(false);
const error = ref('');

// 兌換券資料
const voucher = ref(null);

// 對話框
const statusModal = ref(null);

// 格式化價格
const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0';
};

// 格式化日期時間
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 獲取狀態徽章樣式
const getStatusBadgeClass = (voucher) => {
  if (!voucher.isActive) return 'bg-secondary';

  const now = new Date();
  if (voucher.autoStatusControl && voucher.validTo && new Date(voucher.validTo) < now) {
    return 'bg-warning';
  }

  return 'bg-success';
};

// 獲取狀態文字
const getStatusText = (voucher) => {
  if (!voucher.isActive) return '停用';

  const now = new Date();
  if (voucher.autoStatusControl && voucher.validTo && new Date(voucher.validTo) < now) {
    return '已過期';
  }

  return '啟用';
};

// 計算兌換券總價值
const bundleValue = computed(() => {
  if (!voucher.value || !voucher.value.bundleItems) return 0;

  return voucher.value.bundleItems.reduce((total, item) => {
    const itemValue = (item.couponTemplate?.pointCost || 0) * item.quantity;
    return total + itemValue;
  }, 0);
});

// 計算節省的點數
const savings = computed(() => {
  if (!voucher.value || !voucher.value.pointPrice) return 0;

  const cost = voucher.value.pointPrice.selling || voucher.value.pointPrice.original || 0;
  return Math.max(0, bundleValue.value - cost);
});

// 計算使用率
const usageRate = computed(() => {
  if (!voucher.value || !voucher.value.totalSold || voucher.value.totalSold === 0) {
    return 0;
  }
  return Math.round(((voucher.value.totalUsed || 0) / voucher.value.totalSold) * 100);
});

// 獲取兌換券資料
const fetchVoucherData = async () => {
  if (!voucherId.value || !brandId.value) return;

  isLoading.value = true;
  error.value = '';

  try {
    const response = await api.bundle.getBundleById({
      brandId: brandId.value,
      bundleId: voucherId.value
    });

    if (response && response.bundle) {
      voucher.value = response.bundle;
    } else {
      error.value = '獲取兌換券資料失敗';
    }
  } catch (err) {
    console.error('獲取兌換券資料時發生錯誤:', err);
    error.value = '獲取兌換券資料時發生錯誤，請稍後再試';
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
  if (!voucher.value) return;

  isToggling.value = true;

  try {
    const newStatus = !voucher.value.isActive;
    await api.bundle.updateBundle({
      brandId: brandId.value,
      bundleId: voucher.value._id,
      data: { isActive: newStatus }
    });

    // 更新本地狀態
    voucher.value.isActive = newStatus;

    // 關閉對話框
    statusModal.value.hide();
  } catch (err) {
    console.error('切換狀態失敗:', err);
    alert('切換狀態失敗，請稍後再試');
  } finally {
    isToggling.value = false;
  }
};

// 觸發自動狀態更新
const triggerAutoUpdate = async () => {
  try {
    await api.bundle.autoUpdateBundleStatus();

    // 重新載入兌換券資料
    await fetchVoucherData();

    alert('狀態更新完成');
  } catch (err) {
    console.error('自動更新狀態失敗:', err);
    alert('自動更新狀態失敗，請稍後再試');
  }
};

// 處理刪除確認
const handleDelete = async () => {
  if (!voucher.value) return;

  isDeleting.value = true;

  try {
    await api.bundle.deleteBundle({
      brandId: brandId.value,
      bundleId: voucher.value._id
    });

    // 關閉模態對話框
    const modalElement = document.getElementById('deleteVoucherModal');
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

      // 返回兌換券列表
      router.push(`/admin/${brandId.value}/vouchers`);

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-voucher-list'));
    }, 300);
  } catch (err) {
    console.error('刪除兌換券失敗:', err);

    if (err.response && err.response.data && err.response.data.message) {
      alert(`刪除失敗: ${err.response.data.message}`);
    } else {
      alert('刪除兌換券時發生錯誤');
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

  // 獲取兌換券資料
  fetchVoucherData();
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

.border-end {
  border-right: 1px solid #dee2e6 !important;
}

.border-end:last-child {
  border-right: none !important;
}

.img-fluid {
  max-height: 200px;
  object-fit: cover;
}
</style>
