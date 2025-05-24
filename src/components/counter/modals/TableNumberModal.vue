<template>
  <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">輸入桌號</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div class="text-center mb-4">
            <h4>桌號: {{ tableNumber || '請輸入' }}</h4>
          </div>

          <!-- 快速桌號按鈕 -->
          <div class="quick-tables mb-4">
            <div class="row g-2">
              <div v-for="num in quickTableNumbers" :key="num" class="col-3">
                <button class="btn btn-outline-primary w-100" @click="selectTableNumber(num)">
                  {{ num }}
                </button>
              </div>
            </div>
          </div>

          <!-- 數字鍵盤 -->
          <div class="number-keypad">
            <div class="row g-2">
              <div class="col-4" v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="num">
                <button class="btn btn-outline-secondary w-100" @click="appendToTableNumber(num)">{{ num }}</button>
              </div>
              <div class="col-4">
                <button class="btn btn-outline-secondary w-100" @click="appendToTableNumber(0)">0</button>
              </div>
              <div class="col-4">
                <button class="btn btn-outline-secondary w-100" @click="appendToTableNumber('00')">00</button>
              </div>
              <div class="col-4">
                <button class="btn btn-outline-danger w-100" @click="clearTableNumber">清除</button>
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
            >
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">取消</button>
          <button
            type="button"
            class="btn btn-primary"
            @click="confirmTableNumber"
            :disabled="!tableNumber"
          >
            確認
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineEmits(['close', 'confirm']);

// 桌號
const tableNumber = ref('');

// 快速桌號選項
const quickTableNumbers = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', '1', '2', '3', '4', '5', '6', '7', '8'];

// 選擇桌號
const selectTableNumber = (number) => {
  tableNumber.value = number.toString();
};

// 加入數字到桌號
const appendToTableNumber = (num) => {
  if (tableNumber.value === '' && num !== '00') {
    tableNumber.value = num.toString();
  } else {
    tableNumber.value = tableNumber.value + num.toString();
  }
};

// 清除桌號
const clearTableNumber = () => {
  tableNumber.value = '';
};

// 確認桌號
const confirmTableNumber = () => {
  if (tableNumber.value.trim()) {
    emit('confirm', tableNumber.value.trim());
  }
};
</script>

<style scoped>
.number-keypad {
  max-width: 300px;
  margin: 0 auto;
}

.number-keypad .btn {
  height: 50px;
  font-size: 1.2rem;
}

.quick-tables .btn {
  height: 50px;
  font-size: 1rem;
}
</style>
