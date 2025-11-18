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
  const [currentRichMenuId, setCurrentRichMenuId] = useState<string | null>(null)

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
  const handleLoadRichMenu = (richMenu: RichMenu, imageDataUrl?: string, richMenuId?: string) => {
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

    // Store the rich menu ID
    setCurrentRichMenuId(richMenuId || null)

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
        <div className="flex items-center gap-2">
          <div className="brandTitle">{t('appTitle')}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://github.com/toru-takahashi/line-richmenu-editor#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm opacity-95 underline hover:opacity-100 transition-opacity"
          >
            {t('documentation')}
          </a>
          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'ja' | 'en')}
            className="cursor-pointer rounded-td border border-white/30 bg-white/10 px-2.5 py-1.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
          <button className="btn secondary px-2.5 py-1.5" onClick={() => setShowJson(s => !s)}>{t('jsonPreview')}</button>
          <button className="btn px-2.5 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30" onClick={() => setShowLineApi(s => !s)}>{t('lineApiIntegration')}</button>
        </div>
      </div>

      <div className="layout">
          <div className="left">
          <ImageSettings menu={menu} setMenu={(m) => setMenu(m)} imageNaturalSize={imageNaturalSize} setImageNaturalSize={setImageNaturalSize} />
          {/* Templates moved to left panel */}
          <div className="mt-3">
            <TemplatesPanel size={menu.size} areas={areas} setAreas={setAreasCompat} setSelectedId={setSelectedId} />
          </div>
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowJson(false)}>
            <div className="w-[900px] max-w-[95%] max-h-[90%] overflow-auto rounded-td-xl bg-white p-4 shadow-td-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-11">{t('jsonPreview')}</h2>
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowLineApi(false)}>
            <div className="w-[900px] max-w-[95%] max-h-[90%] overflow-auto rounded-td-xl bg-white p-4 shadow-td-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-11">{t('lineApiTitle')}</h2>
                <button className="btn secondary" onClick={() => setShowLineApi(false)}>{t('close')}</button>
              </div>
              <LineApiPanel
                menu={{...menu, areas: areas.map(a => ({ bounds: a.bounds, action: a.action }))}}
                imageUrl={menu.imageUrl}
                onLoadRichMenu={handleLoadRichMenu}
                currentRichMenuId={currentRichMenuId}
              />
            </div>
          </div>
        )}

        {/* Privacy modal */}
        {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-center gap-4 border-t border-neutral-3 bg-white/95 px-4 py-2 text-xs text-neutral-8 backdrop-blur-sm">
          <span>{t('dataPrivacyFooter')}</span>
          <span className="text-neutral-6">|</span>
          <a
            href={language === 'ja' ? 'https://github.com/toru-takahashi/line-richmenu-editor/blob/main/docs/TREASURE_DATA_INTEGRATION.md' : 'https://github.com/toru-takahashi/line-richmenu-editor/blob/main/docs/TREASURE_DATA_INTEGRATION_EN.md'}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer text-xs text-td-blue-600 underline hover:text-td-blue-700"
          >
            {t('treasureDataGuide')}
          </a>
          <span className="text-neutral-6">|</span>
          <button
            onClick={() => setShowPrivacy(true)}
            className="cursor-pointer border-0 bg-transparent p-0 text-xs text-td-blue-600 underline hover:text-td-blue-700"
          >
            {t('privacyAndDisclaimer')}
          </button>
          <span className="text-neutral-6">|</span>
          <a
            href="https://github.com/toru-takahashi"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer text-xs text-td-blue-600 underline hover:text-td-blue-700"
          >
            {t('contactInfo')}
          </a>
        </div>
      </div>
    </>
  )
}
