# LINE Rich Menu API Worker

Cloudflare WorkerでLINE Messaging APIのプロキシとして動作し、GitHub PagesからステートレスにLINE Rich Menuを操作できます。

## セットアップ

1. Cloudflare Workersのアカウントを作成
2. Wranglerをインストール（グローバルまたはローカル）:
   ```bash
   npm install
   ```

3. Wranglerにログイン:
   ```bash
   npx wrangler login
   ```

4. ローカルで開発:
   ```bash
   npm run dev
   ```

5. デプロイ:
   ```bash
   npm run deploy
   ```

## API エンドポイント

すべてのリクエストには `Authorization: Bearer {YOUR_CHANNEL_ACCESS_TOKEN}` ヘッダーが必要です。

### 1. リッチメニューを作成
```
POST /api/richmenu
Content-Type: application/json

{
  "size": { "width": 2500, "height": 1686 },
  "selected": false,
  "name": "My Rich Menu",
  "chatBarText": "タップしてメニューを開く",
  "areas": [
    {
      "bounds": { "x": 0, "y": 0, "width": 1250, "height": 843 },
      "action": { "type": "uri", "uri": "https://example.com" }
    }
  ]
}
```

レスポンス:
```json
{
  "richMenuId": "richmenu-xxxxx"
}
```

### 2. 画像をアップロード
```
POST /api/richmenu/{richMenuId}/content
Content-Type: image/png
Authorization: Bearer {token}

[画像のバイナリデータ]
```

### 2.5. 画像をダウンロード
```
GET /api/richmenu/{richMenuId}/content
Authorization: Bearer {token}
```

レスポンス: 画像のバイナリデータ（Content-Type: image/png または image/jpeg）

### 3. すべてのリッチメニューを取得
```
GET /api/richmenu/list
```

レスポンス:
```json
{
  "richmenus": [
    {
      "richMenuId": "richmenu-xxxxx",
      "size": { "width": 2500, "height": 1686 },
      "selected": false,
      "name": "My Rich Menu",
      "chatBarText": "タップしてメニューを開く",
      "areas": [...]
    }
  ]
}
```

### 4. 特定のリッチメニューを取得
```
GET /api/richmenu/{richMenuId}
```

### 5. リッチメニューを削除
```
DELETE /api/richmenu/{richMenuId}
```

### 6. デフォルトのリッチメニューに設定
```
POST /api/richmenu/{richMenuId}/default
```

### 7. デフォルトのリッチメニューを解除
```
DELETE /api/richmenu/default
```

### 8. 特定ユーザーにリッチメニューをリンク
```
POST /api/user/{userId}/richmenu/{richMenuId}
Authorization: Bearer {token}
```

### 9. 特定ユーザーのリッチメニューリンクを解除
```
DELETE /api/user/{userId}/richmenu
Authorization: Bearer {token}
```

### 10. 特定ユーザーにリンクされているリッチメニューを取得
```
GET /api/user/{userId}/richmenu
Authorization: Bearer {token}
```

レスポンス:
```json
{
  "richMenuId": "richmenu-xxxxx"
}
```

## CORS設定

すべてのエンドポイントはCORS対応しており、GitHub Pagesから直接呼び出すことができます。

## セキュリティ

- チャンネルアクセストークンはクライアント側で管理され、各リクエストのAuthorizationヘッダーに含まれます
- Workerはステートレスで、トークンを保存しません
- 本番環境では、特定のオリジンのみを許可するようにCORS設定を変更することを推奨します
