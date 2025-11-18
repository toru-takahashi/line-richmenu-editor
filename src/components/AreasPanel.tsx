import React from 'react'
import { Area, LineAction } from '../types'
import { useI18n } from '../i18n/useI18n'

type Props = {
  areas: Area[]
  setAreas: (a: Area[]) => void
  selectedId?: string | null
  setSelectedId: (id: string | null) => void
}

function ActionForm({ action, onChange }: { action: LineAction; onChange: (a: LineAction) => void }) {
  const { t } = useI18n()
  const actionType = action.type
  return (
    <div>
      <div className="field">
        <label>{t('actionType')}</label>
        <select value={actionType} onChange={(e) => {
            const type = e.target.value as any
            if (type === 'uri') onChange({ type: 'uri', uri: '' })
            if (type === 'message') onChange({ type: 'message', text: '' })
            if (type === 'postback') onChange({ type: 'postback', data: '', displayText: '', label: '', display: 'none' })
            if (type === 'datetimepicker') onChange({ type: 'datetimepicker', data: '', mode: 'datetime', initial: '', min: '', max: '' })
            if (type === 'richmenuswitch') onChange({ type: 'richmenuswitch', richMenuAliasId: '', data: '' })
          }}>
          <option value="uri">{t('openUrl')}</option>
          <option value="message">{t('sendMessage')}</option>
          <option value="postback">{t('postback')}</option>
          <option value="datetimepicker">{t('datetimePicker')}</option>
          <option value="richmenuswitch">{t('richMenuSwitch')}</option>
        </select>
      </div>

      {actionType === 'uri' && (
        <div className="field">
          <label>{t('url')}</label>
          <input type="text" value={(action as any).uri || ''} onChange={(e) => onChange({ type: 'uri', uri: e.target.value })} />
        </div>
      )}
      {actionType === 'message' && (
        <div className="field">
          <label>{t('messageText')}</label>
          <input type="text" value={(action as any).text || ''} onChange={(e) => onChange({ type: 'message', text: e.target.value })} />
        </div>
      )}
      {actionType === 'postback' && (
        <>
          <div className="field">
            <label>{t('label')}</label>
            <input type="text" value={(action as any).label || ''} onChange={(e) => onChange({ ...(action as any), label: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('webhookText')}</label>
            <input type="text" value={(action as any).data || ''} onChange={(e) => onChange({ ...(action as any), data: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('displayText')}</label>
            <input type="text" value={(action as any).displayText || ''} onChange={(e) => onChange({ ...(action as any), displayText: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('menuDisplayMethod')}</label>
            <select value={(action as any).display || 'none'} onChange={(e) => onChange({ ...(action as any), display: e.target.value as any })}>
              <option value="none">{t('doNotSelect')}</option>
              <option value="close">{t('closeRichMenu')}</option>
              <option value="open">{t('openRichMenu')}</option>
              <option value="keyboard">{t('openKeyboard')}</option>
              <option value="voice">{t('openVoiceInput')}</option>
            </select>
          </div>
        </>
      )}
      {actionType === 'datetimepicker' && (
        <>
          <div className="field">
            <label>{t('data')}</label>
            <input type="text" value={(action as any).data || ''} onChange={(e) => onChange({ ...(action as any), data: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('mode')}</label>
            <select value={(action as any).mode || 'datetime'} onChange={(e) => onChange({ ...(action as any), mode: e.target.value as any })}>
              <option value="date">date</option>
              <option value="time">time</option>
              <option value="datetime">datetime</option>
            </select>
          </div>
          <div className="field">
            <label>{t('initialValue')}</label>
            {
              ((action as any).mode || 'datetime') === 'date' ? (
                <input type="date" value={(action as any).initial || ''} onChange={(e) => onChange({ ...(action as any), initial: e.target.value })} />
              ) : ((action as any).mode || 'datetime') === 'time' ? (
                <input type="time" value={(action as any).initial || ''} onChange={(e) => onChange({ ...(action as any), initial: e.target.value })} />
              ) : (
                <input type="datetime-local" value={(action as any).initial || ''} onChange={(e) => onChange({ ...(action as any), initial: e.target.value })} />
              )
            }
          </div>
          <div className="field">
            <label>{t('minMax')}</label>
            {
              ((action as any).mode || 'datetime') === 'date' ? (
                <>
                  <input type="date" placeholder="min" value={(action as any).min || ''} onChange={(e) => onChange({ ...(action as any), min: e.target.value })} />
                  <input type="date" placeholder="max" value={(action as any).max || ''} onChange={(e) => onChange({ ...(action as any), max: e.target.value })} />
                </>
              ) : ((action as any).mode || 'datetime') === 'time' ? (
                <>
                  <input type="time" placeholder="min" value={(action as any).min || ''} onChange={(e) => onChange({ ...(action as any), min: e.target.value })} />
                  <input type="time" placeholder="max" value={(action as any).max || ''} onChange={(e) => onChange({ ...(action as any), max: e.target.value })} />
                </>
              ) : (
                <>
                  <input type="datetime-local" placeholder="min" value={(action as any).min || ''} onChange={(e) => onChange({ ...(action as any), min: e.target.value })} />
                  <input type="datetime-local" placeholder="max" value={(action as any).max || ''} onChange={(e) => onChange({ ...(action as any), max: e.target.value })} />
                </>
              )
            }
          </div>
        </>
      )}
      {actionType === 'richmenuswitch' && (
        <div>
          <div className="field">
            <label>{t('switchTargetMenuAliasId')}</label>
            <input type="text" value={(action as any).richMenuAliasId || ''} onChange={(e) => onChange({ ...(action as any), richMenuAliasId: e.target.value })} placeholder="Rich Menu Alias ID" />
          </div>
          <div className="field">
            <label>{t('dataOptional')}</label>
            <input type="text" value={(action as any).data || ''} onChange={(e) => onChange({ ...(action as any), data: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function AreasPanel({ areas, setAreas, selectedId, setSelectedId }: Props) {
  const { t } = useI18n()
  const selected = areas.find((a) => a.id === selectedId) || null

  const actionSummary = (a: Area) => {
    const act = a.action as any
    if (act.type === 'uri') return t('actionUri', { uri: act.uri || '' })
    if (act.type === 'message') return t('actionMessage', { text: act.text || '' })
    if (act.type === 'postback') return t('actionPostback', { data: act.data || '' })
    if (act.type === 'datetimepicker') return t('actionDatetimepicker', { mode: act.mode || 'datetime', data: act.data || '' })
    if (act.type === 'richmenuswitch') return t('actionRichmenuswitch', { richMenuAliasId: act.richMenuAliasId || '' })
    return act.type
  }

  function updateSelected(patch: Partial<Area>) {
    if (!selected) return
    setAreas(areas.map((a) => (a.id === selected.id ? { ...a, ...patch } : a)))
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-11">{t('tapAreas')} ({areas.length})</h3>
        <button className="btn secondary" onClick={() => { if (areas.length >= 20) return; const newA: Area = { id: crypto.randomUUID(), bounds: { x: 0, y: 0, width: 100, height: 100 }, action: { type: 'message', text: 'Hello' } }; setAreas([...areas, newA]); setSelectedId(newA.id) }}>{t('addArea')}</button>
      </div>

      <div className="areasList">
        {areas.map((a, idx) => {
          const isSelected = selectedId === a.id
          return (
            <div key={a.id} className="item" style={{paddingBottom: isSelected ? 10 : 6}}>
              <div className="flex items-center justify-between">
                <div className="cursor-pointer flex-1" onClick={() => setSelectedId(a.id)}>
                  <div className="text-sm"><strong className="font-semibold text-neutral-11">#{idx + 1}</strong> <span className="small">{actionSummary(a)}</span></div>
                  <div className="small">x:{a.bounds.x} y:{a.bounds.y} w:{a.bounds.width} h:{a.bounds.height}</div>
                </div>
                <div className="flex gap-1.5 ml-2">
                  <button className="btn text-xs px-3 py-1.5" onClick={() => setSelectedId(isSelected ? null : a.id)}>{isSelected ? t('close') : t('edit')}</button>
                  <button className="btn secondary text-xs px-3 py-1.5" onClick={() => {
                    if (isSelected) setSelectedId(null);
                    setAreas(prev => prev.filter(x => x.id !== a.id));
                  }}>{t('delete')}</button>
                </div>
              </div>

              {isSelected && (
                <div className="mt-2 rounded-td border border-neutral-3 bg-neutral-0/80 p-2">
                  <h4 className="my-1.5 text-sm font-semibold text-neutral-11">{t('editArea')}</h4>
                  <div className="field">
                    <label>{t('startX')}</label>
                    <input type="number" value={a.bounds.x} onChange={(e) => updateSelected({ bounds: { ...a.bounds, x: Number(e.target.value) } })} />
                  </div>
                  <div className="field">
                    <label>{t('startY')}</label>
                    <input type="number" value={a.bounds.y} onChange={(e) => updateSelected({ bounds: { ...a.bounds, y: Number(e.target.value) } })} />
                  </div>
                  <div className="field">
                    <label>{t('width')}</label>
                    <input type="number" value={a.bounds.width} onChange={(e) => updateSelected({ bounds: { ...a.bounds, width: Number(e.target.value) } })} />
                  </div>
                  <div className="field">
                    <label>{t('height')}</label>
                    <input type="number" value={a.bounds.height} onChange={(e) => updateSelected({ bounds: { ...a.bounds, height: Number(e.target.value) } })} />
                  </div>

                  <div className="mt-2">
                    <h4 className="mb-2 text-sm font-semibold text-neutral-11">{t('action')}</h4>
                    <ActionForm action={a.action} onChange={(act) => updateSelected({ action: act as LineAction })} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
