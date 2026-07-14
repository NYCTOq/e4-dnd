import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import type { Character } from "../../core/character/character.types";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import type { Campaign } from "../campaigns/campaignTypes";
import { PageShell } from "../../shared/layout/PageShell";
import { useFavorites } from "../../shared/favorites/FavoritesProvider";

type DashboardProps = {
  characters: Character[];
  campaigns: Campaign[];
  rulesetData: RulesetData | null;
  homebrewCount: number;
};

function formatUpdatedAt(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Tarih yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
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
  const { favorites, recentItems, recordRecent, clearRecentItems } = useFavorites();
  const recentCharacter = [...characters].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )[0];
  const recentCampaign = [...campaigns].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )[0];
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
      title="Masa hazır."
      description="Karakter, campaign ve oyun araçlarına tek yerden ulaş. Gereken şey önde, geri kalan dijital çekmecelerde uslu uslu bekliyor."
    >
      <section className="dashboard-command-grid">
        <motion.article
          className="dashboard-command-card dashboard-command-primary"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 240, damping: 20 }}
        >
          <div className="dashboard-command-orb">d20</div>
          <span className="dashboard-kicker">Hızlı başlangıç</span>
          <h2>{recentCharacter ? `${recentCharacter.name} ile devam et` : "İlk karakterini oluştur"}</h2>
          <p>
            {recentCharacter
              ? `${recentCharacter.className} · Seviye ${recentCharacter.level} · ${recentCharacter.currentHp}/${recentCharacter.maxHp} HP`
              : "Builder ile karakterini kur, sonra Play Mode üzerinden doğrudan masaya geç."}
          </p>

          <div className="quick-actions">
            <NavLink
              to={recentCharacter ? "/play-mode" : "/builder"}
              className="primary-action"
            >
              {recentCharacter ? "Play Mode'u Aç" : "Karakter Oluştur"}
            </NavLink>
            <NavLink to="/dice" className="secondary-action">
              Zar At
            </NavLink>
          </div>
        </motion.article>

        <div className="dashboard-stat-grid">
          <NavLink to="/characters" className="dashboard-stat-card">
            <span>Karakterler</span>
            <strong>{characters.length}</strong>
            <small>{recentCharacter ? `Son: ${recentCharacter.name}` : "Henüz kayıt yok"}</small>
          </NavLink>

          <NavLink to="/campaigns" className="dashboard-stat-card">
            <span>Campaigns</span>
            <strong>{campaigns.length}</strong>
            <small>{activeEncounterCount} aktif encounter</small>
          </NavLink>

          <NavLink to="/campaigns" className="dashboard-stat-card">
            <span>Aktif Quest</span>
            <strong>{activeQuestCount}</strong>
            <small>Campaign kayıtlarından</small>
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
                <span>{formatUpdatedAt(recentCampaign.updatedAt)}</span>
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
          <span className="dashboard-kicker">Yerel sistem</span>
          <h3>{rulesetEntryCount.toLocaleString("tr-TR")} içerik hazır</h3>
          <p>Veriler cihazında çalışıyor. Düzenli tam yedek almak hâlâ iyi fikir; teknoloji sadakat yemini etmiyor.</p>
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
