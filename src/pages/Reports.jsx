import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, Filter, Calendar, Search, MapPin, Building2, User, RefreshCw, CheckCircle2 } from 'lucide-react';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import api from '../services/api.js';

const typeColor = {
  Liquid: 'bg-primary-50 text-primary-700',
  Solid: 'bg-secondary-50 text-secondary-700',
  Organic: 'bg-emerald-50 text-emerald-700',
  AI: 'bg-accent-50 text-accent-700',
  System: 'bg-slate-100 text-slate-600',
};

export default function Reports() {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) {
        const parsed = JSON.parse(u);
        setUserRole(parsed.role);
      }
    } catch {
      setUserRole(null);
    }
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/authority/reports/list', {
        params: {
          district: districtFilter !== 'ALL' ? districtFilter : undefined,
          search: search.trim() || undefined,
        },
      });
      if (res.data?.reports) {
        setReports(res.data.reports);
      }
    } catch {
      // Fallback sample reports if not logged in as authority
      setReports([
        {
          id: 'RPT-0110',
          farmer_id: 110,
          title: isTamil ? 'ரமேஷ் குமார் - கரூர் உர தரம் & பயிர் கணிப்பு அறிக்கை' : 'Ramesh Kumar - Karur Manure & Crop Suitability',
          type: 'Organic',
          district: 'Karur',
          date: '15 Oct 2026',
          status: 'Ready',
          download_url: '/api/authority/farm/110/pdf',
        },
        {
          id: 'RPT-0055',
          farmer_id: 55,
          title: isTamil ? 'செந்தில் குமரன் - தஞ்சாவூர் நெல் உர மதிப்பீடு' : 'Senthil Kumaran - Thanjavur Rice Manure Assessment',
          type: 'Liquid',
          district: 'Thanjavur',
          date: '12 Oct 2026',
          status: 'Ready',
          download_url: '/api/authority/farm/55/pdf',
        },
        {
          id: 'RPT-0042',
          farmer_id: 42,
          title: isTamil ? 'கார்த்திக் ராஜா - கோயம்புத்தூர் திட உர அறிக்கை' : 'Karthik Raja - Coimbatore Solid Manure Log',
          type: 'Solid',
          district: 'Coimbatore',
          date: '10 Oct 2026',
          status: 'Ready',
          download_url: '/api/authority/farm/42/pdf',
        },
        {
          id: 'RPT-0038',
          farmer_id: 38,
          title: isTamil ? 'முருகன் செல்வம் - கரூர் கரும்பு உர கணிப்பு' : 'Murugan Selvam - Karur Sugarcane Suitability',
          type: 'Organic',
          district: 'Karur',
          date: '08 Oct 2026',
          status: 'Ready',
          download_url: '/api/authority/farm/38/pdf',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [districtFilter]);

  const filtered = reports.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.district && r.district.toLowerCase().includes(search.toLowerCase())) ||
    (r.id && r.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container-page section-padding">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="badge bg-primary-50 text-primary-700 mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            {isTamil ? 'அதிகாரி அறிக்கைகள் மையம்' : 'Authority Reports Center'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {isTamil ? 'விவசாயிகள் பண்ணை & பயிர் கணிப்பு அறிக்கைகள்' : 'Farmer Farm & Crop Suitability Reports'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isTamil
              ? 'பதிவு செய்யப்பட்ட அனைத்து விவசாயிகளின் பண்ணை விவரங்கள், இருப்பிடம், உர அளவீடுகள் மற்றும் பயிர் கணிப்புகளை PDF வடிவத்தில் பதிவிறக்கம் செய்யவும்.'
              : 'Official PDF reports covering farm profile, location coordinates, live manure telemetry, and AI crop predictions.'}
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-primary-300 hover:text-primary-600 text-xs font-semibold shadow-xs flex items-center gap-2 transition self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-600' : ''}`} />
          <span>{isTamil ? 'புதுப்பிக்கவும்' : 'Refresh Reports'}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 pb-4">
          <div className="flex items-center gap-2 w-full sm:w-80">
            <Input
              placeholder={isTamil ? "விவசாயி பெயர், மாவட்டம் அல்லது அறிக்கை எண்..." : "Search farmer, district, or report ID..."}
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">{isTamil ? 'அனைத்து மாவட்டங்கள்' : 'All Districts'}</option>
              <option value="Karur">Karur (கரூர்)</option>
              <option value="Thanjavur">Thanjavur (தஞ்சாவூர்)</option>
              <option value="Coimbatore">Coimbatore (கோயம்புத்தூர்)</option>
              <option value="Madurai">Madurai (மதுரை)</option>
              <option value="Salem">Salem (சேலம்)</option>
              <option value="Tiruchirappalli">Tiruchirappalli (திருச்சிராப்பள்ளி)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-y border-slate-100 bg-slate-50/60">
                <th className="py-3 px-6 font-semibold">{t('reports.colId')}</th>
                <th className="py-3 px-6 font-semibold">{isTamil ? 'விவசாயி & பண்ணை அறிக்கை' : 'Farmer & Farm Report'}</th>
                <th className="py-3 px-6 font-semibold">{isTamil ? 'மாவட்டம்' : 'District'}</th>
                <th className="py-3 px-6 font-semibold">{t('reports.colType')}</th>
                <th className="py-3 px-6 font-semibold">{t('reports.colDate')}</th>
                <th className="py-3 px-6 font-semibold text-right">{t('reports.colAction')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-6 text-primary-600 font-mono font-bold text-xs">{r.id}</td>
                  <td className="py-3.5 px-6 font-medium text-slate-900">
                    <div>
                      <p className="font-semibold text-slate-900">{r.title}</p>
                      {r.predicted_crop && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isTamil ? 'பரிந்துரை பயிர்:' : 'Predicted Crop:'}{' '}
                          <span className="font-medium text-primary-700">
                            {isTamil ? (r.predicted_crop_tamil || r.predicted_crop) : r.predicted_crop}
                          </span>
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                      {r.district}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeColor[r.type] || typeColor.Organic}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-600 text-xs">{r.date}</td>
                  <td className="py-3.5 px-6 text-right">
                    <a
                      href={r.download_url || `/api/authority/farm/${r.farmer_id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isTamil ? 'PDF பதிவிறக்கம்' : 'Download PDF'}</span>
                    </a>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    {isTamil ? 'உங்கள் தேடலுக்கு எந்த விவசாயி அறிக்கைகளும் பொருந்தவில்லை.' : 'No farmer reports match your search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

