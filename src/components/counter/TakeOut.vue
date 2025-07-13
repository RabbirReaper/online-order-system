<template>
  <MenuOrder
    :brand-id="brandId"
    :store-id="storeId"
    order-type="takeout"
    title="外帶點餐"
    theme-color="#28a745"
    theme-class="success"
  />
</template>

<script setup>
import MenuOrder from './MenuOrder.vue'

const props = defineProps({
  brandId: {
    type: String,
    required: true,
  },
  storeId: {
    type: String,
    required: true,
  },
})
</script>
