# Treasure Data x LINE リッチメニュー配信ガイド

## 概要

このガイドでは、Treasure DataのAudience StudioとLINE Messaging APIを連携し、セグメントごとに異なるリッチメニューを配信する方法を説明します。

## アーキテクチャ

```
[Rich Menu Editor] → [LINE Developers] → [Treasure Data] → [LINE Users]
      ↓                      ↓                    ↓
  デザイン作成          リッチメニュー登録      セグメント配信
```

---

## ステップ1: リッチメニューの作成

### 1.1 Rich Menu Editorでデザイン

1. **アプリにアクセス**
   - URL: https://toru-takahashi.github.io/line-richmenu-editor/

2. **基本設定を入力**
   ```
   メニュー名: 例) VIPユーザー向けメニュー
   チャットバーテキスト: 例) メニューを開く
   デフォルトで開く: はい/いいえ
   ```

3. **背景画像をアップロード**
   - 推奨サイズ: 2500 x 1686 px
   - 形式: JPEG または PNG
   - ファイルサイズ: 1MB以下

4. **タップ領域を設定**
   - テンプレートから選択、または手動で作成
   - 各エリアにアクションを設定
     - URLを開く
     - メッセージを送信
     - ポストバック
     - **リッチメニュー切り替え** ← ユーザーの行動に応じて動的にメニューを切り替える

   **リッチメニュー切り替えアクションの設定方法:**

   a. **Rich Menu Editorでアクション設定**
      ```
      アクションタイプ: Rich Menu Switch
      Target Rich Menu Alias ID: next-menu-alias
      Data: user-action-data
      ```

   b. **LINE Developers Consoleでエイリアス設定**
      ```
      Messaging API > Rich menus > Rich menu aliases
      Rich Menu ID: richmenu-xxxxx
      Alias: next-menu-alias
      ```

   c. **ユーザーがタップすると、指定したエイリアスのリッチメニューに自動的に切り替わります**

5. **JSONをエクスポート**
   - 「JSON Preview」ボタンをクリック
   - 「Copy JSON」でクリップボードにコピー

---

## ステップ2: Channel Access Tokenを取得

### 2.1 LINE Developers Consoleにアクセス

1. **LINE Developers Consoleにログイン**
   - https://developers.line.biz/console/

2. **Channel Access Tokenを取得**
   - チャンネルを選択
   - `Messaging API` タブを開く
   - `Channel access token` セクションで「Issue」または「発行」をクリック
   - 発行されたトークンをコピー

   ⚠️ **注意**: トークンは一度しか表示されないため、必ずコピーして安全な場所に保存してください

---

## ステップ3: リッチメニューを作成・登録

### 3.1 本アプリの「LINE API連携」機能を使用

1. **Rich Menu Editorで「LINE API連携」を開く**
   - アプリ右上の「LINE API連携」ボタンをクリック

2. **Channel Access Tokenを入力**
   - ステップ2で取得したトークンを入力欄に貼り付け

3. **リッチメニューを作成**
   - 「リッチメニューを作成」ボタンをクリック
   - アプリが自動的に以下を実行します：
     - LINE APIにリッチメニューを作成
     - 背景画像を自動アップロード
     - Rich Menu IDを取得

4. **Rich Menu IDをコピー**
   - 作成成功後、Rich Menu IDが表示されます
   - 形式: `richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - 「コピー」ボタンでクリップボードにコピー
   - **このIDをTreasure Dataで使用します**

   ⚠️ **注意**: API経由で作成したリッチメニューはLINE Developers Consoleの管理画面には表示されません。本アプリの「既存メニューを取得」機能で確認できます。

---

## ステップ4: LINE Messaging APIコネクタ設定

### 4.1 コネクタの作成

1. **Integrationsページにアクセス**
   ```
   Treasure Data Console > Integrations > Catalog
   ```

2. **LINE Messaging APIを検索して選択**

3. **基本設定**
   ```
   Name: LINE Rich Menu Delivery
   Description: リッチメニュー配信用コネクタ
   ```

### 4.2 認証情報の設定

**Channel Access Tokenを入力**
- ステップ2で取得したトークンを貼り付け

### 4.3 リッチメニュー配信設定

1. **アクションタイプ**
   ```
   Action Type: Link Rich Menu
   ```

2. **リッチメニューID**
   ```
   Rich Menu ID: richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   ⚠️ **重要**: ステップ3で取得したリッチメニューIDを正確に入力

3. **マッピング設定**
   ```
   User ID Column: line_user_id
   ```

---

## ステップ5: Treasure Dataでセグメント作成

### 5.1 Audience Studioでセグメントを定義

1. **Audience Studioにアクセス**
   ```
   Treasure Data Console > Audiences > Segments
   ```

2. **新規セグメントを作成**
   - セグメントクエリで `user_id` と `line_user_id` を含むテーブルを作成
   - 配信対象の条件（購入金額、登録日など）を指定

3. **セグメント名を設定**
   - 例: `line_vip_users`, `line_new_users`

### 5.2 配信スケジュール設定

1. **スケジュールを設定**
   ```
   Frequency: One-time / Daily / Weekly / Monthly
   Time Zone: Asia/Tokyo
   Start Time: 09:00
   ```

2. **コネクタを選択**
   - ステップ4で作成したコネクタを選択

---

## ステップ6: Audience Studioでアクティベーション

### 6.1 オーディエンスアクティベーション

1. **Audience > Activations**にアクセス

2. **新規アクティベーションを作成**
   ```
   Destination: LINE Messaging API
   Segment: line_vip_users
   Connector: LINE Rich Menu - VIP Users
   ```

3. **配信を開始**
   - 「Activate」ボタンをクリック

### 6.2 配信状況の確認

1. **Activation Historyで確認**
   ```
   Status: Running / Completed / Failed
   Delivered: 配信成功数
   Failed: 配信失敗数
   ```

---

## ステップ7: 複数セグメントへの配信

### 7.1 基本ルール

**重要:** 1つのActivationで設定できるリッチメニューは1つのみです。

```
1セグメント = 1リッチメニュー = 1Activation
```

### 7.2 複数セグメントに配信する場合

異なるセグメントに異なるリッチメニューを配信する場合は、**各セグメントごとにステップ1〜6を繰り返します**。

**例: 3つのセグメントに配信する場合**

| セグメント | リッチメニューID | Activation名 |
|-----------|----------------|-------------|
| VIPユーザー | richmenu-vip-xxxxx | LINE Rich Menu - VIP Users |
| 通常ユーザー | richmenu-standard-xxxxx | LINE Rich Menu - Standard Users |
| 新規ユーザー | richmenu-welcome-xxxxx | LINE Rich Menu - New Users |

**手順:**
1. VIPユーザー向けリッチメニューを作成（ステップ1〜3）
2. VIPユーザー向けConnectorを作成（ステップ4）
3. VIPユーザーセグメントを作成（ステップ5）
4. VIPユーザー向けActivationを実行（ステップ6）
5. 通常ユーザーについて1〜4を繰り返し
6. 新規ユーザーについて1〜4を繰り返し

---

## データフロー図

```
┌─────────────────────┐
│  Treasure Data DB   │
│  ┌───────────────┐  │
│  │ User Master   │  │
│  │ - user_id     │  │
│  │ - line_user_id│  │
│  │ - attributes  │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Audience Studio    │
│  ┌───────────────┐  │
│  │ Segment Query │  │
│  │ WHERE total > │  │
│  │ 100000        │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  LINE Connector     │
│  ┌───────────────┐  │
│  │ Rich Menu ID  │  │
│  │ richmenu-xxx  │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  LINE Platform      │
│  ┌───────────────┐  │
│  │ Rich Menu     │  │
│  │ Delivery      │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │
           ▼
     ┌─────────┐
     │ User A  │ VIP Menu
     └─────────┘
     ┌─────────┐
     │ User B  │ Standard Menu
     └─────────┘
```

---

## トラブルシューティング

### Q1. リッチメニューが配信されない

**原因**
- Channel Access Tokenが無効
- リッチメニューIDが間違っている
- ユーザーがブロックしている

**解決方法**
```
1. LINE Developers ConsoleでTokenを再発行
2. Rich Menu IDを再確認（richmenu-xxxxx形式）
3. セグメントクエリでブロックユーザーを除外
   WHERE is_blocked = false
```

### Q2. 一部のユーザーにのみ配信される

**原因**
- セグメントクエリが間違っている
- line_user_idのマッピングが不正確

**解決方法**
```sql
-- セグメントサイズを確認
SELECT COUNT(DISTINCT line_user_id) as user_count
FROM your_segment_table

-- NULL値をチェック
SELECT COUNT(*) as null_count
FROM your_segment_table
WHERE line_user_id IS NULL
```

### Q3. リッチメニューが表示されない

**原因**
- 画像がアップロードされていない
- 画像サイズが不正

**解決方法**
```
1. LINE Developers Consoleでリッチメニュー確認
   Messaging API > Rich menus
2. 画像を再アップロード（2500x1686px、1MB以下）
3. Rich Menu Editorの「Upload Rich Menu Image」を使用
```

### Q4. タップ領域が反応しない

**原因**
- アクション設定が不完全
- bounds（座標）が重複している

**解決方法**
```
1. JSON Previewでアクション設定を確認
2. 各エリアのboundsが重複していないか確認
   - x, y, width, height の値を検証
3. Rich Menu Editorで再度タップ領域を設定
```

---

## APIリファレンス

### リッチメニュー作成API

```bash
curl -X POST https://api.line.me/v2/bot/richmenu \
-H 'Authorization: Bearer {CHANNEL_ACCESS_TOKEN}' \
-H 'Content-Type: application/json' \
-d '{
  "size": {
    "width": 2500,
    "height": 1686
  },
  "selected": false,
  "name": "VIP User Menu",
  "chatBarText": "Menu",
  "areas": [
    {
      "bounds": {
        "x": 0,
        "y": 0,
        "width": 833,
        "height": 843
      },
      "action": {
        "type": "uri",
        "uri": "https://example.com/offer"
      }
    }
  ]
}'
```

### リッチメニュー画像アップロードAPI

```bash
curl -X POST https://api-data.line.me/v2/bot/richmenu/{richMenuId}/content \
-H 'Authorization: Bearer {CHANNEL_ACCESS_TOKEN}' \
-H 'Content-Type: image/png' \
--data-binary @richmenu-image.png
```

### リッチメニューリンクAPI

```bash
curl -X POST https://api.line.me/v2/bot/user/{userId}/richmenu/{richMenuId} \
-H 'Authorization: Bearer {CHANNEL_ACCESS_TOKEN}'
```

---

## チェックリスト

### 事前準備
- [ ] LINE Official Accountを作成済み
- [ ] LINE Developers Consoleにアクセス可能
- [ ] Channel Access Tokenを取得済み
- [ ] Treasure Dataアカウント作成済み
- [ ] Audience Studio利用権限あり

### リッチメニュー作成
- [ ] 背景画像を準備（2500x1686px）
- [ ] Rich Menu Editorでデザイン作成
- [ ] JSONをエクスポート
- [ ] LINE APIでリッチメニュー作成
- [ ] Rich Menu IDを保存

### Treasure Data設定
- [ ] セグメントクエリ作成
- [ ] line_user_idカラムを確認
- [ ] LINE Messaging APIコネクタ作成
- [ ] Rich Menu IDを設定
- [ ] 配信スケジュール設定

### テスト
- [ ] テストユーザーでセグメント確認
- [ ] リッチメニュー配信テスト
- [ ] タップアクション動作確認
- [ ] エラーログ確認

### 本番配信
- [ ] 配信対象セグメントサイズ確認
- [ ] 配信タイミング設定
- [ ] アクティベーション実行
- [ ] 配信結果モニタリング

---

## サポートリソース

### ドキュメント
- [LINE Messaging API Reference](https://developers.line.biz/en/reference/messaging-api/)
- [Treasure Data Audience Studio](https://docs.treasuredata.com/articles/audience-studio)
- [Rich Menu Editor GitHub](https://github.com/toru-takahashi/line-richmenu-editor)

### サンプルコード
- [LINE Bot SDK](https://github.com/line/line-bot-sdk-nodejs)
- [Treasure Data SDK](https://github.com/treasure-data/td-js-sdk)

### コミュニティ
- LINE Developers Community
- Treasure Data Community Forum

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-11-18 | 1.0.0 | 初版リリース |

---

**作成者**: Claude Code
**最終更新**: 2025-11-18
