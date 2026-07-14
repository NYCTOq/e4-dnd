import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { PageShell } from "../../shared/layout/PageShell";
import {
  getItemCategoryLabel,
  getItemRulesSummary,
} from "../characters/characterShared";

export function Library({

  rulesetData,
  isRulesetLoading,
  rulesetError,
}: {
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  return (
    <PageShell
      eyebrow="Ruleset Library"
      title="Library"
      description="D&D 2014, D&D 2024 ve homebrew data pack iÃ§erikleri burada okunacak. Åimdilik ilk veri akÄ±ÅŸÄ±nÄ± D&D 2014 ile baÅŸlatÄ±yoruz."
    >
      {isRulesetLoading ? (
        <div className="empty-panel">
          <h2>Data yÃ¼kleniyor...</h2>
          <p>Kural kitabÄ±nÄ± tarayÄ±cÄ±ya yediriyoruz. ZavallÄ± ÅŸey.</p>
        </div>
      ) : rulesetError ? (
        <div className="empty-panel">
          <h2>Data yÃ¼klenemedi</h2>
          <p>{rulesetError}</p>
        </div>
      ) : rulesetData ? (
        <div className="library-data-layout">
          <section className="library-overview-card">
            <span className="mini-label">Loaded Ruleset</span>
            <h2>{rulesetData.name}</h2>
            <p>
              Åu an app iÃ§ine local JSON data pack Ã¼zerinden class ve race
              verisi yÃ¼klendi. Bir sonraki hamlede Builder inputlarÄ±nÄ± bu
              datadan besleyeceÄŸiz.
            </p>

            <div className="library-counter-grid">
              <div>
                <strong>{rulesetData.classes.length}</strong>
                <span>Classes</span>
              </div>

              <div>
                <strong>{rulesetData.races.length}</strong>
                <span>Races</span>
              </div>

              <div>
                <strong>{rulesetData.spells.length}</strong>
                <span>Spells</span>
              </div>

              <div>
                <strong>{rulesetData.items.length}</strong>
                <span>Items</span>
              </div>

              <div>
                <strong>{rulesetData.monsters.length}</strong>
                <span>Monsters</span>
              </div>
            </div>
          </section>

          <section className="library-section-card">
            <div className="library-section-head">
              <div>
                <span className="mini-label">Classes</span>
                <h2>Class Listesi</h2>
              </div>
            </div>

            <div className="library-list-grid">
              {rulesetData.classes.map((classItem) => (
                <article className="library-item-card" key={classItem.id}>
                  <div className="library-item-top">
                    <h3>{classItem.name}</h3>
                    <span>d{classItem.hitDie}</span>
                  </div>

                  <p>{classItem.description}</p>

                  <div className="library-pill-row">
                    <span>
                      Saves:{" "}
                      {classItem.savingThrows
                        .map((save) => save.toUpperCase())
                        .join(", ")}
                    </span>

                    {classItem.spellcastingAbility ? (
                      <span>
                        Spell: {classItem.spellcastingAbility.toUpperCase()}
                      </span>
                    ) : (
                      <span>No spellcasting</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="library-section-card">
            <div className="library-section-head">
              <div>
                <span className="mini-label">Races</span>
                <h2>Race Listesi</h2>
              </div>
            </div>

            <div className="library-list-grid">
              {rulesetData.races.map((race) => (
                <article className="library-item-card" key={race.id}>
                  <div className="library-item-top">
                    <h3>{race.name}</h3>
                    <span>{race.speed} ft</span>
                  </div>

                  <p>{race.description}</p>

                  <div className="library-pill-row">
                    <span>{race.size}</span>

                    <span>
                      Bonus:{" "}
                      {Object.entries(race.abilityBonuses)
                        .map(
                          ([ability, bonus]) =>
                            `${ability.toUpperCase()} +${bonus}`,
                        )
                        .join(", ")}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="library-section-card">
            <div className="library-section-head">
              <div>
                <span className="mini-label">Spells</span>
                <h2>Spell Listesi</h2>
              </div>
            </div>

            <div className="library-list-grid">
              {rulesetData.spells.slice(0, 8).map((spell) => (
                <article className="library-item-card" key={spell.id}>
                  <div className="library-item-top">
                    <h3>{spell.name}</h3>
                    <span>
                      {spell.level === 0 ? "Cantrip" : `Lv. ${spell.level}`}
                    </span>
                  </div>

                  <p>{spell.description}</p>

                  <div className="library-pill-row">
                    <span>{spell.school}</span>
                    <span>{spell.castingTime}</span>
                    <span>{spell.range}</span>
                    {spell.concentration ? <span>Concentration</span> : null}
                    {spell.ritual ? <span>Ritual</span> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="library-section-card">
            <div className="library-section-head">
              <div>
                <span className="mini-label">Items</span>
                <h2>Item Listesi</h2>
              </div>
            </div>

            <div className="library-list-grid">
              {rulesetData.items.slice(0, 8).map((item) => (
                <article className="library-item-card" key={item.id}>
                  <div className="library-item-top">
                    <h3>{item.name}</h3>
                    <span>{getItemCategoryLabel(item.category)}</span>
                  </div>

                  <p>{item.description}</p>

                  <div className="library-pill-row">
                    <span>{getItemRulesSummary(item)}</span>
                    <span>{item.cost}</span>
                    <span>{item.weight} lb</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="library-section-card">
            <div className="library-section-head">
              <div>
                <span className="mini-label">Monsters</span>
                <h2>Monster Ã–nizleme</h2>
              </div>
            </div>

            <div className="library-list-grid">
              {rulesetData.monsters.slice(0, 8).map((monster) => (
                <article className="library-item-card" key={monster.id}>
                  <div className="library-item-top">
                    <h3>{monster.name}</h3>
                    <span>CR {monster.challengeRating}</span>
                  </div>

                  <p>{monster.description}</p>

                  <div className="library-pill-row">
                    <span>
                      {monster.size} {monster.type}
                    </span>
                    <span>AC {monster.armorClass}</span>
                    <span>HP {monster.hitPoints}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
