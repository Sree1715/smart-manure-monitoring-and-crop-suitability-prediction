import React from 'react';
import { X, MapPinOff, AlertCircle, ChevronRight } from 'lucide-react';

export default function UnlocatedFarmsModal({
  isOpen,
  onClose,
  unlocatedFarms = [],
  onSelectFarm,
  isTamil = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-card-hover border border-slate-100 w-full max-w-xl overflow-hidden animate-slide-up">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700">
              <MapPinOff className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isTamil ? 'புவி இருப்பிடம் இல்லாத பண்ணைகள்' : 'Location Coordinates Not Available'}
              </h3>
              <p className="text-xs text-slate-500">
                {isTamil
                  ? 'கீழ்கண்ட பண்ணைகளுக்கு GPS அட்சரேகை/தீர்க்கரேகை பதிவு செய்யப்படவில்லை.'
                  : 'Farms registered without confirmed geographic latitude and longitude.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-96 overflow-y-auto space-y-2.5">
          {unlocatedFarms.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">
              {isTamil ? 'அனைத்து பண்ணைகளுக்கும் இருப்பிடம் உள்ளது.' : 'All registered farms have valid coordinates.'}
            </p>
          ) : (
            unlocatedFarms.map((f) => (
              <div
                key={f.id}
                onClick={() => {
                  onSelectFarm(f.id);
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/20 transition flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{f.farmer_name}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {f.farm_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {f.village}, {f.district} &bull; {f.phone}
                  </p>
                  <p className="text-[11px] text-amber-600 mt-1">
                    ⚠️ {isTamil ? 'ஜிபிஎஸ் ஒருங்கிணைப்புகள் தேவைப்படுகின்றன' : 'Geographic coordinates required for map placement'}
                  </p>
                </div>

                <button className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 hover:bg-primary-600 hover:text-white transition">
                  <span>{isTamil ? 'ஆராய்க' : 'Inspect'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
          >
            {isTamil ? 'மூடுக' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
