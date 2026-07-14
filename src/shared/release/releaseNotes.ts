export type ReleaseCategory = "Özellik" | "İyileştirme" | "Düzeltme" | "Teknik";

export type ReleaseChange = {
  text: string;
  category: ReleaseCategory;
};

export type ReleaseEntry = {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: ReleaseChange[];
};

export const RELEASE_NOTES: readonly ReleaseEntry[] = [
  {
    version: "1.3.0",
    date: "2026-07-14",
    title: "Global arama merkezi",
    summary:
      "Karakter, campaign, büyü, eşya, canavar, sayfa ve yardım içerikleri artık tek ayrıntılı arama ekranından bulunabiliyor.",
    changes: [
      { text: "Yeni Global Arama sayfası", category: "Özellik" },
      { text: "Yedi içerik türünde kategori filtreleme ve sonuç sayıları", category: "Özellik" },
      { text: "Campaign notları, NPC'ler, questler ve timeline içinde derin arama", category: "İyileştirme" },
      { text: "Homebrew içeriklerin sonuçlarda ayrı rozetle gösterilmesi", category: "İyileştirme" },
      { text: "Arama sorgularının URL üzerinden korunması ve paylaşılabilmesi", category: "İyileştirme" },
      { text: "Arama sıralama helper'ları için otomatik testler", category: "Teknik" },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-07-14",
    title: "Yardım merkezi ve yönlendirmeli başlangıç",
    summary:
      "Yeni yardım merkezi; oyuncu, DM, veri güvenliği ve PWA akışlarını aranabilir kısa rehberlerde topluyor.",
    changes: [
      { text: "Aranabilir ve kategori filtreli Yardım Merkezi", category: "Özellik" },
      { text: "Yerel olarak saklanan hızlı başlangıç kontrol listesi", category: "Özellik" },
      { text: "Karakter, Play Mode, campaign, encounter, homebrew ve backup rehberleri", category: "İyileştirme" },
      { text: "PWA kurulumu, çevrimdışı kullanım ve klavye kısayolu açıklamaları", category: "İyileştirme" },
      { text: "Sorun anında yedek ve kurtarma ekranına hızlı erişim", category: "Düzeltme" },
      { text: "Yardım sayfasının ayrı lazy-loaded route olarak eklenmesi", category: "Teknik" },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-07-14",
    title: "Sürüm geçmişi ve güncelleme detayları",
    summary:
      "Sürüm notları artık aranabilir, filtrelenebilir ve uygulama içinde kalıcı bir geçmiş ekranından incelenebilir.",
    changes: [
      { text: "Yeni Sürüm Geçmişi sayfası", category: "Özellik" },
      { text: "Sürüm ve değişiklik metninde arama", category: "Özellik" },
      { text: "Özellik, iyileştirme, düzeltme ve teknik filtreleri", category: "İyileştirme" },
      { text: "Mevcut sürüm ve build tarihinin görünür özeti", category: "İyileştirme" },
      { text: "Windows dosya adı casing çakışmasının kalıcı olarak ayrıştırılması", category: "Düzeltme" },
      { text: "Public npm registry zorlaması ve temiz lockfile", category: "Teknik" },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-07-14",
    title: "İlk kararlı sürüm",
    summary:
      "E4 D&D artık karakter, campaign, encounter, homebrew, Play Mode, yedekleme ve PWA akışlarını tek pakette sunan kararlı bir masa yardımcısı.",
    changes: [
      { text: "Karakter oluşturma, düzenleme, karşılaştırma ve level-up yardımcısı", category: "Özellik" },
      { text: "Spellbook, inventory, monster library ve homebrew araçları", category: "Özellik" },
      { text: "Campaign dashboard, encounter tracker ve isteğe bağlı DM modülleri", category: "Özellik" },
      { text: "Play Mode, autosave, güvenli veri kurtarma ve seçmeli backup import", category: "İyileştirme" },
      { text: "PWA kurulumu, çevrimdışı kullanım ve kontrollü güncelleme bildirimi", category: "İyileştirme" },
      { text: "Route splitting, performans iyileştirmeleri, testler ve otomatik deploy", category: "Teknik" },
    ],
  },
];

export const RELEASE_CATEGORIES: readonly ReleaseCategory[] = [
  "Özellik",
  "İyileştirme",
  "Düzeltme",
  "Teknik",
];

export function getCurrentRelease() {
  return (
    RELEASE_NOTES.find((release) => release.version === __APP_VERSION__) ??
    RELEASE_NOTES[0]
  );
}
