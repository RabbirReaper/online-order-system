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

    <div v-if="bundle && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ bundle.name }}</h4>
        <div class="d-flex">
          <router-link :to="`/admin/${brandId}/bundles/edit/${bundle._id}`" class="btn btn-primary me-2">
            <i class="bi bi-pencil me-1"></i>編輯商品
          </router-link>
          <router-link :to="`/admin/${brandId}/bundles`" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 包裝商品詳情卡片 -->
      <div class="row">
        <!-- 左側基本資訊 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">基本資訊</h5>

              <div class="mb-3">
                <h6 class="text-muted mb-1">商品名稱</h6>
                <p>{{ bundle.name }}</p>
              </div>

              <div class="mb-3" v-if="bundle.sellingPoint">
                <h6 class="text-muted mb-1">賣點數值</h6>
                <p class="fs-4 text-warning">
                  <i class="bi bi-star-fill me-1"></i>{{ bundle.sellingPoint }}
                </p>
              </div>

              <div class="mb-3" v-if="bundle.description">
                <h6 class="text-muted mb-1">商品描述</h6>
                <p>{{ bundle.description }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">狀態</h6>
                <p>
                  <span class="badge" :class="getStatusBadgeClass(bundle)">
                    {{ getStatusText(bundle) }}
                  </span>
                  <span v-if="bundle.autoStatusControl" class="badge bg-info ms-2">
                    自動控制
                  </span>
                </p>
              </div>

              <div class="mb-3" v-if="bundle.image">
                <h6 class="text-muted mb-1">商品圖片</h6>
                <img :src="bundle.image.url" class="img-fluid rounded" style="max-width: 300px;">
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">建立時間</h6>
                <p>{{ formatDateTime(bundle.createdAt) }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">最後更新</h6>
                <p>{{ formatDateTime(bundle.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側價格和期限資訊 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">價格與期限設定</h5>

              <div class="row mb-3" v-if="bundle.cashPrice">
                <div class="col-12">
                  <h6 class="text-muted mb-1">現金價格</h6>
                  <p class="fs-4 text-success mb-0">
                    ${{ formatPrice(bundle.cashPrice.selling || bundle.cashPrice.original) }}
                  </p>
                  <small v-if="bundle.cashPrice.selling && bundle.cashPrice.selling < bundle.cashPrice.original"
                    class="text-muted text-decoration-line-through">
                    原價 ${{ formatPrice(bundle.cashPrice.original) }}
                  </small>
                  <div v-if="bundle.cashPrice.selling && bundle.cashPrice.selling < bundle.cashPrice.original"
                    class="mt-1">
                    <span class="badge bg-danger">
                      省 ${{ formatPrice(bundle.cashPrice.original - bundle.cashPrice.selling) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="row mb-3" v-if="bundle.pointPrice">
                <div class="col-12">
                  <h6 class="text-muted mb-1">點數價格</h6>
                  <p class="fs-4 text-primary mb-0">
                    {{ bundle.pointPrice.selling || bundle.pointPrice.original }} 點
                  </p>
                  <small v-if="bundle.pointPrice.selling && bundle.pointPrice.selling < bundle.pointPrice.original"
                    class="text-muted text-decoration-line-through">
                    原價 {{ bundle.pointPrice.original }} 點
                  </small>
                  <div v-if="bundle.pointPrice.selling && bundle.pointPrice.selling < bundle.pointPrice.original"
                    class="mt-1">
                    <span class="badge bg-primary">
                      省 {{ bundle.pointPrice.original - bundle.pointPrice.selling }} 點
                    </span>
                  </div>
                </div>
              </div>

              <div class="mb-3" v-if="bundle.validFrom && bundle.validTo">
                <h6 class="text-muted mb-1">販售期間</h6>
                <p>
                  {{ formatDateTime(bundle.validFrom) }}<br>
                  <span class="text-muted">至</span><br>
                  {{ formatDateTime(bundle.validTo) }}
                </p>
                <div class="mt-2">
                  <span v-if="isInValidPeriod" class="badge bg-success">
                    <i class="bi bi-clock me-1"></i>販售中
                  </span>
                  <span v-else-if="isBeforeValidPeriod" class="badge bg-warning">
                    <i class="bi bi-clock me-1"></i>尚未開始
                  </span>
                  <span v-else class="badge bg-secondary">
                    <i class="bi bi-clock me-1"></i>已結束
                  </span>
                </div>
              </div>

              <div class="mb-3" v-if="bundle.voucherValidityDays">
                <h6 class="text-muted mb-1">兌換券有效期</h6>
                <p>{{ bundle.voucherValidityDays }} 天</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">購買限制</h6>
                <p>
                  {{ bundle.purchaseLimitPerUser ?
                    `每人限購 ${bundle.purchaseLimitPerUser} 個` : '無限制' }}
                </p>
              </div>

              <!-- 價值分析 -->
              <div class="mb-3" v-if="bundleValue.totalValue > 0">
                <h6 class="text-muted mb-1">價值分析</h6>
                <div class="border rounded p-3 bg-light">
                  <div class="row text-center">
                    <div class="col-6">
                      <div class="border-end">
                        <h5 class="text-info mb-1">${{ formatPrice(bundleValue.totalValue) }}</h5>
                        <p class="text-muted mb-0 small">總價值</p>
                      </div>
                    </div>
                    <div class="col-6">
                      <h5 class="text-success mb-1">${{ formatPrice(bundleValue.savings) }}</h5>
                      <p class="text-muted mb-0 small">省下金額</p>
                    </div>
                  </div>
                  <div class="text-center mt-2" v-if="bundleValue.savingsPercentage > 0">
                    <span class="badge bg-success fs-6">
                      省了 {{ bundleValue.savingsPercentage }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 包裝內容 -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">包裝內容</h5>
              <div v-if="bundle.bundleItems && bundle.bundleItems.length > 0">
                <div class="row">
                  <div v-for="(item, index) in bundle.bundleItems" :key="index" class="col-md-6 col-lg-4 mb-3">
                    <div class="card border-light">
                      <div class="card-body">
                        <div class="d-flex align-items-start">
                          <div class="me-3">
                            <span class="badge bg-primary rounded-pill fs-6">{{ item.quantity }}x</span>
                          </div>
                          <div class="flex-grow-1">
                            <h6 class="mb-1">{{ item.voucherName || '兌換券' }}</h6>
                            <div v-if="item.voucherTemplate">
                              <p class="text-muted small mb-1">
                                {{ item.voucherTemplate.description || '無描述' }}
                              </p>
                              <div v-if="item.voucherTemplate.exchangeDishTemplate" class="mt-2">
                                <div class="border rounded p-2 bg-light">
                                  <div class="row">
                                    <div class="col-8">
                                      <div class="fw-bold small">{{ item.voucherTemplate.exchangeDishTemplate.name }}
                                      </div>
                                      <div class="text-success small">
                                        ${{ formatPrice(item.voucherTemplate.exchangeDishTemplate.basePrice) }}
                                      </div>
                                    </div>
                                    <div class="col-4" v-if="item.voucherTemplate.exchangeDishTemplate.image">
                                      <img :src="item.voucherTemplate.exchangeDishTemplate.image.url"
                                        class="img-fluid rounded" style="max-height: 40px; object-fit: cover;">
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div class="small text-muted mt-1">
                                有效期：{{ item.voucherTemplate.validityPeriod }} 天
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-muted py-4">
                <i class="bi bi-inbox display-6 d-block mb-2"></i>
                <p>尚未設定包裝內容</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 銷售統計 -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">銷售統計</h5>
              <div class="row text-center">
                <div class="col-md-3">
                  <div class="border-end">
                    <h3 class="text-primary mb-1">{{ bundle.totalSold || 0 }}</h3>
                    <p class="text-muted mb-0">總銷售量</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border-end">
                    <h3 class="text-success mb-1">${{ formatPrice(totalRevenue) }}</h3>
                    <p class="text-muted mb-0">總收益</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border-end">
                    <h3 class="text-info mb-1">{{ averagePrice }}</h3>
                    <p class="text-muted mb-0">平均售價</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <h3 class="text-warning mb-1">{{ conversionRate }}%</h3>
                  <p class="text-muted mb-0">轉換率</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api';

// 路由
const route = useRoute();
const router = useRouter();

// 從路由中獲取品牌ID和商品ID
const brandId = computed(() => route.params.brandId);
const bundleId = computed(() => route.params.id);

// 狀態
const isLoading = ref(false);
const error = ref('');

// 包裝商品資料
const bundle = ref(null);

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
const getStatusBadgeClass = (bundle) => {
  if (!bundle.isActive) return 'bg-secondary';

  const now = new Date();
  if (bundle.autoStatusControl && bundle.validTo && new Date(bundle.validTo) < now) {
    return 'bg-warning';
  }

  return 'bg-success';
};

// 獲取狀態文字
const getStatusText = (bundle) => {
  if (!bundle.isActive) return '停用';

  const now = new Date();
  if (bundle.autoStatusControl && bundle.validTo && new Date(bundle.validTo) < now) {
    return '已過期';
  }

  return '啟用';
};

// 檢查是否在有效期內
const isInValidPeriod = computed(() => {
  if (!bundle.value || !bundle.value.validFrom || !bundle.value.validTo) return false;
  const now = new Date();
  return now >= new Date(bundle.value.validFrom) && now <= new Date(bundle.value.validTo);
});

// 檢查是否在有效期前
const isBeforeValidPeriod = computed(() => {
  if (!bundle.value || !bundle.value.validFrom) return false;
  const now = new Date();
  return now < new Date(bundle.value.validFrom);
});

// 計算包裝價值
const bundleValue = computed(() => {
  if (!bundle.value || !bundle.value.bundleItems) {
    return { totalValue: 0, savings: 0, savingsPercentage: 0 };
  }

  let totalValue = 0;
  bundle.value.bundleItems.forEach(item => {
    if (item.voucherTemplate?.exchangeDishTemplate?.basePrice) {
      totalValue += item.voucherTemplate.exchangeDishTemplate.basePrice * item.quantity;
    }
  });

  const sellingPrice = bundle.value.cashPrice?.selling || bundle.value.cashPrice?.original || 0;
  const savings = Math.max(0, totalValue - sellingPrice);
  const savingsPercentage = totalValue > 0 ? Math.round((savings / totalValue) * 100) : 0;

  return { totalValue, savings, savingsPercentage };
});

// 計算總收益
const totalRevenue = computed(() => {
  if (!bundle.value || !bundle.value.totalSold) return 0;

  const price = bundle.value.cashPrice?.selling || bundle.value.cashPrice?.original || 0;
  return price * bundle.value.totalSold;
});

// 計算平均售價
const averagePrice = computed(() => {
  if (!bundle.value || !bundle.value.totalSold) return '$0';

  const avgCash = bundle.value.cashPrice ?
    (bundle.value.cashPrice.selling || bundle.value.cashPrice.original) : 0;
  const avgPoint = bundle.value.pointPrice ?
    (bundle.value.pointPrice.selling || bundle.value.pointPrice.original) : 0;

  if (avgCash && avgPoint) {
    return `$${formatPrice(avgCash)} / ${avgPoint}點`;
  } else if (avgCash) {
    return `$${formatPrice(avgCash)}`;
  } else if (avgPoint) {
    return `${avgPoint} 點`;
  }
  return '$0';
});

// 計算轉換率 (這裡是模擬數據，實際需要從後端獲取)
const conversionRate = computed(() => {
  // 模擬轉換率計算，實際應該是 (購買數 / 瀏覽數) * 100
  return Math.min(Math.round((bundle.value?.totalSold || 0) / 10), 100);
});

// 獲取包裝商品資料
const fetchBundleData = async () => {
  if (!bundleId.value || !brandId.value) return;

  isLoading.value = true;
  error.value = '';

  try {
    const response = await api.bundle.getBundleById({
      brandId: brandId.value,
      bundleId: bundleId.value
    });

    if (response && response.bundle) {
      bundle.value = response.bundle;
    } else {
      error.value = '獲取包裝商品資料失敗';
    }
  } catch (err) {
    console.error('獲取包裝商品資料時發生錯誤:', err);
    error.value = '獲取包裝商品資料時發生錯誤，請稍後再試';
  } finally {
    isLoading.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 獲取包裝商品資料
  fetchBundleData();
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
</style>
