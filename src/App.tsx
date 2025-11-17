import React, { useEffect, useState } from 'react'
import ImageSettings from './components/ImageSettings'
import CanvasEditor from './components/CanvasEditor'
import AreasPanel from './components/AreasPanel'
import TemplatesPanel from './components/TemplatesPanel'
import JSONPanel from './components/JSONPanel'
import LineApiPanel from './components/LineApiPanel'
import PrivacyModal from './components/PrivacyModal'
import { Area, RichMenu } from './types'
import { useI18n } from './i18n/useI18n'

export default function App() {
  const { t, language, setLanguage } = useI18n()

  const [menu, setMenu] = useState<RichMenu>({
    size: { width: 2500, height: 1686 },
    selected: false,
    name: 'My Rich Menu',
    chatBarText: 'Tap here',
    areas: [],
    imageUrl: ''
  })

  const [areas, setAreas] = useState<Area[]>([])
  // compatibility wrapper: allow callers to pass either an array or a functional updater
  const setAreasCompat = (v: Area[] | ((prev: Area[]) => Area[])) => {
    // log calls so we can trace unexpected updates
    // setAreasCompat called

    if (typeof v === 'function') {
      // functional updater: compute new array from previous, but avoid no-op updates
      setAreas((prev) => {
        const computed = (v as (prev: Area[]) => Area[])(prev)
        // dedupe by id (keep last occurrence)
        const byId = new Map<string, Area>()
        for (const a of computed) byId.set(a.id, a)
        const deduped = Array.from(byId.values())
  // computed deduped lengths
        // quick equality check: same length and same ids & bounds -> no change
        if (deduped.length === prev.length && deduped.every((d, i) => {
          const p = prev[i]
          // compare id, bounds and action (stringified) to detect real changes
          const sameAction = JSON.stringify(p.action) === JSON.stringify(d.action)
          return p && p.id === d.id && p.bounds.x === d.bounds.x && p.bounds.y === d.bounds.y && p.bounds.width === d.bounds.width && p.bounds.height === d.bounds.height && sameAction
        })) {
          // functional no-op, skipping setAreas
          return prev
        }
        return deduped
      })
    } else {
      // array given: dedupe and also ignore exact duplicates already present
      const incoming = v as Area[]
      // dedupe by id (keep last occurrence in incoming)
      const byId = new Map<string, Area>()
      for (const a of incoming) byId.set(a.id, a)
      const dedupedIncoming = Array.from(byId.values())

      // Merge incoming into existing by replacing items with the same id,
      // and appending truly new areas. This ensures updates (same id,
      // changed bounds) are applied instead of ignored.
      const existing = areas
      // map existing by id to preserve order; we'll replace entries when incoming provides same id
      const existingById = new Map<string, Area>()
      for (const e of existing) existingById.set(e.id, e)

      // apply incoming replacements (or additions recorded in dedupedIncoming)
      for (const a of dedupedIncoming) {
        existingById.set(a.id, a)
      }

      // build merged array: keep original order for existing items (replaced as needed)
      const merged: Area[] = existing.map(e => existingById.get(e.id) || e)

      // append any incoming areas that were not present in existing
      for (const a of dedupedIncoming) {
        if (!existing.find(e => e.id === a.id)) merged.push(a)
      }

      // quick equality check: same length and same ids, bounds and actions -> no change
      const same = merged.length === existing.length && merged.every((m, i) => {
        const e = existing[i]
        const sameAction = JSON.stringify(e.action) === JSON.stringify(m.action)
        return e && e.id === m.id && e.bounds.x === m.bounds.x && e.bounds.y === m.bounds.y && e.bounds.width === m.bounds.width && e.bounds.height === m.bounds.height && sameAction
      })
      if (!same) {
        setAreas(merged)
      }
    }
  }
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showJson, setShowJson] = useState<boolean>(false)
  const [showLineApi, setShowLineApi] = useState<boolean>(false)
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false)
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const prevImageUrlRef = React.useRef<string | null>(null)
  // creation is canvas-only
  const [createMode] = useState<'draw' | 'manual'>('draw')

  // load saved session from localStorage (menu + areas)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('richmenu_editor_v1')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed.menu) setMenu(parsed.menu)
      if (Array.isArray(parsed.areas)) setAreas(parsed.areas)
      if (parsed.imageNaturalSize) setImageNaturalSize(parsed.imageNaturalSize)
    } catch (err) {
      // ignore
    }
  }, [])

  // persist to localStorage when menu or areas change
  React.useEffect(() => {
    const toSave = { menu: { ...menu, areas: undefined }, areas, imageNaturalSize }
    try { localStorage.setItem('richmenu_editor_v1', JSON.stringify(toSave)) } catch (e) { /* ignore */ }
  }, [menu.name, menu.chatBarText, menu.selected, menu.imageUrl, areas, imageNaturalSize])

  // When an image is uploaded (imageUrl goes from empty -> non-empty), remove any placeholder-like areas
  React.useEffect(() => {
    const prev = prevImageUrlRef.current
    if (!prev && menu.imageUrl) {
  // imageUrl changed from empty -> set; checking for placeholder-like areas
      // heuristics: remove areas that span almost full width but have small height (likely a placeholder banner)
      const w = menu.size.width
      const h = menu.size.height
      const cleaned = areas.filter(a => {
        const wr = a.bounds.width / Math.max(1, w)
        const hr = a.bounds.height / Math.max(1, h)
        // if width >= 80% and height <= 25% treat as placeholder -> remove
        if (wr >= 0.8 && hr <= 0.25) return false
        return true
      })
      if (cleaned.length !== areas.length) {
  // removed placeholder-like areas
        setAreas(cleaned)
      }
    }
    prevImageUrlRef.current = menu.imageUrl ?? null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu.imageUrl])

  // keep menu.areas synced with areas state
  React.useEffect(() => {
    setMenu((m) => ({ ...m, areas: areas.map(a => ({ bounds: a.bounds, action: a.action })), imageUrl: m.imageUrl }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas])

  // Load a rich menu from LINE API into the editor
  const handleLoadRichMenu = (richMenu: RichMenu, imageDataUrl?: string) => {
    // Update menu settings
    setMenu({
      size: richMenu.size,
      selected: richMenu.selected,
      name: richMenu.name,
      chatBarText: richMenu.chatBarText,
      areas: richMenu.areas,
      imageUrl: imageDataUrl || richMenu.imageUrl || ''
    })

    // Update areas with unique IDs
    const newAreas = richMenu.areas.map((area, index) => ({
      id: `area-${Date.now()}-${index}`,
      bounds: area.bounds,
      action: area.action
    }))
    setAreas(newAreas)

    // Reset selection
    setSelectedId(null)

    // If image is provided, detect its natural size
    if (imageDataUrl) {
      const img = new Image()
      img.onload = () => {
        setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.src = imageDataUrl
    }
  }

  return (
    <>
      <div className="topbar">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div className="brandTitle">{t('appTitle')}</div>
        </div>
        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:8}}>
          <div style={{ fontSize:13, opacity:0.95 }}>{t('appSubtitle')}</div>
          {/* 言語セレクター */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'ja' | 'en')}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
          <button className="btn secondary" onClick={() => setShowJson(s => !s)} style={{padding:'6px 10px'}}>{t('jsonPreview')}</button>
          <button className="btn" onClick={() => setShowLineApi(s => !s)} style={{padding:'6px 10px'}}>{t('lineApiIntegration')}</button>
        </div>
      </div>

      <div className="layout">
          <div className="left">
          <ImageSettings menu={menu} setMenu={(m) => setMenu(m)} imageNaturalSize={imageNaturalSize} setImageNaturalSize={setImageNaturalSize} />
          {/* テンプレートを左メニューに移動しました */}
          <div style={{marginTop:12}}>
            <TemplatesPanel size={menu.size} areas={areas} setAreas={setAreasCompat} setSelectedId={setSelectedId} />
          </div>
          {/* 作成モードはキャンバスで作成のみ（手動モードは省略） */}
        </div>
        <div className="center">
          <CanvasEditor
            imageUrl={menu.imageUrl}
            size={menu.size}
            areas={areas}
            setAreas={setAreasCompat}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            setImageNaturalSize={setImageNaturalSize}
            allowDraw={true}
            defaultOpen={menu.selected}
            chatBarText={menu.chatBarText}
          />
        </div>
        <div className="right">
          <AreasPanel areas={areas} setAreas={setAreasCompat} selectedId={selectedId} setSelectedId={setSelectedId} />
        </div>

        {/* JSON modal */}
        {showJson && (
          <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:120}} onClick={() => setShowJson(false)}>
            <div style={{width:'900px', maxWidth:'95%', maxHeight:'90%', background:'#fff', borderRadius:8, padding:16, overflow:'auto'}} onClick={(e) => e.stopPropagation()}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontWeight:700}}>{t('jsonPreview')}</div>
                <button className="btn secondary" onClick={() => setShowJson(false)}>{t('close')}</button>
              </div>
              <JSONPanel
                menu={{...menu, areas: areas.map(a => ({ bounds: a.bounds, action: a.action }))}}
                setMenu={setMenu}
              />
            </div>
          </div>
        )}

        {/* LINE API modal */}
        {showLineApi && (
          <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:120}} onClick={() => setShowLineApi(false)}>
            <div style={{width:'900px', maxWidth:'95%', maxHeight:'90%', background:'#fff', borderRadius:8, padding:16, overflow:'auto'}} onClick={(e) => e.stopPropagation()}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontWeight:700}}>{t('lineApiTitle')}</div>
                <button className="btn secondary" onClick={() => setShowLineApi(false)}>{t('close')}</button>
              </div>
              <LineApiPanel
                menu={{...menu, areas: areas.map(a => ({ bounds: a.bounds, action: a.action }))}}
                imageUrl={menu.imageUrl}
                onLoadRichMenu={handleLoadRichMenu}
              />
            </div>
          </div>
        )}

        {/* Privacy modal */}
        {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

        {/* Footer */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          borderTop: '1px solid #ddd',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          fontSize: 12,
          color: '#666',
          zIndex: 100,
        }}>
          <span>{t('dataPrivacyFooter')}</span>
          <button
            onClick={() => setShowPrivacy(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0066cc',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              fontSize: 12,
            }}
          >
            {t('privacyAndDisclaimer')}
          </button>
        </div>
      </div>
    </>
  )
}
