import { useAppSettings } from "../settings/AppSettingsProvider";
import { getIntlLocale, translate } from "./i18n";

export function useI18n() {
  const { settings } = useAppSettings();
  return {
    locale: settings.locale,
    intlLocale: getIntlLocale(settings.locale),
    t: (key: string, fallback: string, values?: Record<string, string | number>) => translate(settings.locale, key, fallback, values),
  };
}
