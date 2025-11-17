import React from 'react'
import { useI18n } from '../i18n/useI18n'

type Props = {
  onClose: () => void
}

export default function PrivacyModal({ onClose }: Props) {
  const { t } = useI18n()
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
          <h2 style={{ margin: 0 }}>{t('privacyTitle')}</h2>
          <button className="btn secondary" onClick={onClose}>
            {t('close')}
          </button>
        </div>

        <div style={{ lineHeight: 1.7 }}>
          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>{t('dataHandlingTitle')}</h3>
            <p style={{ margin: '8px 0', fontSize: 14 }}>
              {t('dataHandlingIntro')}
            </p>
            <ul style={{ paddingLeft: 20, margin: '8px 0', fontSize: 14 }}>
              <li dangerouslySetInnerHTML={{ __html: t('dataHandlingPoint1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('dataHandlingPoint2') }} />
              <li>{t('dataHandlingPoint3')}</li>
              <li>{t('dataHandlingPoint4')}</li>
              <li>{t('dataHandlingPoint5')}</li>
              <li>{t('dataHandlingPoint6')}</li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>{t('tokenTitle')}</h3>
            <ul style={{ paddingLeft: 20, margin: '8px 0', fontSize: 14 }}>
              <li dangerouslySetInnerHTML={{ __html: t('tokenPoint1') }} />
              <li>{t('tokenPoint2')}</li>
              <li>{t('tokenPoint3')}</li>
              <li>{t('tokenPoint4')}</li>
              <li>{t('tokenPoint5')}</li>
              <li>{t('tokenPoint6')}</li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>{t('disclaimerTitle')}</h3>
            <p style={{ margin: '8px 0', fontSize: 14 }}>
              {t('disclaimerIntro')}
            </p>
            <ul style={{ paddingLeft: 20, margin: '8px 0', fontSize: 14 }}>
              <li dangerouslySetInnerHTML={{ __html: t('disclaimerPoint1') }} />
              <li>{t('disclaimerPoint2')}</li>
              <li>{t('disclaimerPoint3')}</li>
              <li>{t('disclaimerPoint4')}</li>
              <li>{t('disclaimerPoint5')}</li>
              <li>{t('disclaimerPoint6')}</li>
              <li dangerouslySetInnerHTML={{ __html: t('disclaimerPoint7') }} />
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>{t('userResponsibilityTitle')}</h3>
            <ul style={{ paddingLeft: 20, margin: '8px 0', fontSize: 14 }}>
              <li>{t('userResponsibilityPoint1')}</li>
              <li>{t('userResponsibilityPoint2')}</li>
              <li>{t('userResponsibilityPoint3')}</li>
              <li>{t('userResponsibilityPoint4')}</li>
              <li>{t('userResponsibilityPoint5')}</li>
              <li>{t('userResponsibilityPoint6')}</li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>{t('recommendationsTitle')}</h3>
            <ul style={{ paddingLeft: 20, margin: '8px 0', fontSize: 14 }}>
              <li>{t('recommendationsPoint1')}</li>
              <li>{t('recommendationsPoint2')}</li>
              <li>{t('recommendationsPoint3')}</li>
              <li>{t('recommendationsPoint4')}</li>
              <li>{t('recommendationsPoint5')}</li>
            </ul>
          </section>

          <section>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>{t('serviceProvisionTitle')}</h3>
            <p style={{ margin: '8px 0', fontSize: 14 }}>
              {t('serviceProvisionText')}
            </p>
          </section>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button className="btn" onClick={onClose} style={{ padding: '8px 24px' }}>
            {t('understood')}
          </button>
        </div>
      </div>
    </div>
  )
}
