import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterModalsStore = defineStore('counterModals', () => {
  // 模態框狀態管理
  const modals = ref({
    adjustment: {
      show: false,
      tempAdjustment: 0,
      adjustmentType: 'add', // 'add' 或 'subtract'
      editingOrder: null,
    },
    checkout: {
      show: false,
      total: 0,
      orderId: null,
    },
    cashCalculator: {
      show: false,
      total: 0,
    },
    tableNumber: {
      show: false,
    },
  })

  // 模態框管理方法
  const openAdjustmentModal = (order = null, currentManualAdjustment = 0) => {
    if (order) {
      modals.value.adjustment.editingOrder = order
      modals.value.adjustment.tempAdjustment = Math.abs(order.manualAdjustment || 0)
      modals.value.adjustment.adjustmentType =
        (order.manualAdjustment || 0) >= 0 ? 'add' : 'subtract'
    } else {
      modals.value.adjustment.editingOrder = null
      modals.value.adjustment.tempAdjustment = Math.abs(currentManualAdjustment)
      modals.value.adjustment.adjustmentType = currentManualAdjustment >= 0 ? 'add' : 'subtract'
    }
    modals.value.adjustment.show = true
  }

  const openCheckoutModal = (orderId, total) => {
    modals.value.checkout.orderId = orderId
    modals.value.checkout.total = total
    modals.value.checkout.show = true
  }

  const openCashCalculatorModal = (total) => {
    modals.value.cashCalculator.total = total
    modals.value.cashCalculator.show = true
  }

  const openTableNumberModal = () => {
    modals.value.tableNumber.show = true
  }

  const closeModal = (modalName) => {
    if (modals.value[modalName]) {
      modals.value[modalName].show = false
      // 重置相關狀態
      if (modalName === 'adjustment') {
        modals.value.adjustment.editingOrder = null
        modals.value.adjustment.tempAdjustment = 0
      } else if (modalName === 'checkout') {
        modals.value.checkout.orderId = null
        modals.value.checkout.total = 0
      }
    }
  }

  // 調帳相關方法
  const setAdjustmentType = (type) => {
    modals.value.adjustment.adjustmentType = type
    modals.value.adjustment.tempAdjustment = 0
  }

  const appendToAdjustment = (num) => {
    modals.value.adjustment.tempAdjustment = parseInt(
      `${modals.value.adjustment.tempAdjustment}${num}`,
    )
  }

  const clearAdjustment = () => {
    modals.value.adjustment.tempAdjustment = 0
  }

  return {
    // 狀態
    modals,

    // 方法
    openAdjustmentModal,
    openCheckoutModal,
    openCashCalculatorModal,
    openTableNumberModal,
    closeModal,
    setAdjustmentType,
    appendToAdjustment,
    clearAdjustment,
  }
})
