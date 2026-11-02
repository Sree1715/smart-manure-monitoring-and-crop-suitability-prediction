/**
 * MeasurementSession.jsx
 * 
 * Farmer-facing page to start a new measurement session.
 * The farmer enters N, P, K values here, then the ESP32 sends
 * moisture and temperature to complete the reading.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FlaskConical,
  Wifi,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  Thermometer,
  Droplets,
  Zap,
  RefreshCw,
  Info,
} from "lucide-react";
import api from "../services/api.js";
import Button from "../components/Button.jsx";

// ─── Small helper components ─────────────────────────────────────────────────

function NpkInput({ label, unit, value, onChange, min = 0, max = 20, step = 0.01, id }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-14 text-sm font-medium text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition"
          placeholder="0.00"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
          {unit}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
    expired: "bg-slate-100 text-slate-500 border-slate-200",
  };
  const labels = { open: "Waiting for ESP32", completed: "Completed", expired: "Expired" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.expired}`}>
      {status === "open" && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
      {labels[status] || status}
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MeasurementSession() {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

  const [nitrogen, setNitrogen] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [potassium, setPotassium] = useState("");
  const [manureType, setManureType] = useState("solid");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [pollLoading, setPollLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [device, setDevice] = useState(null);

  // ── Fetch active session and recent history ─────────────────────────────
  const fetchSessionStatus = useCallback(async () => {
    setPollLoading(true);
    try {
      const [activeRes, histRes] = await Promise.all([
        api.get("/sessions/active"),
        api.get("/sessions?limit=5"),
      ]);
      setActiveSession(activeRes.data?.active_session || null);
      setSessions(histRes.data?.sessions || []);

      // Try to get device info
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.id) {
        try {
          const readingsRes = await api.get("/readings", { params: { limit: 1 } });
          if (readingsRes.data?.length > 0) {
            setDevice({ registered: true });
          }
        } catch {}
      }
    } catch (err) {
      console.error("Failed to load session status:", err);
    } finally {
      setPollLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionStatus();
    // Poll every 10 seconds to catch when ESP32 sends data
    const interval = setInterval(fetchSessionStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchSessionStatus]);

  // ── Start new session ───────────────────────────────────────────────────
  const handleStartSession = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const n = parseFloat(nitrogen);
    const p = parseFloat(phosphorus);
    const k = parseFloat(potassium);

    if (isNaN(n) || isNaN(p) || isNaN(k)) {
      setError("Please enter valid numbers for all three NPK values.");
      return;
    }
    if (n < 0 || n > 20 || p < 0 || p > 20 || k < 0 || k > 20) {
      setError("NPK values must be between 0% and 20%.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/sessions", {
        nitrogen_pct: n,
        phosphorus_pct: p,
        potassium_pct: k,
        manure_type: manureType,
        notes: notes.trim() || null,
      });

      setSuccess(res.data);
      setNitrogen("");
      setPhosphorus("");
      setPotassium("");
      setNotes("");
      await fetchSessionStatus();
    } catch (err) {
      setError(err.friendlyMessage || "Failed to start session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page section-padding max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isTamil ? "அளவீடு அமர்வை தொடங்கவும்" : "Start Measurement Session"}
            </h1>
            <p className="text-sm text-slate-500">
              {isTamil
                ? "NPK மதிப்புகளை உள்ளிடவும், பின் ESP32 தேர்வு செய்யும்"
                : "Enter NPK values, then your ESP32 will send moisture & temperature"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Session Form */}
        <div className="lg:col-span-3 space-y-5">
          {/* How it works info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">
                {isTamil ? "எப்படி இயங்குகிறது?" : "How does this work?"}
              </p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>{isTamil ? "NPK மதிப்புகளை உள்ளிட்டு 'அமர்வை தொடங்கு' அழுத்தவும்" : "Enter your N, P, K values and click Start Session"}</li>
                <li>{isTamil ? "ESP32 ஐ ஆன் செய்யவும் — அது தானாகவே ஈரப்பதம் + வெப்பநிலை அனுப்பும்" : "Power on your ESP32 — it will automatically send moisture & temperature"}</li>
                <li>{isTamil ? "இரண்டும் ஒன்றிணைந்து ஒரு முழுமையான அளவீடு உருவாகும்" : "Both combine into one complete reading visible on the authority dashboard"}</li>
              </ol>
            </div>
          </div>

          {/* NPK Form */}
          <form
            onSubmit={handleStartSession}
            className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 space-y-5"
          >
            <h2 className="font-semibold text-slate-900 text-base">
              {isTamil ? "NPK மதிப்புகளை உள்ளிடவும்" : "Enter NPK Values"}
            </h2>
            <p className="text-xs text-slate-500 -mt-3">
              {isTamil
                ? "உங்கள் ஆய்வக சோதனை அல்லது வணிக உர கிட் மதிப்புகளை பயன்படுத்தவும்."
                : "Use values from your lab test kit or commercial nutrient testing kit."}
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              <NpkInput
                id="nitrogen"
                label={isTamil ? "நைட்ரஜன் (N)" : "Nitrogen (N)"}
                unit="% w/w"
                value={nitrogen}
                onChange={setNitrogen}
              />
              <NpkInput
                id="phosphorus"
                label={isTamil ? "பாஸ்பரஸ் (P)" : "Phosphorus (P)"}
                unit="% w/w"
                value={phosphorus}
                onChange={setPhosphorus}
              />
              <NpkInput
                id="potassium"
                label={isTamil ? "பொட்டாசியம் (K)" : "Potassium (K)"}
                unit="% w/w"
                value={potassium}
                onChange={setPotassium}
              />
            </div>

            {/* Manure type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {isTamil ? "உர வகை" : "Manure Type"}
              </label>
              <div className="flex gap-3">
                {["solid", "liquid"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setManureType(type)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${
                      manureType === type
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {type === "solid"
                      ? (isTamil ? "திட உரம்" : "Solid Manure")
                      : (isTamil ? "திரவ உரம்" : "Liquid Manure")}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {isTamil ? "குறிப்புகள் (விரும்பினால்)" : "Notes (optional)"}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition resize-none"
                placeholder={isTamil ? "எ.கா: வரப்புறம் 2, புதிய உரம்" : "e.g. Field 2, fresh batch"}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {isTamil
                  ? "அமர்வு தொடங்கியது! ESP32 ஐ ஆன் செய்யவும்."
                  : "Session started! Now power on your ESP32."}
              </div>
            )}

            <Button
              type="submit"
              icon={PlayCircle}
              loading={loading}
              fullWidth
              size="lg"
              id="btn-start-session"
            >
              {isTamil ? "அமர்வை தொடங்கவும்" : "Start Measurement Session"}
            </Button>
          </form>
        </div>

        {/* Right: Status Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Active Session Status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-sm">
                {isTamil ? "செயலில் உள்ள அமர்வு" : "Active Session"}
              </h3>
              <button
                onClick={fetchSessionStatus}
                className="text-slate-400 hover:text-primary-600 transition"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${pollLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {activeSession ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Status</span>
                  <StatusBadge status="open" />
                </div>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-0.5">N</div>
                    <div className="font-bold text-primary-700 text-sm">
                      {activeSession.nitrogen_pct?.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <div className="text-xs text-slate-500 mb-0.5">P</div>
                    <div className="font-bold text-primary-700 text-sm">
                      {activeSession.phosphorus_pct?.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-0.5">K</div>
                    <div className="font-bold text-primary-700 text-sm">
                      {activeSession.potassium_pct?.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <Wifi className="w-3.5 h-3.5 animate-pulse" />
                  {isTamil
                    ? "ESP32 இலிருந்து தரவு வருவதற்காக காத்திருக்கிறோம்…"
                    : "Waiting for ESP32 to send data…"}
                </div>
                <p className="text-xs text-slate-400">
                  {isTamil ? "திறந்தது" : "Opened"}: {activeSession.age_minutes} min ago
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">
                  {isTamil ? "செயலில் அமர்வு இல்லை" : "No active session"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {isTamil
                    ? "NPK மதிப்புகளை உள்ளிட்டு தொடங்கவும்"
                    : "Enter NPK values above to start one"}
                </p>
              </div>
            )}
          </div>

          {/* ESP32 Status Hints */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">
              {isTamil ? "ESP32 நிலை சரிபார்ப்பு" : "ESP32 Status Checklist"}
            </h3>
            <ul className="space-y-2">
              {[
                { icon: Zap, label: isTamil ? "ESP32 இணைப்பு" : "ESP32 powered on", hint: isTamil ? "USB அல்லது 5V மூலம்" : "Via USB or 5V supply" },
                { icon: Wifi, label: isTamil ? "WiFi இணைப்பு" : "Wi-Fi connected", hint: isTamil ? "2.4 GHz ஹாட்ஸ்பாட்" : "2.4 GHz hotspot only" },
                { icon: Droplets, label: isTamil ? "ஈரப்பத விசாரணை" : "Moisture probe", hint: "GPIO 34, HW-103 AO" },
                { icon: Thermometer, label: isTamil ? "DS18B20 வெப்பநிலை" : "DS18B20 temp sensor", hint: "GPIO 4, 4.7kΩ pull-up" },
              ].map(({ icon: Icon, label, hint }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-700">{label}</div>
                    <div className="text-xs text-slate-400">{hint}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-3">
                {isTamil ? "சமீபத்திய அமர்வுகள்" : "Recent Sessions"}
              </h3>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div
                    key={s.session_id}
                    className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-700">
                        N:{s.nitrogen_pct?.toFixed(1)}% P:{s.phosphorus_pct?.toFixed(1)}% K:{s.potassium_pct?.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-400">
                        {s.created_at ? new Date(s.created_at).toLocaleString() : "—"}
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
