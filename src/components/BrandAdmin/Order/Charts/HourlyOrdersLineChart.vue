<template>
  <div>
    <Line :data="chartData" :options="chartOptions" :width="width" :height="height" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
);

const props = defineProps({
  hourlyData: {
    type: Array,
    required: true,
    default: () => []
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
  console.log('HourlyOrdersLineChart mounted with props:', props);
});

// 過濾並處理數據以顯示有意義的時間段
const processedData = computed(() => {
  if (!props.hourlyData || props.hourlyData.length === 0) {
    return [];
  }

  // 找出有數據的時間範圍
  const nonZeroItems = props.hourlyData.filter(item => item.count > 0);
  if (nonZeroItems.length === 0) {
    return props.hourlyData; // 如果全是零，顯示原始數據
  }

  // 找出營業時間範圍（有訂單的時間前後各一小時）
  const timeValues = nonZeroItems.map(item => {
    const [hours] = item.time.split(':').map(Number);
    return hours;
  });

  const minHour = Math.max(0, Math.min(...timeValues) - 1);
  const maxHour = Math.min(23, Math.max(...timeValues) + 1);

  // 過濾原始數據以僅顯示營業時間段
  return props.hourlyData.filter(item => {
    const [hours] = item.time.split(':').map(Number);
    return hours >= minHour && hours <= maxHour;
  }).sort((a, b) => {
    const [aHours] = a.time.split(':').map(Number);
    const [bHours] = b.time.split(':').map(Number);
    return aHours - bHours;
  });
});

const chartData = computed(() => {
  const data = processedData.value;

  if (data.length === 0) {
    return {
      labels: ['無數據'],
      datasets: [{
        label: '訂單數',
        data: [0],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    };
  }

  return {
    labels: data.map(item => item.time),
    datasets: [{
      label: '訂單數',
      data: data.map(item => item.count),
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      pointBackgroundColor: 'rgba(54, 162, 235, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      borderWidth: 3,
      tension: 0.4,
      fill: true
    }]
  };
});

const chartOptions = computed(() => {
  const data = processedData.value;
  const maxValue = data.length > 0 ? Math.max(...data.map(item => item.count)) : 0;
  const suggestedMax = Math.ceil(maxValue * 1.2);

  // 找出高峰時段
  let peakTime = '';
  let peakValue = 0;
  if (data.length > 0) {
    const peak = data.reduce((max, item) =>
      item.count > max.count ? item : max,
      { count: 0, time: '' }
    );

    if (peak.count > 0) {
      peakTime = peak.time;
      peakValue = peak.count;
    }
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 15
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: peakTime ? [
          `營業時段訂單分析`,
          `高峰時段: ${peakTime} (${peakValue} 筆訂單)`
        ] : '營業時段訂單分析',
        padding: {
          top: 10,
          bottom: 25
        },
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#2c3e50'
      },
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
        padding: 12,
        boxPadding: 6,
        borderColor: 'rgba(54, 162, 235, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: context => `時間: ${context[0].label}`,
          label: context => `訂單數: ${context.raw} 筆`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: suggestedMax || 10,
        title: {
          display: true,
          text: '訂單數量',
          font: {
            size: 14,
            weight: '600'
          },
          color: '#5a6c7d',
          padding: {
            bottom: 10
          }
        },
        ticks: {
          precision: 0,
          font: {
            size: 12
          },
          color: '#5a6c7d'
        },
        grid: {
          color: 'rgba(54, 162, 235, 0.1)',
          drawBorder: false
        }
      },
      x: {
        title: {
          display: true,
          text: '營業時間',
          font: {
            size: 14,
            weight: '600'
          },
          color: '#5a6c7d',
          padding: {
            top: 10
          }
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#5a6c7d',
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          display: true,
          color: 'rgba(54, 162, 235, 0.1)',
          drawBorder: false
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    elements: {
      line: {
        cubicInterpolationMode: 'monotone'
      },
      point: {
        hoverBackgroundColor: 'rgba(54, 162, 235, 0.8)'
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    }
  };
});
</script>
