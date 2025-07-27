<template>
  <div class="menu-order-container">
    <!-- 加載提示 -->
    <div v-if="isLoading" class="loading-section">
      <div class="d-flex justify-content-center align-items-center py-5">
        <div class="spinner-border" :class="spinnerClass" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
        <span class="ms-2">載入菜單資料中...</span>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div v-if="errorMessage" class="alert alert-danger m-3" role="alert">
      {{ errorMessage }}
      <button class="btn btn-outline-danger btn-sm ms-2" @click="loadMenuData">重試</button>
    </div>

    <div v-if="!isLoading && !errorMessage" class="main-content">
      <!-- 左側類別導航欄 -->
      <div class="category-sidebar">
        <div class="category-nav">
          <div
            v-for="category in menuCategories"
            :key="category._id"
            class="category-nav-item"
            :class="{ active: selectedCategoryId === category._id }"
            @click="selectCategory(category._id)"
          >
            <div class="category-nav-content">
              <div class="category-name">{{ category.name }}</div>
              <div class="category-count">{{ category.items?.length || 0 }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側內容區域 -->
      <div class="content-area">
        <div class="content-sections">
          <!-- 菜單選擇區域 -->
          <div class="menu-section" :class="menuSectionClass">
            <div class="section-content">
              <!-- 顯示選中類別的項目 -->
              <div v-if="selectedCategory" class="mb-3">
                <h5 class="category-title mb-3" :style="{ borderBottomColor: themeColor }">
                  {{ selectedCategory.name }}
                </h5>
                <div class="menu-items-grid">
                  <div
                    v-for="item in selectedCategory.items"
                    :key="item._id"
                    class="menu-item-card"
                    :class="{
                      'selected-dish': isItemSelected(item),
                      'sold-out': isItemSoldOut(item),
                    }"
                    @click="handleItemClick(item)"
                  >
                    <div class="card h-100">
                      <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <h6 class="card-title mb-0 text-truncate flex-grow-1 me-2">
                            {{ getItemName(item) }}
                          </h6>
                          <!-- 庫存狀態顯示 (只對餐點顯示) -->
                          <div
                            v-if="
                              item.itemType === 'dish' &&
                              getInventoryInfo(getItemId(item)) &&
                              (getInventoryInfo(getItemId(item)).enableAvailableStock ||
                                getInventoryInfo(getItemId(item)).isSoldOut)
                            "
                            class="inventory-badge"
                          >
                            <span
                              v-if="getInventoryInfo(getItemId(item)).isSoldOut"
                              class="badge bg-danger text-white"
                            >
                              暫停供應
                            </span>
                            <span
                              v-else-if="getInventoryInfo(getItemId(item)).enableAvailableStock"
                              class="badge"
                              :class="getStockBadgeClass(getItemId(item))"
                            >
                              {{ getInventoryInfo(getItemId(item)).availableStock }}
                            </span>
                          </div>
                        </div>
                        <p class="card-text price mt-auto">${{ getItemPrice(item) }}</p>
                        <!-- 售完遮罩 -->
                        <div v-if="isItemSoldOut(item)" class="sold-out-overlay">
                          <span
                            class="sold-out-text"
                            :class="{
                              suspended:
                                item.itemType === 'dish' &&
                                getInventoryInfo(getItemId(item))?.isSoldOut,
                            }"
                          >
                            {{
                              item.itemType === 'dish' &&
                              getInventoryInfo(getItemId(item))?.isSoldOut
                                ? '暫停供應'
                                : '售完'
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 當沒有選中類別時的提示 -->
              <div v-else class="text-center py-4">
                <p class="text-muted">請從左側選擇餐點類別</p>
              </div>
            </div>
          </div>

          <!-- 選項設定區域 - 只在編輯模式且選擇餐點時顯示 -->
          <div v-if="counterStore.isEditMode && selectedDish" class="options-section">
            <div class="section-content">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="mb-0 fs-6 fw-semibold">{{ selectedDish.name }} - 選項設定</h5>
                <div class="d-flex align-items-center">
                  <span class="text-danger fw-semibold">${{ currentPrice }}</span>
                </div>
              </div>

              <!-- 選項類別 -->
              <div
                v-for="optionCategory in dishOptionCategories"
                :key="optionCategory._id"
                class="mb-3"
              >
                <h6 class="option-category-title mb-3" :style="{ borderLeftColor: themeColor }">
                  {{ optionCategory.name }}
                </h6>

                <!-- 單選類型 -->
                <div v-if="optionCategory.inputType === 'single'" class="row g-2">
                  <div v-for="option in optionCategory.options" :key="option._id" class="col-auto">
                    <div
                      class="card p-2 text-center option-card"
                      :class="{
                        selected: isOptionSelected(optionCategory._id, getOptionId(option)),
                      }"
                      @click="selectOption(optionCategory, option, 'single')"
                    >
                      <div class="option-name">{{ getOptionName(option) }}</div>
                      <div v-if="getOptionPrice(option) > 0" class="option-price">
                        +${{ getOptionPrice(option) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 複選類型 -->
                <div v-else-if="optionCategory.inputType === 'multiple'" class="row g-2">
                  <div v-for="option in optionCategory.options" :key="option._id" class="col-auto">
                    <div
                      class="card p-2 text-center option-card"
                      :class="{
                        selected: isOptionSelected(optionCategory._id, getOptionId(option)),
                      }"
                      @click="selectOption(optionCategory, option, 'multiple')"
                    >
                      <div class="option-name">{{ getOptionName(option) }}</div>
                      <div v-if="getOptionPrice(option) > 0" class="option-price">
                        +${{ getOptionPrice(option) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 備註輸入 -->
              <div class="mb-3">
                <label class="form-label fw-semibold">備註</label>
                <textarea
                  class="form-control"
                  rows="2"
                  placeholder="特殊要求..."
                  v-model="itemNote"
                  @input="updateOptions"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useCounterStore } from '@/stores/counter'
import api from '@/api'

const props = defineProps({
  brandId: {
    type: String,
    required: true,
  },
  storeId: {
    type: String,
    required: true,
  },
  orderType: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  themeColor: {
    type: String,
    default: '#007bff',
  },
  themeClass: {
    type: String,
    default: 'primary',
  },
})

const counterStore = useCounterStore()

// 響應式資料
const isLoading = ref(false)
const isLoadingInventory = ref(false)
const errorMessage = ref('')
const selectedCategoryId = ref(null)
const selectedDish = ref(null)
const selectedOptions = ref({})
const itemNote = ref('')
const inventoryData = ref({})

// 計算屬性
const headerClass = computed(() => {
  return `bg-${props.themeClass}`
})

const spinnerClass = computed(() => {
  return `text-${props.themeClass}`
})

const menuSectionClass = computed(() => {
  return counterStore.isEditMode ? 'editing-mode' : 'full-mode'
})

const menuCategories = computed(() => {
  return counterStore.menuData?.categories || []
})

const selectedCategory = computed(() => {
  if (!selectedCategoryId.value) return null
  return menuCategories.value.find((cat) => cat._id === selectedCategoryId.value)
})

const dishOptionCategories = computed(() => {
  if (!selectedDish.value) return []

  const categories = []
  selectedDish.value.optionCategories.forEach((categoryRef) => {
    const category = counterStore.optionCategories.find((cat) => cat._id === categoryRef.categoryId)
    if (category) {
      categories.push({
        ...category,
        order: categoryRef.order,
      })
    }
  })

  return categories.sort((a, b) => a.order - b.order)
})

const currentPrice = computed(() => {
  if (!selectedDish.value) return 0

  let price = selectedDish.value.basePrice

  // 加上選項價格
  Object.values(selectedOptions.value).forEach((optionIds) => {
    if (Array.isArray(optionIds)) {
      optionIds.forEach((optionId) => {
        const option = findOptionById(optionId)
        if (option) {
          price += getOptionPrice(option)
        }
      })
    }
  })

  return price
})

// 項目處理方法
const getItemName = (item) => {
  if (item.itemType === 'dish') {
    return item.dishTemplate?.name || '未命名餐點'
  } else if (item.itemType === 'bundle') {
    return item.bundle?.name || '未命名套餐'
  }
  return '未知商品'
}

const getItemId = (item) => {
  if (item.itemType === 'dish') {
    return item.dishTemplate?._id
  } else if (item.itemType === 'bundle') {
    return item.bundle?._id
  }
  return null
}

const getItemPrice = (item) => {
  if (item.itemType === 'dish') {
    return item.priceOverride || item.dishTemplate?.basePrice || 0
  } else if (item.itemType === 'bundle') {
    return item.priceOverride || item.bundle?.sellingPrice || 0
  }
  return 0
}

const isItemSelected = (item) => {
  if (item.itemType === 'dish') {
    return selectedDish.value && selectedDish.value._id === item.dishTemplate?._id
  }
  // 套餐目前不支援選項編輯，所以不會被選中
  return false
}

const isItemSoldOut = (item) => {
  // 套餐不檢查庫存
  if (item.itemType === 'bundle') {
    return false
  }

  // 餐點庫存檢查
  if (item.itemType === 'dish') {
    return isDishSoldOut(getItemId(item))
  }

  return false
}

const handleItemClick = (item) => {
  // 檢查項目是否售完
  if (isItemSoldOut(item)) {
    return
  }

  if (item.itemType === 'dish') {
    // 處理餐點選擇
    handleDishClick(item.dishTemplate)
  } else if (item.itemType === 'bundle') {
    // 處理套餐選擇 - 直接加入購物車
    quickSelectBundle(item.bundle)
  }
}

// 統一的選項資料存取方法
const getOptionId = (option) => {
  return option.refOption ? option.refOption._id : option._id
}

const getOptionName = (option) => {
  return option.refOption ? option.refOption.name : option.name
}

const getOptionPrice = (option) => {
  return option.refOption ? option.refOption.price || 0 : option.price || 0
}

// 庫存相關方法
const getInventoryInfo = (dishTemplateId) => {
  return inventoryData.value[dishTemplateId] || null
}

const isDishSoldOut = (dishTemplateId) => {
  const inventory = getInventoryInfo(dishTemplateId)
  if (!inventory) return false

  // 最高優先級：手動設為售完
  if (inventory.isSoldOut) {
    return true
  }

  // 次級：如果啟用了可用庫存機制，檢查可用庫存是否為 0
  if (inventory.enableAvailableStock) {
    return inventory.availableStock <= 0
  }

  return false
}

const getStockBadgeClass = (dishTemplateId) => {
  const inventory = getInventoryInfo(dishTemplateId)
  if (!inventory) return ''

  // 如果手動售完，直接返回紅色
  if (inventory.isSoldOut) {
    return 'bg-danger text-white'
  }

  // 如果沒有啟用可用庫存，不顯示badge
  if (!inventory.enableAvailableStock) return ''

  if (inventory.availableStock <= 0) {
    return 'bg-danger text-white'
  } else if (inventory.availableStock <= 5) {
    return 'bg-warning text-dark'
  } else {
    return 'bg-success text-white'
  }
}

// 載入庫存資料
const loadInventoryData = async () => {
  if (!props.brandId || !props.storeId || !menuCategories.value.length) return

  isLoadingInventory.value = true

  try {
    // 獲取店鋪所有餐點庫存
    const response = await api.inventory.getStoreInventory({
      brandId: props.brandId,
      storeId: props.storeId,
      inventoryType: 'DishTemplate',
    })

    if (response.success) {
      const inventoryMap = {}

      // 將庫存資料按餐點模板 ID 建立對應關係
      response.inventory.forEach((item) => {
        if (item.dish && item.dish._id) {
          inventoryMap[item.dish._id] = {
            inventoryId: item._id,
            enableAvailableStock: item.enableAvailableStock,
            availableStock: item.availableStock,
            totalStock: item.totalStock,
            isSoldOut: item.isSoldOut,
            isInventoryTracked: item.isInventoryTracked,
          }
        }
      })

      inventoryData.value = inventoryMap
    }
  } catch (error) {
    console.error('載入庫存資料失敗:', error)
  } finally {
    isLoadingInventory.value = false
  }
}

// 方法
const loadMenuData = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await counterStore.fetchMenuData(props.brandId, props.storeId)
    // 載入完成後自動選擇第一個類別
    if (menuCategories.value.length > 0) {
      selectedCategoryId.value = menuCategories.value[0]._id
    }
    // 載入庫存資料
    await loadInventoryData()
  } catch (error) {
    console.error('載入菜單資料失敗:', error)
    errorMessage.value = error.message || '載入菜單資料失敗'
  } finally {
    isLoading.value = false
  }
}

// 選擇類別
const selectCategory = (categoryId) => {
  selectedCategoryId.value = categoryId
}

// 處理餐點點擊
const handleDishClick = (dishTemplate) => {
  // 檢查餐點是否售完
  if (isDishSoldOut(dishTemplate._id)) {
    return
  }

  // 原來的快速選擇邏輯
  quickSelectDish(dishTemplate)
}

// 快速選擇餐點（加入購物車並進入編輯模式）
const quickSelectDish = (dishTemplate) => {
  // 先加入購物車
  counterStore.quickAddDishToCart(dishTemplate)

  // 找到剛加入的項目（最後一個）
  const lastIndex = counterStore.cart.length - 1
  const lastItem = counterStore.cart[lastIndex]

  // 立即進入編輯模式
  counterStore.selectCurrentItem(lastItem, lastIndex)
}

// 快速選擇套餐（直接加入購物車）
const quickSelectBundle = (bundle) => {
  // 套餐直接加入購物車，不進入編輯模式
  counterStore.addBundleToCart(bundle)
}

// 選擇選項
const selectOption = (category, option, inputType) => {
  const categoryId = category._id
  const optionId = getOptionId(option)

  if (inputType === 'single') {
    // 單選：替換當前選項
    selectedOptions.value[categoryId] = [optionId]
  } else if (inputType === 'multiple') {
    // 複選：切換選項
    if (!selectedOptions.value[categoryId]) {
      selectedOptions.value[categoryId] = []
    }

    const currentOptions = selectedOptions.value[categoryId]
    const index = currentOptions.indexOf(optionId)

    if (index > -1) {
      // 移除選項
      currentOptions.splice(index, 1)
    } else {
      // 添加選項
      currentOptions.push(optionId)
    }
  }

  // 更新選項
  updateOptions()
}

// 檢查選項是否被選中
const isOptionSelected = (categoryId, optionId) => {
  const selectedOptionsForCategory = selectedOptions.value[categoryId]
  return selectedOptionsForCategory && selectedOptionsForCategory.includes(optionId)
}

// 根據ID查找選項
const findOptionById = (optionId) => {
  for (const category of counterStore.optionCategories) {
    for (const option of category.options) {
      if (getOptionId(option) === optionId) {
        return option
      }
    }
  }
  return null
}

// 更新選項
const updateOptions = () => {
  const options = []

  // 遍歷所有選項類別
  Object.entries(selectedOptions.value).forEach(([categoryId, optionIds]) => {
    if (optionIds && optionIds.length > 0) {
      const category = counterStore.optionCategories.find((cat) => cat._id === categoryId)
      if (category) {
        const selections = optionIds
          .map((optionId) => {
            const option = findOptionById(optionId)
            return option
              ? {
                  optionId: getOptionId(option),
                  name: getOptionName(option),
                  price: getOptionPrice(option),
                }
              : null
          })
          .filter(Boolean)

        if (selections.length > 0) {
          options.push({
            optionCategoryId: categoryId,
            optionCategoryName: category.name,
            selections: selections,
          })
        }
      }
    }
  })

  // 即時更新購物車
  counterStore.updateCartItemRealtime(options, itemNote.value)
}

// 設置編輯模式的選項
const setupEditMode = async (currentItem) => {
  if (!currentItem || !currentItem.dishInstance) return

  // 找到對應的餐點模板
  const template = counterStore.getDishTemplate(currentItem.dishInstance.templateId)

  if (!template) {
    console.error('找不到餐點模板:', currentItem.dishInstance.templateId)
    return
  }

  // 設置選中的餐點
  selectedDish.value = template

  // 設置備註
  itemNote.value = currentItem.note || ''

  // 等待下一個 tick 確保響應式系統準備好
  await nextTick()

  // 重建選項狀態
  const newSelectedOptions = {}

  if (currentItem.dishInstance.options) {
    currentItem.dishInstance.options.forEach((optionCategory) => {
      const optionIds = optionCategory.selections.map((selection) => {
        return selection.optionId
      })

      newSelectedOptions[optionCategory.optionCategoryId] = optionIds
    })
  }

  // 設置選項狀態
  selectedOptions.value = newSelectedOptions
}

// 生命周期
onMounted(async () => {
  if (!counterStore.menuData) {
    await loadMenuData()
  } else if (menuCategories.value.length > 0) {
    // 如果菜單資料已存在，自動選擇第一個類別
    selectedCategoryId.value = menuCategories.value[0]._id
    // 載入庫存資料
    await loadInventoryData()
  }
})

// 監聽編輯模式
watch(
  [
    () => counterStore.currentItem,
    () => counterStore.isEditMode,
    () => counterStore.optionCategories,
  ],
  async ([currentItem, isEditMode, optionCategories]) => {
    if (isEditMode && currentItem && currentItem.dishInstance && optionCategories.length > 0) {
      await setupEditMode(currentItem)
    } else if (!isEditMode) {
      // 退出編輯模式時清空狀態
      selectedDish.value = null
      selectedOptions.value = {}
      itemNote.value = ''
    }
  },
  { immediate: true },
)

// 監聽菜單類別變化，自動選擇第一個類別
watch(
  menuCategories,
  (newCategories) => {
    if (newCategories.length > 0 && !selectedCategoryId.value) {
      selectedCategoryId.value = newCategories[0]._id
    }
  },
  { immediate: true },
)

// 監聽菜單變化，載入庫存資料
watch(menuCategories, async (newCategories) => {
  if (newCategories.length > 0) {
    await loadInventoryData()
  }
})
</script>

<style scoped>
.menu-order-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: white;
}

.loading-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* 左側類別導航欄樣式 */
.category-sidebar {
  width: 200px;
  min-width: 200px;
  background-color: #ffffff;
  border-right: 1px solid #f1f3f4;
  overflow-y: auto;
  flex-shrink: 0;
}

.category-nav {
  padding: 0.5rem 0;
}

.category-nav-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  margin: 0 0.5rem 0.25rem 0.5rem;
  border-radius: 6px;
}

.category-nav-item:hover {
  background-color: #f8f9fa;
}

.category-nav-item.active {
  background-color: #f0f7ff;
  color: #1976d2;
  border: 1px solid #e3f2fd;
}

.category-nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.category-name {
  font-weight: 500;
  font-size: 1rem;
  line-height: 1.2;
  flex: 1;
}

.category-count {
  font-size: 0.75rem;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 24px;
  text-align: center;
}

.category-nav-item.active .category-count {
  background-color: #e3f2fd;
  color: #1976d2;
}

/* 右側內容區域 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content-sections {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.menu-section {
  transition: all 0.3s ease;
}

.menu-section.full-mode {
  flex: 1;
}

.menu-section.editing-mode {
  flex: 0 0 50%;
  border-bottom: 1px solid #dee2e6;
}

.options-section {
  flex: 1;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
  min-height: 0;
}

.section-content {
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
}

.category-title {
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  font-size: 1rem;
  font-weight: 600;
}

.menu-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.75rem;
}

.menu-item-card {
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  position: relative;
}

.menu-item-card:not(.sold-out):hover {
  transform: translateY(-1px);
}

.menu-item-card .card {
  height: 120px; /* 固定高度 */
}

.menu-item-card:not(.sold-out):hover .card {
  border-color: #b89e5c;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.menu-item-card.selected-dish .card {
  border-color: #f97316;
  border-width: 2px;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  background-color: #fff7ed;
}

/* 售完狀態樣式 */
.menu-item-card.sold-out {
  cursor: not-allowed;
}

.menu-item-card.sold-out .card {
  opacity: 0.6;
  border-color: #dc3545;
  background-color: #f8f9fa;
}

.menu-item-card .card-body {
  padding: 0.75rem;
  height: 100%;
}

.menu-item-card .card-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  line-height: 1.3;
  /* 省略號處理 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-img-top {
  height: 120px;
  object-fit: cover;
  border-radius: 8px 8px 0 0;
}

.price {
  color: #dc2626;
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0;
}

/* 庫存相關樣式 */
.inventory-badge {
  position: relative;
  z-index: 1;
}

.inventory-badge .badge {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

/* 售完遮罩 */
.sold-out-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.sold-out-text {
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  background-color: rgba(220, 53, 69, 0.9);
  border-radius: 4px;
}

.sold-out-text.suspended {
  background-color: rgba(255, 193, 7, 0.9);
  color: #000;
}

/* 選項相關樣式 */
.option-category-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  border-left: 3px solid;
  padding-left: 0.5rem;
  margin-bottom: 0.5rem;
}

.option-card {
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid #e5e7eb;
  min-width: 80px;
}

.option-card:hover {
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.option-card.selected {
  border-color: #f97316;
  background-color: #fff7ed;
  border-width: 2px;
}

.option-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.option-price {
  font-size: 0.65rem;
  color: #dc2626;
  font-weight: 600;
  margin-top: 0.25rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .category-sidebar {
    width: 150px;
    min-width: 150px;
  }

  .menu-items-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
}

@media (max-width: 480px) {
  .category-sidebar {
    width: 120px;
    min-width: 120px;
  }

  .menu-items-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }

  .section-content {
    padding: 0.75rem;
  }
}
</style>
