export type NavGroup = "Oyun" | "İçerik" | "Yönetim";

export type NavItem = {
  to: string;
  label: string;
  shortLabel: string;
  icon: string;
  group: NavGroup;
  mobile?: boolean;
};

export const navItems: readonly NavItem[] = [
  { to: "/", label: "Dashboard", shortLabel: "Ana", icon: "⌂", group: "Oyun", mobile: true },
  { to: "/play-mode", label: "Play Mode", shortLabel: "Oyna", icon: "▶", group: "Oyun", mobile: true },
  { to: "/characters", label: "Karakterler", shortLabel: "Karakter", icon: "◈", group: "Oyun", mobile: true },
  { to: "/campaigns", label: "Campaigns", shortLabel: "Campaign", icon: "✦", group: "Oyun", mobile: true },
  { to: "/session-planner", label: "Session Planner", shortLabel: "Oturum", icon: "◫", group: "Oyun" },
  { to: "/npcs", label: "NPC Manager", shortLabel: "NPC", icon: "♟", group: "Oyun" },
  { to: "/locations", label: "World Atlas", shortLabel: "Atlas", icon: "⌖", group: "Oyun" },
  { to: "/factions", label: "Factions", shortLabel: "Örgüt", icon: "⚑", group: "Oyun" },
  { to: "/quests", label: "Quest Journal", shortLabel: "Görev", icon: "☑", group: "Oyun" },
  { to: "/loot", label: "Loot Tracker", shortLabel: "Ganimet", icon: "◉", group: "Oyun" },
  { to: "/combat", label: "Combat Tracker", shortLabel: "Savaş", icon: "⚔", group: "Oyun" },
  { to: "/dice", label: "Zar", shortLabel: "Zar", icon: "◆", group: "Oyun", mobile: true },
  { to: "/search", label: "Global Arama", shortLabel: "Ara", icon: "⌕", group: "İçerik" },
  { to: "/collections", label: "Koleksiyonlar", shortLabel: "Etiket", icon: "#", group: "İçerik" },
  { to: "/builder", label: "Character Builder", shortLabel: "Builder", icon: "+", group: "İçerik" },
  { to: "/spellbook", label: "Spellbook", shortLabel: "Spells", icon: "✧", group: "İçerik" },
  { to: "/inventory", label: "Inventory", shortLabel: "Eşya", icon: "▣", group: "İçerik" },
  { to: "/monsters", label: "Monsters", shortLabel: "Monster", icon: "♜", group: "İçerik" },
  { to: "/homebrew-lab", label: "Homebrew Lab", shortLabel: "Homebrew", icon: "⚗", group: "İçerik" },
  { to: "/library", label: "Ruleset Library", shortLabel: "Library", icon: "▤", group: "Yönetim" },
  { to: "/backup", label: "Yedek & Kurtarma", shortLabel: "Yedek", icon: "↥", group: "Yönetim" },
  { to: "/settings", label: "Ayarlar", shortLabel: "Ayarlar", icon: "⚙", group: "Yönetim" },
  { to: "/updates", label: "Sürüm Geçmişi", shortLabel: "Sürümler", icon: "◴", group: "Yönetim" },
  { to: "/help", label: "Yardım Merkezi", shortLabel: "Yardım", icon: "?", group: "Yönetim" },
] as const;

export const navGroups: readonly NavGroup[] = ["Oyun", "İçerik", "Yönetim"];
