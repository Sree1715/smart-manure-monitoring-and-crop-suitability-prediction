import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
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

const RAW_READINGS = [
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
const num = (v) => (v === "—" ? null : parseFloat(v));

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
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

  const stats = [
    {
      icon: Droplets,
      label: t("farmerDashboard.statPh"),
      value: "6.8",
      trend: `+0.2 ${t("farmerDashboard.trendVsLastWeek")}`,
      accent: "primary",
    },
    {
      icon: Wheat,
      label: t("farmerDashboard.statMoisture"),
      value: "58%",
      trend: `-3% ${t("farmerDashboard.trendVsLastWeek")}`,
      accent: "secondary",
    },
    {
      icon: Thermometer,
      label: t("farmerDashboard.statTemp"),
      value: "29°C",
      trend: t("farmerDashboard.trendStable"),
      accent: "accent",
    },
    {
      icon: FlaskConical,
      label: t("farmerDashboard.statNpk"),
      value: "7.2",
      trend: `+0.5 ${t("farmerDashboard.trendVsLastWeek")}`,
      accent: "primary",
    },
  ];

  // Oldest -> newest so charts read left to right in time
  const chrono = useMemo(() => [...RAW_READINGS].reverse(), []);
  const labels = chrono.map((r) => r.date.slice(0, 6));

  // 1) Line chart: pH (liquid) + temperature over time
  const trendData = {
    labels,
    datasets: [
      {
        label: isTamil ? "pH மதிப்பு (திரவம்)" : "pH (liquid)",
        data: chrono.map((r) => num(r.ph)),
        borderColor: COLORS.green,
        backgroundColor: COLORS.greenSoft,
        fill: true,
        tension: 0.35,
        spanGaps: true,
        yAxisID: "y",
      },
      {
        label: isTamil ? "வெப்பநிலை (°C)" : "Temperature (°C)",
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
        label: isTamil ? "நைட்ரஜன் (%)" : "Nitrogen (%)",
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
      y: { beginAtZero: true, title: { display: true, text: isTamil ? "நைட்ரஜன் %" : "Nitrogen %" } },
    },
  };

  // 3) Doughnut: Liquid vs Solid readings
  const liquidCount = RAW_READINGS.filter((r) => r.type === "Liquid").length;
  const solidCount = RAW_READINGS.filter((r) => r.type === "Solid").length;
  const typeData = {
    labels: [
      isTamil ? "திரவ உரம்" : "Liquid",
      isTamil ? "திட உரம்" : "Solid",
    ],
    datasets: [
      {
        data: [liquidCount, solidCount],
        backgroundColor: [COLORS.green, COLORS.blue],
        borderWidth: 0,
      },
    ],
  };
  const typeOptions = { ...baseOptions, cutout: "65%" };

  // 4) Scatter: temperature vs nitrogen
  const scatterData = {
    datasets: [
      {
        label: isTamil ? "திரவம்" : "Liquid",
        data: RAW_READINGS.filter((r) => r.type === "Liquid").map((r) => ({
          x: num(r.temp),
          y: num(r.nitrogen),
        })),
        backgroundColor: COLORS.green,
        pointRadius: 7,
      },
      {
        label: isTamil ? "திடம்" : "Solid",
        data: RAW_READINGS.filter((r) => r.type === "Solid").map((r) => ({
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
        title: { display: true, text: isTamil ? "வெப்பநிலை (°C)" : "Temperature (°C)" },
        suggestedMin: 24,
        suggestedMax: 31,
      },
      y: {
        title: { display: true, text: isTamil ? "நைட்ரஜன் (%)" : "Nitrogen (%)" },
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
            {isTamil ? "வணக்கம், மீண்டும் வருக" : "Welcome back"}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t("farmerDashboard.title")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-200 shadow-soft">
            <Bell className="w-4.5 h-4.5" />
          </button>
          <Button icon={Plus} size="md">
            {t("farmerDashboard.addReading")}
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Row 1: line chart (wide) + prediction card */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <ChartCard
          className="lg:col-span-2"
          title={isTamil ? "உர தரம் & வரலாற்று மாற்றங்கள்" : "Manure Quality Trend"}
          subtitle={isTamil ? "காலப்போக்கில் pH மற்றும் வெப்பநிலை" : "pH and temperature over time"}
          badge={
            <span className="badge bg-secondary-50 text-secondary-700">
              <TrendingUp className="w-3.5 h-3.5" /> {isTamil ? "முன்னேறுகிறது" : "Improving"}
            </span>
          }
        >
          <Line data={trendData} options={trendOptions} />
        </ChartCard>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-1">
            {isTamil ? "சமீபத்திய கணிப்பு" : "Latest Prediction"}
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            {isTamil ? "உங்கள் அண்மை அளவீடுகளின்படி" : "Based on your most recent readings"}
          </p>
          <div className="rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 text-white p-5 mb-4">
            <Sprout className="w-7 h-7 mb-3 opacity-90" />
            <p className="text-xs text-white/80 mb-1">
              {t("cropPrediction.recommendedCrop")}
            </p>
            <p className="text-2xl font-bold">
              {isTamil ? "கரும்பு (Sugarcane)" : "Sugarcane"}
            </p>
            <p className="text-xs text-white/80 mt-2">
              {isTamil ? "நம்பகத்தன்மை: 87%" : "Confidence: 87%"}
            </p>
          </div>
          <Button to="/crop-prediction" variant="outline" fullWidth size="sm">
            {isTamil ? "புதிய கணிப்பை இயக்கவும்" : "Run New Prediction"}
          </Button>
        </div>
      </div>

      {/* Row 2: bar + doughnut + scatter */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ChartCard
          title={isTamil ? "நைட்ரஜன் அளவு" : "Nitrogen Content"}
          subtitle={isTamil ? "அளவீடு வாரியாக (பச்சை = திரவம், நீலம் = திடம்)" : "Per reading (green = liquid, blue = solid)"}
        >
          <Bar data={nitrogenData} options={nitrogenOptions} />
        </ChartCard>

        <ChartCard
          title={isTamil ? "உர வகை வாரியாக அளவீடுகள்" : "Readings by Type"}
          subtitle={isTamil ? "திரவ vs திட உரம்" : "Liquid vs solid manure"}
        >
          <Doughnut data={typeData} options={typeOptions} />
        </ChartCard>

        <ChartCard
          title={isTamil ? "வெப்பநிலை vs நைட்ரஜன்" : "Temperature vs Nitrogen"}
          subtitle={isTamil ? "அளவீடுகளுக்கு இடையேயான தொடர்பு" : "Relationship between readings"}
        >
          <Scatter data={scatterData} options={scatterOptions} />
        </ChartCard>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="font-semibold text-slate-900">
            {t("farmerDashboard.readingsTitle")}
          </h3>
          <Button variant="ghost" size="sm" icon={Download}>
            {isTamil ? "ஏற்றுமதி" : "Export"}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-y border-slate-100">
                <th className="py-3 px-6 font-medium">{t("farmerDashboard.colDate")}</th>
                <th className="py-3 px-6 font-medium">{t("farmerDashboard.colType")}</th>
                <th className="py-3 px-6 font-medium">{t("farmerDashboard.colPh")}</th>
                <th className="py-3 px-6 font-medium">{t("farmerDashboard.colMoisture")}</th>
                <th className="py-3 px-6 font-medium">{t("farmerDashboard.colTemp")}</th>
                <th className="py-3 px-6 font-medium">{t("farmerDashboard.colNitrogen")}</th>
              </tr>
            </thead>
            <tbody>
              {RAW_READINGS.map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="py-3.5 px-6 text-slate-600">{r.date}</td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`badge ${r.type === "Liquid" ? "bg-primary-50 text-primary-700" : "bg-secondary-50 text-secondary-700"}`}
                    >
                      {r.type === "Liquid" ? t("farmerDashboard.typeLiquid") : t("farmerDashboard.typeSolid")}
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
