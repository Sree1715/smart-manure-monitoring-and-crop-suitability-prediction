import React from "react";
import { useTranslation } from "react-i18next";
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

const colorMap = {
  primary: { bg: "bg-primary-50", text: "text-primary-600" },
  secondary: { bg: "bg-secondary-50", text: "text-secondary-600" },
  accent: { bg: "bg-accent-50", text: "text-accent-600" },
};

export default function Home() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Droplets,
      title: t("home.f1Title"),
      desc: t("home.f1Desc"),
      color: "primary",
    },
    {
      icon: Wheat,
      title: t("home.f2Title"),
      desc: t("home.f2Desc"),
      color: "secondary",
    },
    {
      icon: BrainCircuit,
      title: t("home.f3Title"),
      desc: t("home.f3Desc"),
      color: "accent",
    },
    {
      icon: LineChart,
      title: t("home.f4Title"),
      desc: t("home.f4Desc"),
      color: "primary",
    },
    {
      icon: Wifi,
      title: t("home.f5Title"),
      desc: t("home.f5Desc"),
      color: "secondary",
    },
    {
      icon: ShieldCheck,
      title: t("home.f6Title"),
      desc: t("home.f6Desc"),
      color: "accent",
    },
  ];

  const steps = [
    {
      icon: Cpu,
      title: t("home.step1Title"),
      desc: t("home.step1Desc"),
    },
    {
      icon: Database,
      title: t("home.step2Title"),
      desc: t("home.step2Desc"),
    },
    {
      icon: BrainCircuit,
      title: t("home.step3Title"),
      desc: t("home.step3Desc"),
    },
    {
      icon: LineChart,
      title: t("home.step4Title"),
      desc: t("home.step4Desc"),
    },
  ];

  const stats = [
    { value: t("home.stat1Value"), label: t("home.stat1Label") },
    { value: t("home.stat2Value"), label: t("home.stat2Label") },
    { value: t("home.stat3Value"), label: t("home.stat3Label") },
  ];

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
              <Sprout className="w-3.5 h-3.5" /> {t("home.heroBadge")}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-4 text-slate-900">
              {t("home.heroTitlePart1")}{" "}
              <span className="text-primary-600">{t("home.heroTitlePart2")}</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6 max-w-xl">
              {t("home.heroDesc")}
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Button
                to="/crop-prediction"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
              >
                {t("home.tryCropPrediction")}
              </Button>
              <Button to="/farmer-dashboard" variant="outline" size="lg">
                {t("home.viewDashboard")}
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4 border-t border-slate-200/60">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 max-w-[8.5rem]">
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
                  {t("home.sensorSnapshot")}
                </p>
                <span className="badge bg-secondary-50 text-secondary-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-pulse" />{" "}
                  {t("home.statusOnline")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t("home.liquidPh"), value: "6.8", unit: "" },
                  { label: t("home.moisture"), value: "62", unit: "%" },
                  { label: t("home.temperature"), value: "29", unit: "°C" },
                  { label: t("home.nitrogen"), value: "1.4", unit: "%" },
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
                  <span className="font-semibold">{t("home.predictedCropLabel")}</span>{" "}
                  {t("home.predictedCropValue")}
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
            {t("home.capabilitiesBadge")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("home.capabilitiesTitle")}
          </h2>
          <p className="text-slate-600">
            {t("home.capabilitiesDesc")}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
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
              {t("home.workflowBadge")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("home.workflowTitle")}
            </h2>
            <p className="text-slate-600">
              {t("home.workflowDesc")}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
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
              {t("home.govBadge")}
            </span>
            <h2 className="text-3xl font-bold mb-4">
              {t("home.govTitle")}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              {t("home.govDesc")}
            </p>
            <ul className="space-y-3">
              {[
                t("home.govPoint1"),
                t("home.govPoint2"),
                t("home.govPoint3"),
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
              {t("home.ctaCardTitle")}
            </h3>
            <p className="text-white/90 mb-7 leading-relaxed">
              {t("home.ctaCardDesc")}
            </p>
            <Button
              to="/crop-prediction"
              variant="accent"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
            >
              {t("home.ctaCardBtn")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
