<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex">
        <div class="input-group" style="width: 300px;">
          <input type="text" class="form-control" placeholder="搜尋優惠券..." v-model="searchQuery" @input="handleSearch">
          <button class="btn btn-outline-secondary" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>

        <div class="ms-2">
          <select class="form-select" v-model="filterType" @change="handleSearch">
            <option value="">所有類型</option>
            <option value="discount">折扣券</option>
            <option value="exchange">兌換券</option>
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
        <router-link :to="`/admin/${brandId}/coupons/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增優惠券
        </router-link>
      </div>
    </div>

    <!-- 網路錯誤提示 -->
    <div class="alert alert-danger" v-if="errorMessage">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
    </div>

    <!-- 優惠券列表 -->
    <div class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th>名稱</th>
                <th>類型</th>
                <th>點數</th>
                <th>優惠內容</th>
                <th>有效期限</th>
                <th>已發行</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="coupon in filteredCoupons" :key="coupon._id">
                <td>{{ coupon.name }}</td>
                <td>
                  <span class="badge" :class="coupon.couponType === 'discount' ? 'bg-primary' : 'bg-success'">
                    {{ coupon.couponType === 'discount' ? '折扣券' : '兌換券' }}
                  </span>
                </td>
                <td>{{ coupon.pointCost }} 點</td>
                <td>
                  <div v-if="coupon.couponType === 'discount'">
                    <template v-if="coupon.discountInfo">
                      <span v-if="coupon.discountInfo.discountType === 'percentage'">
                        {{ coupon.discountInfo.discountValue }}% 折扣
                        <span v-if="coupon.discountInfo.maxDiscountAmount" class="text-muted">
                          (最高${{ formatPrice(coupon.discountInfo.maxDiscountAmount) }})
                        </span>
                      </span>
                      <span v-else>
                        折抵 ${{ formatPrice(coupon.discountInfo.discountValue) }}
                      </span>
                      <div v-if="coupon.discountInfo.minPurchaseAmount > 0" class="small text-muted">
                        滿 ${{ formatPrice(coupon.discountInfo.minPurchaseAmount) }} 可用
                      </div>
                    </template>
                  </div>
                  <div v-else>
                    <span v-if="coupon.exchangeInfo && coupon.exchangeInfo.items">
                      兌換 {{ coupon.exchangeInfo.items.length }} 項餐點
                    </span>
                  </div>
                </td>
                <td>{{ coupon.validityPeriod }} 天</td>
                <td>{{ coupon.totalIssued || 0 }}</td>
                <td>
                  <span class="badge" :class="coupon.isActive ? 'bg-success' : 'bg-secondary'">
                    {{ coupon.isActive ? '啟用' : '停用' }}
                  </span>
                </td>
                <td>
                  <div class="btn-group">
                    <router-link :to="`/admin/${brandId}/coupons/detail/${coupon._id}`"
                      class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-eye me-1"></i>查看
                    </router-link>
                    <router-link :to="`/admin/${brandId}/coupons/edit/${coupon._id}`"
                      class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-pencil me-1"></i>編輯
                    </router-link>
                    <button type="button" class="btn btn-sm"
                      :class="coupon.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                      @click="toggleStatus(coupon)">
                      <i class="bi bi-power me-1"></i>{{ coupon.isActive ? '停用' : '啟用' }}
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="confirmDelete(coupon)">
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
    <div class="alert alert-info text-center py-4" v-if="coupons.length === 0 && !isLoading">
      <i class="bi bi-info-circle me-2 fs-4"></i>
      <p class="mb-0">{{ searchQuery || filterType || filterStatus ? '沒有符合搜尋條件的優惠券' : '尚未創建任何優惠券' }}</p>
      <div class="mt-3" v-if="!searchQuery && !filterType && !filterStatus">
        <router-link :to="`/admin/${brandId}/coupons/create`" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i>新增第一個優惠券
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
          <div class="modal-body" v-if="couponToDelete">
            <p>確定要刪除優惠券 <strong>{{ couponToDelete.name }}</strong> 嗎？</p>
            <div class="alert alert-danger mt-3">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              此操作無法撤銷！刪除後將無法復原。
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteCoupon" :disabled="isDeleting">
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
          <div class="modal-body" v-if="couponToToggle">
            <p>
              確定要將「<strong>{{ couponToToggle.name }}</strong>」
              {{ couponToToggle.isActive ? '停用' : '啟用' }}嗎？
            </p>

            <div v-if="couponToToggle.isActive" class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>停用注意事項：</strong>
              <ul class="mb-0 mt-2">
                <li>優惠券仍會顯示在兌換頁面，但無法兌換</li>
                <li>如要完全移除請到兌換券菜單修改</li>
                <li>客人將無法購買此優惠券</li>
                <li>客人將無法使用此優惠券</li>
              </ul>
              <p class="mb-0 mt-2 fw-bold">請謹慎使用此功能</p>
            </div>

            <div v-else class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              <strong>啟用注意事項：</strong>
              <ul class="mb-0 mt-2">
                <li>客人將可以開始購買此優惠券</li>
                <li>客人將可以使用此優惠券</li>
                <li>請確認優惠券設定正確</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn"
              :class="couponToToggle && couponToToggle.isActive ? 'btn-warning' : 'btn-success'"
              @click="confirmToggleStatus">
              確認{{ couponToToggle && couponToToggle.isActive ? '停用' : '啟用' }}
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
const coupons = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const filterType = ref('');
const filterStatus = ref('');
const errorMessage = ref('');
const deleteModal = ref(null);
const couponToDelete = ref(null);
const isDeleting = ref(false);

// 計算已過濾的優惠券列表
const filteredCoupons = computed(() => {
  let filtered = coupons.value;

  // 搜尋過濾
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(coupon =>
      coupon.name.toLowerCase().includes(query) ||
      (coupon.description && coupon.description.toLowerCase().includes(query))
    );
  }

  // 類型過濾
  if (filterType.value) {
    filtered = filtered.filter(coupon => coupon.couponType === filterType.value);
  }

  // 狀態過濾
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active';
    filtered = filtered.filter(coupon => coupon.isActive === isActive);
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

// 獲取優惠券列表
const fetchCoupons = async () => {
  if (!brandId.value) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.promotion.getAllCouponTemplates(brandId.value);
    if (response && response.templates) {
      coupons.value = response.templates;
    }
  } catch (error) {
    console.error('獲取優惠券列表失敗:', error);
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

// 切換狀態相關變數
const statusModal = ref(null);
const couponToToggle = ref(null);

// 顯示狀態切換確認對話框
const toggleStatus = (coupon) => {
  couponToToggle.value = coupon;
  statusModal.value.show();
};

// 確認切換狀態
const confirmToggleStatus = async () => {
  if (!couponToToggle.value) return;

  try {
    const newStatus = !couponToToggle.value.isActive;
    await api.promotion.updateCouponTemplate({
      id: couponToToggle.value._id,
      data: {
        brand: brandId.value,
        isActive: newStatus
      }
    });

    // 更新本地狀態
    couponToToggle.value.isActive = newStatus;

    // 關閉對話框
    statusModal.value.hide();
  } catch (error) {
    console.error('切換狀態失敗:', error);
    alert('切換狀態失敗，請稍後再試');
  }
};

// 顯示刪除確認對話框
const confirmDelete = (coupon) => {
  couponToDelete.value = coupon;
  deleteModal.value.show();
};

// 刪除優惠券
const deleteCoupon = async () => {
  if (!couponToDelete.value) return;

  isDeleting.value = true;

  try {
    await api.promotion.deleteCouponTemplate({
      id: couponToDelete.value._id,
      brandId: brandId.value
    });

    // 關閉對話框
    deleteModal.value.hide();

    // 從列表中移除已刪除的優惠券
    coupons.value = coupons.value.filter(
      coupon => coupon._id !== couponToDelete.value._id
    );
  } catch (error) {
    console.error('刪除優惠券失敗:', error);
    alert('刪除優惠券時發生錯誤');
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
      couponToDelete.value = null;
    });
  }

  // 初始化狀態切換對話框
  const statusModalElement = document.getElementById('statusToggleModal');
  if (statusModalElement) {
    statusModal.value = new Modal(statusModalElement);

    // 監聽對話框關閉事件
    statusModalElement.addEventListener('hidden.bs.modal', () => {
      couponToToggle.value = null;
    });
  }

  // 載入優惠券列表
  fetchCoupons();

  // 設置刷新列表的事件監聽器
  window.addEventListener('refresh-coupon-list', fetchCoupons);
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

.small {
  font-size: 0.875rem;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}
</style>
