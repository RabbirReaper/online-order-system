<template>
  <div>
    <Bar :data="chartData" :options="chartOptions" :height="height" :width="width" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps({
  dishSales: {
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
  // console.log('DishSalesBarChart mounted with props:', props);
});

// 限制名稱長度的輔助函數
const limitNameLength = (name, maxLength = 12) => {
  if (!name) return '';
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
};

// 創建漸變色彩
const createGradientColors = (count) => {
  const colors = [];
  const baseColors = [
    [52, 152, 219],   // 藍色
    [46, 204, 113],   // 綠色
    [155, 89, 182],   // 紫色
    [241, 196, 15],   // 黃色
    [230, 126, 34],   // 橙色
    [231, 76, 60],    // 紅色
    [26, 188, 156],   // 青色
    [142, 68, 173],   // 深紫色
    [39, 174, 96],    // 深綠色
    [243, 156, 18]    // 深黃色
  ];

  for (let i = 0; i < count; i++) {
    const colorIndex = i % baseColors.length;
    const [r, g, b] = baseColors[colorIndex];
    const opacity = Math.max(0.7, 1 - (Math.floor(i / baseColors.length) * 0.1));
    colors.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
  }

  return colors;
};

const chartData = computed(() => {
  // 如果沒有數據，顯示空狀態
  if (!props.dishSales || props.dishSales.length === 0) {
    return {
      labels: ['暫無銷售數據'],
      datasets: [{
        label: '銷量',
        data: [0],
        backgroundColor: 'rgba(149, 165, 166, 0.7)',
        borderColor: 'rgba(149, 165, 166, 1)',
        borderWidth: 2
      }]
    };
  }

  // 限制顯示前10個餐點，並確保數據格式正確
  const topDishes = props.dishSales
    .filter(item => item && typeof item.count === 'number' && item.count > 0)
    .slice(0, 10);

  if (topDishes.length === 0) {
    return {
      labels: ['暫無銷售數據'],
      datasets: [{
        label: '銷量',
        data: [0],
        backgroundColor: 'rgba(149, 165, 166, 0.7)',
        borderColor: 'rgba(149, 165, 166, 1)',
        borderWidth: 2
      }]
    };
  }

  const backgroundColors = createGradientColors(topDishes.length);

  return {
    labels: topDishes.map(item => limitNameLength(item.name || '未知餐點')),
    datasets: [{
      label: '銷量',
      data: topDishes.map(item => item.count || 0),
      backgroundColor: backgroundColors,
      borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
      borderWidth: 2,
      borderRadius: 6,
      barPercentage: 0.8,
      maxBarThickness: 40,
      minBarLength: 2
    }]
  };
});

const chartOptions = computed(() => {
  const dishes = props.dishSales || [];
  const originalNames = dishes.map(item => item.name || '未知餐點');

  // 找出最大值以便設置合適的最大刻度
  const maxValue = dishes.length > 0
    ? Math.max(...dishes.map(item => item.count || 0))
    : 0;
  const suggestedMax = Math.ceil(maxValue * 1.15); // 增加15%空間

  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    layout: {
      padding: 15
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: dishes.length > 0 ? '熱門餐點銷量 TOP 10' : '餐點銷量統計',
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
        borderColor: 'rgba(52, 73, 94, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: function (context) {
            const index = context[0].dataIndex;
            return originalNames[index] || ''; // 顯示完整名稱
          },
          label: function (context) {
            return `銷量: ${context.raw} 份`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        suggestedMax: Math.max(10, suggestedMax),
        title: {
          display: true,
          text: '銷售數量',
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
          precision: 0,
          font: {
            size: 12
          },
          color: '#5a6c7d'
        },
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(52, 152, 219, 0.1)'
        }
      },
      y: {
        ticks: {
          font: {
            size: 12
          },
          color: '#5a6c7d'
        },
        grid: {
          display: false
        }
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    },
    elements: {
      bar: {
        hoverBackgroundColor: function (context) {
          const color = context.element.options.backgroundColor;
          return color.replace('0.7', '0.9');
        }
      }
    }
  };
});
</script>
