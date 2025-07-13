<template>
  <MenuOrder
    :brand-id="brandId"
    :store-id="storeId"
    order-type="dine_in"
    title="內用點餐"
    theme-color="#007bff"
    theme-class="primary"
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
