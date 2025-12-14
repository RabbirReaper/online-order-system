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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import OptionSelector from '@/components/customer/dishDetail/OptionSelector.vue'
import { useCartStore } from '@/stores/cart'
import { useMenuStore } from '@/stores/menu'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const menuStore = useMenuStore()

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

// 從 store 獲取庫存資料
const inventoryData = computed(() => menuStore.inventoryData)
const isLoadingInventory = computed(() => menuStore.isLoadingInventory)

const loadDishData = async () => {
  try {
    // 確保 dishId 是字串而且有效
    if (typeof dishId.value !== 'string' || dishId.value.trim() === '') {
      console.error('無效的餐點 ID:', dishId.value)
      isLoading.value = false
      return
    }

    // 並行獲取餐點詳情和選項類別,減少請求時間
    const [dishData, optionsData] = await Promise.all([
      api.dish.getDishTemplateById({
        brandId: brandId.value,
        id: dishId.value,
      }),
      api.dish.getTemplateOptions({
        brandId: brandId.value,
        id: dishId.value,
      }),
    ])

    if (dishData && dishData.success) {
      dish.value = dishData.template

      // 確保圖片URL是正確的
      if (!dish.value.image || !dish.value.image.url) {
        console.warn('Dish image URL is missing or invalid:', dish.value.image)
      }

      // 使用 getTemplateOptions API 返回的已排序資料
      if (optionsData && optionsData.success && optionsData.options) {
        optionCategories.value = optionsData.options.map((item) => ({
          _id: item.category._id,
          name: item.category.name,
          inputType: item.category.inputType,
          order: item.order,
          options: item.options.map((option) => ({
            _id: option._id,
            name: option.name,
            price: option.price || 0,
            refDishTemplate: option.refDishTemplate || null,
          })),
        }))
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
  }
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
  // 從 store 載入庫存資料（如果還沒有的話）
  if (brandId.value && storeId.value) {
    await menuStore.loadInventory(brandId.value, storeId.value)
  }
})
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
