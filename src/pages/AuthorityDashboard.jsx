import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Wheat,
  AlertTriangle,
  MapPin,
  Download,
  Filter,
  Search,
  RotateCcw,
  RefreshCw,
  MapPinOff,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Layers,
  Sparkles,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import api from '../services/api.js';
import TamilNaduMap from '../components/TamilNaduMap.jsx';
import FarmDetailsPanel from '../components/FarmDetailsPanel.jsx';
import RegionalInsights from '../components/RegionalInsights.jsx';
import UnlocatedFarmsModal from '../components/UnlocatedFarmsModal.jsx';
import AuthorityCharts from '../components/AuthorityCharts.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';

export default function AuthorityDashboard() {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';

  // Filters state
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [villageSearch, setVillageSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('30'); // days

  // Data state
  const [districtsMeta, setDistrictsMeta] = useState([]);
  const [farmsData, setFarmsData] = useState({ farms: [], unlocated_farms: [], total_farms: 0 });
  const [mapStats, setMapStats] = useState(null);
  const [regionalInsights, setRegionalInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Selected farm for detailed side panel
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [unlocatedModalOpen, setUnlocatedModalOpen] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    setAuthError(null);

    try {
      const params = {
        district: selectedDistrict !== 'ALL' ? selectedDistrict : undefined,
        village: villageSearch.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      };

      const statsParams = {
        district: selectedDistrict !== 'ALL' ? selectedDistrict : undefined,
        village: villageSearch.trim() || undefined,
      };

      const [districtsRes, farmsRes, statsRes, insightsRes] = await Promise.all([
        api.get('/authority/districts'),
        api.get('/authority/farms', { params }),
        api.get('/authority/map-stats', { params: statsParams }),
        api.get('/authority/regional-insights', { params: { days: parseInt(dateRange, 10) || 30 } }),
      ]);

      setDistrictsMeta(districtsRes.data?.districts || []);
      setFarmsData(farmsRes.data || { farms: [], unlocated_farms: [] });
      setMapStats(statsRes.data);
      setRegionalInsights(insightsRes.data?.hotspots || []);
    } catch (err) {
      console.error('Failed to load authority dashboard data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setAuthError(
          isTamil
            ? 'இந்த தொகுதியை அணுக அரசு அதிகாரி அனுமதி தேவைப்படுகிறது. தயவுசெய்து அதிகாரி கணக்கில் உள்நுழைக.'
            : 'Authority privileges required to view the geographic monitoring module. Please log in as an authorized officer.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDistrict, villageSearch, statusFilter, dateRange, isTamil]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle District Change
  const handleDistrictChange = (dist) => {
    setSelectedDistrict(dist);
    setVillageSearch('');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedDistrict('ALL');
    setVillageSearch('');
    setStatusFilter('ALL');
    setDateRange('30');
  };

  const statCards = [
    {
      title: isTamil ? 'மொத்த பண்ணைகள்' : 'Total Farms',
      value: mapStats?.total_farms || farmsData.total_farms || 0,
      sub: selectedDistrict !== 'ALL' ? selectedDistrict : (isTamil ? '38 மாவட்டங்கள்' : 'All 38 Districts'),
      icon: Users,
      color: 'bg-primary-50 text-primary-700 border-primary-200',
    },
    {
      title: isTamil ? 'இயல்பான உரம்' : 'Normal Quality',
      value: mapStats?.normal_count ?? 0,
      sub: isTamil ? 'பாதுகாப்பான வரம்பில்' : 'Within optimal thresholds',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: isTamil ? 'கவனம் தேவை (எச்சரிக்கை)' : 'Warning Farms',
      value: mapStats?.warning_count ?? 0,
      sub: isTamil ? 'அளவுரு மாறுபாடு' : 'Parameter attention needed',
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: isTamil ? 'அவசர நிலை எச்சரிக்கைகள்' : 'Critical Alerts',
      value: mapStats?.critical_count ?? 0,
      sub: isTamil ? 'உடனடி தலையீடு தேவை' : 'Immediate intervention',
      icon: AlertCircle,
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      title: isTamil ? 'காலாவதியான / தகவல் இல்லை' : 'Outdated / No Data',
      value: mapStats?.insufficient_count ?? 0,
      sub: isTamil ? '>14 நாட்கள் அளவீடு இல்லை' : 'No telemetry >14 days',
      icon: HelpCircle,
      color: 'bg-slate-100 text-slate-700 border-slate-300',
    },
  ];

  return (
    <div className="container-page section-padding space-y-8">
      {/* ─────────────────────────────────────────────────────────────────────────
          TOP SECTION: Header & Filters Bar
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge bg-primary-50 text-primary-700 border border-primary-200 font-bold px-2.5 py-0.5 rounded-full text-xs">
                {isTamil ? 'தமிழ்நாடு வேளாண்மை இயக்குநரகம்' : 'Tamil Nadu Agricultural Directorate'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                &bull; GOBARdhan / Smart Manure GIS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isTamil ? 'தமிழ்நாடு இயற்கை உர தரக் கண்காணிப்பு வரைபடம்' : 'Tamil Nadu Manure Quality Monitoring'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isTamil
                ? 'அனைத்து 38 மாவட்டங்களிலும் உள்ள பதிவு செய்யப்பட்ட பண்ணைகளின் இயற்கை உர தரம் மற்றும் பயிர் கணிப்புகளை நிகழ்நேரத்தில் கண்காணிக்கவும்.'
                : 'Interactive spatial telemetry across all 38 districts of Tamil Nadu for organic manure quality and AI crop suitability.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {farmsData.unlocated_count > 0 && (
              <button
                onClick={() => setUnlocatedModalOpen(true)}
                className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition flex items-center gap-1.5 shadow-xs"
              >
                <MapPinOff className="w-4 h-4 text-amber-600" />
                <span>
                  {farmsData.unlocated_count} {isTamil ? 'இருப்பிடம் இல்லை' : 'Location Not Available'}
                </span>
              </button>
            )}

            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-primary-300 hover:text-primary-600 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-600' : ''}`} />
              <span>{isTamil ? 'புதுப்பிக்கவும்' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Filters Controls Row */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* District dropdown (38 TN Districts) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {isTamil ? 'மாவட்டம்' : 'District'} (38)
            </label>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 py-2.5 px-3 pr-8 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition"
              >
                <option value="ALL">{isTamil ? 'அனைத்து 38 மாவட்டங்கள்' : 'All 38 Districts'}</option>
                {districtsMeta.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} {isTamil ? `(${d.tamil_name})` : ''} {d.total_farms ? `[${d.total_farms}]` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Village filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {isTamil ? 'கிராமம் / பகுதி' : 'Village / Region'}
            </label>
            <input
              type="text"
              placeholder={isTamil ? "எ.கா. குளித்தலை..." : "e.g. Kulithalai, Sulur..."}
              value={villageSearch}
              onChange={(e) => setVillageSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 py-2.5 px-3 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition"
            />
          </div>

          {/* Manure Quality Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {isTamil ? 'உர தர நிலை' : 'Quality Status'}
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 py-2.5 px-3 pr-8 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition"
              >
                <option value="ALL">{isTamil ? 'அனைத்து நிலைகள்' : 'All Statuses'}</option>
                <option value="normal">{isTamil ? 'இயல்பு (Normal)' : 'Normal Quality (Green)'}</option>
                <option value="warning">{isTamil ? 'எச்சரிக்கை (Warning)' : 'Warning (Yellow)'}</option>
                <option value="critical">{isTamil ? 'அவசர நிலை (Critical)' : 'Critical (Red)'}</option>
                <option value="insufficient_data">{isTamil ? 'தகவல் இல்லை (Outdated)' : 'Outdated Data (Gray)'}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Time Window */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {isTamil ? 'கால அளவு' : 'Telemetry Window'}
            </label>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 py-2.5 px-3 pr-8 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition"
              >
                <option value="7">{isTamil ? 'கடந்த 7 நாட்கள்' : 'Last 7 Days'}</option>
                <option value="14">{isTamil ? 'கடந்த 14 நாட்கள்' : 'Last 14 Days'}</option>
                <option value="30">{isTamil ? 'கடந்த 30 நாட்கள்' : 'Last 30 Days'}</option>
                <option value="60">{isTamil ? 'கடந்த 60 நாட்கள்' : 'Last 60 Days'}</option>
                <option value="90">{isTamil ? 'கடந்த 90 நாட்கள்' : 'Last 90 Days'}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Reset Filters button */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isTamil ? 'வடிகட்டிகளை அழி' : 'Reset Filters'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auth error banner */}
      {authError && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-sm flex items-start justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{authError}</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {isTamil
                  ? 'டெமோ அணுகல்: admin@smartmanure.gov.in / admin123 கொண்டு உள்நுழையவும்.'
                  : 'Authority credentials required: admin@smartmanure.gov.in / admin123'}
              </p>
            </div>
          </div>
          <Button to="/authority-login" size="sm" variant="accent">
            {isTamil ? 'அதிகாரி உள்நுழைவு' : 'Authority Login'}
          </Button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          STATISTICS SECTION: Metric Cards Above Map
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border bg-white shadow-soft flex flex-col justify-between transition hover:shadow-card`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 line-clamp-1">{card.title}</span>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          MAIN SECTION: Interactive Tamil Nadu Map
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-base font-bold text-slate-900">
              {isTamil ? 'நேரலை புவிசார் கண்காணிப்பு பலகை' : 'Live Geospatial Telemetry Map'}
            </h3>
            <span className="text-xs text-slate-400">
              ({farmsData.located_count} {isTamil ? 'வரைபடத்தில் உள்ள பண்ணைகள்' : 'mapped farms'})
            </span>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {isTamil ? 'எந்தவொரு பண்ணை குறியீட்டையும் கிளிக் செய்து முழு விவரங்களைப் பெறவும்.' : 'Click any farm marker or district boundary to inspect.'}
          </span>
        </div>

        {/* Map Component */}
        <TamilNaduMap
          farms={farmsData.farms}
          selectedDistrict={selectedDistrict}
          districtsMeta={districtsMeta}
          onSelectDistrict={handleDistrictChange}
          onSelectFarm={(id) => setSelectedFarmId(id)}
          selectedFarmId={selectedFarmId}
          isTamil={isTamil}
        />
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          BOTTOM SECTION 1: District Analytics & Charts
      ────────────────────────────────────────────────────────────────────────── */}
      <AuthorityCharts
        statsData={mapStats}
        isTamil={isTamil}
        selectedDistrict={selectedDistrict}
      />

      {/* ─────────────────────────────────────────────────────────────────────────
          BOTTOM SECTION 2: Regional Manure Quality Insights (Hotspots)
      ────────────────────────────────────────────────────────────────────────── */}
      <RegionalInsights
        insights={regionalInsights}
        loading={loading}
        isTamil={isTamil}
        onSelectDistrict={handleDistrictChange}
        onSelectFarm={(id) => setSelectedFarmId(id)}
      />

      {/* ─────────────────────────────────────────────────────────────────────────
          BOTTOM SECTION 3: Registered Farms Directory Table
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="p-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {isTamil ? 'தமிழ்நாடு பண்ணைகள் பட்டியல்' : 'Tamil Nadu Registered Farms Directory'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {farmsData.farms.length} {isTamil ? 'பண்ணைகள் வடிகட்டலுக்குள் உள்ளன' : 'farms matching active filters'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="py-3 px-4 font-semibold">{isTamil ? 'பண்ணை எண்' : 'Farm ID'}</th>
                <th className="py-3 px-4 font-semibold">{isTamil ? 'விவசாயி பெயர்' : 'Farmer Name'}</th>
                <th className="py-3 px-4 font-semibold">{isTamil ? 'மாவட்டம் & கிராமம்' : 'District & Village'}</th>
                <th className="py-3 px-4 font-semibold">{isTamil ? 'உர தரம்' : 'Quality Status'}</th>
                <th className="py-3 px-4 font-semibold">{isTamil ? 'பரிந்துரை பயிர்' : 'Predicted Crop'}</th>
                <th className="py-3 px-4 font-semibold">{isTamil ? 'சமீபத்திய அளவீடு' : 'Last Reading'}</th>
                <th className="py-3 px-4 font-semibold text-right">{isTamil ? 'செயல்' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {farmsData.farms.slice(0, 20).map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-primary-600">{f.farm_id}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{f.farmer_name}</td>
                  <td className="py-3 px-4 text-slate-600">
                    📍 {f.village}, {f.district}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        f.status === 'normal'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : f.status === 'warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : f.status === 'critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {f.status_label}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-primary-700">
                    {isTamil ? (f.predicted_crop_tamil || f.predicted_crop) : f.predicted_crop}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {f.latest_reading?.timestamp
                      ? new Date(f.latest_reading.timestamp).toLocaleDateString()
                      : (isTamil ? 'அளவீடு இல்லை' : 'No telemetry')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/api/authority/farm/${f.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-primary-600 hover:border-primary-300 transition"
                        title={isTamil ? "PDF அறிக்கை பதிவிறக்குக" : "Download PDF Report"}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setSelectedFarmId(f.id)}
                        className="px-2.5 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold transition"
                      >
                        {isTamil ? 'விவரம்' : 'Inspect'} &rarr;
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          SIDE PANEL & MODALS
      ────────────────────────────────────────────────────────────────────────── */}
      {selectedFarmId && (
        <FarmDetailsPanel
          farmId={selectedFarmId}
          onClose={() => setSelectedFarmId(null)}
          isTamil={isTamil}
          onAlertResolved={() => fetchDashboardData()}
        />
      )}

      <UnlocatedFarmsModal
        isOpen={unlocatedModalOpen}
        onClose={() => setUnlocatedModalOpen(false)}
        unlocatedFarms={farmsData.unlocated_farms}
        onSelectFarm={(id) => setSelectedFarmId(id)}
        isTamil={isTamil}
      />
    </div>
  );
}
