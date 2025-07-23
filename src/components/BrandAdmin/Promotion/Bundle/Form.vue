<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <!-- 頁面標題 -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0">
            <i class="bi bi-box-seam me-2"></i>
            {{ isEditMode ? '編輯包裝商品' : '建立包裝商品' }}
          </h4>
          <router-link :to="`/admin/${brandId}/bundles`" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>

        <!-- 錯誤訊息 -->
        <div v-if="formErrors.length > 0" class="alert alert-danger">
          <h6 class="alert-heading">
            <i class="bi bi-exclamation-triangle me-2"></i>請修正以下錯誤：
          </h6>
          <ul class="mb-0">
            <li v-for="error in formErrors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <!-- 成功訊息 -->
        <div v-if="successMessage" class="alert alert-success">
          <i class="bi bi-check-circle me-2"></i>{{ successMessage }}
        </div>

        <!-- 表單 -->
        <form @submit.prevent="submitForm" class="row">
          <!-- 基本資訊 -->
          <div class="col-lg-8 mb-4">
            <div class="card">
              <div class="card-header">
                <h6 class="card-title mb-0">基本資訊</h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-12 mb-3">
                    <label for="name" class="form-label required">商品名稱</label>
                    <input
                      type="text"
                      class="form-control"
                      id="name"
                      v-model="formData.name"
                      :class="{ 'is-invalid': errors.name }"
                      maxlength="100"
                      placeholder="例：豬排兌換券超值組合"
                    />
                    <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
                    <div class="form-text">簡潔明瞭的商品名稱，最多100個字元</div>
                  </div>
                </div>

                <div class="mb-3">
                  <label for="description" class="form-label required">商品描述</label>
                  <textarea
                    class="form-control"
                    id="description"
                    v-model="formData.description"
                    rows="3"
                    :class="{ 'is-invalid': errors.description }"
                    placeholder="詳細描述此包裝商品的內容、特色和使用方式"
                  ></textarea>
                  <div class="invalid-feedback" v-if="errors.description">
                    {{ errors.description }}
                  </div>
                  <div class="form-text">向顧客說明商品內容和優勢</div>
                </div>

                <!-- 圖片上傳 -->
                <div class="mb-3">
                  <label for="imageUpload" class="form-label required">商品圖片</label>
                  <input
                    type="file"
                    class="form-control"
                    id="imageUpload"
                    @change="handleImageUpload"
                    accept="image/*"
                    :class="{ 'is-invalid': errors.image }"
                  />
                  <div class="invalid-feedback" v-if="errors.image">{{ errors.image }}</div>
                  <div class="form-text">檔案大小限制為 1MB，支援 JPG、PNG 格式</div>

                  <!-- 圖片預覽 -->
                  <div v-if="imagePreview || formData.image" class="mt-3">
                    <div class="position-relative d-inline-block">
                      <img
                        :src="imagePreview || formData.image?.url"
                        class="img-thumbnail"
                        style="max-width: 200px; max-height: 150px; object-fit: cover"
                      />
                      <button
                        type="button"
                        class="btn btn-sm btn-danger position-absolute top-0 end-0 translate-middle"
                        @click="removeImage"
                      >
                        <i class="bi bi-x"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 價格設定 -->
            <div class="card mt-4">
              <div class="card-header">
                <h6 class="card-title mb-0">價格設定</h6>
              </div>
              <div class="card-body">
                <!-- 價格類型選擇 -->
                <div class="row mb-3">
                  <div class="col-md-6">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="hasCashPrice"
                        v-model="hasCashPrice"
                      />
                      <label class="form-check-label" for="hasCashPrice"> 設定現金價格 </label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="hasPointPrice"
                        v-model="hasPointPrice"
                      />
                      <label class="form-check-label" for="hasPointPrice"> 設定點數價格 </label>
                    </div>
                  </div>
                </div>

                <!-- 現金價格 -->
                <div v-if="hasCashPrice" class="row mb-3">
                  <div class="col-md-6">
                    <label class="form-label required">現金原價</label>
                    <div class="input-group">
                      <span class="input-group-text">$</span>
                      <input
                        type="number"
                        class="form-control"
                        v-model="formData.cashPrice.original"
                        min="0"
                        step="1"
                        :class="{ 'is-invalid': errors['cashPrice.original'] }"
                      />
                    </div>
                    <div class="invalid-feedback" v-if="errors['cashPrice.original']">
                      {{ errors['cashPrice.original'] }}
                    </div>

                    <!-- 價格計算輔助 -->
                    <div v-if="formData.bundleItems.length > 0" class="mt-2">
                      <div class="small text-muted mb-2">
                        <strong>包裝內容總價值：</strong>${{
                          formatPrice(calculatedPrice.totalValue)
                        }}
                      </div>
                      <div v-if="calculatedPrice.suggestedPrice > 0" class="small text-muted mb-2">
                        <strong>建議售價（85折）：</strong>${{
                          formatPrice(calculatedPrice.suggestedPrice)
                        }}
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">現金特價（選填）</label>
                    <div class="input-group">
                      <span class="input-group-text">$</span>
                      <input
                        type="number"
                        class="form-control"
                        v-model="formData.cashPrice.selling"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div class="form-text">留空則以原價販售</div>
                  </div>
                </div>

                <!-- 點數價格 -->
                <div v-if="hasPointPrice" class="row mb-3">
                  <div class="col-md-6">
                    <label class="form-label required">點數原價</label>
                    <div class="input-group">
                      <input
                        type="number"
                        class="form-control"
                        v-model="formData.pointPrice.original"
                        min="0"
                        step="1"
                        :class="{ 'is-invalid': errors['pointPrice.original'] }"
                      />
                      <span class="input-group-text">點</span>
                    </div>
                    <div class="invalid-feedback" v-if="errors['pointPrice.original']">
                      {{ errors['pointPrice.original'] }}
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">點數特價（選填）</label>
                    <div class="input-group">
                      <input
                        type="number"
                        class="form-control"
                        v-model="formData.pointPrice.selling"
                        min="0"
                        step="1"
                      />
                      <span class="input-group-text">點</span>
                    </div>
                    <div class="form-text">留空則以原價販售</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 包裝內容 -->
            <div class="card mt-4">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="card-title mb-0">包裝內容</h6>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  @click="addBundleItem"
                  :disabled="voucherTemplates.length === 0"
                >
                  <i class="bi bi-plus-circle me-1"></i>新增項目
                </button>
              </div>
              <div class="card-body">
                <!-- 兌換券模板載入提示 -->
                <div v-if="isLoadingTemplates" class="text-center py-3">
                  <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                  載入兌換券模板中...
                </div>

                <!-- 沒有可用模板提示 -->
                <div v-else-if="voucherTemplates.length === 0" class="alert alert-warning">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  <strong>沒有可用的兌換券模板</strong>
                  <p class="mb-0 mt-2">
                    請先到促銷管理 → 兌換券管理建立兌換券模板，才能建立包裝商品。
                  </p>
                  <router-link
                    :to="`/admin/${brandId}/vouchers`"
                    class="btn btn-sm btn-outline-primary mt-2"
                  >
                    前往兌換券管理
                  </router-link>
                </div>

                <!-- 包裝項目列表 -->
                <div v-else-if="formData.bundleItems.length > 0">
                  <div v-for="(item, index) in formData.bundleItems" :key="index" class="card mb-3">
                    <div class="card-body">
                      <div class="row">
                        <div class="col-md-8 mb-3">
                          <label class="form-label required">兌換券模板</label>

                          <select
                            v-model="item.voucherTemplate"
                            class="form-select"
                            :class="{ 'is-invalid': getItemError(index, 'voucherTemplate') }"
                            @change="updateVoucherName(index)"
                          >
                            <option value="">選擇兌換券模板</option>
                            <option
                              v-for="voucher in voucherTemplates"
                              :key="voucher._id"
                              :value="voucher._id"
                            >
                              {{ voucher.name }} - ${{
                                formatPrice(voucher.dishTemplateDetails?.basePrice || 0)
                              }}
                            </option>
                          </select>
                          <div
                            class="invalid-feedback"
                            v-if="getItemError(index, 'voucherTemplate')"
                          >
                            {{ getItemError(index, 'voucherTemplate') }}
                          </div>
                        </div>
                        <div class="col-md-3 mb-3">
                          <label class="form-label required">數量</label>
                          <input
                            type="number"
                            class="form-control"
                            v-model="item.quantity"
                            min="1"
                            :class="{ 'is-invalid': getItemError(index, 'quantity') }"
                            @change="calculateBundlePrice"
                          />
                          <div class="invalid-feedback" v-if="getItemError(index, 'quantity')">
                            {{ getItemError(index, 'quantity') }}
                          </div>
                        </div>
                        <div class="col-md-1 mb-3">
                          <label class="form-label">&nbsp;</label>
                          <button
                            type="button"
                            class="btn btn-outline-danger w-100"
                            @click="removeBundleItem(index)"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>

                      <!-- 選定兌換券的詳細資訊 -->
                      <div
                        v-if="getSelectedVoucher(item.voucherTemplate)"
                        class="alert alert-info mb-0"
                      >
                        <div class="row">
                          <div class="col-md-8">
                            <h6 class="mb-1">
                              {{ getSelectedVoucher(item.voucherTemplate).name }}
                            </h6>
                            <div>
                              <strong>描述：</strong
                              >{{ getSelectedVoucher(item.voucherTemplate).description || '無描述'
                              }}<br />
                              <strong>有效期：</strong
                              >{{
                                getSelectedVoucher(item.voucherTemplate).validityPeriod
                              }}
                              天<br />
                              <div
                                v-if="getSelectedVoucher(item.voucherTemplate).dishTemplateDetails"
                              >
                                <strong>可兌換餐點：</strong
                                >{{
                                  getSelectedVoucher(item.voucherTemplate).dishTemplateDetails.name
                                }}<br />
                                <strong>餐點價值：</strong>${{
                                  formatPrice(
                                    getSelectedVoucher(item.voucherTemplate).dishTemplateDetails
                                      .basePrice,
                                  )
                                }}
                              </div>
                            </div>
                          </div>
                          <div
                            class="col-md-4"
                            v-if="
                              getSelectedVoucher(item.voucherTemplate).dishTemplateDetails?.image
                            "
                          >
                            <img
                              :src="
                                getSelectedVoucher(item.voucherTemplate).dishTemplateDetails.image
                                  .url
                              "
                              class="img-thumbnail"
                              style="max-width: 80px; max-height: 60px"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 空狀態 -->
                <div v-else class="text-center text-muted py-4">
                  <i class="bi bi-inbox display-6 d-block mb-2"></i>
                  <p>尚未添加任何兌換券項目</p>
                  <button
                    type="button"
                    class="btn btn-outline-primary"
                    @click="addBundleItem"
                    :disabled="voucherTemplates.length === 0"
                  >
                    <i class="bi bi-plus-circle me-1"></i>新增第一個項目
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 設定選項 -->
          <div class="col-lg-4">
            <!-- 基本設定 -->
            <div class="card mb-4">
              <div class="card-header">
                <h6 class="card-title mb-0">基本設定</h6>
              </div>
              <div class="card-body">
                <!-- 兌換券有效期設定 -->
                <div class="mb-3">
                  <label for="voucherValidityDays" class="form-label required"
                    >兌換券有效期（天）</label
                  >
                  <input
                    type="number"
                    class="form-control"
                    id="voucherValidityDays"
                    v-model="formData.voucherValidityDays"
                    min="1"
                    max="365"
                    :class="{ 'is-invalid': errors.voucherValidityDays }"
                  />
                  <div class="invalid-feedback" v-if="errors.voucherValidityDays">
                    {{ errors.voucherValidityDays }}
                  </div>
                  <div class="form-text">購買後生成的兌換券有效天數</div>
                </div>

                <!-- 購買限制 -->
                <div class="mb-3">
                  <label for="purchaseLimitPerUser" class="form-label">每人購買限制</label>
                  <input
                    type="number"
                    class="form-control"
                    id="purchaseLimitPerUser"
                    v-model="formData.purchaseLimitPerUser"
                    min="0"
                    placeholder="0 表示無限制"
                  />
                  <div class="form-text">設為0或留空表示每人無購買數量限制</div>
                </div>
              </div>
            </div>

            <!-- 狀態設定 -->
            <div class="card mb-4">
              <div class="card-header">
                <h6 class="card-title mb-0">狀態設定</h6>
              </div>
              <div class="card-body">
                <div class="form-check form-switch">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="isActive"
                    v-model="formData.isActive"
                  />
                  <label class="form-check-label" for="isActive">
                    {{ formData.isActive ? '啟用' : '停用' }}
                  </label>
                </div>
                <div class="form-text">停用後此商品將不會在前台顯示</div>
              </div>
            </div>

            <!-- 提交按鈕 -->
            <div class="d-grid gap-2">
              <button type="button" class="btn btn-outline-secondary" @click="resetForm">
                <i class="bi bi-arrow-clockwise me-1"></i>重置
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
                {{ isSubmitting ? '處理中...' : isEditMode ? '更新商品' : '建立商品' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api'

const router = useRouter()
const route = useRoute()

const isEditMode = computed(() => !!route.params.id)
const brandId = computed(() => route.params.brandId)

// 表單資料（移除時間相關欄位）
const formData = reactive({
  name: '',
  description: '',
  image: null,
  cashPrice: {
    original: null,
    selling: null,
  },
  pointPrice: {
    original: null,
    selling: null,
  },
  bundleItems: [],
  voucherValidityDays: 30,
  isActive: true,
  purchaseLimitPerUser: null,
})

const hasCashPrice = ref(false)
const hasPointPrice = ref(false)

const imagePreview = ref('')
const imageFile = ref(null)

const errors = reactive({})

const isSubmitting = ref(false)
const isLoadingTemplates = ref(false)
const successMessage = ref('')
const formErrors = ref([])
const voucherTemplates = ref([])

const calculatedPrice = ref({
  totalValue: 0,
  suggestedPrice: 0,
})

watch(hasCashPrice, (newVal) => {
  if (!newVal) {
    formData.cashPrice = { original: null, selling: null }
  }
})

watch(hasPointPrice, (newVal) => {
  if (!newVal) {
    formData.pointPrice = { original: null, selling: null }
  }
})

watch(
  () => formData.bundleItems,
  () => {
    calculateBundlePrice()
  },
  { deep: true },
)

const calculateBundlePrice = () => {
  let totalValue = 0

  formData.bundleItems.forEach((item) => {
    const voucher = getSelectedVoucher(item.voucherTemplate)
    if (
      voucher &&
      voucher.dishTemplateDetails &&
      voucher.dishTemplateDetails.basePrice &&
      item.quantity
    ) {
      totalValue += voucher.dishTemplateDetails.basePrice * item.quantity
    }
  })

  calculatedPrice.value.totalValue = totalValue
  calculatedPrice.value.suggestedPrice = Math.round(totalValue * 0.85)
}

const formatPrice = (price) => {
  return price?.toLocaleString('zh-TW') || '0'
}

const getItemError = (index, field) => {
  return errors[`bundleItems.${index}.${field}`]
}

const getSelectedVoucher = (voucherId) => {
  return voucherTemplates.value.find((voucher) => voucher._id === voucherId)
}

const updateVoucherName = (index) => {
  const voucher = getSelectedVoucher(formData.bundleItems[index].voucherTemplate)
  if (voucher) {
    formData.bundleItems[index].voucherName = voucher.name
  }
  calculateBundlePrice()
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('請選擇圖片檔案')
    return
  }

  if (file.size > 1 * 1024 * 1024) {
    alert('圖片檔案不得超過 5MB')
    return
  }

  imageFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const removeImage = () => {
  imageFile.value = null
  imagePreview.value = ''
  formData.image = null

  const fileInput = document.getElementById('imageUpload')
  if (fileInput) {
    fileInput.value = ''
  }
}

const addBundleItem = () => {
  formData.bundleItems.push({
    voucherTemplate: '',
    quantity: 1,
    voucherName: '',
  })
}

const removeBundleItem = (index) => {
  formData.bundleItems.splice(index, 1)
}

const resetForm = () => {
  if (isEditMode.value) {
    fetchBundleData()
  } else {
    // 重置表單（移除時間相關欄位）
    Object.assign(formData, {
      name: '',
      description: '',
      image: null,
      cashPrice: { original: null, selling: null },
      pointPrice: { original: null, selling: null },
      bundleItems: [],
      voucherValidityDays: 30,
      isActive: true,
      purchaseLimitPerUser: null,
    })

    hasCashPrice.value = false
    hasPointPrice.value = false
    removeImage()
  }

  Object.keys(errors).forEach((key) => delete errors[key])
  formErrors.value = []
  successMessage.value = ''
}

const validateForm = () => {
  Object.keys(errors).forEach((key) => delete errors[key])
  formErrors.value = []
  let isValid = true

  // 驗證名稱
  if (!formData.name.trim()) {
    errors.name = '商品名稱為必填項'
    formErrors.value.push('商品名稱為必填項')
    isValid = false
  } else if (formData.name.length > 100) {
    errors.name = '商品名稱不能超過 100 個字元'
    formErrors.value.push('商品名稱不能超過 100 個字元')
    isValid = false
  }

  // 驗證描述
  if (!formData.description.trim()) {
    errors.description = '商品描述為必填項'
    formErrors.value.push('商品描述為必填項')
    isValid = false
  }

  // 圖片驗證
  if (!imageFile.value && !formData.image) {
    errors.image = '請上傳商品圖片'
    formErrors.value.push('請上傳商品圖片')
    isValid = false
  }

  // 驗證價格設定
  if (!hasCashPrice.value && !hasPointPrice.value) {
    formErrors.value.push('請至少設定一種價格（現金或點數）')
    isValid = false
  }

  if (hasCashPrice.value) {
    if (!formData.cashPrice.original || formData.cashPrice.original <= 0) {
      errors['cashPrice.original'] = '現金原價必須大於 0'
      formErrors.value.push('現金原價必須大於 0')
      isValid = false
    }
    if (formData.cashPrice.selling && formData.cashPrice.selling >= formData.cashPrice.original) {
      formErrors.value.push('現金特價必須低於原價')
      isValid = false
    }
  }

  if (hasPointPrice.value) {
    if (!formData.pointPrice.original || formData.pointPrice.original <= 0) {
      errors['pointPrice.original'] = '點數原價必須大於 0'
      formErrors.value.push('點數原價必須大於 0')
      isValid = false
    }
    if (
      formData.pointPrice.selling &&
      formData.pointPrice.selling >= formData.pointPrice.original
    ) {
      formErrors.value.push('點數特價必須低於原價')
      isValid = false
    }
  }

  // 驗證包裝項目
  if (formData.bundleItems.length === 0) {
    formErrors.value.push('請至少添加一個兌換券項目')
    isValid = false
  } else {
    formData.bundleItems.forEach((item, index) => {
      if (!item.voucherTemplate) {
        errors[`bundleItems.${index}.voucherTemplate`] = '請選擇兌換券模板'
        formErrors.value.push(`第 ${index + 1} 個項目未選擇兌換券模板`)
        isValid = false
      }
      if (!item.quantity || item.quantity < 1) {
        errors[`bundleItems.${index}.quantity`] = '數量必須大於 0'
        formErrors.value.push(`第 ${index + 1} 個項目數量錯誤`)
        isValid = false
      }
    })
  }

  // 兌換券有效期驗證
  if (!formData.voucherValidityDays || formData.voucherValidityDays < 1) {
    errors.voucherValidityDays = '兌換券有效期必須大於 0'
    formErrors.value.push('兌換券有效期必須大於 0')
    isValid = false
  }

  return isValid
}

const fetchVoucherTemplates = async () => {
  if (!brandId.value) return

  isLoadingTemplates.value = true

  try {
    const response = await api.promotion.getAllVoucherTemplates(brandId.value)
    if (response && response.templates) {
      // 為每個兌換券模板獲取餐點詳細資訊
      const templatesWithDishDetails = await Promise.all(
        response.templates.map(async (voucher) => {
          if (voucher.exchangeDishTemplate) {
            try {
              const dishResponse = await api.dish.getDishTemplateById({
                brandId: brandId.value,
                id: voucher.exchangeDishTemplate,
              })
              if (dishResponse && dishResponse.template) {
                voucher.dishTemplateDetails = dishResponse.template
              }
            } catch (error) {
              console.warn(`無法獲取餐點詳情 ${voucher.exchangeDishTemplate}:`, error)
              voucher.dishTemplateDetails = null
            }
          }
          return voucher
        }),
      )
      voucherTemplates.value = templatesWithDishDetails
    }
  } catch (error) {
    console.error('獲取兌換券模板失敗:', error)
    formErrors.value.push('無法獲取兌換券模板資料，請稍後再試')
  } finally {
    isLoadingTemplates.value = false
  }
}

const fetchBundleData = async () => {
  if (!isEditMode.value || !route.params.id) return

  try {
    const response = await api.bundle.getBundleById({
      brandId: brandId.value,
      id: route.params.id,
    })

    if (response && response.bundle) {
      const bundle = response.bundle

      // 填充表單資料（移除時間相關欄位）
      Object.assign(formData, {
        name: bundle.name,
        description: bundle.description,
        image: bundle.image,
        cashPrice: bundle.cashPrice || { original: null, selling: null },
        pointPrice: bundle.pointPrice || { original: null, selling: null },
        bundleItems: bundle.bundleItems || [],
        voucherValidityDays: bundle.voucherValidityDays || 30,
        isActive: bundle.isActive,
        purchaseLimitPerUser: bundle.purchaseLimitPerUser,
      })

      hasCashPrice.value = !!(bundle.cashPrice && bundle.cashPrice.original)
      hasPointPrice.value = !!(bundle.pointPrice && bundle.pointPrice.original)

      if (bundle.image) {
        imagePreview.value = bundle.image.url
      }
    } else {
      formErrors.value = ['獲取包裝商品資料失敗']
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/bundles`)
      }, 2000)
    }
  } catch (error) {
    console.error('獲取包裝商品資料時發生錯誤:', error)
    formErrors.value = ['獲取包裝商品資料時發生錯誤，請稍後再試']
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/bundles`)
    }, 2000)
  }
}

const submitForm = async () => {
  successMessage.value = ''

  if (!validateForm()) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  isSubmitting.value = true

  try {
    const submitData = {
      brand: brandId.value,
      ...formData,
    }

    // ✅ 明確告訴後端要清除或保留價格欄位
    if (!hasCashPrice.value) {
      submitData.cashPrice = null // 明確傳送 null 表示要清除
    }
    if (!hasPointPrice.value) {
      submitData.pointPrice = null // 明確傳送 null 表示要清除
    }

    if (imageFile.value) {
      const reader = new FileReader()
      reader.onload = async () => {
        submitData.imageData = reader.result
        await performSubmit(submitData)
      }
      reader.readAsDataURL(imageFile.value)
    } else {
      await performSubmit(submitData)
    }
  } catch (error) {
    console.error('提交時發生錯誤:', error)
    formErrors.value = ['提交時發生錯誤，請稍後再試']
    isSubmitting.value = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const performSubmit = async (submitData) => {
  try {
    let response

    if (isEditMode.value) {
      response = await api.bundle.updateBundle({
        brandId: brandId.value,
        id: route.params.id,
        data: submitData,
      })
    } else {
      response = await api.bundle.createBundle({
        brandId: brandId.value,
        data: submitData,
      })
    }

    if (response && response.bundle) {
      successMessage.value = isEditMode.value ? '包裝商品已成功更新！' : '包裝商品已成功建立！'

      window.scrollTo({ top: 0, behavior: 'smooth' })

      setTimeout(() => {
        router.push(`/admin/${brandId.value}/bundles`)
      }, 200)
    } else {
      formErrors.value = [isEditMode.value ? '更新包裝商品失敗' : '建立包裝商品失敗']
    }
  } catch (error) {
    console.error('API 請求失敗:', error)
    if (error.response && error.response.data && error.response.data.message) {
      formErrors.value = [error.response.data.message]
    } else {
      formErrors.value = [isEditMode.value ? '更新包裝商品時發生錯誤' : '建立包裝商品時發生錯誤']
    }
  } finally {
    isSubmitting.value = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(async () => {
  await fetchVoucherTemplates()

  if (isEditMode.value) {
    await fetchBundleData()
  }
})
</script>

<style scoped>
.required::after {
  content: ' *';
  color: #dc3545;
}

.card-title {
  font-weight: 600;
}

.alert-info {
  background-color: #e7f3ff;
  border-color: #b8daff;
}

.img-thumbnail {
  border: 2px solid #dee2e6;
}

.position-relative .btn {
  border-radius: 50%;
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
