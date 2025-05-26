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
  chartData: {
    type: Object,
    required: true,
    default: () => ({ labels: [], revenue: [], orders: [], averageValue: [] })
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
  console.log('StoreComparisonChart mounted with props:', props);
});

// 限制店鋪名稱長度的輔助函數
const limitNameLength = (name, maxLength = 8) => {
  if (!name) return '';
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
};

const chartData = computed(() => {
  const data = props.chartData;

  if (!data.labels || data.labels.length === 0) {
    return {
      labels: ['暫無數據'],
      datasets: [{
        label: '營業額',
        data: [0],
        backgroundColor: 'rgba(149, 165, 166, 0.7)',
        borderColor: 'rgba(149, 165, 166, 1)',
        borderWidth: 2
      }]
    };
  }

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

  const backgroundColors = createGradientColors(data.labels.length);

  return {
    labels: data.labels.map(label => limitNameLength(label)),
    datasets: [{
      label: '營業額 (元)',
      data: data.revenue || [],
      backgroundColor: backgroundColors,
      borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
      borderWidth: 2,
      borderRadius: 6,
      barPercentage: 0.8,
      maxBarThickness: 60,
      minBarLength: 2
    }]
  };
});

const chartOptions = computed(() => {
  const data = props.chartData;
  const originalNames = data.labels || [];

  // 找出最大值以便設置合適的最大刻度
  const maxValue = data.revenue && data.revenue.length > 0
    ? Math.max(...data.revenue)
    : 0;
  const suggestedMax = Math.ceil(maxValue * 1.15); // 增加15%空間

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
        text: data.labels && data.labels.length > 1 ? '各店鋪營業額比較' : '店鋪營業額統計',
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
        padding: 15,
        boxPadding: 8,
        borderColor: 'rgba(52, 73, 94, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: function (context) {
            const index = context[0].dataIndex;
            return originalNames[index] || ''; // 顯示完整店鋪名稱
          },
          label: function (context) {
            const index = context.dataIndex;
            const revenue = data.revenue?.[index] || 0;
            const orders = data.orders?.[index] || 0;
            const averageValue = data.averageValue?.[index] || 0;

            return [
              `營業額: $${revenue.toLocaleString()}`,
              `訂單數: ${orders} 筆`,
              `平均客單價: $${averageValue.toFixed(0)}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: Math.max(10000, suggestedMax),
        title: {
          display: true,
          text: '營業額 (元)',
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
          color: '#5a6c7d',
          callback: function (value) {
            return '$' + value.toLocaleString();
          }
        },
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(52, 152, 219, 0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: '店鋪',
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
