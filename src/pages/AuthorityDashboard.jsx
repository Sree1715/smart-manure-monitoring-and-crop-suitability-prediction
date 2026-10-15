import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users, Wheat, AlertTriangle, MapPin, Download, Filter, Search, RotateCcw
} from 'lucide-react'
import { StatCard } from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'
import api from '../services/api.js'

const statusColor = {
  Good: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Attention: 'bg-amber-50 text-amber-700 border border-amber-200',
  Critical: 'bg-red-50 text-red-600 border border-red-200',
}

const CROP_NAMES_TAMIL = {
  Sugarcane: "கரும்பு (Sugarcane)",
  Rice: "நெல் (Rice / Paddy)",
  Paddy: "நெல் (Paddy)",
  Cotton: "பருத்தி (Cotton)",
  Maize: "மக்காச்சோளம் (Maize)",
  Wheat: "கோதுமை (Wheat)",
  Banana: "வாழை (Banana)",
  Groundnut: "நிலக்கடலை (Groundnut)",
  Tomato: "தக்காளி (Tomato)",
  Turmeric: "மஞ்சள் (Turmeric)",
}

export default function AuthorityDashboard() {
  const { t, i18n } = useTranslation()
  const isTamil = i18n.language === 'ta'

  const [districtInput, setDistrictInput] = useState('')
  const [activeDistrict, setActiveDistrict] = useState('')
  const [overview, setOverview] = useState(null)
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async (dist = '') => {
    setLoading(true)
    try {
      const params = dist ? { district: dist } : {}
      const [overviewRes, farmersRes] = await Promise.all([
        api.get('/authority/overview', { params }),
        api.get('/authority/farmers', { params }),
      ])
      setOverview(overviewRes.data)
      setFarmers(farmersRes.data)
    } catch (err) {
      console.error('Failed to load authority dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(activeDistrict)
  }, [activeDistrict])

  const handleSearch = (e) => {
    e.preventDefault()
    setActiveDistrict(districtInput.trim())
  }

  const handleClearFilter = () => {
    setDistrictInput('')
    setActiveDistrict('')
  }

  const stats = [
    {
      icon: Users,
      label: t('authorityDashboard.registeredFarmers'),
      value: overview ? String(overview.registered_farmers_count) : '...',
      trend: activeDistrict ? (isTamil ? `${activeDistrict} மாவட்டத்தில்` : `In ${activeDistrict}`) : (isTamil ? 'மொத்த எண்ணிக்கை' : 'National total'),
      accent: 'primary',
    },
    {
      icon: Wheat,
      label: isTamil ? 'செயலில் உள்ள சாதனங்கள்' : 'Devices Active',
      value: overview ? String(overview.active_devices_count) : '...',
      trend: isTamil ? 'வன்பொருள் இணைக்கப்பட்டுள்ளது' : 'Hardware connected',
      accent: 'secondary',
    },
    {
      icon: AlertTriangle,
      label: t('authorityDashboard.anomalies'),
      value: overview ? String(overview.quality_alerts_count) : '...',
      trend: overview?.quality_alerts_count > 0 ? (isTamil ? 'கவனம் தேவை' : 'Requires attention') : (isTamil ? 'வழக்கமான வரம்பு' : 'Normal range'),
      accent: 'accent',
    },
    {
      icon: MapPin,
      label: isTamil ? 'கண்காணிக்கப்படும் பகுதிகள்' : 'Regions Covered',
      value: overview ? String(overview.districts_count) : '...',
      trend: isTamil ? 'உட்பட்ட மாவட்டங்கள்' : 'Districts represented',
      accent: 'primary',
    },
  ]

  const getStatusLabel = (status) => {
    if (!status) return ''
    if (isTamil) {
      if (status === 'Good') return 'நன்றாக உள்ளது'
      if (status === 'Attention') return 'கவனம் தேவை'
      if (status === 'Critical') return 'அவசர நிலை'
    }
    return status
  }

  return (
    <div className="container-page section-padding">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-accent-600 font-medium mb-1">
            {isTamil ? 'வேளாண் துறை அதிகாரி போர்ட்டல்' : 'Global Read-Only Authority Portal'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t('authorityDashboard.title')}
          </h1>
          {activeDistrict && (
            <p className="text-xs text-primary-600 font-semibold mt-1">
              {isTamil ? `செயலில் உள்ள மாவட்ட வடிகட்டி: "${activeDistrict}"` : `Active District Filter: "${activeDistrict}"`}
            </p>
          )}
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            placeholder={t('authorityDashboard.searchDistrictPlaceholder')}
            value={districtInput}
            onChange={(e) => setDistrictInput(e.target.value)}
            icon={Search}
            containerClassName="w-64"
          />
          <Button type="submit" size="sm" icon={Filter}>{t('authorityDashboard.filterBtn')}</Button>
          {activeDistrict && (
            <Button type="button" variant="ghost" size="sm" icon={RotateCcw} onClick={handleClearFilter}>
              {t('authorityDashboard.clearFilter')}
            </Button>
          )}
        </form>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">{isTamil ? 'கண்காணிக்கப்படும் மாவட்டங்கள்' : 'Districts Monitored'}</h3>
              <p className="text-xs text-slate-500">{isTamil ? 'நேரலை டெலிமெட்ரி கொண்ட மாவட்டங்கள்' : 'Live districts with active GOBARdhan telemetry'}</p>
            </div>
            <span className="badge bg-primary-50 text-primary-700 text-xs">
              {overview?.districts_covered?.length || 0} {isTamil ? 'பதிவுசெய்த மண்டலங்கள்' : 'Registered Zones'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {overview?.districts_covered?.map((d) => (
              <button
                key={d}
                onClick={() => { setDistrictInput(d); setActiveDistrict(d); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeDistrict.toLowerCase() === d.toLowerCase()
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📍 {d}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-2">{isTamil ? 'அதிகாரத்துவ வழிகாட்டுதல்' : 'Authority Specification'}</h3>
          <ul className="text-xs text-slate-600 space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✔</span>
              <span><strong>{isTamil ? 'முழுமையான பார்வை:' : 'Global Scope:'}</strong> {isTamil ? 'அனைத்து பிராந்தியங்களின் நேரலை தரவு மேற்பார்வை.' : 'Read-only admin with global visibility.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✔</span>
              <span><strong>{isTamil ? 'மாவட்ட வடிகட்டி:' : 'District Text Filter:'}</strong> {isTamil ? 'மாவட்ட வாரியாக உடனடியாக வடிகட்டும் வசதி.' : 'Instant filter by district name without RBAC complexity.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✔</span>
              <span><strong>{isTamil ? 'தரவு நம்பகத்தன்மை:' : 'Provenance Tracking:'}</strong> {isTamil ? 'ICAR தரவு சார்ந்த நம்பகமான பயிர் கணிப்புகள்.' : 'Transparent ICAR data provenance on all crop predictions.'}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="font-semibold text-slate-900">
            {isTamil ? `விவசாயிகள் கண்காணிப்பு டெலிமெட்ரி (${farmers.length} விவசாயிகள்)` : `Farmer Monitoring Telemetry (${farmers.length} Farmers)`}
          </h3>
          {activeDistrict && (
            <span className="text-xs text-slate-500">{isTamil ? `"${activeDistrict}" மூலம் வடிகட்டப்பட்டது` : `Filtered by "${activeDistrict}"`}</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-y border-slate-100 bg-slate-50/50">
                <th className="py-3 px-6 font-medium">{isTamil ? 'விவசாயி கணக்கு' : 'Farmer Account'}</th>
                <th className="py-3 px-6 font-medium">{t('authorityDashboard.colDistrict')}</th>
                <th className="py-3 px-6 font-medium">{t('authorityDashboard.colStatus')}</th>
                <th className="py-3 px-6 font-medium">{t('cropPrediction.recommendedCrop')}</th>
                <th className="py-3 px-6 font-medium">{isTamil ? 'சாதனங்கள்' : 'Devices'}</th>
                <th className="py-3 px-6 font-medium">{isTamil ? 'கடைசி டெலிமெட்ரி' : 'Last Telemetry'}</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="py-3.5 px-6 font-medium text-slate-800">{f.email}</td>
                  <td className="py-3.5 px-6 text-slate-600">📍 {f.district}</td>
                  <td className="py-3.5 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[f.status] || 'bg-slate-100 text-slate-600'}`}>
                      {getStatusLabel(f.status)}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-primary-700">
                    {isTamil && CROP_NAMES_TAMIL[f.predicted_crop] ? CROP_NAMES_TAMIL[f.predicted_crop] : f.predicted_crop}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">{f.device_count} {isTamil ? 'சாதனம்(கள்)' : 'Device(s)'}</td>
                  <td className="py-3.5 px-6 text-slate-400 text-xs">
                    {f.latest_reading_time ? new Date(f.latest_reading_time).toLocaleDateString() : (isTamil ? 'அளவீடுகள் இல்லை' : 'No readings')}
                  </td>
                </tr>
              ))}
              {farmers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                    {isTamil ? 'விவசாயிகள் எதுவும் காணப்படவில்லை.' : 'No farmers found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
