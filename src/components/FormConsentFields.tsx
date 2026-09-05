import React from 'react';

interface FormConsentFieldsProps {
  idPrefix: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  className?: string;
}

const CHECKBOX_CLASS =
  'mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-border-color bg-bg-surface text-primary focus:ring-1 focus:ring-primary focus:ring-offset-1';

export default function FormConsentFields({
  idPrefix,
  agreeTerms,
  agreePrivacy,
  onTermsChange,
  onPrivacyChange,
  className = '',
}: FormConsentFieldsProps) {
  return (
    <div className={`space-y-1.5 ${className}`.trim()}>
      <label htmlFor={`${idPrefix}-terms`} className="flex items-start gap-2 cursor-pointer">
        <input
          id={`${idPrefix}-terms`}
          type="checkbox"
          required
          checked={agreeTerms}
          onChange={(event) => onTermsChange(event.target.checked)}
          className={CHECKBOX_CLASS}
        />
        <span className="text-[10px] leading-snug text-text-secondary">
          Tôi đã đọc và đồng ý{' '}
          <a href="/dieu-khoan-su-dung" className="font-medium text-primary underline hover:text-primary-light">
            Điều khoản sử dụng
          </a>
          {' '}của Greenia Homes.
        </span>
      </label>

      <label htmlFor={`${idPrefix}-privacy`} className="flex items-start gap-2 cursor-pointer">
        <input
          id={`${idPrefix}-privacy`}
          type="checkbox"
          required
          checked={agreePrivacy}
          onChange={(event) => onPrivacyChange(event.target.checked)}
          className={CHECKBOX_CLASS}
        />
        <span className="text-[10px] leading-snug text-text-secondary">
          Tôi đã đọc và đồng ý{' '}
          <a href="/chinh-sach-bao-mat" className="font-medium text-primary underline hover:text-primary-light">
            Chính sách bảo mật
          </a>{' '}
          và nhận thông tin phù hợp từ Greenia Homes.
        </span>
      </label>
    </div>
  );
}
