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
  chartData: {
    type: Object,
    required: true,
    default: () => ({ labels: [], datasets: [] })
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
  // console.log('DishLifecycleChart mounted with props:', props);
});

const chartData = computed(() => {
  const data = props.chartData;

  if (!data.labels || data.labels.length === 0 || !data.datasets || data.datasets.length === 0) {
    return {
      labels: ['暫無數據'],
      datasets: [{
        label: '銷售數量',
        data: [0],
        backgroundColor: 'rgba(149, 165, 166, 0.2)',
        borderColor: 'rgba(149, 165, 166, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: false
      }]
    };
  }

  // 處理數據集，添加樣式
  const processedDatasets = data.datasets.map((dataset, index) => ({
    ...dataset,
    pointBackgroundColor: dataset.borderColor,
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 6,
    borderWidth: 3,
    fill: false
  }));

  return {
    labels: data.labels,
    datasets: processedDatasets
  };
});

const chartOptions = computed(() => {
  const data = props.chartData;

  // 計算所有數據集的最大值
  let maxValue = 0;
  if (data.datasets && data.datasets.length > 0) {
    data.datasets.forEach(dataset => {
      if (dataset.data && Array.isArray(dataset.data)) {
        const datasetMax = Math.max(...dataset.data);
        if (datasetMax > maxValue) {
          maxValue = datasetMax;
        }
      }
    });
  }

  const suggestedMax = Math.ceil(maxValue * 1.2) || 10;

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 15
    },
    plugins: {
      title: {
        display: true,
        text: [
          '熱門餐點銷售趨勢',
          '（週銷量變化）'
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
      },
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '500'
          },
          color: '#2c3e50',
          generateLabels: function (chart) {
            const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);

            // 限制圖例標籤長度
            return labels.map(label => ({
              ...label,
              text: label.text.length > 15 ? label.text.substring(0, 15) + '...' : label.text
            }));
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
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
            return `週期: ${context[0].label}`;
          },
          label: function (context) {
            const dishName = context.dataset.label;
            const quantity = context.raw || 0;
            return `${dishName}: ${quantity} 份`;
          },
          afterBody: function (context) {
            if (context.length > 0) {
              const dataIndex = context[0].dataIndex;

              // 計算總營業額佔比（模擬數據）
              const totalQuantity = context.reduce((sum, ctx) => sum + (ctx.raw || 0), 0);
              if (totalQuantity > 0) {
                const percentage = ((context[0].raw || 0) / totalQuantity * 100).toFixed(1);
                return [`該餐點佔當週總銷量: ${percentage}%`];
              }
            }
            return [];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: suggestedMax,
        title: {
          display: true,
          text: '銷售數量 (份)',
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
            return value + ' 份';
          }
        },
        grid: {
          color: 'rgba(52, 152, 219, 0.1)',
          drawBorder: false
        }
      },
      x: {
        title: {
          display: true,
          text: '週期',
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
          color: 'rgba(52, 152, 219, 0.1)',
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
        hoverBackgroundColor: function (context) {
          return context.element.options.backgroundColor;
        }
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    }
  };
});
</script>
