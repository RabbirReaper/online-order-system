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
    default: () => ({ datasets: [] })
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
  console.log('WeeklyRevenueTrendChart mounted with props:', props);
});

const chartData = computed(() => {
  const data = props.chartData;

  if (!data.datasets || data.datasets.length === 0) {
    return {
      labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
      datasets: [{
        label: '暫無數據',
        data: Array(7).fill(0),
        backgroundColor: 'rgba(149, 165, 166, 0.2)',
        borderColor: 'rgba(149, 165, 166, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: false
      }]
    };
  }

  return {
    labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      pointBackgroundColor: dataset.borderColor,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      borderWidth: 3,
      fill: false
    }))
  };
});

const chartOptions = computed(() => {
  const data = props.chartData;

  // 計算所有週的最大值以設置合適的Y軸範圍
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

  const suggestedMax = Math.ceil(maxValue * 1.2) || 10000;

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 15
    },
    plugins: {
      title: {
        display: true,
        text: '每週營業額趨勢比較',
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
          padding: 20,
          font: {
            size: 13,
            weight: '500'
          },
          color: '#2c3e50'
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
            return context[0].label;
          },
          label: function (context) {
            const weekInfo = context.dataset.weekInfo;
            const value = context.raw;
            const formattedValue = value ? `$${value.toLocaleString()}` : '$0';

            return `${context.dataset.label}: ${formattedValue}`;
          },
          afterBody: function (context) {
            if (context.length > 0) {
              const dataset = context[0].dataset;
              if (dataset.weekInfo && dataset.data) {
                const weekAverage = dataset.data.reduce((sum, val) => sum + (val || 0), 0) / 7;
                return [`該週平均營收: $${weekAverage.toFixed(0)}`];
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
          color: 'rgba(52, 152, 219, 0.1)',
          drawBorder: false
        }
      },
      x: {
        title: {
          display: true,
          text: '星期',
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
          color: '#5a6c7d'
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
