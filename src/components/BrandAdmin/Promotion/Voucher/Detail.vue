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

    <div v-if="template && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ template.name }}</h4>
        <div class="d-flex">
          <router-link :to="`/admin/${brandId}/vouchers/edit/${template._id}`" class="btn btn-primary me-2">
            <i class="bi bi-pencil me-1"></i>編輯模板
          </router-link>
          <router-link :to="`/admin/${brandId}/vouchers`" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 兌換券模板詳情卡片 -->
      <div class="row">
        <!-- 左側基本資訊 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">基本資訊</h5>

              <div class="mb-3">
                <h6 class="text-muted mb-1">模板名稱</h6>
                <p>{{ template.name }}</p>
              </div>

              <div class="mb-3" v-if="template.description">
                <h6 class="text-muted mb-1">描述</h6>
                <p>{{ template.description }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">有效期限</h6>
                <p>{{ template.validityPeriod }} 天</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">狀態</h6>
                <p>
                  <span class="badge" :class="template.isActive ? 'bg-success' : 'bg-secondary'">
                    {{ template.isActive ? '啟用' : '停用' }}
                  </span>
                </p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">已發行數量</h6>
                <p class="fs-4 text-primary">{{ template.totalIssued || 0 }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">建立時間</h6>
                <p>{{ formatDateTime(template.createdAt) }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">最後更新</h6>
                <p>{{ formatDateTime(template.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側兌換內容 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">兌換內容</h5>

              <div v-if="template.exchangeDishTemplate">
                <div class="border rounded p-3 bg-light">
                  <div class="row">
                    <div class="col-md-8">
                      <h6 class="mb-2">{{ template.exchangeDishTemplate.name }}</h6>
                      <p class="fs-5 text-success mb-2">
                        <strong>${{ formatPrice(template.exchangeDishTemplate.basePrice) }}</strong>
                      </p>
                      <p class="text-muted small mb-0">
                        {{ template.exchangeDishTemplate.description || '無描述' }}
                      </p>
                    </div>
                    <div class="col-md-4" v-if="template.exchangeDishTemplate.image">
                      <img :src="template.exchangeDishTemplate.image.url" class="img-fluid rounded"
                        style="max-height: 120px; object-fit: cover;">
                    </div>
                  </div>

                  <!-- 餐點選項 -->
                  <div
                    v-if="template.exchangeDishTemplate.optionCategories && template.exchangeDishTemplate.optionCategories.length > 0"
                    class="mt-3">
                    <h6 class="mb-2">可選選項</h6>
                    <div class="row">
                      <div v-for="category in template.exchangeDishTemplate.optionCategories"
                        :key="category._id || category" class="col-md-6 mb-2">
                        <div class="border rounded p-2 bg-white">
                          <div class="fw-bold small">{{ category.name || category }}</div>
                          <div class="text-muted small">
                            {{ category.inputType === 'single' ? '單選' : '多選' }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 餐點標籤 -->
                  <div v-if="template.exchangeDishTemplate.tags && template.exchangeDishTemplate.tags.length > 0"
                    class="mt-3">
                    <h6 class="mb-2">標籤</h6>
                    <div>
                      <span v-for="tag in template.exchangeDishTemplate.tags" :key="tag"
                        class="badge bg-secondary me-1">{{ tag }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center text-muted py-4">
                <i class="bi bi-exclamation-circle display-6 d-block mb-2"></i>
                <p>未設定兌換餐點</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 使用統計 -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">使用統計</h5>
              <div class="row text-center">
                <div class="col-md-3">
                  <div class="border-end">
                    <h3 class="text-primary mb-1">{{ template.totalIssued || 0 }}</h3>
                    <p class="text-muted mb-0">總發行量</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border-end">
                    <h3 class="text-success mb-1">{{ template.totalUsed || 0 }}</h3>
                    <p class="text-muted mb-0">已使用</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border-end">
                    <h3 class="text-warning mb-1">{{ (template.totalIssued || 0) - (template.totalUsed || 0) }}</h3>
                    <p class="text-muted mb-0">未使用</p>
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

      <!-- Bundle 使用情況 -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">Bundle 使用情況</h5>
              <div v-if="relatedBundles.length > 0">
                <div class="row">
                  <div v-for="bundle in relatedBundles" :key="bundle._id" class="col-md-6 col-lg-4 mb-3">
                    <div class="card border-light">
                      <div class="card-body">
                        <h6 class="card-title">{{ bundle.name }}</h6>
                        <p class="card-text small text-muted">{{ bundle.description || '無描述' }}</p>
                        <div class="d-flex justify-content-between align-items-center">
                          <small class="text-muted">銷售: {{ bundle.totalSold || 0 }}</small>
                          <span class="badge" :class="bundle.isActive ? 'bg-success' : 'bg-secondary'">
                            {{ bundle.isActive ? '啟用' : '停用' }}
                          </span>
                        </div>
                        <router-link :to="`/admin/${brandId}/bundles/detail/${bundle._id}`"
                          class="btn btn-sm btn-outline-primary mt-2">
                          查看 Bundle
                        </router-link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-muted py-4">
                <i class="bi bi-inbox display-6 d-block mb-2"></i>
                <p>此模板尚未被任何 Bundle 使用</p>
                <router-link :to="`/admin/${brandId}/bundles/create`" class="btn btn-outline-primary">
                  <i class="bi bi-plus-circle me-1"></i>建立 Bundle
                </router-link>
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
                  <i class="bi bi-power me-1"></i>{{ template.isActive ? '停用' : '啟用' }}模板
                </button>
                <button class="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteTemplateModal">
                  <i class="bi bi-trash me-1"></i>刪除模板
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
            <p v-if="template">
              您確定要{{ template.isActive ? '停用' : '啟用' }}「{{ template.name }}」嗎？
            </p>
            <div class="alert alert-info">
              <i class="bi bi-info-circle-fill me-2"></i>
              {{ template?.isActive ? '停用後此模板無法被用於建立新的 Bundle' : '啟用後此模板可以重新被用於建立 Bundle' }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="confirmToggleStatus" :disabled="isToggling">
              <span v-if="isToggling" class="spinner-border spinner-border-sm me-1"></span>
              確認{{ template?.isActive ? '停用' : '啟用' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <div class="modal fade" id="deleteTemplateModal" tabindex="-1">
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
            <p v-if="template">
              您確定要刪除兌換券模板「{{ template.name }}」嗎？
            </p>
            <p class="text-muted small">
              刪除後，所有相關的兌換券實例和統計資料也會一併移除。
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

// 從路由中獲取品牌ID和模板ID
const brandId = computed(() => route.params.brandId);
const templateId = computed(() => route.params.id);

// 狀態
const isLoading = ref(false);
const isToggling = ref(false);
const isDeleting = ref(false);
const error = ref('');

// 兌換券模板資料
const template = ref(null);
const relatedBundles = ref([]);

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

// 計算使用率
const usageRate = computed(() => {
  if (!template.value || !template.value.totalIssued || template.value.totalIssued === 0) {
    return 0;
  }
  return Math.round(((template.value.totalUsed || 0) / template.value.totalIssued) * 100);
});

// 獲取兌換券模板資料
const fetchTemplateData = async () => {
  if (!templateId.value || !brandId.value) return;

  isLoading.value = true;
  error.value = '';

  try {
    const response = await api.promotion.getVoucherTemplateById({
      brandId: brandId.value,
      id: templateId.value
    });

    if (response && response.template) {
      template.value = response.template;
    } else {
      error.value = '獲取兌換券模板資料失敗';
    }
  } catch (err) {
    console.error('獲取兌換券模板資料時發生錯誤:', err);
    error.value = '獲取兌換券模板資料時發生錯誤，請稍後再試';
  } finally {
    isLoading.value = false;
  }
};

// 獲取相關的 Bundle
const fetchRelatedBundles = async () => {
  if (!templateId.value || !brandId.value) return;

  try {
    // 獲取所有 Bundle，然後篩選出使用此模板的
    const response = await api.bundle.getAllBundles({
      brandId: brandId.value,
      includeInactive: true
    });

    if (response && response.bundles) {
      relatedBundles.value = response.bundles.filter(bundle =>
        bundle.bundleItems?.some(item =>
          item.voucherTemplate === templateId.value
        )
      );
    }
  } catch (err) {
    console.error('獲取相關 Bundle 失敗:', err);
    // 不影響主要功能，只記錄錯誤
  }
};

// 顯示狀態切換確認對話框
const showToggleStatusModal = () => {
  statusModal.value.show();
};

// 確認切換狀態
const confirmToggleStatus = async () => {
  if (!template.value) return;

  isToggling.value = true;

  try {
    const newStatus = !template.value.isActive;
    await api.promotion.updateVoucherTemplate({
      brandId: brandId.value,
      id: template.value._id,
      data: { isActive: newStatus }
    });

    // 更新本地狀態
    template.value.isActive = newStatus;

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
  if (!template.value) return;

  isDeleting.value = true;

  try {
    await api.promotion.deleteVoucherTemplate({
      brandId: brandId.value,
      id: template.value._id
    });

    // 關閉模態對話框
    const modalElement = document.getElementById('deleteTemplateModal');
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

      // 返回兌換券模板列表
      router.push(`/admin/${brandId.value}/vouchers`);

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-voucher-list'));
    }, 300);
  } catch (err) {
    console.error('刪除兌換券模板失敗:', err);

    if (err.response && err.response.data && err.response.data.message) {
      alert(`刪除失敗: ${err.response.data.message}`);
    } else {
      alert('刪除兌換券模板時發生錯誤');
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

  // 獲取兌換券模板資料
  fetchTemplateData();

  // 獲取相關 Bundle
  fetchRelatedBundles();
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
