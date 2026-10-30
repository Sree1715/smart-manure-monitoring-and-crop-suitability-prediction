import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Bell, Lock, Wifi, Save, Camera, Globe } from 'lucide-react'
import Input from '../components/Input.jsx'
import Button from '../components/Button.jsx'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const isTamil = i18n.language === 'ta'
  const [tab, setTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  const tabs = [
    { id: 'profile', label: t('settings.tabProfile'), icon: User },
    { id: 'notifications', label: t('settings.tabNotifications'), icon: Bell },
    { id: 'security', label: t('settings.tabSecurity'), icon: Lock },
    { id: 'devices', label: t('settings.tabDevices'), icon: Wifi },
  ]

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="container-page section-padding">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('settings.title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-3 h-fit">
          {tabs.map((tItem) => (
            <button
              key={tItem.id}
              onClick={() => setTab(tItem.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
                tab === tItem.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tItem.icon className="w-4.5 h-4.5" />
              {tItem.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-card border border-slate-100 p-6 sm:p-8">
          {saved && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">
              {isTamil ? 'அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன!' : 'Settings saved successfully!'}
            </div>
          )}

          {tab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white text-2xl font-bold">
                    RK
                  </div>
                  <button type="button" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary-600">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Ramesh Kumar</p>
                  <p className="text-sm text-slate-500">{isTamil ? 'விவசாயி · கரூர், தமிழ்நாடு' : 'Farmer · Karur, Tamil Nadu'}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label={t('settings.fullName')} defaultValue="Ramesh Kumar" />
                <Input label={t('settings.phone')} defaultValue="+91 98765 43210" />
                <Input label={t('settings.email')} type="email" defaultValue="ramesh.kumar@example.com" />
                <Input label={t('settings.farmLocation')} defaultValue={isTamil ? "கரூர், தமிழ்நாடு" : "Karur, Tamil Nadu"} />
              </div>

              {/* Language selection field */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-primary-600" />
                    {t('settings.preferredLanguage')}
                  </span>
                </label>
                <div className="flex gap-3 max-w-sm">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'ta', label: 'தமிழ் (Tamil)' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => i18n.changeLanguage(l.code)}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border text-center transition-all ${
                        i18n.language === l.code
                          ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" icon={Save}>{t('settings.saveChanges')}</Button>
              </div>
            </form>
          )}

          {tab === 'notifications' && (
            <div className="space-y-5">
              {[
                {
                  label: isTamil ? 'உர தரம் எச்சரிக்கைகள்' : 'Manure quality alerts',
                  desc: isTamil ? 'அளவீடுகள் பாதுகாப்பான வரம்பை மீறும்போது அறிவிக்கப்படும்' : 'Get notified when readings fall outside safe range',
                },
                {
                  label: isTamil ? 'வாராந்திர சுருக்க மின்னஞ்சல்' : 'Weekly summary email',
                  desc: isTamil ? 'உங்கள் அளவீடுகள் மற்றும் பயிர் கணிப்புகளின் வாராந்திர தொகுப்பைப் பெறுங்கள்' : 'Receive a weekly digest of your readings and predictions',
                },
                {
                  label: isTamil ? 'பயிர் கணிப்பு அறிவிப்புகள்' : 'Crop prediction updates',
                  desc: isTamil ? 'புதிய பயிர் பொருத்தம் தயாராகும்போது அறிவிக்கவும்' : 'Notify me when a new crop suitability result is ready',
                },
                {
                  label: isTamil ? 'சாதன இணைப்பு எச்சரிக்கைகள்' : 'Device connectivity alerts',
                  desc: isTamil ? 'சென்சார் ஆஃப்லைனில் சென்றால் எனக்கு அறிவிக்கவும்' : 'Notify me if a sensor goes offline',
                },
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
              <Input label={isTamil ? "தற்போதைய கடவுச்சொல்" : "Current Password"} type="password" placeholder="••••••••" />
              <Input label={isTamil ? "புதிய கடவுச்சொல்" : "New Password"} type="password" placeholder="••••••••" />
              <Input label={isTamil ? "புதிய கடவுச்சொல்லை உறுதிப்படுத்தவும்" : "Confirm New Password"} type="password" placeholder="••••••••" />
              <div className="flex justify-end pt-2">
                <Button icon={Save}>{isTamil ? "கடவுச்சொல்லைப் புதுப்பிக்கவும்" : "Update Password"}</Button>
              </div>
            </div>
          )}

          {tab === 'devices' && (
            <div className="space-y-4">
              {[
                { name: 'ESP32 Liquid Sensor #01', status: isTamil ? 'இணைப்பில் உள்ளது' : 'Online', isOnline: true, lastSeen: isTamil ? 'சற்று முன்' : 'Just now' },
                { name: 'ESP32 Solid Sensor #02', status: isTamil ? 'இணைப்பில் உள்ளது' : 'Online', isOnline: true, lastSeen: isTamil ? '3 நிமிடங்களுக்கு முன்' : '3 min ago' },
                { name: 'ESP32 Liquid Sensor #03', status: isTamil ? 'இணைப்பு இல்லை' : 'Offline', isOnline: false, lastSeen: isTamil ? '2 நாட்களுக்கு முன்' : '2 days ago' },
              ].map((d) => (
                <div key={d.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${d.isOnline ? 'bg-secondary-500' : 'bg-slate-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{d.name}</p>
                      <p className="text-xs text-slate-400">{isTamil ? 'கடைசியாக பார்த்தது:' : 'Last seen:'} {d.lastSeen}</p>
                    </div>
                  </div>
                  <span className={`badge ${d.isOnline ? 'bg-secondary-50 text-secondary-700' : 'bg-slate-100 text-slate-500'}`}>
                    {d.status}
                  </span>
                </div>
              ))}
              <Button variant="outline" size="sm">{isTamil ? "புதிய சாதனத்தைச் சேர்க்கவும்" : "Add New Device"}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
