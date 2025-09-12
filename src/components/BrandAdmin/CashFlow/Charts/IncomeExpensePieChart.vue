<template>
  <div>
    <Pie :data="chartData" :options="chartOptions" :height="height" :width="width" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js'
import { Pie } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const props = defineProps({
  summary: {
    type: Object,
    required: true,
    default: () => ({
      totalIncome: 0,
      totalExpense: 0,
      incomeRecords: 0,
      expenseRecords: 0,
    }),
  },
  width: {
    type: Number,
    default: 400,
  },
  height: {
    type: Number,
    default: 400,
  },
})

onMounted(() => {
  console.log('IncomeExpensePieChart mounted with props:', props)
})

const chartData = computed(() => {
  const { totalIncome, totalExpense, incomeRecords, expenseRecords } = props.summary || {}

  // 如果沒有數據，顯示空狀態
  if (!totalIncome && !totalExpense) {
    return {
      labels: ['暫無記錄'],
      datasets: [
        {
          data: [1],
          backgroundColor: ['rgba(149, 165, 166, 0.7)'],
          borderColor: ['rgba(149, 165, 166, 1)'],
          borderWidth: 2,
        },
      ],
    }
  }

  // 如果只有其中一種類型的數據
  if (!totalIncome) {
    return {
      labels: ['支出'],
      datasets: [
        {
          data: [totalExpense],
          backgroundColor: ['rgba(231, 76, 60, 0.8)'],
          borderColor: ['rgba(231, 76, 60, 1)'],
          borderWidth: 2,
          hoverOffset: 8,
          borderRadius: 4,
        },
      ],
    }
  }

  if (!totalExpense) {
    return {
      labels: ['收入'],
      datasets: [
        {
          data: [totalIncome],
          backgroundColor: ['rgba(46, 204, 113, 0.8)'],
          borderColor: ['rgba(46, 204, 113, 1)'],
          borderWidth: 2,
          hoverOffset: 8,
          borderRadius: 4,
        },
      ],
    }
  }

  // 正常情況，同時有收入和支出
  return {
    labels: ['收入', '支出'],
    datasets: [
      {
        data: [totalIncome, totalExpense],
        backgroundColor: [
          'rgba(46, 204, 113, 0.8)', // 綠色 - 收入
          'rgba(231, 76, 60, 0.8)', // 紅色 - 支出
        ],
        borderColor: ['rgba(46, 204, 113, 1)', 'rgba(231, 76, 60, 1)'],
        borderWidth: 2,
        hoverOffset: 8,
        borderRadius: 4,
      },
    ],
  }
})

const chartOptions = computed(() => {
  const { totalIncome, totalExpense, incomeRecords, expenseRecords } = props.summary || {}
  const total = (totalIncome || 0) + (totalExpense || 0)
  const safeTotal = total || 1 // 避免除以零
  const totalRecords = (incomeRecords || 0) + (expenseRecords || 0)

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 15,
    },
    plugins: {
      tooltip: {
        usePointStyle: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#2c3e50',
        bodyColor: '#5a6c7d',
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        padding: 15,
        boxPadding: 8,
        borderColor: 'rgba(52, 73, 94, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            const label = context.label || ''
            const value = context.raw || 0
            const percentage = Math.round((value / safeTotal) * 100)

            if (label === '收入') {
              return `${label}: $${value.toLocaleString()} (${percentage}%) - ${incomeRecords || 0} 筆`
            } else if (label === '支出') {
              return `${label}: $${value.toLocaleString()} (${percentage}%) - ${expenseRecords || 0} 筆`
            }

            return `${label}: $${value.toLocaleString()} (${percentage}%)`
          },
          afterBody: function (context) {
            if (totalIncome && totalExpense) {
              const netAmount = totalIncome - totalExpense
              const netLabel = netAmount >= 0 ? '淨收益' : '淨虧損'
              return [`${netLabel}: $${Math.abs(netAmount).toLocaleString()}`]
            }
            return []
          },
        },
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13,
            weight: '500',
          },
          color: '#2c3e50',
          generateLabels: function (chart) {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0]
                const value = dataset.data[i]
                const percentage = Math.round((value / safeTotal) * 100)

                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i,
                }
              })
            }
            return []
          },
        },
      },
      title: {
        display: true,
        text: [
          '收支比例分佈',
          `總金額: $${safeTotal.toLocaleString()} | 總記錄: ${totalRecords} 筆`,
        ],
        padding: {
          top: 10,
          bottom: 25,
        },
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#2c3e50',
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1200,
      easing: 'easeOutQuart',
    },
    elements: {
      arc: {
        hoverBorderWidth: 3,
      },
    },
  }
})
</script>
