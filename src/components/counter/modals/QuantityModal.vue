<template>
  <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">調整數量</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div class="text-center mb-3">
            <h4>數量: {{ tempQuantity }}</h4>
          </div>
          <div class="number-keypad">
            <div class="row g-2">
              <div class="col-4" v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="num">
                <button
                  class="btn btn-outline-secondary w-100"
                  @click="$emit('appendQuantity', num)"
                >
                  {{ num }}
                </button>
              </div>
              <div class="col-4">
                <button class="btn btn-outline-secondary w-100" @click="$emit('appendQuantity', 0)">
                  0
                </button>
              </div>
              <div class="col-4">
                <button
                  class="btn btn-outline-secondary w-100"
                  @click="$emit('appendQuantity', '00')"
                >
                  00
                </button>
              </div>
              <div class="col-4">
                <button class="btn btn-outline-danger w-100" @click="$emit('clearQuantity')">
                  清除
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">取消</button>
          <button type="button" class="btn btn-primary" @click="$emit('confirm')">確認</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  tempQuantity: {
    type: Number,
    required: true,
  },
})

defineEmits(['close', 'appendQuantity', 'clearQuantity', 'confirm'])
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
</style>
