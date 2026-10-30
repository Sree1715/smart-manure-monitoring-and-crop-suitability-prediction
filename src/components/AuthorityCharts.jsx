import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { BarChart3, PieChart, TrendingUp, Sparkles } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

export default function AuthorityCharts({
  statsData = null,
  isTamil = false,
  selectedDistrict = 'ALL',
}) {
  if (!statsData) return null;

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } },
      },
    },
  };

  // 1. Manure Quality Status Distribution (Doughnut)
  const statusDist = statsData.status_distribution || {};
  const statusLabels = [
    isTamil ? 'இயல்பானது' : 'Normal',
    isTamil ? 'எச்சரிக்கை' : 'Warning',
    isTamil ? 'அவசர நிலை' : 'Critical',
    isTamil ? 'தகவல் இல்லை' : 'Insufficient Data',
  ];
  const statusValues = [
    statusDist['Normal'] || 0,
    statusDist['Warning'] || 0,
    statusDist['Critical'] || 0,
    statusDist['Insufficient Data'] || 0,
  ];

  const doughnutData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: ['#16a34a', '#f59e0b', '#ef4444', '#94a3b8'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    ...baseOptions,
    cutout: '68%',
  };

  // 2. District-wise Farm Counts (Horizontal or Vertical Bar)
  const districtDist = statsData.district_distribution || [];
  const barData = {
    labels: districtDist.map((d) => d.district),
    datasets: [
      {
        label: isTamil ? 'பண்ணைகள்' : 'Farms',
        data: districtDist.map((d) => d.count),
        backgroundColor: '#2563eb',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    ...baseOptions,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 10 } },
        grid: { color: '#f1f5f9' },
      },
      x: {
        ticks: { font: { size: 10 } },
        grid: { display: false },
      },
    },
  };

  // 3. Most Frequently Predicted Crops (Bar)
  const topCrops = (statsData.frequently_predicted_crops || []).slice(0, 6);
  const cropBarData = {
    labels: topCrops.map((c) => (isTamil ? (c.crop_tamil || c.crop) : c.crop)),
    datasets: [
      {
        label: isTamil ? 'பரிந்துரைக்கப்பட்ட எண்ணிக்கை' : 'Recommendation Count',
        data: topCrops.map((c) => c.count),
        backgroundColor: '#16a34a',
        borderRadius: 6,
      },
    ],
  };

  // 4. Historical Manure Quality Trends (Line)
  const trendSeries = statsData.historical_trend || [];
  const trendLineData = {
    labels: trendSeries.map((t) => t.date),
    datasets: [
      {
        label: 'pH',
        data: trendSeries.map((t) => t.avg_ph),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        tension: 0.35,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: `${isTamil ? 'ஈரப்பதம்' : 'Moisture'} (%)`,
        data: trendSeries.map((t) => t.avg_moisture),
        borderColor: '#2563eb',
        backgroundColor: '#2563eb',
        tension: 0.35,
        yAxisID: 'y1',
      },
    ],
  };

  const trendLineOptions = {
    ...baseOptions,
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: {
        position: 'left',
        title: { display: true, text: 'pH', font: { size: 10 } },
        suggestedMin: 5.5,
        suggestedMax: 8.5,
        grid: { color: '#f1f5f9' },
      },
      y1: {
        position: 'right',
        title: { display: true, text: 'Moisture %', font: { size: 10 } },
        suggestedMin: 30,
        suggestedMax: 85,
        grid: { drawOnChartArea: false },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <section className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Chart 1: Status Distribution */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-primary-600" />
              <span>{isTamil ? 'உர தர நிலவரப் பரவல்' : 'Status Distribution'}</span>
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">
            {isTamil ? 'இயல்பு, எச்சரிக்கை, அவசர நிலை' : 'Normal vs Attention vs Alerts'}
          </p>
          <div className="h-56 relative flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        {/* Chart 2: District-wise Farm Counts */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-primary-600" />
              <span>{isTamil ? 'மாவட்ட பண்ணைகள் எண்ணிக்கை' : 'Farms per District'}</span>
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">
            {isTamil ? 'பதிவு செய்யப்பட்ட பண்ணை அடர்த்தி' : 'Top registered monitoring clusters'}
          </p>
          <div className="h-56">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Chart 3: Frequently Predicted Crops */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-secondary-600" />
              <span>{isTamil ? 'அடிக்கடி பரிந்துரைக்கப்பட்ட பயிர்கள்' : 'Top Suitable Crops'}</span>
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">
            {isTamil ? 'உர ஊட்டச்சத்து அடிப்படையில்' : 'AI matched crop frequency'}
          </p>
          <div className="h-56">
            <Bar data={cropBarData} options={barOptions} />
          </div>
        </div>

        {/* Chart 4: Historical Trends */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>{isTamil ? 'உர தர வரலாற்றுப் போக்கு' : 'Historical Quality Trends'}</span>
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">
            {isTamil ? 'சராசரி pH & ஈரப்பதம்' : 'Aggregated pH & moisture timeline'}
          </p>
          <div className="h-56">
            <Line data={trendLineData} options={trendLineOptions} />
          </div>
        </div>
      </div>
    </section>
  );
}
