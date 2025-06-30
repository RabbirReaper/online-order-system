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

      <!-- 操作按鈕 -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">操作</h5>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-primary" @click="showToggleStatusModal">
                  <i class="bi bi-power me-1"></i>{{ bundle.isActive ? '停用' : '啟用' }}商品
                </button>
                <button class="btn btn-outline-info" @click="triggerAutoUpdate">
                  <i class="bi bi-arrow-clockwise me-1"></i>更新狀態
                </button>
                <button class="btn btn-outline-secondary" @click="previewBundle">
                  <i class="bi bi-eye me-1"></i>預覽商品
                </button>
                <button class="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteBundleModal">
                  <i class="bi bi-trash me-1"></i>刪除商品
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
            <p v-if="bundle">
              您確定要{{ bundle.isActive ? '停用' : '啟用' }}「{{ bundle.name }}」嗎？
            </p>
            <div class="alert alert-info">
              <i class="bi bi-info-circle-fill me-2"></i>
              {{ bundle?.isActive ? '停用後顧客將無法購買此商品' : '啟用後顧客可以重新購買此商品' }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="confirmToggleStatus" :disabled="isToggling">
              <span v-if="isToggling" class="spinner-border spinner-border-sm me-1"></span>
              確認{{ bundle?.isActive ? '停用' : '啟用' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <div class="modal fade" id="deleteBundleModal" tabindex="-1">
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
            <p v-if="bundle">
              您確定要刪除包裝商品「{{ bundle.name }}」嗎？
            </p>
            <p class="text-muted small">
              刪除後，所有相關的銷售資料和已售出的商品實例也會一併移除。
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

    <!-- 商品預覽對話框 -->
    <div class="modal fade" id="previewModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">商品預覽</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="bundle">
            <!-- 模擬客戶端看到的商品展示 -->
            <div class="card">
              <div class="row g-0">
                <div class="col-md-4" v-if="bundle.image">
                  <img :src="bundle.image.url" class="img-fluid rounded-start h-100" style="object-fit: cover;">
                </div>
                <div :class="bundle.image ? 'col-md-8' : 'col-12'">
                  <div class="card-body">
                    <h4 class="card-title">{{ bundle.name }}</h4>
                    <p class="card-text" v-if="bundle.description">{{ bundle.description }}</p>

                    <div class="mb-3" v-if="bundle.sellingPoint">
                      <span class="badge bg-warning text-dark fs-6">
                        <i class="bi bi-star-fill me-1"></i>{{ bundle.sellingPoint }}
                      </span>
                    </div>

                    <div class="row mb-3">
                      <div class="col-6" v-if="bundle.cashPrice">
                        <h5 class="text-success">
                          ${{ formatPrice(bundle.cashPrice.selling || bundle.cashPrice.original) }}
                          <small v-if="bundle.cashPrice.selling && bundle.cashPrice.selling < bundle.cashPrice.original"
                            class="text-muted text-decoration-line-through">
                            ${{ formatPrice(bundle.cashPrice.original) }}
                          </small>
                        </h5>
                      </div>
                      <div class="col-6" v-if="bundle.pointPrice">
                        <h5 class="text-primary">
                          {{ bundle.pointPrice.selling || bundle.pointPrice.original }} 點
                          <small
                            v-if="bundle.pointPrice.selling && bundle.pointPrice.selling < bundle.pointPrice.original"
                            class="text-muted text-decoration-line-through">
                            {{ bundle.pointPrice.original }} 點
                          </small>
                        </h5>
                      </div>
                    </div>

                    <div class="mb-3">
                      <h6>包裝內容：</h6>
                      <ul class="list-unstyled">
                        <li v-for="(item, index) in bundle.bundleItems" :key="index" class="mb-1">
                          <i class="bi bi-check-circle text-success me-2"></i>
                          {{ item.quantity }}x {{ item.voucherName || '兌換券' }}
                        </li>
                      </ul>
                    </div>

                    <div class="d-grid gap-2">
                      <button class="btn btn-primary btn-lg" disabled>
                        <i class="bi bi-cart-plus me-2"></i>加入購物車
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉預覽</button>
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

// 從路由中獲取品牌ID和商品ID
const brandId = computed(() => route.params.brandId);
const bundleId = computed(() => route.params.id);

// 狀態
const isLoading = ref(false);
const isToggling = ref(false);
const isDeleting = ref(false);
const error = ref('');

// 包裝商品資料
const bundle = ref(null);

// 對話框
const statusModal = ref(null);
const previewModal = ref(null);

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

// 顯示狀態切換確認對話框
const showToggleStatusModal = () => {
  statusModal.value.show();
};

// 確認切換狀態
const confirmToggleStatus = async () => {
  if (!bundle.value) return;

  isToggling.value = true;

  try {
    const newStatus = !bundle.value.isActive;
    await api.bundle.updateBundle({
      brandId: brandId.value,
      bundleId: bundle.value._id,
      data: { isActive: newStatus }
    });

    // 更新本地狀態
    bundle.value.isActive = newStatus;

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

    // 重新載入商品資料
    await fetchBundleData();

    alert('狀態更新完成');
  } catch (err) {
    console.error('自動更新狀態失敗:', err);
    alert('自動更新狀態失敗，請稍後再試');
  }
};

// 預覽商品
const previewBundle = () => {
  previewModal.value.show();
};

// 處理刪除確認
const handleDelete = async () => {
  if (!bundle.value) return;

  isDeleting.value = true;

  try {
    await api.bundle.deleteBundle({
      brandId: brandId.value,
      bundleId: bundle.value._id
    });

    // 關閉模態對話框
    const modalElement = document.getElementById('deleteBundleModal');
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

      // 返回包裝商品列表
      router.push(`/admin/${brandId.value}/bundles`);

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-bundle-list'));
    }, 300);
  } catch (err) {
    console.error('刪除包裝商品失敗:', err);

    if (err.response && err.response.data && err.response.data.message) {
      alert(`刪除失敗: ${err.response.data.message}`);
    } else {
      alert('刪除包裝商品時發生錯誤');
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

  // 初始化預覽對話框
  const previewModalElement = document.getElementById('previewModal');
  if (previewModalElement) {
    previewModal.value = new Modal(previewModalElement);
  }

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

.modal-lg {
  max-width: 800px;
}
</style>
