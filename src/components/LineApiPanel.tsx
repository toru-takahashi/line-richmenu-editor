import React, { useState } from 'react'
import { RichMenu } from '../types'
import { LineApiClient, LineApiError } from '../api/lineApi'
import { useI18n } from '../i18n/useI18n'

type Props = {
  menu: RichMenu
  imageUrl?: string
  onLoadRichMenu?: (menu: RichMenu, imageDataUrl?: string, richMenuId?: string) => void
  currentRichMenuId?: string | null
}

export default function LineApiPanel({ menu, imageUrl, onLoadRichMenu, currentRichMenuId }: Props) {
  const { t } = useI18n()
  // Get configured Worker URL from environment variable
  const configuredWorkerUrl = import.meta.env.VITE_WORKER_URL || ''

  const [developerMode, setDeveloperMode] = useState<boolean>(() => {
    return localStorage.getItem('developer_mode') === 'true'
  })
  const [customWorkerUrl, setCustomWorkerUrl] = useState<string>(() => {
    return localStorage.getItem('line_worker_url') || ''
  })
  const [channelAccessToken, setChannelAccessToken] = useState<string>(() => {
    return localStorage.getItem('line_channel_token') || ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [createdRichMenuId, setCreatedRichMenuId] = useState<string | null>(null)
  const [richMenus, setRichMenus] = useState<any[]>([])
  const [showRichMenus, setShowRichMenus] = useState(false)
  const [testUserId, setTestUserId] = useState<string>('')
  const [testRichMenuId, setTestRichMenuId] = useState<string>('')

  // Rich Menu Alias states
  const [aliases, setAliases] = useState<any[]>([])
  const [showAliases, setShowAliases] = useState(false)
  const [newAliasId, setNewAliasId] = useState<string>('')
  const [newAliasRichMenuId, setNewAliasRichMenuId] = useState<string>('')
  const [showRegisterAlias, setShowRegisterAlias] = useState(false)
  const [registerAliasMenuId, setRegisterAliasMenuId] = useState<string>('')
  const [registerAliasId, setRegisterAliasId] = useState<string>('')

  // Determine which Worker URL to use
  const workerUrl = developerMode ? customWorkerUrl : configuredWorkerUrl

  // Save to localStorage when values change
  React.useEffect(() => {
    localStorage.setItem('developer_mode', developerMode.toString())
  }, [developerMode])

  React.useEffect(() => {
    if (customWorkerUrl) localStorage.setItem('line_worker_url', customWorkerUrl)
  }, [customWorkerUrl])

  React.useEffect(() => {
    if (channelAccessToken) localStorage.setItem('line_channel_token', channelAccessToken)
  }, [channelAccessToken])

  const getApiClient = (): LineApiClient | null => {
    if (!workerUrl || !channelAccessToken) {
      setResult(t('errorWorkerUrlRequired'))
      return null
    }
    return new LineApiClient({ workerUrl, channelAccessToken })
  }

  const handleCreateRichMenu = async () => {
    const client = getApiClient()
    if (!client) return

    setLoading(true)
    setResult('')

    try {
      // Create rich menu
      const richMenuData = {
        size: menu.size,
        selected: menu.selected,
        name: menu.name,
        chatBarText: menu.chatBarText,
        areas: menu.areas,
      }

      const response = await client.createRichMenu(richMenuData)
      setCreatedRichMenuId(response.richMenuId)
      setResult(t('richMenuCreated', { richMenuId: response.richMenuId }))

      // If image exists, upload it
      if (imageUrl) {
        setResult(prev => prev + t('uploadingImage'))
        const imageBlob = await client.imageUrlToBlob(imageUrl)
        await client.uploadRichMenuImage(response.richMenuId, imageBlob)
        setResult(prev => prev + t('imageUploaded'))
      }

      setResult(prev => prev + t('completed'))
    } catch (error) {
      if (error instanceof LineApiError) {
        setResult(t('error', { message: error.getDetailedMessage() }))
      } else {
        setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleListRichMenus = async () => {
    const client = getApiClient()
    if (!client) return

    setLoading(true)
    setResult('')

    try {
      const response = await client.listRichMenus()
      setRichMenus(response.richmenus || [])
      setShowRichMenus(true)
      setResult(t('richMenusCount', { count: (response.richmenus?.length || 0).toString() }))
    } catch (error) {
      setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRichMenu = async (richMenuId: string) => {
    const client = getApiClient()
    if (!client) return

    if (!confirm(t('deleteConfirm', { richMenuId }))) {
      return
    }

    setLoading(true)
    setResult('')

    try {
      await client.deleteRichMenu(richMenuId)
      setResult(t('richMenuDeleted', { richMenuId }))
      // Refresh list
      await handleListRichMenus()
    } catch (error) {
      setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (richMenuId: string) => {
    const client = getApiClient()
    if (!client) return

    setLoading(true)
    setResult('')

    try {
      await client.setDefaultRichMenu(richMenuId)
      setResult(t('richMenuSetDefault', { richMenuId }))
    } catch (error) {
      setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setLoading(false)
    }
  }

  const handleLoadInEditor = async (richMenuId: string) => {
    const client = getApiClient()
    if (!client || !onLoadRichMenu) return

    setLoading(true)
    setResult('')

    try {
      // Get rich menu data
      const richMenuData = await client.getRichMenu(richMenuId)

      // Download image
      let imageDataUrl: string | undefined
      try {
        const imageBlob = await client.downloadRichMenuImage(richMenuId)
        imageDataUrl = await client.blobToDataUrl(imageBlob)
      } catch (error) {
        console.warn('Failed to download image:', error)
        // Continue even if image download fails
      }

      // Convert to RichMenu format
      const loadedMenu: RichMenu = {
        size: richMenuData.size,
        selected: richMenuData.selected,
        name: richMenuData.name,
        chatBarText: richMenuData.chatBarText,
        areas: richMenuData.areas || [],
        imageUrl: imageDataUrl,
      }

      // Load into editor with richMenuId
      onLoadRichMenu(loadedMenu, imageDataUrl, richMenuId)
      setResult(t('richMenuLoaded', { richMenuId }))

      // Close the modal after loading
      setShowRichMenus(false)
    } catch (error) {
      setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setLoading(false)
    }
  }

  const copyRichMenuId = async () => {
    if (!createdRichMenuId) return
    await navigator.clipboard.writeText(createdRichMenuId)
    alert(t('copiedIdToClipboard'))
  }

  const handleLinkToUser = async () => {
    const client = getApiClient()
    if (!client) return

    if (!testUserId || !testRichMenuId) {
      setResult(t('errorUserIdAndMenuIdRequired'))
      return
    }

    setLoading(true)
    setResult('')

    try {
      await client.linkRichMenuToUser(testUserId, testRichMenuId)
      setResult(t('userLinked', { userId: testUserId, richMenuId: testRichMenuId }))
    } catch (error) {
      setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkFromUser = async () => {
    const client = getApiClient()
    if (!client) return

    if (!testUserId) {
      setResult(t('errorUserIdRequired'))
      return
    }

    setLoading(true)
    setResult('')

    try {
      await client.unlinkRichMenuFromUser(testUserId)
      setResult(t('userUnlinked', { userId: testUserId }))
    } catch (error) {
      setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setLoading(false)
    }
  }

  const handleGetUserRichMenu = async () => {
    const client = getApiClient()
    if (!client) return

    if (!testUserId) {
      setResult(t('errorUserIdRequired'))
      return
    }

    setLoading(true)
    setResult('')

    try {
      const response = await client.getUserRichMenu(testUserId)
      setResult(t('userRichMenuId', { userId: testUserId, richMenuId: response.richMenuId }))
      setTestRichMenuId(response.richMenuId)
    } catch (error) {
      setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setLoading(false)
    }
  }

  const handleListAliases = async () => {
    const client = getApiClient()
    if (!client) return

    setLoading(true)
    setResult('')

    try {
      const response = await client.listRichMenuAliases()
      setAliases(response.aliases || [])
      setShowAliases(true)
      setResult(t('aliasesCount', { count: (response.aliases?.length || 0).toString() }))
    } catch (error) {
      if (error instanceof LineApiError) {
        setResult(t('error', { message: error.getDetailedMessage() }))
      } else {
        setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlias = async () => {
    const client = getApiClient()
    if (!client) return

    if (!newAliasId || !newAliasRichMenuId) {
      setResult(t('errorAliasFieldsRequired'))
      return
    }

    setLoading(true)
    setResult('')

    try {
      // Check if alias already exists
      let aliasExists = false
      try {
        await client.getRichMenuAlias(newAliasId)
        aliasExists = true
      } catch (error) {
        // Alias doesn't exist, which is fine for create
        aliasExists = false
      }

      if (aliasExists) {
        // Update existing alias
        await client.updateRichMenuAlias(newAliasId, newAliasRichMenuId)
        setResult(t('aliasUpdated', { aliasId: newAliasId, richMenuId: newAliasRichMenuId }))
      } else {
        // Create new alias
        await client.createRichMenuAlias(newAliasId, newAliasRichMenuId)
        setResult(t('aliasCreated', { aliasId: newAliasId, richMenuId: newAliasRichMenuId }))
      }

      setNewAliasId('')
      setNewAliasRichMenuId('')
      // Refresh list if it's shown
      if (showAliases) {
        await handleListAliases()
      }
    } catch (error) {
      if (error instanceof LineApiError) {
        setResult(t('error', { message: error.getDetailedMessage() }))
      } else {
        setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAlias = async (aliasId: string, newRichMenuId: string) => {
    const client = getApiClient()
    if (!client) return

    setLoading(true)
    setResult('')

    try {
      await client.updateRichMenuAlias(aliasId, newRichMenuId)
      setResult(t('aliasUpdated', { aliasId, richMenuId: newRichMenuId }))
      // Refresh list
      await handleListAliases()
    } catch (error) {
      if (error instanceof LineApiError) {
        setResult(t('error', { message: error.getDetailedMessage() }))
      } else {
        setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAlias = async (aliasId: string) => {
    const client = getApiClient()
    if (!client) return

    if (!confirm(t('deleteAliasConfirm', { aliasId }))) {
      return
    }

    setLoading(true)
    setResult('')

    try {
      await client.deleteRichMenuAlias(aliasId)
      setResult(t('aliasDeleted', { aliasId }))
      // Refresh list
      await handleListAliases()
    } catch (error) {
      if (error instanceof LineApiError) {
        setResult(t('error', { message: error.getDetailedMessage() }))
      } else {
        setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterAsAlias = async () => {
    const client = getApiClient()
    if (!client) return

    if (!registerAliasId || !registerAliasMenuId) {
      setResult(t('errorAliasFieldsRequired'))
      return
    }

    setLoading(true)
    setResult('')

    try {
      // Check if alias already exists
      let aliasExists = false
      try {
        await client.getRichMenuAlias(registerAliasId)
        aliasExists = true
      } catch (error) {
        aliasExists = false
      }

      if (aliasExists) {
        // Update existing alias
        await client.updateRichMenuAlias(registerAliasId, registerAliasMenuId)
        setResult(t('aliasUpdated', { aliasId: registerAliasId, richMenuId: registerAliasMenuId }))
      } else {
        // Create new alias
        await client.createRichMenuAlias(registerAliasId, registerAliasMenuId)
        setResult(t('aliasCreated', { aliasId: registerAliasId, richMenuId: registerAliasMenuId }))
      }

      // Reset registration form
      setRegisterAliasId('')
      setRegisterAliasMenuId('')
      setShowRegisterAlias(false)

      // Refresh list if it's shown
      if (showAliases) {
        await handleListAliases()
      }
    } catch (error) {
      if (error instanceof LineApiError) {
        setResult(t('error', { message: error.getDetailedMessage() }))
      } else {
        setResult(t('error', { message: error instanceof Error ? error.message : 'Unknown error' }))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Developer Mode Toggle */}
      {!configuredWorkerUrl && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: 4,
          padding: 12,
          marginBottom: 16,
          fontSize: 13,
        }}>
          {t('workerUrlMissing')}
        </div>
      )}

      <div className="field" style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={developerMode}
            onChange={(e) => setDeveloperMode(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          <span>{t('developerMode')}</span>
        </label>
        <div style={{ fontSize: 11, color: '#666', marginTop: 4, marginLeft: 24 }}>
          {t('developerModeNote')}
        </div>
      </div>

      {developerMode && (
        <div className="field">
          <label>{t('cloudflareWorkerUrl')}</label>
          <input
            type="text"
            value={customWorkerUrl}
            onChange={(e) => setCustomWorkerUrl(e.target.value)}
            placeholder={t('cloudflareWorkerPlaceholder')}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {t('localDevNote')}
          </div>
        </div>
      )}

      {!developerMode && configuredWorkerUrl && (
        <div style={{
          background: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: 4,
          padding: 10,
          marginBottom: 12,
          fontSize: 12,
        }}>
          {t('serviceApiInUse')}
        </div>
      )}

      <div className="field">
        <label>{t('channelAccessToken')}</label>
        <input
          type="password"
          value={channelAccessToken}
          onChange={(e) => setChannelAccessToken(e.target.value)}
          placeholder={t('channelAccessTokenPlaceholder')}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          {t('getFromLineDevelopers')}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button
          className="btn"
          onClick={handleCreateRichMenu}
          disabled={loading || !workerUrl || !channelAccessToken}
        >
          {loading ? t('processing') : t('createRichMenu')}
        </button>
        <button
          className="btn"
          onClick={handleListRichMenus}
          disabled={loading || !workerUrl || !channelAccessToken}
        >
          {t('getExistingMenus')}
        </button>
        <button
          className="btn"
          onClick={handleListAliases}
          disabled={loading || !workerUrl || !channelAccessToken}
        >
          {t('getExistingAliases')}
        </button>
      </div>

      {/* Display current loaded rich menu ID */}
      {currentRichMenuId && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: 4,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>{t('currentRichMenuId')}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={currentRichMenuId}
              readOnly
              style={{
                flex: 1,
                padding: '6px 8px',
                fontFamily: 'monospace',
                fontSize: 13,
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: 3,
              }}
            />
            <button
              className="btn secondary"
              onClick={() => {
                navigator.clipboard.writeText(currentRichMenuId)
                alert(t('copiedIdToClipboard'))
              }}
              style={{ padding: '6px 12px', fontSize: 13 }}
            >
              {t('copy')}
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
            {t('loadedMenuIdNote')}
          </div>
        </div>
      )}

      {/* Display created rich menu ID */}
      {createdRichMenuId && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: '#f0f8ff',
            border: '1px solid #b0d4ff',
            borderRadius: 4,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>{t('createdRichMenuId')}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={createdRichMenuId}
              readOnly
              style={{
                flex: 1,
                padding: '6px 8px',
                fontFamily: 'monospace',
                fontSize: 13,
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: 3,
              }}
            />
            <button
              className="btn secondary"
              onClick={copyRichMenuId}
              style={{ padding: '6px 12px', fontSize: 13 }}
            >
              {t('copy')}
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
            {t('useThisIdNote')}
          </div>
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: result.toLowerCase().includes('error') || result.includes('エラー') ? '#fee' : '#efe',
            border: `1px solid ${result.toLowerCase().includes('error') || result.includes('エラー') ? '#fcc' : '#cfc'}`,
            borderRadius: 4,
            whiteSpace: 'pre-wrap',
            fontSize: 13,
          }}
        >
          {result}
        </div>
      )}

      {/* Test: Link rich menu to specific user */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #ddd' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>{t('testFeatureTitle')}</h4>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
          {t('testFeatureDescription')}
        </div>

        <div className="field">
          <label>{t('lineUserId')}</label>
          <input
            type="text"
            value={testUserId}
            onChange={(e) => setTestUserId(e.target.value)}
            placeholder={t('lineUserIdPlaceholder')}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
          />
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            {t('lineUserIdNote')}
          </div>
        </div>

        <div className="field">
          <label>{t('richMenuId')}</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={testRichMenuId}
              onChange={(e) => setTestRichMenuId(e.target.value)}
              placeholder={t('richMenuIdPlaceholder')}
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
            />
            {createdRichMenuId && (
              <button
                className="btn secondary"
                onClick={() => setTestRichMenuId(createdRichMenuId)}
                style={{ padding: '6px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
              >
                {t('useCreatedId')}
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <button
            className="btn"
            onClick={handleLinkToUser}
            disabled={loading || !workerUrl || !channelAccessToken}
            style={{ padding: '6px 12px', fontSize: 13 }}
          >
            {t('linkToUser')}
          </button>
          <button
            className="btn secondary"
            onClick={handleGetUserRichMenu}
            disabled={loading || !workerUrl || !channelAccessToken}
            style={{ padding: '6px 12px', fontSize: 13 }}
          >
            {t('checkCurrentLink')}
          </button>
          <button
            className="btn secondary"
            onClick={handleUnlinkFromUser}
            disabled={loading || !workerUrl || !channelAccessToken}
            style={{ padding: '6px 12px', fontSize: 13, background: '#fff3cd', color: '#856404' }}
          >
            {t('unlink')}
          </button>
        </div>
      </div>

      {showRichMenus && richMenus.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ margin: 0 }}>{t('existingRichMenus', { count: richMenus.length.toString() })}</h4>
            <button className="btn secondary" onClick={() => setShowRichMenus(false)} style={{ padding: '4px 8px', fontSize: 12 }}>
              {t('close')}
            </button>
          </div>
          <div style={{ maxHeight: 500, overflow: 'auto', border: '1px solid #ddd', borderRadius: 4 }}>
            {richMenus.map((rm) => (
              <div
                key={rm.richMenuId}
                style={{
                  padding: 12,
                  borderBottom: '1px solid #eee',
                  background: '#fff',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{rm.name}</div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>ID:</span>
                    <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3, fontSize: 11, flex: 1 }}>
                      {rm.richMenuId}
                    </code>
                    <button
                      className="btn secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(rm.richMenuId)
                        alert(t('idCopied'))
                      }}
                      style={{ padding: '2px 6px', fontSize: 11 }}
                    >
                      {t('copy')}
                    </button>
                  </div>
                  {t('size')}: {rm.size.width}x{rm.size.height}<br />
                  {t('chatBar')}: {rm.chatBarText}<br />
                  {t('areaCount')}: {rm.areas?.length || 0}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className="btn"
                    onClick={() => handleLoadInEditor(rm.richMenuId)}
                    disabled={loading || !onLoadRichMenu}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    {t('openInEditor')}
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => handleSetDefault(rm.richMenuId)}
                    disabled={loading}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    {t('setAsDefault')}
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setRegisterAliasMenuId(rm.richMenuId)
                      setShowRegisterAlias(true)
                    }}
                    disabled={loading}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    {t('registerAsAlias')}
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => handleDeleteRichMenu(rm.richMenuId)}
                    disabled={loading}
                    style={{ padding: '4px 8px', fontSize: 12, background: '#fee', color: '#c00' }}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create New Alias Form - Always accessible */}
      <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
        <h5 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>{t('createNewAlias')}</h5>
        <div className="field" style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12 }}>{t('aliasId')}</label>
          <input
            type="text"
            value={newAliasId}
            onChange={(e) => setNewAliasId(e.target.value)}
            placeholder={t('aliasIdPlaceholder')}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
            maxLength={32}
          />
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
            {t('aliasIdNote')}
          </div>
        </div>
        <div className="field" style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12 }}>{t('linkedRichMenuId')}</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={newAliasRichMenuId}
              onChange={(e) => setNewAliasRichMenuId(e.target.value)}
              placeholder="richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
            />
            {(createdRichMenuId || currentRichMenuId) && (
              <button
                className="btn secondary"
                onClick={() => setNewAliasRichMenuId(createdRichMenuId || currentRichMenuId || '')}
                style={{ padding: '6px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
              >
                {t('useCreatedId')}
              </button>
            )}
          </div>
        </div>
        <button
          className="btn"
          onClick={handleCreateAlias}
          disabled={loading || !newAliasId || !newAliasRichMenuId}
          style={{ padding: '6px 12px', fontSize: 13 }}
        >
          {t('createAlias')}
        </button>
      </div>

      {/* Rich Menu Aliases List Section */}
      {showAliases && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>{t('richMenuAliases')}</h4>
            <button className="btn secondary" onClick={() => setShowAliases(false)} style={{ padding: '4px 8px', fontSize: 12 }}>
              {t('close')}
            </button>
          </div>

          {/* Aliases List */}
          {aliases.length > 0 && (
            <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid #ddd', borderRadius: 4 }}>
              {aliases.map((alias) => (
                <AliasItem
                  key={alias.richMenuAliasId}
                  alias={alias}
                  loading={loading}
                  onUpdate={handleUpdateAlias}
                  onDelete={handleDeleteAlias}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Register as Alias Modal */}
      {showRegisterAlias && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowRegisterAlias(false)}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              maxWidth: 500,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>{t('registerAsAlias')}</h4>
            <div className="field" style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12 }}>{t('richMenuId')}</label>
              <input
                type="text"
                value={registerAliasMenuId}
                readOnly
                style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, background: '#f5f5f5' }}
              />
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12 }}>{t('aliasId')}</label>
              <input
                type="text"
                value={registerAliasId}
                onChange={(e) => setRegisterAliasId(e.target.value)}
                placeholder={t('aliasIdPlaceholder')}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
                maxLength={32}
              />
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                {t('aliasIdNote')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="btn"
                onClick={handleRegisterAsAlias}
                disabled={loading || !registerAliasId}
                style={{ padding: '6px 12px', fontSize: 13 }}
              >
                {t('registerAsAlias')}
              </button>
              <button
                className="btn secondary"
                onClick={() => {
                  setShowRegisterAlias(false)
                  setRegisterAliasId('')
                  setRegisterAliasMenuId('')
                }}
                disabled={loading}
                style={{ padding: '6px 12px', fontSize: 13 }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Separate component for Alias Item with inline editing
function AliasItem({ alias, loading, onUpdate, onDelete, t }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [editRichMenuId, setEditRichMenuId] = useState(alias.richMenuId)

  const handleUpdate = () => {
    onUpdate(alias.richMenuAliasId, editRichMenuId)
    setIsEditing(false)
  }

  return (
    <div
      style={{
        padding: 12,
        borderBottom: '1px solid #eee',
        background: '#fff',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
        {t('aliasIdLabel')}: <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3, fontSize: 12 }}>{alias.richMenuAliasId}</code>
      </div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontWeight: 500 }}>{t('linkedRichMenuId')}:</span>
            <input
              type="text"
              value={editRichMenuId}
              onChange={(e) => setEditRichMenuId(e.target.value)}
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 11, padding: '4px 6px' }}
            />
          </div>
        ) : (
          <div>
            <span style={{ fontWeight: 500 }}>{t('linkedRichMenuId')}:</span>{' '}
            <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3, fontSize: 11 }}>
              {alias.richMenuId}
            </code>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {isEditing ? (
          <>
            <button
              className="btn"
              onClick={handleUpdate}
              disabled={loading || !editRichMenuId || editRichMenuId === alias.richMenuId}
              style={{ padding: '4px 8px', fontSize: 12 }}
            >
              {t('save')}
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                setIsEditing(false)
                setEditRichMenuId(alias.richMenuId)
              }}
              disabled={loading}
              style={{ padding: '4px 8px', fontSize: 12 }}
            >
              {t('cancel')}
            </button>
          </>
        ) : (
          <>
            <button
              className="btn secondary"
              onClick={() => setIsEditing(true)}
              disabled={loading}
              style={{ padding: '4px 8px', fontSize: 12 }}
            >
              {t('edit')}
            </button>
            <button
              className="btn secondary"
              onClick={() => onDelete(alias.richMenuAliasId)}
              disabled={loading}
              style={{ padding: '4px 8px', fontSize: 12, background: '#fee', color: '#c00' }}
            >
              {t('delete')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
