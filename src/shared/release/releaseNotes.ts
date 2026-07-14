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
    version: "1.15.0",
    date: "2026-07-14",
    title: "Encounter bridge ve savaş şablonları",
    summary: "Campaign encounter kayıtları canlı savaşa aktarılabiliyor; savaş dizilimleri tekrar kullanılabilir şablonlara dönüştürülebiliyor.",
    changes: [
      { text: "Campaign encounter katılımcılarını Combat Tracker'a tek tıkla aktarma", category: "Özellik" },
      { text: "Mevcut savaş dizilimini tekrar kullanılabilir şablon olarak kaydetme", category: "Özellik" },
      { text: "Şablondan tam HP ile yeni savaş oluşturma", category: "İyileştirme" },
      { text: "Şablon seçme ve silme kontrolleri", category: "İyileştirme" },
      { text: "Campaign encounter ve template dönüşümleri için iki yeni otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.14.0",
    date: "2026-07-14",
    title: "Combat log ve encounter özeti",
    summary: "Savaş içindeki sıra, hasar, iyileştirme, etki ve manuel notlar otomatik bir olay günlüğünde toplanıyor.",
    changes: [
      { text: "Hasar, iyileştirme, sıra ve etki işlemlerini otomatik kaydetme", category: "Özellik" },
      { text: "Round ve aktif savaşçı geçişlerini savaş günlüğünde gösterme", category: "Özellik" },
      { text: "Toplam hasar, iyileştirme, yenilen savaşçı ve olay özeti", category: "İyileştirme" },
      { text: "Manuel combat notu ekleme ve günlüğü temizleme", category: "İyileştirme" },
      { text: "Eski combat kayıtları için geriye uyumlu log sanitizasyonu", category: "Teknik" },
      { text: "Combat log ve özet motoru için üç yeni otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.13.0",
    date: "2026-07-14",
    title: "Combat effects ve süre otomasyonu",
    summary: "Savaş koşulları artık kaynak ve round süresiyle takip ediliyor; yeni round başladığında sayaçlar otomatik azalıyor.",
    changes: [
      { text: "Savaşçılara kaynak bilgili süreli etki ekleme", category: "Özellik" },
      { text: "Round geçişinde etki sürelerini otomatik azaltma", category: "Özellik" },
      { text: "Süresi biten etkileri otomatik kaldırma", category: "İyileştirme" },
      { text: "Kalıcı koşullar ile süreli etkileri birlikte gösterme", category: "İyileştirme" },
      { text: "Eski combat kayıtları için geriye uyumlu veri sanitizasyonu", category: "Teknik" },
      { text: "Etki motoru için iki yeni otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.12.0",
    date: "2026-07-14",
    title: "Initiative ve combat tracker",
    summary: "Karakter, NPC ve canavarlar; sıra, round, HP, geçici HP ve koşullarıyla canlı bir savaş ekranında toplandı.",
    changes: [
      { text: "Yeni Initiative + Combat Tracker sayfası", category: "Özellik" },
      { text: "Karakter, NPC, canavar ve özel savaşçı ekleme", category: "Özellik" },
      { text: "Initiative sıralaması, aktif sıra ve otomatik round ilerletme", category: "Özellik" },
      { text: "Hasar, iyileştirme, geçici HP ve yenilgi durumu takibi", category: "İyileştirme" },
      { text: "On farklı koşulu savaşçı bazında yönetme", category: "İyileştirme" },
      { text: "Combat veri motoru için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.11.0",
    date: "2026-07-14",
    title: "Loot ve treasure tracker",
    summary: "Campaign ganimetleri, görev ödülleri, sahiplik ve paylaştırma durumlarıyla ayrı bir hazine takibinde toplandı.",
    changes: [
      { text: "Campaign bağlantılı yeni Loot + Treasure Tracker sayfası", category: "Özellik" },
      { text: "Para, eşya, büyülü eşya, mücevher, belge ve diğer ganimet türleri", category: "Özellik" },
      { text: "Görev bağlantısı, karakter sahipliği ve parti havuzu takibi", category: "Özellik" },
      { text: "Adet, birim değer ve otomatik toplam gp hesaplama", category: "İyileştirme" },
      { text: "Paylaştırma durumu ile oyuncu ve DM notlarının ayrılması", category: "İyileştirme" },
      { text: "Loot veri motoru için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.10.0",
    date: "2026-07-14",
    title: "Quest journal ve plot threads",
    summary:
      "Campaign görevleri; durum, öncelik, hedefler, ödüller, bağlantılar ve DM sırlarıyla ayrı bir görev günlüğünde toplandı.",
    changes: [
      { text: "Campaign bağlantılı yeni Quest Journal + Plot Threads sayfası", category: "Özellik" },
      { text: "Görev durumu, önceliği, etiketleri ve tamamlanabilir hedefleri", category: "Özellik" },
      { text: "Görevleri NPC, World Atlas mekânı ve faction ile bağlama", category: "Özellik" },
      { text: "Oyuncu özeti, DM gizli notu ve ödül alanlarının ayrılması", category: "İyileştirme" },
      { text: "Görev ilerleme yüzdesi ile campaign ve durum filtreleri", category: "İyileştirme" },
      { text: "Quest journal veri motoru için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.9.0",
    date: "2026-07-14",
    title: "Factions ve organizations",
    summary:
      "Campaign oluşumları; türleri, üyeleri, merkezleri, açık ve gizli hedefleri ile diplomatik ilişkileriyle ayrı bir yönetim ekranında toplandı.",
    changes: [
      { text: "Campaign bağlantılı yeni Factions + Organizations sayfası", category: "Özellik" },
      { text: "Krallık, lonca, tarikat, korsan tayfası, şirket ve gizli örgüt türleri", category: "Özellik" },
      { text: "Oluşumlara NPC üyesi ve World Atlas merkezi bağlama", category: "Özellik" },
      { text: "Müttefik, tarafsız, gergin ve düşman ilişki takibi", category: "Özellik" },
      { text: "Bilinen hedef ile DM gizli hedefinin ayrılması", category: "İyileştirme" },
      { text: "Faction veri motoru için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.8.0",
    date: "2026-07-14",
    title: "Locations ve world atlas",
    summary:
      "Campaign mekânları; hiyerarşi, türler, açıklamalar, gizli notlar ve bağlı NPC'lerle ayrı bir dünya atlasında toplandı.",
    changes: [
      { text: "Campaign bağlantılı yeni Locations + World Atlas sayfası", category: "Özellik" },
      { text: "Bölge, şehir, kasaba, bina, zindan ve doğa türleri", category: "Özellik" },
      { text: "Üst mekân bağlantılarıyla hiyerarşik dünya yapısı", category: "Özellik" },
      { text: "Mekânlara NPC bağlama, etiketleme ve campaign filtreleme", category: "İyileştirme" },
      { text: "Oyuncu açıklaması ile DM gizli notlarının ayrılması", category: "İyileştirme" },
      { text: "World atlas veri motoru için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.7.0",
    date: "2026-07-14",
    title: "NPC manager ve ilişki takibi",
    summary:
      "Campaign NPC'leri; roller, konumlar, tutumlar, gizli notlar ve birbirleriyle ilişkileriyle ayrı bir yönetim merkezinde toplandı.",
    changes: [
      { text: "Campaign bağlantılı yeni NPC Manager sayfası", category: "Özellik" },
      { text: "NPC rolü, konumu, durumu, tutumu ve etiket alanları", category: "Özellik" },
      { text: "Oyuncu bilgisi ile DM gizli notlarının ayrı tutulması", category: "Özellik" },
      { text: "NPC'ler arasında adlandırılabilir ilişki bağlantıları", category: "Özellik" },
      { text: "Campaign filtresi ve kapsamlı NPC araması", category: "İyileştirme" },
      { text: "NPC veri motoru için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.6.0",
    date: "2026-07-14",
    title: "Session planner ve hızlı notlar",
    summary:
      "DM hazırlığı; oturum hedefi, sahne akışı, görev listesi, hızlı notlar ve session recap alanlarıyla tek çalışma ekranında toplandı.",
    changes: [
      { text: "Campaign bağlantılı yeni Session Planner sayfası", category: "Özellik" },
      { text: "Tamamlanabilir sahne akışı ve hazırlık görevleri", category: "Özellik" },
      { text: "Oturum içi hızlı not ve session recap alanları", category: "Özellik" },
      { text: "Oturum ilerleme yüzdesi ve son güncellenene göre sıralama", category: "İyileştirme" },
      { text: "Session planlarının güvenli localStorage saklaması", category: "Teknik" },
      { text: "Session planner veri motoru için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-07-14",
    title: "Etiketler ve akıllı koleksiyonlar",
    summary:
      "Global arama kayıtları özel etiketlerle gruplanabiliyor; koleksiyonlar otomatik oluşuyor ve tek ekrandan yönetilebiliyor.",
    changes: [
      { text: "Global Arama sonuçlarına özel etiket ekleme ve kaldırma", category: "Özellik" },
      { text: "Etiketlerden otomatik oluşan Koleksiyonlar sayfası", category: "Özellik" },
      { text: "Koleksiyon yeniden adlandırma ve topluca silme", category: "İyileştirme" },
      { text: "Favori kayıtların koleksiyonlarda görünür rozeti", category: "İyileştirme" },
      { text: "Etiket verilerinin güvenli localStorage saklaması", category: "Teknik" },
      { text: "Etiket motoru için üç yeni otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-07-14",
    title: "Favoriler ve son açılanlar",
    summary:
      "Global arama kayıtları favorilenebiliyor; son açılan içerikler ve favoriler Dashboard üzerinden hızlıca erişilebilir durumda.",
    changes: [
      { text: "Karakter, campaign, büyü, eşya ve canavar sonuçlarını favorileme", category: "Özellik" },
      { text: "Dashboard üzerinde favoriler ve son açılanlar alanı", category: "Özellik" },
      { text: "Global Arama sonuçlarında favori rozeti ve yıldız düğmesi", category: "İyileştirme" },
      { text: "Son açılan kayıtların tekrar açıldığında listenin başına taşınması", category: "İyileştirme" },
      { text: "Favori ve geçmiş verilerinin güvenli localStorage saklaması", category: "Teknik" },
      { text: "Favori motoru için üç yeni otomatik test", category: "Teknik" },
    ],
  },
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
