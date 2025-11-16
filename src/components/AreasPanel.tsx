import React from 'react'
import { Area, LineAction } from '../types'

type Props = {
  areas: Area[]
  setAreas: (a: Area[]) => void
  selectedId?: string | null
  setSelectedId: (id: string | null) => void
}

function ActionForm({ action, onChange }: { action: LineAction; onChange: (a: LineAction) => void }) {
  const t = action.type
  return (
    <div>
      <div className="field">
        <label>アクション種別</label>
        <select value={t} onChange={(e) => {
            const type = e.target.value as any
            if (type === 'uri') onChange({ type: 'uri', uri: '' })
            if (type === 'message') onChange({ type: 'message', text: '' })
            if (type === 'postback') onChange({ type: 'postback', data: '', displayText: '', label: '', display: 'none' })
            if (type === 'datetimepicker') onChange({ type: 'datetimepicker', data: '', mode: 'datetime', initial: '', min: '', max: '' })
            if (type === 'richmenuswitch') onChange({ type: 'richmenuswitch', richMenuId: '', data: '' })
          }}>
          <option value="uri">URLを開く (uri)</option>
          <option value="message">メッセージ送信</option>
          <option value="postback">ポストバック</option>
          <option value="datetimepicker">日時選択 (datetimepicker)</option>
          <option value="richmenuswitch">リッチメニュー切替 (richmenuswitch)</option>
        </select>
      </div>

      {t === 'uri' && (
        <div className="field">
          <label>URL</label>
          <input type="text" value={(action as any).uri || ''} onChange={(e) => onChange({ type: 'uri', uri: e.target.value })} />
        </div>
      )}
      {t === 'message' && (
        <div className="field">
          <label>メッセージ本文</label>
          <input type="text" value={(action as any).text || ''} onChange={(e) => onChange({ type: 'message', text: e.target.value })} />
        </div>
      )}
      {t === 'postback' && (
        <>
          <div className="field">
            <label>ラベル</label>
            <input type="text" value={(action as any).label || ''} onChange={(e) => onChange({ ...(action as any), label: e.target.value })} />
          </div>
          <div className="field">
            <label>Webhook に送信するテキスト（必須）</label>
            <input type="text" value={(action as any).data || ''} onChange={(e) => onChange({ ...(action as any), data: e.target.value })} />
          </div>
          <div className="field">
            <label>表示テキスト（任意）</label>
            <input type="text" value={(action as any).displayText || ''} onChange={(e) => onChange({ ...(action as any), displayText: e.target.value })} />
          </div>
          <div className="field">
            <label>メニューの表示方法</label>
            <select value={(action as any).display || 'none'} onChange={(e) => onChange({ ...(action as any), display: e.target.value as any })}>
              <option value="none">選択しない</option>
              <option value="close">リッチメニューを閉じる</option>
              <option value="open">リッチメニューを開く</option>
              <option value="keyboard">キーボードを開く</option>
              <option value="voice">ボイスメッセージ入力モードを開く</option>
            </select>
          </div>
        </>
      )}
      {t === 'datetimepicker' && (
        <>
          <div className="field">
            <label>データ (data)</label>
            <input type="text" value={(action as any).data || ''} onChange={(e) => onChange({ ...(action as any), data: e.target.value })} />
          </div>
          <div className="field">
            <label>モード</label>
            <select value={(action as any).mode || 'datetime'} onChange={(e) => onChange({ ...(action as any), mode: e.target.value as any })}>
              <option value="date">date</option>
              <option value="time">time</option>
              <option value="datetime">datetime</option>
            </select>
          </div>
          <div className="field">
            <label>初期値</label>
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
            <label>最小 / 最大</label>
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
      {t === 'richmenuswitch' && (
        <div>
          <div className="field">
            <label>切替先リッチメニューID</label>
            <input type="text" value={(action as any).richMenuId || ''} onChange={(e) => onChange({ ...(action as any), richMenuId: e.target.value })} />
          </div>
          <div className="field">
            <label>データ (任意)</label>
            <input type="text" value={(action as any).data || ''} onChange={(e) => onChange({ ...(action as any), data: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function AreasPanel({ areas, setAreas, selectedId, setSelectedId }: Props) {
  const selected = areas.find((a) => a.id === selectedId) || null

  const actionSummary = (a: Area) => {
    const act = a.action as any
    if (act.type === 'uri') return `URL: ${act.uri || ''}`
    if (act.type === 'message') return `メッセージ: ${act.text || ''}`
    if (act.type === 'postback') return `ポストバック: ${act.data || ''}`
    if (act.type === 'datetimepicker') return `日時選択: ${act.mode || 'datetime'} ${act.data || ''}`
    if (act.type === 'richmenuswitch') return `リッチメニュー切替: ${act.richMenuId || ''}`
    return act.type
  }

  function updateSelected(patch: Partial<Area>) {
    if (!selected) return
    setAreas(areas.map((a) => (a.id === selected.id ? { ...a, ...patch } : a)))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>タップ領域 ({areas.length})</h3>
        <button className="btn secondary" onClick={() => { if (areas.length >= 20) return; const newA: Area = { id: crypto.randomUUID(), bounds: { x: 0, y: 0, width: 100, height: 100 }, action: { type: 'message', text: 'Hello' } }; setAreas([...areas, newA]); setSelectedId(newA.id) }}>+ 領域を追加</button>
      </div>

      <div className="areasList">
        {areas.map((a, idx) => {
          const isSelected = selectedId === a.id
          return (
            <div key={a.id} className="item" style={{paddingBottom: isSelected ? 10 : 6}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{cursor:'pointer'}} onClick={() => setSelectedId(a.id)}>
                  <div><strong>#{idx + 1}</strong> <span className="small">{actionSummary(a)}</span></div>
                  <div className="small">x:{a.bounds.x} y:{a.bounds.y} w:{a.bounds.width} h:{a.bounds.height}</div>
                </div>
                <div>
                  <button className="btn" onClick={() => setSelectedId(a.id)}>{isSelected ? '閉じる' : '編集'}</button>
                  <button className="btn secondary" style={{marginLeft:6}} onClick={() => setAreas(areas.filter(x => x.id !== a.id))}>削除</button>
                </div>
              </div>

              {isSelected && (
                <div style={{marginTop:8, padding:8, background:'#fff8', borderRadius:6}}>
                  <h4 style={{margin:'6px 0'}}>領域を編集</h4>
                  <div className="field">
                    <label>起点X座標</label>
                    <input type="number" value={a.bounds.x} onChange={(e) => updateSelected({ bounds: { ...a.bounds, x: Number(e.target.value) } })} />
                  </div>
                  <div className="field">
                    <label>起点Y座標</label>
                    <input type="number" value={a.bounds.y} onChange={(e) => updateSelected({ bounds: { ...a.bounds, y: Number(e.target.value) } })} />
                  </div>
                  <div className="field">
                    <label>幅 (width)</label>
                    <input type="number" value={a.bounds.width} onChange={(e) => updateSelected({ bounds: { ...a.bounds, width: Number(e.target.value) } })} />
                  </div>
                  <div className="field">
                    <label>高さ (height)</label>
                    <input type="number" value={a.bounds.height} onChange={(e) => updateSelected({ bounds: { ...a.bounds, height: Number(e.target.value) } })} />
                  </div>

                  <div style={{marginTop:8}}>
                    <h4>アクション</h4>
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
