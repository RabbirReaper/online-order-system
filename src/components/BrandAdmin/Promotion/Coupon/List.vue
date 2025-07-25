<template>
  <div>
    <!-- 頁面頂部工具列 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex">
        <div class="input-group" style="width: 300px">
          <input
            type="text"
            class="form-control"
            placeholder="搜尋優惠券..."
            v-model="searchQuery"
            @input="handleSearch"
          />
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

    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 優惠券列表 -->
    <div class="card" v-if="!isLoading">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th>名稱</th>
                <th>折扣內容</th>
                <th>最低消費</th>
                <th>有效期限</th>
                <th>已發行</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="coupon in filteredCoupons" :key="coupon._id">
                <td>
                  <div>
                    <strong>{{ coupon.name }}</strong>
                    <div v-if="coupon.description" class="text-muted small">
                      {{ coupon.description }}
                    </div>
                  </div>
                </td>
                <td>
                  <div v-if="coupon.discountInfo">
                    <span v-if="coupon.discountInfo.discountType === 'percentage'">
                      {{ coupon.discountInfo.discountValue }}% 折扣
                      <span
                        v-if="coupon.discountInfo.maxDiscountAmount"
                        class="text-muted small d-block"
                      >
                        (最高${{ formatPrice(coupon.discountInfo.maxDiscountAmount) }})
                      </span>
                    </span>
                    <span v-else> 折抵 ${{ formatPrice(coupon.discountInfo.discountValue) }} </span>
                  </div>
                  <span v-else class="text-muted">未設定</span>
                </td>
                <td>
                  <span v-if="coupon.discountInfo && coupon.discountInfo.minPurchaseAmount > 0">
                    ${{ formatPrice(coupon.discountInfo.minPurchaseAmount) }}
                  </span>
                  <span v-else class="text-muted">無限制</span>
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
                    <router-link
                      :to="`/admin/${brandId}/coupons/detail/${coupon._id}`"
                      class="btn btn-sm btn-outline-primary"
                    >
                      <i class="bi bi-eye me-1"></i>查看
                    </router-link>
                    <router-link
                      :to="`/admin/${brandId}/coupons/edit/${coupon._id}`"
                      class="btn btn-sm btn-outline-primary"
                    >
                      <i class="bi bi-pencil me-1"></i>編輯
                    </router-link>
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="coupon.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                      @click="toggleStatus(coupon)"
                    >
                      <i class="bi bi-power me-1"></i>{{ coupon.isActive ? '停用' : '啟用' }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      @click="confirmDelete(coupon)"
                    >
                      <i class="bi bi-trash me-1"></i>刪除
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredCoupons.length === 0 && !isLoading">
                <td colspan="7" class="text-center text-muted py-4">
                  <i class="bi bi-inbox display-4 d-block mb-2"></i>
                  {{ searchQuery ? '沒有符合條件的優惠券' : '尚未建立任何優惠券' }}
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
            <p v-if="couponToToggle">
              您確定要{{ couponToToggle.isActive ? '停用' : '啟用' }}「{{
                couponToToggle.name
              }}」嗎？
            </p>
            <div class="alert alert-info">
              <i class="bi bi-info-circle-fill me-2"></i>
              {{
                couponToToggle?.isActive
                  ? '停用後將無法繼續發放此優惠券給用戶'
                  : '啟用後可以重新發放此優惠券'
              }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button
              type="button"
              class="btn btn-primary"
              @click="confirmToggleStatus"
              :disabled="isToggling"
            >
              <span v-if="isToggling" class="spinner-border spinner-border-sm me-1"></span>
              確認{{ couponToToggle?.isActive ? '停用' : '啟用' }}
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
            <p v-if="couponToDelete">您確定要刪除優惠券「{{ couponToDelete.name }}」嗎？</p>
            <p class="text-muted small">刪除後，所有相關的統計資料也會一併移除。</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button
              type="button"
              class="btn btn-danger"
              @click="deleteCoupon"
              :disabled="isDeleting"
            >
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
import api from '@/api'

// 路由
const route = useRoute()

// 從路由中獲取品牌ID
const brandId = computed(() => route.params.brandId)

// 狀態
const isLoading = ref(false)
const isToggling = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')

// 搜尋和篩選
const searchQuery = ref('')
const filterStatus = ref('')

// 優惠券列表
const coupons = ref([])

// 對話框控制
const deleteModal = ref(null)
const statusModal = ref(null)
const couponToDelete = ref(null)
const couponToToggle = ref(null)

// 格式化價格
const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0'
}

// 處理搜尋
const handleSearch = () => {
  // 搜尋和篩選邏輯在 computed 中處理
}

// 篩選後的優惠券列表
const filteredCoupons = computed(() => {
  let filtered = [...coupons.value]

  // 搜尋過濾
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (coupon) =>
        coupon.name.toLowerCase().includes(query) ||
        (coupon.description && coupon.description.toLowerCase().includes(query)),
    )
  }

  // 狀態過濾
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active'
    filtered = filtered.filter((coupon) => coupon.isActive === isActive)
  }

  return filtered
})

// 獲取優惠券列表
const fetchCoupons = async () => {
  if (!brandId.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await api.promotion.getAllCouponTemplates(brandId.value)
    if (response && response.templates) {
      coupons.value = response.templates
    }
  } catch (error) {
    console.error('獲取優惠券列表失敗:', error)
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message
    } else if (error.message) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '無法連接到伺服器，請檢查網路連線'
    }
  } finally {
    isLoading.value = false
  }
}

// 顯示狀態切換確認對話框
const toggleStatus = (coupon) => {
  couponToToggle.value = coupon
  statusModal.value.show()
}

// 確認切換狀態
const confirmToggleStatus = async () => {
  if (!couponToToggle.value) return

  isToggling.value = true

  try {
    const newStatus = !couponToToggle.value.isActive
    await api.promotion.updateCouponTemplate({
      brandId: brandId.value,
      id: couponToToggle.value._id,
      data: {
        isActive: newStatus,
      },
    })

    // 更新本地狀態
    couponToToggle.value.isActive = newStatus

    // 關閉對話框
    statusModal.value.hide()
  } catch (error) {
    console.error('切換狀態失敗:', error)
    alert('切換狀態失敗，請稍後再試')
  } finally {
    isToggling.value = false
  }
}

// 顯示刪除確認對話框
const confirmDelete = (coupon) => {
  couponToDelete.value = coupon
  deleteModal.value.show()
}

// 刪除優惠券
const deleteCoupon = async () => {
  if (!couponToDelete.value) return

  isDeleting.value = true

  try {
    await api.promotion.deleteCouponTemplate({
      brandId: brandId.value,
      id: couponToDelete.value._id,
    })

    // 關閉對話框
    deleteModal.value.hide()

    // 從列表中移除已刪除的優惠券
    coupons.value = coupons.value.filter((coupon) => coupon._id !== couponToDelete.value._id)
  } catch (error) {
    console.error('刪除優惠券失敗:', error)
    if (error.response && error.response.data && error.response.data.message) {
      alert(`刪除失敗: ${error.response.data.message}`)
    } else {
      alert('刪除優惠券時發生錯誤')
    }
  } finally {
    isDeleting.value = false
  }
}

// 生命週期鉤子
onMounted(() => {
  // 初始化刪除確認對話框
  const modalElement = document.getElementById('deleteConfirmModal')
  if (modalElement) {
    deleteModal.value = new Modal(modalElement)
    modalElement.addEventListener('hidden.bs.modal', () => {
      couponToDelete.value = null
    })
  }

  // 初始化狀態切換對話框
  const statusModalElement = document.getElementById('statusToggleModal')
  if (statusModalElement) {
    statusModal.value = new Modal(statusModalElement)
    statusModalElement.addEventListener('hidden.bs.modal', () => {
      couponToToggle.value = null
    })
  }

  // 載入優惠券列表
  fetchCoupons()

  // 設置刷新列表的事件監聽器
  window.addEventListener('refresh-coupon-list', fetchCoupons)
})

onUnmounted(() => {
  // 移除事件監聽器
  window.removeEventListener('refresh-coupon-list', fetchCoupons)
})
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
</style>
