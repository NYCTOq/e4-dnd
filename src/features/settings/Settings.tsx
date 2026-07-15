import { useNavigate } from "react-router-dom";
import { PageShell } from "../../shared/layout/PageShell";
import { RULESET_DEFINITIONS } from "../../core/rulesets/rulesetRegistry";
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
  { value: "emerald", label: "Zümrüt" },
  { value: "amber", label: "Kehribar" },
];

const densityOptions: Array<{ value: UiDensity; label: string; note: string }> = [
  { value: "comfortable", label: "Rahat", note: "Daha ferah kartlar ve butonlar." },
  { value: "compact", label: "Kompakt", note: "Aynı ekranda daha çok bilgi." },
];

const motionOptions: Array<{
  value: MotionPreference;
  label: string;
  note: string;
}> = [
  { value: "system", label: "Sisteme uy", note: "Windows veya tarayıcı tercihini kullanır." },
  { value: "full", label: "Tam", note: "Geçişler ve arka plan hareketleri açık." },
  { value: "reduced", label: "Azaltılmış", note: "Animasyonların çoğunu kapatır." },
];

const fontOptions: Array<{ value: FontScale; label: string }> = [
  { value: "small", label: "Küçük" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "Büyük" },
];

const campaignProfiles: Array<{
  value: CampaignToolProfile;
  label: string;
  note: string;
}> = [
  {
    value: "simple",
    label: "Sade",
    note: "Yeni campaignlerde tüm ekstra encounter araçları kapalı.",
  },
  {
    value: "balanced",
    label: "Dengeli",
    note: "Difficulty ve condition takibi açık; rolls ve loot kapalı.",
  },
  {
    value: "full",
    label: "Tam",
    note: "Yeni campaignlerde bütün DM araçları açık.",
  },
];

export function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings } = useAppSettings();

  return (
    <PageShell
      eyebrow="Uygulama tercihleri"
      title="Ayarlar"
      description="E4 D&D'nin görünümünü ve varsayılan davranışlarını masanın çalışma biçimine göre düzenle. Her şeyi açmak zorunda değilsin; yazılımın da sınır öğrenmesi sağlıklı."
    >
      <div className="settings-layout">
        <section className="settings-card">
          <div className="settings-card-head">
            <div>
              <span className="mini-label">Görünüm</span>
              <h2>Arayüz tarzı</h2>
            </div>
            <span className="settings-live-pill">Canlı uygulanır</span>
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
            <strong>Bilgi yoğunluğu</strong>
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
              Yazı boyutu
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
              <span className="mini-label">Başlangıç</span>
              <h2>Açılış davranışı</h2>
            </div>
          </div>

          <label className="settings-wide-field">
            Yeni uygulama oturumunda açılacak ekran
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
              <span>Bir sonraki yeni tarayıcı/PWA oturumunda açılır.</span>
            </div>
            <button type="button" onClick={() => navigate(settings.startRoute)}>
              Şimdi aç
            </button>
          </div>
        </section>

        <section className="settings-card settings-card-wide">
          <div className="settings-card-head">
            <div>
              <span className="mini-label">Karakter kuralları</span>
              <h2>Varsayılan ruleset</h2>
            </div>
          </div>
          <p>Yeni veri ekranları bu edition ile açılır. Mevcut karakterlerin ruleset bilgisi değişmez.</p>
          <div className="settings-profile-grid">
            {RULESET_DEFINITIONS.map((definition) => (
              <button
                key={definition.id}
                type="button"
                className={settings.defaultRuleset === definition.id ? "settings-choice settings-choice-text active" : "settings-choice settings-choice-text"}
                onClick={() => updateSettings({ defaultRuleset: definition.id })}
              >
                <b>{definition.name}</b>
                <small>{definition.editionLabel}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-card settings-card-wide">
          <div className="settings-card-head">
            <div>
              <span className="mini-label">DM varsayılanları</span>
              <h2>Yeni campaign araç profili</h2>
            </div>
          </div>

          <p>
            Bu tercih yalnızca bundan sonra oluşturulan campaignleri etkiler. Mevcut
            campaign ayarlarını değiştirmez; çünkü kullanıcının arkasından düğme çevirmek
            yazılımın yapmaması gereken nadir şeylerden biri.
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
            <span className="mini-label">Sıfırlama</span>
            <h2>Tercihleri varsayılana döndür</h2>
            <p>
              Karakterlere, campaignlere veya homebrew verilerine dokunmaz. Yalnızca bu
              sayfadaki uygulama tercihlerini sıfırlar.
            </p>
          </div>
          <button
            type="button"
            className="danger-action"
            onClick={() => {
              const confirmed = confirm("Uygulama tercihleri sıfırlansın mı?");
              if (confirmed) resetSettings();
            }}
          >
            Ayarları sıfırla
          </button>
        </section>
      </div>
    </PageShell>
  );
}
