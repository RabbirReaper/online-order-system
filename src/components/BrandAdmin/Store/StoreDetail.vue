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

    <div v-if="store && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ store.name }}
          <span class="badge rounded-pill ms-2" :class="store.isActive ? 'bg-success' : 'bg-secondary'">
            {{ store.isActive ? '啟用中' : '已停用' }}
          </span>
        </h4>
        <div class="d-flex">
          <router-link :to="`/admin/${brandId}/stores/edit/${store._id}`" class="btn btn-primary me-2">
            <i class="bi bi-pencil me-1"></i>編輯店鋪
          </router-link>
          <router-link :to="`/admin/${brandId}/stores`" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 店鋪詳情卡片 -->
      <div class="row">
        <!-- 左側基本資訊 -->
        <div class="col-md-5 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">基本資訊</h5>

              <div class="mb-3">
                <div class="rounded overflow-hidden" style="max-height: 300px;">
                  <img :src="store.image?.url || '/placeholder.jpg'" class="img-fluid w-100 object-fit-cover"
                    :alt="store.name">
                </div>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">店鋪名稱</h6>
                <p>{{ store.name }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">創建時間</h6>
                <p>{{ formatDate(store.createdAt) }}</p>
              </div>

              <div class="mb-0">
                <h6 class="text-muted mb-1">最後更新</h6>
                <p>{{ formatDate(store.updatedAt) }}</p>
              </div>
            </div>

            <div class="card-footer bg-transparent">
              <div class="d-flex justify-content-between">
                <button class="btn btn-sm" :class="store.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                  @click="toggleStoreActive">
                  <i class="bi" :class="store.isActive ? 'bi-pause-fill me-1' : 'bi-play-fill me-1'"></i>
                  {{ store.isActive ? '停用店鋪' : '啟用店鋪' }}
                </button>

                <!-- 刪除按鈕 -->
                <button type="button" class="btn btn-outline-danger btn-sm" @click="showDeleteModal = true">
                  <i class="bi bi-trash me-1"></i>刪除店鋪
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側詳細資訊 -->
        <div class="col-md-7">
          <!-- 營業時間卡片 -->
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title d-flex justify-content-between align-items-center mb-3">
                <span>營業時間</span>
                <button class="btn btn-sm btn-outline-primary" @click="showBusinessHoursModal = true">
                  <i class="bi bi-pencil me-1"></i>快速編輯
                </button>
              </h5>

              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>星期</th>
                      <th>營業時間</th>
                      <th>狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="day in sortedBusinessHours" :key="day.day">
                      <td>{{ getDayName(day.day) }}</td>
                      <td>
                        <span v-if="!day.isClosed">
                          <template v-for="(period, index) in day.periods" :key="index">
                            {{ period.open }} - {{ period.close }}
                            <br v-if="index < day.periods.length - 1">
                          </template>
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td>
                        <span class="badge" :class="day.isClosed ? 'bg-secondary' : 'bg-success'">
                          {{ day.isClosed ? '公休' : '營業' }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="!store.businessHours || store.businessHours.length === 0">
                      <td colspan="3" class="text-center py-3">尚未設置營業時間</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 店鋪公告卡片 -->
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title d-flex justify-content-between align-items-center mb-3">
                <span>店鋪公告</span>
                <button class="btn btn-sm btn-outline-primary" @click="showAnnouncementsModal = true">
                  <i class="bi bi-pencil me-1"></i>快速編輯
                </button>
              </h5>

              <div v-if="store.announcements && store.announcements.length > 0">
                <div v-for="(announcement, index) in store.announcements" :key="index"
                  class="announcement-item mb-3 p-3 border rounded">
                  <h6 class="announcement-title mb-2">{{ announcement.title }}</h6>
                  <p class="announcement-content mb-0">{{ announcement.content }}</p>
                </div>
              </div>

              <div v-else class="alert alert-light text-center py-3">
                <div class="text-muted">尚未設置店鋪公告</div>
              </div>
            </div>
          </div>

          <!-- 更多功能卡片 -->
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">快速操作</h5>

              <div class="row g-3">
                <div class="col-md-6">
                  <router-link :to="`/admin/${brandId}/menus?storeId=${store._id}`" class="card action-card h-100">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center p-3">
                      <i class="bi bi-menu-button-wide action-icon mb-2"></i>
                      <h6 class="mb-1">管理菜單</h6>
                      <p class="small text-muted text-center mb-0">
                        {{ store.menuId ? '編輯現有菜單' : '建立店鋪菜單' }}
                      </p>
                    </div>
                  </router-link>
                </div>

                <div class="col-md-6">
                  <router-link :to="`/admin/${brandId}/inventory?storeId=${store._id}`" class="card action-card h-100">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center p-3">
                      <i class="bi bi-box-seam action-icon mb-2"></i>
                      <h6 class="mb-1">庫存管理</h6>
                      <p class="small text-muted text-center mb-0">
                        管理店鋪餐點庫存
                      </p>
                    </div>
                  </router-link>
                </div>

                <div class="col-md-6">
                  <router-link :to="`/admin/${brandId}/orders?storeId=${store._id}`" class="card action-card h-100">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center p-3">
                      <i class="bi bi-receipt action-icon mb-2"></i>
                      <h6 class="mb-1">訂單管理</h6>
                      <p class="small text-muted text-center mb-0">
                        查看店鋪訂單
                      </p>
                    </div>
                  </router-link>
                </div>

                <div class="col-md-6">
                  <router-link :to="`/admin/${brandId}/orders/reports?storeId=${store._id}`"
                    class="card action-card h-100">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center p-3">
                      <i class="bi bi-bar-chart action-icon mb-2"></i>
                      <h6 class="mb-1">銷售報表</h6>
                      <p class="small text-muted text-center mb-0">
                        查看銷售統計數據
                      </p>
                    </div>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <BModal v-model:show="showDeleteModal" title="確認刪除" centered>
      <div v-if="store">
        <p>您確定要刪除店鋪 <strong>{{ store.name }}</strong> 嗎？</p>
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          此操作無法撤銷，店鋪相關的所有資料都將被永久刪除。
        </div>
      </div>

      <template #footer>
        <BButton variant="secondary" @click="showDeleteModal = false">取消</BButton>
        <BButton variant="danger" @click="handleDelete" :disabled="isDeleting">
          <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          {{ isDeleting ? '處理中...' : '確認刪除' }}
        </BButton>
      </template>
    </BModal>

    <!-- 營業時間快速編輯對話框 -->
    <BModal v-model:show="showBusinessHoursModal" title="編輯營業時間" size="lg" centered>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>星期</th>
              <th>營業時段</th>
              <th width="100px">公休日</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in editBusinessHours" :key="day.day">
              <td>{{ getDayName(day.day) }}</td>
              <td>
                <div v-if="!day.isClosed">
                  <div v-for="(period, pIndex) in day.periods" :key="pIndex" class="mb-2">
                    <div class="d-flex align-items-center">
                      <div class="time-input-group">
                        <input type="time" class="form-control form-control-sm" v-model="day.periods[pIndex].open" />
                      </div>
                      <span class="mx-2">至</span>
                      <div class="time-input-group">
                        <input type="time" class="form-control form-control-sm" v-model="day.periods[pIndex].close" />
                      </div>

                      <!-- 刪除時段按鈕 -->
                      <button type="button" class="btn btn-sm btn-outline-danger ms-2"
                        @click="removePeriod(day, pIndex)" v-if="day.periods.length > 1">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <!-- 新增時段按鈕 -->
                  <button type="button" class="btn btn-sm btn-outline-primary mt-1" @click="addPeriod(day)">
                    <i class="bi bi-plus-circle me-1"></i>新增時段
                  </button>
                </div>
                <div v-else class="text-muted">
                  公休日
                </div>
              </td>
              <td>
                <BFormCheckbox v-model="day.isClosed" switch>
                </BFormCheckbox>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <BButton variant="secondary" @click="showBusinessHoursModal = false">取消</BButton>
        <BButton variant="primary" @click="updateBusinessHours" :disabled="isUpdatingHours">
          <span v-if="isUpdatingHours" class="spinner-border spinner-border-sm me-1" role="status"
            aria-hidden="true"></span>
          {{ isUpdatingHours ? '更新中...' : '保存變更' }}
        </BButton>
      </template>
    </BModal>

    <!-- 公告快速編輯對話框 -->
    <BModal v-model:show="showAnnouncementsModal" title="編輯店鋪公告" size="lg" centered>
      <div v-if="editAnnouncements.length > 0">
        <div v-for="(announcement, index) in editAnnouncements" :key="index" class="card mb-3">
          <div class="card-body">
            <div class="mb-3">
              <label :for="`modal-announcement-title-${index}`" class="form-label required">公告標題</label>
              <BFormInput :id="`modal-announcement-title-${index}`" v-model="announcement.title" />
            </div>

            <div class="mb-3">
              <label :for="`modal-announcement-content-${index}`" class="form-label required">公告內容</label>
              <BFormTextarea :id="`modal-announcement-content-${index}`" v-model="announcement.content" rows="3" />
            </div>

            <div class="text-end">
              <BButton size="sm" variant="outline-danger" @click="removeModalAnnouncement(index)">
                <i class="bi bi-trash me-1"></i>刪除公告
              </BButton>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-3">
        <BButton variant="outline-primary" @click="addModalAnnouncement">
          <i class="bi bi-plus-circle me-1"></i>新增公告
        </BButton>
      </div>

      <template #footer>
        <BButton variant="secondary" @click="showAnnouncementsModal = false">取消</BButton>
        <BButton variant="primary" @click="updateAnnouncements" :disabled="isUpdatingAnnouncements">
          <span v-if="isUpdatingAnnouncements" class="spinner-border spinner-border-sm me-1" role="status"
            aria-hidden="true"></span>
          {{ isUpdatingAnnouncements ? '更新中...' : '保存變更' }}
        </BButton>
      </template>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { BModal, BButton, BFormCheckbox, BFormInput, BFormTextarea } from 'bootstrap-vue-next';
import api from '@/api';

// 路由
const router = useRouter();
const route = useRoute();

// 從路由中獲取品牌ID和店鋪ID
const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.id);

// 狀態
const store = ref(null);
const isLoading = ref(true);
const error = ref('');
const isDeleting = ref(false);
const isUpdatingHours = ref(false);
const isUpdatingAnnouncements = ref(false);

// Modal 顯示狀態
const showDeleteModal = ref(false);
const showBusinessHoursModal = ref(false);
const showAnnouncementsModal = ref(false);

// 編輯用的數據
const editBusinessHours = ref([]);
const editAnnouncements = ref([]);

// 星期幾名稱
const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

// 取得星期幾名稱
const getDayName = (day) => {
  return dayNames[day] || `未知 (${day})`;
};

// 按照星期順序排序的營業時間
const sortedBusinessHours = computed(() => {
  if (!store.value || !store.value.businessHours) return [];
  return [...store.value.businessHours].sort((a, b) => a.day - b.day);
});

// 獲取店鋪資料
const fetchStoreData = async () => {
  if (!storeId.value) return;

  isLoading.value = true;
  error.value = '';

  try {
    const response = await api.store.getStoreById({ brandId: brandId.value, id: storeId.value });

    if (response && response.store) {
      store.value = response.store;

      // 複製數據以供編輯
      initEditData();
    } else {
      error.value = '獲取店鋪資料失敗';
    }
  } catch (err) {
    console.error('獲取店鋪資料時發生錯誤:', err);
    error.value = '獲取店鋪資料時發生錯誤，請稍後再試';
  } finally {
    isLoading.value = false;
  }
};

// 初始化編輯用數據
const initEditData = () => {
  // 深複製營業時間數據
  editBusinessHours.value = JSON.parse(JSON.stringify(store.value.businessHours || []));

  // 確保每天的時段都有正確的結構
  editBusinessHours.value.forEach(day => {
    if (!day.periods || day.periods.length === 0) {
      day.periods = [{
        open: '09:00',
        close: '18:00'
      }];
    }
  });

  // 深複製公告數據
  editAnnouncements.value = JSON.parse(JSON.stringify(store.value.announcements || []));
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

// 切換店鋪啟用狀態
const toggleStoreActive = async () => {
  if (!store.value) return;

  try {
    const newStatus = !store.value.isActive;
    await api.store.toggleStoreActive({
      id: store.value._id,
      isActive: newStatus
    });

    // 更新本地狀態
    store.value.isActive = newStatus;

    // 觸發列表刷新
    window.dispatchEvent(new CustomEvent('refresh-store-list'));
  } catch (err) {
    console.error('切換店鋪狀態失敗:', err);
    alert('切換店鋪狀態時發生錯誤');
  }
};

// 處理刪除確認
const handleDelete = async () => {
  if (!store.value) return;

  isDeleting.value = true;

  try {
    await api.store.deleteStore(store.value._id);

    // 關閉模態對話框
    showDeleteModal.value = false;

    // 延遲導航
    setTimeout(() => {
      // 返回店鋪列表
      router.push(`/admin/${brandId.value}/stores`);

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-store-list'));
    }, 300);
  } catch (err) {
    console.error('刪除店鋪失敗:', err);

    if (err.response && err.response.data && err.response.data.message) {
      alert(`刪除失敗: ${err.response.data.message}`);
    } else {
      alert('刪除店鋪時發生錯誤');
    }
  } finally {
    isDeleting.value = false;
  }
};

// 添加營業時段
const addPeriod = (day) => {
  day.periods.push({
    open: '09:00',
    close: '18:00'
  });
};

// 移除營業時段
const removePeriod = (day, periodIndex) => {
  day.periods.splice(periodIndex, 1);
};

// 更新營業時間
const updateBusinessHours = async () => {
  if (!store.value) return;

  isUpdatingHours.value = true;

  try {
    const response = await api.store.updateBusinessHours({
      id: store.value._id,
      businessHours: editBusinessHours.value
    });

    if (response && response.store) {
      // 更新數據
      store.value.businessHours = response.store.businessHours;

      // 關閉模態窗口
      showBusinessHoursModal.value = false;
    }
  } catch (err) {
    console.error('更新營業時間失敗:', err);
    alert('更新營業時間時發生錯誤');
  } finally {
    isUpdatingHours.value = false;
  }
};

// 添加模態窗中的公告
const addModalAnnouncement = () => {
  editAnnouncements.value.push({
    title: '',
    content: ''
  });
};

// 移除模態窗中的公告
const removeModalAnnouncement = (index) => {
  editAnnouncements.value.splice(index, 1);
};

// 更新公告
const updateAnnouncements = async () => {
  if (!store.value) return;

  // 驗證表單
  let isValid = true;
  for (const announcement of editAnnouncements.value) {
    if (!announcement.title.trim() || !announcement.content.trim()) {
      isValid = false;
      break;
    }
  }

  if (!isValid) {
    alert('公告標題和內容不能為空');
    return;
  }

  isUpdatingAnnouncements.value = true;

  try {
    const response = await api.store.updateAnnouncements({
      id: store.value._id,
      announcements: editAnnouncements.value
    });

    if (response && response.store) {
      // 更新數據
      store.value.announcements = response.store.announcements;

      // 關閉模態窗口
      showAnnouncementsModal.value = false;
    }
  } catch (err) {
    console.error('更新公告失敗:', err);
    alert('更新公告時發生錯誤');
  } finally {
    isUpdatingAnnouncements.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 獲取店鋪資料
  fetchStoreData();

  // 監聽模態對話框打開事件
  // 當營業時間編輯模態框開啟時重新初始化數據
  watch(showBusinessHoursModal, (newValue) => {
    if (newValue) {
      editBusinessHours.value = JSON.parse(JSON.stringify(store.value.businessHours || []));
    }
  });

  // 當公告編輯模態框開啟時重新初始化數據
  watch(showAnnouncementsModal, (newValue) => {
    if (newValue) {
      editAnnouncements.value = JSON.parse(JSON.stringify(store.value.announcements || []));
    }
  });
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

/* 必填欄位標記 */
.required::after {
  content: " *";
  color: #dc3545;
}

/* 時間輸入組件 */
.time-input-group {
  min-width: 100px;
}

/* 公告樣式 */
.announcement-item {
  background-color: #f8f9fa;
  transition: all 0.2s;
}

.announcement-item:hover {
  background-color: #f1f3f5;
}

.announcement-title {
  font-weight: 600;
}

/* 快速操作卡片 */
.action-card {
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid #dee2e6;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  border-color: #0d6efd;
}

.action-icon {
  font-size: 2rem;
  color: #0d6efd;
}
</style>
