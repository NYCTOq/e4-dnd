import type { AppLocale } from "../settings/appSettings";

export const ENGLISH_TRANSLATIONS: Readonly<Record<string, string>> = {
  "nav.group.Oyun":"Play","nav.group.İçerik":"Content","nav.group.Yönetim":"Management",
  "nav.skip":"Skip to main content","nav.sidebar":"Application menu","nav.main":"Main navigation","nav.mobile":"Mobile navigation","nav.home":"E4 D&D home",
  "nav./":"Dashboard","nav./play-mode":"Play Mode","nav./characters":"Characters","nav./campaigns":"Campaigns","nav./session-planner":"Session Planner","nav./npcs":"NPC Manager","nav./locations":"World Atlas","nav./factions":"Factions","nav./quests":"Quest Journal","nav./loot":"Loot Tracker","nav./combat":"Combat Tracker","nav./calendar":"Campaign Calendar","nav./rest":"Rest Center","nav./dice":"Dice","nav./search":"Global Search","nav./collections":"Collections","nav./builder":"Character Builder","nav./classes":"Classes","nav./subclasses":"Subclasses","nav./origins":"Species & Backgrounds","nav./feats":"Feats","nav./spellbook":"Spellbook","nav./inventory":"Inventory","nav./monsters":"Monsters","nav./homebrew-lab":"Homebrew Lab","nav./rulesets":"Ruleset Center","nav./library":"Ruleset Library","nav./backup":"Backup & Recovery","nav./player-test":"Player Test Center","nav./settings":"Settings","nav./updates":"Release History","nav./help":"Help Center",
  "short./":"Home","short./play-mode":"Play","short./characters":"Character","short./campaigns":"Campaign","short./dice":"Dice",
  "dashboard.title":"The table is ready.","dashboard.description":"Access characters, campaigns, and play tools from one place. What you need stays up front.","dashboard.quick":"Quick start","dashboard.continue":"Continue with {name}","dashboard.createFirst":"Create your first character","dashboard.level":"Level","dashboard.builderHint":"Build your character, then move directly to the table through Play Mode.","dashboard.openPlay":"Open Play Mode","dashboard.create":"Create Character","dashboard.roll":"Roll Dice","dashboard.characters":"Characters","dashboard.noRecords":"No records yet","dashboard.last":"Last: {name}","dashboard.activeEncounter":"{count} active encounters","dashboard.activeQuest":"Active Quests","dashboard.fromCampaigns":"From campaign records","dashboard.ready":"Ready to play","dashboard.contentReady":"{count} entries ready","dashboard.local":"Local system","dashboard.localNote":"Your data works on this device. Taking regular full backups is still a good idea.","dashboard.noDate":"No date",
  "settings.language":"Language","settings.languageTitle":"Interface language","settings.languageNote":"Language changes immediately and does not modify character or ruleset data.","settings.turkish":"Türkçe","settings.english":"English","a11y.routeOpened":"{page} page opened."
  ,"play.ready":"Character ready for the table","play.score":"Readiness score: {score}%","play.readyDetail":"HP, progression, choices, spells, and equipment links are playable.","play.errors":"{count} required fixes remain.","play.edit":"Edit character","play.fix":"Fix issues"
};

export function translate(locale: AppLocale, key: string, fallback: string, values: Record<string, string | number> = {}) {
  const template = locale === "en" ? ENGLISH_TRANSLATIONS[key] ?? fallback : fallback;
  return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template);
}

export const getIntlLocale = (locale: AppLocale) => locale === "en" ? "en-US" : "tr-TR";

export const hasEnglishTranslation = (key: string) => Object.prototype.hasOwnProperty.call(ENGLISH_TRANSLATIONS, key);

export function getEnglishTranslationCoverage(keys: string[]) {
  const unique = [...new Set(keys)];
  const missing = unique.filter((key) => !hasEnglishTranslation(key));
  return { total: unique.length, translated: unique.length - missing.length, missing };
}
