export type NavGroup = "Oyun" | "Ä°Ã§erik" | "YÃ¶netim";

export type NavItem = {
  to: string;
  label: string;
  shortLabel: string;
  icon: string;
  group: NavGroup;
  mobile?: boolean;
};

export const navItems: readonly NavItem[] = [
  { to: "/", label: "Dashboard", shortLabel: "Ana", icon: "âŒ‚", group: "Oyun", mobile: true },
  { to: "/play-mode", label: "Play Mode", shortLabel: "Oyna", icon: "â–¶", group: "Oyun", mobile: true },
  { to: "/characters", label: "Karakterler", shortLabel: "Karakter", icon: "â—ˆ", group: "Oyun", mobile: true },
  { to: "/campaigns", label: "Campaigns", shortLabel: "Campaign", icon: "âœ¦", group: "Oyun", mobile: true },
  { to: "/dice", label: "Zar", shortLabel: "Zar", icon: "â—†", group: "Oyun", mobile: true },
  { to: "/search", label: "Global Arama", shortLabel: "Ara", icon: "âŒ•", group: "Ä°Ã§erik" },
  { to: "/builder", label: "Character Builder", shortLabel: "Builder", icon: "+", group: "Ä°Ã§erik" },
  { to: "/spellbook", label: "Spellbook", shortLabel: "Spells", icon: "âœ§", group: "Ä°Ã§erik" },
  { to: "/inventory", label: "Inventory", shortLabel: "EÅŸya", icon: "â–£", group: "Ä°Ã§erik" },
  { to: "/monsters", label: "Monsters", shortLabel: "Monster", icon: "â™œ", group: "Ä°Ã§erik" },
  { to: "/homebrew-lab", label: "Homebrew Lab", shortLabel: "Homebrew", icon: "âš—", group: "Ä°Ã§erik" },
  { to: "/library", label: "Ruleset Library", shortLabel: "Library", icon: "â–¤", group: "YÃ¶netim" },
  { to: "/backup", label: "Yedek & Kurtarma", shortLabel: "Yedek", icon: "â†¥", group: "YÃ¶netim" },
  { to: "/settings", label: "Ayarlar", shortLabel: "Ayarlar", icon: "âš™", group: "YÃ¶netim" },
  { to: "/updates", label: "SÃ¼rÃ¼m GeÃ§miÅŸi", shortLabel: "SÃ¼rÃ¼mler", icon: "â—´", group: "YÃ¶netim" },
  { to: "/help", label: "YardÄ±m Merkezi", shortLabel: "YardÄ±m", icon: "?", group: "YÃ¶netim" },
] as const;

export const navGroups: readonly NavGroup[] = ["Oyun", "Ä°Ã§erik", "YÃ¶netim"];

