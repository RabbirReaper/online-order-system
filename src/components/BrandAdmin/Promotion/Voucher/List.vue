<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex">
        <div class="input-group" style="width: 300px;">
          <input type="text" class="form-control" placeholder="搜尋兌換券模板..." v-model="searchQuery" @input="handleSearch">
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>

        <div class="ms-2">
          <select class="form-select" v-model="filterStatus" @change="handleSearch">
            <option value="">所有狀態</option>
            <option value="active">啟用中</option>
            <option value="inactive">已停用</option>
          </select>
        </div>
      </div>

      <div class="d-flex">
        <button class="btn btn-success me-2" @click="autoCreateTemplates" :disabled="isAutoCreating">
          <span v-if="isAutoCreating" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-magic me-1"></i>
          {{ isAutoCreating ? '自動建立中...' : '自動建立兌換券' }}
        </button>
        <router-link :to="`/admin/${brandId}/vouchers/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>手動新增
        </router-link>
      </div>
    </div>

    <!-- 自動建立結果提示 -->
    <div class="alert alert-success alert-dismissible" v-if="autoCreateResult" @click="autoCreateResult = null">
      <i class="bi bi-check-circle-fill me-2"></i>
      <strong>自動建立完成！</strong>
      <div class="mt-2">
        <div>總餐點數量: {{ autoCreateResult.statistics?.totalDishes || 0 }}</div>
        <div>已有兌換券: {{ autoCreateResult.statistics?.existingCount || 0 }}</div>
        <div>新建立數量: {{ autoCreateResult.statistics?.createdCount || 0 }}</div>
      </div>
      <button type="button" class="btn-close" @click="autoCreateResult = null"></button>
    </div>

    <!-- 網路錯誤提示 -->
    <div class="alert alert-danger" v-if="errorMessage">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
    </div>

    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 兌換券模板列表 -->
    <div class="card" v-if="!isLoading">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th>模板名稱</th>
                <!-- <th>兌換餐點</th> -->
                <!-- <th>餐點價格</th> -->
                <th>有效期限</th>
                <th>已發行數量</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="template in filteredTemplates" :key="template._id">
                <td>
                  <strong>{{ template.name }}</strong>
                  <div class="small text-muted" v-if="template.description">
                    {{ template.description }}
                  </div>
                </td>
                <!-- <td>
                  <span v-if="template.exchangeDishTemplate">
                    ${{ formatPrice(template.exchangeDishTemplate.basePrice) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td> -->
                <td>{{ template.validityPeriod }} 天</td>
                <td>{{ template.totalIssued || 0 }}</td>
                <td>
                  <span class="badge" :class="template.isActive ? 'bg-success' : 'bg-secondary'">
                    {{ template.isActive ? '啟用' : '停用' }}
                  </span>
                </td>
                <td>
                  <div class="btn-group">
                    <router-link :to="`/admin/${brandId}/vouchers/detail/${template._id}`"
                      class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-eye me-1"></i>查看
                    </router-link>
                    <router-link :to="`/admin/${brandId}/vouchers/edit/${template._id}`"
                      class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-pencil me-1"></i>編輯
                    </router-link>
                    <button type="button" class="btn btn-sm"
                      :class="template.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                      @click="toggleStatus(template)">
                      <i class="bi bi-power me-1"></i>{{ template.isActive ? '停用' : '啟用' }}
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="confirmDelete(template)">
                      <i class="bi bi-trash me-1"></i>刪除
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredTemplates.length === 0 && !isLoading">
                <td colspan="7" class="text-center text-muted py-4">
                  <i class="bi bi-inbox display-4 d-block mb-2"></i>
                  {{ searchQuery ? '沒有符合條件的兌換券模板' : '尚未建立任何兌換券模板' }}
                  <div class="mt-3" v-if="!searchQuery && templates.length === 0">
                    <button class="btn btn-success" @click="autoCreateTemplates">
                      <i class="bi bi-magic me-1"></i>自動建立兌換券模板
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
            <p v-if="templateToToggle">
              您確定要{{ templateToToggle.isActive ? '停用' : '啟用' }}「{{ templateToToggle.name }}」嗎？
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="confirmToggleStatus">
              確認{{ templateToToggle?.isActive ? '停用' : '啟用' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>警告：</strong>此操作無法復原
            </div>
            <p v-if="templateToDelete">
              您確定要刪除兌換券模板「{{ templateToDelete.name }}」嗎？
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteTemplate" :disabled="isDeleting">
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { Modal } from 'bootstrap';
import api from '@/api';

// 路由
const route = useRoute();

// 從路由中獲取品牌ID
const brandId = computed(() => route.params.brandId);

// 狀態
const isLoading = ref(false);
const isDeleting = ref(false);
const isAutoCreating = ref(false);
const errorMessage = ref('');
const autoCreateResult = ref(null);

// 搜尋和篩選
const searchQuery = ref('');
const filterStatus = ref('');

// 兌換券模板列表
const templates = ref([]);

// 對話框控制
const deleteModal = ref(null);
const statusModal = ref(null);
const templateToDelete = ref(null);
const templateToToggle = ref(null);

// 格式化價格
const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0';
};

// 處理搜尋
const handleSearch = () => {
  // 搜尋和篩選邏輯在 computed 中處理
};

// 篩選後的兌換券模板列表
const filteredTemplates = computed(() => {
  let filtered = [...templates.value];

  // 搜尋過濾
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(query) ||
      (template.description && template.description.toLowerCase().includes(query)) ||
      (template.exchangeDishTemplate?.name && template.exchangeDishTemplate.name.toLowerCase().includes(query))
    );
  }

  // 狀態過濾
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active';
    filtered = filtered.filter(template => template.isActive === isActive);
  }

  return filtered;
});

// 自動建立兌換券模板
const autoCreateTemplates = async () => {
  if (!brandId.value) return;

  isAutoCreating.value = true;
  errorMessage.value = '';
  autoCreateResult.value = null;

  try {
    const response = await api.promotion.autoCreateVoucherTemplatesForDishes(brandId.value);
    if (response) {
      autoCreateResult.value = response;
      // 重新載入列表
      await fetchTemplates();
    }
  } catch (error) {
    console.error('自動建立兌換券模板失敗:', error);
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = '自動建立兌換券模板時發生錯誤，請稍後再試';
    }
  } finally {
    isAutoCreating.value = false;
  }
};

// 獲取兌換券模板列表
const fetchTemplates = async () => {
  if (!brandId.value) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.promotion.getAllVoucherTemplates(brandId.value);
    if (response && response.templates) {
      templates.value = response.templates;
    }
  } catch (error) {
    console.error('獲取兌換券模板列表失敗:', error);
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else if (error.message) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = '無法連接到伺服器，請檢查網路連線';
    }
  } finally {
    isLoading.value = false;
  }
};

// 顯示狀態切換確認對話框
const toggleStatus = (template) => {
  templateToToggle.value = template;
  statusModal.value.show();
};

// 確認切換狀態
const confirmToggleStatus = async () => {
  if (!templateToToggle.value) return;

  try {
    const newStatus = !templateToToggle.value.isActive;
    await api.promotion.updateVoucherTemplate({
      brandId: brandId.value,
      id: templateToToggle.value._id,
      data: { isActive: newStatus }
    });

    // 更新本地狀態
    templateToToggle.value.isActive = newStatus;

    // 關閉對話框
    statusModal.value.hide();
  } catch (error) {
    console.error('切換狀態失敗:', error);
    alert('切換狀態失敗，請稍後再試');
  }
};

// 顯示刪除確認對話框
const confirmDelete = (template) => {
  templateToDelete.value = template;
  deleteModal.value.show();
};

// 刪除兌換券模板
const deleteTemplate = async () => {
  if (!templateToDelete.value) return;

  isDeleting.value = true;

  try {
    await api.promotion.deleteVoucherTemplate({
      brandId: brandId.value,
      id: templateToDelete.value._id
    });

    // 關閉對話框
    deleteModal.value.hide();

    // 從列表中移除已刪除的模板
    templates.value = templates.value.filter(
      template => template._id !== templateToDelete.value._id
    );
  } catch (error) {
    console.error('刪除兌換券模板失敗:', error);
    alert('刪除兌換券模板時發生錯誤');
  } finally {
    isDeleting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 初始化刪除確認對話框
  const modalElement = document.getElementById('deleteConfirmModal');
  if (modalElement) {
    deleteModal.value = new Modal(modalElement);
    modalElement.addEventListener('hidden.bs.modal', () => {
      templateToDelete.value = null;
    });
  }

  // 初始化狀態切換對話框
  const statusModalElement = document.getElementById('statusToggleModal');
  if (statusModalElement) {
    statusModal.value = new Modal(statusModalElement);
    statusModalElement.addEventListener('hidden.bs.modal', () => {
      templateToToggle.value = null;
    });
  }

  // 載入兌換券模板列表
  fetchTemplates();

  // 設置刷新列表的事件監聽器
  window.addEventListener('refresh-voucher-list', fetchTemplates);
});

onUnmounted(() => {
  // 移除事件監聽器
  window.removeEventListener('refresh-voucher-list', fetchTemplates);
});
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}

.badge {
  font-weight: 500;
  font-size: 0.85rem;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}

.alert-dismissible {
  cursor: pointer;
}
</style>
