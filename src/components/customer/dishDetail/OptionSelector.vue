<template>
  <div class="option-selector">
    <!-- Options section -->
    <div class="options p-3 border-bottom">
      <!-- 遍歷選項類別 -->
      <div v-for="category in optionCategories" :key="category._id" class="mb-4">
        <h5 class="fw-bold mb-3">{{ category.name }}</h5>

        <!-- 單選類型 -->
        <div v-if="category.inputType === 'single'" class="d-flex flex-wrap">
          <div
            v-for="option in category.options"
            :key="option._id"
            class="form-check me-4 mb-3"
            :class="{ 'option-disabled': isOptionDisabled(option) }"
          >
            <input
              class="form-check-input"
              type="radio"
              :id="'option-' + option._id"
              v-model="selectedOptions[category._id]"
              :value="option._id"
              :name="'category-' + category._id"
              :disabled="isOptionDisabled(option)"
            />
            <label class="form-check-label fs-5" :for="'option-' + option._id">
              {{ option.name }}
              <span v-if="option.price > 0">(+${{ option.price }})</span>
            </label>
          </div>
        </div>

        <!-- 多選類型 -->
        <div v-else-if="category.inputType === 'multiple'" class="d-flex flex-wrap">
          <div
            v-for="option in category.options"
            :key="option._id"
            class="form-check me-4 mb-3"
            :class="{ 'option-disabled': isOptionDisabled(option) }"
          >
            <input
              class="form-check-input"
              type="checkbox"
              :id="'option-' + option._id"
              v-model="multiSelectedOptions[category._id]"
              :value="option._id"
              :disabled="isOptionDisabled(option)"
            />
            <label class="form-check-label fs-5" :for="'option-' + option._id">
              {{ option.name }}
              <span v-if="option.price > 0">(+${{ option.price }})</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Remarks section -->
    <div class="p-3 border-bottom">
      <h5 class="fw-bold mb-3">特殊要求</h5>
      <textarea
        class="form-control fs-5"
        v-model="note"
        rows="3"
        placeholder="例如：不要洋蔥..."
      ></textarea>
    </div>

    <!-- Quantity section -->
    <div class="p-3 d-flex align-items-center justify-content-between">
      <h5 class="fw-bold mb-0">數量</h5>
      <div class="input-group" style="width: 160px">
        <button class="btn btn-outline-secondary fs-5" @click="decreaseQuantity">-</button>
        <span class="form-control text-center fs-5">{{ quantity }}</span>
        <button class="btn btn-outline-secondary fs-5" @click="increaseQuantity">+</button>
      </div>
    </div>

    <!-- Add to cart / Update cart button -->
    <div class="p-3 position-sticky bottom-0 bg-white border-top">
      <button
        v-if="!isEditMode"
        type="button"
        class="btn btn-primary w-100 py-3 fs-4"
        @click="addToCart"
      >
        加入購物車 - ${{ calculateItemTotal() }}
      </button>
      <button v-else type="button" class="btn btn-success w-100 py-3 fs-4" @click="updateCart">
        確認修改 - ${{ calculateItemTotal() }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'

const props = defineProps({
  dish: {
    type: Object,
    required: true,
  },
  optionCategories: {
    type: Array,
    required: true,
    default: () => [],
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  existingItem: {
    type: Object,
    default: null,
  },
  inventoryData: {
    type: Object,
    default: () => ({}),
  },
  isLoadingInventory: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['add-to-cart', 'update-cart'])

// 表單狀態
const quantity = ref(1)
const note = ref('')
const selectedOptions = ref({})
const multiSelectedOptions = ref({})

// 設置默認選項值
const initializeOptions = () => {
  // 清空先前選擇
  selectedOptions.value = {}
  multiSelectedOptions.value = {}

  // 確保 optionCategories 是有效的陣列
  if (!Array.isArray(props.optionCategories)) {
    console.warn('optionCategories is not an array:', props.optionCategories)
    return
  }

  // 如果是編輯模式且有現有項目，載入現有的選項
  if (props.isEditMode && props.existingItem) {
    loadExistingOptions()
    return
  }

  props.optionCategories.forEach((category) => {
    if (!category || !category._id) {
      console.warn('Invalid category object:', category)
      return
    }

    // 確保選項是有效的陣列
    const options = category.options || []
    if (!Array.isArray(options) || options.length === 0) {
      console.warn(`No options found for category ${category.name}:`, options)
      return
    }

    if (category.inputType === 'single') {
      // 單選類型，默認選擇第一個選項
      selectedOptions.value[category._id] = options[0]._id
    } else if (category.inputType === 'multiple') {
      // 多選類型，初始化為空數組
      multiSelectedOptions.value[category._id] = []
    }
  })
}

// 載入現有選項（編輯模式）
const loadExistingOptions = () => {
  const existingOptions = props.existingItem.dishInstance.options || []

  // 載入數量和備註
  quantity.value = props.existingItem.quantity
  note.value = props.existingItem.dishInstance.note || ''

  // console.log('載入現有選項:', existingOptions);

  // 初始化所有類別
  props.optionCategories.forEach((category) => {
    if (category.inputType === 'single') {
      selectedOptions.value[category._id] = null
    } else if (category.inputType === 'multiple') {
      multiSelectedOptions.value[category._id] = []
    }
  })

  // 設置現有的選項
  existingOptions.forEach((existingCategory) => {
    const categoryId = existingCategory.optionCategoryId
    const category = props.optionCategories.find((c) => c._id === categoryId)

    if (category) {
      if (category.inputType === 'single' && existingCategory.selections.length > 0) {
        // 單選類型，取第一個選項
        selectedOptions.value[categoryId] = existingCategory.selections[0].optionId
      } else if (category.inputType === 'multiple') {
        // 多選類型，取所有選項
        multiSelectedOptions.value[categoryId] = existingCategory.selections.map((s) => s.optionId)
      }
    }
  })

  // console.log('載入完成的選項:', {
  //   selectedOptions: selectedOptions.value,
  //   multiSelectedOptions: multiSelectedOptions.value,
  //   quantity: quantity.value,
  //   note: note.value
  // });
}

// 檢查選項是否因庫存問題而被禁用
const isOptionDisabled = (option) => {
  // 如果沒有關聯餐點，則不禁用
  if (!option.refDishTemplate || !option.refDishTemplate._id) {
    return false
  }

  // 如果正在載入庫存資料，暫時不禁用
  if (props.isLoadingInventory) {
    return false
  }

  // 檢查關聯餐點的庫存狀況
  const dishTemplateId = option.refDishTemplate._id
  const inventoryInfo = props.inventoryData[dishTemplateId]

  if (!inventoryInfo) {
    // 沒有庫存資料，預設不禁用
    return false
  }

  // 如果商品被標記為售罄，則禁用
  if (inventoryInfo.isSoldOut) {
    return true
  }

  // 如果啟用庫存追蹤且可用庫存為 0，則禁用
  if (inventoryInfo.isInventoryTracked && inventoryInfo.enableAvailableStock) {
    return inventoryInfo.availableStock <= 0
  }

  // 其他情況不禁用
  return false
}

// 數量控制
const increaseQuantity = () => {
  quantity.value++
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

// 計算總價
const calculateItemTotal = () => {
  let total = props.dish.basePrice

  // 添加單選選項的價格
  Object.keys(selectedOptions.value).forEach((categoryId) => {
    const optionId = selectedOptions.value[categoryId]
    const category = props.optionCategories.find((c) => c._id === categoryId)
    if (category) {
      const option = category.options.find((o) => o._id === optionId)
      if (option && option.price) {
        total += option.price
      }
    }
  })

  // 添加多選選項的價格
  Object.keys(multiSelectedOptions.value).forEach((categoryId) => {
    const selectedOptionIds = multiSelectedOptions.value[categoryId]
    const category = props.optionCategories.find((c) => c._id === categoryId)
    if (category) {
      selectedOptionIds.forEach((optionId) => {
        const option = category.options.find((o) => o._id === optionId)
        if (option && option.price) {
          total += option.price
        }
      })
    }
  })

  // 乘以數量
  return total * quantity.value
}

// 獲取所有選項詳情
const getSelectedOptionDetails = () => {
  const result = []

  // 單選選項
  Object.keys(selectedOptions.value).forEach((categoryId) => {
    const optionId = selectedOptions.value[categoryId]
    const category = props.optionCategories.find((c) => c._id === categoryId)

    if (category) {
      const option = category.options.find((o) => o._id === optionId)
      if (option) {
        result.push({
          _id: false,
          optionCategoryId: category._id,
          optionCategoryName: category.name,
          selections: [
            {
              optionId: option._id,
              name: option.name,
              price: option.price || 0,
            },
          ],
        })
      }
    }
  })

  // 多選選項
  Object.keys(multiSelectedOptions.value).forEach((categoryId) => {
    const selectedOptionIds = multiSelectedOptions.value[categoryId]

    if (selectedOptionIds.length > 0) {
      const category = props.optionCategories.find((c) => c._id === categoryId)

      if (category) {
        const selections = selectedOptionIds.map((optionId) => {
          const option = category.options.find((o) => o._id === optionId)
          return {
            optionId: option._id,
            name: option.name,
            price: option.price || 0,
          }
        })

        result.push({
          _id: false,
          optionCategoryId: category._id,
          optionCategoryName: category.name,
          selections: selections,
        })
      }
    }
  })

  return result
}

// 計算最終價格（基本價格 + 選項價格）
const calculateFinalPrice = () => {
  let totalOptionPrice = 0

  // 計算所有選項的額外價格
  const allSelectedOptions = getSelectedOptionDetails()
  allSelectedOptions.forEach((category) => {
    category.selections.forEach((selection) => {
      totalOptionPrice += selection.price
    })
  })

  return props.dish.basePrice + totalOptionPrice
}

// 添加到購物車（新增模式）
const addToCart = () => {
  // 創建 DishInstance (只包含 DishInstance 模型的欄位)
  const dishInstance = {
    templateId: props.dish._id,
    name: props.dish.name,
    basePrice: props.dish.basePrice,
    options: getSelectedOptionDetails(),
    finalPrice: calculateFinalPrice(),
    // 注意：移除了 note, quantity, subtotal，這些屬於 Order 層級
  }

  // 創建完整的訂單項目 (符合前端購物車結構)
  const cartItem = {
    dishInstance: dishInstance,
    quantity: quantity.value,
    note: note.value,
    subtotal: calculateItemTotal(),
  }

  // 發出事件，傳遞完整的購物車項目
  emit('add-to-cart', cartItem)
}

// 更新購物車（編輯模式）
const updateCart = () => {
  // 創建 DishInstance (只包含 DishInstance 模型的欄位)
  const dishInstance = {
    templateId: props.dish._id,
    name: props.dish.name,
    basePrice: props.dish.basePrice,
    options: getSelectedOptionDetails(),
    finalPrice: calculateFinalPrice(),
  }

  // 創建完整的訂單項目
  const cartItem = {
    dishInstance: dishInstance,
    quantity: quantity.value,
    note: note.value,
    subtotal: calculateItemTotal(),
  }

  console.log('更新餐點項目:', cartItem)

  // 發出更新事件
  emit('update-cart', cartItem)
}

watch(
  [() => props.dish, () => props.optionCategories, () => props.existingItem],
  ([newDish, newCategories, newExistingItem], [oldDish, oldCategories, oldExistingItem]) => {
    // 只有當 dish 改變時才重置表單狀態（非編輯模式）
    if (newDish !== oldDish && !props.isEditMode) {
      quantity.value = 1
      note.value = ''
    }

    // 當 dish、optionCategories 或 existingItem 任一改變時都重新初始化選項
    initializeOptions()
  },
  { immediate: true },
)
</script>

<style scoped>
.option-selector {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.options {
  overflow-y: auto;
}

.form-check-input {
  border: 2px solid #495057;
  box-shadow: none;
  width: 22px;
  height: 22px;
  margin-top: 0.25em;
}

/* When focused */
.form-check-input:focus {
  border-color: #212529;
  box-shadow: 0 0 0 0.25rem rgba(33, 37, 41, 0.25);
}

/* When checked */
.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

/* Increase overall font size */
.form-control,
.btn {
  font-size: 1.1rem;
}

/* Increase spacing for better readability */
.form-check {
  padding-left: 2em;
}

/* Button style */
.btn-primary {
  background-color: #d35400;
  border-color: #d35400;
}

.btn-primary:hover {
  background-color: #e67e22;
  border-color: #e67e22;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
}

.btn-success:hover {
  background-color: #218838;
  border-color: #1e7e34;
}

/* 禁用選項樣式 */
.option-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.option-disabled .form-check-label {
  color: #6c757d;
  cursor: not-allowed;
}

.option-disabled .form-check-input:disabled {
  opacity: 0.3;
}
</style>
