import React from 'react'

type Props = {
  onClose: () => void
}

export default function PrivacyModal({ onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 130,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '700px',
          maxWidth: '95%',
          maxHeight: '90%',
          background: '#fff',
          borderRadius: 8,
          padding: 24,
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>プライバシーと免責事項</h2>
          <button className="btn secondary" onClick={onClose}>
            閉じる
          </button>
        </div>

        <div style={{ lineHeight: 1.7 }}>
          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>データの取り扱いについて</h3>
            <p style={{ margin: '8px 0', fontSize: 14 }}>
              このサービスの処理は完全にクライアントサイド（ブラウザ内）で動作します。
            </p>
            <ul style={{ paddingLeft: 20, margin: '8px 0', fontSize: 14 }}>
              <li>入力されたすべての情報（画像、テキスト、設定など）は<strong>ご利用のブラウザのlocalStorageにのみ保存</strong>されます</li>
              <li><strong>サービス提供者のサーバーには一切データを保存・記録しません</strong></li>
              <li>Cloudflare Workerはステートレスなプロキシとして機能し、通信内容を保存・記録しません</li>
              <li>LINE APIへの通信は、ブラウザ → Cloudflare Worker（プロキシ） → LINE API の経路で行われます</li>
              <li>通信中のデータはすべてHTTPSで暗号化されます</li>
              <li>ブラウザのキャッシュをクリアすると、保存されたデータも削除されます</li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>チャンネルアクセストークンについて</h3>
            <ul style={{ paddingLeft: 20, margin: '8px 0', fontSize: 14 }}>
              <li>チャンネルアクセストークンは<strong>ご利用のブラウザのlocalStorageにのみ保存</strong>されます</li>
              <li>トークンはサービス提供者のサーバーには送信・保存されません</li>
              <li>トークンはCloudflare Workerを経由してLINE APIにのみ送信されます</li>
              <li>Cloudflare Workerはトークンを保存・記録しません（通過するのみ）</li>
              <li>トークンはご自身で管理してください。第三者と共有しないでください</li>
              <li>セキュリティのため、トークンは定期的に再生成することを推奨します</li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>免責事項</h3>
            <p style={{ margin: '8px 0', fontSize: 14 }}>
              本サービスは「現状有姿（AS IS）」で提供されます。以下の点に同意の上、ご利用ください：
            </p>
            <ul style={{ paddingLeft: 20, margin: '8px 0', fontSize: 14 }}>
              <li>
                <strong>サービスの利用により生じたいかなる損害</strong>（データの損失、サービスの中断、セキュリティ上の問題、LINE APIの利用制限、アカウントの停止など）について、<strong>サービス提供者は一切の責任を負いません</strong>
              </li>
              <li>サービスの可用性、正確性、完全性、適時性、継続性について一切保証しません</li>
              <li>予告なくサービスの内容を変更、または提供を中止する場合があります</li>
              <li>LINE Messaging APIの仕様変更により、予告なく機能が正常に動作しなくなる可能性があります</li>
              <li>生成されたJSONやリッチメニューの正確性について保証しません。ご自身で内容を確認してください</li>
              <li>本サービスの利用により第三者との間で生じたトラブルについて、一切の責任を負いません</li>
              <li><strong>必ずテスト環境で動作確認してから本番環境で使用してください</strong></li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>利用者の責任</h3>
            <ul style={{ paddingLeft: 20, margin: '8px 0', fontSize: 14 }}>
              <li>本サービスの利用は利用者ご自身の責任において行ってください</li>
              <li>LINEチャンネルの管理権限がある場合のみご利用ください</li>
              <li>チャンネルアクセストークンを第三者に開示・共有しないでください</li>
              <li>生成されたリッチメニューの内容が適切かご自身で確認してください</li>
              <li>LINE公式アカウントの利用規約を遵守してください</li>
              <li>本サービスを不正な目的で使用しないでください</li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>推奨事項</h3>
            <ul style={{ paddingLeft: 20, margin: '8px 0', fontSize: 14 }}>
              <li>重要なデータは必ずバックアップを取ってください</li>
              <li>テスト環境（テスト用LINEチャンネル）で十分に動作確認してから本番環境で使用してください</li>
              <li>チャンネルアクセストークンは定期的に再生成することを推奨します</li>
              <li>本サービスで作成したリッチメニューは、公開前に必ず内容を確認してください</li>
              <li>大切な既存のリッチメニューを削除する前に、JSONをバックアップしてください</li>
            </ul>
          </section>

          <section>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>サービス提供について</h3>
            <p style={{ margin: '8px 0', fontSize: 14 }}>
              本サービスは無償で提供されています。サービスの継続性、サポート、アップデートについて一切保証しません。
            </p>
          </section>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button className="btn" onClick={onClose} style={{ padding: '8px 24px' }}>
            了解しました
          </button>
        </div>
      </div>
    </div>
  )
}
