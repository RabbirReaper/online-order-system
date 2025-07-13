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

    <div v-if="coupon && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ coupon.name }}</h4>
        <div class="d-flex">
          <router-link
            :to="`/admin/${brandId}/coupons/edit/${coupon._id}`"
            class="btn btn-primary me-2"
          >
            <i class="bi bi-pencil me-1"></i>編輯折價券
          </router-link>
          <router-link :to="`/admin/${brandId}/coupons`" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 折價券詳情卡片 -->
      <div class="row">
        <!-- 左側基本資訊 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">基本資訊</h5>

              <div class="mb-3">
                <h6 class="text-muted mb-1">折價券名稱</h6>
                <p>{{ coupon.name }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">折價券描述</h6>
                <p>{{ coupon.description || '無描述' }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">所需點數</h6>
                <p class="fs-4 text-primary">{{ coupon.pointCost }} 點</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">有效期限</h6>
                <p>{{ coupon.validityPeriod }} 天</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">狀態</h6>
                <p>
                  <span class="badge" :class="coupon.isActive ? 'bg-success' : 'bg-secondary'">
                    {{ coupon.isActive ? '啟用' : '停用' }}
                  </span>
                </p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">已發行數量</h6>
                <p>{{ coupon.totalIssued || 0 }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側折扣資訊 -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">折扣設定</h5>

              <div class="mb-3">
                <h6 class="text-muted mb-1">折扣類型</h6>
                <p>
                  <span class="badge bg-info">
                    {{
                      coupon.discountInfo?.discountType === 'percentage'
                        ? '百分比折扣'
                        : '固定金額折抵'
                    }}
                  </span>
                </p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">折扣值</h6>
                <p class="fs-4 text-success">
                  <template v-if="coupon.discountInfo?.discountType === 'percentage'">
                    {{ coupon.discountInfo.discountValue }}% 折扣
                  </template>
                  <template v-else>
                    折抵 ${{ formatPrice(coupon.discountInfo?.discountValue || 0) }}
                  </template>
                </p>
              </div>

              <div
                class="mb-3"
                v-if="
                  coupon.discountInfo?.discountType === 'percentage' &&
                  coupon.discountInfo?.maxDiscountAmount
                "
              >
                <h6 class="text-muted mb-1">最高折扣金額</h6>
                <p>${{ formatPrice(coupon.discountInfo.maxDiscountAmount) }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">最低消費金額</h6>
                <p>
                  {{
                    coupon.discountInfo?.minPurchaseAmount > 0
                      ? `$${formatPrice(coupon.discountInfo.minPurchaseAmount)}`
                      : '無限制'
                  }}
                </p>
              </div>

              <!-- 使用規則說明 -->
              <div class="mt-4">
                <h6 class="text-muted mb-2">使用規則</h6>
                <div class="border rounded p-3 bg-light">
                  <ul class="mb-0 small">
                    <li>此折價券自發放日起 {{ coupon.validityPeriod }} 天內有效</li>
                    <li v-if="coupon.discountInfo?.minPurchaseAmount > 0">
                      需滿足最低消費金額 ${{ formatPrice(coupon.discountInfo.minPurchaseAmount) }}
                    </li>
                    <li
                      v-if="
                        coupon.discountInfo?.discountType === 'percentage' &&
                        coupon.discountInfo?.maxDiscountAmount
                      "
                    >
                      百分比折扣最高不超過 ${{ formatPrice(coupon.discountInfo.maxDiscountAmount) }}
                    </li>
                    <li>每張折價券限使用一次</li>
                    <li>不可與其他優惠同時使用</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 統計資訊 -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">使用統計</h5>
              <div class="row text-center">
                <div class="col-md-3">
                  <div class="border-end">
                    <h3 class="text-primary mb-1">{{ coupon.totalIssued || 0 }}</h3>
                    <p class="text-muted mb-0">已發行</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border-end">
                    <h3 class="text-success mb-1">{{ coupon.totalUsed || 0 }}</h3>
                    <p class="text-muted mb-0">已使用</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border-end">
                    <h3 class="text-warning mb-1">
                      {{ (coupon.totalIssued || 0) - (coupon.totalUsed || 0) }}
                    </h3>
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

      <!-- 操作按鈕 -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">操作</h5>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-primary" @click="showToggleStatusModal">
                  <i class="bi bi-power me-1"></i>{{ coupon.isActive ? '停用' : '啟用' }}折價券
                </button>
                <button
                  class="btn btn-outline-danger"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteCouponModal"
                >
                  <i class="bi bi-trash me-1"></i>刪除折價券
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
            <p v-if="coupon">
              您確定要{{ coupon.isActive ? '停用' : '啟用' }}「{{ coupon.name }}」嗎？
            </p>
            <div class="alert alert-info">
              <i class="bi bi-info-circle-fill me-2"></i>
              {{
                coupon?.isActive ? '停用後顧客將無法兌換此折價券' : '啟用後顧客可以重新兌換此折價券'
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
              確認{{ coupon?.isActive ? '停用' : '啟用' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <div class="modal fade" id="deleteCouponModal" tabindex="-1">
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
            <p v-if="coupon">您確定要刪除折價券「{{ coupon.name }}」嗎？</p>
            <p class="text-muted small">刪除後，所有相關的統計資料也會一併移除。</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button
              type="button"
              class="btn btn-danger"
              @click="handleDelete"
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal } from 'bootstrap'
import api from '@/api'

// 路由
const route = useRoute()
const router = useRouter()

// 從路由中獲取品牌ID和折價券ID
const brandId = computed(() => route.params.brandId)
const couponId = computed(() => route.params.id)

// 狀態
const isLoading = ref(false)
const isToggling = ref(false)
const isDeleting = ref(false)
const error = ref('')

// 折價券資料
const coupon = ref(null)

// 對話框
const statusModal = ref(null)

// 格式化價格
const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0'
}

// 計算使用率
const usageRate = computed(() => {
  if (!coupon.value || !coupon.value.totalIssued || coupon.value.totalIssued === 0) {
    return 0
  }
  return Math.round(((coupon.value.totalUsed || 0) / coupon.value.totalIssued) * 100)
})

// 獲取折價券資料
const fetchCouponData = async () => {
  if (!couponId.value || !brandId.value) return

  isLoading.value = true
  error.value = ''

  try {
    const response = await api.promotion.getCouponTemplateById({
      id: couponId.value,
      brandId: brandId.value,
    })

    if (response && response.template) {
      const template = response.template

      // 確保只處理折價券
      if (template.couponType !== 'discount') {
        error.value = '此項目不是折價券'
        return
      }

      coupon.value = template
    } else {
      error.value = '獲取折價券資料失敗'
    }
  } catch (err) {
    console.error('獲取折價券資料時發生錯誤:', err)
    error.value = '獲取折價券資料時發生錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 顯示狀態切換確認對話框
const showToggleStatusModal = () => {
  statusModal.value.show()
}

// 確認切換狀態
const confirmToggleStatus = async () => {
  if (!coupon.value) return

  isToggling.value = true

  try {
    const newStatus = !coupon.value.isActive
    await api.promotion.updateCouponTemplate({
      id: coupon.value._id,
      data: {
        brand: brandId.value,
        isActive: newStatus,
      },
    })

    // 更新本地狀態
    coupon.value.isActive = newStatus

    // 關閉對話框
    statusModal.value.hide()
  } catch (err) {
    console.error('切換狀態失敗:', err)
    alert('切換狀態失敗，請稍後再試')
  } finally {
    isToggling.value = false
  }
}

// 處理刪除確認
const handleDelete = async () => {
  if (!coupon.value) return

  isDeleting.value = true

  try {
    await api.promotion.deleteCouponTemplate({
      id: coupon.value._id,
      brandId: brandId.value,
    })

    // 關閉模態對話框
    const modalElement = document.getElementById('deleteCouponModal')
    const modal = Modal.getInstance(modalElement)
    if (modal) {
      modal.hide()
    }

    // 確保模態背景被移除後再導航
    setTimeout(() => {
      // 手動移除可能殘留的 backdrop
      const backdrop = document.querySelector('.modal-backdrop')
      if (backdrop) {
        backdrop.remove()
        document.body.classList.remove('modal-open')
      }

      // 返回折價券列表
      router.push(`/admin/${brandId.value}/coupons`)

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-coupon-list'))
    }, 300)
  } catch (err) {
    console.error('刪除折價券失敗:', err)

    if (err.response && err.response.data && err.response.data.message) {
      alert(`刪除失敗: ${err.response.data.message}`)
    } else {
      alert('刪除折價券時發生錯誤')
    }
  } finally {
    isDeleting.value = false
  }
}

// 生命週期鉤子
onMounted(() => {
  // 初始化狀態切換對話框
  const statusModalElement = document.getElementById('statusToggleModal')
  if (statusModalElement) {
    statusModal.value = new Modal(statusModalElement)
  }

  // 獲取折價券資料
  fetchCouponData()
})
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
