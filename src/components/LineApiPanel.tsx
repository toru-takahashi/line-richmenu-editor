import React, { useState } from 'react'
import { RichMenu } from '../types'
import { LineApiClient } from '../api/lineApi'

type Props = {
  menu: RichMenu
  imageUrl?: string
  onLoadRichMenu?: (menu: RichMenu, imageDataUrl?: string) => void
}

export default function LineApiPanel({ menu, imageUrl, onLoadRichMenu }: Props) {
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
      setResult('エラー: Worker URLとチャンネルアクセストークンを入力してください')
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
      setResult(`✓ リッチメニュー作成成功!\nRich Menu ID: ${response.richMenuId}`)

      // If image exists, upload it
      if (imageUrl) {
        setResult(prev => prev + '\n\n画像をアップロード中...')
        const imageBlob = await client.imageUrlToBlob(imageUrl)
        await client.uploadRichMenuImage(response.richMenuId, imageBlob)
        setResult(prev => prev + '\n✓ 画像アップロード成功!')
      }

      setResult(prev => prev + '\n\n完了!')
    } catch (error) {
      setResult(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
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
      setResult(`✓ ${response.richmenus?.length || 0}件のリッチメニューを取得しました`)
    } catch (error) {
      setResult(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRichMenu = async (richMenuId: string) => {
    const client = getApiClient()
    if (!client) return

    if (!confirm(`リッチメニュー ${richMenuId} を削除しますか？`)) {
      return
    }

    setLoading(true)
    setResult('')

    try {
      await client.deleteRichMenu(richMenuId)
      setResult(`✓ リッチメニュー ${richMenuId} を削除しました`)
      // Refresh list
      await handleListRichMenus()
    } catch (error) {
      setResult(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
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
      setResult(`✓ リッチメニュー ${richMenuId} をデフォルトに設定しました`)
    } catch (error) {
      setResult(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
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

      // Load into editor
      onLoadRichMenu(loadedMenu, imageDataUrl)
      setResult(`✓ リッチメニュー ${richMenuId} を読み込みました`)

      // Close the modal after loading
      setShowRichMenus(false)
    } catch (error) {
      setResult(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setLoading(false)
    }
  }

  const copyRichMenuId = async () => {
    if (!createdRichMenuId) return
    await navigator.clipboard.writeText(createdRichMenuId)
    alert('リッチメニューIDをクリップボードにコピーしました')
  }

  const handleLinkToUser = async () => {
    const client = getApiClient()
    if (!client) return

    if (!testUserId || !testRichMenuId) {
      setResult('エラー: User IDとリッチメニューIDを入力してください')
      return
    }

    setLoading(true)
    setResult('')

    try {
      await client.linkRichMenuToUser(testUserId, testRichMenuId)
      setResult(`✓ ユーザー ${testUserId} にリッチメニュー ${testRichMenuId} をリンクしました`)
    } catch (error) {
      setResult(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkFromUser = async () => {
    const client = getApiClient()
    if (!client) return

    if (!testUserId) {
      setResult('エラー: User IDを入力してください')
      return
    }

    setLoading(true)
    setResult('')

    try {
      await client.unlinkRichMenuFromUser(testUserId)
      setResult(`✓ ユーザー ${testUserId} からリッチメニューのリンクを解除しました`)
    } catch (error) {
      setResult(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGetUserRichMenu = async () => {
    const client = getApiClient()
    if (!client) return

    if (!testUserId) {
      setResult('エラー: User IDを入力してください')
      return
    }

    setLoading(true)
    setResult('')

    try {
      const response = await client.getUserRichMenu(testUserId)
      setResult(`✓ ユーザー ${testUserId} にリンクされているリッチメニューID:\n${response.richMenuId}`)
      setTestRichMenuId(response.richMenuId)
    } catch (error) {
      setResult(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
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
          <strong>注意:</strong> Worker URLが設定されていません。開発者モードでローカルのWorkerを使用してください。
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
          <span>開発者モード（ローカルテスト用）</span>
        </label>
        <div style={{ fontSize: 11, color: '#666', marginTop: 4, marginLeft: 24 }}>
          有効にすると、カスタムWorker URLを設定できます
        </div>
      </div>

      {developerMode && (
        <div className="field">
          <label>Cloudflare Worker URL（開発者モード）</label>
          <input
            type="text"
            value={customWorkerUrl}
            onChange={(e) => setCustomWorkerUrl(e.target.value)}
            placeholder="http://localhost:8787"
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            ローカル開発用: http://localhost:8787
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
          ✓ サービス提供のAPIエンドポイントを使用中
        </div>
      )}

      <div className="field">
        <label>チャンネルアクセストークン</label>
        <input
          type="password"
          value={channelAccessToken}
          onChange={(e) => setChannelAccessToken(e.target.value)}
          placeholder="Your channel access token"
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          LINE Developersコンソールから取得
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button
          className="btn"
          onClick={handleCreateRichMenu}
          disabled={loading || !workerUrl || !channelAccessToken}
        >
          {loading ? '処理中...' : 'リッチメニューを作成'}
        </button>
        <button
          className="btn secondary"
          onClick={handleListRichMenus}
          disabled={loading || !workerUrl || !channelAccessToken}
        >
          既存メニューを取得
        </button>
      </div>

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
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>作成されたリッチメニューID</div>
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
              コピー
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
            このIDを他のサービスで使用できます
          </div>
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: result.includes('エラー') ? '#fee' : '#efe',
            border: `1px solid ${result.includes('エラー') ? '#fcc' : '#cfc'}`,
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
        <h4 style={{ margin: '0 0 8px 0' }}>テスト機能：特定ユーザーへのリンク</h4>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
          特定のユーザーにリッチメニューをリンクしてテストできます
        </div>

        <div className="field">
          <label>LINE User ID</label>
          <input
            type="text"
            value={testUserId}
            onChange={(e) => setTestUserId(e.target.value)}
            placeholder="U1234567890abcdef1234567890abcdef"
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
          />
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            ※ テストユーザーのUser IDを入力（LINEチャットでユーザー情報を確認）
          </div>
        </div>

        <div className="field">
          <label>リッチメニューID</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={testRichMenuId}
              onChange={(e) => setTestRichMenuId(e.target.value)}
              placeholder="richmenu-xxxxx"
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
            />
            {createdRichMenuId && (
              <button
                className="btn secondary"
                onClick={() => setTestRichMenuId(createdRichMenuId)}
                style={{ padding: '6px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
              >
                作成したIDを使用
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
            ユーザーにリンク
          </button>
          <button
            className="btn secondary"
            onClick={handleGetUserRichMenu}
            disabled={loading || !workerUrl || !channelAccessToken}
            style={{ padding: '6px 12px', fontSize: 13 }}
          >
            現在のリンクを確認
          </button>
          <button
            className="btn secondary"
            onClick={handleUnlinkFromUser}
            disabled={loading || !workerUrl || !channelAccessToken}
            style={{ padding: '6px 12px', fontSize: 13, background: '#fff3cd', color: '#856404' }}
          >
            リンク解除
          </button>
        </div>
      </div>

      {showRichMenus && richMenus.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ margin: 0 }}>既存のリッチメニュー ({richMenus.length}件)</h4>
            <button className="btn secondary" onClick={() => setShowRichMenus(false)} style={{ padding: '4px 8px', fontSize: 12 }}>
              閉じる
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
                        alert('IDをコピーしました')
                      }}
                      style={{ padding: '2px 6px', fontSize: 11 }}
                    >
                      コピー
                    </button>
                  </div>
                  サイズ: {rm.size.width}x{rm.size.height}<br />
                  チャットバー: {rm.chatBarText}<br />
                  領域数: {rm.areas?.length || 0}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className="btn"
                    onClick={() => handleLoadInEditor(rm.richMenuId)}
                    disabled={loading || !onLoadRichMenu}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    エディタで開く
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => handleSetDefault(rm.richMenuId)}
                    disabled={loading}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    デフォルトに設定
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => handleDeleteRichMenu(rm.richMenuId)}
                    disabled={loading}
                    style={{ padding: '4px 8px', fontSize: 12, background: '#fee', color: '#c00' }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
