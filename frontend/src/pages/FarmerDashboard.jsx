import React, { useMemo } from "react";
import {
  Droplets,
  Wheat,
  Thermometer,
  FlaskConical,
  TrendingUp,
  Download,
  Bell,
  Plus,
  Sprout,
} from "lucide-react";
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
} from "chart.js";
import { Line, Bar, Doughnut, Scatter } from "react-chartjs-2";
import { StatCard } from "../components/Card.jsx";
import Button from "../components/Button.jsx";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

const STATS = [
  {
    icon: Droplets,
    label: "Liquid Manure pH",
    value: "6.8",
    trend: "+0.2 vs last week",
    accent: "primary",
  },
  {
    icon: Wheat,
    label: "Solid Manure Moisture",
    value: "58%",
    trend: "-3% vs last week",
    accent: "secondary",
  },
  {
    icon: Thermometer,
    label: "Avg Temperature",
    value: "29°C",
    trend: "Stable",
    accent: "accent",
  },
  {
    icon: FlaskConical,
    label: "Nutrient Index (NPK)",
    value: "7.2",
    trend: "+0.5 vs last week",
    accent: "primary",
  },
];

const READINGS = [
  {
    date: "02 Sep 2026",
    type: "Liquid",
    ph: "6.8",
    moisture: "—",
    temp: "29°C",
    nitrogen: "1.4%",
  },
  {
    date: "01 Sep 2026",
    type: "Solid",
    ph: "—",
    moisture: "58%",
    temp: "27°C",
    nitrogen: "1.1%",
  },
  {
    date: "31 Aug 2026",
    type: "Liquid",
    ph: "6.6",
    moisture: "—",
    temp: "28°C",
    nitrogen: "1.3%",
  },
  {
    date: "30 Aug 2026",
    type: "Solid",
    ph: "—",
    moisture: "61%",
    temp: "26°C",
    nitrogen: "1.2%",
  },
];

// ---------- helpers ----------
const num = (v) => (v === "—" ? null : parseFloat(v)); // "29°C" -> 29, "1.4%" -> 1.4

const COLORS = {
  green: "#16a34a",
  greenSoft: "rgba(22, 163, 74, 0.15)",
  amber: "#f59e0b",
  blue: "#0ea5e9",
  slate: "#94a3b8",
};

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: { usePointStyle: true, boxWidth: 8 },
    },
  },
};

function ChartCard({ title, subtitle, children, className = "", badge }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card border border-slate-100 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        {badge}
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

export default function FarmerDashboard() {
  // Oldest -> newest so charts read left to right in time
  const chrono = useMemo(() => [...READINGS].reverse(), []);
  const labels = chrono.map((r) => r.date.slice(0, 6)); // "30 Aug"

  // 1) Line chart: pH (liquid) + temperature over time
  const trendData = {
    labels,
    datasets: [
      {
        label: "pH (liquid)",
        data: chrono.map((r) => num(r.ph)),
        borderColor: COLORS.green,
        backgroundColor: COLORS.greenSoft,
        fill: true,
        tension: 0.35,
        spanGaps: true,
        yAxisID: "y",
      },
      {
        label: "Temperature (°C)",
        data: chrono.map((r) => num(r.temp)),
        borderColor: COLORS.amber,
        backgroundColor: COLORS.amber,
        tension: 0.35,
        yAxisID: "y1",
      },
    ],
  };
  const trendOptions = {
    ...baseOptions,
    interaction: { mode: "index", intersect: false },
    scales: {
      y: {
        position: "left",
        title: { display: true, text: "pH" },
        suggestedMin: 5,
        suggestedMax: 8,
      },
      y1: {
        position: "right",
        title: { display: true, text: "°C" },
        grid: { drawOnChartArea: false },
        suggestedMin: 20,
        suggestedMax: 35,
      },
    },
  };

  // 2) Bar chart: nitrogen % per reading, coloured by manure type
  const nitrogenData = {
    labels,
    datasets: [
      {
        label: "Nitrogen (%)",
        data: chrono.map((r) => num(r.nitrogen)),
        backgroundColor: chrono.map((r) =>
          r.type === "Liquid" ? COLORS.green : COLORS.blue,
        ),
        borderRadius: 8,
      },
    ],
  };
  const nitrogenOptions = {
    ...baseOptions,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Nitrogen %" } },
    },
  };

  // 3) Doughnut: Liquid vs Solid readings
  const liquidCount = READINGS.filter((r) => r.type === "Liquid").length;
  const solidCount = READINGS.filter((r) => r.type === "Solid").length;
  const typeData = {
    labels: ["Liquid", "Solid"],
    datasets: [
      {
        data: [liquidCount, solidCount],
        backgroundColor: [COLORS.green, COLORS.blue],
        borderWidth: 0,
      },
    ],
  };
  const typeOptions = { ...baseOptions, cutout: "65%" };

  // 4) Scatter: temperature vs nitrogen (is warmer manure richer?)
  const scatterData = {
    datasets: [
      {
        label: "Liquid",
        data: READINGS.filter((r) => r.type === "Liquid").map((r) => ({
          x: num(r.temp),
          y: num(r.nitrogen),
        })),
        backgroundColor: COLORS.green,
        pointRadius: 7,
      },
      {
        label: "Solid",
        data: READINGS.filter((r) => r.type === "Solid").map((r) => ({
          x: num(r.temp),
          y: num(r.nitrogen),
        })),
        backgroundColor: COLORS.blue,
        pointRadius: 7,
      },
    ],
  };
  const scatterOptions = {
    ...baseOptions,
    scales: {
      x: {
        title: { display: true, text: "Temperature (°C)" },
        suggestedMin: 24,
        suggestedMax: 31,
      },
      y: {
        title: { display: true, text: "Nitrogen (%)" },
        suggestedMin: 1,
        suggestedMax: 1.5,
      },
    },
  };

  return (
    <div className="container-page section-padding">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-primary-600 font-medium mb-1">
            Welcome back
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Farmer Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-200 shadow-soft">
            <Bell className="w-4.5 h-4.5" />
          </button>
          <Button icon={Plus} size="md">
            Add Reading
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Row 1: line chart (wide) + prediction card */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <ChartCard
          className="lg:col-span-2"
          title="Manure Quality Trend"
          subtitle="pH and temperature over time"
          badge={
            <span className="badge bg-secondary-50 text-secondary-700">
              <TrendingUp className="w-3.5 h-3.5" /> Improving
            </span>
          }
        >
          <Line data={trendData} options={trendOptions} />
        </ChartCard>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-1">
            Latest Prediction
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            Based on your most recent readings
          </p>
          <div className="rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 text-white p-5 mb-4">
            <Sprout className="w-7 h-7 mb-3 opacity-90" />
            <p className="text-xs text-white/80 mb-1">Recommended Crop</p>
            <p className="text-2xl font-bold">Sugarcane</p>
            <p className="text-xs text-white/80 mt-2">Confidence: 87%</p>
          </div>
          <Button to="/crop-prediction" variant="outline" fullWidth size="sm">
            Run New Prediction
          </Button>
        </div>
      </div>

      {/* Row 2: bar + doughnut + scatter */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ChartCard
          title="Nitrogen Content"
          subtitle="Per reading (green = liquid, blue = solid)"
        >
          <Bar data={nitrogenData} options={nitrogenOptions} />
        </ChartCard>

        <ChartCard title="Readings by Type" subtitle="Liquid vs solid manure">
          <Doughnut data={typeData} options={typeOptions} />
        </ChartCard>

        <ChartCard
          title="Temperature vs Nitrogen"
          subtitle="Relationship between readings"
        >
          <Scatter data={scatterData} options={scatterOptions} />
        </ChartCard>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="font-semibold text-slate-900">
            Recent Sensor Readings
          </h3>
          <Button variant="ghost" size="sm" icon={Download}>
            Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-y border-slate-100">
                <th className="py-3 px-6 font-medium">Date</th>
                <th className="py-3 px-6 font-medium">Type</th>
                <th className="py-3 px-6 font-medium">pH</th>
                <th className="py-3 px-6 font-medium">Moisture</th>
                <th className="py-3 px-6 font-medium">Temp</th>
                <th className="py-3 px-6 font-medium">Nitrogen</th>
              </tr>
            </thead>
            <tbody>
              {READINGS.map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="py-3.5 px-6 text-slate-600">{r.date}</td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`badge ${r.type === "Liquid" ? "bg-primary-50 text-primary-700" : "bg-secondary-50 text-secondary-700"}`}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">{r.ph}</td>
                  <td className="py-3.5 px-6 text-slate-600">{r.moisture}</td>
                  <td className="py-3.5 px-6 text-slate-600">{r.temp}</td>
                  <td className="py-3.5 px-6 text-slate-600">{r.nitrogen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
