<template>
  <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">輸入桌號</h5>
          <button type="button" class="btn-close" @click="emit('close')"></button>
        </div>
        <div class="modal-body">
          <div class="text-center mb-4">
            <h4>桌號: {{ tableNumber || '空白' }}</h4>
          </div>

          <!-- 自定義鍵盤 -->
          <div class="custom-keypad">
            <div class="row g-2 mb-2">
              <div class="col-4" v-for="char in ['A', 'B', 'C']" :key="char">
                <button class="btn btn-outline-primary w-100" @click="appendToTableNumber(char)">
                  {{ char }}
                </button>
              </div>
            </div>
            <div class="row g-2 mb-2">
              <div class="col-4" v-for="num in [1, 2, 3]" :key="num">
                <button class="btn btn-outline-secondary w-100" @click="appendToTableNumber(num)">
                  {{ num }}
                </button>
              </div>
            </div>
            <div class="row g-2 mb-2">
              <div class="col-4" v-for="num in [4, 5, 6]" :key="num">
                <button class="btn btn-outline-secondary w-100" @click="appendToTableNumber(num)">
                  {{ num }}
                </button>
              </div>
            </div>
            <div class="row g-2 mb-2">
              <div class="col-4" v-for="num in [7, 8, 9]" :key="num">
                <button class="btn btn-outline-secondary w-100" @click="appendToTableNumber(num)">
                  {{ num }}
                </button>
              </div>
            </div>
            <div class="row g-2">
              <div class="col-4">
                <button class="btn btn-outline-secondary w-100" @click="appendToTableNumber(0)">
                  0
                </button>
              </div>
              <div class="col-4">
                <button class="btn btn-outline-danger w-100" @click="clearTableNumber">清除</button>
              </div>
              <div class="col-4">
                <button class="btn btn-outline-danger w-100" @click="deleteLastChar">
                  <i class="bi bi-backspace"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- 手動輸入 -->
          <div class="mt-3">
            <label for="manualTableInput" class="form-label">或手動輸入桌號</label>
            <input
              type="text"
              id="manualTableInput"
              class="form-control"
              v-model="tableNumber"
              placeholder="請輸入桌號"
              @keyup.enter="confirmTableNumber"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="emit('close')">取消</button>
          <button type="button" class="btn btn-primary" @click="confirmTableNumber">確認</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['close', 'confirm'])

// 桌號
const tableNumber = ref('')

// 加入字符到桌號
const appendToTableNumber = (char) => {
  tableNumber.value = tableNumber.value + char.toString()
}

// 清除桌號
const clearTableNumber = () => {
  tableNumber.value = ''
}

// 刪除最後一個字符
const deleteLastChar = () => {
  if (tableNumber.value.length > 0) {
    tableNumber.value = tableNumber.value.slice(0, -1)
  }
}

// 確認桌號
const confirmTableNumber = () => {
  emit('confirm', tableNumber.value.trim())
}
</script>

<style scoped>
.custom-keypad {
  max-width: 300px;
  margin: 0 auto;
}

.custom-keypad .btn {
  height: 50px;
  font-size: 1.2rem;
}
</style>
