<template>
  <div class="container-fluid py-4">
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex">
        <div class="bg-primary rounded me-3" style="width: 6px; height: 26px"></div>
        <h4 class="mb-0">{{ isEditMode ? '編輯菜單' : '新增菜單' }}</h4>
      </div>

      <router-link
        :to="`/admin/${brandId}/menus/store/${storeId}`"
        class="btn btn-outline-secondary"
      >
        <i class="bi bi-arrow-left me-1"></i>返回菜單管理
      </router-link>
    </div>

    <!-- 載入中提示 -->
    <div v-if="isLoading" class="d-flex justify-content-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <form v-else @submit.prevent="submitForm" class="menu-form">
      <!-- 菜單基本資訊 -->
      <div class="card mb-4">
        <div class="card-header bg-light">
          <h5 class="mb-0">基本資訊</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label for="menuName" class="form-label required">菜單名稱</label>
                <input
                  v-model="formData.name"
                  type="text"
                  class="form-control"
                  id="menuName"
                  :class="{ 'is-invalid': errors.name }"
                  placeholder="輸入菜單名稱"
                  @blur="validateMenuName"
                />
                <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="mb-3">
                <label for="menuType" class="form-label required">菜單類型</label>
                <select
                  v-model="formData.menuType"
                  class="form-select"
                  id="menuType"
                  :class="{ 'is-invalid': errors.menuType }"
                  :disabled="isEditMode"
                  @change="onMenuTypeChange"
                >
                  <option value="food">現金購買餐點</option>
                  <option value="cash_coupon">現金購買預購券</option>
                  <option value="point_exchange">點數兌換</option>
                </select>
                <div class="invalid-feedback" v-if="errors.menuType">{{ errors.menuType }}</div>
                <div class="form-text">
                  {{ getMenuTypeDescription(formData.menuType) }}
                  <span v-if="isEditMode" class="text-muted">（編輯模式下無法更改菜單類型）</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-0">
            <div class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                id="menuActive"
                v-model="formData.isActive"
              />
              <label class="form-check-label" for="menuActive">立即啟用菜單</label>
            </div>
            <div class="form-text">
              啟用後，顧客可以在線上瀏覽此菜單並下單。同類型菜單一次只能有一個啟用。
            </div>
          </div>
        </div>
      </div>

      <!-- 菜單類別管理 -->
      <div class="card mb-4">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 class="mb-0">菜單分類</h5>
          <button type="button" class="btn btn-sm btn-primary" @click="autoAddDeveryPrice">
            <i class="bi bi-plus-circle me-1"></i>外送價格自動設定
          </button>
          <button type="button" class="btn btn-sm btn-primary" @click="addCategory">
            <i class="bi bi-plus-circle me-1"></i>新增分類
          </button>
        </div>
        <div class="card-body">
          <!-- 分類列表 -->
          <div v-if="formData.categories.length > 0">
            <div
              v-for="(category, categoryIndex) in formData.categories"
              :key="categoryIndex"
              class="category-item card mb-3"
            >
              <div
                class="card-header bg-light d-flex justify-content-between align-items-center py-2"
              >
                <h6 class="mb-0">{{ category.name || `未命名分類 #${categoryIndex + 1}` }}</h6>
                <div class="btn-group btn-group-sm">
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="moveCategory(categoryIndex, -1)"
                    :disabled="categoryIndex === 0"
                  >
                    <i class="bi bi-arrow-up"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="moveCategory(categoryIndex, 1)"
                    :disabled="categoryIndex === formData.categories.length - 1"
                  >
                    <i class="bi bi-arrow-down"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-danger"
                    @click="removeCategory(categoryIndex)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              <div class="card-body">
                <!-- 分類編輯區塊 -->
                <div class="mb-3">
                  <label :for="`category-name-${categoryIndex}`" class="form-label required"
                    >分類名稱</label
                  >
                  <input
                    type="text"
                    class="form-control"
                    :id="`category-name-${categoryIndex}`"
                    v-model="category.name"
                    :class="{ 'is-invalid': getCategoryError(categoryIndex, 'name') }"
                    placeholder="例如：主餐、飲料、甜點"
                  />
                  <div class="invalid-feedback" v-if="getCategoryError(categoryIndex, 'name')">
                    {{ getCategoryError(categoryIndex, 'name') }}
                  </div>
                </div>

                <div class="mb-3">
                  <label :for="`category-desc-${categoryIndex}`" class="form-label">分類描述</label>
                  <textarea
                    class="form-control"
                    :id="`category-desc-${categoryIndex}`"
                    v-model="category.description"
                    rows="2"
                    placeholder="可選的分類描述"
                  ></textarea>
                </div>

                <!-- 商品列表 -->
                <h6 class="mb-2">商品項目</h6>
                <div class="table-responsive mb-3">
                  <table class="table table-bordered table-hover">
                    <thead class="table-light">
                      <tr>
                        <th style="width: 40%">{{ getItemColumnTitle() }}</th>
                        <th style="width: 15%" v-if="showCashPriceColumn()">外送價格</th>
                        <th style="width: 15%" v-if="showPointPriceColumn()">點數價格覆蓋</th>
                        <th style="width: 10%">狀態</th>
                        <th style="width: 20%">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, itemIndex) in category.items" :key="itemIndex">
                        <!-- 商品選擇 -->
                        <td>
                          <!-- 餐點選擇 (現金購買餐點) -->
                          <select
                            v-if="formData.menuType === 'food'"
                            :value="getDishTemplateId(item)"
                            @change="
                              updateDishTemplate(categoryIndex, itemIndex, $event.target.value)
                            "
                            class="form-select form-select-sm"
                            :class="{
                              'is-invalid': getItemError(categoryIndex, itemIndex, 'dishTemplate'),
                            }"
                          >
                            <option value="">選擇餐點</option>
                            <option
                              v-for="template in dishTemplates"
                              :key="template._id"
                              :value="template._id"
                            >
                              {{ template.name }} - {{ formatPrice(template.basePrice) }}
                            </option>
                          </select>

                          <!-- Bundle 選擇 (現金購買預購券/點數兌換) -->
                          <select
                            v-else
                            :value="getBundleId(item)"
                            @change="updateBundle(categoryIndex, itemIndex, $event.target.value)"
                            class="form-select form-select-sm"
                            :class="{
                              'is-invalid': getItemError(categoryIndex, itemIndex, 'bundle'),
                            }"
                          >
                            <option value="">
                              選擇{{
                                formData.menuType === 'cash_coupon' ? '預購券套餐' : '兌換套餐'
                              }}
                            </option>
                            <option
                              v-for="bundle in getFilteredBundles()"
                              :key="bundle._id"
                              :value="bundle._id"
                            >
                              {{ bundle.name }} - {{ getBundlePriceDisplay(bundle) }}
                            </option>
                          </select>

                          <div
                            class="invalid-feedback"
                            v-if="
                              getItemError(categoryIndex, itemIndex, 'dishTemplate') ||
                              getItemError(categoryIndex, itemIndex, 'bundle')
                            "
                          >
                            {{
                              getItemError(categoryIndex, itemIndex, 'dishTemplate') ||
                              getItemError(categoryIndex, itemIndex, 'bundle')
                            }}
                          </div>
                        </td>

                        <!-- 現金價格覆蓋（僅餐點類型支援） -->
                        <td v-if="showCashPriceColumn()">
                          <div class="input-group input-group-sm">
                            <span class="input-group-text">$</span>
                            <input
                              type="number"
                              class="form-control"
                              v-model.number="item.priceOverride"
                              min="0"
                              placeholder="留空使用原價"
                              step="0.01"
                            />
                          </div>
                          <div class="form-text small">用於促銷或差異化定價</div>
                        </td>

                        <!-- 點數價格覆蓋 -->
                        <td v-if="showPointPriceColumn()">
                          <input
                            type="number"
                            class="form-control form-control-sm"
                            v-model.number="item.pointOverride"
                            min="0"
                            placeholder="原點數"
                          />
                        </td>

                        <!-- 狀態 -->
                        <td>
                          <div class="form-check form-switch">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              :id="`item-status-${categoryIndex}-${itemIndex}`"
                              v-model="item.isShowing"
                            />
                            <label
                              class="form-check-label small"
                              :for="`item-status-${categoryIndex}-${itemIndex}`"
                            >
                              {{ item.isShowing ? '顯示' : '隱藏' }}
                            </label>
                          </div>
                        </td>

                        <!-- 操作 -->
                        <td>
                          <div class="btn-group btn-group-sm">
                            <button
                              type="button"
                              class="btn btn-outline-secondary"
                              @click="moveItem(categoryIndex, itemIndex, -1)"
                              :disabled="itemIndex === 0"
                            >
                              <i class="bi bi-arrow-up"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-outline-secondary"
                              @click="moveItem(categoryIndex, itemIndex, 1)"
                              :disabled="itemIndex === category.items.length - 1"
                            >
                              <i class="bi bi-arrow-down"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-outline-danger"
                              @click="removeItem(categoryIndex, itemIndex)"
                            >
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="category.items.length === 0">
                        <td :colspan="getTableColumnCount()" class="text-center py-3 text-muted">
                          此分類尚未添加商品
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm"
                  @click="addItem(categoryIndex)"
                >
                  <i class="bi bi-plus-lg me-1"></i>添加{{ getItemButtonText() }}
                </button>
              </div>
            </div>
          </div>

          <!-- 無分類提示 -->
          <div v-else class="text-center py-4 bg-light rounded">
            <p class="mb-2">尚未添加任何分類</p>
            <button type="button" class="btn btn-primary" @click="addCategory">
              <i class="bi bi-plus-circle me-1"></i>新增第一個分類
            </button>
          </div>
        </div>
      </div>

      <!-- 錯誤訊息顯示 -->
      <div v-if="formErrors.length > 0" class="alert alert-danger mb-3">
        <p class="mb-1 fw-bold">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>請修正以下錯誤：
        </p>
        <ul class="mb-0 ps-3">
          <li v-for="(error, index) in formErrors" :key="index">{{ error }}</li>
        </ul>
      </div>

      <!-- 提交結果訊息 -->
      <div v-if="successMessage" class="alert alert-success mb-3">
        <i class="bi bi-check-circle-fill me-2"></i>{{ successMessage }}
      </div>

      <!-- 表單按鈕 -->
      <div class="d-flex justify-content-between">
        <button type="button" class="btn btn-secondary" @click="resetForm" :disabled="isSubmitting">
          <i class="bi bi-arrow-counterclockwise me-1"></i>重置
        </button>

        <button type="submit" class="btn btn-success" :disabled="!isFormValid || isSubmitting">
          <span
            v-if="isSubmitting"
            class="spinner-border spinner-border-sm me-2"
            role="status"
          ></span>
          <i v-else class="bi bi-save me-1"></i>
          {{ isSubmitting ? '儲存中...' : '儲存菜單' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api'
import { getMenuTypeDescription, formatPrice, validateMenuForm } from './menuUtils'

// 路由相關
const router = useRouter()
const route = useRoute()
const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.storeId)
const menuId = computed(() => route.params.menuId)
const isEditMode = computed(() => !!menuId.value)

// 店鋪資訊
const store = ref(null)

// 狀態變數
const isLoading = ref(true)
const isSubmitting = ref(false)
const successMessage = ref('')
const formErrors = ref([])
const dishTemplates = ref([])
const bundles = ref([])

// 表單數據
const formData = reactive({
  name: '',
  menuType: 'food',
  store: '',
  brand: '',
  categories: [],
  isActive: true,
})

// 錯誤訊息
const errors = reactive({
  name: '',
  menuType: '',
  categories: [],
})

// 檢查表單是否有效
const isFormValid = computed(() => {
  const validation = validateMenuForm(formData)
  return validation.isValid
})

// 菜單類型改變處理
const onMenuTypeChange = () => {
  // 清空所有分類的商品，因為類型改變了
  formData.categories.forEach((category) => {
    if (category.items) {
      category.items.forEach((item) => {
        // 重置商品選擇
        item.dishTemplate = ''
        item.bundle = ''

        // 根據新的菜單類型設定價格覆蓋欄位
        if (formData.menuType === 'food') {
          item.priceOverride = null // 只有餐點類型支援價格覆蓋
        } else {
          // Bundle 類型移除價格覆蓋欄位
          delete item.priceOverride
          delete item.pointOverride
        }
      })
    }
  })
}

// 獲取商品欄位標題
const getItemColumnTitle = () => {
  const titles = {
    food: '餐點選擇',
    cash_coupon: '預購券套餐選擇',
    point_exchange: '兌換套餐選擇',
  }
  return titles[formData.menuType] || '商品選擇'
}

// 獲取添加按鈕文字
const getItemButtonText = () => {
  const texts = {
    food: '餐點',
    cash_coupon: '預購券套餐',
    point_exchange: '兌換套餐',
  }
  return texts[formData.menuType] || '商品'
}

// 是否顯示現金價格欄位（只有餐點類型支援價格覆蓋）
const showCashPriceColumn = () => {
  return formData.menuType === 'food'
}

// 是否顯示點數價格欄位（Bundle 不支援價格覆蓋）
const showPointPriceColumn = () => {
  return false
}

// 獲取表格欄位數量
const getTableColumnCount = () => {
  let count = 3 // 商品選擇 + 狀態 + 操作
  if (showCashPriceColumn()) count++
  if (showPointPriceColumn()) count++
  return count
}

// 根據菜單類型篩選 Bundle
const getFilteredBundles = () => {
  if (formData.menuType === 'cash_coupon') {
    // 現金購買預購券：需要有現金價格的 Bundle
    return bundles.value.filter(
      (bundle) =>
        bundle.cashPrice && (bundle.cashPrice.selling > 0 || bundle.cashPrice.original > 0),
    )
  } else if (formData.menuType === 'point_exchange') {
    // 點數兌換：需要有點數價格的 Bundle
    return bundles.value.filter(
      (bundle) =>
        bundle.pointPrice && (bundle.pointPrice.selling > 0 || bundle.pointPrice.original > 0),
    )
  }
  return bundles.value
}

// 獲取 Bundle 價格顯示
const getBundlePriceDisplay = (bundle) => {
  if (formData.menuType === 'cash_coupon' && bundle.cashPrice) {
    const price = bundle.cashPrice.selling || bundle.cashPrice.original || 0
    return formatPrice(price)
  } else if (formData.menuType === 'point_exchange' && bundle.pointPrice) {
    const price = bundle.pointPrice.selling || bundle.pointPrice.original || 0
    return `${price} 點`
  }
  return '未設定價格'
}

// 輔助函數：獲取餐點模板ID
const getDishTemplateId = (item) => {
  if (!item.dishTemplate) return ''
  return typeof item.dishTemplate === 'object' ? item.dishTemplate._id : item.dishTemplate
}

// 輔助函數：獲取套餐ID
const getBundleId = (item) => {
  if (!item.bundle) return ''
  return typeof item.bundle === 'object' ? item.bundle._id : item.bundle
}

// 更新餐點模板選擇
const updateDishTemplate = (categoryIndex, itemIndex, value) => {
  const item = formData.categories[categoryIndex].items[itemIndex]
  item.dishTemplate = value
  item.bundle = '' // 清除bundle選擇
}

// 更新套餐選擇
const updateBundle = (categoryIndex, itemIndex, value) => {
  const item = formData.categories[categoryIndex].items[itemIndex]
  item.bundle = value
  item.dishTemplate = '' // 清除dishTemplate選擇
}

// 獲取分類錯誤訊息
const getCategoryError = (categoryIndex, field) => {
  if (!errors.categories || !errors.categories[categoryIndex]) {
    return ''
  }
  return errors.categories[categoryIndex][field] || ''
}

// 獲取商品錯誤訊息
const getItemError = (categoryIndex, itemIndex, field) => {
  if (
    !errors.categories ||
    !errors.categories[categoryIndex] ||
    !errors.categories[categoryIndex].items ||
    !errors.categories[categoryIndex].items[itemIndex]
  ) {
    return ''
  }
  return errors.categories[categoryIndex].items[itemIndex][field] || ''
}

// 驗證菜單名稱
const validateMenuName = () => {
  if (!formData.name.trim()) {
    errors.name = '請輸入菜單名稱'
    return false
  }
  errors.name = ''
  return true
}

// 清理商品資料，移除空值欄位
const cleanItemData = (item) => {
  const cleanedItem = { ...item }

  // 根據菜單類型設定 itemType 和清理不需要的欄位
  if (formData.menuType === 'food') {
    cleanedItem.itemType = 'dish'
    delete cleanedItem.bundle
    delete cleanedItem.pointOverride // 餐點不支援點數覆蓋
    if (typeof cleanedItem.dishTemplate === 'object' && cleanedItem.dishTemplate._id) {
      cleanedItem.dishTemplate = cleanedItem.dishTemplate._id
    }
  } else {
    cleanedItem.itemType = 'bundle'
    delete cleanedItem.dishTemplate
    delete cleanedItem.priceOverride // Bundle 不支援價格覆蓋
    delete cleanedItem.pointOverride // Bundle 不支援價格覆蓋
    if (typeof cleanedItem.bundle === 'object' && cleanedItem.bundle._id) {
      cleanedItem.bundle = cleanedItem.bundle._id
    }
  }

  // 清理空值
  Object.keys(cleanedItem).forEach((key) => {
    if (cleanedItem[key] === '' || cleanedItem[key] === null || cleanedItem[key] === undefined) {
      delete cleanedItem[key]
    }
  })

  return cleanedItem
}

// 獲取店鋪資料
const fetchStoreData = async () => {
  if (!storeId.value) return

  try {
    const response = await api.store.getStoreById({ brandId: brandId.value, id: storeId.value })
    if (response && response.store) {
      store.value = response.store
      formData.brand = store.value.brand
      formData.store = storeId.value
    }
  } catch (err) {
    console.error('獲取店鋪資料時發生錯誤:', err)
    formErrors.value.push('獲取店鋪資料時發生錯誤，請稍後再試')
  }
}

// 獲取餐點模板資料
const fetchDishTemplates = async () => {
  if (!brandId.value) return

  try {
    const response = await api.dish.getAllDishTemplates({ brandId: brandId.value })
    if (response && response.templates) {
      dishTemplates.value = response.templates
    }
  } catch (error) {
    console.error('獲取餐點模板失敗:', error)
    formErrors.value.push('無法獲取餐點資料，請稍後再試')
  }
}

// 獲取套餐資料
const fetchBundles = async () => {
  if (!brandId.value) return

  try {
    const response = await api.bundle.getAllBundles({ brandId: brandId.value })
    if (response && response.bundles) {
      bundles.value = response.bundles
    }
  } catch (error) {
    console.error('獲取套餐資料失敗:', error)
    // 不顯示錯誤，因為 bundle 功能可能還沒實作
    bundles.value = []
  }
}

// 獲取菜單資料（編輯模式）
const fetchMenuData = async () => {
  if (!isEditMode.value || !storeId.value || !menuId.value) return

  try {
    const response = await api.menu.getMenuById({
      brandId: brandId.value,
      storeId: storeId.value,
      menuId: menuId.value,
      includeUnpublished: true,
    })

    if (response && response.menu) {
      const menu = response.menu

      formData.name = menu.name || ''
      formData.menuType = menu.menuType || 'food'
      formData.isActive = menu.isActive !== undefined ? menu.isActive : true

      // 處理分類資料
      if (menu.categories && menu.categories.length > 0) {
        formData.categories = menu.categories.map((category) => ({
          ...category,
          items: category.items
            ? category.items.map((item) => {
                // 根據菜單類型設定正確的 itemType
                const newItem = { ...item }
                if (formData.menuType === 'food') {
                  newItem.itemType = 'dish'
                } else {
                  newItem.itemType = 'bundle'
                }
                return newItem
              })
            : [],
        }))
      }
    } else {
      formErrors.value.push('獲取菜單資料失敗')
    }
  } catch (err) {
    console.error('獲取菜單資料時發生錯誤:', err)
    formErrors.value.push('獲取菜單資料時發生錯誤，請稍後再試')
  }
}

// 添加分類
const addCategory = () => {
  formData.categories.push({
    name: '',
    description: '',
    items: [],
    order: formData.categories.length,
  })
}

const autoAddDeveryPrice = () => {
  formData.categories.forEach((category) => {
    category.items.forEach((item) => {
      if (item.priceOverride) return
      item.priceOverride = (item.dishTemplate.basePrice / 0.66).toFixed(0)
    })
  })
}

// 移除分類
const removeCategory = (index) => {
  formData.categories.splice(index, 1)
  formData.categories.forEach((category, idx) => {
    category.order = idx
  })
}

// 移動分類順序
const moveCategory = (categoryIndex, direction) => {
  const newIndex = categoryIndex + direction
  if (newIndex < 0 || newIndex >= formData.categories.length) return

  const temp = formData.categories[categoryIndex]
  formData.categories[categoryIndex] = formData.categories[newIndex]
  formData.categories[newIndex] = temp

  formData.categories[categoryIndex].order = categoryIndex
  formData.categories[newIndex].order = newIndex
}

// 添加商品
const addItem = (categoryIndex) => {
  const category = formData.categories[categoryIndex]

  if (!category.items) {
    category.items = []
  }

  const newItem = {
    isShowing: true,
    order: category.items.length,
  }

  // 根據菜單類型設定 itemType 和初始化對應欄位
  if (formData.menuType === 'food') {
    newItem.itemType = 'dish'
    newItem.dishTemplate = ''
    newItem.priceOverride = null // 只有餐點類型支援價格覆蓋
  } else {
    newItem.itemType = 'bundle'
    newItem.bundle = ''
    // Bundle 類型不支援價格覆蓋，依賴 Bundle 本身的定價
  }

  category.items.push(newItem)
}

// 移除商品
const removeItem = (categoryIndex, itemIndex) => {
  formData.categories[categoryIndex].items.splice(itemIndex, 1)
  formData.categories[categoryIndex].items.forEach((item, idx) => {
    item.order = idx
  })
}

// 移動商品順序
const moveItem = (categoryIndex, itemIndex, direction) => {
  const items = formData.categories[categoryIndex].items
  const newIndex = itemIndex + direction

  if (newIndex < 0 || newIndex >= items.length) return

  const temp = items[itemIndex]
  items[itemIndex] = items[newIndex]
  items[newIndex] = temp

  items[itemIndex].order = itemIndex
  items[newIndex].order = newIndex
}

// 驗證整個表單
const validateForm = () => {
  const validation = validateMenuForm(formData)

  // 更新錯誤狀態
  errors.name = validation.errors.name
  errors.menuType = validation.errors.menuType
  errors.categories = validation.errors.categories

  // 生成錯誤訊息列表
  formErrors.value = []

  if (validation.errors.name) {
    formErrors.value.push(validation.errors.name)
  }

  if (validation.errors.menuType) {
    formErrors.value.push(validation.errors.menuType)
  }

  if (!formData.categories || formData.categories.length === 0) {
    formErrors.value.push('菜單至少需要一個分類')
  }

  // 檢查分類和商品錯誤
  formData.categories.forEach((category, categoryIndex) => {
    if (!category.name || !category.name.trim()) {
      formErrors.value.push(`分類 #${categoryIndex + 1}: 請輸入分類名稱`)
    }

    if (!category.items || category.items.length === 0) {
      formErrors.value.push(`分類 "${category.name || `#${categoryIndex + 1}`}" 至少需要一個商品`)
    } else {
      category.items.forEach((item, itemIndex) => {
        if (formData.menuType === 'food' && !getDishTemplateId(item)) {
          formErrors.value.push(
            `分類 "${category.name || `#${categoryIndex + 1}`}" 中的商品 #${itemIndex + 1}: 請選擇餐點`,
          )
        } else if (formData.menuType !== 'food' && !getBundleId(item)) {
          formErrors.value.push(
            `分類 "${category.name || `#${categoryIndex + 1}`}" 中的商品 #${itemIndex + 1}: 請選擇套餐`,
          )
        }
      })
    }
  })

  return validation.isValid && formErrors.value.length === 0
}

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    fetchMenuData()
  } else {
    formData.name = ''
    formData.menuType = 'food'
    formData.categories = []
    formData.isActive = true
  }

  errors.name = ''
  errors.menuType = ''
  errors.categories = []
  formErrors.value = []
  successMessage.value = ''
}

// 提交表單
const submitForm = async () => {
  if (!validateForm()) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  isSubmitting.value = true
  successMessage.value = ''
  formErrors.value = []

  try {
    const submitData = {
      name: formData.name,
      menuType: formData.menuType,
      brand: formData.brand,
      store: formData.store,
      categories: formData.categories.map((category) => ({
        ...category,
        items: category.items.map((item) => cleanItemData(item)),
      })),
      isActive: formData.isActive,
    }

    let response

    if (isEditMode.value) {
      response = await api.menu.updateMenu({
        brandId: brandId.value,
        storeId: storeId.value,
        menuId: menuId.value,
        data: submitData,
      })
      successMessage.value = '菜單更新成功！'
    } else {
      response = await api.menu.createMenu({
        brandId: brandId.value,
        storeId: storeId.value,
        data: submitData,
      })
      successMessage.value = '菜單創建成功！'
    }

    setTimeout(() => {
      router.push(`/admin/${brandId.value}/menus/store/${storeId.value}`)
    }, 1500)
  } catch (error) {
    console.error('儲存菜單時發生錯誤:', error)

    if (error.response && error.response.data) {
      const { message } = error.response.data
      if (message) {
        formErrors.value.push(`錯誤: ${message}`)
      } else {
        formErrors.value.push('儲存菜單時發生錯誤，請稍後再試')
      }
    } else {
      formErrors.value.push('儲存菜單時發生錯誤，請稍後再試')
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isSubmitting.value = false
  }
}

// 監聽ID變化
watch([storeId, menuId, brandId], ([newStoreId, newMenuId, newBrandId]) => {
  if (newStoreId && newBrandId) {
    isLoading.value = true

    Promise.all([
      fetchStoreData(),
      fetchDishTemplates(),
      fetchBundles(),
      isEditMode.value ? fetchMenuData() : Promise.resolve(),
    ]).finally(() => {
      isLoading.value = false
    })
  }
})

// 生命週期鉤子
onMounted(() => {
  isLoading.value = true

  Promise.all([
    fetchStoreData(),
    fetchDishTemplates(),
    fetchBundles(),
    isEditMode.value ? fetchMenuData() : Promise.resolve(),
  ]).finally(() => {
    isLoading.value = false
  })
})
</script>

<style scoped>
.required::after {
  content: ' *';
  color: #dc3545;
}

.menu-form {
  max-width: 100%;
}

.category-item {
  transition: border-color 0.3s;
}

.category-item:hover {
  border-color: #0d6efd;
}

.table th,
.table td {
  vertical-align: middle;
}

.table-light {
  background-color: #f8f9fa;
}

.invalid-feedback {
  display: block;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
}

.form-switch .form-check-input {
  margin-top: 0.2rem;
}
</style>
