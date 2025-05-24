<template>
  <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">選擇付款方式</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body text-center">
          <div class="mb-4">
            <h3>應付金額：${{ total }}</h3>
          </div>
          <div class="row g-3">
            <div class="col-6">
              <button class="btn btn-primary btn-lg w-100 py-4" @click="$emit('onlinePayment')">
                <i class="bi bi-credit-card fs-1 d-block mb-2"></i>
                線上付款
              </button>
            </div>
            <div class="col-6">
              <button class="btn btn-success btn-lg w-100 py-4" @click="$emit('cashPayment')">
                <i class="bi bi-cash-stack fs-1 d-block mb-2"></i>
                現場付款
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  total: {
    type: Number,
    required: true
  }
});

defineEmits(['close', 'onlinePayment', 'cashPayment']);
</script>

<style scoped>
.btn-lg {
  transition: all 0.3s;
}

.btn-lg:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}
</style>
