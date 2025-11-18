import React from 'react'
import { Area } from '../types'
import { useI18n } from '../i18n/useI18n'

type Props = {
  size: { width: number; height: number }
  setAreas: (a: Area[] | ((prev: Area[]) => Area[])) => void
  areas: Area[]
  setSelectedId: (id: string | null) => void
}

// create areas with default actions from a layout definition (array of rects in normalized coords)
function buildAreasFromRects(rects: { x: number; y: number; w: number; h: number }[], size: { width: number; height: number }) {
  return rects.map(r => ({
    id: crypto.randomUUID(),
    bounds: { x: Math.round(r.x * size.width), y: Math.round(r.y * size.height), width: Math.round(r.w * size.width), height: Math.round(r.h * size.height) },
    action: { type: 'message', text: 'Hello' }
  })) as Area[]
}

export default function TemplatesPanel({ size, setAreas, setSelectedId, areas }: Props) {
  const { t } = useI18n()
  // some presets using normalized coordinates (0..1). These are examples similar to the provided screenshot.
  const presets = [
    { id: '2x3', name: t('template2x3'), rects: (() => { const cols = 3, rows = 2; const list: any[] = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { list.push({ x: c / cols, y: r / rows, w: 1 / cols, h: 1 / rows }) } return list })() },
    { id: '3x3', name: t('template3x3'), rects: (() => {
      const cols = 3, rows = 3
      const list: any[] = []
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        list.push({ x: c / cols, y: r / rows, w: 1 / cols, h: 1 / rows })
      }
      return list
    })() },
    { id: '3col', name: t('template3col'), rects: [{ x: 0, y: 0, w: 1/3, h: 1 }, { x: 1/3, y: 0, w: 1/3, h: 1 }, { x: 2/3, y: 0, w: 1/3, h: 1 }] },
    { id: '2row_top', name: t('template2row'), rects: [{ x:0, y:0, w:1, h:0.5 }, { x:0, y:0.5, w:1, h:0.5 }] },
    { id: 'bottom_3', name: t('templateBottom3'), rects: [{ x:0, y:0.7, w:1/3, h:0.3 }, { x:1/3, y:0.7, w:1/3, h:0.3 }, { x:2/3, y:0.7, w:1/3, h:0.3 }] },
    { id: 'single', name: t('templateSingle'), rects: [{ x:0, y:0, w:1, h:1 }] }
  ]

  return (
    <div className="mb-3">
      <h4 className="mb-2 text-base font-semibold text-neutral-11">{t('templates')}</h4>
      <div className="grid grid-cols-2 gap-2">
        {presets.map(p => (
          <button key={p.id} className="btn ghost text-xs px-2 py-1.5" onClick={() => {
            const newAreas = buildAreasFromRects(p.rects, size)
            // if existing areas exist, confirm replacement
            if (areas && areas.length > 0) {
              const ok = window.confirm(t('templateWarning'))
              if (!ok) return
            }
            // use functional updater to replace existing areas
            setAreas(() => newAreas)
            setSelectedId(newAreas[0]?.id ?? null)
          }}>{p.name}</button>
        ))}
      </div>
      <div className="small mt-2">{t('templateNote')}</div>
    </div>
  )
}
