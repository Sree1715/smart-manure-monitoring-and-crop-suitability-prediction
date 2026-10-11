import React, { useState } from 'react';
import {
  Thermometer,
  Droplets,
  FlaskConical,
  Sprout,
  Activity,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import { Reading, FarmerStats, ManureType } from '../types';
import { api } from '../services/api';

interface TelemetryTabProps {
  readings: Reading[];
  stats: FarmerStats | null;
  onSelectForPrediction: (reading: Reading) => void;
  onRefresh: () => void;
  activeDeviceId: number;
}

export const TelemetryTab: React.FC<TelemetryTabProps> = ({
  readings,
  stats,
  onSelectForPrediction,
  onRefresh,
  activeDeviceId,
}) => {
  const [selectedType, setSelectedType] = useState<ManureType>('liquid');
  const [showManualModal, setShowManualModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualSuccessMsg, setManualSuccessMsg] = useState('');

  // Form state for manual lab entry
  const [manualForm, setManualForm] = useState({
    manure_type: 'liquid' as ManureType,
    ph: 7.2,
    nitrogen_pct: 1.8,
    phosphorus_pct: 0.9,
    potassium_pct: 1.4,
    moisture_pct: 58.0,
    temperature_c: 28.5,
    organic_carbon_pct: 15.0,
  });

  // Filter latest reading matching type or first reading
  const latestReading = readings.find((r) => r.manure_type === selectedType) || readings[0];

  // Helper status calculations
  const phVal = latestReading?.ph ?? (stats?.liquid_ph || 7.0);
  const isPhOptimal = phVal >= 6.5 && phVal <= 7.8;
  const isPhAcidic = phVal < 6.5;

  const moistureVal = latestReading?.moisture_pct ?? (stats?.solid_moisture_pct || 58.0);
  const isMoistureOptimal = moistureVal >= 45 && moistureVal <= 70;

  const tempVal = latestReading?.temperature_c ?? (stats?.temperature_c || 28.0);
  const npkVal = latestReading?.npk_index ?? (stats?.npk_index || 8.4);
  const ocVal = latestReading?.organic_carbon_pct ?? (stats?.organic_carbon_pct || 14.5);

  const nVal = latestReading?.nitrogen_pct ?? 1.7;
  const pVal = latestReading?.phosphorus_pct ?? 0.85;
  const kVal = latestReading?.potassium_pct ?? 1.35;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setManualSuccessMsg('');
    try {
      await api.submitManualReading({
        device_id: activeDeviceId || 1,
        ...manualForm,
      });
      setManualSuccessMsg('Sample registered successfully in database!');
      setTimeout(() => {
        setShowManualModal(false);
        setManualSuccessMsg('');
        onRefresh();
      }, 1200);
    } catch (err: any) {
      alert(`Failed to save manual reading: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Manure Selector & Quality Assessment */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-900/40 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Live IoT Telemetry Node #{activeDeviceId || 1}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                GOBARdhan Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Organic Manure Quality Stream
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Continuous IoT sensor monitoring of fermented bio-slurry and compost decomposition.
              Synchronized directly with the ICAR agronomic database and Scikit-Learn crop recommendation engine.
            </p>
          </div>

          {/* Action buttons & Type Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Liquid vs Solid Toggle */}
            <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                id="type-liquid-btn"
                onClick={() => setSelectedType('liquid')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedType === 'liquid'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Liquid Slurry
              </button>
              <button
                id="type-solid-btn"
                onClick={() => setSelectedType('solid')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedType === 'solid'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Solid Compost
              </button>
            </div>

            <button
              id="log-sample-btn"
              onClick={() => setShowManualModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 hover:border-emerald-500/50 transition shadow-lg"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Log Lab Sample</span>
            </button>

            {latestReading && (
              <button
                id="predict-live-btn"
                onClick={() => onSelectForPrediction(latestReading)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/25 transition"
              >
                <Sprout className="w-4 h-4" />
                <span>Predict Crops for Live Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Highlights Bar */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPhOptimal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Chemical Balance</div>
              <div className="text-xs font-bold text-slate-200">
                {isPhOptimal ? 'Optimal pH (6.5 - 7.5)' : isPhAcidic ? 'Slightly Acidic' : 'Alkaline Manure'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isMoistureOptimal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Moisture Profile</div>
              <div className="text-xs font-bold text-slate-200">
                {isMoistureOptimal ? 'Aerobic & Fermenting' : moistureVal < 45 ? 'Under-Hydrated' : 'Excess Moisture'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">NPK Composite Score</div>
              <div className="text-xs font-bold text-slate-200">
                {npkVal.toFixed(1)} / 10.0 Grade
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Agronomic Readiness</div>
              <div className="text-xs font-bold text-emerald-300">
                Field Application Ready
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: pH */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Acidity / Alkalinity</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {phVal.toFixed(2)} <span className="text-sm font-semibold text-slate-400">pH</span>
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${isPhOptimal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <FlaskConical className="w-5 h-5" />
            </div>
          </div>

          {/* Progress bar visual */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>Acidic (4.0)</span>
              <span className="text-emerald-400 font-bold">Optimal (6.5-7.5)</span>
              <span>Alkaline (10.0)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isPhOptimal ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, ((phVal - 4) / 6) * 100))}%` }}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Regulates nutrient solubility in soil rhizosphere</span>
          </div>
        </div>

        {/* Metric 2: Primary Nutrients (NPK) */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Macro Nutrients</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {npkVal.toFixed(1)} <span className="text-sm font-semibold text-teal-400">NPK Index</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-0.5">
                <span>Nitrogen (N)</span>
                <span className="text-emerald-400">{nVal.toFixed(2)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, (nVal / 3) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-0.5">
                <span>Phosphorus (P)</span>
                <span className="text-teal-400">{pVal.toFixed(2)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-teal-400" style={{ width: `${Math.min(100, (pVal / 2) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-0.5">
                <span>Potassium (K)</span>
                <span className="text-amber-400">{kVal.toFixed(2)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, (kVal / 2.5) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: Moisture Content */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Moisture Level</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {moistureVal.toFixed(1)} <span className="text-sm font-semibold text-slate-400">%</span>
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${isMoistureOptimal ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Droplets className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>Dry (20%)</span>
              <span className="text-cyan-400 font-bold">Optimal (50-65%)</span>
              <span>Wet (90%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                style={{ width: `${Math.min(100, Math.max(0, ((moistureVal - 20) / 70) * 100))}%` }}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Essential for microbial aerobic respiration</span>
          </div>
        </div>

        {/* Metric 4: Temperature & Organic Carbon */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Thermal & Organic</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {tempVal.toFixed(1)} <span className="text-sm font-semibold text-slate-400">°C</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                <span>Compost Heat Phase</span>
                <span className="text-orange-400 font-bold">
                  {tempVal >= 45 ? 'Thermophilic Stage' : tempVal >= 25 ? 'Mesophilic Stage' : 'Ambient / Cured'}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                  style={{ width: `${Math.min(100, (tempVal / 60) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
              <span className="text-slate-400">Organic Carbon (OC)</span>
              <span className="font-bold text-emerald-400">{ocVal.toFixed(1)}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Telemetry Stream Log Table */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Telemetry Ingestion Stream</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live packets captured from ESP32 agricultural sensors & verified lab entries
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            Total Records: <span className="text-emerald-400 font-bold">{readings.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">Type</th>
                <th className="py-3 px-4 font-bold">Source</th>
                <th className="py-3 px-4 font-bold">pH</th>
                <th className="py-3 px-4 font-bold">N %</th>
                <th className="py-3 px-4 font-bold">P %</th>
                <th className="py-3 px-4 font-bold">K %</th>
                <th className="py-3 px-4 font-bold">Moisture</th>
                <th className="py-3 px-4 font-bold">Temp</th>
                <th className="py-3 px-4 font-bold">NPK Index</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {readings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500 font-medium">
                    No readings ingested yet. Submit a manual sample or run ESP32 simulation.
                  </td>
                </tr>
              ) : (
                readings.slice(0, 10).map((r) => {
                  const dateStr = r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Live';
                  return (
                    <tr key={r.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4 font-mono text-slate-300">{dateStr}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.manure_type === 'liquid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {r.manure_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.source === 'HARDWARE'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {r.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{r.ph?.toFixed(2) ?? '-'}</td>
                      <td className="py-3 px-4 text-emerald-400 font-medium">{r.nitrogen_pct?.toFixed(2) ?? '-'}%</td>
                      <td className="py-3 px-4 text-teal-400 font-medium">{r.phosphorus_pct?.toFixed(2) ?? '-'}%</td>
                      <td className="py-3 px-4 text-amber-400 font-medium">{r.potassium_pct?.toFixed(2) ?? '-'}%</td>
                      <td className="py-3 px-4 text-cyan-400 font-medium">{r.moisture_pct?.toFixed(1) ?? '-'}%</td>
                      <td className="py-3 px-4 text-orange-400 font-medium">{r.temperature_c?.toFixed(1) ?? '-'}°C</td>
                      <td className="py-3 px-4 font-bold text-white">{r.npk_index?.toFixed(1) ?? '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectForPrediction(r)}
                          className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition"
                        >
                          Predict Crop
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Sample Input Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Log Verified Lab Sample</h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {manualSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-center font-bold text-sm">
                ✓ {manualSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Manure Category</label>
                    <select
                      value={manualForm.manure_type}
                      onChange={(e) => setManualForm({ ...manualForm, manure_type: e.target.value as ManureType })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium"
                    >
                      <option value="liquid">Liquid Slurry (Bio-slurry)</option>
                      <option value="solid">Solid Compost (Khad)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">pH Level (4.0 - 10.0)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={manualForm.ph}
                      onChange={(e) => setManualForm({ ...manualForm, ph: parseFloat(e.target.value) || 7.0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-emerald-400 font-semibold mb-1">Nitrogen (N %)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={manualForm.nitrogen_pct}
                      onChange={(e) => setManualForm({ ...manualForm, nitrogen_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-teal-400 font-semibold mb-1">Phosphorus (P %)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={manualForm.phosphorus_pct}
                      onChange={(e) => setManualForm({ ...manualForm, phosphorus_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-400 font-semibold mb-1">Potassium (K %)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={manualForm.potassium_pct}
                      onChange={(e) => setManualForm({ ...manualForm, potassium_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-cyan-400 font-semibold mb-1">Moisture (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={manualForm.moisture_pct}
                      onChange={(e) => setManualForm({ ...manualForm, moisture_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-orange-400 font-semibold mb-1">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={manualForm.temperature_c}
                      onChange={(e) => setManualForm({ ...manualForm, temperature_c: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-400 font-semibold mb-1">Organic Carbon (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={manualForm.organic_carbon_pct}
                      onChange={(e) => setManualForm({ ...manualForm, organic_carbon_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-2"
                  >
                    {isSubmitting ? 'Saving...' : 'Submit to Database'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
