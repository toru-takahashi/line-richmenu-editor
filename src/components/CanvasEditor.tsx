import React, { useEffect, useRef, useState } from 'react'
import { Area } from '../types'
import { useI18n } from '../i18n/useI18n'

type Props = {
  imageUrl?: string
  size: { width: number; height: number }
  areas: Area[]
  setAreas: (a: Area[]) => void
  selectedId?: string | null
  setSelectedId: (id: string | null) => void
  setImageNaturalSize: (s: { width: number; height: number } | null) => void
  allowDraw?: boolean
  defaultOpen?: boolean
  chatBarText?: string
}

export default function CanvasEditor({ imageUrl, size, areas, setAreas, selectedId, setSelectedId, setImageNaturalSize, allowDraw = true, defaultOpen = false, chatBarText = 'Tap here' }: Props) {
  const { t } = useI18n()
  const previewRef = useRef<HTMLDivElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  // keep a ref to latest areas to avoid stale-closure issues when calling the external setAreas prop
  const areasRef = useRef<Area[]>(areas)
  useEffect(() => {
    areasRef.current = areas
    // areasRef updated
  }, [areas])

  // drawing / interaction state
  const [isDrawing, setIsDrawing] = useState(false)
  const [start, setStart] = useState<{ x: number; y: number } | null>(null)
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  const [dragType, setDragType] = useState<'none' | 'move' | 'resize'>('none')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [moveOffset, setMoveOffset] = useState<{ dx: number; dy: number } | null>(null)
  const [resizeAnchor, setResizeAnchor] = useState<'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | null>(null)

  // potential states (waiting to determine click vs drag)
  const [potentialMove, setPotentialMove] = useState<{ id: string; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null)
  const [potentialDraw, setPotentialDraw] = useState<{ startX: number; startY: number } | null>(null)

  // track when imageUrl was last set and when preview image finished loading
  const lastImageSetAtRef = useRef<number | null>(null)
  const lastImageLoadedAtRef = useRef<number | null>(null)

  useEffect(() => {
    const update = () => {
      const node = previewRef.current
      if (!node) return
      const displayedW = node.clientWidth
      const s = displayedW / Math.max(1, size.width)
      setScale(s)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [imageUrl, size.width])

  // update lastImageSetAt when imageUrl changes; clear pending potentials on change
  useEffect(() => {
    lastImageSetAtRef.current = imageUrl ? Date.now() : null
    setPotentialDraw(null)
    setPotentialMove(null)
    setIsDrawing(false)
  }, [imageUrl])

  const actionSummary = (a: Area) => {
    const act = a.action as any
    if (act.type === 'uri') return t('actionUri', { uri: act.uri || '' })
    if (act.type === 'message') return t('actionMessage', { text: act.text || '' })
    if (act.type === 'postback') return t('actionPostback', { data: act.data || '' })
    return act.type
  }

  // toast for preview action simulation
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' })
  // store timeout id so we can clear it on unmount
  const toastTimeoutRef = useRef<number | null>(null)
  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg })
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = window.setTimeout(() => setToast({ visible: false, message: '' }), 2500)
  }
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  // ensure any active drag/draw ends if the mouse is released outside the preview
  useEffect(() => {
    const onWinUp = () => {
      onMouseUp()
    }
    window.addEventListener('mouseup', onWinUp)
    window.addEventListener('blur', onWinUp)
    return () => {
      window.removeEventListener('mouseup', onWinUp)
      window.removeEventListener('blur', onWinUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // chat simulation state
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; text: string }>>([])
  const chatRef = useRef<HTMLDivElement | null>(null)
  // edit vs preview mode
  const [editMode, setEditMode] = useState(true)
  // when switching to preview mode, clear any selection / drag state so rectangles are not left highlighted
  useEffect(() => {
    if (!editMode) {
      // clear selection in parent
      setSelectedId(null)
      // clear any local interaction state
      setPotentialDraw(null)
      setPotentialMove(null)
      setIsDrawing(false)
      setStart(null)
      setCurrentRect(null)
      setDragType('none')
      setActiveId(null)
      setMoveOffset(null)
      setResizeAnchor(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode])
  const pushChat = (text: string) => {
    const id = typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}`
    setChatMessages((s) => [...s, { id, text }])
    // scroll after a tick
    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
    }, 40)
  }

  const simulateAction = (a: Area) => {
    const act = a.action as any
    if (act.type === 'message') {
      pushChat(act.text || t('emptyMessage'))
    } else if (act.type === 'uri') {
      pushChat(t('openLink', { uri: act.uri || '' }))
      showToast(`URI: ${act.uri || ''}`)
    } else if (act.type === 'postback') {
      pushChat(t('postbackAction', { data: act.data || '' }))
    } else if (act.type === 'datetimepicker') {
      const mode = act.mode || 'datetime'
      pushChat(t('datetimePickerAction', { mode, data: act.data || '' }))
      showToast(t('datetimePicker'))
    } else if (act.type === 'richmenuswitch') {
      pushChat(t('richMenuSwitchAction', { richMenuId: act.richMenuId || '(unset)' }))
      showToast(t('richMenuSwitch'))
    } else {
      pushChat(String(act.type || 'action'))
    }
  }

  const handlePreviewClick = (a: Area) => {
    simulateAction(a)
  }

  function onMouseDown(e: React.MouseEvent) {
    if (!previewRef.current) return
    if (!editMode) return
    const p = toPreviewCoords(e.clientX, e.clientY)
    const hit = areas.find(a => p.x >= a.bounds.x && p.x <= a.bounds.x + a.bounds.width && p.y >= a.bounds.y && p.y <= a.bounds.y + a.bounds.height)
    if (!hit && allowDraw) {
      // start potential draw; actual drawing starts after movement threshold
      setPotentialDraw({ startX: p.x, startY: p.y })
      setSelectedId(null)
      return
    }

    if (hit) {
      // start potential move
      const dx = p.x - hit.bounds.x
      const dy = p.y - hit.bounds.y
      setPotentialMove({ id: hit.id, startX: p.x, startY: p.y, offsetX: dx, offsetY: dy })
      setSelectedId(hit.id)
      return
    }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!previewRef.current) return
    if (!editMode) return
    const p = toPreviewCoords(e.clientX, e.clientY)

    // If we had a potentialDraw and movement exceeds threshold, start drawing
    if (potentialDraw && !isDrawing) {
      const dx = Math.abs(p.x - potentialDraw.startX)
      const dy = Math.abs(p.y - potentialDraw.startY)
      const threshold = 4
      if (dx > threshold || dy > threshold) {
        setIsDrawing(true)
        setStart({ x: potentialDraw.startX, y: potentialDraw.startY })
        const x = Math.min(potentialDraw.startX, p.x)
        const y = Math.min(potentialDraw.startY, p.y)
        const w = Math.abs(p.x - potentialDraw.startX)
        const h = Math.abs(p.y - potentialDraw.startY)
        setCurrentRect({ x, y, w, h })
        setPotentialDraw(null)
      }
    }

    // update current drawing rect
    if (isDrawing && start) {
      const x = Math.min(start.x, p.x)
      const y = Math.min(start.y, p.y)
      const w = Math.abs(p.x - start.x)
      const h = Math.abs(p.y - start.y)
      setCurrentRect({ x, y, w, h })
      return
    }

    // if potentialMove and movement exceeds threshold, begin moving
    if (potentialMove && dragType === 'none') {
      const dx = Math.abs(p.x - potentialMove.startX)
      const dy = Math.abs(p.y - potentialMove.startY)
      const threshold = 4
      if (dx > threshold || dy > threshold) {
        setDragType('move')
        setActiveId(potentialMove.id)
        setMoveOffset({ dx: potentialMove.offsetX, dy: potentialMove.offsetY })
        setPotentialMove(null)
      }
    }

    // moving
    if (dragType === 'move' && activeId && moveOffset) {
      const newX = Math.max(0, Math.min(size.width - 1, p.x - moveOffset.dx))
      const newY = Math.max(0, Math.min(size.height - 1, p.y - moveOffset.dy))
  setAreas(areasRef.current.map(a => a.id === activeId ? { ...a, bounds: { ...a.bounds, x: Math.round(newX), y: Math.round(newY) } } : a))
      return
    }

    // resizing
    if (dragType === 'resize' && activeId && resizeAnchor) {
      const a = areas.find(x => x.id === activeId)
      if (!a) return
      const old = a.bounds
      let nx = old.x
      let ny = old.y
      let nw = old.width
      let nh = old.height
      const right = old.x + old.width
      const bottom = old.y + old.height

      if (resizeAnchor === 'nw') {
        nx = Math.max(0, Math.min(right - 1, p.x))
        ny = Math.max(0, Math.min(bottom - 1, p.y))
        nw = right - nx
        nh = bottom - ny
      } else if (resizeAnchor === 'ne') {
        ny = Math.max(0, Math.min(bottom - 1, p.y))
        nw = Math.max(1, Math.min(size.width - old.x, p.x - old.x))
        nh = bottom - ny
      } else if (resizeAnchor === 'sw') {
        nx = Math.max(0, Math.min(right - 1, p.x))
        nw = right - nx
        nh = Math.max(1, Math.min(size.height - old.y, p.y - old.y))
      } else if (resizeAnchor === 'se') {
        nw = Math.max(1, Math.min(size.width - old.x, p.x - old.x))
        nh = Math.max(1, Math.min(size.height - old.y, p.y - old.y))
      } else if (resizeAnchor === 'n') {
        ny = Math.max(0, Math.min(bottom - 1, p.y))
        nh = bottom - ny
      } else if (resizeAnchor === 's') {
        nh = Math.max(1, Math.min(size.height - old.y, p.y - old.y))
      } else if (resizeAnchor === 'w') {
        nx = Math.max(0, Math.min(right - 1, p.x))
        nw = right - nx
      } else if (resizeAnchor === 'e') {
        nw = Math.max(1, Math.min(size.width - old.x, p.x - old.x))
      }

      nw = Math.max(1, nw)
      nh = Math.max(1, nh)
  setAreas(areasRef.current.map(ar => ar.id === activeId ? { ...ar, bounds: { x: Math.round(nx), y: Math.round(ny), width: Math.round(nw), height: Math.round(nh) } } : ar))
      return
    }
  }

  function onMouseUp() {
    if (!editMode) {
      // clear any pending potentials when in preview mode
      setPotentialDraw(null)
      setPotentialMove(null)
      return
    }

    // finish drawing with defensive guards to avoid accidental/duplicate creation
    if (isDrawing && currentRect) {
      const now = Date.now()
      // avoid creating immediately after an image change/upload which can trigger weird pointer events
      if (imageUrl && lastImageSetAtRef.current && now - lastImageSetAtRef.current < 300) {
          // skipped area create due to recent image change
      } else {
        const pr = previewRef.current?.getBoundingClientRect()
        if (!pr || pr.width < 8 || pr.height < 8) {
          // skipped area create: preview too small
        } else if (currentRect.w >= 4 && currentRect.h >= 4) {
          const id = typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}`
          const newArea: Area = {
            id,
            bounds: { x: Math.round(currentRect.x), y: Math.round(currentRect.y), width: Math.round(currentRect.w), height: Math.round(currentRect.h) },
            action: { type: 'message', text: 'Hello' }
          }
          // created new area
          setAreas([...areasRef.current, newArea])
          setSelectedId(newArea.id)
        }
      }
    }

    if (potentialMove && dragType === 'none') {
      setSelectedId(potentialMove.id)
    }

    if (potentialDraw) {
      setPotentialDraw(null)
    }

    setIsDrawing(false)
    setStart(null)
    setCurrentRect(null)
    setDragType('none')
    setActiveId(null)
    setMoveOffset(null)
    setResizeAnchor(null)
    setPotentialMove(null)
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget
    setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    if (wrapRef.current) {
      const displayedW = img.clientWidth
      setScale(displayedW / Math.max(1, size.width))
    }
    // record that preview image finished loading and clear pending potentials
    lastImageLoadedAtRef.current = Date.now()
  // recorded image load
    setPotentialDraw(null)
    setPotentialMove(null)
    setIsDrawing(false)
  }

  // convert client coords over preview to image-native coords
  const toPreviewCoords = (clientX: number, clientY: number) => {
    const node = previewRef.current
    if (!node) return { x: 0, y: 0 }
    const rect = node.getBoundingClientRect()
    const previewWidth = rect.width
    const previewScale = size.width > 0 ? previewWidth / size.width : 1
    const x = Math.max(0, Math.min(size.width, Math.round((clientX - rect.left) / Math.max(previewScale, 1e-6))))
    const y = Math.max(0, Math.min(size.height, Math.round((clientY - rect.top) / Math.max(previewScale, 1e-6))))
    return { x, y }
  }

  // compute menu/render sizes for the phone mock once (used in JSX)
  const menuH = Math.round(360 * (size.height / Math.max(1, size.width)))
  const containerH = menuH + 48 // padding + chrome

  return (
    <div className="canvasWrap">
      {/* Editable canvas area (center) */}
      <div
        ref={wrapRef}
        style={{
          cursor: allowDraw ? 'crosshair' : 'default',
          maxWidth: '100%',
          position: 'relative',
          touchAction: 'none',
          userSelect: 'none',
          background: '#f8fafc'
        }}
      >
  {/* top image removed to avoid double-loading and accidental duplicate DOM/handlers */}
      </div>

      {/* Phone-style fixed preview (single mock). Clickable overlay shows action summary as a transient toast. */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
        {/* phoneMock reduced: only show the bottom rich-menu area (no header/chat area) */}
        <div className="phoneMock" style={{ width: 360, boxShadow: '0 4px 18px rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', border: '1px solid #e6e6e6', background:'#fff', position: 'relative' }}>
          {/* compute menu/render sizes */}
          <div style={{ width: 360, height: containerH + 300, position: 'relative' }}>
                {/* header */}
                <div style={{ height: 40, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, background: '#f7f9fc', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ fontWeight: 700, color: '#213547' }}>{t('richMenuPreview')}</div>
                  <div style={{ marginLeft: 'auto' }}>
                    <button onClick={() => setEditMode(m => !m)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: editMode ? '#0f5a3f' : '#111827', color: '#fff', cursor: 'pointer' }}>
                      {editMode ? t('editMode') : t('previewMode')}
                    </button>
                  </div>
                </div>
                {/* chat area */}
                <div ref={chatRef} style={{ height: 260, overflow: 'auto', background: '#e6eefc', padding: 12 }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ color: '#64748b' }}>{t('chatPlaceholder')}</div>
                  ) : (
                    chatMessages.map(m => (
                      <div key={m.id} style={{ marginBottom: 8, display: 'flex' }}>
                        <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', maxWidth: '80%' }}>{m.text}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* menu area */}
                <div style={{ padding: 12, background: '#0f5a3f' }}>
                  <div ref={previewRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} style={{ width: 360 - 24, height: menuH, margin: '0 auto', position: 'relative', background: '#0f5a3f', borderRadius: 8, overflow: 'hidden' }}>
                    {imageUrl ? (
                      <img src={imageUrl} alt="preview" draggable={false} onDragStart={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()} onLoad={onImageLoad} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none' }} />
                    ) : null}

                    {/* render areas + handles inside preview only */}
                    {/* always render areas so they can be referenced even without an image */}
                    {(() => {
                      const previewWidth = 360 - 24
                      const previewScale = size.width > 0 ? previewWidth / size.width : 1
                      return (
                        <>
                          {areas.map((a, idx) => {
                            const isSelected = selectedId === a.id
                            const baseStyle: React.CSSProperties = { left: a.bounds.x * previewScale, top: a.bounds.y * previewScale, width: a.bounds.width * previewScale, height: a.bounds.height * previewScale, position: 'absolute', border: '2px dashed rgba(0,75,153,0.85)', background: 'rgba(0,102,204,0.08)', cursor: 'pointer' }
                            const selStyle: React.CSSProperties = isSelected ? { border: '2px solid #ffd54f', background: 'rgba(255,213,79,0.12)', boxShadow: '0 8px 24px rgba(33,37,55,0.16)', zIndex: 60 } : {}
                            const st = { ...baseStyle, ...selStyle }
                            return (
                              <div key={a.id} className="areaRect" style={st} onMouseDown={(ev) => { if (!editMode) return; ev.stopPropagation(); const p = toPreviewCoords(ev.clientX, ev.clientY); setSelectedId(a.id); setPotentialMove({ id: a.id, startX: p.x, startY: p.y, offsetX: p.x - a.bounds.x, offsetY: p.y - a.bounds.y }) }} onClick={(ev) => { ev.stopPropagation(); if (!editMode) { simulateAction(a) } else { setSelectedId(a.id) } }} title={actionSummary(a)}>
                                {/* ID badge for easier editing */}
                                {/* show sequential short id like #1, #2 for user clarity */}
                                <div style={{ position: 'absolute', left: 4, top: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px', borderRadius: 6, fontSize: 11, pointerEvents: 'none' }}>{`#${idx + 1}`}</div>
                                {selectedId === a.id && editMode && (
                                  <>
                                    <div className="handle nw" onMouseDown={(ev) => { ev.stopPropagation(); setDragType('resize'); setActiveId(a.id); setResizeAnchor('nw') }} />
                                    <div className="handle ne" onMouseDown={(ev) => { ev.stopPropagation(); setDragType('resize'); setActiveId(a.id); setResizeAnchor('ne') }} />
                                    <div className="handle sw" onMouseDown={(ev) => { ev.stopPropagation(); setDragType('resize'); setActiveId(a.id); setResizeAnchor('sw') }} />
                                    <div className="handle se" onMouseDown={(ev) => { ev.stopPropagation(); setDragType('resize'); setActiveId(a.id); setResizeAnchor('se') }} />
                                    <div className="handle n" onMouseDown={(ev) => { ev.stopPropagation(); setDragType('resize'); setActiveId(a.id); setResizeAnchor('n' as any) }} />
                                    <div className="handle s" onMouseDown={(ev) => { ev.stopPropagation(); setDragType('resize'); setActiveId(a.id); setResizeAnchor('s' as any) }} />
                                    <div className="handle w" onMouseDown={(ev) => { ev.stopPropagation(); setDragType('resize'); setActiveId(a.id); setResizeAnchor('w' as any) }} />
                                    <div className="handle e" onMouseDown={(ev) => { ev.stopPropagation(); setDragType('resize'); setActiveId(a.id); setResizeAnchor('e' as any) }} />
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </>
                      )
                    })()}

                    {/* current drawing rect shown in preview */}
                    {/* show current drawing rect even without an image */}
                    {currentRect && (
                      <div className="areaRect" style={{ left: currentRect.x * ( (360-24) / Math.max(1,size.width) ), top: currentRect.y * ( (360-24) / Math.max(1,size.width) ), width: currentRect.w * ( (360-24) / Math.max(1,size.width) ), height: currentRect.h * ( (360-24) / Math.max(1,size.width) ) }} />
                    )}
                  </div>
                </div>

                {/* toast area (above bottom) */}
                {toast.visible && (
                  <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 16, background: '#111827', color: '#fff', padding: '8px 12px', borderRadius: 12, fontSize: 13 }}>
                    {toast.message}
                  </div>
                )}
              </div>
        </div>
      </div>
    </div>
  )
}
