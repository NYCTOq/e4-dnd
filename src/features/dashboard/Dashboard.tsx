import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import type { Character } from "../../core/character/character.types";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import type { Campaign } from "../campaigns/campaignTypes";
import { PageShell } from "../../shared/layout/PageShell";

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
      title="Masa hazÄ±r."
      description="Karakter, campaign ve oyun araÃ§larÄ±na tek yerden ulaÅŸ. Gereken ÅŸey Ã¶nde, geri kalan dijital Ã§ekmecelerde uslu uslu bekliyor."
    >
      <section className="dashboard-command-grid">
        <motion.article
          className="dashboard-command-card dashboard-command-primary"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 240, damping: 20 }}
        >
          <div className="dashboard-command-orb">d20</div>
          <span className="dashboard-kicker">HÄ±zlÄ± baÅŸlangÄ±Ã§</span>
          <h2>{recentCharacter ? `${recentCharacter.name} ile devam et` : "Ä°lk karakterini oluÅŸtur"}</h2>
          <p>
            {recentCharacter
              ? `${recentCharacter.className} Â· Seviye ${recentCharacter.level} Â· ${recentCharacter.currentHp}/${recentCharacter.maxHp} HP`
              : "Builder ile karakterini kur, sonra Play Mode Ã¼zerinden doÄŸrudan masaya geÃ§."}
          </p>

          <div className="quick-actions">
            <NavLink
              to={recentCharacter ? "/play-mode" : "/builder"}
              className="primary-action"
            >
              {recentCharacter ? "Play Mode'u AÃ§" : "Karakter OluÅŸtur"}
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
            <small>{recentCharacter ? `Son: ${recentCharacter.name}` : "HenÃ¼z kayÄ±t yok"}</small>
          </NavLink>

          <NavLink to="/campaigns" className="dashboard-stat-card">
            <span>Campaigns</span>
            <strong>{campaigns.length}</strong>
            <small>{activeEncounterCount} aktif encounter</small>
          </NavLink>

          <NavLink to="/campaigns" className="dashboard-stat-card">
            <span>Aktif Quest</span>
            <strong>{activeQuestCount}</strong>
            <small>Campaign kayÄ±tlarÄ±ndan</small>
          </NavLink>

          <NavLink to="/homebrew-lab" className="dashboard-stat-card">
            <span>Homebrew</span>
            <strong>{homebrewCount}</strong>
            <small>Spell, item ve monster</small>
          </NavLink>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <div>
            <span className="dashboard-kicker">Masada gerekenler</span>
            <h2>HÄ±zlÄ± araÃ§lar</h2>
          </div>
          <NavLink to="/backup" className="dashboard-text-link">
            Tam yedek al â†’
          </NavLink>
        </div>

        <div className="dashboard-tool-grid">
          <NavLink to="/play-mode" className="dashboard-tool-card">
            <span className="dashboard-tool-icon">â–¶</span>
            <strong>Play Mode</strong>
            <p>HP, slot, condition ve hÄ±zlÄ± zarlar iÃ§in sade masa ekranÄ±.</p>
          </NavLink>
          <NavLink to="/campaigns" className="dashboard-tool-card">
            <span className="dashboard-tool-icon">âœ¦</span>
            <strong>Campaign</strong>
            <p>Party, encounter, quest, timeline ve opsiyonel DM araÃ§larÄ±.</p>
          </NavLink>
          <NavLink to="/spellbook" className="dashboard-tool-card">
            <span className="dashboard-tool-icon">âœ§</span>
            <strong>Spellbook</strong>
            <p>BÃ¼yÃ¼leri ara, filtrele ve homebrew kayÄ±tlarla birlikte incele.</p>
          </NavLink>
          <NavLink to="/monsters" className="dashboard-tool-card">
            <span className="dashboard-tool-icon">â™œ</span>
            <strong>Monster Library</strong>
            <p>CanavarlarÄ± bul, favorile ve combat araÃ§larÄ±na ulaÅŸ.</p>
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
                {recentCharacter.race} {recentCharacter.className} Â· Seviye {recentCharacter.level}
              </p>
              <div className="dashboard-mini-stats">
                <span>{recentCharacter.currentHp}/{recentCharacter.maxHp} HP</span>
                <span>{recentCharacter.armorClass} AC</span>
                <span>{recentCharacter.conditions.length} condition</span>
              </div>
              <NavLink to={`/characters/${recentCharacter.id}`} className="dashboard-text-link">
                Karakteri aÃ§ â†’
              </NavLink>
            </>
          ) : (
            <>
              <h3>HenÃ¼z karakter yok</h3>
              <p>Karakter olmadan D&D oynanabilir, ama genelde buna toplantÄ± deniyor.</p>
              <NavLink to="/builder" className="dashboard-text-link">Builder'a git â†’</NavLink>
            </>
          )}
        </article>

        <article className="dashboard-recent-card">
          <span className="dashboard-kicker">Son campaign</span>
          {recentCampaign ? (
            <>
              <h3>{recentCampaign.name}</h3>
              <p>{recentCampaign.description || "Campaign aÃ§Ä±klamasÄ± eklenmemiÅŸ."}</p>
              <div className="dashboard-mini-stats">
                <span>{recentCampaign.characterIds.length} karakter</span>
                <span>{recentCampaign.encounters.length} encounter</span>
                <span>{formatUpdatedAt(recentCampaign.updatedAt)}</span>
              </div>
              <NavLink to="/campaigns" className="dashboard-text-link">Campaign'i aÃ§ â†’</NavLink>
            </>
          ) : (
            <>
              <h3>HenÃ¼z campaign yok</h3>
              <p>Party ve oturum kayÄ±tlarÄ±nÄ± tek yerde tutmak iÃ§in bir campaign oluÅŸtur.</p>
              <NavLink to="/campaigns" className="dashboard-text-link">Campaign oluÅŸtur â†’</NavLink>
            </>
          )}
        </article>

        <article className="dashboard-recent-card dashboard-system-card">
          <span className="dashboard-kicker">Yerel sistem</span>
          <h3>{rulesetEntryCount.toLocaleString("tr-TR")} iÃ§erik hazÄ±r</h3>
          <p>Veriler cihazÄ±nda Ã§alÄ±ÅŸÄ±yor. DÃ¼zenli tam yedek almak hÃ¢lÃ¢ iyi fikir; teknoloji sadakat yemini etmiyor.</p>
          <div className="dashboard-mini-stats">
            <span>PWA</span>
            <span>Offline</span>
            <span>LocalStorage</span>
          </div>
          <NavLink to="/library" className="dashboard-text-link">Ruleset Library â†’</NavLink>
        </article>
      </section>
    </PageShell>
  );
}

