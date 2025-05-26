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
    default: () => ({ labels: [], newCustomerRate: [], returnCustomerRate: [] })
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
  console.log('CustomerRetentionChart mounted with props:', props);
});

const chartData = computed(() => {
  const data = props.chartData;

  if (!data.labels || data.labels.length === 0) {
    return {
      labels: ['暫無數據'],
      datasets: [{
        label: '新客佔比',
        data: [0],
        backgroundColor: 'rgba(149, 165, 166, 0.2)',
        borderColor: 'rgba(149, 165, 166, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: false
      }]
    };
  }

  return {
    labels: data.labels,
    datasets: [
      {
        label: '新客佔比 (%)',
        data: data.newCustomerRate || [],
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        pointBackgroundColor: 'rgba(52, 152, 219, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
        tension: 0.4,
        fill: false
      },
      {
        label: '回購率 (%)',
        data: data.returnCustomerRate || [],
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        borderColor: 'rgba(46, 204, 113, 1)',
        pointBackgroundColor: 'rgba(46, 204, 113, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
        tension: 0.4,
        fill: false
      }
    ]
  };
});

const chartOptions = computed(() => {
  const data = props.chartData;

  // 計算平均值用於顯示
  const avgNewCustomer = data.newCustomerRate && data.newCustomerRate.length > 0
    ? (data.newCustomerRate.reduce((sum, val) => sum + val, 0) / data.newCustomerRate.length).toFixed(1)
    : 0;

  const avgReturnCustomer = data.returnCustomerRate && data.returnCustomerRate.length > 0
    ? (data.returnCustomerRate.reduce((sum, val) => sum + val, 0) / data.returnCustomerRate.length).toFixed(1)
    : 0;

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
          '顧客留存分析',
          `平均新客佔比: ${avgNewCustomer}% | 平均回購率: ${avgReturnCustomer}%`
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
            return `日期: ${context[0].label}`;
          },
          label: function (context) {
            const value = context.raw || 0;
            return `${context.dataset.label}: ${value.toFixed(1)}%`;
          },
          afterBody: function (context) {
            if (context.length === 2) {
              const newCustomerRate = context[0].raw || 0;
              const returnCustomerRate = context[1].raw || 0;

              // 提供一些分析建議
              let analysis = '';
              if (newCustomerRate > 70) {
                analysis = '新客比例較高，建議加強客戶留存';
              } else if (returnCustomerRate > 60) {
                analysis = '回購率表現良好，客戶黏性佳';
              } else {
                analysis = '建議平衡新客獲取與老客維護';
              }

              return [analysis];
            }
            return [];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: '百分比 (%)',
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
          font: {
            size: 12
          },
          color: '#5a6c7d',
          callback: function (value) {
            return value + '%';
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
          text: '日期',
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
