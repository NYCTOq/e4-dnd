import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import type { Character } from "../../core/character/character.types";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import type { Campaign } from "../campaigns/campaignTypes";
import { PageShell } from "../../shared/layout/PageShell";
import { useFavorites } from "../../shared/favorites/FavoritesProvider";
import { useTagCollections } from "../../shared/collections/TagCollectionsProvider";
import { getPlayReadiness } from "../../core/character/playReadiness";
import { useI18n } from "../../shared/i18n/useI18n";

type DashboardProps = {
  characters: Character[];
  campaigns: Campaign[];
  rulesetData: RulesetData | null;
  homebrewCount: number;
};

function formatUpdatedAt(value: string, locale: string, noDate: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return noDate;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function Dashboard({
  characters,
  campaigns,
  rulesetData,
  homebrewCount,
}: DashboardProps) {
  const { t, intlLocale } = useI18n();
  const { favorites, recentItems, recordRecent, clearRecentItems } = useFavorites();
  const { allTags, itemTags } = useTagCollections();
  const recentCharacter = [...characters].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )[0];
  const recentCampaign = [...campaigns].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )[0];
  const recentCharacterReadiness = recentCharacter ? getPlayReadiness(recentCharacter, rulesetData) : null;
  const activeEncounterCount = campaigns.reduce(
    (total, campaign) =>
      total + campaign.encounters.filter((encounter) => encounter.isActive).length,
    0,
  );
  const activeQuestCount = campaigns.reduce(
    (total, campaign) =>
      total + campaign.quests.filter((quest) => quest.status === "active").length,
    0,
  );
  const rulesetEntryCount = rulesetData
    ? rulesetData.spells.length + rulesetData.items.length + rulesetData.monsters.length
    : 0;

  return (
    <PageShell
      eyebrow="Everything for D&D"
      title={t("dashboard.title","Masa hazır.")}
      description={t("dashboard.description","Karakter, campaign ve oyun araçlarına tek yerden ulaş. Gereken şey önde, geri kalan dijital çekmecelerde uslu uslu bekliyor.")}
    >
      <section className="dashboard-command-grid">
        <motion.article
          className="dashboard-command-card dashboard-command-primary"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 240, damping: 20 }}
        >
          <div className="dashboard-command-orb">d20</div>
          <span className="dashboard-kicker">{t("dashboard.quick","Hızlı başlangıç")}</span>
          <h2>{recentCharacter ? t("dashboard.continue",`${recentCharacter.name} ile devam et`,{name:recentCharacter.name}) : t("dashboard.createFirst","İlk karakterini oluştur")}</h2>
          <p>
            {recentCharacter
              ? `${recentCharacter.className} · ${t("dashboard.level","Seviye")} ${recentCharacter.level} · ${recentCharacter.currentHp}/${recentCharacter.maxHp} HP`
              : t("dashboard.builderHint","Builder ile karakterini kur, sonra Play Mode üzerinden doğrudan masaya geç.")}
          </p>

          <div className="quick-actions">
            <NavLink
              to={recentCharacter ? `/play-mode?character=${recentCharacter.id}` : "/builder"}
              className="primary-action"
            >
              {recentCharacter ? t("dashboard.openPlay","Play Mode'u Aç") : t("dashboard.create","Karakter Oluştur")}
            </NavLink>
            <NavLink to="/dice" className="secondary-action">
              {t("dashboard.roll","Zar At")}
            </NavLink>
          </div>
        </motion.article>

        <div className="dashboard-stat-grid">
          <NavLink to="/characters" className="dashboard-stat-card">
            <span>{t("dashboard.characters","Karakterler")}</span>
            <strong>{characters.length}</strong>
            <small>{recentCharacter ? t("dashboard.last",`Son: ${recentCharacter.name}`,{name:recentCharacter.name}) : t("dashboard.noRecords","Henüz kayıt yok")}</small>
          </NavLink>

          <NavLink to="/campaigns" className="dashboard-stat-card">
            <span>Campaigns</span>
            <strong>{campaigns.length}</strong>
            <small>{t("dashboard.activeEncounter",`${activeEncounterCount} aktif encounter`,{count:activeEncounterCount})}</small>
          </NavLink>

          <NavLink to="/campaigns" className="dashboard-stat-card">
            <span>{t("dashboard.activeQuest","Aktif Quest")}</span>
            <strong>{activeQuestCount}</strong>
            <small>{t("dashboard.fromCampaigns","Campaign kayıtlarından")}</small>
          </NavLink>

          <NavLink to="/homebrew-lab" className="dashboard-stat-card">
            <span>Homebrew</span>
            <strong>{homebrewCount}</strong>
            <small>Spell, item ve monster</small>
          </NavLink>
        </div>
      </section>


      <section className="dashboard-section favorite-dashboard-section">
        <div className="dashboard-section-head">
          <div>
            <span className="dashboard-kicker">Hızlı erişim</span>
            <h2>Favoriler ve son açılanlar</h2>
          </div>
          <NavLink to="/search" className="dashboard-text-link">
            Global aramayı aç →
          </NavLink>
        </div>

        <div className="favorite-dashboard-grid">
          <article className="favorite-dashboard-card">
            <div className="favorite-dashboard-card-head">
              <strong>Favoriler</strong>
              <span>{favorites.length}</span>
            </div>
            {favorites.length ? (
              <div className="favorite-quick-list">
                {favorites.slice(0, 6).map((item) => (
                  <NavLink key={item.id} to={item.to} onClick={() => recordRecent(item)}>
                    <span aria-hidden="true">{item.icon}</span>
                    <span><strong>{item.title}</strong><small>{item.category} · {item.subtitle}</small></span>
                  </NavLink>
                ))}
              </div>
            ) : (
              <p>Global Arama sonuçlarındaki yıldızla sık kullandığın kayıtları buraya sabitle.</p>
            )}
          </article>

          <article className="favorite-dashboard-card">
            <div className="favorite-dashboard-card-head">
              <strong>Son açılanlar</strong>
              {recentItems.length ? <button type="button" onClick={clearRecentItems}>Temizle</button> : null}
            </div>
            {recentItems.length ? (
              <div className="favorite-quick-list">
                {recentItems.slice(0, 6).map((item) => (
                  <NavLink key={item.id} to={item.to} onClick={() => recordRecent(item)}>
                    <span aria-hidden="true">{item.icon}</span>
                    <span><strong>{item.title}</strong><small>{item.category} · {item.subtitle}</small></span>
                  </NavLink>
                ))}
              </div>
            ) : (
              <p>Global Arama üzerinden açtığın kayıtlar burada görünür. Hafızaya iş bırakmıyoruz.</p>
            )}
          </article>

          <article className="favorite-dashboard-card">
            <div className="favorite-dashboard-card-head">
              <strong>Koleksiyonlar</strong>
              <span>{allTags.length}</span>
            </div>
            {allTags.length ? (
              <div className="dashboard-tag-list">
                {allTags.slice(0, 8).map((tag) => (
                  <NavLink key={tag} to="/collections">
                    <span>#{tag}</span>
                    <strong>{Object.values(itemTags).filter((tags) => tags.includes(tag)).length}</strong>
                  </NavLink>
                ))}
              </div>
            ) : (
              <p>Arama sonuçlarına etiket eklediğinde koleksiyonların burada görünür.</p>
            )}
          </article>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <div>
            <span className="dashboard-kicker">Masada gerekenler</span>
            <h2>Hızlı araçlar</h2>
          </div>
          <NavLink to="/backup" className="dashboard-text-link">
            Tam yedek al →
          </NavLink>
        </div>

        <div className="dashboard-tool-grid">
          <NavLink to="/play-mode" className="dashboard-tool-card">
            <span className="dashboard-tool-icon">▶</span>
            <strong>Play Mode</strong>
            <p>HP, slot, condition ve hızlı zarlar için sade masa ekranı.</p>
          </NavLink>
          <NavLink to="/campaigns" className="dashboard-tool-card">
            <span className="dashboard-tool-icon">✦</span>
            <strong>Campaign</strong>
            <p>Party, encounter, quest, timeline ve opsiyonel DM araçları.</p>
          </NavLink>
          <NavLink to="/spellbook" className="dashboard-tool-card">
            <span className="dashboard-tool-icon">✧</span>
            <strong>Spellbook</strong>
            <p>Büyüleri ara, filtrele ve homebrew kayıtlarla birlikte incele.</p>
          </NavLink>
          <NavLink to="/monsters" className="dashboard-tool-card">
            <span className="dashboard-tool-icon">♜</span>
            <strong>Monster Library</strong>
            <p>Canavarları bul, favorile ve combat araçlarına ulaş.</p>
          </NavLink>
        </div>
      </section>

      <section className="dashboard-recent-grid">
        <article className="dashboard-recent-card">
          <span className="dashboard-kicker">Son karakter</span>
          {recentCharacter ? (
            <>
              <h3>{recentCharacter.name}</h3>
              <p>
                {recentCharacter.race} {recentCharacter.className} · Seviye {recentCharacter.level}
              </p>
              <div className="dashboard-mini-stats">
                <span>{recentCharacter.currentHp}/{recentCharacter.maxHp} HP</span>
                <span>{recentCharacter.armorClass} AC</span>
                <span>{recentCharacter.conditions.length} condition</span>
                <span className={recentCharacterReadiness?.status === "ready" ? "play-ready" : "play-attention"}>{recentCharacterReadiness?.status === "ready" ? t("dashboard.ready","Oynamaya hazır") : `${recentCharacterReadiness?.score}%`}</span>
              </div>
              <NavLink to={`/characters/${recentCharacter.id}`} className="dashboard-text-link">
                Karakteri aç →
              </NavLink>
            </>
          ) : (
            <>
              <h3>Henüz karakter yok</h3>
              <p>Karakter olmadan D&D oynanabilir, ama genelde buna toplantı deniyor.</p>
              <NavLink to="/builder" className="dashboard-text-link">Builder'a git →</NavLink>
            </>
          )}
        </article>

        <article className="dashboard-recent-card">
          <span className="dashboard-kicker">Son campaign</span>
          {recentCampaign ? (
            <>
              <h3>{recentCampaign.name}</h3>
              <p>{recentCampaign.description || "Campaign açıklaması eklenmemiş."}</p>
              <div className="dashboard-mini-stats">
                <span>{recentCampaign.characterIds.length} karakter</span>
                <span>{recentCampaign.encounters.length} encounter</span>
                <span>{formatUpdatedAt(recentCampaign.updatedAt,intlLocale,t("dashboard.noDate","Tarih yok"))}</span>
              </div>
              <NavLink to="/campaigns" className="dashboard-text-link">Campaign'i aç →</NavLink>
            </>
          ) : (
            <>
              <h3>Henüz campaign yok</h3>
              <p>Party ve oturum kayıtlarını tek yerde tutmak için bir campaign oluştur.</p>
              <NavLink to="/campaigns" className="dashboard-text-link">Campaign oluştur →</NavLink>
            </>
          )}
        </article>

        <article className="dashboard-recent-card dashboard-system-card">
          <span className="dashboard-kicker">{t("dashboard.local","Yerel sistem")}</span>
          <h3>{t("dashboard.contentReady",`${rulesetEntryCount.toLocaleString(intlLocale)} içerik hazır`,{count:rulesetEntryCount.toLocaleString(intlLocale)})}</h3>
          <p>{t("dashboard.localNote","Veriler cihazında çalışıyor. Düzenli tam yedek almak hâlâ iyi fikir; teknoloji sadakat yemini etmiyor.")}</p>
          <div className="dashboard-mini-stats">
            <span>PWA</span>
            <span>Offline</span>
            <span>LocalStorage</span>
          </div>
          <NavLink to="/library" className="dashboard-text-link">Ruleset Library →</NavLink>
        </article>
      </section>
    </PageShell>
  );
}
