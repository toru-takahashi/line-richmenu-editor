import React, { useRef, useState } from 'react'
import { RichMenu } from '../types'
import { useI18n } from '../i18n/useI18n'

type Props = {
  menu: RichMenu
  setMenu: (m: RichMenu) => void
}

export default function JSONPanel({ menu, setMenu }: Props) {
  const { t } = useI18n()
  const [showImport, setShowImport] = useState(false)
  const importRef = useRef<HTMLTextAreaElement | null>(null)

  const richMenuForAPI = {
    size: menu.size,
    selected: menu.selected,
    name: menu.name,
    chatBarText: menu.chatBarText,
    areas: menu.areas.map((a) => ({ bounds: a.bounds, action: a.action }))
  }

  function validateAction(a: any) {
    const errs: string[] = []
    if (!a || typeof a !== 'object' || !a.type) {
      errs.push(t('invalidAction'))
      return errs
    }
    const actionType = a.type
    if (actionType === 'uri') {
      if (!a.uri || typeof a.uri !== 'string') errs.push(t('uriRequired'))
    } else if (actionType === 'message') {
      if (typeof a.text !== 'string') errs.push(t('textRequired'))
    } else if (actionType === 'postback') {
      if (typeof a.data !== 'string') errs.push(t('postbackDataRequired'))
      if (a.display && !['none', 'close', 'open', 'keyboard', 'voice'].includes(a.display)) errs.push(t('postbackDisplayInvalid'))
    } else if (actionType === 'datetimepicker') {
      if (typeof a.data !== 'string') errs.push(t('datetimeDataRequired'))
      if (!['date', 'time', 'datetime'].includes(a.mode)) errs.push(t('datetimeModeInvalid'))
    } else if (actionType === 'richmenuswitch') {
      if (!a.richMenuId || typeof a.richMenuId !== 'string') errs.push(t('richMenuIdRequired'))
    } else {
      errs.push(t('unsupportedActionType', { type: actionType }))
    }
    return errs
  }

  function validateMenuForAPI(m: typeof richMenuForAPI) {
    const errors: string[] = []
    if (!m || typeof m !== 'object') return [t('invalidMenuObject')]
    if (!m.size || typeof m.size.width !== 'number' || typeof m.size.height !== 'number') errors.push(t('invalidSize'))
    if (!Array.isArray(m.areas)) errors.push(t('areasNotArray'))
    if (Array.isArray(m.areas)) {
      if (m.areas.length > 20) errors.push(t('areasMaxCount'))
      m.areas.forEach((a: any, idx: number) => {
        if (!a.bounds) {
          errors.push(t('areaBoundsRequired', { index: (idx + 1).toString() }))
          return
        }
        const b = a.bounds
        if (typeof b.x !== 'number' || typeof b.y !== 'number' || typeof b.width !== 'number' || typeof b.height !== 'number') {
          errors.push(t('areaBoundsInvalid', { index: (idx + 1).toString() }))
        } else {
          if (b.x < 0 || b.y < 0) errors.push(t('areaBoundsNegative', { index: (idx + 1).toString() }))
          if (b.width < 1 || b.height < 1) errors.push(t('areaBoundsSize', { index: (idx + 1).toString() }))
          if (m.size && (b.x + b.width > m.size.width || b.y + b.height > m.size.height)) errors.push(t('areaBoundsExceedsMenu', { index: (idx + 1).toString() }))
        }
        const aerrs = validateAction(a.action)
        aerrs.forEach(x => errors.push(t('areaActionError', { index: (idx + 1).toString(), error: x })))
      })
    }
    return errors
  }

  async function copyJson() {
    const errs = validateMenuForAPI(richMenuForAPI)
    if (errs.length) {
      const errorsText = errs.slice(0,8).join('\n') + (errs.length > 8 ? `\n${t('andMore')}` : '')
      const ok = window.confirm(t('validationErrors', { errors: errorsText }))
      if (!ok) return
    }
    await navigator.clipboard.writeText(JSON.stringify(richMenuForAPI, null, 2))
    alert(t('copiedToClipboard'))
  }

  function downloadJson() {
    const errs = validateMenuForAPI(richMenuForAPI)
    if (errs.length) {
      const errorsText = errs.slice(0,8).join('\n') + (errs.length > 8 ? `\n${t('andMore')}` : '')
      const ok = window.confirm(t('validationErrors', { errors: errorsText }))
      if (!ok) return
    }
    const blob = new Blob([JSON.stringify(richMenuForAPI, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (menu.name || 'richmenu') + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importFromText() {
    const txt = importRef.current?.value
    if (!txt) return
    try {
      const parsed = JSON.parse(txt)
      // try to map basic fields
      const newMenu: RichMenu = {
        size: parsed.size || { width: 2500, height: 1686 },
        selected: parsed.selected || false,
        name: parsed.name || '',
        chatBarText: parsed.chatBarText || '',
        areas: Array.isArray(parsed.areas) ? parsed.areas.map((a: any) => ({ bounds: a.bounds, action: a.action })) : [],
        imageUrl: parsed.imageUrl || undefined
      }
      const errs = validateMenuForAPI({ size: newMenu.size, selected: newMenu.selected, name: newMenu.name, chatBarText: newMenu.chatBarText, areas: newMenu.areas })
      if (errs.length) {
        const errorsText = errs.slice(0,8).join('\n') + (errs.length > 8 ? `\n${t('andMore')}` : '')
        const ok = window.confirm(t('validationErrorsImport', { errors: errorsText }))
        if (!ok) return
      }
      setMenu(newMenu)
      setShowImport(false)
    } catch (err) {
      alert(t('invalidJson'))
    }
  }

  return (
    <div>
      <h3>{t('jsonTitle')}</h3>
      <div className="field">
        <label>{t('jsonPreviewLabel')}</label>
        <textarea style={{height:200}} readOnly value={JSON.stringify(richMenuForAPI, null, 2)} />
      </div>
      <div style={{display:'flex',gap:8}}>
        <button className="btn" onClick={copyJson}>{t('copyJson')}</button>
        <button className="btn" onClick={downloadJson}>{t('downloadJson')}</button>
        <button className="btn secondary" onClick={() => setShowImport(s => !s)}>{showImport ? t('close') : t('import')}</button>
      </div>

      {showImport && (
        <div style={{marginTop:8}}>
          <label>{t('importJson')}</label>
          <textarea ref={importRef} style={{width:'100%',height:120}} />
          <div style={{marginTop:6}}>
            <button className="btn" onClick={importFromText}>{t('load')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
