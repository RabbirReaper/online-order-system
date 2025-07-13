<template>
  <div class="verification-code-container">
    <label v-if="label" :for="inputId" class="form-label">{{ label }}</label>
    <div class="code-input-group">
      <input
        v-for="(digit, index) in codeArray"
        :key="index"
        type="text"
        class="code-input"
        maxlength="1"
        :value="digit"
        @input="updateDigit($event, index)"
        @keydown="handleKeydown($event, index)"
        @focus="$event.target.select()"
        :ref="
          (el) => {
            if (el) digitRefs[index] = el
          }
        "
      />
    </div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="hint" class="hint-text">{{ hint }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  length: {
    type: Number,
    default: 6,
  },
  label: {
    type: String,
    default: '驗證碼',
  },
  error: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  inputId: {
    type: String,
    default: 'verification-code',
  },
  autoFocus: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'completed'])

// 將字符串轉換為數組
const codeArray = ref(Array(props.length).fill(''))
const digitRefs = ref([])

// 根據 modelValue 更新數組
const updateArrayFromModelValue = () => {
  const value = props.modelValue || ''
  const newArray = Array(props.length).fill('')

  for (let i = 0; i < Math.min(value.length, props.length); i++) {
    newArray[i] = value[i]
  }

  codeArray.value = newArray
}

// 從數組更新 modelValue
const updateModelValue = () => {
  const value = codeArray.value.join('')
  emit('update:modelValue', value)

  // 當所有位數都填寫完畢時，觸發 completed 事件
  if (value.length === props.length && !value.includes('')) {
    emit('completed', value)
  }
}

// 更新指定位置的數字
const updateDigit = (event, index) => {
  const value = event.target.value

  // 只允許數字
  if (/^\d*$/.test(value)) {
    const char = value.slice(-1)
    codeArray.value[index] = char
    updateModelValue()

    // 如果輸入了有效的數字，自動跳到下一個輸入框
    if (char && index < props.length - 1) {
      digitRefs.value[index + 1].focus()
    }
  } else {
    // 恢復原始值
    event.target.value = codeArray.value[index]
  }
}

// 處理鍵盤事件
const handleKeydown = (event, index) => {
  if (event.key === 'Backspace' && index > 0 && !codeArray.value[index]) {
    // 當前位置為空且按下退格鍵，焦點移到前一個輸入框
    codeArray.value[index - 1] = ''
    updateModelValue()
    digitRefs.value[index - 1].focus()
  } else if (event.key === 'ArrowLeft' && index > 0) {
    // 左方向鍵，焦點移到前一個輸入框
    digitRefs.value[index - 1].focus()
  } else if (event.key === 'ArrowRight' && index < props.length - 1) {
    // 右方向鍵，焦點移到後一個輸入框
    digitRefs.value[index + 1].focus()
  }
}

// 監聽 modelValue 變化
watch(
  () => props.modelValue,
  () => {
    updateArrayFromModelValue()
  },
)

// 組件掛載後初始化
onMounted(() => {
  updateArrayFromModelValue()

  // 自動聚焦到第一個輸入框
  if (props.autoFocus && digitRefs.value.length > 0) {
    setTimeout(() => {
      digitRefs.value[0].focus()
    }, 100)
  }
})
</script>

<style scoped>
.verification-code-container {
  margin-bottom: 1.25rem;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
  color: #333;
}

.code-input-group {
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
}

.code-input {
  width: 3rem;
  height: 3rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1.5rem;
  text-align: center;
  flex: 1;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.code-input:focus {
  border-color: #d35400;
  box-shadow: 0 0 0 0.25rem rgba(211, 84, 0, 0.25);
  outline: none;
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.hint-text {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

@media (max-width: 480px) {
  .code-input {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.25rem;
  }

  .code-input-group {
    gap: 0.3rem;
  }
}

@media (max-width: 360px) {
  .code-input {
    width: 2rem;
    height: 2.5rem;
    font-size: 1.1rem;
  }

  .code-input-group {
    gap: 0.2rem;
  }
}
</style>
