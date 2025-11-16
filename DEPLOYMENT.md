# デプロイ手順

このドキュメントでは、LINE Rich Menu EditorをGitHub PagesとCloudflare Workersにデプロイする手順を説明します。

## 前提条件

- Node.js（v16以上）
- Cloudflareアカウント
- GitHubアカウント（GitHub Pagesを使用する場合）

## 1. Cloudflare Workerのデプロイ

### 1.1 Wranglerのインストールとログイン

```bash
cd worker
npm install

# Cloudflareにログイン（初回のみ）
npx wrangler login
```

### 1.2 Workerのデプロイ

```bash
npm run deploy
```

デプロイが完了すると、Worker URLが表示されます：
```
Published richmenu-api-worker (0.01 sec)
  https://richmenu-api-worker.your-account.workers.dev
```

**このURLをメモしてください。** 次のステップで使用します。

### 1.3 カスタムドメインの設定（オプション）

Cloudflare Dashboardでカスタムドメインを設定できます：
1. Cloudflare Dashboardにログイン
2. Workers & Pages → richmenu-api-worker を選択
3. Triggers → Custom Domains → Add Custom Domain
4. 例: `api.yourdomain.com`

## 2. Web UIのデプロイ

### 2.1 環境変数の設定

プロジェクトルートで`.env`ファイルを編集します：

```bash
# .env
VITE_WORKER_URL=https://richmenu-api-worker.your-account.workers.dev
```

または、カスタムドメインを使用している場合：

```bash
# .env
VITE_WORKER_URL=https://api.yourdomain.com
```

**重要:** `.env`ファイルは`.gitignore`に含まれているため、Gitにはコミットされません。

### 2.2 ビルド

```bash
# プロジェクトルートで実行
npm install
npm run build
```

`dist/`フォルダにビルド成果物が生成されます。

### 2.3 GitHub Pagesへのデプロイ

#### 方法1: GitHub Actionsを使用（推奨）

`.github/workflows/deploy.yml`を作成：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          VITE_WORKER_URL: ${{ secrets.VITE_WORKER_URL }}
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v3
```

**GitHub Secretsの設定:**
1. GitHubリポジトリの Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `VITE_WORKER_URL`
4. Value: `https://richmenu-api-worker.your-account.workers.dev`

#### 方法2: 手動デプロイ

```bash
# ビルド
npm run build

# gh-pages ブランチにデプロイ
npx gh-pages -d dist
```

### 2.4 GitHub Pagesの設定

1. GitHubリポジトリの Settings → Pages
2. Source: GitHub Actions（方法1の場合）または Deploy from a branch（方法2の場合）
3. Branch: `gh-pages`（方法2の場合）

デプロイ完了後、`https://yourusername.github.io/repository-name/` でアクセスできます。

## 3. Cloudflare Pagesへのデプロイ（代替案）

GitHub Pagesの代わりにCloudflare Pagesを使用することもできます。

### 3.1 Cloudflare Dashboardでプロジェクト作成

1. Cloudflare Dashboard → Pages → Create a project
2. GitHubリポジトリを接続
3. ビルド設定:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables:
     - `VITE_WORKER_URL`: Worker URL

### 3.2 自動デプロイ

GitHubにpushすると自動的にビルド・デプロイされます。

## 4. CORS設定の強化（本番環境）

セキュリティ向上のため、Worker側でCORSの許可オリジンを制限してください。

`worker/index.ts`を編集：

```typescript
// 本番環境のオリジンのみ許可
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://yourusername.github.io', // あなたのドメイン
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

複数のドメインを許可する場合：

```typescript
const allowedOrigins = [
  'https://yourusername.github.io',
  'https://yourdomain.com',
];

// fetch関数内で
const origin = request.headers.get('Origin');
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

変更後、Workerを再デプロイ：

```bash
cd worker
npm run deploy
```

## 5. 動作確認

1. デプロイしたURLにアクセス
2. 「LINE API連携」を開く
3. 「✓ サービス提供のAPIエンドポイントを使用中」が表示されることを確認
4. チャンネルアクセストークンを入力
5. リッチメニューを作成してテスト

## 6. トラブルシューティング

### Worker URLが表示されない

`.env`ファイルが正しく設定されているか確認してください：
```bash
cat .env
# VITE_WORKER_URL=https://... が表示されるはず
```

再ビルドが必要な場合：
```bash
npm run build
```

### CORS エラー

1. Worker側のCORS設定を確認
2. ブラウザのコンソールでエラー詳細を確認
3. Worker URLが正しいか確認

### 環境変数が反映されない

- `.env`ファイルの変更後は必ず再ビルドが必要
- GitHub Actionsを使用している場合、Secretsが正しく設定されているか確認
- ビルドログで環境変数が読み込まれているか確認

## 7. 更新手順

### Workerの更新

```bash
cd worker
# コードを編集
npm run deploy
```

### Web UIの更新

```bash
# コードを編集
npm run build

# GitHub Pagesの場合
npx gh-pages -d dist

# GitHub Actionsの場合
git push  # 自動的にデプロイされます

# Cloudflare Pagesの場合
git push  # 自動的にデプロイされます
```

## セキュリティチェックリスト

本番環境にデプロイする前に：

- [ ] `.env`ファイルがGitにコミットされていない（.gitignoreで除外）
- [ ] Worker URLが環境変数として設定されている
- [ ] CORS設定が本番ドメインのみ許可している
- [ ] HTTPSを使用している（GitHub Pages/Cloudflare Pagesは自動的にHTTPS）
- [ ] チャンネルアクセストークンがコードにハードコードされていない
- [ ] エラーメッセージに機密情報が含まれていない

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
