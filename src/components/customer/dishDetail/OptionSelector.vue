<template>
  <div class="option-selector">
    <h5 class="option-category-name">
      {{ category.name }}
      <span v-if="isRequired" class="required-badge">必選</span>
    </h5>

    <p v-if="category.description" class="option-category-description text-muted">
      {{ category.description }}
    </p>

    <div class="option-selection-hint mb-2">
      <small class="text-muted">
        {{ selectionHint }}
      </small>
    </div>

    <!-- 單選選項 -->
    <div v-if="category.inputType === 'single'" class="single-options">
      <BFormRadioGroup v-model="selectedValue" :name="`option-${category._id}`" stacked>
        <BFormRadio v-for="option in options" :key="option._id" :value="option._id" class="option-radio mb-2">
          <div class="d-flex justify-content-between align-items-center w-100">
            <span>{{ option.name }}</span>
            <span v-if="option.price > 0" class="option-price">+${{ option.price }}</span>
          </div>
        </BFormRadio>
      </BFormRadioGroup>
    </div>

    <!-- 多選選項 -->
    <div v-else class="multiple-options">
      <BFormCheckboxGroup v-model="selectedValues" :name="`option-${category._id}`" stacked>
        <BFormCheckbox v-for="option in options" :key="option._id" :value="option._id" class="option-checkbox mb-2">
          <div class="d-flex justify-content-between align-items-center w-100">
            <span>{{ option.name }}</span>
            <span v-if="option.price > 0" class="option-price">+${{ option.price }}</span>
          </div>
        </BFormCheckbox>
      </BFormCheckboxGroup>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';

// 定義 props
const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  options: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: [String, Array],
    default: () => []
  }
});

// 定義 emits
const emit = defineEmits(['update:modelValue']);

// 計算是否為必選
const isRequired = computed(() => {
  // 通常餐飲系統中，如果是單選類別，就是必選項
  return props.category.inputType === 'single';
});

// 顯示選擇提示文字
const selectionHint = computed(() => {
  if (props.category.inputType === 'single') {
    return '請選擇 1 項';
  } else {
    return '可複選多項';
  }
});

// 單選值
const selectedValue = computed({
  get() {
    return typeof props.modelValue === 'string' ? props.modelValue : '';
  },
  set(value) {
    emit('update:modelValue', value);
  }
});

// 多選值
const selectedValues = computed({
  get() {
    return Array.isArray(props.modelValue) ? props.modelValue : [];
  },
  set(value) {
    emit('update:modelValue', value);
  }
});

// 監聽 category 變化，重設選擇
watch(() => props.category, () => {
  if (props.category.inputType === 'single') {
    selectedValue.value = '';
  } else {
    selectedValues.value = [];
  }
}, { deep: true });
</script>

<style scoped>
.option-selector {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.option-category-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.required-badge {
  font-size: 0.75rem;
  background-color: #dc3545;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

.option-category-description {
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.option-radio,
.option-checkbox {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  transition: all 0.2s;
}

.option-radio label,
.option-checkbox label {
  width: 100%;
  margin-bottom: 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
}

.option-price {
  font-weight: 600;
  color: #e74c3c;
}

/* 自定義單選框和多選框樣式 */
.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.form-check-input:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.option-radio:has(.form-check-input:checked),
.option-checkbox:has(.form-check-input:checked) {
  border-color: #0d6efd;
  background-color: rgba(13, 110, 253, 0.05);
}
</style>
