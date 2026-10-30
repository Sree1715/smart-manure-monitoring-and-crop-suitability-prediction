import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Cpu,
  AlertTriangle,
  MapPin,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  Activity,
  Download
} from 'lucide-react';
import { AuthorityOverview, AuthorityFarmer, AuthorityReadingItem } from '../types';
import { api } from '../services/api';

export const AuthorityTab: React.FC = () => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [overview, setOverview] = useState<AuthorityOverview | null>(null);
  const [farmers, setFarmers] = useState<AuthorityFarmer[]>([]);
  const [readings, setReadings] = useState<AuthorityReadingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async (dist = selectedDistrict) => {
    setLoading(true);
    try {
      const [ov, fList, rList] = await Promise.all([
        api.getAuthorityOverview(dist || undefined),
        api.getAuthorityFarmers(dist || undefined),
        api.getAuthorityReadings(dist || undefined, 20),
      ]);
      setOverview(ov);
      setFarmers(fList);
      setReadings(rList);
    } catch (err: any) {
      console.error('Error fetching authority data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDistrict);
  }, [selectedDistrict]);

  const filteredFarmers = farmers.filter((f) => {
    const matchSearch =
      f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.predicted_crop.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const districtsList = [
    'All Districts',
    'Ludhiana',
    'Nashik',
    'Karnal',
    'Meerut',
    'Guntur',
    'Pune',
    'Nagpur',
    'Indore',
    'Varanasi',
    'Bhatinda',
    'Kolhapur',
  ];

  return (
    <div className="space-y-6">
      
      {/* Authority Hero Banner */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-cyan-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Ministry / State Agriculture Authority
              </span>
              <span className="text-xs text-slate-400">GOBARdhan Governance Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Regional Manure Quality & Fleet Oversight
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              High-level aggregated agronomic surveillance across farmer clusters. Monitors biosecurity compliance, manure maturity, and automated crop recommendation readiness.
            </p>
          </div>

          {/* District Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <Filter className="w-4 h-4 text-cyan-400" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value === 'All Districts' ? '' : e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer"
            >
              {districtsList.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-white">
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Farmers Count */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Farmers</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {overview?.registered_farmers_count ?? 20}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Active in {overview?.districts_count ?? 6} agricultural zones
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Monitored Devices */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">IoT Nodes Online</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {overview?.active_devices_count ?? 5}
              </h3>
              <p className="text-[11px] text-emerald-400 mt-1">
                Telemetry pinging continuously
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Ingested Readings */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ingested Telemetry</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {overview?.total_readings_count ?? 42}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Validated in SQLite repository
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Quality Alerts */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quality Alerts</span>
              <h3 className={`text-3xl font-extrabold mt-1 ${(overview?.quality_alerts_count ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {overview?.quality_alerts_count ?? 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Anomalous pH or moisture flagged
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>

      {/* Farmer Fleet Table */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Farmer Fleet Registry & Telemetry Status</span>
            </h3>
            <p className="text-xs text-slate-400">
              Real-time surveillance of registered farmers, device assignments, and crop predictions
            </p>
          </div>

          {/* Search filter */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search farmer or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">Farmer ID</th>
                <th className="py-3 px-4 font-bold">Account</th>
                <th className="py-3 px-4 font-bold">District</th>
                <th className="py-3 px-4 font-bold">Devices</th>
                <th className="py-3 px-4 font-bold">Manure Health Status</th>
                <th className="py-3 px-4 font-bold">Predicted Crop</th>
                <th className="py-3 px-4 font-bold">Last Reading</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredFarmers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    No farmers found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredFarmers.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-4 font-mono text-slate-400">#{f.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{f.email}</td>
                    <td className="py-3 px-4 text-cyan-400 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{f.district}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{f.device_count} unit(s)</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        f.status === 'Good'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {f.status === 'Good' ? '✓ Optimal Quality' : '⚠️ Attention Required'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-300">{f.predicted_crop}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {f.latest_reading_time ? new Date(f.latest_reading_time).toLocaleDateString() : 'Pending Data'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
