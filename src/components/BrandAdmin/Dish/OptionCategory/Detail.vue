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

    <div v-if="category && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ category.name }}</h4>
        <div class="d-flex">
          <router-link :to="`/admin/${brandId}/option-categories/edit/${category._id}`" class="btn btn-primary me-2">
            <i class="bi bi-pencil me-1"></i>編輯類別
          </router-link>
          <router-link :to="`/admin/${brandId}/option-categories`" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 類別詳情卡片 -->
      <div class="row">
        <!-- 左側基本資訊 -->
        <div class="col-md-4 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">基本資訊</h5>

              <div class="mb-3">
                <h6 class="text-muted mb-1">類別名稱</h6>
                <p>{{ category.name }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">輸入類型</h6>
                <p>
                  <span class="badge" :class="category.inputType === 'single' ? 'bg-info' : 'bg-warning'">
                    {{ category.inputType === 'single' ? '單選' : '多選' }}
                  </span>
                </p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">選項數量</h6>
                <p>{{ category.options ? category.options.length : 0 }} 個選項</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">創建時間</h6>
                <p>{{ formatDate(category.createdAt) }}</p>
              </div>

              <div class="mb-0">
                <h6 class="text-muted mb-1">最後更新</h6>
                <p>{{ formatDate(category.updatedAt) }}</p>
              </div>
            </div>

            <div class="card-footer bg-transparent">
              <div class="d-flex justify-content-between">
                <!-- 刪除按鈕 -->
                <button type="button" class="btn btn-outline-danger" data-bs-toggle="modal"
                  data-bs-target="#deleteCategoryModal">
                  <i class="bi bi-trash me-1"></i>刪除類別
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側選項列表 -->
        <div class="col-md-8">
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title d-flex justify-content-between align-items-center mb-3">
                <span>選項列表</span>
                <div>
                  <router-link :to="`/admin/${brandId}/option-categories/edit/${category._id}`"
                    class="btn btn-sm btn-outline-primary me-1">
                    <i class="bi bi-pencil me-1"></i>管理選項
                  </router-link>
                  <router-link :to="`/admin/${brandId}/options/create`" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-plus-lg me-1"></i>新增選項
                  </router-link>
                </div>
              </h5>

              <div v-if="!isLoadingOptions && optionDetails.length > 0">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead class="table-light">
                      <tr>
                        <th>排序</th>
                        <th>選項名稱</th>
                        <th>價格</th>
                        <th>關聯餐點</th>
                        <th>標籤</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(option, index) in optionDetails" :key="option._id">
                        <td>{{ index + 1 }}</td>
                        <td>{{ option.name }}</td>
                        <td>
                          <span v-if="option.price > 0" class="text-success">+${{ formatPrice(option.price) }}</span>
                          <span v-else>免費</span>
                        </td>
                        <td>
                          <span v-if="option.refDishTemplate">{{ option.refDishTemplate.name }}</span>
                          <span v-else class="text-muted">無</span>
                        </td>
                        <td>
                          <div class="d-flex flex-wrap gap-1">
                            <span v-for="(tag, tagIndex) in option.tags" :key="tagIndex" class="badge bg-info">
                              {{ tag }}
                            </span>
                            <span v-if="!option.tags || option.tags.length === 0" class="text-muted">無標籤</span>
                          </div>
                        </td>
                        <td>
                          <div class="btn-group">
                            <router-link :to="`/admin/${brandId}/options/edit/${option._id}`"
                              class="btn btn-sm btn-outline-primary">
                              <i class="bi bi-pencil me-1"></i>編輯
                            </router-link>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div v-else-if="!isLoadingOptions && optionDetails.length === 0"
                class="alert alert-light text-center py-3">
                <div class="text-muted">此類別下沒有任何選項</div>
                <router-link :to="`/admin/${brandId}/option-categories/edit/${category._id}`"
                  class="btn btn-sm btn-primary mt-2">
                  <i class="bi bi-plus-circle me-1"></i>添加選項
                </router-link>
              </div>

              <div v-else class="d-flex justify-content-center my-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                  <span class="visually-hidden">加載中...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 選項標籤分析 -->
          <div class="card mb-4" v-if="optionDetails.length > 0">
            <div class="card-body">
              <h5 class="card-title mb-3">標籤分析</h5>

              <div v-if="optionTags.length > 0">
                <div class="d-flex flex-wrap gap-2 mb-3">
                  <div v-for="tag in optionTags" :key="tag.name" class="badge bg-info p-2" style="font-size: 1rem;">
                    {{ tag.name }}
                    <span class="badge bg-light text-dark ms-1">{{ tag.count }}</span>
                  </div>
                </div>
                <p class="small text-muted mb-0">此類別中的選項共使用了 {{ optionTags.length }} 個不同的標籤</p>
              </div>

              <div v-else class="alert alert-light text-center">
                <div class="text-muted">此類別中的選項沒有使用任何標籤</div>
                <p class="small mt-2 mb-0">
                  標籤可幫助您組織和篩選選項，請前往選項編輯頁面添加標籤
                </p>
              </div>
            </div>
          </div>

          <!-- 使用此類別的餐點 -->
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title mb-3">使用此類別的餐點</h5>
              <p class="text-muted">列出使用此選項類別的所有餐點模板</p>
              <button class="btn btn-sm btn-outline-primary" disabled>
                <i class="bi bi-link-45deg me-1"></i>查看關聯餐點
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <div class="modal fade" id="deleteCategoryModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal-body" v-if="category">
            <p>您確定要刪除選項類別 <strong>{{ category.name }}</strong> 嗎？</p>
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              此操作無法撤銷，選項類別相關的所有資料都將被永久刪除。
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

// 從路由中獲取品牌ID和類別ID
const brandId = computed(() => route.params.brandId);
const categoryId = computed(() => route.params.id);

// 狀態
const category = ref(null);
const isLoading = ref(true);
const isLoadingOptions = ref(true);
const error = ref('');
const isDeleting = ref(false);
const optionDetails = ref([]);

// 計算選項的標籤統計
const optionTags = computed(() => {
  const tagCounts = {};

  optionDetails.value.forEach(option => {
    if (option.tags && Array.isArray(option.tags)) {
      option.tags.forEach(tag => {
        if (tagCounts[tag]) {
          tagCounts[tag]++;
        } else {
          tagCounts[tag] = 1;
        }
      });
    }
  });

  // 轉換為數組並排序
  const tagArray = Object.keys(tagCounts).map(name => ({
    name,
    count: tagCounts[name]
  }));

  return tagArray.sort((a, b) => b.count - a.count);
});

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

// 獲取類別資料
const fetchCategoryData = async () => {
  if (!categoryId.value) return;

  isLoading.value = true;
  error.value = '';

  try {
    const response = await api.dish.getOptionCategoryById({ id: categoryId.value, brandId: brandId.value, includeOptions: true });

    if (response && response.category) {
      category.value = response.category;

      // 獲取選項詳情
      fetchOptionDetails();
    } else {
      error.value = '獲取選項類別資料失敗';
    }
  } catch (err) {
    console.error('獲取選項類別資料時發生錯誤:', err);
    error.value = '獲取選項類別資料時發生錯誤，請稍後再試';
  } finally {
    isLoading.value = false;
  }
};

// 修正 fetchOptionDetails 函數
const fetchOptionDetails = async () => {
  if (!category.value || !category.value.options || category.value.options.length === 0) {
    isLoadingOptions.value = false;
    return;
  }

  isLoadingOptions.value = true;

  try {
    // 獲取選項IDs - 修正這裡，確保 ID 是字串
    const optionIds = category.value.options.map(opt => {
      // 檢查 refOption 的類型，確保返回字串 ID
      if (typeof opt.refOption === 'object' && opt.refOption !== null) {
        return opt.refOption._id; // 如果是物件，取其 _id 屬性
      }
      return opt.refOption; // 如果已經是字串則直接返回
    });

    // 過濾掉無效的 ID
    const validOptionIds = optionIds.filter(id => id && typeof id === 'string');

    // 單個獲取每個選項詳情
    const promises = validOptionIds.map(id => api.dish.getOptionById({ id: id, brandId: brandId.value }));
    const responses = await Promise.all(promises);

    // 整理選項詳情
    const details = [];
    for (const response of responses) {
      if (response && response.option) {
        details.push(response.option);
      }
    }

    // 按照類別中的順序排序 - 也需要修正比較邏輯
    details.sort((a, b) => {
      const aId = a._id.toString();
      const bId = b._id.toString();

      const aIndex = category.value.options.findIndex(opt => {
        const optId = typeof opt.refOption === 'object' ? opt.refOption._id : opt.refOption;
        return optId && optId.toString() === aId;
      });

      const bIndex = category.value.options.findIndex(opt => {
        const optId = typeof opt.refOption === 'object' ? opt.refOption._id : opt.refOption;
        return optId && optId.toString() === bId;
      });

      return aIndex - bIndex;
    });

    optionDetails.value = details;
  } catch (err) {
    console.error('獲取選項詳情時發生錯誤:', err);
  } finally {
    isLoadingOptions.value = false;
  }
};

// 處理刪除確認
const handleDelete = async () => {
  if (!category.value) return;

  isDeleting.value = true;

  try {
    await api.dish.deleteOptionCategory({
      brandId: brandId.value,
      id: category.value._id
    });

    // 關閉模態對話框
    const modalElement = document.getElementById('deleteCategoryModal');
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

      // 返回選項類別列表
      router.push(`/admin/${brandId.value}/option-categories`);

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-category-list'));
    }, 300);
  } catch (err) {
    console.error('刪除選項類別失敗:', err);

    if (err.response && err.response.data && err.response.data.message) {
      alert(`刪除失敗: ${err.response.data.message}`);
    } else {
      alert('刪除選項類別時發生錯誤');
    }
  } finally {
    isDeleting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 獲取選項類別資料
  fetchCategoryData();
});
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-title {
  font-weight: 600;
}

.table th,
.table td {
  vertical-align: middle;
}

.badge {
  font-weight: 500;
  font-size: 0.85rem;
}
</style>
