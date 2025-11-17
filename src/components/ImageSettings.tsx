import React from 'react'
import { RichMenu } from '../types'
import { useI18n } from '../i18n/useI18n'

type Props = {
  menu: RichMenu
  setMenu: (m: RichMenu) => void
  imageNaturalSize?: { width: number; height: number } | null
  setImageNaturalSize?: (s: { width: number; height: number } | null) => void
}

export default function ImageSettings({ menu, setMenu, imageNaturalSize, setImageNaturalSize }: Props) {
  const { t } = useI18n()
  // keep an error message for validation feedback
  const [imgError, setImgError] = React.useState<string | null>(null)

  // handle local file upload with validation and read as data URL (persistable)
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // validations
    const allowed = ['image/jpeg', 'image/png']
    if (!allowed.includes(file.type)) {
      setImgError(t('onlyJpegPng'))
      return
    }
    const maxSize = 1 * 1024 * 1024 // 1MB
    if (file.size > maxSize) {
      setImgError(t('fileSizeLimit'))
      return
    }

    // convert to data URL so it can be persisted in localStorage
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string | null
      if (!result) {
        setImgError(t('unableToRead'))
        return
      }
      const img = new Image()
      img.src = result
      img.onload = () => {
        const w = img.naturalWidth
        const h = img.naturalHeight
        const aspect = w / h
        if (w < 800 || w > 2500) {
          setImgError(t('imageWidthRange'))
          return
        }
        if (h < 250) {
          setImgError(t('imageHeightMinError'))
          return
        }
        if (aspect < 1.45) {
          setImgError(t('imageAspectRatioError'))
          return
        }

        // all good
        setImgError(null)
        setMenu({ ...menu, imageUrl: result })
        setImageNaturalSize?.({ width: w, height: h })
      }
      img.onerror = () => {
        setImgError(t('unableToLoad'))
      }
    }
    reader.onerror = () => {
      setImgError(t('unableToRead'))
    }
    reader.readAsDataURL(file)
  }
  return (
    <div>
      <div className="field">
        <label>{t('menuName')}</label>
        <input
          type="text"
          value={menu.name}
          onChange={(e) => setMenu({ ...menu, name: e.target.value })}
        />
      </div>

      <div className="field">
        <label>{t('chatBarText')}</label>
        <input
          type="text"
          value={menu.chatBarText}
          onChange={(e) => setMenu({ ...menu, chatBarText: e.target.value })}
        />
      </div>

      <div className="field">
        <label>{t('defaultMenuOpen')}</label>
        <select
          value={menu.selected ? 'true' : 'false'}
          onChange={(e) => setMenu({ ...menu, selected: e.target.value === 'true' })}
        >
          <option value="false">{t('no')}</option>
          <option value="true">{t('yes')}</option>
        </select>
      </div>

      <div className="field">
        <label>{t('backgroundImageUrl')}</label>
        <input
          type="text"
          value={menu.imageUrl || ''}
          onChange={(e) => setMenu({ ...menu, imageUrl: e.target.value })}
          placeholder={t('backgroundImageUrlPlaceholder')}
        />
        <div style={{marginTop:8}}>
          <label style={{display:'block',fontSize:13,marginBottom:6}}>{t('orUploadImage')}</label>
          <input type="file" accept="image/png,image/jpeg" onChange={handleFile} />
        </div>
        {imgError && <div className="hint">{imgError}</div>}
        {imageNaturalSize && (
          <div className="small">{t('imageSize')}: {imageNaturalSize.width} x {imageNaturalSize.height} px</div>
        )}
        {imageNaturalSize && (imageNaturalSize.width !== menu.size.width || imageNaturalSize.height !== menu.size.height) && (
          <div className="hint">{t('recommendedSize', { width: menu.size.width.toString(), height: menu.size.height.toString() })}</div>
        )}
        <div style={{marginTop:10}}>
          <a href="https://www.canva.com/ja_jp/line-rich-menu/templates/" target="_blank" rel="noreferrer">{t('canvaTemplate')}</a>
        </div>
      </div>
        {/* 厳密な制約チェック */}
        {imageNaturalSize && (
          <div style={{marginTop:6}}>
            {imageNaturalSize.width < 800 && <div className="hint">{t('imageWidthMin')}</div>}
            {imageNaturalSize.width > 2500 && <div className="hint">{t('imageWidthMax')}</div>}
            {imageNaturalSize.height < 250 && <div className="hint">{t('imageHeightMin')}</div>}
            {imageNaturalSize.width / imageNaturalSize.height < 1.45 && <div className="hint">{t('imageAspectRatio')}</div>}
          </div>
        )}
    </div>
  )
}
