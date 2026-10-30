import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Layers,
  MapPin,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// Marker SVG templates for crisp display across all zoom levels
const createMarkerIcon = (color, status) => {
  const colorMap = {
    green: { fill: '#16a34a', stroke: '#15803d', pulse: 'rgba(22, 163, 74, 0.4)' },
    yellow: { fill: '#f59e0b', stroke: '#d97706', pulse: 'rgba(245, 158, 11, 0.4)' },
    red: { fill: '#ef4444', stroke: '#b91c1c', pulse: 'rgba(239, 68, 68, 0.4)' },
    gray: { fill: '#64748b', stroke: '#475569', pulse: 'rgba(100, 116, 139, 0.3)' },
  };

  const c = colorMap[color] || colorMap.gray;

  const html = `
    <div class="tn-marker-pin" style="position: relative; width: 32px; height: 32px;">
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: ${c.pulse};
        animation: marker-pulse 2s infinite ease-out;
      "></div>
      <div style="
        position: absolute;
        top: 4px;
        left: 4px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${c.fill};
        border: 2.5px solid #ffffff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: `tn-custom-marker tn-marker-${color}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
};

export default function TamilNaduMap({
  farms = [],
  selectedDistrict = 'ALL',
  districtsMeta = [],
  onSelectFarm,
  onSelectDistrict,
  selectedFarmId = null,
  isTamil = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showBoundaries, setShowBoundaries] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Tamil Nadu center
      const tnCenter = [11.1271, 78.6569];
      const map = L.map(mapContainerRef.current, {
        center: tnCenter,
        zoom: 7,
        minZoom: 6,
        maxZoom: 18,
        zoomControl: false,
      });

      // Add Zoom control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Layers group for markers
      markersLayerRef.current = L.featureGroup().addTo(map);

      mapInstanceRef.current = map;

      // Load Tamil Nadu District GeoJSON
      fetch('/data/tamil_nadu_districts.geojson')
        .then((res) => res.json())
        .then((geoData) => {
          if (!mapInstanceRef.current) return;

          const districtStyle = {
            color: '#2563eb',
            weight: 1.5,
            opacity: 0.7,
            dashArray: '3, 4',
            fillColor: '#3b82f6',
            fillOpacity: 0.05,
          };

          const geoLayer = L.geoJSON(geoData, {
            style: districtStyle,
            onEachFeature: (feature, layer) => {
              const dName = feature.properties?.district || '';
              const dTamil = feature.properties?.tamil_name || '';

              layer.bindTooltip(
                `<div class="text-xs font-semibold font-sans px-1"><strong>${dName}</strong> <span class="text-slate-500">(${dTamil})</span></div>`,
                { permanent: false, direction: 'center', className: 'tn-district-tooltip' }
              );

              layer.on({
                mouseover: (e) => {
                  const target = e.target;
                  target.setStyle({
                    weight: 2.5,
                    color: '#1d4ed8',
                    dashArray: '',
                    fillOpacity: 0.18,
                  });
                },
                mouseout: (e) => {
                  geoLayer.resetStyle(e.target);
                },
                click: () => {
                  if (onSelectDistrict) {
                    onSelectDistrict(dName);
                  }
                },
              });
            },
          });

          geojsonLayerRef.current = geoLayer;
          if (showBoundaries) {
            geoLayer.addTo(mapInstanceRef.current);
          }
        })
        .catch((err) => console.error('Failed to load TN district GeoJSON:', err));
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Toggle boundary layer visibility
  useEffect(() => {
    if (!mapInstanceRef.current || !geojsonLayerRef.current) return;
    if (showBoundaries) {
      if (!mapInstanceRef.current.hasLayer(geojsonLayerRef.current)) {
        geojsonLayerRef.current.addTo(mapInstanceRef.current);
      }
    } else {
      if (mapInstanceRef.current.hasLayer(geojsonLayerRef.current)) {
        mapInstanceRef.current.removeLayer(geojsonLayerRef.current);
      }
    }
  }, [showBoundaries]);

  // Update District flyTo when selectedDistrict changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!selectedDistrict || selectedDistrict.toUpperCase() === 'ALL') {
      mapInstanceRef.current.flyTo([11.1271, 78.6569], 7, { duration: 1 });
      return;
    }

    const distInfo = districtsMeta.find(
      (d) => d.name.toLowerCase() === selectedDistrict.toLowerCase()
    );

    if (distInfo && distInfo.lat && distInfo.lng) {
      mapInstanceRef.current.flyTo([distInfo.lat, distInfo.lng], distInfo.zoom || 10, {
        duration: 1.2,
      });
    }
  }, [selectedDistrict, districtsMeta]);

  // Render Farm Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    farms.forEach((farm) => {
      if (farm.latitude == null || farm.longitude == null) return;

      const icon = createMarkerIcon(farm.status_color, farm.status);

      const marker = L.marker([farm.latitude, farm.longitude], {
        icon,
        title: `${farm.farm_id} - ${farm.farmer_name}`,
      });

      // Farm popup HTML
      const statusBadgeClass =
        farm.status === 'normal'
          ? 'bg-emerald-100 text-emerald-800'
          : farm.status === 'warning'
          ? 'bg-amber-100 text-amber-800'
          : farm.status === 'critical'
          ? 'bg-red-100 text-red-800'
          : 'bg-slate-100 text-slate-700';

      const statusText =
        farm.status === 'normal'
          ? (isTamil ? 'இயல்பான உரம்' : 'Normal Quality')
          : farm.status === 'warning'
          ? (isTamil ? 'கவனம் தேவை' : 'Warning')
          : farm.status === 'critical'
          ? (isTamil ? 'அவசர நிலை' : 'Critical Alert')
          : (isTamil ? 'போதுமான தரவு இல்லை' : 'Insufficient Data');

      const cropDisplay = isTamil ? (farm.predicted_crop_tamil || farm.predicted_crop) : farm.predicted_crop;

      const popupContent = `
        <div class="tn-farm-popup font-sans text-slate-800 p-1" style="min-width: 220px;">
          <div class="flex items-center justify-between pb-1 mb-2 border-b border-slate-100">
            <span class="font-mono text-[11px] font-bold text-primary-600">${farm.farm_id}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadgeClass}">${statusText}</span>
          </div>
          <p class="font-bold text-sm text-slate-900 mb-0.5">${farm.farmer_name}</p>
          <p class="text-xs text-slate-500 mb-2">📍 ${farm.village}, ${farm.district}</p>

          <div class="bg-slate-50 rounded-lg p-2 mb-2 text-xs border border-slate-100">
            <div class="flex justify-between py-0.5">
              <span class="text-slate-500">${isTamil ? 'பரிந்துரை பயிர்:' : 'Predicted Crop:'}</span>
              <span class="font-semibold text-primary-700">${cropDisplay || '—'}</span>
            </div>
            ${
              farm.latest_reading?.ph != null
                ? `<div class="flex justify-between py-0.5">
                    <span class="text-slate-500">pH:</span>
                    <span class="font-bold text-slate-800">${farm.latest_reading.ph}</span>
                  </div>`
                : ''
            }
            ${
              farm.latest_reading?.moisture_pct != null
                ? `<div class="flex justify-between py-0.5">
                    <span class="text-slate-500">${isTamil ? 'ஈரப்பதம்:' : 'Moisture:'}</span>
                    <span class="font-bold text-slate-800">${farm.latest_reading.moisture_pct}%</span>
                  </div>`
                : ''
            }
          </div>

          <p class="text-[11px] text-slate-600 mb-2 leading-tight">${farm.status_reason || ''}</p>

          <div class="flex gap-1.5 mt-2">
            <button id="btn-farm-details-${farm.id}" class="flex-1 py-1.5 px-2 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors">
              <span>${isTamil ? 'விவரம் காண்க' : 'Inspect'}</span>
              &rarr;
            </button>
            <a href="/api/authority/farm/${farm.id}/pdf" target="_blank" rel="noopener noreferrer" class="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-slate-200" title="${isTamil ? 'PDF பதிவிறக்குக' : 'Download PDF'}">
              <span>PDF</span>
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });

      marker.on('click', () => {
        if (onSelectFarm) {
          onSelectFarm(farm.id);
        }
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-farm-details-${farm.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectFarm) onSelectFarm(farm.id);
          };
        }
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [farms, isTamil, onSelectFarm]);

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([11.1271, 78.6569], 7, { duration: 0.8 });
    }
  };

  const toggleFullscreen = () => {
    setFullscreen((prev) => !prev);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
  };

  return (
    <div
      className={`relative bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-card transition-all ${
        fullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[540px] md:h-[620px] w-full'
      }`}
    >
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Floating Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <button
          onClick={resetView}
          className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white hover:text-primary-600 flex items-center gap-1.5 transition"
          title="Reset View to Tamil Nadu"
        >
          <RotateCcw className="w-3.5 h-3.5 text-primary-600" />
          <span>{isTamil ? 'தமிழ்நாடு முழுமை' : 'Reset TN View'}</span>
        </button>

        <button
          onClick={() => setShowBoundaries((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm flex items-center gap-1.5 transition ${
            showBoundaries
              ? 'bg-primary-50 text-primary-700 border-primary-200'
              : 'bg-white/95 text-slate-600 border-slate-200 hover:bg-white'
          }`}
          title="Toggle District Boundaries"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isTamil ? 'மாவட்ட எல்லைகள்' : 'District Boundaries'}</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="bg-white/95 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200 text-slate-700 shadow-sm hover:bg-white hover:text-primary-600 transition"
          title={fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-soft max-w-xs text-xs">
        <p className="font-semibold text-slate-800 mb-2 text-[11px] uppercase tracking-wider">
          {isTamil ? 'உர தரக் குறியீடுகள்' : 'Manure Quality Legend'}
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs"></span>
            <span className="text-slate-700">{isTamil ? 'இயல்பானது' : 'Normal'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs"></span>
            <span className="text-slate-700">{isTamil ? 'எச்சரிக்கை' : 'Warning'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-xs"></span>
            <span className="text-slate-700">{isTamil ? 'அவசர நிலை' : 'Critical Alert'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-400 shadow-xs"></span>
            <span className="text-slate-700">{isTamil ? 'காலாவதியான / தகவல் இல்லை' : 'Outdated / No Data'}</span>
          </div>
        </div>
      </div>

      {/* Bottom right active district badge */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-soft text-xs text-slate-600 font-medium hidden sm:flex items-center gap-2">
        <span>📍 {isTamil ? 'மாவட்டம்:' : 'District:'}</span>
        <strong className="text-primary-700">{selectedDistrict || 'All 38 Districts'}</strong>
      </div>
    </div>
  );
}
