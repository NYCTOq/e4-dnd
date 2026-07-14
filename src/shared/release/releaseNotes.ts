export type ReleaseEntry = {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: string[];
};

export const RELEASE_NOTES: readonly ReleaseEntry[] = [
  {
    version: "1.0.0",
    date: "2026-07-14",
    title: "İlk kararlı sürüm",
    summary:
      "E4 D&D artık karakter, campaign, encounter, homebrew, Play Mode, yedekleme ve PWA akışlarını tek pakette sunan kararlı bir masa yardımcısı.",
    changes: [
      "Karakter oluşturma, düzenleme, karşılaştırma ve level-up yardımcısı",
      "Spellbook, inventory, monster library ve homebrew araçları",
      "Campaign dashboard, encounter tracker ve isteğe bağlı DM modülleri",
      "Play Mode, autosave, güvenli veri kurtarma ve seçmeli backup import",
      "PWA kurulumu, çevrimdışı kullanım ve kontrollü güncelleme bildirimi",
      "Route splitting, performans iyileştirmeleri, testler ve otomatik deploy",
    ],
  },
];

export function getCurrentRelease() {
  return (
    RELEASE_NOTES.find((release) => release.version === __APP_VERSION__) ??
    RELEASE_NOTES[0]
  );
}
