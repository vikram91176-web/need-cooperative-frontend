/**
 * LanguageContext.jsx — React context provider for multilingual support.
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { TRANSLATIONS } from '../utils/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('need_lang') || 'en'
  })

  function setLanguage(newLang) {
    if (TRANSLATIONS[newLang]) {
      setLangState(newLang)
      localStorage.setItem('need_lang', newLang)
    }
  }

  function t(key, fallback = '') {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en
    return dict[key] || TRANSLATIONS.en[key] || fallback || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
