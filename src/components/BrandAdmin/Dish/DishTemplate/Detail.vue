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

    <div v-if="dish && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="d-flex">
          <div class="bg-primary rounded me-3" style="width: 6px; height: 26px;"></div>
          <h4 class="mb-0">{{ dish.name }}</h4>
        </div>
        <div class="d-flex">
          <router-link :to="`/admin/${brandId}/dishes/template/edit/${dish._id}`" class="btn btn-primary me-2">
            <i class="bi bi-pencil me-1"></i>編輯餐點
          </router-link>
          <router-link :to="`/admin/${brandId}/dishes/template`" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 餐點詳情卡片 -->
      <div class="row">
        <!-- 左側基本資訊 -->
        <div class="col-md-5 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">基本資訊</h5>

              <div class="mb-3">
                <div class="rounded overflow-hidden" style="max-height: 300px;">
                  <img :src="dish.image?.url || '/placeholder.jpg'" class="img-fluid w-100 object-fit-cover"
                    :alt="dish.name">
                </div>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">餐點名稱</h6>
                <p>{{ dish.name }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">基本價格</h6>
                <p class="fs-4 text-primary">${{ formatPrice(dish.basePrice) }}</p>
              </div>

              <div class="mb-3" v-if="dish.description">
                <h6 class="text-muted mb-1">餐點描述</h6>
                <p>{{ dish.description }}</p>
              </div>

              <div class="mb-3" v-if="dish.tags && dish.tags.length > 0">
                <h6 class="text-muted mb-1">標籤</h6>
                <div class="d-flex flex-wrap">
                  <span v-for="tag in dish.tags" :key="tag" class="badge bg-info me-2 mb-2">
                    {{ tag }}
                  </span>
                </div>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">創建時間</h6>
                <p>{{ formatDate(dish.createdAt) }}</p>
              </div>

              <div class="mb-0">
                <h6 class="text-muted mb-1">最後更新</h6>
                <p>{{ formatDate(dish.updatedAt) }}</p>
              </div>
            </div>

            <div class="card-footer bg-transparent">
              <div class="d-flex justify-content-between">
                <!-- 刪除按鈕 -->
                <button type="button" class="btn btn-outline-danger" data-bs-toggle="modal"
                  data-bs-target="#deleteDishModal">
                  <i class="bi bi-trash me-1"></i>刪除餐點
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側詳細資訊 -->
        <div class="col-md-7">
          <!-- 選項類別卡片 -->
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title d-flex justify-content-between align-items-center mb-3">
                <span>選項類別</span>
                <router-link :to="`/admin/${brandId}/dishes/template/edit/${dish._id}`"
                  class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-pencil me-1"></i>編輯選項
                </router-link>
              </h5>

              <div v-if="!isLoadingOptions && dishOptions.length > 0">
                <div v-for="(optionGroup, index) in dishOptions" :key="index" class="option-category mb-4">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0 fw-bold">{{ optionGroup.category.name }}</h6>
                    <span class="badge" :class="optionGroup.category.inputType === 'single' ? 'bg-info' : 'bg-warning'">
                      {{ optionGroup.category.inputType === 'single' ? '單選' : '多選' }}
                    </span>
                  </div>

                  <div class="table-responsive">
                    <table class="table table-sm table-hover">
                      <thead class="table-light">
                        <tr>
                          <th>選項名稱</th>
                          <th>額外價格</th>
                          <th>關聯餐點</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="option in optionGroup.options" :key="option._id">
                          <td>{{ option.name }}</td>
                          <td>
                            <span v-if="option.price > 0" class="text-success">+${{ formatPrice(option.price) }}</span>
                            <span v-else>-</span>
                          </td>
                          <td>
                            <span v-if="option.refDishTemplate">{{ option.refDishTemplate.name }}</span>
                            <span v-else class="text-muted">-</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div v-else-if="!isLoadingOptions && dishOptions.length === 0" class="alert alert-light text-center py-3">
                <div class="text-muted">此餐點沒有任何選項類別</div>
                <router-link :to="`/admin/${brandId}/dishes/template/edit/${dish._id}`"
                  class="btn btn-sm btn-primary mt-2">
                  <i class="bi bi-plus-circle me-1"></i>添加選項類別
                </router-link>
              </div>

              <div v-else class="d-flex justify-content-center my-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                  <span class="visually-hidden">加載中...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 庫存狀態卡片 -->
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title mb-3">庫存狀態</h5>
              <p class="text-muted">此功能尚未開發完成</p>
              <button class="btn btn-sm btn-outline-primary" disabled>
                <i class="bi bi-box-seam me-1"></i>管理庫存
              </button>
            </div>
          </div>

          <!-- 關聯選項卡片 -->
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title mb-3">關聯選項</h5>
              <p class="text-muted">檢視哪些選項會引用此餐點</p>
              <button class="btn btn-sm btn-outline-primary" disabled>
                <i class="bi bi-link-45deg me-1"></i>查看關聯
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <div class="modal fade" id="deleteDishModal" tabindex="-1" aria-labelledby="deleteDishModalLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteDishModalLabel">確認刪除</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal-body" v-if="dish">
            <p>您確定要刪除餐點 <strong>{{ dish.name }}</strong> 嗎？</p>
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              此操作無法撤銷，餐點相關的所有資料都將被永久刪除。
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
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Modal } from 'bootstrap';
import api from '@/api';

// 路由
const router = useRouter();
const route = useRoute();

// 從路由中獲取品牌ID和餐點ID
const brandId = computed(() => route.params.brandId);
const dishId = computed(() => route.params.id);

// 狀態
const dish = ref(null);
const isLoading = ref(true);
const isLoadingOptions = ref(true);
const error = ref('');
const isDeleting = ref(false);
const dishOptions = ref([]);

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

// 獲取餐點資料
const fetchDishData = async () => {
  if (!dishId.value) return;

  isLoading.value = true;
  error.value = '';

  try {
    const response = await api.dish.getDishTemplateById(dishId.value, brandId.value);

    if (response && response.template) {
      dish.value = response.template;

      // 獲取選項類別資料
      fetchDishOptions();
    } else {
      error.value = '獲取餐點資料失敗';
    }
  } catch (err) {
    console.error('獲取餐點資料時發生錯誤:', err);
    error.value = '獲取餐點資料時發生錯誤，請稍後再試';
  } finally {
    isLoading.value = false;
  }
};

// 獲取餐點選項資料
const fetchDishOptions = async () => {
  if (!dishId.value) return;

  isLoadingOptions.value = true;

  try {
    const response = await api.dish.getTemplateOptions(dishId.value, brandId.value);

    if (response && response.options) {
      dishOptions.value = response.options;
    }
  } catch (err) {
    console.error('獲取餐點選項資料時發生錯誤:', err);
  } finally {
    isLoadingOptions.value = false;
  }
};

// 處理刪除確認
const handleDelete = async () => {
  if (!dish.value) return;

  isDeleting.value = true;

  try {
    await api.dish.deleteDishTemplate(dish.value._id, brandId.value);

    // 關閉模態對話框
    const modalElement = document.getElementById('deleteDishModal');
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

      // 返回餐點列表
      router.push(`/admin/${brandId.value}/dishes/template`);

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-dish-list'));
    }, 300);
  } catch (err) {
    console.error('刪除餐點失敗:', err);

    if (err.response && err.response.data && err.response.data.message) {
      alert(`刪除失敗: ${err.response.data.message}`);
    } else {
      alert('刪除餐點時發生錯誤');
    }
  } finally {
    isDeleting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 獲取餐點資料
  fetchDishData();
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
}

.table td,
.table th {
  vertical-align: middle;
}

/* 選項類別樣式 */
.option-category {
  background-color: #f8f9fa;
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.option-category:last-child {
  margin-bottom: 0;
}
</style>
