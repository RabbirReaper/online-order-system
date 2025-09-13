<template>
  <div>
    <Line :data="chartData" :options="chartOptions" :width="width" :height="height" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
)

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
    default: () => ({ labels: [], incomeData: [], expenseData: [] }),
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
  console.log('IncomeExpenseTrendChart mounted with props:', props)
})

const chartData = computed(() => {
  const data = props.chartData

  if (!data.labels || data.labels.length === 0) {
    return {
      labels: ['暫無數據'],
      datasets: [
        {
          label: '收入',
          data: [0],
          backgroundColor: 'rgba(149, 165, 166, 0.2)',
          borderColor: 'rgba(149, 165, 166, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
        },
        {
          label: '支出',
          data: [0],
          backgroundColor: 'rgba(149, 165, 166, 0.2)',
          borderColor: 'rgba(149, 165, 166, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
        },
      ],
    }
  }

  return {
    labels: data.labels,
    datasets: [
      {
        label: '收入',
        data: data.incomeData || [],
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        borderColor: 'rgba(46, 204, 113, 1)',
        pointBackgroundColor: 'rgba(46, 204, 113, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
      {
        label: '支出',
        data: data.expenseData || [],
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        borderColor: 'rgba(231, 76, 60, 1)',
        pointBackgroundColor: 'rgba(231, 76, 60, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  }
})

const chartOptions = computed(() => {
  const data = props.chartData

  // 計算最大值以設置合適的Y軸範圍
  let maxValue = 0
  if (data.incomeData && Array.isArray(data.incomeData)) {
    const incomeMax = Math.max(...data.incomeData)
    if (incomeMax > maxValue) maxValue = incomeMax
  }
  if (data.expenseData && Array.isArray(data.expenseData)) {
    const expenseMax = Math.max(...data.expenseData)
    if (expenseMax > maxValue) maxValue = expenseMax
  }

  const suggestedMax = Math.ceil(maxValue * 1.2) || 10000

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 15,
    },
    plugins: {
      title: {
        display: true,
        text: '收支趨勢圖',
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
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13,
            weight: '500',
          },
          color: '#2c3e50',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
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
            return `日期: ${context[0].label}`
          },
          label: function (context) {
            const value = context.raw || 0
            const formattedValue = `$${value.toLocaleString()}`
            return `${context.dataset.label}: ${formattedValue}`
          },
          afterBody: function (context) {
            if (context.length >= 2) {
              const incomeValue = context.find((c) => c.dataset.label === '收入')?.raw || 0
              const expenseValue = context.find((c) => c.dataset.label === '支出')?.raw || 0
              const netAmount = incomeValue - expenseValue
              const netLabel = netAmount >= 0 ? '淨收益' : '淨虧損'
              return [`${netLabel}: $${Math.abs(netAmount).toLocaleString()}`]
            }
            return []
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: suggestedMax,
        title: {
          display: true,
          text: '金額 (元)',
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
            return '$' + value.toLocaleString()
          },
        },
        grid: {
          color: 'rgba(52, 152, 219, 0.1)',
          drawBorder: false,
        },
      },
      x: {
        title: {
          display: true,
          text: '時間',
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
          display: true,
          color: 'rgba(52, 152, 219, 0.1)',
          drawBorder: false,
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      line: {
        cubicInterpolationMode: 'monotone',
      },
      point: {
        hoverBackgroundColor: function (context) {
          return context.element.options.backgroundColor
        },
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart',
    },
  }
})
</script>
