import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Sparkles,
  Layers,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Cpu,
  Database,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Droplet
} from 'lucide-react';
import { PredictionResponse, Reading } from '../types';
import { api } from '../services/api';

interface PredictionTabProps {
  initialReading?: Reading | null;
}

export const PredictionTab: React.FC<PredictionTabProps> = ({ initialReading }) => {
  const [params, setParams] = useState({
    manure_type: 'liquid',
    ph: 7.0,
    nitrogen_pct: 1.8,
    phosphorus_pct: 1.0,
    potassium_pct: 1.5,
    moisture_pct: 55.0,
    temperature_c: 27.0,
    organic_carbon_pct: 15.0,
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync when initialReading is passed from telemetry tab
  useEffect(() => {
    if (initialReading) {
      setParams({
        manure_type: initialReading.manure_type || 'liquid',
        ph: initialReading.ph ?? 7.0,
        nitrogen_pct: initialReading.nitrogen_pct ?? 1.8,
        phosphorus_pct: initialReading.phosphorus_pct ?? 1.0,
        potassium_pct: initialReading.potassium_pct ?? 1.5,
        moisture_pct: initialReading.moisture_pct ?? 55.0,
        temperature_c: initialReading.temperature_c ?? 27.0,
        organic_carbon_pct: initialReading.organic_carbon_pct ?? 15.0,
      });
      runPrediction({
        manure_type: initialReading.manure_type || 'liquid',
        ph: initialReading.ph ?? 7.0,
        nitrogen_pct: initialReading.nitrogen_pct ?? 1.8,
        phosphorus_pct: initialReading.phosphorus_pct ?? 1.0,
        potassium_pct: initialReading.potassium_pct ?? 1.5,
        moisture_pct: initialReading.moisture_pct ?? 55.0,
        temperature_c: initialReading.temperature_c ?? 27.0,
        organic_carbon_pct: initialReading.organic_carbon_pct ?? 15.0,
      });
    } else {
      runPrediction(params);
    }
  }, [initialReading]);

  const runPrediction = async (currentParams = params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictCrop(currentParams);
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (presetName: string) => {
    let p = { ...params };
    if (presetName === 'cattle') {
      p = {
        manure_type: 'liquid',
        ph: 7.2,
        nitrogen_pct: 1.5,
        phosphorus_pct: 0.8,
        potassium_pct: 1.4,
        moisture_pct: 60.0,
        temperature_c: 28.0,
        organic_carbon_pct: 14.0,
      };
    } else if (presetName === 'vermicompost') {
      p = {
        manure_type: 'solid',
        ph: 6.8,
        nitrogen_pct: 2.2,
        phosphorus_pct: 1.6,
        potassium_pct: 1.8,
        moisture_pct: 50.0,
        temperature_c: 26.0,
        organic_carbon_pct: 22.0,
      };
    } else if (presetName === 'jeevamrutha') {
      p = {
        manure_type: 'liquid',
        ph: 6.5,
        nitrogen_pct: 1.9,
        phosphorus_pct: 0.7,
        potassium_pct: 1.2,
        moisture_pct: 75.0,
        temperature_c: 30.0,
        organic_carbon_pct: 18.0,
      };
    } else if (presetName === 'poultry') {
      p = {
        manure_type: 'solid',
        ph: 7.4,
        nitrogen_pct: 2.8,
        phosphorus_pct: 1.9,
        potassium_pct: 1.6,
        moisture_pct: 42.0,
        temperature_c: 32.0,
        organic_carbon_pct: 16.0,
      };
    }
    setParams(p);
    runPrediction(p);
  };

  // Crop-specific agronomic advice mapper
  const getCropAdvisory = (crop: string) => {
    switch (crop.toLowerCase()) {
      case 'wheat':
        return {
          dosage: '4 - 6 Tonnes / Hectare (Solid) or 600L Slurry fertigation',
          season: 'Rabi season (Oct - March)',
          soilType: 'Loamy or clay-loam with moderate moisture',
          tips: 'Apply during pre-sowing tillering and flag leaf emergence for maximum protein grain yield.',
        };
      case 'sugarcane':
        return {
          dosage: '10 - 15 Tonnes / Hectare enriched farmyard compost',
          season: 'Autumn / Spring planting',
          soilType: 'Deep, rich alluvial soil with high potassium absorption',
          tips: 'Heavy potassium in this slurry maximizes sucrose accumulation and stem elongation.',
        };
      case 'rice':
        return {
          dosage: '8 - 10 Tonnes / Hectare well-rotted bio-slurry',
          season: 'Kharif monsoon season',
          soilType: 'Clayey soils capable of standing water',
          tips: 'Incorporate during basal puddling to feed anaerobic soil microbes and reduce chemical urea need.',
        };
      case 'cotton':
        return {
          dosage: '5 - 7 Tonnes / Hectare or drip fertigation with filtered slurry',
          season: 'Kharif season',
          soilType: 'Black cotton soil (vertisols) or deep sandy loams',
          tips: 'High organic carbon prevents boll shedding and preserves moisture through dry spells.',
        };
      case 'maize':
        return {
          dosage: '6 - 8 Tonnes / Hectare balanced manure',
          season: 'Kharif / Spring',
          soilType: 'Well-drained fertile loams',
          tips: 'Rapid nitrogen uptake during V6 vegetative phase benefits directly from high-nitrogen slurry.',
        };
      case 'potato':
        return {
          dosage: '12 - 15 Tonnes / Hectare well-aged compost',
          season: 'Rabi winter crop',
          soilType: 'Loose, friable sandy loam with slightly acidic pH (5.8 - 6.5)',
          tips: 'Slightly acidic manure prevents potato scab fungus while potassium accelerates tuber bulking.',
        };
      default:
        return {
          dosage: '5 - 8 Tonnes / Hectare',
          season: 'Multi-season suitable',
          soilType: 'Well-drained agricultural soil',
          tips: 'Apply 2-3 weeks prior to sowing to establish symbiotic mycorrhizal root networks.',
        };
    }
  };

  const advisory = prediction ? getCropAdvisory(prediction.recommended_crop) : null;

  return (
    <div className="space-y-6">
      
      {/* Hero Header */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-emerald-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Random Forest ML Engine
              </span>
              <span className="text-xs text-slate-400">ICAR Trained Model</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Crop Suitability & Agronomic Advisory
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Evaluates live manure biochemical parameters against the Indian Council of Agricultural Research (ICAR) crop nutrient demand profiles to deliver optimal crop recommendations.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadPreset('cattle')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700 hover:border-emerald-500/40 transition"
            >
              🐄 Cattle Slurry
            </button>
            <button
              onClick={() => loadPreset('vermicompost')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700 hover:border-emerald-500/40 transition"
            >
              🐛 Vermicompost
            </button>
            <button
              onClick={() => loadPreset('jeevamrutha')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700 hover:border-emerald-500/40 transition"
            >
              🌿 Jeevamrutha
            </button>
            <button
              onClick={() => loadPreset('poultry')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700 hover:border-emerald-500/40 transition"
            >
              🐓 Poultry Manure
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Input Controls & Sliders (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 space-y-5 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Manure Nutrient Parameters</span>
            </h3>
            <button
              onClick={() => runPrediction()}
              disabled={loading}
              className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold border border-emerald-500/40 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Recalculate</span>
            </button>
          </div>

          {/* Form Controls */}
          <div className="space-y-4 text-xs">
            {/* Manure Type */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Manure Consistency</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...params, manure_type: 'liquid' };
                    setParams(updated);
                    runPrediction(updated);
                  }}
                  className={`py-2 rounded-lg font-bold transition text-xs border ${
                    params.manure_type === 'liquid'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Liquid Slurry (Anaerobic)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...params, manure_type: 'solid' };
                    setParams(updated);
                    runPrediction(updated);
                  }}
                  className={`py-2 rounded-lg font-bold transition text-xs border ${
                    params.manure_type === 'solid'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Solid Compost (Aerobic)
                </button>
              </div>
            </div>

            {/* pH Slider */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">pH Level</span>
                <span className="text-emerald-400 font-bold">{params.ph.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="4.5"
                max="9.5"
                step="0.1"
                value={params.ph}
                onChange={(e) => {
                  const updated = { ...params, ph: parseFloat(e.target.value) };
                  setParams(updated);
                  runPrediction(updated);
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>4.5 (Acidic)</span>
                <span>7.0 (Neutral)</span>
                <span>9.5 (Alkaline)</span>
              </div>
            </div>

            {/* Nitrogen % Slider */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-emerald-400">Nitrogen (N %)</span>
                <span className="text-white font-bold">{params.nitrogen_pct.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="3.5"
                step="0.05"
                value={params.nitrogen_pct}
                onChange={(e) => {
                  const updated = { ...params, nitrogen_pct: parseFloat(e.target.value) };
                  setParams(updated);
                  runPrediction(updated);
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Phosphorus % Slider */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-teal-400">Phosphorus (P %)</span>
                <span className="text-white font-bold">{params.phosphorus_pct.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.5"
                step="0.05"
                value={params.phosphorus_pct}
                onChange={(e) => {
                  const updated = { ...params, phosphorus_pct: parseFloat(e.target.value) };
                  setParams(updated);
                  runPrediction(updated);
                }}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            {/* Potassium % Slider */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-amber-400">Potassium (K %)</span>
                <span className="text-white font-bold">{params.potassium_pct.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={params.potassium_pct}
                onChange={(e) => {
                  const updated = { ...params, potassium_pct: parseFloat(e.target.value) };
                  setParams(updated);
                  runPrediction(updated);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Moisture & Temperature Row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-cyan-400">Moisture</span>
                  <span className="text-white font-bold">{params.moisture_pct.toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="85"
                  step="1"
                  value={params.moisture_pct}
                  onChange={(e) => {
                    const updated = { ...params, moisture_pct: parseFloat(e.target.value) };
                    setParams(updated);
                    runPrediction(updated);
                  }}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-orange-400">Temp</span>
                  <span className="text-white font-bold">{params.temperature_c.toFixed(0)}°C</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  step="1"
                  value={params.temperature_c}
                  onChange={(e) => {
                    const updated = { ...params, temperature_c: parseFloat(e.target.value) };
                    setParams(updated);
                    runPrediction(updated);
                  }}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Organic Carbon */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-purple-400">Organic Carbon (OC %)</span>
                <span className="text-white font-bold">{params.organic_carbon_pct.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="6"
                max="28"
                step="0.5"
                value={params.organic_carbon_pct}
                onChange={(e) => {
                  const updated = { ...params, organic_carbon_pct: parseFloat(e.target.value) };
                  setParams(updated);
                  runPrediction(updated);
                }}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* Right: AI Prediction Inference Results (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold">
              Warning: {error}
            </div>
          )}

          {prediction ? (
            <div className="space-y-6">
              
              {/* Primary Recommended Crop Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-2 border-emerald-500/40 p-6 shadow-2xl emerald-glow">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Highest Agronomic Affinity
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
                      {prediction.recommended_crop}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      Optimal match based on current N:P:K ratio ({params.nitrogen_pct} : {params.phosphorus_pct} : {params.potassium_pct}) & microbial vitality.
                    </p>
                  </div>

                  {/* Confidence Circle */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-center min-w-[90px]">
                    <span className="text-2xl font-black text-emerald-400">{prediction.confidence}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confidence</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5 space-y-1">
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700"
                      style={{ width: `${prediction.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Metadata & Provenance Tags */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Provenance: <strong>{prediction.data_provenance}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Cpu className="w-3.5 h-3.5 text-teal-400" />
                    <span className="truncate max-w-[200px]" title={prediction.method}>{prediction.method}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>NPK Index: <strong>{prediction.npk_index.toFixed(1)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Alternative Viable Crops */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Alternative Compatible Crops</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {prediction.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-slate-200">{alt.crop}</span>
                        <span className="text-xs font-bold text-emerald-400">{alt.confidence}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-400"
                          style={{ width: `${alt.confidence}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agronomic Advisory Guide */}
              {advisory && (
                <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Agronomic Field Application Advisory for {prediction.recommended_crop}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="font-semibold text-emerald-400 mb-0.5">Recommended Application Rate</div>
                      <div className="text-slate-200 font-medium">{advisory.dosage}</div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="font-semibold text-teal-400 mb-0.5">Optimal Sowing Window</div>
                      <div className="text-slate-200 font-medium">{advisory.season}</div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="font-semibold text-cyan-400 mb-0.5">Ideal Soil Composition</div>
                      <div className="text-slate-200 font-medium">{advisory.soilType}</div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="font-semibold text-amber-400 mb-0.5">Agronomist Recommendation</div>
                      <div className="text-slate-300 text-[11px] leading-relaxed">{advisory.tips}</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
              <Sprout className="w-12 h-12 text-emerald-500/40 mx-auto mb-3 animate-bounce" />
              <p className="font-semibold text-base text-slate-300">Computing Crop Suitability Model...</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
