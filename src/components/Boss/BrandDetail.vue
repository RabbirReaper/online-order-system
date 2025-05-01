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

    <div v-if="brand && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between mb-4">
        <h2 class="mb-0">{{ brand.name }} <span class="badge rounded-pill"
            :class="brand.isActive ? 'bg-success' : 'bg-secondary'">{{ brand.isActive ? '啟用中' : '已停用' }}</span></h2>
        <div class="d-flex">
          <router-link :to="{ name: 'brand-edit', params: { id: brand._id } }" class="btn btn-primary me-2">
            <i class="bi bi-pencil me-1"></i>編輯品牌
          </router-link>
          <router-link :to="{ name: 'brand-list' }" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 品牌詳情卡片 -->
      <div class="row">
        <!-- 左側基本資訊 -->
        <div class="col-md-5 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">基本資訊</h5>
              <hr>
              <div class="mb-3">
                <div class="rounded overflow-hidden" style="max-height: 300px;">
                  <img :src="brand.image?.url || '/placeholder.jpg'" class="img-fluid w-100 object-fit-cover"
                    :alt="brand.name">
                </div>
              </div>
              <div class="mb-3">
                <label class="text-muted">品牌名稱</label>
                <p class="mb-1">{{ brand.name }}</p>
              </div>
              <div class="mb-3">
                <label class="text-muted">品牌描述</label>
                <p class="mb-1">{{ brand.description || '無描述' }}</p>
              </div>
              <div class="mb-3">
                <label class="text-muted">創建時間</label>
                <p class="mb-1">{{ formatDate(brand.createdAt) }}</p>
              </div>
              <div class="mb-0">
                <label class="text-muted">最後更新</label>
                <p class="mb-1">{{ formatDate(brand.updatedAt) }}</p>
              </div>
            </div>
            <div class="card-footer bg-transparent">
              <div class="d-flex justify-content-between">
                <button class="btn btn-sm" :class="brand.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                  @click="toggleBrandActive">
                  <i class="bi" :class="brand.isActive ? 'bi-pause-fill me-1' : 'bi-play-fill me-1'"></i>
                  {{ brand.isActive ? '停用品牌' : '啟用品牌' }}
                </button>
                <!-- 刪除按鈕，使用 data-bs-toggle 和 data-bs-target 屬性 -->
                <button type="button" class="btn btn-outline-danger btn-sm" data-bs-toggle="modal"
                  data-bs-target="#deleteBrandModal">
                  <i class="bi bi-trash me-1"></i>刪除品牌
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側統計資料 -->
        <div class="col-md-7 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">品牌統計</h5>
              <hr>
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <div class="card bg-light">
                    <div class="card-body p-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 class="mb-0">店鋪數量</h6>
                          <small class="text-muted">品牌旗下店鋪總數</small>
                        </div>
                        <h3 class="mb-0">{{ storeCount }}</h3>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card bg-light">
                    <div class="card-body p-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 class="mb-0">活躍店鋪</h6>
                          <small class="text-muted">目前啟用的店鋪數</small>
                        </div>
                        <h3 class="mb-0">{{ activeStoreCount }}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 店鋪列表 -->
              <h6 class="mb-3">店鋪列表</h6>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>店鋪名稱</th>
                      <th>狀態</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="store in stores" :key="store._id">
                      <td>{{ store.name }}</td>
                      <td>
                        <span class="badge" :class="store.isActive ? 'bg-success' : 'bg-secondary'">
                          {{ store.isActive ? '啟用中' : '已停用' }}
                        </span>
                      </td>
                      <td>
                        <router-link :to="`/admin/${brand._id}?storeId=${store._id}`"
                          class="btn btn-sm btn-outline-primary">
                          <i class="bi bi-door-open me-1"></i>進入
                        </router-link>
                      </td>
                    </tr>
                    <tr v-if="stores.length === 0">
                      <td colspan="3" class="text-center py-3">尚無店鋪</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 月報表預留區域 -->
              <div class="mt-4">
                <h6 class="mb-3">銷售報表</h6>
                <div class="alert alert-info text-center py-5">
                  <i class="bi bi-bar-chart-line fs-4 mb-2"></i>
                  <p class="mb-0">月度銷售報表功能開發中</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 - 使用 Bootstrap 5 的資料屬性方式 -->
    <div class="modal fade" id="deleteBrandModal" tabindex="-1" aria-labelledby="deleteBrandModalLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteBrandModalLabel">確認刪除</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="brand">
            <p>您確定要刪除品牌 <strong>{{ brand.name }}</strong> 嗎？</p>
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              此操作無法撤銷，品牌相關的所有資料都將被永久刪除。
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Modal } from 'bootstrap';
import api from '@/api';

// 路由
const router = useRouter();
const route = useRoute();

// 狀態
const brand = ref(null);
const stores = ref([]);
const isLoading = ref(true);
const error = ref('');
const isDeleting = ref(false);
const storeCount = ref(0);
const activeStoreCount = ref(0);

// 獲取品牌資料
const fetchBrandData = async () => {
  if (!route.params.id) return;

  isLoading.value = true;
  error.value = '';

  try {
    // 獲取品牌詳情
    const response = await api.brand.getBrandById(route.params.id);

    if (response && response.brand) {
      brand.value = response.brand;

      // 獲取品牌下的店鋪
      const storesResponse = await api.brand.getBrandStores({
        brandId: route.params.id
      });

      if (storesResponse && storesResponse.stores) {
        stores.value = storesResponse.stores;
        storeCount.value = stores.value.length;
        activeStoreCount.value = stores.value.filter(store => store.isActive).length;
      }
    } else {
      error.value = '獲取品牌資料失敗';
    }
  } catch (err) {
    console.error('獲取品牌資料時發生錯誤:', err);
    error.value = '獲取品牌資料時發生錯誤，請稍後再試';
  } finally {
    isLoading.value = false;
  }
};

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

// 切換品牌啟用狀態
const toggleBrandActive = async () => {
  if (!brand.value) return;

  try {
    const newStatus = !brand.value.isActive;
    await api.brand.toggleBrandActive({
      id: brand.value._id,
      isActive: newStatus
    });

    // 更新本地狀態
    brand.value.isActive = newStatus;

  } catch (err) {
    console.error('切換品牌狀態失敗:', err);
    alert('切換品牌狀態時發生錯誤');
  }
};

// 處理刪除確認
const handleDelete = async () => {
  if (!brand.value) return;

  isDeleting.value = true;

  try {
    await api.brand.deleteBrand(brand.value._id);

    // 關閉模態對話框
    const modalElement = document.getElementById('deleteBrandModal');
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

      // 返回品牌列表
      router.push({ name: 'brand-list' });

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-brand-list'));
    }, 300);
  } catch (err) {
    console.error('刪除品牌失敗:', err);

    if (err.response && err.response.data && err.response.data.message) {
      alert(`刪除失敗: ${err.response.data.message}`);
    } else {
      alert('刪除品牌時發生錯誤');
    }
  } finally {
    isDeleting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 獲取品牌資料
  fetchBrandData();
});
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-title {
  font-weight: 600;
}

/* 表格樣式 */
.table th {
  font-weight: 600;
  background-color: #f8f9fa;
}

.table td,
.table th {
  vertical-align: middle;
}
</style>
