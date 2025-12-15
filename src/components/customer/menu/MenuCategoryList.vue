<template>
  <div id="menu-section" class="menu-container">
    <div class="content-wrapper">
      <div class="section-header">
        <i class="bi bi-journal-text me-2 menu-icon"></i>
        <h3 class="fw-bold mb-0">精選菜單</h3>
      </div>

      <!-- 載入庫存資料時的提示 -->
      <div v-if="isLoadingInventory" class="text-center py-3">
        <div
          class="spinner-border text-primary"
          role="status"
          style="width: 1.5rem; height: 1.5rem"
        >
          <span class="visually-hidden">載入庫存資料中...</span>
        </div>
        <small class="text-muted ms-2">載入庫存資料中...</small>
      </div>

      <!-- 菜單分類列表 -->
      <div
        v-for="category in categories"
        :key="category._id"
        class="menu-category"
        :id="'category-' + category._id"
      >
        <div class="category-header">
          <h4 class="fw-bold">{{ category.name }}</h4>
        </div>
        <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
          <div v-for="item in getVisibleItems(category)" :key="getItemKey(item)" class="col">
            <MenuItemCard
              :item="item"
              :inventory-info="getInventoryInfo(item)"
              :menu-type="menuType"
              @select-item="handleItemSelect"
            />
          </div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div
        v-if="!isLoadingInventory && (!categories || categories.length === 0)"
        class="text-center py-5"
      >
        <i class="bi bi-journal-x display-1 text-muted"></i>
        <p class="text-muted mt-3">目前沒有可用的菜單項目</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import MenuItemCard from './MenuItemCard.vue'
import { useMenuStore } from '@/stores/menu'

const props = defineProps({
  categories: {
    type: Array,
    required: true,
    default: () => [],
  },
  brandId: {
    type: String,
    required: true,
  },
  storeId: {
    type: String,
    required: true,
  },
  menuType: {
    type: String,
    default: 'food',
  },
})

const emit = defineEmits(['select-item'])

// 使用 menu store
const menuStore = useMenuStore()

// 從 store 獲取庫存資料
const inventoryData = computed(() => menuStore.inventoryData)
const isLoadingInventory = computed(() => menuStore.isLoadingInventory)

// 生成項目的唯一鍵值
const getItemKey = (item) => {
  if (item.itemType === 'dish') {
    return `dish-${item._id || item.dishTemplate?._id}`
  } else if (item.itemType === 'bundle') {
    return `bundle-${item._id || item.bundle?._id}`
  }
  return `item-${item._id}`
}

// 獲取分類中可見的項目
const getVisibleItems = (category) => {
  if (!category.items || !Array.isArray(category.items)) {
    return []
  }

  // 過濾並排序項目
  return category.items
    .filter((item) => item.isShowing !== false) // 只顯示啟用的項目
    .sort((a, b) => (a.order || 0) - (b.order || 0)) // 按順序排序
}

// 獲取項目的庫存資訊
const getInventoryInfo = (item) => {
  // 只有餐點類型才需要檢查庫存
  if (item.itemType !== 'dish' || !item.dishTemplate) {
    return null
  }

  const dishTemplateId = item.dishTemplate._id || item.dishTemplate
  return inventoryData.value[dishTemplateId] || null
}

// 處理項目選擇
const handleItemSelect = (item) => {
  // console.log('MenuCategoryList: 選擇項目', item);
  emit('select-item', item)
}

// 載入庫存資料（使用 store）
const loadInventoryData = async () => {
  if (!props.brandId || !props.storeId) {
    console.warn('缺少 brandId 或 storeId，無法載入庫存資料')
    return
  }

  await menuStore.loadInventory(props.brandId, props.storeId)
}

// 生命周期
onMounted(() => {
  if (props.brandId && props.storeId) {
    loadInventoryData()
  }
})

// 監聽參數變化
watch(
  [() => props.brandId, () => props.storeId],
  ([newBrandId, newStoreId], [oldBrandId, oldStoreId]) => {
    if ((newBrandId !== oldBrandId || newStoreId !== oldStoreId) && newBrandId && newStoreId) {
      loadInventoryData()
    }
  },
)

// 監聽分類變化，當菜單載入完成後載入庫存資料
watch(
  () => props.categories,
  (newCategories) => {
    if (newCategories.length > 0 && props.brandId && props.storeId) {
      loadInventoryData()
    }
  },
)
</script>

<style scoped>
/* 顏色變數定義 */
:root {
  --primary-color: #d35400;
  --accent-color: #e67e22;
  --text-color: #2c3e50;
  --bg-light: #f8f9fa;
  --price-color: #dceeda;
}

/* 菜單樣式 */
.menu-container {
  padding: 2rem 0;
}

.menu-icon {
  color: #28a745;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--accent-color);
}

.menu-category {
  margin-bottom: 2.5rem;
  scroll-margin-top: 70px;
}

.category-header {
  margin-bottom: 1rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  border-bottom: 1px dashed #e0e0e0;
  padding-bottom: 0.5rem;
}

.category-header h4 {
  font-family:
    'Noto Sans TC', '微軟正黑體', 'Microsoft JhengHei', '蘋方-繁', 'PingFang TC', sans-serif !important;
  font-weight: 700 !important;
  color: var(--primary-color);
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  position: relative;
  padding-left: 15px;
}

.category-header h4:before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 24px;
  background-color: var(--accent-color);
  border-radius: 3px;
}

.content-wrapper {
  width: 100%;
  padding: 0 15px;
  padding-top: 0px !important;
}

/* 載入指示器樣式 */
.spinner-border {
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}
</style>
