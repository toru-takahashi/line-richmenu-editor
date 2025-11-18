import React from 'react'
import { useI18n } from '../i18n/useI18n'

type Props = {
  onClose: () => void
}

export default function PrivacyModal({ onClose }: Props) {
  const { t } = useI18n()
  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[700px] max-w-[95%] max-h-[90%] overflow-auto rounded-td-xl bg-white p-6 shadow-td-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-11">{t('privacyTitle')}</h2>
          <button className="btn secondary" onClick={onClose}>
            {t('close')}
          </button>
        </div>

        <div className="leading-relaxed">
          <section className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-neutral-11">{t('dataHandlingTitle')}</h3>
            <p className="my-2 text-sm text-neutral-9">
              {t('dataHandlingIntro')}
            </p>
            <ul className="my-2 pl-5 text-sm text-neutral-9">
              <li dangerouslySetInnerHTML={{ __html: t('dataHandlingPoint1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('dataHandlingPoint2') }} />
              <li>{t('dataHandlingPoint3')}</li>
              <li>{t('dataHandlingPoint4')}</li>
              <li>{t('dataHandlingPoint5')}</li>
              <li>{t('dataHandlingPoint6')}</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-neutral-11">{t('tokenTitle')}</h3>
            <ul className="my-2 pl-5 text-sm text-neutral-9">
              <li dangerouslySetInnerHTML={{ __html: t('tokenPoint1') }} />
              <li>{t('tokenPoint2')}</li>
              <li>{t('tokenPoint3')}</li>
              <li>{t('tokenPoint4')}</li>
              <li>{t('tokenPoint5')}</li>
              <li>{t('tokenPoint6')}</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-neutral-11">{t('disclaimerTitle')}</h3>
            <p className="my-2 text-sm text-neutral-9">
              {t('disclaimerIntro')}
            </p>
            <ul className="my-2 pl-5 text-sm text-neutral-9">
              <li dangerouslySetInnerHTML={{ __html: t('disclaimerPoint1') }} />
              <li>{t('disclaimerPoint2')}</li>
              <li>{t('disclaimerPoint3')}</li>
              <li>{t('disclaimerPoint4')}</li>
              <li>{t('disclaimerPoint5')}</li>
              <li>{t('disclaimerPoint6')}</li>
              <li dangerouslySetInnerHTML={{ __html: t('disclaimerPoint7') }} />
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-neutral-11">{t('userResponsibilityTitle')}</h3>
            <ul className="my-2 pl-5 text-sm text-neutral-9">
              <li>{t('userResponsibilityPoint1')}</li>
              <li>{t('userResponsibilityPoint2')}</li>
              <li>{t('userResponsibilityPoint3')}</li>
              <li>{t('userResponsibilityPoint4')}</li>
              <li>{t('userResponsibilityPoint5')}</li>
              <li>{t('userResponsibilityPoint6')}</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-neutral-11">{t('recommendationsTitle')}</h3>
            <ul className="my-2 pl-5 text-sm text-neutral-9">
              <li>{t('recommendationsPoint1')}</li>
              <li>{t('recommendationsPoint2')}</li>
              <li>{t('recommendationsPoint3')}</li>
              <li>{t('recommendationsPoint4')}</li>
              <li>{t('recommendationsPoint5')}</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-lg font-semibold text-neutral-11">{t('serviceProvisionTitle')}</h3>
            <p className="my-2 text-sm text-neutral-9">
              {t('serviceProvisionText')}
            </p>
          </section>
        </div>

        <div className="mt-6 text-center">
          <button className="btn px-6 py-2" onClick={onClose}>
            {t('understood')}
          </button>
        </div>
      </div>
    </div>
  )
}
