import React, { useEffect, useState } from 'react';
import {
  X,
  Droplets,
  Wheat,
  Thermometer,
  BrainCircuit,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  Check,
  Download,
} from 'lucide-react';
import api from '../services/api.js';

export default function FarmDetailsPanel({ farmId, onClose, isTamil = false, onAlertResolved }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    setError(null);

    api
      .get(`/authority/farm/${farmId}`)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error('Failed to load farm details:', err);
        setError(err.friendlyMessage || 'Failed to retrieve farm telemetry.');
      })
      .finally(() => setLoading(false));
  }, [farmId]);

  const handleResolveAlert = async (alertId) => {
    setResolvingId(alertId);
    try {
      await api.post(`/authority/alerts/${alertId}/resolve`);
      // Update local state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, is_resolved: true } : a)),
        };
      });
      if (onAlertResolved) onAlertResolved(alertId);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setResolvingId(null);
    }
  };

  if (!farmId) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-slide-left">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div>
          <span className="text-[10px] font-bold font-mono tracking-wider text-primary-600 uppercase">
            {data?.farm_id || 'FARM DETAILS'}
          </span>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            {data?.farm_name || data?.farmer_name || (isTamil ? 'பண்ணை விவரங்கள்' : 'Farm Intelligence')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/authority/farm/${farmId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            title={isTamil ? "அறிக்கையை PDF வடிவத்தில் பதிவிறக்குக" : "Download PDF Report"}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isTamil ? 'PDF பதிவிறக்கம்' : 'Download PDF'}</span>
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading && (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span>{isTamil ? 'விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading farm telemetry...'}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}

        {!loading && data && (
          <>
            {/* Status & Farmer Overview Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-primary-50/30 border border-slate-200/80">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{data.farmer_name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-600" />
                    <span>{data.village}, {data.district}</span>
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    data.status === 'normal'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : data.status === 'warning'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : data.status === 'critical'
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {data.status_label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">{isTamil ? 'புவி ஆள்கூறுகள்' : 'Coordinates'}</span>
                  <span className="font-mono text-slate-800">
                    {data.latitude != null && data.longitude != null
                      ? `${data.latitude.toFixed(4)}°N, ${data.longitude.toFixed(4)}°E`
                      : (isTamil ? 'இருப்பிடம் இல்லை' : 'Not recorded')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">{isTamil ? 'பண்ணை பரப்பு' : 'Farm Acreage'}</span>
                  <span className="font-semibold text-slate-800">{data.farm_size_acres} {isTamil ? 'ஏக்கர்' : 'Acres'}</span>
                </div>
              </div>

              {data.status_reason && (
                <p className="mt-3 text-xs bg-white/80 p-2.5 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  {data.status_reason}
                </p>
              )}
            </div>

            {/* AI Crop Recommendation Result */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-soft">
              <div className="flex items-center gap-2 mb-2 text-white/80 text-xs font-medium">
                <BrainCircuit className="w-4 h-4 text-white" />
                <span>{isTamil ? 'பரிந்துரைக்கப்பட்ட பயிர் (AI Recommendation)' : 'Optimal Suitable Crop'}</span>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <h4 className="text-2xl font-extrabold tracking-tight">
                  {isTamil ? (data.prediction?.crop_tamil || data.prediction?.crop) : data.prediction?.crop}
                </h4>
                {data.prediction?.confidence > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white">
                    {data.prediction.confidence}% {isTamil ? 'நம்பகத்தன்மை' : 'Match'}
                  </span>
                )}
              </div>

              {data.prediction?.rationale && (
                <p className="text-xs text-white/90 leading-relaxed pt-2 border-t border-white/20">
                  {data.prediction.rationale}
                </p>
              )}
            </div>

            {/* Latest Physicochemical Parameters */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary-600" />
                  <span>{isTamil ? 'தற்போதைய இயற்பியல்-வேதியியல் அளவீடுகள்' : 'Live Physicochemical Telemetry'}</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  {data.latest_reading?.date || 'No data'}
                </span>
              </div>

              {data.latest_reading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: 'pH', value: data.latest_reading.ph, unit: '' },
                    { label: isTamil ? 'ஈரப்பதம்' : 'Moisture', value: data.latest_reading.moisture_pct, unit: '%' },
                    { label: isTamil ? 'வெப்பநிலை' : 'Temp', value: data.latest_reading.temperature_c, unit: '°C' },
                    { label: isTamil ? 'நைட்ரஜன் (N)' : 'Nitrogen', value: data.latest_reading.nitrogen_pct, unit: '%' },
                    { label: isTamil ? 'பாஸ்பரஸ் (P)' : 'Phosphorus', value: data.latest_reading.phosphorus_pct, unit: '%' },
                    { label: isTamil ? 'பொட்டாசியம் (K)' : 'Potassium', value: data.latest_reading.potassium_pct, unit: '%' },
                  ].map((m) => (
                    <div key={m.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] text-slate-500 mb-0.5">{m.label}</p>
                      <p className="text-base font-bold text-slate-900">
                        {m.value != null ? `${m.value}${m.unit}` : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl text-center">
                  {isTamil ? 'அளவீடுகள் எதுவும் கிடைக்கவில்லை' : 'No telemetry recorded for this farm.'}
                </p>
              )}
            </div>

            {/* Historical Telemetry Trend */}
            {data.historical_trends?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <span>{isTamil ? 'வரலாற்று அளவீடு பதிவுகள்' : 'Historical Sensor Logs'}</span>
                </h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 text-left">{isTamil ? 'தேதி' : 'Date'}</th>
                        <th className="py-2 px-3 text-left">pH</th>
                        <th className="py-2 px-3 text-left">{isTamil ? 'ஈரப்பதம்' : 'Moisture'}</th>
                        <th className="py-2 px-3 text-left">{isTamil ? 'வெப்பம்' : 'Temp'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.historical_trends.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-slate-600 font-medium">{h.date}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{h.ph ?? '—'}</td>
                          <td className="py-2 px-3 text-slate-600">{h.moisture_pct ? `${h.moisture_pct}%` : '—'}</td>
                          <td className="py-2 px-3 text-slate-600">{h.temperature_c ? `${h.temperature_c}°C` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Farm Quality Alerts */}
            {data.alerts?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{isTamil ? 'எச்சரிக்கைகள் & முரண்பாடுகள்' : 'Active & Historical Alerts'}</span>
                </h4>
                <div className="space-y-2">
                  {data.alerts.map((a) => (
                    <div
                      key={a.id}
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                        a.is_resolved
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : a.threshold_type === 'critical'
                          ? 'bg-red-50/70 border-red-200'
                          : 'bg-amber-50/70 border-amber-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              a.threshold_type === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                            }`}
                          >
                            {a.threshold_type}
                          </span>
                          <span className="text-slate-400 text-[10px]">{a.date}</span>
                        </div>
                        <p className="text-slate-800 font-medium">{a.message}</p>
                      </div>

                      {!a.is_resolved && (
                        <button
                          onClick={() => handleResolveAlert(a.id)}
                          disabled={resolvingId === a.id}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 text-slate-600 rounded-lg text-[10px] font-semibold transition shrink-0 flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{resolvingId === a.id ? '...' : (isTamil ? 'தீர்க்கப்பட்டது' : 'Resolve')}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
