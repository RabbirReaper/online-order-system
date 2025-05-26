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
    default: () => ({ labels: [], revenue: [], orders: [], averageOrderValue: [] })
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
  console.log('RevenueOrdersDualAxisChart mounted with props:', props);
});

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
        borderWidth: 2,
        yAxisID: 'y'
      }]
    };
  }

  return {
    labels: data.labels,
    datasets: [
      {
        label: '營業額 (元)',
        data: data.revenue || [],
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 2,
        yAxisID: 'y',
        order: 2,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      },
      {
        label: '訂單數 (筆)',
        data: data.orders || [],
        backgroundColor: 'rgba(46, 204, 113, 0.8)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 2,
        yAxisID: 'y1',
        order: 1,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      }
    ]
  };
});

const chartOptions = computed(() => {
  const data = props.chartData;
  const maxRevenue = data.revenue && data.revenue.length > 0
    ? Math.max(...data.revenue)
    : 0;
  const maxOrders = data.orders && data.orders.length > 0
    ? Math.max(...data.orders)
    : 0;

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    layout: {
      padding: 15
    },
    plugins: {
      title: {
        display: true,
        text: '營業額與訂單數趨勢（按週統計）',
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
            const datasetLabel = context.dataset.label;
            const value = context.raw;

            if (datasetLabel.includes('營業額')) {
              return `${datasetLabel}: $${value?.toLocaleString() || 0}`;
            } else if (datasetLabel.includes('訂單數')) {
              return `${datasetLabel}: ${value || 0} 筆`;
            }

            return `${datasetLabel}: ${value}`;
          },
          afterBody: function (context) {
            const index = context[0].dataIndex;
            const averageValue = data.averageOrderValue?.[index];

            if (averageValue !== undefined) {
              return [`平均客單價: $${averageValue.toFixed(0)}`];
            }
            return [];
          }
        }
      }
    },
    scales: {
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
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        suggestedMax: Math.max(10000, Math.ceil(maxRevenue * 1.2)),
        title: {
          display: true,
          text: '營業額 (元)',
          font: {
            size: 14,
            weight: '600'
          },
          color: '#3498db',
          padding: {
            bottom: 10
          }
        },
        ticks: {
          precision: 0,
          font: {
            size: 12
          },
          color: '#3498db',
          callback: function (value) {
            return '$' + value.toLocaleString();
          }
        },
        grid: {
          color: 'rgba(52, 152, 219, 0.1)',
          drawBorder: false
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        suggestedMax: Math.max(10, Math.ceil(maxOrders * 1.2)),
        title: {
          display: true,
          text: '訂單數 (筆)',
          font: {
            size: 14,
            weight: '600'
          },
          color: '#2ecc71',
          padding: {
            bottom: 10
          }
        },
        ticks: {
          precision: 0,
          font: {
            size: 12
          },
          color: '#2ecc71',
          callback: function (value) {
            return value + ' 筆';
          }
        },
        grid: {
          drawOnChartArea: false
        }
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: false
      }
    }
  };
});
</script>
