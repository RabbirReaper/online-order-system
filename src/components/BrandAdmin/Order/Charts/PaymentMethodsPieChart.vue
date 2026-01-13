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
  paymentMethods: {
    type: Object,
    required: true,
    default: () => ({}),
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
  // console.log('PaymentMethodsPieChart mounted with props:', props);
})

const chartData = computed(() => {
  // 提取數據 - 支持兩種格式：數字或物件 {count, amount}
  const paymentData = props.paymentMethods || {}
  const labels = Object.keys(paymentData)

  // 判斷數據格式，提取 count 或直接使用數字
  const data = Object.values(paymentData).map(value => {
    // 如果是物件格式 {count, amount}，使用 count
    if (typeof value === 'object' && value !== null && 'count' in value) {
      return value.count
    }
    // 否則直接使用數字
    return value
  })

  // 付費方式色彩配置
  const colorConfig = {
    現金: {
      background: 'rgba(46, 204, 113, 0.9)',
      border: 'rgba(39, 174, 96, 1)',
    },
    'LINE Pay': {
      background: 'rgba(52, 152, 219, 0.9)',
      border: 'rgba(41, 128, 185, 1)',
    },
    信用卡: {
      background: 'rgba(155, 89, 182, 0.9)',
      border: 'rgba(142, 68, 173, 1)',
    },
    其他: {
      background: 'rgba(241, 196, 15, 0.9)',
      border: 'rgba(243, 156, 18, 1)',
    },
    Foodpanda: {
      background: 'rgba(236, 112, 169, 0.9)',
      border: 'rgba(219, 68, 144, 1)',
    },
    UberEats: {
      background: 'rgba(39, 174, 96, 0.9)',
      border: 'rgba(34, 153, 84, 1)',
    },
    未付款: {
      background: 'rgba(189, 195, 199, 0.8)',
      border: 'rgba(127, 140, 141, 1)',
    },
  }

  // 如果沒有數據，顯示空狀態
  if (data.length === 0 || data.every((value) => value === 0)) {
    return {
      labels: ['無付費記錄'],
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

  return {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: labels.map(
          (label) => colorConfig[label]?.background || 'rgba(149, 165, 166, 0.8)',
        ),
        borderColor: labels.map((label) => colorConfig[label]?.border || 'rgba(149, 165, 166, 1)'),
        borderWidth: 2,
        hoverOffset: 8,
        borderRadius: 4,
      },
    ],
  }
})

const chartOptions = computed(() => {
  const paymentData = props.paymentMethods || {}
  const dataValues = Object.values(paymentData)

  // 判斷數據格式並計算總數和總金額
  const isObjectFormat = dataValues.length > 0 &&
    typeof dataValues[0] === 'object' &&
    dataValues[0] !== null &&
    'count' in dataValues[0]

  let totalCount = 0
  let totalAmount = 0

  if (isObjectFormat) {
    dataValues.forEach(item => {
      totalCount += item.count || 0
      totalAmount += item.amount || 0
    })
  } else {
    totalCount = dataValues.reduce((acc, curr) => acc + (curr || 0), 0)
  }

  // 格式化金額
  const formatAmount = (num) => {
    return new Intl.NumberFormat('zh-TW').format(Math.round(num))
  }

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
            const count = context.raw || 0

            // 如果有金額資訊，顯示金額
            if (isObjectFormat) {
              const labelKey = Object.keys(paymentData)[context.dataIndex]
              const amount = paymentData[labelKey]?.amount || 0
              return `${label}: ${count} 筆 / NT$ ${formatAmount(amount)}`
            }

            return `${label}: ${count} 筆`
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
                const count = dataset.data[i]

                // 如果有金額資訊，顯示金額
                let labelText = `${label} (${count} 筆)`
                if (isObjectFormat) {
                  const labelKey = Object.keys(paymentData)[i]
                  const amount = paymentData[labelKey]?.amount || 0
                  labelText = `${label}: NT$ ${formatAmount(amount)}`
                }

                return {
                  text: labelText,
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
        text: isObjectFormat
          ? ['付費方式分佈', `總交易: ${totalCount} 筆 / NT$ ${formatAmount(totalAmount)}`]
          : ['付費方式分佈', `總交易: ${totalCount} 筆`],
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
