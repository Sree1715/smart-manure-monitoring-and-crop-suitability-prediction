import React, { useState } from 'react';
import {
  AlertTriangle,
  MapPin,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Clock,
  Filter,
} from 'lucide-react';

export default function RegionalInsights({
  insights = [],
  loading = false,
  isTamil = false,
  onSelectDistrict,
  onSelectFarm,
}) {
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  return (
    <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              {isTamil ? 'பிராந்திய உர தர நுண்ணறிவுகள்' : 'Regional Manure Quality Insights'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isTamil
              ? 'மீண்டும் மீண்டும் எச்சரிக்கை அல்லது அவசர நிலை ஏற்பட்ட பிராந்தியங்கள் மற்றும் கிராமங்களின் பகுப்பாய்வு'
              : 'Identification of districts and villages with repeated warning or critical manure quality alerts'}
          </p>
        </div>

        <span className="badge bg-amber-50 text-amber-800 border border-amber-200 text-xs px-3 py-1 font-semibold self-start sm:self-auto">
          {insights.length} {isTamil ? 'கண்டறியப்பட்ட மண்டலங்கள்' : 'Active Hotspots Detected'}
        </span>
      </div>

      {loading && (
        <div className="py-12 text-center text-slate-400 text-sm">
          {isTamil ? 'பிராந்திய நுண்ணறிவுகள் ஏற்றப்படுகின்றன...' : 'Analyzing recurring regional telemetry...'}
        </div>
      )}

      {!loading && insights.length === 0 && (
        <div className="py-10 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-slate-100">
          <p className="font-semibold text-slate-700 mb-1">
            {isTamil ? 'மீண்டும் வரும் சிக்கல்கள் எதுவும் இல்லை' : 'No Recurring Quality Anomalies'}
          </p>
          <p className="text-xs text-slate-400">
            {isTamil
              ? 'அனைத்து கண்காணிக்கப்படும் பண்ணைகளும் அனுமதிக்கப்பட்ட வரம்பிற்குள் உள்ளன.'
              : 'All monitored farms in the selected scope are operating within optimal agronomic thresholds.'}
          </p>
        </div>
      )}

      {!loading && insights.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hotspot Cards / Table */}
          <div className="lg:col-span-2 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">{isTamil ? 'மாவட்டம் & பகுதி' : 'District & Village'}</th>
                  <th className="py-2.5 px-3 font-semibold text-center">{isTamil ? 'பாதிக்கப்பட்ட பண்ணைகள்' : 'Affected Farms'}</th>
                  <th className="py-2.5 px-3 font-semibold text-center">{isTamil ? 'எச்சரிக்கைகள்' : 'Alert Count'}</th>
                  <th className="py-2.5 px-3 font-semibold">{isTamil ? 'முக்கிய முரண்பாடுகள்' : 'Abnormal Parameters'}</th>
                  <th className="py-2.5 px-3 font-semibold">{isTamil ? 'சமீபத்திய சிக்கல்' : 'Latest Issue'}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{isTamil ? 'செயல்' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {insights.map((item, idx) => {
                  const isSelected = selectedHotspot?.district === item.district && selectedHotspot?.village === item.village;
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        isSelected ? 'bg-primary-50/40' : ''
                      }`}
                      onClick={() => setSelectedHotspot(item)}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                          <span>{item.district}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 pl-5">{item.village}</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800">
                          {item.affected_farms_count}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                          {item.repeated_alerts_count}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {item.most_frequently_abnormal_parameters?.map((p, pIdx) => (
                            <span key={pIdx} className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-medium border border-red-100">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {item.latest_recorded_issue}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHotspot(item);
                            if (onSelectDistrict) onSelectDistrict(item.district);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 font-semibold text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <span>{isTamil ? 'வரைபடத்தில் காண்க' : 'View on Map'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Hotspot Drill-down Side Panel */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            {selectedHotspot ? (
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-primary-600 uppercase">
                      {isTamil ? 'பிராந்திய ஆய்வு' : 'Hotspot Investigation'}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {selectedHotspot.village}, {selectedHotspot.district}
                    </h4>
                  </div>
                  <button
                    onClick={() => onSelectDistrict && onSelectDistrict(selectedHotspot.district)}
                    className="text-xs text-primary-600 hover:underline font-semibold"
                  >
                    {isTamil ? 'மாவட்டம் வடிகட்டு' : 'Filter District'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">{isTamil ? 'பாதிக்கப்பட்ட பண்ணைகள்' : 'Affected Farms'}</p>
                    <p className="text-base font-extrabold text-slate-900">{selectedHotspot.affected_farms_count}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">{isTamil ? 'தீர்க்கப்படாதவை' : 'Unresolved Alerts'}</p>
                    <p className="text-base font-extrabold text-amber-700">{selectedHotspot.unresolved_alerts_count}</p>
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-700 mb-2">
                  {isTamil ? 'பாதிக்கப்பட்ட பண்ணைகள் பட்டியல்:' : 'Affected Farms in this Region:'}
                </p>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedHotspot.affected_farms?.map((af) => (
                    <div
                      key={af.id}
                      onClick={() => onSelectFarm && onSelectFarm(af.id)}
                      className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs hover:border-primary-300 hover:shadow-xs transition cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{af.farmer_name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{af.farm_id}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-primary-600 flex items-center gap-0.5">
                        {isTamil ? 'விவரம்' : 'Details'} &rarr;
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <p className="font-semibold text-slate-600 mb-1">
                  {isTamil ? 'பிராந்தியத்தைத் தேர்வு செய்க' : 'Select a Region'}
                </p>
                <p>
                  {isTamil
                    ? 'பாதிக்கப்பட்ட பண்ணைகள் மற்றும் விவரங்களை ஆராய இடதுபுறத்தில் உள்ள வரிசையை கிளிக் செய்யவும்.'
                    : 'Click any row on the left to inspect affected farms and parameter anomalies in that zone.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
