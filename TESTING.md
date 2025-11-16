# テスト手順

LINE Rich Menu EditorとCloudflare Worker連携機能をテストするための手順です。

## 前提条件

1. LINE Developersアカウントとチャンネルを作成済み
2. チャンネルアクセストークンを取得済み
3. Node.js がインストールされている

## 1. Web UIのローカルテスト

### セットアップ

```bash
# プロジェクトルートで依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:5173 （または表示されたURL）にアクセス

### テスト項目

#### 基本機能
- [ ] 画像をアップロードできる（ローカルファイルまたはURL）
- [ ] キャンバス上でドラッグしてエリアを作成できる
- [ ] エリアを選択・移動・リサイズできる
- [ ] 右パネルでエリアのアクションを編集できる
- [ ] JSONプレビューが表示される
- [ ] JSONをコピー・ダウンロードできる

#### テンプレート機能
- [ ] テンプレートを選択してエリアが自動作成される
- [ ] 既存のエリアを削除してから新しいテンプレートを適用できる

#### JSON インポート
- [ ] 既存のJSONを貼り付けて読み込める
- [ ] 読み込み後、エリアとアクションが正しく復元される

## 2. Cloudflare Worker のローカルテスト

### セットアップ

```bash
# workerディレクトリに移動
cd worker

# 依存関係をインストール
npm install

# Wranglerにログイン（初回のみ）
npx wrangler login

# ローカル開発サーバーを起動
npm run dev
```

ローカルWorkerが起動します（通常は http://localhost:8787）

### テスト項目（curlまたはPostmanを使用）

#### 1. リッチメニュー作成

```bash
curl -X POST http://localhost:8787/api/richmenu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN" \
  -d '{
    "size": { "width": 2500, "height": 1686 },
    "selected": false,
    "name": "Test Menu",
    "chatBarText": "タップ",
    "areas": [{
      "bounds": { "x": 0, "y": 0, "width": 1250, "height": 843 },
      "action": { "type": "uri", "uri": "https://example.com" }
    }]
  }'
```

期待される結果: `{"richMenuId": "richmenu-xxxxx"}`

#### 2. リッチメニュー一覧取得

```bash
curl http://localhost:8787/api/richmenu/list \
  -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN"
```

期待される結果: リッチメニューの配列

#### 3. 特定のリッチメニュー取得

```bash
curl http://localhost:8787/api/richmenu/RICHMENU_ID \
  -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN"
```

#### 4. 画像アップロード

```bash
curl -X POST http://localhost:8787/api/richmenu/RICHMENU_ID/content \
  -H "Content-Type: image/png" \
  -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN" \
  --data-binary @/path/to/image.png
```

#### 5. デフォルトに設定

```bash
curl -X POST http://localhost:8787/api/richmenu/RICHMENU_ID/default \
  -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN"
```

#### 6. 画像ダウンロード

```bash
curl http://localhost:8787/api/richmenu/RICHMENU_ID/content \
  -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN" \
  --output downloaded_image.png
```

期待される結果: 画像ファイルがダウンロードされる

#### 7. リッチメニュー削除

```bash
curl -X DELETE http://localhost:8787/api/richmenu/RICHMENU_ID \
  -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN"
```

#### 8. 特定ユーザーにリッチメニューをリンク

```bash
curl -X POST http://localhost:8787/api/user/USER_ID/richmenu/RICHMENU_ID \
  -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN"
```

期待される結果: `{"message":"Rich menu linked to user successfully"}`

#### 9. ユーザーのリッチメニューリンクを確認

```bash
curl http://localhost:8787/api/user/USER_ID/richmenu \
  -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN"
```

期待される結果: `{"richMenuId":"richmenu-xxxxx"}`

#### 10. ユーザーのリッチメニューリンクを解除

```bash
curl -X DELETE http://localhost:8787/api/user/USER_ID/richmenu \
  -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN"
```

期待される結果: `{"message":"Rich menu unlinked from user successfully"}`

## 3. 統合テスト（Web UI + Worker）

### セットアップ

1. Web UIとWorkerの両方をローカルで起動
2. Web UIで「LINE API連携」ボタンをクリック
3. 設定を入力：
   - Worker URL: `http://localhost:8787`
   - チャンネルアクセストークン: あなたのトークン

### テスト項目

#### リッチメニュー作成
- [ ] 画像をアップロード
- [ ] エリアを作成してアクションを設定
- [ ] 「LINE API連携」を開く
- [ ] 「リッチメニューを作成」ボタンをクリック
- [ ] 成功メッセージが表示される
- [ ] 作成されたリッチメニューIDが専用エリアに表示される
- [ ] 「コピー」ボタンでIDをクリップボードにコピーできる
- [ ] LINE公式アカウントで確認（実際のLINEアプリで表示されるか）

#### 既存メニュー管理
- [ ] 「既存メニューを取得」をクリック
- [ ] リッチメニュー一覧が表示される（件数も表示される）
- [ ] 各メニューの情報（名前、ID、サイズ、領域数など）が正しく表示される
- [ ] 各メニューのIDの横に「コピー」ボタンが表示される
- [ ] 「コピー」ボタンでIDをクリップボードにコピーできる
- [ ] 「エディタで開く」をクリック
- [ ] メニュー情報と画像がエディタに読み込まれる（画像はLINE APIから自動ダウンロード）
- [ ] 読み込まれた画像が正しく表示される
- [ ] 読み込まれたエリアとアクションが正しく表示される
- [ ] エリアを編集できる
- [ ] 編集後「リッチメニューを作成」で新しいメニューとして保存できる
- [ ] 「デフォルトに設定」をクリックして設定できる
- [ ] 「削除」をクリックして削除できる

#### テスト機能：特定ユーザーへのリンク
- [ ] テストユーザーのUser IDを入力
- [ ] リッチメニューIDを入力（または「作成したIDを使用」ボタンで自動入力）
- [ ] 「ユーザーにリンク」をクリック
- [ ] 成功メッセージが表示される
- [ ] 対象ユーザーのLINEアプリでリッチメニューが表示される
- [ ] 「現在のリンクを確認」でリンクされているメニューIDが表示される
- [ ] 「リンク解除」でリンクを解除できる
- [ ] リンク解除後、ユーザーにはデフォルトメニューまたはメニューなしの状態になる

## 4. 本番環境デプロイ後のテスト

### Cloudflare Workerをデプロイ

```bash
cd worker
npm run deploy
```

デプロイ後のURLをメモ（例: `https://richmenu-api-worker.your-account.workers.dev`）

### Web UIをビルド・デプロイ

```bash
# プロジェクトルートで
npm run build

# distフォルダをGitHub Pagesまたは任意のホスティングサービスにデプロイ
```

### テスト項目

- [ ] デプロイされたWeb UIにアクセスできる
- [ ] Worker URLに本番URLを設定
- [ ] リッチメニュー作成が成功する
- [ ] CORS設定が正しく動作している（ブラウザコンソールにエラーがない）
- [ ] すべての機能がローカル環境と同様に動作する

## トラブルシューティング

### CORS エラーが発生する

Worker側のCORS設定を確認してください。本番環境では特定のオリジンのみを許可するように変更できます：

```typescript
// worker/index.ts
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://your-github-pages-url.github.io',
  // ...
};
```

### 画像アップロードが失敗する

1. 画像サイズを確認（推奨: 2500x1686 または 2500x843）
2. ファイルサイズを確認（1MB以下推奨）
3. 画像フォーマットを確認（JPEG または PNG）

### トークンエラー

1. チャンネルアクセストークンが正しいか確認
2. トークンの有効期限を確認
3. チャンネルの権限設定を確認

### Worker のログを確認

```bash
# ローカル
npm run dev
# ログがコンソールに表示されます

# 本番（Cloudflare Dashboard）
# Cloudflare DashboardのWorkersセクションでログを確認
```

## セキュリティチェックリスト

本番環境にデプロイする前に：

- [ ] チャンネルアクセストークンをコードにハードコードしていない
- [ ] Worker側のCORSで特定のオリジンのみ許可している
- [ ] すべての通信がHTTPS経由で行われている
- [ ] トークンはlocalStorageに保存され、適切に管理されている
- [ ] エラーメッセージに機密情報が含まれていない

## パフォーマンステスト

- [ ] 複数のエリア（20個）を作成しても動作する
- [ ] 大きな画像（2500x1686）でも快適に動作する
- [ ] 既存メニューが多数ある場合でも一覧取得が動作する

## ブラウザ互換性

以下のブラウザでテスト推奨：

- [ ] Chrome（最新版）
- [ ] Firefox（最新版）
- [ ] Safari（最新版）
- [ ] Edge（最新版）
- [ ] モバイルブラウザ（iOS Safari, Chrome）
