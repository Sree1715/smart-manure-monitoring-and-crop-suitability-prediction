import React, { useState } from 'react'
import { BrainCircuit, Droplets, Wheat, Sparkles, RotateCcw, CheckCircle, ShieldCheck, Database } from 'lucide-react'
import Input from '../components/Input.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import api from '../services/api.js'

// Field definitions with realistic agronomic min/max bounds
const LIQUID_FIELDS = [
  { name: 'liquidPh',         label: 'Liquid Manure pH',     placeholder: 'e.g. 6.8',  min: 4.5,  max: 8.8,  step: '0.01', hint: '4.5 – 8.8' },
  { name: 'liquidNitrogen',   label: 'Nitrogen (%)',          placeholder: 'e.g. 1.4',  min: 0.05, max: 5.5,  step: '0.01', hint: '0.05 – 5.5%' },
  { name: 'liquidPhosphorus', label: 'Phosphorus (%)',        placeholder: 'e.g. 0.6',  min: 0.05, max: 2.5,  step: '0.01', hint: '0.05 – 2.5%' },
  { name: 'liquidPotassium',  label: 'Potassium (%)',         placeholder: 'e.g. 1.1',  min: 0.05, max: 2.5,  step: '0.01', hint: '0.05 – 2.5%' },
]

const SOLID_FIELDS = [
  { name: 'solidMoisture',    label: 'Moisture (%)',                        placeholder: 'e.g. 58',   min: 15,  max: 90,  step: '0.1', hint: '15 – 90%' },
  { name: 'solidTemperature', label: 'Temperature (°C)',                   placeholder: 'e.g. 26',   min: 8,   max: 42,  step: '0.1', hint: '8 – 42°C' },
  { name: 'solidCarbon',      label: 'Organic Carbon (%) [Lab/Manual]',    placeholder: 'e.g. 14.5', min: 2,   max: 40,  step: '0.1', hint: '2 – 40%' },
]

export default function CropPrediction() {
  const [form, setForm] = useState({
    liquidPh: '6.8',
    liquidNitrogen: '1.4',
    liquidPhosphorus: '0.7',
    liquidPotassium: '1.2',
    solidMoisture: '58',
    solidTemperature: '26',
    solidCarbon: '14.5'
  })
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [error, setError] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        manure_type: 'liquid',
        ph: parseFloat(form.liquidPh) || 6.8,
        nitrogen_pct: parseFloat(form.liquidNitrogen) || 1.4,
        phosphorus_pct: parseFloat(form.liquidPhosphorus) || 0.7,
        potassium_pct: parseFloat(form.liquidPotassium) || 1.2,
        moisture_pct: parseFloat(form.solidMoisture) || 58.0,
        temperature_c: parseFloat(form.solidTemperature) || 26.0,
        organic_carbon_pct: parseFloat(form.solidCarbon) || 14.5
      }

      const res = await api.post('/predict', payload)
      setPrediction(res.data)
    } catch (err) {
      console.error('Prediction error:', err)
      setError(err.response?.data?.detail || 'Failed to generate crop prediction.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm({
      liquidPh: '',
      liquidNitrogen: '',
      liquidPhosphorus: '',
      liquidPotassium: '',
      solidMoisture: '',
      solidTemperature: '',
      solidCarbon: ''
    })
    setPrediction(null)
    setError(null)
  }

  return (
    <div className="container-page section-padding">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="badge bg-primary-50 text-primary-700 mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
          <BrainCircuit className="w-3.5 h-3.5" /> AI Crop Suitability
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-900">Crop Prediction</h1>
        <p className="text-slate-600">
          Enter live manure sensor readings and lab organic carbon below. Our lightweight Random Forest
          model evaluates nutrient density and recommends the most suitable crop with provenance data.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                <Droplets className="w-4.5 h-4.5 text-primary-600" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Liquid Manure Readings</h3>
                <p className="text-xs text-slate-400">pH probe (ADC1) & RS485 NPK sensor</p>
              </div>
            </div>
          <div className="grid sm:grid-cols-2 gap-4">
              {LIQUID_FIELDS.map((f) => (
                <div key={f.name}>
                  <Input
                    label={f.label}
                    name={f.name}
                    type="number"
                    step={f.step}
                    min={f.min}
                    max={f.max}
                    placeholder={f.placeholder}
                    value={form[f.name] || ''}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5 pl-1">Valid range: {f.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-9 h-9 rounded-lg bg-secondary-50 flex items-center justify-center">
                <Wheat className="w-4.5 h-4.5 text-secondary-600" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Solid Manure & Lab Measurements</h3>
                <p className="text-xs text-slate-400">Capacitive moisture (ADC1), DS18B20 temp, & lab organic carbon %</p>
              </div>
            </div>
          <div className="grid sm:grid-cols-2 gap-4">
              {SOLID_FIELDS.map((f) => (
                <div key={f.name}>
                  <Input
                    label={f.label}
                    name={f.name}
                    type="number"
                    step={f.step}
                    min={f.min}
                    max={f.max}
                    placeholder={f.placeholder}
                    value={form[f.name] || ''}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5 pl-1">Valid range: {f.hint}</p>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" size="lg" icon={Sparkles} disabled={loading}>
              {loading ? 'Evaluating Model...' : 'Predict Suitable Crop'}
            </Button>
            <Button type="button" variant="ghost" size="lg" icon={RotateCcw} onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>

        <div className="lg:sticky lg:top-24 h-fit">
          <Card hoverEffect={false} className="text-center p-6">
            {!prediction ? (
              <div className="py-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <BrainCircuit className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">Ready for Analysis</p>
                <p className="text-xs text-slate-500">
                  Fill in the readings and submit to see live Random Forest prediction with data provenance.
                </p>
              </div>
            ) : (
              <div className="py-2 text-left animate-fade-in space-y-4">

                {/* Out-of-range banner */}
                {prediction.out_of_range_params?.length > 0 && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">
                    <p className="font-semibold mb-1">⚠️ Input Values Out of Range</p>
                    <p className="mb-1.5 text-red-700">The following values are outside realistic manure ranges:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-red-700">
                      {prediction.out_of_range_params.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                    <p className="mt-2 text-[10px] text-red-600 font-medium">
                      Use realistic values: N 0.05–5.5%, P 0.05–2.5%, K 0.05–2.5%, pH 4.5–8.8, Temp 8–42°C, Moisture 15–90%, OC 2–40%
                    </p>
                  </div>
                )}

                <div className="text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md ${prediction.confidence === 0 ? 'bg-red-100' : 'bg-gradient-to-br from-primary-600 to-secondary-600'}`}>
                    <Sparkles className={`w-7 h-7 ${prediction.confidence === 0 ? 'text-red-400' : 'text-white'}`} />
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Optimal Recommended Crop</p>
                  <p className={`text-2xl font-extrabold mb-1 ${prediction.confidence === 0 ? 'text-red-500' : 'text-slate-900'}`}>{prediction.recommended_crop}</p>
                  {prediction.confidence > 0 && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      Confidence: {prediction.confidence}%
                    </span>
                  )}
                </div>

                {prediction.agronomic_rationale && (
                  <div className={`border rounded-xl p-3 text-xs leading-relaxed ${prediction.confidence === 0 ? 'bg-red-50 border-red-100 text-red-900' : 'bg-primary-50/60 border-primary-100 text-primary-900'}`}>
                    <p className={`font-semibold mb-1 ${prediction.confidence === 0 ? 'text-red-700' : 'text-primary-700'}`}>
                      {prediction.confidence === 0 ? '⚠️ Cannot Predict' : `Why ${prediction.recommended_crop}?`}
                    </p>
                    <p>{prediction.agronomic_rationale}</p>
                  </div>
                )}

                {prediction.nutrient_fit && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nutrient Fit — {prediction.recommended_crop}</p>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Nitrogen (N)', key: 'nitrogen_fit' },
                        { label: 'Phosphorus (P)', key: 'phosphorus_fit' },
                        { label: 'Potassium (K)', key: 'potassium_fit' },
                        { label: 'Soil pH', key: 'ph_fit' },
                        { label: 'Temperature', key: 'temperature_fit' },
                      ].map(({ label, key }) => {
                        const val = prediction.nutrient_fit[key] ?? 0
                        const barColor = val >= 80 ? 'bg-emerald-500' : val >= 50 ? 'bg-amber-400' : 'bg-red-400'
                        const textColor = val >= 80 ? 'text-emerald-700' : val >= 50 ? 'text-amber-600' : 'text-red-600'
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="text-slate-600">{label}</span>
                              <span className={`font-semibold ${textColor}`}>{val}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(val, 100)}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Alternative Matches</p>
                  <div className="space-y-1.5">
                    {prediction.alternatives?.map((alt, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg">
                        <span className="font-medium text-slate-700">{alt.crop}</span>
                        <span className="text-slate-500">{alt.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Computed NPK Index</span>
                    <span className="font-bold text-slate-900">{prediction.npk_index} / 10.0</span>
                  </div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Data Provenance: {prediction.data_provenance}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-tight">
                    {prediction.provenance_detail}
                  </p>
                  <p className="text-slate-500 text-[10px] pt-1 border-t border-emerald-100 font-mono">
                    Method: {prediction.method}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
