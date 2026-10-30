import React, { useState, useEffect } from 'react'
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

export default function AuthorityDashboard() {
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
      label: 'Registered Farmers',
      value: overview ? String(overview.registered_farmers_count) : '...',
      trend: activeDistrict ? `In ${activeDistrict}` : 'National total',
      accent: 'primary',
    },
    {
      icon: Wheat,
      label: 'Devices Active',
      value: overview ? String(overview.active_devices_count) : '...',
      trend: 'Hardware connected',
      accent: 'secondary',
    },
    {
      icon: AlertTriangle,
      label: 'Quality Alerts',
      value: overview ? String(overview.quality_alerts_count) : '...',
      trend: overview?.quality_alerts_count > 0 ? 'Requires attention' : 'Normal range',
      accent: 'accent',
    },
    {
      icon: MapPin,
      label: 'Regions Covered',
      value: overview ? String(overview.districts_count) : '...',
      trend: 'Districts represented',
      accent: 'primary',
    },
  ]

  return (
    <div className="container-page section-padding">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-accent-600 font-medium mb-1">Global Read-Only Authority Portal</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Regional Manure & Crop Monitoring
          </h1>
          {activeDistrict && (
            <p className="text-xs text-primary-600 font-semibold mt-1">
              Active District Filter: &ldquo;{activeDistrict}&rdquo;
            </p>
          )}
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            placeholder="Filter district (e.g. Pune)..."
            value={districtInput}
            onChange={(e) => setDistrictInput(e.target.value)}
            icon={Search}
            containerClassName="w-64"
          />
          <Button type="submit" size="sm" icon={Filter}>Filter</Button>
          {activeDistrict && (
            <Button type="button" variant="ghost" size="sm" icon={RotateCcw} onClick={handleClearFilter}>
              Clear
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
              <h3 className="font-semibold text-slate-900">Districts Monitored</h3>
              <p className="text-xs text-slate-500">Live districts with active GOBARdhan telemetry</p>
            </div>
            <span className="badge bg-primary-50 text-primary-700 text-xs">
              {overview?.districts_covered?.length || 0} Registered Zones
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
          <h3 className="font-semibold text-slate-900 mb-2">Authority Specification</h3>
          <ul className="text-xs text-slate-600 space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✔</span>
              <span><strong>Global Scope:</strong> Read-only admin with global visibility.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✔</span>
              <span><strong>District Text Filter:</strong> Instant filter by district name without RBAC complexity.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✔</span>
              <span><strong>Provenance Tracking:</strong> Transparent ICAR data provenance on all crop predictions.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="font-semibold text-slate-900">
            Farmer Monitoring Telemetry ({farmers.length} Farmers)
          </h3>
          {activeDistrict && (
            <span className="text-xs text-slate-500">Filtered by &quot;{activeDistrict}&quot;</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-y border-slate-100 bg-slate-50/50">
                <th className="py-3 px-6 font-medium">Farmer Account</th>
                <th className="py-3 px-6 font-medium">District</th>
                <th className="py-3 px-6 font-medium">Status</th>
                <th className="py-3 px-6 font-medium">Predicted Crop</th>
                <th className="py-3 px-6 font-medium">Devices</th>
                <th className="py-3 px-6 font-medium">Last Telemetry</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="py-3.5 px-6 font-medium text-slate-800">{f.email}</td>
                  <td className="py-3.5 px-6 text-slate-600">📍 {f.district}</td>
                  <td className="py-3.5 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[f.status] || 'bg-slate-100 text-slate-600'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-primary-700">{f.predicted_crop}</td>
                  <td className="py-3.5 px-6 text-slate-600">{f.device_count} Device(s)</td>
                  <td className="py-3.5 px-6 text-slate-400 text-xs">
                    {f.latest_reading_time ? new Date(f.latest_reading_time).toLocaleDateString() : 'No readings'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
