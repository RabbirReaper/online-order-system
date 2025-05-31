<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex">
        <div class="input-group" style="width: 300px;">
          <input type="text" class="form-control" placeholder="搜尋管理員..." v-model="searchQuery" @input="handleSearch">
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>

        <div class="ms-2">
          <select class="form-select" v-model="filterRole" @change="handleFilter">
            <option value="">所有角色</option>
            <option value="primary_system_admin">系統主管理員</option>
            <option value="system_admin">系統管理員</option>
            <option value="primary_brand_admin">品牌主管理員</option>
            <option value="brand_admin">品牌管理員</option>
            <option value="primary_store_admin">店鋪主管理員</option>
            <option value="store_admin">店鋪管理員</option>
            <option value="employee">員工</option>
          </select>
        </div>

        <div class="ms-2">
          <select class="form-select" v-model="filterStatus" @change="handleFilter">
            <option value="">所有狀態</option>
            <option value="active">啟用中</option>
            <option value="inactive">已停用</option>
          </select>
        </div>

        <div class="ms-2">
          <select class="form-select" v-model="filterScope" @change="handleFilter">
            <option value="">所有範圍</option>
            <option value="system">系統級</option>
            <option value="brand">品牌級</option>
            <option value="store">店鋪級</option>
          </select>
        </div>
      </div>

      <div>
        <router-link :to="{ name: 'boss-admin-create' }" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增管理員
        </router-link>
      </div>
    </div>

    <!-- 網路錯誤提示 -->
    <div class="alert alert-danger" v-if="errorMessage">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
    </div>

    <!-- 管理員列表 -->
    <div class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th>用戶名</th>
                <th>角色</th>
                <th>權限範圍</th>
                <th>所屬品牌</th>
                <th>所屬店鋪</th>
                <th>最後登入</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="admin in filteredAdmins" :key="admin._id">
                <td>
                  <div class="d-flex align-items-center">
                    <div>
                      <div class="fw-bold">{{ admin.name }}</div>
                      <small class="text-muted" v-if="admin.createdBy">
                        由 {{ admin.createdBy.name }} 創建
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <span class="badge" :class="getRoleBadgeClass(admin.role)">
                      {{ getRoleLabel(admin.role) }}
                    </span>
                    <div v-if="admin.role.startsWith('primary_')" class="small text-primary mt-1">
                      <i class="bi bi-star-fill me-1"></i>主管理員
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge" :class="getScopeBadgeClass(getRoleScope(admin.role))">
                    {{ getRoleScopeLabel(getRoleScope(admin.role)) }}
                  </span>
                </td>
                <td>
                  <span v-if="admin.brand">
                    {{ admin.brand.name }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <span v-if="admin.store">
                    {{ admin.store.name }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <span v-if="admin.lastLogin">
                    {{ formatDate(admin.lastLogin) }}
                  </span>
                  <span v-else class="text-muted">從未登入</span>
                </td>
                <td>
                  <span class="badge" :class="admin.isActive ? 'bg-success' : 'bg-secondary'">
                    {{ admin.isActive ? '啟用' : '停用' }}
                  </span>
                </td>
                <td>
                  <div class="btn-group">
                    <router-link :to="{ name: 'boss-admin-edit', params: { id: admin._id } }"
                      class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-pencil me-1"></i>編輯
                    </router-link>
                    <button type="button" class="btn btn-sm"
                      :class="admin.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                      @click="toggleStatus(admin)">
                      <i class="bi bi-power me-1"></i>{{ admin.isActive ? '停用' : '啟用' }}
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="confirmDelete(admin)"
                      v-if="canDeleteAdmin(admin)">
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
    <div class="alert alert-info text-center py-4" v-if="admins.length === 0 && !isLoading">
      <i class="bi bi-info-circle me-2 fs-4"></i>
      <p class="mb-0">{{ searchQuery || filterRole || filterStatus ? '沒有符合搜尋條件的管理員' : '尚未創建任何管理員' }}</p>
      <div class="mt-3" v-if="!searchQuery && !filterRole && !filterStatus">
        <router-link :to="{ name: 'boss-admin-create' }" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增第一個管理員
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
          <div class="modal-body" v-if="adminToDelete">
            <p>確定要刪除管理員 <strong>{{ adminToDelete.name }}</strong> 嗎？</p>
            <div class="alert alert-warning mt-3">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>角色：</strong>{{ getRoleLabel(adminToDelete.role) }}<br>
              <strong>權限範圍：</strong>{{ getRoleScopeLabel(getRoleScope(adminToDelete.role)) }}
            </div>
            <div class="alert alert-danger mt-3">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              此操作無法撤銷！刪除後將無法復原。
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteAdmin" :disabled="isDeleting">
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
          <div class="modal-body" v-if="adminToToggle">
            <p>
              確定要將「<strong>{{ adminToToggle.name }}</strong>」
              ({{ getRoleLabel(adminToToggle.role) }})
              {{ adminToToggle.isActive ? '停用' : '啟用' }}嗎？
            </p>

            <div v-if="adminToToggle.isActive" class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>停用注意事項：</strong>
              <ul class="mb-0 mt-2">
                <li>該管理員將無法登入系統</li>
                <li>所有權限將被暫時凍結</li>
                <li>可隨時重新啟用</li>
              </ul>
            </div>

            <div v-else class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              <strong>啟用注意事項：</strong>
              <ul class="mb-0 mt-2">
                <li>該管理員將可以登入系統</li>
                <li>權限將恢復正常</li>
                <li>請確認權限設定正確</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn"
              :class="adminToToggle && adminToToggle.isActive ? 'btn-warning' : 'btn-success'"
              @click="confirmToggleStatus">
              確認{{ adminToToggle && adminToToggle.isActive ? '停用' : '啟用' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Modal } from 'bootstrap';
import api from '@/api';

// 狀態變數
const admins = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const filterRole = ref('');
const filterStatus = ref('');
const filterScope = ref('system'); // 預設顯示系統級管理員
const errorMessage = ref('');
const deleteModal = ref(null);
const adminToDelete = ref(null);
const isDeleting = ref(false);
const statusModal = ref(null);
const adminToToggle = ref(null);

// 角色定義
const roleDefinitions = {
  'primary_system_admin': { label: '系統主管理員', scope: 'system' },
  'system_admin': { label: '系統管理員', scope: 'system' },
  'primary_brand_admin': { label: '品牌主管理員', scope: 'brand' },
  'brand_admin': { label: '品牌管理員', scope: 'brand' },
  'primary_store_admin': { label: '店鋪主管理員', scope: 'store' },
  'store_admin': { label: '店鋪管理員', scope: 'store' },
  'employee': { label: '員工', scope: 'store' }
};

// 角色標籤對應
const getRoleLabel = (role) => {
  return roleDefinitions[role]?.label || role;
};

// 獲取角色權限範圍
const getRoleScope = (role) => {
  return roleDefinitions[role]?.scope || '';
};

// 權限範圍標籤
const getRoleScopeLabel = (scope) => {
  const labels = {
    'system': '系統級',
    'brand': '品牌級',
    'store': '店鋪級'
  };
  return labels[scope] || scope;
};

// 角色徽章樣式
const getRoleBadgeClass = (role) => {
  const classes = {
    'primary_system_admin': 'bg-danger',
    'system_admin': 'bg-warning text-dark',
    'primary_brand_admin': 'bg-primary',
    'brand_admin': 'bg-info',
    'primary_store_admin': 'bg-success',
    'store_admin': 'bg-secondary',
    'employee': 'bg-light text-dark'
  };
  return classes[role] || 'bg-secondary';
};

// 權限範圍徽章樣式
const getScopeBadgeClass = (scope) => {
  const classes = {
    'system': 'bg-danger',
    'brand': 'bg-primary',
    'store': 'bg-success'
  };
  return classes[scope] || 'bg-secondary';
};

// 計算過濾後的管理員列表
const filteredAdmins = computed(() => {
  let filtered = admins.value;

  // 搜尋過濾
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(admin =>
      admin.name.toLowerCase().includes(query) ||
      getRoleLabel(admin.role).toLowerCase().includes(query) ||
      (admin.brand?.name && admin.brand.name.toLowerCase().includes(query)) ||
      (admin.store?.name && admin.store.name.toLowerCase().includes(query))
    );
  }

  // 角色過濾
  if (filterRole.value) {
    filtered = filtered.filter(admin => admin.role === filterRole.value);
  }

  // 狀態過濾
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active';
    filtered = filtered.filter(admin => admin.isActive === isActive);
  }

  // 權限範圍過濾
  if (filterScope.value) {
    filtered = filtered.filter(admin => getRoleScope(admin.role) === filterScope.value);
  }

  return filtered;
});

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無資料';

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    }) + ' 今天';
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
};

// 檢查是否可以刪除管理員
const canDeleteAdmin = (admin) => {
  // 不能刪除最後一個系統主管理員
  if (admin.role === 'primary_system_admin') {
    const primarySystemAdmins = admins.value.filter(a => a.role === 'primary_system_admin');
    return primarySystemAdmins.length > 1;
  }
  return true;
};

// 處理搜尋
const handleSearch = () => {
  // 實時過濾，無需額外操作
};

// 處理過濾
const handleFilter = () => {
  // 實時過濾，無需額外操作
};

// 獲取管理員列表
const fetchAdmins = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Boss 頁面查詢所有管理員，不指定brandId
    const response = await api.admin.getAllAdmins({});
    if (response && response.admins) {
      admins.value = response.admins;
    }
  } catch (error) {
    console.error('獲取管理員列表失敗:', error);
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
const toggleStatus = (admin) => {
  adminToToggle.value = admin;
  statusModal.value.show();
};

// 確認切換狀態
const confirmToggleStatus = async () => {
  if (!adminToToggle.value) return;

  try {
    const newStatus = !adminToToggle.value.isActive;

    // 檢查是否為最後一個系統主管理員
    if (adminToToggle.value.role === 'primary_system_admin' && !newStatus) {
      const activePrimaryAdmins = admins.value.filter(a =>
        a.role === 'primary_system_admin' && a.isActive && a._id !== adminToToggle.value._id
      );
      if (activePrimaryAdmins.length === 0) {
        alert('無法停用最後一個系統主管理員');
        statusModal.value.hide();
        return;
      }
    }

    await api.admin.toggleAdminStatus({
      id: adminToToggle.value._id,
      isActive: newStatus
    });

    // 更新本地狀態
    adminToToggle.value.isActive = newStatus;

    // 關閉對話框
    statusModal.value.hide();
  } catch (error) {
    console.error('切換狀態失敗:', error);
    const errorMsg = error.response?.data?.message || '切換狀態失敗，請稍後再試';
    alert(errorMsg);
  }
};

// 顯示刪除確認對話框
const confirmDelete = (admin) => {
  adminToDelete.value = admin;
  deleteModal.value.show();
};

// 刪除管理員
const deleteAdmin = async () => {
  if (!adminToDelete.value) return;

  isDeleting.value = true;

  try {
    await api.admin.deleteAdmin(adminToDelete.value._id);

    // 關閉對話框
    deleteModal.value.hide();

    // 從列表中移除已刪除的管理員
    admins.value = admins.value.filter(
      admin => admin._id !== adminToDelete.value._id
    );
  } catch (error) {
    console.error('刪除管理員失敗:', error);
    const errorMsg = error.response?.data?.message || '刪除管理員時發生錯誤';
    alert(errorMsg);
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
      adminToDelete.value = null;
    });
  }

  // 初始化狀態切換對話框
  const statusModalElement = document.getElementById('statusToggleModal');
  if (statusModalElement) {
    statusModal.value = new Modal(statusModalElement);

    // 監聽對話框關閉事件
    statusModalElement.addEventListener('hidden.bs.modal', () => {
      adminToToggle.value = null;
    });
  }

  // 載入資料
  fetchAdmins();
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

.fw-bold {
  font-weight: 600;
}

.alert.py-2 {
  padding-top: 0.5rem !important;
  padding-bottom: 0.5rem !important;
}

.btn-link.btn-sm {
  font-size: 0.875rem;
  text-decoration: none;
}

.btn-link.btn-sm:hover {
  text-decoration: underline;
}
</style>
