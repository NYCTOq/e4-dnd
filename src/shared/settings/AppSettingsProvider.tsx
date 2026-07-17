import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readJsonSafely, writeJsonSafely } from "../../core/storage/safeStorage";
import {
  APP_SETTINGS_STORAGE_KEY,
  DEFAULT_APP_SETTINGS,
  sanitizeAppSettings,
  type AppSettings,
} from "./appSettings";

type AppSettingsContextValue = {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

function applySettingsToDocument(settings: AppSettings) {
  const root = document.documentElement;

  root.dataset.accent = settings.accentTheme;
  root.dataset.density = settings.density;
  root.dataset.fontScale = settings.fontScale;
  root.dataset.motion = settings.motion;
  root.lang = settings.locale;
  root.dir = "ltr";
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() =>
    sanitizeAppSettings(
      readJsonSafely<AppSettings>(APP_SETTINGS_STORAGE_KEY, DEFAULT_APP_SETTINGS),
    ),
  );

  useEffect(() => {
    applySettingsToDocument(settings);
    writeJsonSafely(APP_SETTINGS_STORAGE_KEY, settings);
  }, [settings]);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      settings,
      updateSettings(patch) {
        setSettings((current) => sanitizeAppSettings({ ...current, ...patch }));
      },
      resetSettings() {
        setSettings(DEFAULT_APP_SETTINGS);
      },
    }),
    [settings],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettings AppSettingsProvider içinde kullanılmalıdır.");
  }

  return context;
}
