import React from "react";
import {
  Droplets,
  Wheat,
  Cpu,
  LineChart,
  ShieldCheck,
  Sprout,
  ArrowRight,
  Wifi,
  Database,
  BrainCircuit,
  CheckCircle2,
} from "lucide-react";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";

const FEATURES = [
  {
    icon: Droplets,
    title: "Liquid Manure Monitoring",
    desc: "Real-time tracking of pH, temperature, moisture, and nutrient levels in liquid organic manure via ESP32 sensors.",
    color: "primary",
  },
  {
    icon: Wheat,
    title: "Solid Manure Monitoring",
    desc: "Continuous quality assessment of solid organic manure including decomposition stage and nutrient composition.",
    color: "secondary",
  },
  {
    icon: BrainCircuit,
    title: "AI Crop Prediction",
    desc: "A Random Forest model recommends the most suitable crops based on manure quality and soil parameters.",
    color: "accent",
  },
  {
    icon: LineChart,
    title: "Analytics Dashboard",
    desc: "Visualize trends over time with interactive charts for farmers and government authorities alike.",
    color: "primary",
  },
  {
    icon: Wifi,
    title: "IoT Connectivity",
    desc: "ESP32-based devices stream sensor data over Wi-Fi with Blynk compatibility for remote monitoring.",
    color: "secondary",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    desc: "JWT authentication and encrypted credentials keep farmer and authority data safe at every layer.",
    color: "accent",
  },
];

const STEPS = [
  {
    icon: Cpu,
    title: "Sense",
    desc: "ESP32 sensors capture live readings from liquid and solid manure sources.",
  },
  {
    icon: Database,
    title: "Store",
    desc: "Readings are transmitted via HTTP API and stored securely in MySQL.",
  },
  {
    icon: BrainCircuit,
    title: "Predict",
    desc: "A Random Forest model analyses the data to recommend suitable crops.",
  },
  {
    icon: LineChart,
    title: "Act",
    desc: "Farmers and authorities view insights on clean, role-based dashboards.",
  },
];

const STATS = [
  { value: "2", label: "Manure Types Monitored" },
  { value: "24/7", label: "IoT Data Collection" },
  { value: "AI", label: "Powered Crop Matching" },
];

const colorMap = {
  primary: { bg: "bg-primary-50", text: "text-primary-600" },
  secondary: { bg: "bg-secondary-50", text: "text-secondary-600" },
  accent: { bg: "bg-accent-50", text: "text-accent-600" },
};

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-70px)] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-secondary-100/50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-primary-100/50 blur-3xl pointer-events-none" />

        <div className="container-page relative py-8 sm:py-12 lg:py-14 w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="animate-slide-up">
            <span className="badge bg-primary-50 text-primary-700 border border-primary-100 mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
              <Sprout className="w-3.5 h-3.5" /> Organic agriculture insights
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-4 text-slate-900">
              Turning Organic Manure into{" "}
              <span className="text-primary-600">Smarter Crop Decisions</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6 max-w-xl">
              An IoT and AI powered platform that monitors liquid and solid
              organic manure quality in real time, then predicts the most
              suitable crop for your land &mdash; helping farmers and
              authorities make data-driven decisions.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Button
                to="/crop-prediction"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
              >
                Try Crop Prediction
              </Button>
              <Button to="/farmer-dashboard" variant="outline" size="lg">
                View Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4 border-t border-slate-200/60">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 max-w-[7.5rem]">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="bg-white rounded-2xl shadow-card-hover border border-slate-100 p-6 sm:p-7">
              <div className="flex items-center justify-between mb-5">
                <p className="font-semibold text-slate-900">
                  Live Sensor Snapshot
                </p>
                <span className="badge bg-secondary-50 text-secondary-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-pulse" />{" "}
                  Online
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Liquid pH", value: "6.8", unit: "" },
                  { label: "Moisture", value: "62", unit: "%" },
                  { label: "Temperature", value: "29", unit: "°C" },
                  { label: "Nitrogen (N)", value: "1.4", unit: "%" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl bg-slate-50 p-4 border border-slate-100"
                  >
                    <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {m.value}
                      <span className="text-sm font-medium text-slate-400">
                        {m.unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-gradient-to-r from-primary-50 to-secondary-50 p-4 flex items-center gap-3 border border-primary-100">
                <BrainCircuit className="w-8 h-8 text-primary-600 shrink-0" />
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Predicted crop:</span>{" "}
                  Sugarcane &mdash; based on current manure composition
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="container-page section-padding scroll-mt-24"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge bg-secondary-50 text-secondary-700 border border-secondary-100 mb-4">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need in one place
          </h2>
          <p className="text-slate-600">
            From sensor to dashboard, the platform covers the full journey of
            manure monitoring and crop suitability prediction.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              icon={f.icon}
              iconBg={colorMap[f.color].bg}
              iconColor={colorMap[f.color].text}
              title={f.title}
            >
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-slate-100">
        <div className="container-page section-padding">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="badge bg-accent-50 text-accent-700 border border-accent-100 mb-4">
              Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How the system works
            </h2>
            <p className="text-slate-600">
              A simple four-stage pipeline from raw sensor data to actionable
              crop insight.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="relative bg-surface rounded-2xl p-6 border border-slate-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-white shadow-soft flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-2xl font-bold text-slate-200">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why this platform */}
      <section className="container-page section-padding">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="badge bg-primary-50 text-primary-700 border border-primary-100 mb-4">
              Government Initiative
            </span>
            <h2 className="text-3xl font-bold mb-4">
              Smarter manure management
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              This platform equips farmers and local authorities with the tools
              to monitor manure quality and use it effectively for crop
              planning.
            </p>
            <ul className="space-y-3">
              {[
                "Reduces guesswork in choosing the right crop for available manure",
                "Enables authorities to track manure quality across regions",
                "Encourages sustainable, organic farming practices",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-slate-700"
                >
                  <CheckCircle2 className="w-5 h-5 text-secondary-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl p-10 text-white shadow-card-hover">
            <Sprout className="w-10 h-10 mb-5 opacity-90" />
            <h3 className="text-2xl font-bold mb-3">
              Ready to see your prediction?
            </h3>
            <p className="text-white/90 mb-7 leading-relaxed">
              Enter your latest manure readings and get an instant AI-backed
              crop suitability recommendation.
            </p>
            <Button
              to="/crop-prediction"
              variant="accent"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
