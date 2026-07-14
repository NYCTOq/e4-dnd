import { useNavigate } from "react-router-dom";
import { PageShell } from "../../shared/layout/PageShell";
import { useAppSettings } from "../../shared/settings/AppSettingsProvider";
import {
  START_ROUTE_OPTIONS,
  type AccentTheme,
  type CampaignToolProfile,
  type FontScale,
  type MotionPreference,
  type UiDensity,
} from "../../shared/settings/appSettings";

const accentOptions: Array<{ value: AccentTheme; label: string }> = [
  { value: "violet", label: "Mor" },
  { value: "blue", label: "Mavi" },
  { value: "emerald", label: "ZÃ¼mrÃ¼t" },
  { value: "amber", label: "Kehribar" },
];

const densityOptions: Array<{ value: UiDensity; label: string; note: string }> = [
  { value: "comfortable", label: "Rahat", note: "Daha ferah kartlar ve butonlar." },
  { value: "compact", label: "Kompakt", note: "AynÄ± ekranda daha Ã§ok bilgi." },
];

const motionOptions: Array<{
  value: MotionPreference;
  label: string;
  note: string;
}> = [
  { value: "system", label: "Sisteme uy", note: "Windows veya tarayÄ±cÄ± tercihini kullanÄ±r." },
  { value: "full", label: "Tam", note: "GeÃ§iÅŸler ve arka plan hareketleri aÃ§Ä±k." },
  { value: "reduced", label: "AzaltÄ±lmÄ±ÅŸ", note: "AnimasyonlarÄ±n Ã§oÄŸunu kapatÄ±r." },
];

const fontOptions: Array<{ value: FontScale; label: string }> = [
  { value: "small", label: "KÃ¼Ã§Ã¼k" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "BÃ¼yÃ¼k" },
];

const campaignProfiles: Array<{
  value: CampaignToolProfile;
  label: string;
  note: string;
}> = [
  {
    value: "simple",
    label: "Sade",
    note: "Yeni campaignlerde tÃ¼m ekstra encounter araÃ§larÄ± kapalÄ±.",
  },
  {
    value: "balanced",
    label: "Dengeli",
    note: "Difficulty ve condition takibi aÃ§Ä±k; rolls ve loot kapalÄ±.",
  },
  {
    value: "full",
    label: "Tam",
    note: "Yeni campaignlerde bÃ¼tÃ¼n DM araÃ§larÄ± aÃ§Ä±k.",
  },
];

export function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings } = useAppSettings();

  return (
    <PageShell
      eyebrow="Uygulama tercihleri"
      title="Ayarlar"
      description="E4 D&D'nin gÃ¶rÃ¼nÃ¼mÃ¼nÃ¼ ve varsayÄ±lan davranÄ±ÅŸlarÄ±nÄ± masanÄ±n Ã§alÄ±ÅŸma biÃ§imine gÃ¶re dÃ¼zenle. Her ÅŸeyi aÃ§mak zorunda deÄŸilsin; yazÄ±lÄ±mÄ±n da sÄ±nÄ±r Ã¶ÄŸrenmesi saÄŸlÄ±klÄ±."
    >
      <div className="settings-layout">
        <section className="settings-card">
          <div className="settings-card-head">
            <div>
              <span className="mini-label">GÃ¶rÃ¼nÃ¼m</span>
              <h2>ArayÃ¼z tarzÄ±</h2>
            </div>
            <span className="settings-live-pill">CanlÄ± uygulanÄ±r</span>
          </div>

          <div className="settings-field-group">
            <strong>Vurgu rengi</strong>
            <div className="settings-choice-grid settings-accent-grid">
              {accentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    settings.accentTheme === option.value
                      ? "settings-choice active"
                      : "settings-choice"
                  }
                  onClick={() => updateSettings({ accentTheme: option.value })}
                >
                  <span className={`settings-swatch ${option.value}`} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field-group">
            <strong>Bilgi yoÄŸunluÄŸu</strong>
            <div className="settings-choice-grid">
              {densityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    settings.density === option.value
                      ? "settings-choice settings-choice-text active"
                      : "settings-choice settings-choice-text"
                  }
                  onClick={() => updateSettings({ density: option.value })}
                >
                  <b>{option.label}</b>
                  <small>{option.note}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="settings-inline-fields">
            <label>
              YazÄ± boyutu
              <select
                value={settings.fontScale}
                onChange={(event) =>
                  updateSettings({ fontScale: event.target.value as FontScale })
                }
              >
                {fontOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Hareketler
              <select
                value={settings.motion}
                onChange={(event) =>
                  updateSettings({ motion: event.target.value as MotionPreference })
                }
              >
                {motionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="settings-context-note">
            {motionOptions.find((item) => item.value === settings.motion)?.note}
          </p>
        </section>

        <section className="settings-card">
          <div className="settings-card-head">
            <div>
              <span className="mini-label">BaÅŸlangÄ±Ã§</span>
              <h2>AÃ§Ä±lÄ±ÅŸ davranÄ±ÅŸÄ±</h2>
            </div>
          </div>

          <label className="settings-wide-field">
            Yeni uygulama oturumunda aÃ§Ä±lacak ekran
            <select
              value={settings.startRoute}
              onChange={(event) => updateSettings({ startRoute: event.target.value })}
            >
              {START_ROUTE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="settings-preview-row">
            <div>
              <strong>
                {START_ROUTE_OPTIONS.find((item) => item.value === settings.startRoute)
                  ?.label ?? "Dashboard"}
              </strong>
              <span>Bir sonraki yeni tarayÄ±cÄ±/PWA oturumunda aÃ§Ä±lÄ±r.</span>
            </div>
            <button type="button" onClick={() => navigate(settings.startRoute)}>
              Åimdi aÃ§
            </button>
          </div>
        </section>

        <section className="settings-card settings-card-wide">
          <div className="settings-card-head">
            <div>
              <span className="mini-label">DM varsayÄ±lanlarÄ±</span>
              <h2>Yeni campaign araÃ§ profili</h2>
            </div>
          </div>

          <p>
            Bu tercih yalnÄ±zca bundan sonra oluÅŸturulan campaignleri etkiler. Mevcut
            campaign ayarlarÄ±nÄ± deÄŸiÅŸtirmez; Ã§Ã¼nkÃ¼ kullanÄ±cÄ±nÄ±n arkasÄ±ndan dÃ¼ÄŸme Ã§evirmek
            yazÄ±lÄ±mÄ±n yapmamasÄ± gereken nadir ÅŸeylerden biri.
          </p>

          <div className="settings-profile-grid">
            {campaignProfiles.map((profile) => (
              <button
                key={profile.value}
                type="button"
                className={
                  settings.campaignToolProfile === profile.value
                    ? "settings-profile-card active"
                    : "settings-profile-card"
                }
                onClick={() =>
                  updateSettings({ campaignToolProfile: profile.value })
                }
              >
                <strong>{profile.label}</strong>
                <span>{profile.note}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-card settings-card-wide settings-reset-card">
          <div>
            <span className="mini-label">SÄ±fÄ±rlama</span>
            <h2>Tercihleri varsayÄ±lana dÃ¶ndÃ¼r</h2>
            <p>
              Karakterlere, campaignlere veya homebrew verilerine dokunmaz. YalnÄ±zca bu
              sayfadaki uygulama tercihlerini sÄ±fÄ±rlar.
            </p>
          </div>
          <button
            type="button"
            className="danger-action"
            onClick={() => {
              const confirmed = confirm("Uygulama tercihleri sÄ±fÄ±rlansÄ±n mÄ±?");
              if (confirmed) resetSettings();
            }}
          >
            AyarlarÄ± sÄ±fÄ±rla
          </button>
        </section>
      </div>
    </PageShell>
  );
}

