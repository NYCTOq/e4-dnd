export type NavGroup = "Oyuncu" | "Kampanya" | "Dünya" | "Kurallar" | "Homebrew" | "Sistem";

export type NavItem = {
  to: string;
  label: string;
  shortLabel: string;
  icon: string;
  group: NavGroup;
  mobileQuick?: boolean;
};

export const navItems: readonly NavItem[] = [
  { to: "/", label: "Dashboard", shortLabel: "Ana", icon: "⌂", group: "Oyuncu", mobileQuick: true },
  { to: "/play-mode", label: "Play Mode", shortLabel: "Oyna", icon: "▶", group: "Oyuncu", mobileQuick: true },
  { to: "/characters", label: "Karakterler", shortLabel: "Karakter", icon: "◈", group: "Oyuncu", mobileQuick: true },
  { to: "/builder", label: "Character Builder", shortLabel: "Builder", icon: "+", group: "Oyuncu" },
  { to: "/spellbook", label: "Spellbook", shortLabel: "Spells", icon: "✧", group: "Oyuncu" },
  { to: "/inventory", label: "Inventory", shortLabel: "Eşya", icon: "▣", group: "Oyuncu" },
  { to: "/rest", label: "Rest Center", shortLabel: "Dinlen", icon: "☾", group: "Oyuncu" },
  { to: "/dice", label: "Zar", shortLabel: "Zar", icon: "◆", group: "Oyuncu", mobileQuick: true },

  { to: "/campaigns", label: "Campaigns", shortLabel: "Campaign", icon: "✦", group: "Kampanya" },
  { to: "/session-planner", label: "Session Planner", shortLabel: "Oturum", icon: "◫", group: "Kampanya" },
  { to: "/combat", label: "Combat Tracker", shortLabel: "Savaş", icon: "⚔", group: "Kampanya" },
  { to: "/calendar", label: "Campaign Calendar", shortLabel: "Takvim", icon: "◷", group: "Kampanya" },
  { to: "/quests", label: "Quest Journal", shortLabel: "Görev", icon: "☑", group: "Kampanya" },
  { to: "/loot", label: "Loot Tracker", shortLabel: "Ganimet", icon: "◉", group: "Kampanya" },

  { to: "/npcs", label: "NPC Manager", shortLabel: "NPC", icon: "♟", group: "Dünya" },
  { to: "/locations", label: "World Atlas", shortLabel: "Atlas", icon: "⌖", group: "Dünya" },
  { to: "/factions", label: "Factions", shortLabel: "Örgüt", icon: "⚑", group: "Dünya" },
  { to: "/monsters", label: "Monsters", shortLabel: "Monster", icon: "♜", group: "Dünya" },

  { to: "/search", label: "Global Arama", shortLabel: "Ara", icon: "⌕", group: "Kurallar" },
  { to: "/collections", label: "Koleksiyonlar", shortLabel: "Etiket", icon: "#", group: "Kurallar" },
  { to: "/classes", label: "Classes", shortLabel: "Class", icon: "◇", group: "Kurallar" },
  { to: "/subclasses", label: "Subclasses", shortLabel: "Subclass", icon: "△", group: "Kurallar" },
  { to: "/origins", label: "Species & Backgrounds", shortLabel: "Origins", icon: "◌", group: "Kurallar" },
  { to: "/feats", label: "Feats", shortLabel: "Feats", icon: "✦", group: "Kurallar" },

  { to: "/homebrew-lab", label: "Homebrew Lab", shortLabel: "Homebrew", icon: "⚗", group: "Homebrew" },
  { to: "/rulesets", label: "Ruleset Center", shortLabel: "Ruleset", icon: "◫", group: "Homebrew" },
  { to: "/library", label: "Ruleset Library", shortLabel: "Library", icon: "▤", group: "Homebrew" },

  { to: "/backup", label: "Yedek & Kurtarma", shortLabel: "Yedek", icon: "↥", group: "Sistem" },
  { to: "/player-test", label: "Oyuncu Test Merkezi", shortLabel: "Test", icon: "✓", group: "Sistem" },
  { to: "/settings", label: "Ayarlar", shortLabel: "Ayarlar", icon: "⚙", group: "Sistem" },
  { to: "/updates", label: "Sürüm Geçmişi", shortLabel: "Sürümler", icon: "◴", group: "Sistem" },
  { to: "/help", label: "Yardım Merkezi", shortLabel: "Yardım", icon: "?", group: "Sistem" },
] as const;

export const navGroups: readonly NavGroup[] = ["Oyuncu", "Kampanya", "Dünya", "Kurallar", "Homebrew", "Sistem"];

export const getNavGroupForPath = (pathname: string): NavGroup =>
  navItems.find((item) => item.to === pathname)?.group ?? "Oyuncu";

export const getMobileQuickItems = () => navItems.filter((item) => item.mobileQuick);
