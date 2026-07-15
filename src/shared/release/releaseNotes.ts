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
    version: "1.28.0", date: "2026-07-15", title: "Class Features Engine",
    summary: "Temel class kaynakları level ve ability skorlarına göre otomatik oluşturulup Character Sheet ve Rest sistemine bağlandı.",
    changes: [
      { text: "12 ana class için level-aware resource üretimi", category: "Özellik" },
      { text: "Rage, Bardic Inspiration, Channel Divinity, Wild Shape, Second Wind ve Action Surge", category: "Özellik" },
      { text: "Focus/Ki, Lay on Hands, Sorcery Points, Mystic Arcanum ve Arcane Recovery", category: "Özellik" },
      { text: "Character Sheet üzerinde kullan/geri al kontrolleri ve action özetleri", category: "İyileştirme" },
      { text: "Eski karakterlere class resource migration ve rest recovery bağlantısı", category: "Teknik" },
      { text: "Class feature engine için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.27.0", date: "2026-07-15", title: "Character Builder Validation",
    summary: "Character Builder final kontrol motoru, adım bazlı hata listesi ve kuralsız kayıt engeli eklendi.",
    changes: [
      { text: "Identity, class, race/species, background ve subclass zorunlulukları", category: "Özellik" },
      { text: "Ability, 2024 origin bonusu ve class skill kotası doğrulaması", category: "Özellik" },
      { text: "Feat prerequisite, spell class/level ve prepared-known kontrolleri", category: "Özellik" },
      { text: "Inventory ile equipped item tutarlılık kontrolü", category: "Özellik" },
      { text: "Review ekranında hata/uyarı özeti ve hatalı kaydı engelleme", category: "İyileştirme" },
      { text: "Validation motoru için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.26.0", date: "2026-07-15", title: "Skills + Proficiencies Builder",
    summary: "Class ve background tabanlı skill seçimleri, duplicate kontrolü, expertise, tool ve language kayıtları Character Builder'a eklendi.",
    changes: [
      { text: "18 temel skill için class seçim havuzu ve kota kontrolü", category: "Özellik" },
      { text: "Background skilllerini otomatik ekleme ve duplicate engelleme", category: "Özellik" },
      { text: "Bard ve Rogue için level bazlı Expertise seçimi", category: "Özellik" },
      { text: "Tool proficiency ve language kayıt alanları", category: "Özellik" },
      { text: "Eski karakterler için güvenli proficiency migration", category: "Teknik" },
      { text: "Proficiency kuralları için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.25.0", date: "2026-07-15", title: "Equipment + Items Expansion",
    summary: "2014 ve 2024 equipment verileri, genişletilmiş item şeması ve 2024 Weapon Mastery bağlantısı eklendi.",
    changes: [
      { text: "2024 ruleset için weapon, armor, shield ve adventuring gear veri paketi", category: "Özellik" },
      { text: "Tool, pack ve ammunition item kategorileri", category: "Özellik" },
      { text: "2024 silahları için Weapon Mastery çözümleme altyapısı", category: "Özellik" },
      { text: "Inventory aramasında property, damage type ve mastery desteği", category: "İyileştirme" },
      { text: "Equipment kuralları için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.24.0", date: "2026-07-15", title: "Spell Database Expansion",
    summary: "2014 ve 2024 büyü veri şeması, mekanik alanlar, gelişmiş filtreler ve level uyumlu Builder seçimi eklendi.",
    changes: [
      { text: "Damage, healing, save, attack, area ve scaling alanları", category: "Özellik" },
      { text: "2024 için ayrı başlangıç spell veri paketi", category: "Özellik" },
      { text: "School ve etki türü filtreleri", category: "İyileştirme" },
      { text: "Karakter levelına göre erişilemeyen spell seviyelerini gizleme", category: "Düzeltme" },
      { text: "Spell kuralları için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.23.0", date: "2026-07-15", title: "Feats",
    summary: "2014 ve 2024 feat veri katmanı, origin feat aktarımı, prerequisite kontrolü ve Builder seçimi eklendi.",
    changes: [
      { text: "2014 ve 2024 için ayrı feat veri setleri", category: "Özellik" },
      { text: "Origin, General ve Epic Boon kategori ayrımı", category: "Özellik" },
      { text: "Level, ability ve spellcasting prerequisite kontrolü", category: "Özellik" },
      { text: "Class ve level bazlı feat kotası", category: "İyileştirme" },
      { text: "Yeni Feats katalog ekranı", category: "Özellik" },
      { text: "Feat helperları için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.22.0", date: "2026-07-15", title: "Subclasses",
    summary: "2014 ve 2024 subclass veri katmanı, Builder seçimi, level kilidi ve feature progression görünümü eklendi.",
    changes: [
      { text: "2014 ve 2024 için class bağlantılı subclass veri setleri", category: "Özellik" },
      { text: "Builder içinde class ve level uyumlu subclass seçimi", category: "Özellik" },
      { text: "Level bazlı açılan subclass feature görünümü", category: "Özellik" },
      { text: "Yeni Subclasses katalog ekranı", category: "Özellik" },
      { text: "Subclass helperları için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.21.0",
    date: "2026-07-15",
    title: "Races, species ve backgrounds",
    summary: "2014 race/subrace bonusları ile 2024 species, origin background, origin feat ve ability bonus seçimleri Character Builder'a bağlandı.",
    changes: [
      { text: "2014 için dokuz temel race ve subrace veri setleri", category: "Özellik" },
      { text: "2024 için on species veri seti", category: "Özellik" },
      { text: "2014 background feature ve proficiency paketleri", category: "Özellik" },
      { text: "2024 origin background, origin feat ve +2/+1 ability seçimi", category: "Özellik" },
      { text: "Yeni Species & Backgrounds katalog ekranı", category: "Özellik" },
      { text: "Origin ability bonus helperları için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.20.0",
    date: "2026-07-15",
    title: "Classes ve level tabloları",
    summary: "2014 ve 2024 için on iki ana class; level progression, proficiency, subclass seviyesi, spell slotları ve feature akışıyla ayrı veri katmanlarında hazır.",
    changes: [
      { text: "2014 ve 2024 için 12 ana class veri seti", category: "Özellik" },
      { text: "Level 1-20 proficiency bonus ve feature progression tabloları", category: "Özellik" },
      { text: "Full caster, half caster, pact magic ve martial progression ayrımı", category: "Teknik" },
      { text: "2024 martial classları için Weapon Mastery adet altyapısı", category: "Özellik" },
      { text: "Yeni Classes + Level Tables katalog ekranı", category: "Özellik" },
      { text: "Builder class ön izlemesine subclass ve progression bilgisi", category: "İyileştirme" },
      { text: "Class progression helperları için otomatik testler", category: "Teknik" },
    ],
  },
  {
    version: "1.19.0",
    date: "2026-07-15",
    title: "Ruleset Foundation",
    summary: "2014, 2024 ve Homebrew karakterleri ayrı ruleset kimliği, terminology ve veri yükleme katmanıyla yönetiliyor.",
    changes: [
      { text: "Yeni Ruleset Center ve varsayılan edition ayarı", category: "Özellik" },
      { text: "2014, 2024 ve Homebrew için merkezi ruleset registry", category: "Teknik" },
      { text: "Builder ve Character Editor içinde edition-aware veri yükleme", category: "Özellik" },
      { text: "Ruleset değişiminde uyumsuz class, spell ve equipment seçimlerini güvenli temizleme", category: "İyileştirme" },
      { text: "Eski karakterleri otomatik D&D 2014 ruleset kimliğine taşıyan migration", category: "Teknik" },
      { text: "2024 veri klasörü ve sonraki class/species/background paketleri için hazır altyapı", category: "Teknik" },
    ],
  },
  {
    version: "1.18.0",
    date: "2026-07-15",
    title: "Downtime ve campaign calendar",
    summary: "Oyun içi zaman, yaklaşan olaylar, seyahatler ve karakter downtime faaliyetleri campaign bazında tek takvimde yönetiliyor.",
    changes: [
      { text: "Campaign bağlantılı yeni Downtime + Campaign Calendar sayfası", category: "Özellik" },
      { text: "Oyun içi günü toplu ilerletme ve yaklaşan olayları sıralama", category: "Özellik" },
      { text: "Karakter bağlantılı downtime faaliyetleri ve otomatik ilerleme yüzdesi", category: "Özellik" },
      { text: "Oturum, seyahat, son tarih, festival ve çatışma olay türleri", category: "İyileştirme" },
      { text: "Eski ve bozuk kayıtlar için güvenli calendar sanitizasyonu", category: "Teknik" },
      { text: "Campaign calendar motoru için üç yeni otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.17.0",
    date: "2026-07-14",
    title: "Rest ve resource automation",
    summary: "Short Rest ve Long Rest işlemleri; HP, spell slot, Hit Dice, exhaustion ve özel sınıf kaynaklarıyla toplu ve geri alınabilir biçimde yönetiliyor.",
    changes: [
      { text: "Seçili karakterlere toplu Short Rest ve Long Rest uygulama", category: "Özellik" },
      { text: "HP, spell slot, Hit Dice, death save, temp HP ve exhaustion otomasyonu", category: "Özellik" },
      { text: "Short Rest, Long Rest veya manuel yenilenen özel sınıf kaynakları", category: "Özellik" },
      { text: "Dinlenme geçmişi ve son işlemi geri alma güvenliği", category: "İyileştirme" },
      { text: "Combat Tracker savaşçılarını senkronize etme ve combat log kaydı", category: "İyileştirme" },
      { text: "Rest motoru için üç yeni otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.16.0",
    date: "2026-07-14",
    title: "Battlefield zones ve area effects",
    summary: "Aura, hazard, spell area ve difficult terrain bölgeleri savaşçı bağlantıları ve round sayaçlarıyla Combat Tracker içinde yönetiliyor.",
    changes: [
      { text: "Savaş alanına aura, hazard, spell area, cover ve difficult terrain ekleme", category: "Özellik" },
      { text: "Alan şekli, boyutu, kaynak, hasar, save DC ve koşul bilgisi", category: "Özellik" },
      { text: "Alanlardan etkilenen savaşçıları işaretleme", category: "Özellik" },
      { text: "Yeni round başladığında alan sürelerini otomatik azaltma ve bitenleri kaldırma", category: "İyileştirme" },
      { text: "Eski savaş kayıtları için geriye uyumlu zone sanitizasyonu", category: "Teknik" },
      { text: "Battlefield zone motoru için üç yeni otomatik test", category: "Teknik" },
    ],
  },
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
