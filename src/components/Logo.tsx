import { useTranslation } from 'react-i18next';

/** Brand mark shown in the TopBar. Swap the square for the real brand asset. */
export function Logo() {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded bg-accent font-bold text-white">
        {t('app.title').charAt(0)}
      </span>
      <span className="font-semibold">{t('app.title')}</span>
    </span>
  );
}
