<template>
  <div class="dish-detail-view">
    <div class="container-wrapper">
      <div
        v-if="isLoading"
        class="loading-container d-flex justify-content-center align-items-center"
      >
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else class="detail-container">
        <div
          class="header d-flex align-items-center p-3 position-absolute top-0 start-0 w-100 bg-transparent"
          style="z-index: 10"
        >
          <button
            class="btn btn-sm rounded-circle shadow"
            @click="goBack"
            style="
              background-color: rgba(255, 255, 255, 0.8);
              width: 46px;
              height: 46px;
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <i class="bi bi-arrow-left fs-3"></i>
          </button>
          <h5
            v-if="isEditMode"
            class="ms-3 mb-0 text-white"
            style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5)"
          >
            編輯餐點
          </h5>
        </div>

        <!-- Image -->
        <div class="image-container" style="height: 240px; overflow: hidden; position: relative">
          <template v-if="dish.image && dish.image.url">
            <img
              :src="dish.image.url"
              :alt="dish.name"
              class="w-100 h-100"
              style="object-fit: cover"
            />
          </template>
          <template v-else>
            <div class="placeholder-container w-100 h-100">
              <i class="bi bi-question-octagon placeholder-icon"></i>
            </div>
          </template>
        </div>

        <!-- Item name and price -->
        <div class="p-3 border-bottom">
          <h3 class="mb-2">{{ dish.name }}</h3>
          <p class="text-danger fw-bold mb-2 fs-4">${{ dish.basePrice }}</p>
          <p class="text-muted fs-5" style="white-space: pre-line">{{ dish.description }}</p>
        </div>

        <OptionSelector
          :dish="dish"
          :option-categories="optionCategories"
          :is-edit-mode="isEditMode"
          :existing-item="existingItem"
          :inventory-data="inventoryData"
          :is-loading-inventory="isLoadingInventory"
          @add-to-cart="addToCart"
          @update-cart="updateCart"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import OptionSelector from '@/components/customer/dishDetail/OptionSelector.vue'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.storeId)
const dishId = computed(() => route.params.dishId)

// 編輯模式相關
const isEditMode = computed(() => route.query.edit === 'true')
const editIndex = computed(() => parseInt(route.query.editIndex) || 0)

const dish = ref({})
const optionCategories = ref([])
const isLoading = ref(true)
const existingItem = ref(null)

// 庫存相關數據
const inventoryData = ref({})
const isLoadingInventory = ref(false)

const loadDishData = async () => {
  try {
    // 確保 dishId 是字串而且有效
    if (typeof dishId.value !== 'string' || dishId.value.trim() === '') {
      console.error('無效的餐點 ID:', dishId.value)
      isLoading.value = false
      return
    }

    // 獲取餐點詳情
    const dishData = await api.dish.getDishTemplateById({
      brandId: brandId.value,
      id: dishId.value,
    })

    if (dishData && dishData.success) {
      dish.value = dishData.template

      // 確保圖片URL是正確的
      if (!dish.value.image || !dish.value.image.url) {
        console.warn('Dish image URL is missing or invalid:', dish.value.image)
      }

      // 獲取關聯的選項類別
      if (dish.value.optionCategories && dish.value.optionCategories.length > 0) {
        const categoryPromises = dish.value.optionCategories.map((category) =>
          api.dish.getOptionCategoryById({
            brandId: brandId.value,
            id: category.categoryId,
            includeOptions: true,
          }),
        )

        const categories = await Promise.all(categoryPromises)

        // 依照原始順序排序選項類別
        optionCategories.value = categories
          .filter((response) => response && response.success)
          .map((response) => {
            const categoryData = response.category

            if (!categoryData || !categoryData._id) {
              console.warn('Invalid category data structure:', response)
              return null
            }

            // 獲取類別在餐點中的順序
            const categoryConfig = dish.value.optionCategories.find(
              (c) => c.categoryId === categoryData._id,
            )

            // 處理選項資料 - 從 refOption 中提取
            let options = []
            if (categoryData.options && Array.isArray(categoryData.options)) {
              options = categoryData.options
                .map((opt) => {
                  // 獲取真正的選項資料 (在 refOption 中)
                  if (opt.refOption) {
                    return {
                      _id: opt.refOption._id,
                      name: opt.refOption.name,
                      price: opt.refOption.price || 0,
                      order: opt.order || 0,
                      refDishTemplate: opt.refOption.refDishTemplate || null,
                    }
                  } else {
                    return {
                      _id: opt._id,
                      name: opt.name || '未命名選項',
                      price: opt.price || 0,
                      order: opt.order || 0,
                      refDishTemplate: null,
                    }
                  }
                })
                .sort((a, b) => a.order - b.order)
            }

            return {
              _id: categoryData._id,
              name: categoryData.name,
              inputType: categoryData.inputType,
              order: categoryConfig ? categoryConfig.order : 0,
              options: options,
            }
          })
          .filter(Boolean)
          .sort((a, b) => a.order - b.order)
      }

      // 如果是編輯模式，載入現有的餐點資料
      if (isEditMode.value) {
        loadExistingItem()
      }
    } else {
      console.error('無效的餐點數據或 API 呼叫失敗:', dishData)
    }
  } catch (error) {
    console.error('無法載入餐點詳情:', error)
  } finally {
    isLoading.value = false
  }
}

// 載入現有的餐點資料（編輯模式）
const loadExistingItem = () => {
  const cartItems = cartStore.items
  if (editIndex.value >= 0 && editIndex.value < cartItems.length) {
    existingItem.value = cartItems[editIndex.value]
    // console.log('載入現有餐點資料:', existingItem.value);
  }
}

// 載入庫存資料
const loadInventoryData = async () => {
  if (!brandId.value || !storeId.value) {
    console.warn('缺少 brandId 或 storeId，無法載入庫存資料')
    return
  }

  isLoadingInventory.value = true

  try {
    // 獲取店鋪所有餐點庫存
    const response = await api.inventory.getStoreInventory({
      brandId: brandId.value,
      storeId: storeId.value,
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
    } else {
      console.warn('庫存資料載入失敗:', response.message)
    }
  } catch (error) {
    console.error('載入庫存資料時發生錯誤:', error)
  } finally {
    isLoadingInventory.value = false
  }
}

// 獲取項目的庫存資訊（用於關聯餐點的選項）
const getInventoryInfo = (dishTemplateId) => {
  if (!dishTemplateId) return null
  return inventoryData.value[dishTemplateId] || null
}

const goBack = () => {
  router.back()
}

const addToCart = (dishInstance) => {
  cartStore.addItem(dishInstance)

  router.back()
  // 返回菜單頁面
  // router.push({
  //   name: 'menu',
  //   params: {
  //     brandId: brandId.value,
  //     storeId: storeId.value
  //   }
  // });
}

const updateCart = (dishInstance) => {
  // 更新購物車項目（編輯模式）
  // console.log('更新購物車項目:', { editIndex: editIndex.value, dishInstance });

  // 刪除原本的項目
  cartStore.removeItem(editIndex.value)

  // 添加修改後的項目
  cartStore.addItem(dishInstance)

  // 返回購物車頁面
  router.push({ name: 'cart' })
}

onMounted(async () => {
  await loadDishData()
  // 載入庫存資料
  if (brandId.value && storeId.value) {
    await loadInventoryData()
  }
})

// 監聽參數變化，重新載入庫存資料
watch(
  [() => brandId.value, () => storeId.value],
  ([newBrandId, newStoreId], [oldBrandId, oldStoreId]) => {
    if ((newBrandId !== oldBrandId || newStoreId !== oldStoreId) && newBrandId && newStoreId) {
      loadInventoryData()
    }
  },
)
</script>

<style scoped>
.dish-detail-view {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
}

.container-wrapper {
  max-width: 736px;
  width: 100%;
  background-color: white;
  min-height: 100vh;
  position: relative;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}

.loading-container {
  min-height: 100vh;
}

.detail-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.placeholder-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
}

.placeholder-icon {
  font-size: 4rem;
  color: #6c757d;
}

@media (max-width: 576px) {
  .container-wrapper {
    max-width: 100%;
  }
}
</style>
