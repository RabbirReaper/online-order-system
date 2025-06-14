<template>
  <div class="menu-item-manager">
    <div class="card">
      <div class="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 class="mb-0">{{ categoryName }} 商品管理</h5>
        <button type="button" class="btn btn-sm btn-primary" @click="addItem">
          <i class="bi bi-plus-circle me-1"></i>新增商品
        </button>
      </div>
      <div class="card-body">
        <!-- 商品列表 -->
        <div v-if="items.length > 0" class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th style="width: 60px">順序</th>
                <th style="width: 80px">圖片</th>
                <th style="width: 80px">類型</th>
                <th>商品名稱</th>
                <th style="width: 120px">現金價格</th>
                <th style="width: 120px">點數價格</th>
                <th style="width: 100px">狀態</th>
                <th style="width: 150px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in sortedItems" :key="index" :class="{ 'table-secondary': !item.isShowing }">
                <td>{{ item.order }}</td>
                <td>
                  <img :src="getItemImage(item)" class="item-thumbnail" :alt="getItemName(item)">
                </td>
                <td>
                  <span class="badge" :class="getItemTypeBadgeClass(item.itemType)">
                    {{ getItemTypeText(item.itemType) }}
                  </span>
                </td>
                <td>
                  <div class="fw-bold">{{ getItemName(item) }}</div>
                  <div class="small text-muted">{{ getItemDescription(item) }}</div>
                </td>
                <td>
                  <div v-if="item.priceOverride !== null && item.priceOverride !== undefined">
                    <span class="text-success fw-bold">${{ item.priceOverride }}</span>
                    <small class="text-muted text-decoration-line-through d-block">
                      原: ${{ getItemOriginalPrice(item) }}
                    </small>
                  </div>
                  <div v-else>
                    ${{ getItemOriginalPrice(item) }}
                  </div>
                </td>
                <td>
                  <div v-if="item.pointOverride !== null && item.pointOverride !== undefined">
                    <span class="text-warning fw-bold">{{ item.pointOverride }} 點</span>
                    <small class="text-muted text-decoration-line-through d-block"
                      v-if="getItemOriginalPoints(item) > 0">
                      原: {{ getItemOriginalPoints(item) }} 點
                    </small>
                  </div>
                  <div v-else-if="getItemOriginalPoints(item) > 0">
                    {{ getItemOriginalPoints(item) }} 點
                  </div>
                  <div v-else>
                    -
                  </div>
                </td>
                <td>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" :id="`item-status-${index}`"
                      v-model="item.isShowing" @change="updateItem(index)">
                    <label class="form-check-label small" :for="`item-status-${index}`">
                      {{ item.isShowing ? '顯示' : '隱藏' }}
                    </label>
                  </div>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-primary" @click="editItem(index)" title="編輯">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary" @click="moveUp(index)"
                      :disabled="index === 0" title="上移">
                      <i class="bi bi-arrow-up"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary" @click="moveDown(index)"
                      :disabled="index === items.length - 1" title="下移">
                      <i class="bi bi-arrow-down"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger" @click="removeItem(index)" title="刪除">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 無商品提示 -->
        <div v-else class="text-center p-4 bg-light rounded">
          <p class="mb-2">此分類尚未添加任何商品</p>
          <button type="button" class="btn btn-primary" @click="addItem">
            <i class="bi bi-plus-circle me-1"></i>新增第一個商品
          </button>
        </div>
      </div>
    </div>

    <!-- 編輯商品模態框 -->
    <b-modal id="itemModal" v-model:show="showEditModal" title="編輯商品" @ok="saveItem" ok-title="儲存變更" cancel-title="取消">
      <div class="mb-3">
        <label class="form-label">商品類型</label>
        <input type="text" class="form-control" disabled :value="getItemTypeText(editForm.itemType)">
      </div>

      <div class="mb-3">
        <label class="form-label">商品名稱</label>
        <input type="text" class="form-control" disabled :value="editForm.name">
      </div>

      <div class="mb-3">
        <label class="form-label">原始價格</label>
        <input type="text" class="form-control" disabled :value="formatPrice(editForm.originalPrice)">
      </div>

      <div class="mb-3">
        <label for="itemPriceOverride" class="form-label">自訂現金價格 (可選)</label>
        <div class="input-group">
          <span class="input-group-text">$</span>
          <input type="number" id="itemPriceOverride" class="form-control" v-model="editForm.priceOverride"
            placeholder="留空則使用原始價格" min="0" step="0.01">
        </div>
        <div class="form-text">若要使用原始價格，請留空此欄位</div>
      </div>

      <div class="mb-3" v-if="editForm.originalPoints > 0">
        <label class="form-label">原始點數</label>
        <input type="text" class="form-control" disabled :value="`${editForm.originalPoints} 點`">
      </div>

      <div class="mb-3">
        <label for="itemPointOverride" class="form-label">自訂點數價格 (可選)</label>
        <div class="input-group">
          <input type="number" id="itemPointOverride" class="form-control" v-model="editForm.pointOverride"
            placeholder="留空則使用原始點數" min="0">
          <span class="input-group-text">點</span>
        </div>
        <div class="form-text">若要使用原始點數，請留空此欄位</div>
      </div>

      <div class="mb-3">
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" id="itemIsShowing" v-model="editForm.isShowing">
          <label class="form-check-label" for="itemIsShowing">在菜單中顯示</label>
        </div>
      </div>

      <div class="mb-3">
        <label for="itemOrder" class="form-label">顯示順序</label>
        <input type="number" class="form-control" id="itemOrder" v-model.number="editForm.order" min="0">
        <div class="form-text">數字越小，顯示越前面</div>
      </div>
    </b-modal>

    <!-- 添加商品模態框 -->
    <b-modal id="addItemModal" v-model:show="showAddModal" :title="`添加商品到 ${categoryName}`" size="lg" cancel-title="取消"
      @ok="false" :ok-disabled="true" ok-title="">
      <div v-if="isLoadingData" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">加載中...</span>
        </div>
      </div>
      <div v-else>
        <!-- 商品類型選擇 -->
        <div class="mb-3">
          <label class="form-label">商品類型</label>
          <select v-model="selectedItemType" class="form-select" @change="onItemTypeChange">
            <option value="">選擇商品類型</option>
            <option value="dish">餐點</option>
            <option value="bundle">套餐</option>
          </select>
        </div>

        <!-- 搜尋框 -->
        <div class="mb-3" v-if="selectedItemType">
          <input type="text" class="form-control" placeholder="搜尋..." v-model="searchQuery" @input="filterItems">
        </div>

        <!-- 餐點列表 -->
        <div v-if="selectedItemType === 'dish' && filteredDishTemplates.length > 0" class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th style="width: 80px">圖片</th>
                <th>餐點名稱</th>
                <th style="width: 120px">基本價格</th>
                <th style="width: 120px">選項</th>
                <th style="width: 100px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="template in filteredDishTemplates" :key="template._id">
                <td>
                  <img :src="template.image?.url || '/placeholder.jpg'" class="item-thumbnail" alt="">
                </td>
                <td>
                  <div class="fw-bold">{{ template.name }}</div>
                  <div class="small text-muted">{{ template.description }}</div>
                </td>
                <td>{{ formatPrice(template.basePrice) }}</td>
                <td>
                  <span class="badge bg-info me-1 mb-1"
                    v-if="template.optionCategories && template.optionCategories.length > 0">
                    {{ template.optionCategories.length }} 種選項
                  </span>
                  <span class="text-muted" v-else>無選項</span>
                </td>
                <td>
                  <button class="btn btn-sm btn-primary" @click="selectItem('dish', template)">
                    <i class="bi bi-plus-lg me-1"></i>選擇
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 套餐列表 -->
        <div v-else-if="selectedItemType === 'bundle' && filteredBundles.length > 0" class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>套餐名稱</th>
                <th style="width: 120px">售價</th>
                <th style="width: 120px">點數價格</th>
                <th style="width: 100px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bundle in filteredBundles" :key="bundle._id">
                <td>
                  <div class="fw-bold">{{ bundle.name }}</div>
                  <div class="small text-muted">{{ bundle.description }}</div>
                </td>
                <td>{{ formatPrice(bundle.sellingPrice) }}</td>
                <td>{{ bundle.sellingPoint ? `${bundle.sellingPoint} 點` : '-' }}</td>
                <td>
                  <button class="btn btn-sm btn-primary" @click="selectItem('bundle', bundle)">
                    <i class="bi bi-plus-lg me-1"></i>選擇
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 無資料提示 -->
        <div v-else-if="selectedItemType && ((selectedItemType === 'dish' && filteredDishTemplates.length === 0) ||
          (selectedItemType === 'bundle' && filteredBundles.length === 0))" class="text-center py-3">
          <p class="mb-0 text-muted">找不到符合條件的{{ getItemTypeText(selectedItemType) }}</p>
        </div>

        <!-- 未選擇類型提示 -->
        <div v-else-if="!selectedItemType" class="text-center py-3">
          <p class="mb-0 text-muted">請先選擇商品類型</p>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { BModal } from 'bootstrap-vue-next';
import api from '@/api';

// 定義props
const props = defineProps({
  categoryName: {
    type: String,
    default: '未命名分類'
  },
  // 商品資料
  modelValue: {
    type: Array,
    required: true
  },
  // 品牌ID
  brandId: {
    type: String,
    required: true
  }
});

// 定義事件
const emit = defineEmits(['update:modelValue']);

// 內部狀態
const items = ref([]);
const editIndex = ref(-1);
const showEditModal = ref(false);
const showAddModal = ref(false);
const isLoadingData = ref(false);
const dishTemplates = ref([]);
const bundles = ref([]);
const filteredDishTemplates = ref([]);
const filteredBundles = ref([]);
const searchQuery = ref('');
const selectedItemType = ref('');

// 編輯表單
const editForm = reactive({
  itemType: '',
  name: '',
  originalPrice: 0,
  originalPoints: 0,
  priceOverride: null,
  pointOverride: null,
  isShowing: true,
  order: 0
});

// 按照順序排序的商品
const sortedItems = computed(() => {
  return [...items.value].sort((a, b) => a.order - b.order);
});

// 從props同步資料
watch(() => props.modelValue, (newValue) => {
  items.value = JSON.parse(JSON.stringify(newValue)); // 深複製
}, { deep: true, immediate: true });

// 獲取商品類型文字
const getItemTypeText = (type) => {
  const typeMap = {
    'dish': '餐點',
    'bundle': '套餐'
  };
  return typeMap[type] || type;
};

// 獲取商品類型標記樣式
const getItemTypeBadgeClass = (type) => {
  const classMap = {
    'dish': 'bg-primary',
    'bundle': 'bg-success'
  };
  return classMap[type] || 'bg-secondary';
};

// 格式化價格
const formatPrice = (price) => {
  if (price === undefined || price === null) return '$0';
  return `$${price}`;
};

// 獲取商品名稱
const getItemName = (item) => {
  if (!item) return '未知商品';

  if (item.itemType === 'dish' && item.dishTemplate) {
    const template = dishTemplates.value.find(t => t._id === item.dishTemplate);
    return template ? template.name : '未知餐點';
  }

  if (item.itemType === 'bundle' && item.bundle) {
    const bundle = bundles.value.find(b => b._id === item.bundle);
    return bundle ? bundle.name : '未知套餐';
  }

  return '未知商品';
};

// 獲取商品描述
const getItemDescription = (item) => {
  if (!item) return '';

  if (item.itemType === 'dish' && item.dishTemplate) {
    const template = dishTemplates.value.find(t => t._id === item.dishTemplate);
    return template ? template.description || '' : '';
  }

  if (item.itemType === 'bundle' && item.bundle) {
    const bundle = bundles.value.find(b => b._id === item.bundle);
    return bundle ? bundle.description || '' : '';
  }

  return '';
};

// 獲取商品圖片
const getItemImage = (item) => {
  if (!item) return '/placeholder.jpg';

  if (item.itemType === 'dish' && item.dishTemplate) {
    const template = dishTemplates.value.find(t => t._id === item.dishTemplate);
    return template && template.image && template.image.url ? template.image.url : '/placeholder.jpg';
  }

  // 套餐暫時使用預設圖片
  return '/placeholder.jpg';
};

// 獲取商品原始價格
const getItemOriginalPrice = (item) => {
  if (!item) return 0;

  if (item.itemType === 'dish' && item.dishTemplate) {
    const template = dishTemplates.value.find(t => t._id === item.dishTemplate);
    return template ? template.basePrice || 0 : 0;
  }

  if (item.itemType === 'bundle' && item.bundle) {
    const bundle = bundles.value.find(b => b._id === item.bundle);
    return bundle ? bundle.sellingPrice || 0 : 0;
  }

  return 0;
};

// 獲取商品原始點數
const getItemOriginalPoints = (item) => {
  if (!item) return 0;

  if (item.itemType === 'bundle' && item.bundle) {
    const bundle = bundles.value.find(b => b._id === item.bundle);
    return bundle ? bundle.sellingPoint || 0 : 0;
  }

  // 餐點暫時沒有點數價格
  return 0;
};

// 商品類型改變處理
const onItemTypeChange = () => {
  searchQuery.value = '';
  filterItems();
};

// 添加商品
const addItem = async () => {
  // 獲取資料
  await fetchData();

  // 重置搜尋
  searchQuery.value = '';
  selectedItemType.value = '';
  filterItems();

  // 顯示模態框
  showAddModal.value = true;
};

// 篩選商品
const filterItems = () => {
  const query = searchQuery.value.toLowerCase().trim();

  if (selectedItemType.value === 'dish') {
    if (!query) {
      filteredDishTemplates.value = [...dishTemplates.value];
    } else {
      filteredDishTemplates.value = dishTemplates.value.filter(template =>
        template.name.toLowerCase().includes(query) ||
        (template.description && template.description.toLowerCase().includes(query))
      );
    }
  } else if (selectedItemType.value === 'bundle') {
    if (!query) {
      filteredBundles.value = [...bundles.value];
    } else {
      filteredBundles.value = bundles.value.filter(bundle =>
        bundle.name.toLowerCase().includes(query) ||
        (bundle.description && bundle.description.toLowerCase().includes(query))
      );
    }
  }
};

// 選擇商品
const selectItem = (itemType, data) => {
  // 檢查是否已經添加過此商品
  let exists = false;

  if (itemType === 'dish') {
    exists = items.value.some(item => item.itemType === 'dish' && item.dishTemplate === data._id);
  } else if (itemType === 'bundle') {
    exists = items.value.some(item => item.itemType === 'bundle' && item.bundle === data._id);
  }

  if (exists) {
    if (!confirm(`「${data.name}」已存在於此分類中，是否再次添加？`)) {
      return;
    }
  }

  // 添加商品
  const newItem = {
    itemType: itemType,
    dishTemplate: itemType === 'dish' ? data._id : undefined,
    bundle: itemType === 'bundle' ? data._id : undefined,
    priceOverride: null,
    pointOverride: null,
    isShowing: true,
    order: items.value.length
  };

  const newItems = [...items.value, newItem];
  items.value = newItems;
  emit('update:modelValue', newItems);

  // 關閉模態框
  showAddModal.value = false;
};

// 編輯商品
const editItem = (index) => {
  editIndex.value = index;
  const item = items.value[index];

  // 設置表單值
  editForm.itemType = item.itemType;
  editForm.name = getItemName(item);
  editForm.originalPrice = getItemOriginalPrice(item);
  editForm.originalPoints = getItemOriginalPoints(item);
  editForm.priceOverride = item.priceOverride !== undefined && item.priceOverride !== null ? item.priceOverride : null;
  editForm.pointOverride = item.pointOverride !== undefined && item.pointOverride !== null ? item.pointOverride : null;
  editForm.isShowing = item.isShowing !== undefined ? item.isShowing : true;
  editForm.order = item.order !== undefined ? item.order : index;

  // 顯示模態框
  showEditModal.value = true;
};

// 更新商品 (僅更新狀態)
const updateItem = (index) => {
  const newItems = [...items.value];
  emit('update:modelValue', newItems);
};

// 保存商品編輯
const saveItem = () => {
  if (editIndex.value < 0) return;

  // 更新商品
  const newItems = [...items.value];
  const item = newItems[editIndex.value];

  // 更新價格覆蓋
  item.priceOverride = editForm.priceOverride === '' || editForm.priceOverride === null ? null : parseFloat(editForm.priceOverride);
  item.pointOverride = editForm.pointOverride === '' || editForm.pointOverride === null ? null : parseInt(editForm.pointOverride);

  // 更新顯示狀態和順序
  item.isShowing = editForm.isShowing;
  item.order = editForm.order;

  // 更新數據
  items.value = newItems;
  emit('update:modelValue', newItems);

  // 關閉模態框
  showEditModal.value = false;
};

// 移除商品
const removeItem = (index) => {
  if (!confirm(`確定要移除「${getItemName(items.value[index])}」嗎？`)) {
    return;
  }

  // 移除商品
  const newItems = [...items.value];
  newItems.splice(index, 1);

  // 重新排序
  newItems.forEach((item, idx) => {
    item.order = idx;
  });

  // 更新數據
  items.value = newItems;
  emit('update:modelValue', newItems);
};

// 上移商品
const moveUp = (index) => {
  if (index <= 0) return;

  const newItems = [...items.value];
  // 交換順序號
  const temp = newItems[index].order;
  newItems[index].order = newItems[index - 1].order;
  newItems[index - 1].order = temp;

  // 更新數據
  items.value = newItems;
  emit('update:modelValue', newItems);
};

// 下移商品
const moveDown = (index) => {
  if (index >= items.value.length - 1) return;

  const newItems = [...items.value];
  // 交換順序號
  const temp = newItems[index].order;
  newItems[index].order = newItems[index + 1].order;
  newItems[index + 1].order = temp;

  // 更新數據
  items.value = newItems;
  emit('update:modelValue', newItems);
};

// 獲取資料
const fetchData = async () => {
  if (!props.brandId) return;

  isLoadingData.value = true;

  try {
    // 獲取餐點模板
    const dishResponse = await api.dish.getAllDishTemplates({ brandId: props.brandId });
    if (dishResponse && dishResponse.templates) {
      dishTemplates.value = dishResponse.templates;
      filteredDishTemplates.value = [...dishResponse.templates];
    }

    // TODO: 獲取套餐資料
    // const bundleResponse = await api.bundle.getAllBundles({ brandId: props.brandId });
    // if (bundleResponse && bundleResponse.bundles) {
    //   bundles.value = bundleResponse.bundles;
    //   filteredBundles.value = [...bundleResponse.bundles];
    // }

    // 暫時使用空陣列
    bundles.value = [];
    filteredBundles.value = [];

  } catch (error) {
    console.error('獲取資料失敗:', error);
  } finally {
    isLoadingData.value = false;
  }
};

// 生命週期鉤子
onMounted(async () => {
  // 獲取基礎資料
  await fetchData();
});
</script>

<style scoped>
.item-thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.table th {
  background-color: #f8f9fa;
}
</style>
