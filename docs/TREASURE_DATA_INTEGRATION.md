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
     - **リッチメニュー切り替え** ← セグメント配信で重要

5. **JSONをエクスポート**
   - 「JSON Preview」ボタンをクリック
   - 「Copy JSON」でクリップボードにコピー

---

## ステップ2: LINE Developersでリッチメニュー登録

### 2.1 LINE Official Account Managerを使用する場合

1. **LINE Official Account Managerにログイン**
   - https://manager.line.biz/

2. **リッチメニューを作成**
   - ホーム > リッチメニュー > 作成
   - ステップ1で作成した画像とアクション設定を入力

3. **リッチメニューIDを取得**
   - 作成後、リッチメニュー一覧からIDをコピー
   - 形式: `richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2.2 LINE Messaging APIを使用する場合（推奨）

1. **LINE Developers Consoleにログイン**
   - https://developers.line.biz/console/

2. **Channel Access Tokenを取得**
   ```
   Settings > Messaging API > Channel access token
   ```

3. **リッチメニューをAPI経由で作成**

   本アプリの「LINE API Integration」機能を使用:

   a. **Channel Access Tokenを入力**

   b. **Create Rich Menu**をクリック

   c. **Rich Menu IDをコピー**
      - 形式: `richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
      - このIDをTreasure Dataで使用します

4. **画像をアップロード**
   - Upload Rich Menu Image機能を使用
   - または、APIパネルから手動でアップロード

---

## ステップ3: Treasure Dataでセグメント作成

### 3.1 Audience Studioでセグメントを定義

1. **Audience Studioにアクセス**
   ```
   Treasure Data Console > Audiences > Segments
   ```

2. **新規セグメントを作成**

   **例1: VIPユーザー**
   ```sql
   SELECT
     user_id,
     line_user_id
   FROM
     user_master
   WHERE
     total_purchase_amount >= 100000
     AND last_purchase_date >= TD_TIME_ADD(TD_SCHEDULED_TIME(), '-30d')
   ```

   **例2: 新規ユーザー**
   ```sql
   SELECT
     user_id,
     line_user_id
   FROM
     user_master
   WHERE
     registration_date >= TD_TIME_ADD(TD_SCHEDULED_TIME(), '-7d')
   ```

3. **セグメント名を設定**
   - 例: `line_vip_users`, `line_new_users`

---

## ステップ4: LINE Messaging APIコネクタ設定

### 4.1 コネクタの作成

1. **Integrationsページにアクセス**
   ```
   Treasure Data Console > Integrations > Catalog
   ```

2. **LINE Messaging APIを検索**
   - 「LINE Messaging API」を選択

3. **基本設定**
   ```
   Name: LINE Rich Menu - VIP Users
   Description: VIPユーザー向けリッチメニュー配信
   ```

### 4.2 認証情報の設定

1. **Channel Access Tokenを入力**
   ```
   LINE Developers Console > Settings > Messaging API
   → Channel access token をコピーして貼り付け
   ```

### 4.3 リッチメニュー配信設定

1. **アクションタイプを選択**
   ```
   Action Type: Link Rich Menu
   ```

2. **リッチメニューIDを指定**
   ```
   Rich Menu ID: richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   ⚠️ **重要**: ステップ2で取得したリッチメニューIDを正確に入力

3. **マッピング設定**
   ```
   User ID Column: line_user_id
   (Treasure Dataのテーブルに含まれるLINEユーザーIDのカラム名)
   ```

### 4.4 配信スケジュール設定

1. **スケジュールを設定**
   ```
   Frequency: One-time / Daily / Weekly / Monthly
   Time Zone: Asia/Tokyo
   Start Time: 09:00
   ```

2. **セグメントを選択**
   - ステップ3で作成したセグメントを選択

---

## ステップ5: Audience Studioでアクティベーション

### 5.1 オーディエンスアクティベーション

1. **Audience > Activations**にアクセス

2. **新規アクティベーションを作成**
   ```
   Destination: LINE Messaging API
   Segment: line_vip_users
   Connector: LINE Rich Menu - VIP Users
   ```

3. **配信を開始**
   - 「Activate」ボタンをクリック

### 5.2 配信状況の確認

1. **Activation Historyで確認**
   ```
   Status: Running / Completed / Failed
   Delivered: 配信成功数
   Failed: 配信失敗数
   ```

---

## ステップ6: セグメント別リッチメニュー切り替え

### 6.1 複数リッチメニューの管理

異なるセグメントに異なるリッチメニューを配信する場合:

**パターン1: ユーザー属性別**
```
VIPユーザー    → richmenu-vip-xxxxx (特別オファー付き)
通常ユーザー   → richmenu-standard-xxxxx (基本メニュー)
新規ユーザー   → richmenu-welcome-xxxxx (チュートリアル付き)
```

**パターン2: 行動履歴別**
```
購入済み      → richmenu-purchased-xxxxx (リピート促進)
カート放棄    → richmenu-cart-abandoned-xxxxx (購入促進)
閲覧のみ      → richmenu-browsed-xxxxx (興味喚起)
```

### 6.2 リッチメニュー切り替えアクション

ユーザーの行動に応じて動的にメニューを切り替える場合:

1. **Rich Menu Editorでアクション設定**
   ```
   アクションタイプ: Rich Menu Switch
   Target Rich Menu Alias ID: next-menu-alias
   Data: user-action-data
   ```

2. **LINE Developers Consoleでエイリアス設定**
   ```
   Rich Menu ID: richmenu-xxxxx
   Alias: next-menu-alias
   ```

3. **Treasure Dataで切り替えトリガー設定**
   - Webhookでポストバックデータを受信
   - セグメントを動的に更新
   - 新しいリッチメニューを配信

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

## ベストプラクティス

### 1. リッチメニュー設計

✅ **DO**
- ユーザーセグメントごとに明確な価値提案を提供
- タップ領域は指で押しやすい大きさ（最小100x100px）
- 重要なアクションは目立つ位置に配置
- 画像とアクション設定を事前にテスト

❌ **DON'T**
- 20個を超えるタップ領域を設定しない
- 小さすぎるタップ領域を作らない
- セグメント間で全く異なるデザインにしない（ブランド一貫性）

### 2. セグメント管理

✅ **DO**
- セグメント定義を明確に文書化
- セグメントサイズを定期的にモニタリング
- オーバーラップを避ける（ユーザーが複数セグメントに属さない）
- セグメント更新頻度を適切に設定

❌ **DON'T**
- 小さすぎるセグメント（<100ユーザー）を作成しない
- 過度に複雑なセグメント条件を避ける
- リアルタイム配信が必要ない場合にリアルタイム更新しない

### 3. 配信スケジュール

✅ **DO**
- ユーザーのアクティブ時間帯に配信
- A/Bテストで最適な配信タイミングを検証
- 配信後の効果測定を実施

❌ **DON'T**
- 深夜や早朝の配信を避ける
- 同じユーザーに短期間で複数回配信しない
- 配信エラーのリトライ設定を忘れない

### 4. モニタリング

以下の指標を定期的に確認:

```
- 配信成功率: (成功数 / 試行数) × 100
- タップ率: タップ数 / 表示数
- コンバージョン率: 購入数 / タップ数
- エラー率: エラー数 / 試行数
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
