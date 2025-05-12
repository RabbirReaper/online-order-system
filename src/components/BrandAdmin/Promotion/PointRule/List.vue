<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex">
        <div class="input-group" style="width: 300px;">
          <input type="text" class="form-control" placeholder="搜尋點數規則..." v-model="searchQuery" @input="handleSearch">
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>

        <div class="ms-2">
          <select class="form-select" v-model="filterType" @change="handleSearch">
            <option value="">所有類型</option>
            <option value="purchase_amount">消費金額</option>
            <option value="first_purchase">首次購買</option>
            <option value="recurring_visit">重複訪問</option>
          </select>
        </div>

        <div class="ms-2">
          <select class="form-select" v-model="filterStatus" @change="handleSearch">
            <option value="">所有狀態</option>
            <option value="active">啟用中</option>
            <option value="inactive">已停用</option>
          </select>
        </div>
      </div>

      <div>
        <router-link :to="`/admin/${brandId}/point-rules/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增點數規則
        </router-link>
      </div>
    </div>

    <!-- 網路錯誤提示 -->
    <div class="alert alert-danger" v-if="errorMessage">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
    </div>

    <!-- 點數規則列表 -->
    <div class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th>規則名稱</th>
                <th>類型</th>
                <th>轉換率</th>
                <th>最低消費</th>
                <th>描述</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rule in filteredRules" :key="rule._id">
                <td>{{ rule.name }}</td>
                <td>
                  <span class="badge bg-info">
                    {{ getRuleTypeLabel(rule.type) }}
                  </span>
                </td>
                <td>
                  <template v-if="rule.type === 'purchase_amount'">
                    每消費 ${{ formatPrice(rule.conversionRate) }} = 1 點
                  </template>
                  <template v-else>
                    {{ rule.conversionRate }} 點
                  </template>
                </td>
                <td>${{ formatPrice(rule.minimumAmount || 0) }}</td>
                <td>
                  <span v-if="rule.description" class="text-truncate d-inline-block" style="max-width: 200px;"
                    :title="rule.description">
                    {{ rule.description }}
                  </span>
                  <span v-else class="text-muted">無描述</span>
                </td>
                <td>
                  <span class="badge" :class="rule.isActive ? 'bg-success' : 'bg-secondary'">
                    {{ rule.isActive ? '啟用' : '停用' }}
                  </span>
                </td>
                <td>
                  <div class="btn-group">
                    <router-link :to="`/admin/${brandId}/point-rules/edit/${rule._id}`"
                      class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-pencil me-1"></i>編輯
                    </router-link>
                    <button type="button" class="btn btn-sm"
                      :class="rule.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                      @click="toggleStatus(rule)">
                      <i class="bi bi-power me-1"></i>{{ rule.isActive ? '停用' : '啟用' }}
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="confirmDelete(rule)">
                      <i class="bi bi-trash me-1"></i>刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 無資料提示 -->
    <div class="alert alert-info text-center py-4" v-if="rules.length === 0 && !isLoading">
      <i class="bi bi-info-circle me-2 fs-4"></i>
      <p class="mb-0">{{ searchQuery || filterType || filterStatus ? '沒有符合搜尋條件的點數規則' : '尚未創建任何點數規則' }}</p>
      <div class="mt-3" v-if="!searchQuery && !filterType && !filterStatus">
        <router-link :to="`/admin/${brandId}/point-rules/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增第一個點數規則
        </router-link>
      </div>
    </div>

    <!-- 加載中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 確認刪除對話框 -->
    <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="ruleToDelete">
            <p>確定要刪除點數規則 <strong>{{ ruleToDelete.name }}</strong> 嗎？</p>
            <div class="alert alert-danger mt-3">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              此操作無法撤銷！刪除後將無法復原。
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteRule" :disabled="isDeleting">
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              {{ isDeleting ? '刪除中...' : '確認刪除' }}
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
          <div class="modal-body" v-if="ruleToToggle">
            <p>
              確定要將「<strong>{{ ruleToToggle.name }}</strong>」
              {{ ruleToToggle.isActive ? '停用' : '啟用' }}嗎？
            </p>

            <div v-if="ruleToToggle.isActive" class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>停用注意事項：</strong>
              <ul class="mb-0 mt-2">
                <li>停用後將不再累積點數</li>
                <li>已累積的點數不受影響</li>
                <li>可隨時重新啟用</li>
              </ul>
            </div>

            <div v-else class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              <strong>啟用注意事項：</strong>
              <ul class="mb-0 mt-2">
                <li>啟用後將開始累積點數</li>
                <li>請確認規則設定正確</li>
                <li>同類型規則只會執行最新啟用的</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn"
              :class="ruleToToggle && ruleToToggle.isActive ? 'btn-warning' : 'btn-success'"
              @click="confirmToggleStatus">
              確認{{ ruleToToggle && ruleToToggle.isActive ? '停用' : '啟用' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Modal } from 'bootstrap';
import api from '@/api';

// 從路由中獲取品牌ID
const route = useRoute();
const brandId = computed(() => route.params.brandId);

// 狀態變數
const rules = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const filterType = ref('');
const filterStatus = ref('');
const errorMessage = ref('');
const deleteModal = ref(null);
const ruleToDelete = ref(null);
const isDeleting = ref(false);
const statusModal = ref(null);
const ruleToToggle = ref(null);

// 類型標籤對應
const getRuleTypeLabel = (type) => {
  const labels = {
    'purchase_amount': '消費金額',
    'first_purchase': '首次購買',
    'recurring_visit': '重複訪問'
  };
  return labels[type] || type;
};

// 計算過濾後的規則列表
const filteredRules = computed(() => {
  let filtered = rules.value;

  // 搜尋過濾
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(rule =>
      rule.name.toLowerCase().includes(query) ||
      (rule.description && rule.description.toLowerCase().includes(query))
    );
  }

  // 類型過濾
  if (filterType.value) {
    filtered = filtered.filter(rule => rule.type === filterType.value);
  }

  // 狀態過濾
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active';
    filtered = filtered.filter(rule => rule.isActive === isActive);
  }

  return filtered;
});

// 格式化價格
const formatPrice = (price) => {
  return price.toLocaleString('zh-TW');
};

// 處理搜尋
const handleSearch = () => {
  // 實時過濾，無需額外操作
};

// 獲取點數規則列表
const fetchRules = async () => {
  if (!brandId.value) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.pointRules.getAllPointRules(brandId.value);
    if (response && response.rules) {
      rules.value = response.rules;
    }
  } catch (error) {
    console.error('獲取點數規則列表失敗:', error);
    // 嘗試獲取更有意義的錯誤訊息
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
const toggleStatus = (rule) => {
  ruleToToggle.value = rule;
  statusModal.value.show();
};

// 確認切換狀態
const confirmToggleStatus = async () => {
  if (!ruleToToggle.value) return;

  try {
    const newStatus = !ruleToToggle.value.isActive;
    await api.pointRules.togglePointRuleActive({
      id: ruleToToggle.value._id,
      isActive: newStatus,
      brandId: brandId.value
    });

    // 更新本地狀態
    ruleToToggle.value.isActive = newStatus;

    // 關閉對話框
    statusModal.value.hide();
  } catch (error) {
    console.error('切換狀態失敗:', error);
    alert('切換狀態失敗，請稍後再試');
  }
};

// 顯示刪除確認對話框
const confirmDelete = (rule) => {
  ruleToDelete.value = rule;
  deleteModal.value.show();
};

// 刪除點數規則
const deleteRule = async () => {
  if (!ruleToDelete.value) return;

  isDeleting.value = true;

  try {
    await api.pointRules.deletePointRule({
      id: ruleToDelete.value._id,
      brandId: brandId.value
    });

    // 關閉對話框
    deleteModal.value.hide();

    // 從列表中移除已刪除的規則
    rules.value = rules.value.filter(
      rule => rule._id !== ruleToDelete.value._id
    );
  } catch (error) {
    console.error('刪除點數規則失敗:', error);
    alert('刪除點數規則時發生錯誤');
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

    // 監聽對話框關閉事件
    modalElement.addEventListener('hidden.bs.modal', () => {
      ruleToDelete.value = null;
    });
  }

  // 初始化狀態切換對話框
  const statusModalElement = document.getElementById('statusToggleModal');
  if (statusModalElement) {
    statusModal.value = new Modal(statusModalElement);

    // 監聽對話框關閉事件
    statusModalElement.addEventListener('hidden.bs.modal', () => {
      ruleToToggle.value = null;
    });
  }

  // 載入點數規則列表
  fetchRules();
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

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
