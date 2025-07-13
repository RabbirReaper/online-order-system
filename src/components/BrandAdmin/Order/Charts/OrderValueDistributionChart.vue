<template>
  <div>
    <Bar :data="chartData" :options="chartOptions" :height="height" :width="width" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
    default: () => ({ labels: [], data: [], percentages: [] }),
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
  console.log('OrderValueDistributionChart mounted with props:', props)
})

const chartData = computed(() => {
  const data = props.chartData

  if (!data.labels || data.labels.length === 0) {
    return {
      labels: ['暫無數據'],
      datasets: [
        {
          label: '訂單數',
          data: [0],
          backgroundColor: 'rgba(149, 165, 166, 0.7)',
          borderColor: 'rgba(149, 165, 166, 1)',
          borderWidth: 2,
        },
      ],
    }
  }

  // 創建漸變色彩 - 從低金額到高金額顏色漸變
  const createGradientColors = (count) => {
    const colors = []
    for (let i = 0; i < count; i++) {
      const ratio = i / Math.max(1, count - 1)

      // 從綠色漸變到藍色再到紫色
      let r, g, b
      if (ratio < 0.5) {
        // 綠色到藍色
        const localRatio = ratio * 2
        r = Math.round(46 + (52 - 46) * localRatio)
        g = Math.round(204 + (152 - 204) * localRatio)
        b = Math.round(113 + (219 - 113) * localRatio)
      } else {
        // 藍色到紫色
        const localRatio = (ratio - 0.5) * 2
        r = Math.round(52 + (155 - 52) * localRatio)
        g = Math.round(152 + (89 - 152) * localRatio)
        b = Math.round(219 + (182 - 219) * localRatio)
      }

      colors.push(`rgba(${r}, ${g}, ${b}, 0.8)`)
    }
    return colors
  }

  const backgroundColors = createGradientColors(data.labels.length)

  return {
    labels: data.labels,
    datasets: [
      {
        label: '訂單數 (筆)',
        data: data.data || [],
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map((color) => color.replace('0.8', '1')),
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.8,
        maxBarThickness: 50,
        minBarLength: 2,
      },
    ],
  }
})

const chartOptions = computed(() => {
  const data = props.chartData

  // 找出最大值以便設置合適的最大刻度
  const maxValue = data.data && data.data.length > 0 ? Math.max(...data.data) : 0
  const suggestedMax = Math.ceil(maxValue * 1.15) // 增加15%空間

  // 計算總訂單數
  const totalOrders = data.data ? data.data.reduce((sum, val) => sum + val, 0) : 0

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 15,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: ['客單價分佈統計', `總訂單數: ${totalOrders} 筆`],
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
      tooltip: {
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
          title: function (context) {
            return `客單價區間: ${context[0].label}`
          },
          label: function (context) {
            const orderCount = context.raw || 0
            const index = context.dataIndex
            const percentage = data.percentages?.[index] || '0.0'

            return [`訂單數: ${orderCount} 筆`, `佔比: ${percentage}%`]
          },
          afterBody: function (context) {
            const index = context[0].dataIndex
            const orderCount = context[0].raw || 0

            // 提供一些分析建議
            let analysis = ''
            if (index === 0 && orderCount > totalOrders * 0.3) {
              analysis = '低客單價訂單較多，可考慮推出套餐提升客單價'
            } else if (index >= data.labels.length - 2 && orderCount > totalOrders * 0.2) {
              analysis = '高客單價訂單表現良好，客戶消費力佳'
            } else if (
              index === Math.floor(data.labels.length / 2) &&
              orderCount > totalOrders * 0.4
            ) {
              analysis = '中等客單價為主要消費群體'
            }

            return analysis ? [analysis] : []
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: Math.max(10, suggestedMax),
        title: {
          display: true,
          text: '訂單數 (筆)',
          font: {
            size: 14,
            weight: '600',
          },
          color: '#5a6c7d',
          padding: {
            bottom: 10,
          },
        },
        ticks: {
          precision: 0,
          font: {
            size: 12,
          },
          color: '#5a6c7d',
          callback: function (value) {
            return value + ' 筆'
          },
        },
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(52, 152, 219, 0.1)',
        },
      },
      x: {
        title: {
          display: true,
          text: '客單價區間',
          font: {
            size: 14,
            weight: '600',
          },
          color: '#5a6c7d',
          padding: {
            top: 10,
          },
        },
        ticks: {
          font: {
            size: 12,
          },
          color: '#5a6c7d',
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          display: false,
        },
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart',
    },
    elements: {
      bar: {
        hoverBackgroundColor: function (context) {
          const color = context.element.options.backgroundColor
          return color.replace('0.8', '0.9')
        },
      },
    },
  }
})
</script>
