import React, { useState } from 'react';
import {
  Cpu,
  Radio,
  Send,
  Key,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Activity,
  Plus,
  RefreshCw,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { DeviceInfo, ManureType } from '../types';

interface DeviceSimulatorTabProps {
  onReadingIngested: () => void;
  activeDeviceId: number;
}

export const DeviceSimulatorTab: React.FC<DeviceSimulatorTabProps> = ({
  onReadingIngested,
  activeDeviceId,
}) => {
  const [deviceId, setDeviceId] = useState<number>(activeDeviceId || 1);
  const [apiKey, setApiKey] = useState<string>('dev_key_demo_esp32_secret_key');
  const [manureType, setManureType] = useState<ManureType>('liquid');
  const [transmitting, setTransmitting] = useState(false);
  const [registeredDevice, setRegisteredDevice] = useState<DeviceInfo | null>(null);

  // Packet sensor values
  const [packet, setPacket] = useState({
    ph: 7.15,
    nitrogen_pct: 1.82,
    phosphorus_pct: 0.94,
    potassium_pct: 1.48,
    moisture_pct: 58.6,
    temperature_c: 28.9,
    organic_carbon_pct: 15.2,
  });

  // Terminal log stream
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] ESP32-WROOM-32 Booting up...`,
    `[${new Date().toLocaleTimeString()}] WiFi Connected. IP: 192.168.1.144, RSSI: -54 dBm`,
    `[${new Date().toLocaleTimeString()}] RS485 Modbus NPK Probe initialized on GPIO 16/17`,
    `[${new Date().toLocaleTimeString()}] DS18B20 OneWire Temp Sensor ready on GPIO 4`,
    `[${new Date().toLocaleTimeString()}] Ready to stream telemetry packets to GOBARdhan API`,
  ]);

  const addLog = (msg: string) => {
    setTerminalLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 40)]);
  };

  const handleRandomize = () => {
    const isLiquid = manureType === 'liquid';
    const newPacket = {
      ph: +(6.6 + Math.random() * 1.2).toFixed(2),
      nitrogen_pct: +(1.4 + Math.random() * 1.2).toFixed(2),
      phosphorus_pct: +(0.6 + Math.random() * 0.8).toFixed(2),
      potassium_pct: +(1.0 + Math.random() * 0.9).toFixed(2),
      moisture_pct: +(isLiquid ? 60 + Math.random() * 20 : 45 + Math.random() * 15).toFixed(1),
      temperature_c: +(25 + Math.random() * 10).toFixed(1),
      organic_carbon_pct: +(12 + Math.random() * 8).toFixed(1),
    };
    setPacket(newPacket);
    addLog(`Sensors sampled: pH=${newPacket.ph}, N=${newPacket.nitrogen_pct}%, P=${newPacket.phosphorus_pct}%, K=${newPacket.potassium_pct}%`);
  };

  const handleRegisterDevice = async () => {
    try {
      addLog(`Registering new hardware device for Owner ID ${deviceId}...`);
      const dev = await api.registerDevice(deviceId);
      setRegisteredDevice(dev);
      setApiKey(dev.api_key);
      addLog(`Device created! Assigned Device ID: #${dev.device_id}, API Key: ${dev.api_key.substring(0, 16)}...`);
    } catch (err: any) {
      addLog(`Device registration error: ${err.message}`);
    }
  };

  const handleTransmitPacket = async () => {
    setTransmitting(true);
    addLog(`Sending HTTP POST /api/readings/ingest with X-Device-Key...`);
    try {
      const res = await api.ingestHardwareReading(
        {
          device_id: deviceId,
          manure_type: manureType,
          ...packet,
        },
        apiKey
      );
      addLog(`SUCCESS 200 OK: Ingested Reading ID #${res.reading_id}, Calculated NPK Index: ${res.npk_index}`);
      onReadingIngested();
    } catch (err: any) {
      // If unauthorized key, try fallback manual route
      addLog(`API Response: ${err.message}. Submitting via manual bypass...`);
      try {
        const fallbackRes = await api.submitManualReading({
          device_id: deviceId,
          manure_type: manureType,
          ...packet,
        });
        addLog(`SUCCESS 200 OK via manual ingestion: Reading ID #${fallbackRes.reading_id}`);
        onReadingIngested();
      } catch (fallbackErr: any) {
        addLog(`FAILED: ${fallbackErr.message}`);
      }
    } finally {
      setTransmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-purple-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Hardware Emulation Lab
              </span>
              <span className="text-xs text-slate-400">ESP32 + RS485 Modbus Telemetry Simulator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              IoT Sensor Packet Generator & Serial Monitor
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Simulates live agricultural field sensors transmitting manure parameters over Wi-Fi/4G to the FastAPI backend ingestion gateway.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700 hover:border-purple-500/50 transition flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Probe Read</span>
            </button>
            <button
              onClick={handleRegisterDevice}
              className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-xs font-bold text-purple-300 border border-purple-500/40 transition flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Device</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Device Configuration & Sensor Controls (6 cols) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 space-y-5 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>ESP32 Hardware Transmitter</span>
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
              STATUS: READY
            </span>
          </div>

          {/* Device Credentials */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Target Device ID</label>
              <input
                type="number"
                value={deviceId}
                onChange={(e) => setDeviceId(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Manure Medium</label>
              <select
                value={manureType}
                onChange={(e) => setManureType(e.target.value as ManureType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium"
              >
                <option value="liquid">Liquid Bio-slurry</option>
                <option value="solid">Solid Compost Khad</option>
              </select>
            </div>
          </div>

          {/* Sensor Parameter Inputs */}
          <div className="space-y-3 pt-2 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">pH Sensor</label>
                <input
                  type="number"
                  step="0.05"
                  value={packet.ph}
                  onChange={(e) => setPacket({ ...packet, ph: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-emerald-400 font-semibold mb-1">Nitrogen (N %)</label>
                <input
                  type="number"
                  step="0.05"
                  value={packet.nitrogen_pct}
                  onChange={(e) => setPacket({ ...packet, nitrogen_pct: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-teal-400 font-semibold mb-1">Phosphorus (P %)</label>
                <input
                  type="number"
                  step="0.05"
                  value={packet.phosphorus_pct}
                  onChange={(e) => setPacket({ ...packet, phosphorus_pct: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-amber-400 font-semibold mb-1">Potassium (K %)</label>
                <input
                  type="number"
                  step="0.05"
                  value={packet.potassium_pct}
                  onChange={(e) => setPacket({ ...packet, potassium_pct: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-cyan-400 font-semibold mb-1">Moisture (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={packet.moisture_pct}
                  onChange={(e) => setPacket({ ...packet, moisture_pct: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-orange-400 font-semibold mb-1">Temp (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={packet.temperature_c}
                  onChange={(e) => setPacket({ ...packet, temperature_c: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Transmit Action */}
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={handleTransmitPacket}
              disabled={transmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition"
            >
              <Send className={`w-4 h-4 ${transmitting ? 'animate-bounce' : ''}`} />
              <span>{transmitting ? 'Transmitting Ingestion Packet...' : 'Transmit Ingestion Packet to Backend'}</span>
            </button>
          </div>
        </div>

        {/* Right: Live Serial Terminal Logs (6 cols) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 space-y-3 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white font-mono">UART Serial Console (115200 baud)</h3>
            </div>
            <button
              onClick={() => setTerminalLogs([])}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 bg-black/80 rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-[380px] space-y-1.5 border border-slate-900 text-slate-300">
            {terminalLogs.length === 0 ? (
              <span className="text-slate-600">No output logs.</span>
            ) : (
              terminalLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    log.includes('SUCCESS')
                      ? 'text-emerald-400 font-bold'
                      : log.includes('error') || log.includes('FAILED')
                      ? 'text-rose-400'
                      : log.includes('Sensors')
                      ? 'text-cyan-300'
                      : 'text-slate-400'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
