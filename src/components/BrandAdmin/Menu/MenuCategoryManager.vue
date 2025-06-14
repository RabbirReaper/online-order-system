<template>
  <div class="category-manager">
    <div class="card">
      <div class="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 class="mb-0">{{ title }}</h5>
        <button type="button" class="btn btn-sm btn-primary" @click="addCategory">
          <i class="bi bi-plus-circle me-1"></i>新增分類
        </button>
      </div>
      <div class="card-body">
        <!-- 分類列表 -->
        <div v-if="categories.length > 0" class="categories-list">
          <div v-for="(category, index) in sortedCategories" :key="index" class="category-item mb-3">
            <div class="card">
              <div class="card-header bg-light d-flex justify-content-between align-items-center py-2">
                <div class="d-flex align-items-center">
                  <span class="category-handle me-2" title="拖曳調整順序">
                    <i class="bi bi-grip-vertical"></i>
                  </span>
                  <h6 class="mb-0">{{ category.name || `分類 #${index + 1}` }}</h6>
                  <span class="badge bg-info ms-2" v-if="category.items && category.items.length > 0">
                    {{ category.items.length }} 項商品
                  </span>
                </div>
                <div>
                  <button type="button" class="btn btn-sm btn-outline-primary me-1" @click="editCategory(index)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-danger" @click="removeCategory(index)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              <div class="card-body" v-if="expandedCategories[index]">
                <div class="mb-3">
                  <label :for="`category-name-${index}`" class="form-label required">分類名稱</label>
                  <input type="text" class="form-control" :id="`category-name-${index}`" v-model="category.name"
                    :class="{ 'is-invalid': getCategoryError(index, 'name') }" />
                  <div class="invalid-feedback" v-if="getCategoryError(index, 'name')">
                    {{ getCategoryError(index, 'name') }}
                  </div>
                </div>

                <div class="mb-3">
                  <label :for="`category-desc-${index}`" class="form-label">分類描述</label>
                  <textarea class="form-control" :id="`category-desc-${index}`" v-model="category.description"
                    rows="2"></textarea>
                </div>

                <div class="mb-3">
                  <label :for="`category-order-${index}`" class="form-label">顯示順序</label>
                  <input type="number" class="form-control" :id="`category-order-${index}`"
                    v-model.number="category.order" min="0" />
                  <div class="form-text">數字越小，顯示越前面</div>
                </div>

                <!-- 商品預覽 -->
                <div class="mb-3" v-if="category.items && category.items.length > 0">
                  <label class="form-label">商品預覽</label>
                  <div class="border rounded p-2 bg-light">
                    <div class="row g-2">
                      <div v-for="(item, itemIndex) in category.items.slice(0, 3)" :key="itemIndex" class="col-auto">
                        <span class="badge" :class="getItemTypeBadgeClass(item.itemType)">
                          {{ getItemTypeText(item.itemType) }}
                        </span>
                      </div>
                      <div v-if="category.items.length > 3" class="col-auto">
                        <span class="text-muted">+{{ category.items.length - 3 }} 項...</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="d-flex justify-content-end">
                  <button type="button" class="btn btn-sm btn-outline-secondary" @click="cancelEdit(index)">
                    收起
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 無分類提示 -->
        <div v-else class="text-center p-4 bg-light rounded">
          <p class="mb-2">此菜單尚未添加任何分類</p>
          <button type="button" class="btn btn-primary" @click="addCategory">
            <i class="bi bi-plus-circle me-1"></i>新增第一個分類
          </button>
        </div>
      </div>
    </div>

    <!-- 新增/編輯分類模態框 -->
    <b-modal id="categoryModal" v-model:show="showModal" :title="editMode ? '編輯分類' : '新增分類'" @ok="saveCategory"
      @cancel="resetModalForm" ok-title="確定" cancel-title="取消">
      <div class="mb-3">
        <label for="categoryName" class="form-label required">分類名稱</label>
        <input type="text" class="form-control" id="categoryName" v-model="modalForm.name"
          :class="{ 'is-invalid': modalErrors.name }" />
        <div class="invalid-feedback" v-if="modalErrors.name">{{ modalErrors.name }}</div>
      </div>

      <div class="mb-3">
        <label for="categoryDescription" class="form-label">分類描述</label>
        <textarea class="form-control" id="categoryDescription" v-model="modalForm.description" rows="3"></textarea>
      </div>

      <div class="mb-3">
        <label for="categoryOrder" class="form-label">顯示順序</label>
        <input type="number" class="form-control" id="categoryOrder" v-model.number="modalForm.order" min="0" />
        <div class="form-text">數字越小，顯示越前面</div>
      </div>
    </b-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { BModal } from 'bootstrap-vue-next';

// 定義props
const props = defineProps({
  title: {
    type: String,
    default: '菜單分類管理'
  },
  // 分類資料
  modelValue: {
    type: Array,
    required: true
  },
  // 錯誤信息
  errors: {
    type: Array,
    default: () => []
  }
});

// 定義事件
const emit = defineEmits(['update:modelValue']);

// 內部狀態
const categories = ref([]);
const expandedCategories = ref({});
const editMode = ref(false);
const editIndex = ref(-1);
const showModal = ref(false);

// 模態框表單
const modalForm = reactive({
  name: '',
  description: '',
  order: 0
});

// 模態框錯誤
const modalErrors = reactive({
  name: ''
});

// 按照順序排序的分類
const sortedCategories = computed(() => {
  return [...categories.value].sort((a, b) => a.order - b.order);
});

// 從props同步資料
watch(() => props.modelValue, (newValue) => {
  categories.value = JSON.parse(JSON.stringify(newValue)); // 深複製
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

// 獲取分類欄位錯誤
const getCategoryError = (categoryIndex, field) => {
  if (!props.errors || !props.errors[categoryIndex]) {
    return '';
  }
  return props.errors[categoryIndex][field] || '';
};

// 添加分類
const addCategory = () => {
  editMode.value = false;
  editIndex.value = -1;

  // 重置表單
  modalForm.name = '';
  modalForm.description = '';
  modalForm.order = categories.value.length;
  modalErrors.name = '';

  // 顯示模態框
  showModal.value = true;
};

// 編輯分類
const editCategory = (index) => {
  editMode.value = true;
  editIndex.value = index;

  // 設置表單值
  const category = categories.value[index];
  modalForm.name = category.name || '';
  modalForm.description = category.description || '';
  modalForm.order = category.order !== undefined ? category.order : index;
  modalErrors.name = '';

  // 顯示模態框
  showModal.value = true;
};

// 在列表中直接展開/收起分類編輯區域
const toggleExpanded = (index) => {
  expandedCategories.value[index] = !expandedCategories.value[index];
};

// 收起分類編輯區域
const cancelEdit = (index) => {
  expandedCategories.value[index] = false;
};

// 移除分類
const removeCategory = (index) => {
  const category = categories.value[index];
  const categoryName = category.name || `分類 #${index + 1}`;

  let confirmMessage = `確定要刪除分類「${categoryName}」嗎？`;
  if (category.items && category.items.length > 0) {
    confirmMessage += `\n\n此分類包含 ${category.items.length} 個商品，刪除後將一併移除。`;
  }

  if (confirm(confirmMessage)) {
    // 移除分類
    const newCategories = [...categories.value];
    newCategories.splice(index, 1);

    // 重新排序
    newCategories.forEach((category, idx) => {
      category.order = idx;
    });

    // 更新數據
    categories.value = newCategories;
    emit('update:modelValue', newCategories);
  }
};

// 重置模態框表單
const resetModalForm = () => {
  modalForm.name = '';
  modalForm.description = '';
  modalForm.order = 0;
  modalErrors.name = '';
};

// 保存分類
const saveCategory = () => {
  // 驗證
  modalErrors.name = '';

  if (!modalForm.name.trim()) {
    modalErrors.name = '分類名稱為必填項';
    return;
  }

  // 建立或更新分類
  const newCategories = [...categories.value];

  if (editMode.value && editIndex.value >= 0) {
    // 更新現有分類
    newCategories[editIndex.value] = {
      ...newCategories[editIndex.value],
      name: modalForm.name,
      description: modalForm.description,
      order: modalForm.order
    };
  } else {
    // 添加新分類
    newCategories.push({
      name: modalForm.name,
      description: modalForm.description,
      order: modalForm.order,
      items: [] // 新分類預設無商品
    });
  }

  // 更新數據
  categories.value = newCategories;
  emit('update:modelValue', newCategories);

  // 關閉模態框
  showModal.value = false;
};
</script>

<style scoped>
/* 必填欄位標記 */
.required::after {
  content: " *";
  color: #dc3545;
}

.category-handle {
  cursor: move;
  color: #6c757d;
}

.category-handle:hover {
  color: #0d6efd;
}

.category-item {
  transition: box-shadow 0.2s;
}

.category-item:hover {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>
