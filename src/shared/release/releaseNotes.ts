export type ReleaseCategory = "Ã–zellik" | "Ä°yileÅŸtirme" | "DÃ¼zeltme" | "Teknik";

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
      "Karakter, campaign, bÃ¼yÃ¼, eÅŸya, canavar, sayfa ve yardÄ±m iÃ§erikleri artÄ±k tek ayrÄ±ntÄ±lÄ± arama ekranÄ±ndan bulunabiliyor.",
    changes: [
      { text: "Yeni Global Arama sayfasÄ±", category: "Ã–zellik" },
      { text: "Yedi iÃ§erik tÃ¼rÃ¼nde kategori filtreleme ve sonuÃ§ sayÄ±larÄ±", category: "Ã–zellik" },
      { text: "Campaign notlarÄ±, NPC'ler, questler ve timeline iÃ§inde derin arama", category: "Ä°yileÅŸtirme" },
      { text: "Homebrew iÃ§eriklerin sonuÃ§larda ayrÄ± rozetle gÃ¶sterilmesi", category: "Ä°yileÅŸtirme" },
      { text: "Arama sorgularÄ±nÄ±n URL Ã¼zerinden korunmasÄ± ve paylaÅŸÄ±labilmesi", category: "Ä°yileÅŸtirme" },
      { text: "Arama sÄ±ralama helper'larÄ± iÃ§in otomatik testler", category: "Teknik" },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-07-14",
    title: "YardÄ±m merkezi ve yÃ¶nlendirmeli baÅŸlangÄ±Ã§",
    summary:
      "Yeni yardÄ±m merkezi; oyuncu, DM, veri gÃ¼venliÄŸi ve PWA akÄ±ÅŸlarÄ±nÄ± aranabilir kÄ±sa rehberlerde topluyor.",
    changes: [
      { text: "Aranabilir ve kategori filtreli YardÄ±m Merkezi", category: "Ã–zellik" },
      { text: "Yerel olarak saklanan hÄ±zlÄ± baÅŸlangÄ±Ã§ kontrol listesi", category: "Ã–zellik" },
      { text: "Karakter, Play Mode, campaign, encounter, homebrew ve backup rehberleri", category: "Ä°yileÅŸtirme" },
      { text: "PWA kurulumu, Ã§evrimdÄ±ÅŸÄ± kullanÄ±m ve klavye kÄ±sayolu aÃ§Ä±klamalarÄ±", category: "Ä°yileÅŸtirme" },
      { text: "Sorun anÄ±nda yedek ve kurtarma ekranÄ±na hÄ±zlÄ± eriÅŸim", category: "DÃ¼zeltme" },
      { text: "YardÄ±m sayfasÄ±nÄ±n ayrÄ± lazy-loaded route olarak eklenmesi", category: "Teknik" },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-07-14",
    title: "SÃ¼rÃ¼m geÃ§miÅŸi ve gÃ¼ncelleme detaylarÄ±",
    summary:
      "SÃ¼rÃ¼m notlarÄ± artÄ±k aranabilir, filtrelenebilir ve uygulama iÃ§inde kalÄ±cÄ± bir geÃ§miÅŸ ekranÄ±ndan incelenebilir.",
    changes: [
      { text: "Yeni SÃ¼rÃ¼m GeÃ§miÅŸi sayfasÄ±", category: "Ã–zellik" },
      { text: "SÃ¼rÃ¼m ve deÄŸiÅŸiklik metninde arama", category: "Ã–zellik" },
      { text: "Ã–zellik, iyileÅŸtirme, dÃ¼zeltme ve teknik filtreleri", category: "Ä°yileÅŸtirme" },
      { text: "Mevcut sÃ¼rÃ¼m ve build tarihinin gÃ¶rÃ¼nÃ¼r Ã¶zeti", category: "Ä°yileÅŸtirme" },
      { text: "Windows dosya adÄ± casing Ã§akÄ±ÅŸmasÄ±nÄ±n kalÄ±cÄ± olarak ayrÄ±ÅŸtÄ±rÄ±lmasÄ±", category: "DÃ¼zeltme" },
      { text: "Public npm registry zorlamasÄ± ve temiz lockfile", category: "Teknik" },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-07-14",
    title: "Ä°lk kararlÄ± sÃ¼rÃ¼m",
    summary:
      "E4 D&D artÄ±k karakter, campaign, encounter, homebrew, Play Mode, yedekleme ve PWA akÄ±ÅŸlarÄ±nÄ± tek pakette sunan kararlÄ± bir masa yardÄ±mcÄ±sÄ±.",
    changes: [
      { text: "Karakter oluÅŸturma, dÃ¼zenleme, karÅŸÄ±laÅŸtÄ±rma ve level-up yardÄ±mcÄ±sÄ±", category: "Ã–zellik" },
      { text: "Spellbook, inventory, monster library ve homebrew araÃ§larÄ±", category: "Ã–zellik" },
      { text: "Campaign dashboard, encounter tracker ve isteÄŸe baÄŸlÄ± DM modÃ¼lleri", category: "Ã–zellik" },
      { text: "Play Mode, autosave, gÃ¼venli veri kurtarma ve seÃ§meli backup import", category: "Ä°yileÅŸtirme" },
      { text: "PWA kurulumu, Ã§evrimdÄ±ÅŸÄ± kullanÄ±m ve kontrollÃ¼ gÃ¼ncelleme bildirimi", category: "Ä°yileÅŸtirme" },
      { text: "Route splitting, performans iyileÅŸtirmeleri, testler ve otomatik deploy", category: "Teknik" },
    ],
  },
];

export const RELEASE_CATEGORIES: readonly ReleaseCategory[] = [
  "Ã–zellik",
  "Ä°yileÅŸtirme",
  "DÃ¼zeltme",
  "Teknik",
];

export function getCurrentRelease() {
  return (
    RELEASE_NOTES.find((release) => release.version === __APP_VERSION__) ??
    RELEASE_NOTES[0]
  );
}

