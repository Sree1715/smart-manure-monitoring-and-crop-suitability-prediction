import React, { useState } from 'react'
import { User, Bell, Lock, Wifi, Save, Camera } from 'lucide-react'
import Input from '../components/Input.jsx'
import Button from '../components/Button.jsx'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'devices', label: 'IoT Devices', icon: Wifi },
]

export default function Settings() {
  const [tab, setTab] = useState('profile')

  return (
    <div className="container-page section-padding">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile, notifications, and connected devices</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-3 h-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
                tab === t.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <t.icon className="w-4.5 h-4.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-card border border-slate-100 p-6 sm:p-8">
          {tab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white text-2xl font-bold">
                    RK
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary-600">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Ramesh Kumar</p>
                  <p className="text-sm text-slate-500">Farmer &middot; Ludhiana, Punjab</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full Name" defaultValue="Ramesh Kumar" />
                <Input label="Phone Number" defaultValue="+91 98765 43210" />
                <Input label="Email Address" type="email" defaultValue="ramesh.kumar@example.com" />
                <Input label="Farm Location" defaultValue="Ludhiana, Punjab" />
              </div>
              <div className="flex justify-end pt-2">
                <Button icon={Save}>Save Changes</Button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-5">
              {[
                { label: 'Manure quality alerts', desc: 'Get notified when readings fall outside safe range' },
                { label: 'Weekly summary email', desc: 'Receive a weekly digest of your readings and predictions' },
                { label: 'Crop prediction updates', desc: 'Notify me when a new crop suitability result is ready' },
                { label: 'Device connectivity alerts', desc: 'Notify me if a sensor goes offline' },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{n.label}</p>
                    <p className="text-xs text-slate-500">{n.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-primary-600 transition-colors" />
                    <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-4 max-w-md">
              <Input label="Current Password" type="password" placeholder="Enter current password" />
              <Input label="New Password" type="password" placeholder="Enter new password" />
              <Input label="Confirm New Password" type="password" placeholder="Re-enter new password" />
              <div className="flex justify-end pt-2">
                <Button icon={Save}>Update Password</Button>
              </div>
            </div>
          )}

          {tab === 'devices' && (
            <div className="space-y-4">
              {[
                { name: 'ESP32 Liquid Sensor #01', status: 'Online', lastSeen: 'Just now' },
                { name: 'ESP32 Solid Sensor #02', status: 'Online', lastSeen: '3 min ago' },
                { name: 'ESP32 Liquid Sensor #03', status: 'Offline', lastSeen: '2 days ago' },
              ].map((d) => (
                <div key={d.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${d.status === 'Online' ? 'bg-secondary-500' : 'bg-slate-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{d.name}</p>
                      <p className="text-xs text-slate-400">Last seen: {d.lastSeen}</p>
                    </div>
                  </div>
                  <span className={`badge ${d.status === 'Online' ? 'bg-secondary-50 text-secondary-700' : 'bg-slate-100 text-slate-500'}`}>
                    {d.status}
                  </span>
                </div>
              ))}
              <Button variant="outline" size="sm">Add New Device</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
