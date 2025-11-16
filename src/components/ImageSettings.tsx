import React from 'react'
import { RichMenu } from '../types'

type Props = {
  menu: RichMenu
  setMenu: (m: RichMenu) => void
  imageNaturalSize?: { width: number; height: number } | null
  setImageNaturalSize?: (s: { width: number; height: number } | null) => void
}

export default function ImageSettings({ menu, setMenu, imageNaturalSize, setImageNaturalSize }: Props) {
  // keep an error message for validation feedback
  const [imgError, setImgError] = React.useState<string | null>(null)

  // handle local file upload with validation and read as data URL (persistable)
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // validations
    const allowed = ['image/jpeg', 'image/png']
    if (!allowed.includes(file.type)) {
      setImgError('Only JPEG or PNG images are allowed.')
      return
    }
    const maxSize = 1 * 1024 * 1024 // 1MB
    if (file.size > maxSize) {
      setImgError('File size must be 1MB or less.')
      return
    }

    // convert to data URL so it can be persisted in localStorage
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string | null
      if (!result) {
        setImgError('Unable to read file')
        return
      }
      const img = new Image()
      img.src = result
      img.onload = () => {
        const w = img.naturalWidth
        const h = img.naturalHeight
        const aspect = w / h
        if (w < 800 || w > 2500) {
          setImgError('Image width must be between 800 and 2500 pixels.')
          return
        }
        if (h < 250) {
          setImgError('Image height must be at least 250 pixels.')
          return
        }
        if (aspect < 1.45) {
          setImgError('Image aspect ratio (width/height) must be at least 1.45.')
          return
        }

        // all good
        setImgError(null)
        setMenu({ ...menu, imageUrl: result })
        setImageNaturalSize?.({ width: w, height: h })
      }
      img.onerror = () => {
        setImgError('Unable to load image file.')
      }
    }
    reader.onerror = () => {
      setImgError('Unable to read file.')
    }
    reader.readAsDataURL(file)
  }
  return (
    <div>
      <div className="field">
        <label>メニュー名</label>
        <input
          type="text"
          value={menu.name}
          onChange={(e) => setMenu({ ...menu, name: e.target.value })}
        />
      </div>

      <div className="field">
        <label>開閉ボタンのテキスト</label>
        <input
          type="text"
          value={menu.chatBarText}
          onChange={(e) => setMenu({ ...menu, chatBarText: e.target.value })}
        />
      </div>

      <div className="field">
        <label>デフォルトでメニューを開く</label>
        <select
          value={menu.selected ? 'true' : 'false'}
          onChange={(e) => setMenu({ ...menu, selected: e.target.value === 'true' })}
        >
          <option value="false">いいえ</option>
          <option value="true">はい</option>
        </select>
      </div>

      <div className="field">
        <label>背景画像のURL</label>
        <input
          type="text"
          value={menu.imageUrl || ''}
          onChange={(e) => setMenu({ ...menu, imageUrl: e.target.value })}
          placeholder="https://... (CDN)"
        />
        <div style={{marginTop:8}}>
          <label style={{display:'block',fontSize:13,marginBottom:6}}>または画像をアップロード（JPEG/PNG、最大1MB）</label>
          <input type="file" accept="image/png,image/jpeg" onChange={handleFile} />
        </div>
        {imgError && <div className="hint">{imgError}</div>}
        {imageNaturalSize && (
          <div className="small">画像サイズ: {imageNaturalSize.width} x {imageNaturalSize.height} px</div>
        )}
        {imageNaturalSize && (imageNaturalSize.width !== menu.size.width || imageNaturalSize.height !== menu.size.height) && (
          <div className="hint">推奨サイズは {menu.size.width} x {menu.size.height} px です。異なるサイズの画像が選択されています。</div>
        )}
        <div style={{marginTop:10}}>
          <a href="https://www.canva.com/ja_jp/line-rich-menu/templates/" target="_blank" rel="noreferrer">Canva テンプレ</a>
        </div>
      </div>
        {/* 厳密な制約チェック */}
        {imageNaturalSize && (
          <div style={{marginTop:6}}>
            {imageNaturalSize.width < 800 && <div className="hint">画像幅は少なくとも800px以上である必要があります。</div>}
            {imageNaturalSize.width > 2500 && <div className="hint">画像幅は2500px以下である必要があります。</div>}
            {imageNaturalSize.height < 250 && <div className="hint">画像高さは250px以上である必要があります。</div>}
            {imageNaturalSize.width / imageNaturalSize.height < 1.45 && <div className="hint">画像のアスペクト比（幅÷高さ）は1.45以上である必要があります。</div>}
          </div>
        )}
    </div>
  )
}
