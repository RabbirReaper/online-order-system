<template>
  <div>
    <Pie :data="chartData" :options="chartOptions" :height="height" :width="width" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';
import { Pie } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

const props = defineProps({
  orderTypes: {
    type: Object,
    required: true,
    default: () => ({})
  },
  width: {
    type: Number,
    default: 400
  },
  height: {
    type: Number,
    default: 400
  }
});

onMounted(() => {
  // console.log('OrderTypesPieChart mounted with props:', props);
});

const chartData = computed(() => {
  // 提取數據
  const orderTypeData = props.orderTypes || {};
  const labels = Object.keys(orderTypeData);
  const data = Object.values(orderTypeData);

  // 現代化色彩配置 - 根據新的訂單類型
  const colorConfig = {
    '內用': {
      background: 'rgba(52, 152, 219, 0.8)',
      border: 'rgba(52, 152, 219, 1)'
    },
    '外帶': {
      background: 'rgba(46, 204, 113, 0.8)',
      border: 'rgba(46, 204, 113, 1)'
    },
    '外送': {
      background: 'rgba(241, 196, 15, 0.8)',
      border: 'rgba(241, 196, 15, 1)'
    }
  };

  // 如果沒有數據，顯示空狀態
  if (data.length === 0 || data.every(value => value === 0)) {
    return {
      labels: ['無訂單數據'],
      datasets: [{
        data: [1],
        backgroundColor: ['rgba(149, 165, 166, 0.7)'],
        borderColor: ['rgba(149, 165, 166, 1)'],
        borderWidth: 2
      }]
    };
  }

  return {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: labels.map(label =>
        colorConfig[label]?.background || 'rgba(149, 165, 166, 0.8)'
      ),
      borderColor: labels.map(label =>
        colorConfig[label]?.border || 'rgba(149, 165, 166, 1)'
      ),
      borderWidth: 2,
      hoverOffset: 8,
      borderRadius: 4
    }]
  };
});

const chartOptions = computed(() => {
  const data = Object.values(props.orderTypes || {});
  const total = data.reduce((acc, curr) => acc + (curr || 0), 0);
  const safeTotal = total || 1; // 避免除以零

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 15
    },
    plugins: {
      tooltip: {
        usePointStyle: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#2c3e50',
        bodyColor: '#5a6c7d',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 15,
        boxPadding: 8,
        borderColor: 'rgba(52, 73, 94, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = Math.round((value / safeTotal) * 100);
            return `${label}: ${value} 筆 (${percentage}%)`;
          }
        }
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13,
            weight: '500'
          },
          color: '#2c3e50'
        }
      },
      title: {
        display: true,
        text: [
          '訂單類型分佈',
          `總計: ${total} 筆訂單`
        ],
        padding: {
          top: 10,
          bottom: 25
        },
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#2c3e50'
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1200,
      easing: 'easeOutQuart'
    },
    elements: {
      arc: {
        hoverBorderWidth: 3
      }
    }
  };
});
</script>
