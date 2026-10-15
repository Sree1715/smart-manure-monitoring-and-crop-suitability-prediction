import React from 'react'
import { useTranslation } from 'react-i18next'
import { Sprout, ArrowLeft } from 'lucide-react'
import Button from '../components/Button.jsx'

export default function NotFound() {
  const { t, i18n } = useTranslation()
  const isTamil = i18n.language === 'ta'

  return (
    <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center px-4">
      <span className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
        <Sprout className="w-8 h-8 text-primary-600" />
      </span>
      <p className="text-6xl font-bold text-slate-900 mb-2">404</p>
      <h1 className="text-xl font-semibold text-slate-800 mb-2">
        {isTamil ? 'பக்கம் காணப்படவில்லை' : 'Page not found'}
      </h1>
      <p className="text-slate-500 max-w-sm mb-7">
        {isTamil
          ? 'நீங்கள் தேடும் பக்கம் இல்லை அல்லது அகற்றப்பட்டுவிட்டது.'
          : "The page you're looking for doesn't exist or has been moved."}
      </p>
      <Button to="/" icon={ArrowLeft}>
        {isTamil ? 'முகப்புக்குச் செல்க' : 'Back to Home'}
      </Button>
    </div>
  )
}
