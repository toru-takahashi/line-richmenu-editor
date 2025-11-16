import React, { useRef, useState } from 'react'
import { RichMenu } from '../types'

type Props = {
  menu: RichMenu
  setMenu: (m: RichMenu) => void
}

export default function JSONPanel({ menu, setMenu }: Props) {
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
      errs.push('アクションが不正です')
      return errs
    }
    const t = a.type
    if (t === 'uri') {
      if (!a.uri || typeof a.uri !== 'string') errs.push('URI アクションには uri が必要です')
    } else if (t === 'message') {
      if (typeof a.text !== 'string') errs.push('メッセージアクションには text が必要です')
    } else if (t === 'postback') {
      if (typeof a.data !== 'string') errs.push('ポストバックアクションには data (Webhook に送信するテキスト) が必要です')
      if (a.display && !['none', 'close', 'open', 'keyboard', 'voice'].includes(a.display)) errs.push('postback.display が不正です')
    } else if (t === 'datetimepicker') {
      if (typeof a.data !== 'string') errs.push('日時選択アクションには data が必要です')
      if (!['date', 'time', 'datetime'].includes(a.mode)) errs.push('datetimepicker.mode は date|time|datetime のいずれかである必要があります')
    } else if (t === 'richmenuswitch') {
      if (!a.richMenuId || typeof a.richMenuId !== 'string') errs.push('richmenuswitch には richMenuId が必要です')
    } else {
      errs.push(`未対応のアクション種別: ${t}`)
    }
    return errs
  }

  function validateMenuForAPI(m: typeof richMenuForAPI) {
    const errors: string[] = []
    if (!m || typeof m !== 'object') return ['無効なメニューオブジェクト']
    if (!m.size || typeof m.size.width !== 'number' || typeof m.size.height !== 'number') errors.push('size が不正です')
    if (!Array.isArray(m.areas)) errors.push('areas は配列である必要があります')
    if (Array.isArray(m.areas)) {
      if (m.areas.length > 20) errors.push('areas は 20 個以下である必要があります')
      m.areas.forEach((a: any, idx: number) => {
        if (!a.bounds) {
          errors.push(`領域 ${idx + 1}: bounds がありません`)
          return
        }
        const b = a.bounds
        if (typeof b.x !== 'number' || typeof b.y !== 'number' || typeof b.width !== 'number' || typeof b.height !== 'number') {
          errors.push(`領域 ${idx + 1}: bounds の数値が不正です`)
        } else {
          if (b.x < 0 || b.y < 0) errors.push(`領域 ${idx + 1}: x/y は 0 以上である必要があります`)
          if (b.width < 1 || b.height < 1) errors.push(`領域 ${idx + 1}: width/height は 1 以上である必要があります`)
          if (m.size && (b.x + b.width > m.size.width || b.y + b.height > m.size.height)) errors.push(`領域 ${idx + 1}: bounds がメニューサイズを超えています`)
        }
        const aerrs = validateAction(a.action)
        aerrs.forEach(x => errors.push(`領域 ${idx + 1}: ${x}`))
      })
    }
    return errors
  }

  async function copyJson() {
    const errs = validateMenuForAPI(richMenuForAPI)
    if (errs.length) {
      const ok = window.confirm(`検証エラーが見つかりました。続行しますか？\n\n${errs.slice(0,8).join('\n')}${errs.length > 8 ? '\n...（以下省略）' : ''}`)
      if (!ok) return
    }
    await navigator.clipboard.writeText(JSON.stringify(richMenuForAPI, null, 2))
    alert('JSONをクリップボードにコピーしました')
  }

  function downloadJson() {
    const errs = validateMenuForAPI(richMenuForAPI)
    if (errs.length) {
      const ok = window.confirm(`検証エラーが見つかりました。続行してダウンロードしますか？\n\n${errs.slice(0,8).join('\n')}${errs.length > 8 ? '\n...（以下省略）' : ''}`)
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
        const ok = window.confirm(`インポートした JSON に検証エラーがあります。読み込みしますか？\n\n${errs.slice(0,8).join('\n')}${errs.length > 8 ? '\n...（以下省略）' : ''}`)
        if (!ok) return
      }
      setMenu(newMenu)
      setShowImport(false)
    } catch (err) {
      alert('無効なJSONです')
    }
  }

  return (
    <div>
      <h3>JSON（プレビュー）</h3>
      <div className="field">
        <label>LINE Messaging API 用の JSON（プレビュー）</label>
        <textarea style={{height:200}} readOnly value={JSON.stringify(richMenuForAPI, null, 2)} />
      </div>
      <div style={{display:'flex',gap:8}}>
        <button className="btn" onClick={copyJson}>JSONをコピー</button>
        <button className="btn" onClick={downloadJson}>JSONをダウンロード</button>
        <button className="btn secondary" onClick={() => setShowImport(s => !s)}>{showImport ? '閉じる' : 'インポート'}</button>
      </div>

      {showImport && (
        <div style={{marginTop:8}}>
          <label>既存のリッチメニューJSONを貼り付け（またはファイルをドロップ）</label>
          <textarea ref={importRef} style={{width:'100%',height:120}} />
          <div style={{marginTop:6}}>
            <button className="btn" onClick={importFromText}>読み込み</button>
          </div>
        </div>
      )}
    </div>
  )
}
