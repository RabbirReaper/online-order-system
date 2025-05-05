<template>
  <div class="menu-item-manager">
    <div class="card">
      <div class="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 class="mb-0">{{ categoryName }} 餐點管理</h5>
        <button type="button" class="btn btn-sm btn-primary" @click="addDish">
          <i class="bi bi-plus-circle me-1"></i>新增餐點
        </button>
      </div>
      <div class="card-body">
        <!-- 餐點列表 -->
        <div v-if="dishes.length > 0" class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th style="width: 60px">順序</th>
                <th style="width: 80px">圖片</th>
                <th>餐點名稱</th>
                <th style="width: 120px">價格</th>
                <th style="width: 100px">狀態</th>
                <th style="width: 150px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(dish, index) in sortedDishes" :key="index" :class="{ 'table-secondary': !dish.isPublished }">
                <td>{{ dish.order }}</td>
                <td>
                  <img :src="getDishImage(dish)" class="dish-thumbnail" :alt="getDishName(dish)">
                </td>
                <td>
                  <div class="fw-bold">{{ getDishName(dish) }}</div>
                  <div class="small text-muted">{{ getDishDescription(dish) }}</div>
                </td>
                <td>{{ formatPrice(dish.price || getDishPrice(dish)) }}</td>
                <td>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" :id="`dish-status-${index}`"
                      v-model="dish.isPublished" @change="updateDish(index)">
                    <label class="form-check-label small" :for="`dish-status-${index}`">
                      {{ dish.isPublished ? '啟用' : '停用' }}
                    </label>
                  </div>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-primary" @click="editDish(index)" title="編輯">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary" @click="moveUp(index)"
                      :disabled="index === 0" title="上移">
                      <i class="bi bi-arrow-up"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary" @click="moveDown(index)"
                      :disabled="index === dishes.length - 1" title="下移">
                      <i class="bi bi-arrow-down"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger" @click="removeDish(index)" title="刪除">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 無餐點提示 -->
        <div v-else class="text-center p-4 bg-light rounded">
          <p class="mb-2">此分類尚未添加任何餐點</p>
          <button type="button" class="btn btn-primary" @click="addDish">
            <i class="bi bi-plus-circle me-1"></i>新增第一個餐點
          </button>
        </div>
      </div>
    </div>

    <!-- 編輯餐點價格模態框 -->
    <div class="modal fade" id="dishModal" tabindex="-1" aria-labelledby="dishModalLabel" aria-hidden="true"
      ref="modalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="dishModalLabel">編輯餐點</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">餐點名稱</label>
              <input type="text" class="form-control" disabled :value="editForm.name">
            </div>
            <div class="mb-3">
              <label class="form-label">模板價格</label>
              <input type="text" class="form-control" disabled :value="formatPrice(editForm.basePrice)">
            </div>
            <div class="mb-3">
              <label for="dishPrice" class="form-label">自訂價格 (可選)</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input type="number" id="dishPrice" class="form-control" v-model="editForm.price"
                  placeholder="留空則使用模板價格">
              </div>
              <div class="form-text">若要使用模板價格，請留空此欄位</div>
            </div>
            <div class="mb-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="dishIsPublished" v-model="editForm.isPublished">
                <label class="form-check-label" for="dishIsPublished">在菜單中啟用</label>
              </div>
            </div>
            <div class="mb-3">
              <label for="dishOrder" class="form-label">顯示順序</label>
              <input type="number" class="form-control" id="dishOrder" v-model.number="editForm.order" min="0">
              <div class="form-text">數字越小，顯示越前面</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="saveDish">儲存變更</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加餐點模態框 -->
    <div class="modal fade" id="addDishModal" tabindex="-1" aria-labelledby="addDishModalLabel" aria-hidden="true"
      ref="addModalRef">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addDishModalLabel">添加餐點到 {{ categoryName }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="isLoadingTemplates" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加載中...</span>
              </div>
            </div>
            <div v-else>
              <!-- 搜尋框 -->
              <div class="mb-3">
                <input type="text" class="form-control" placeholder="搜尋餐點..." v-model="dishSearchQuery"
                  @input="filterDishTemplates">
              </div>

              <!-- 餐點模板列表 -->
              <div v-if="filteredDishTemplates.length > 0" class="table-responsive">
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
                        <img :src="template.image?.url || '/placeholder.jpg'" class="dish-thumbnail" alt="">
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
                        <button class="btn btn-sm btn-primary" @click="selectDishTemplate(template)">
                          <i class="bi bi-plus-lg me-1"></i>選擇
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center py-3">
                <p class="mb-0 text-muted">找不到符合條件的餐點模板</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { Modal } from 'bootstrap';
import api from '@/api';

// 定義props
const props = defineProps({
  categoryName: {
    type: String,
    default: '未命名分類'
  },
  // 餐點資料
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
const dishes = ref([]);
const editIndex = ref(-1);
const modalInstance = ref(null);
const addModalInstance = ref(null);
const modalRef = ref(null);
const addModalRef = ref(null);
const isLoadingTemplates = ref(false);
const dishTemplates = ref([]);
const filteredDishTemplates = ref([]);
const dishSearchQuery = ref('');

// 編輯表單
const editForm = reactive({
  name: '',
  basePrice: 0,
  price: null,
  isPublished: true,
  order: 0
});

// 按照順序排序的餐點
const sortedDishes = computed(() => {
  return [...dishes.value].sort((a, b) => a.order - b.order);
});

// 從props同步資料
watch(() => props.modelValue, (newValue) => {
  dishes.value = JSON.parse(JSON.stringify(newValue)); // 深複製
}, { deep: true, immediate: true });

// 格式化價格
const formatPrice = (price) => {
  if (price === undefined || price === null) return '$0';
  return `$${price}`;
};

// 獲取餐點名稱
const getDishName = (dish) => {
  if (!dish || !dish.dishTemplate) return '未知餐點';
  const template = dishTemplates.value.find(t => t._id === dish.dishTemplate);
  return template ? template.name : '未知餐點';
};

// 獲取餐點描述
const getDishDescription = (dish) => {
  if (!dish || !dish.dishTemplate) return '';
  const template = dishTemplates.value.find(t => t._id === dish.dishTemplate);
  return template ? template.description : '';
};

// 獲取餐點圖片
const getDishImage = (dish) => {
  if (!dish || !dish.dishTemplate) return '/placeholder.jpg';
  const template = dishTemplates.value.find(t => t._id === dish.dishTemplate);
  return template && template.image && template.image.url ? template.image.url : '/placeholder.jpg';
};

// 獲取餐點價格
const getDishPrice = (dish) => {
  if (!dish) return 0;
  if (dish.price !== undefined && dish.price !== null) return dish.price;
  const template = dishTemplates.value.find(t => t._id === dish.dishTemplate);
  return template ? template.basePrice : 0;
};

// 添加餐點
const addDish = async () => {
  // 獲取餐點模板
  await fetchDishTemplates();

  // 重置搜尋
  dishSearchQuery.value = '';
  filterDishTemplates();

  // 顯示模態框
  if (addModalInstance.value) {
    addModalInstance.value.show();
  }
};

// 篩選餐點模板
const filterDishTemplates = () => {
  if (!dishTemplates.value.length) return;

  const query = dishSearchQuery.value.toLowerCase().trim();
  if (!query) {
    filteredDishTemplates.value = [...dishTemplates.value];
    return;
  }

  filteredDishTemplates.value = dishTemplates.value.filter(template =>
    template.name.toLowerCase().includes(query) ||
    (template.description && template.description.toLowerCase().includes(query))
  );
};

// 選擇餐點模板
const selectDishTemplate = (template) => {
  // 檢查是否已經添加過此模板
  const exists = dishes.value.some(dish => dish.dishTemplate === template._id);

  if (exists) {
    if (!confirm(`「${template.name}」已存在於此分類中，是否再次添加？`)) {
      return;
    }
  }

  // 添加餐點
  const newDish = {
    dishTemplate: template._id,
    price: null, // 使用模板價格
    isPublished: true,
    order: dishes.value.length // 預設為最後
  };

  const newDishes = [...dishes.value, newDish];
  dishes.value = newDishes;
  emit('update:modelValue', newDishes);

  // 關閉模態框
  if (addModalInstance.value) {
    addModalInstance.value.hide();
  }
};

// 編輯餐點
const editDish = (index) => {
  editIndex.value = index;
  const dish = dishes.value[index];
  const template = dishTemplates.value.find(t => t._id === dish.dishTemplate);

  // 設置表單值
  editForm.name = template ? template.name : '未知餐點';
  editForm.basePrice = template ? template.basePrice : 0;
  editForm.price = dish.price !== undefined && dish.price !== null ? dish.price : '';
  editForm.isPublished = dish.isPublished !== undefined ? dish.isPublished : true;
  editForm.order = dish.order !== undefined ? dish.order : index;

  // 顯示模態框
  if (modalInstance.value) {
    modalInstance.value.show();
  }
};

// 更新餐點 (僅更新狀態)
const updateDish = (index) => {
  const newDishes = [...dishes.value];
  emit('update:modelValue', newDishes);
};

// 保存餐點編輯
const saveDish = () => {
  if (editIndex.value < 0) return;

  // 更新餐點
  const newDishes = [...dishes.value];
  const dish = newDishes[editIndex.value];

  // 更新價格
  if (editForm.price === '' || editForm.price === null) {
    dish.price = null; // 使用模板價格
  } else {
    dish.price = parseFloat(editForm.price);
  }

  // 更新啟用狀態和順序
  dish.isPublished = editForm.isPublished;
  dish.order = editForm.order;

  // 更新數據
  dishes.value = newDishes;
  emit('update:modelValue', newDishes);

  // 關閉模態框
  if (modalInstance.value) {
    modalInstance.value.hide();
  }
};

// 移除餐點
const removeDish = (index) => {
  if (!confirm(`確定要移除「${getDishName(dishes.value[index])}」嗎？`)) {
    return;
  }

  // 移除餐點
  const newDishes = [...dishes.value];
  newDishes.splice(index, 1);

  // 重新排序
  newDishes.forEach((dish, idx) => {
    dish.order = idx;
  });

  // 更新數據
  dishes.value = newDishes;
  emit('update:modelValue', newDishes);
};

// 上移餐點
const moveUp = (index) => {
  if (index <= 0) return;

  const newDishes = [...dishes.value];
  // 交換順序號
  const temp = newDishes[index].order;
  newDishes[index].order = newDishes[index - 1].order;
  newDishes[index - 1].order = temp;

  // 更新數據
  dishes.value = newDishes;
  emit('update:modelValue', newDishes);
};

// 下移餐點
const moveDown = (index) => {
  if (index >= dishes.value.length - 1) return;

  const newDishes = [...dishes.value];
  // 交換順序號
  const temp = newDishes[index].order;
  newDishes[index].order = newDishes[index + 1].order;
  newDishes[index + 1].order = temp;

  // 更新數據
  dishes.value = newDishes;
  emit('update:modelValue', newDishes);
};

// 獲取餐點模板
const fetchDishTemplates = async () => {
  if (!props.brandId) return;

  isLoadingTemplates.value = true;

  try {
    const response = await api.dish.getAllDishTemplates({ brandId: props.brandId });
    if (response && response.templates) {
      dishTemplates.value = response.templates;
      filteredDishTemplates.value = [...response.templates];
    }
  } catch (error) {
    console.error('獲取餐點模板失敗:', error);
  } finally {
    isLoadingTemplates.value = false;
  }
};

// 生命週期鉤子
onMounted(async () => {
  // 初始化模態框
  if (modalRef.value) {
    modalInstance.value = new Modal(modalRef.value);
  }

  if (addModalRef.value) {
    addModalInstance.value = new Modal(addModalRef.value);
  }

  // 獲取餐點模板
  await fetchDishTemplates();
});
</script>

<style scoped>
.dish-thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.table th {
  background-color: #f8f9fa;
}
</style>
