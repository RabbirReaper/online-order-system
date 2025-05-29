<template>
  <div id="menu-section" class="menu-container">
    <div class="content-wrapper">
      <div class="section-header">
        <i class="bi bi-journal-text me-2 menu-icon"></i>
        <h3 class="fw-bold mb-0">精選菜單</h3>
      </div>

      <!-- 載入庫存資料時的提示 -->
      <div v-if="isLoadingInventory" class="text-center py-3">
        <div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem;">
          <span class="visually-hidden">載入庫存資料中...</span>
        </div>
        <small class="text-muted ms-2">載入庫存資料中...</small>
      </div>

      <div v-for="category in menuList" :key="category.categoryId" class="menu-category"
        :id="'category-' + category.categoryId">
        <div class="category-header">
          <h4 class="fw-bold">{{ category.categoryName }}</h4>
        </div>
        <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
          <div v-for="item in getItemsInCategory(category)" :key="item._id" class="col">
            <DishCard :item="item" :enableAvailableStock="getInventoryInfo(item._id)?.enableAvailableStock || false"
              :availableStock="getInventoryInfo(item._id)?.availableStock || 0"
              @select-item="$emit('select-item', item._id)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import DishCard from './DishCard.vue';
import api from '@/api';

const props = defineProps({
  menuList: {
    type: Array,
    required: true,
    default: () => []
  },
  menuItems: {
    type: Array,
    required: true,
    default: () => []
  },
  brandId: {
    type: String,
    required: true
  },
  storeId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['select-item']);

// 庫存相關狀態
const inventoryData = ref({});
const isLoadingInventory = ref(false);

// 取得分類中的菜單項目並排序
const getItemsInCategory = (category) => {
  return props.menuItems.filter(item => {
    return category.items.some(catItem => catItem.itemId === item._id);
  }).sort((a, b) => {
    const aOrder = category.items.find(item => item.itemId === a._id)?.order || 0;
    const bOrder = category.items.find(item => item.itemId === b._id)?.order || 0;
    return aOrder - bOrder;
  });
};

// 獲取餐點的庫存資訊
const getInventoryInfo = (dishTemplateId) => {
  return inventoryData.value[dishTemplateId] || null;
};

// 載入庫存資料
const loadInventoryData = async () => {
  if (!props.brandId || !props.storeId) {
    console.warn('缺少 brandId 或 storeId，無法載入庫存資料');
    return;
  }

  isLoadingInventory.value = true;

  try {
    // 獲取店鋪所有餐點庫存
    const response = await api.inventory.getStoreInventory({
      brandId: props.brandId,
      storeId: props.storeId,
      inventoryType: 'DishTemplate'
    });

    if (response.success) {
      const inventoryMap = {};

      // 將庫存資料按餐點模板 ID 建立對應關係
      response.inventory.forEach(item => {
        if (item.dish && item.dish._id) {
          inventoryMap[item.dish._id] = {
            inventoryId: item._id,
            enableAvailableStock: item.enableAvailableStock,
            availableStock: item.availableStock,
            totalStock: item.totalStock,
            isSoldOut: item.isSoldOut,
            isInventoryTracked: item.isInventoryTracked
          };
        }
      });

      inventoryData.value = inventoryMap;
      // console.log('庫存資料載入成功:', inventoryMap);
    } else {
      console.warn('庫存資料載入失敗:', response.message);
    }
  } catch (error) {
    console.error('載入庫存資料時發生錯誤:', error);
    // 不顯示錯誤給用戶，只在控制台記錄
  } finally {
    isLoadingInventory.value = false;
  }
};

// 生命周期
onMounted(() => {
  // 確保有必要的參數後載入庫存資料
  if (props.brandId && props.storeId) {
    loadInventoryData();
  }
});

// 監聽 brandId 和 storeId 變化，重新載入庫存資料
watch(
  [() => props.brandId, () => props.storeId],
  ([newBrandId, newStoreId], [oldBrandId, oldStoreId]) => {
    if ((newBrandId !== oldBrandId || newStoreId !== oldStoreId) && newBrandId && newStoreId) {
      loadInventoryData();
    }
  }
);

// 監聽菜單項目變化，當菜單載入完成後載入庫存資料
watch(
  () => props.menuItems,
  (newMenuItems) => {
    if (newMenuItems.length > 0 && props.brandId && props.storeId && Object.keys(inventoryData.value).length === 0) {
      loadInventoryData();
    }
  }
);
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
  /* 確保滾動到類別時，標題不會被導航欄遮擋 */
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
  font-family: 'Noto Sans TC', '微軟正黑體', 'Microsoft JhengHei', '蘋方-繁', 'PingFang TC', sans-serif !important;
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
