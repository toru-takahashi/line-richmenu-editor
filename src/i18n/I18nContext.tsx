import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { Language, translations } from './translations'

type I18nContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nContextType>({
  language: 'ja',
  setLanguage: () => {},
  t: (key: string) => key,
})

type I18nProviderProps = {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  // デフォルトは日本語、localStorageから読み込む
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language')
    return (saved === 'en' || saved === 'ja') ? saved : 'ja'
  })

  // 言語変更時にlocalStorageに保存
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('app_language', lang)
  }

  // 翻訳関数
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = translations[language]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // キーが見つからない場合はキー自体を返す
        return key
      }
    }

    if (typeof value !== 'string') {
      return key
    }

    // パラメータの置換
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() || `{${paramKey}}`
      })
    }

    return value
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}
