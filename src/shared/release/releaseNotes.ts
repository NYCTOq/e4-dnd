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
    version:"2.16.0",date:"2026-07-16",title:"Warlock Pact Magic & Mystic Arcanum",
    summary:"Warlock'ın ayrı slot progression'ı, Short Rest yenilemesi ve üst seviye Arcanum seçimleri tamamlandı.",
    changes:[
      {text:"Level 1–20 Pact Magic slot seviyesi ve adet tablosu",category:"Düzeltme"},
      {text:"Short Rest sırasında Pact Magic slotlarının yenilenmesi",category:"Özellik"},
      {text:"Level 11, 13, 15 ve 17 Mystic Arcanum seçimleri",category:"Özellik"},
      {text:"Builder'da her açılan spell level için zorunlu Arcanum doğrulaması",category:"Düzeltme"},
      {text:"Character Sheet ve Play Mode tek kullanımlık Arcanum takibi",category:"Özellik"},
      {text:"Warlock level 8 spell seçenekleri ve üç otomatik Pact Magic testi",category:"Teknik"},
    ],
  },
  {
    version:"2.15.0",date:"2026-07-16",title:"Core Class Action Console",
    summary:"Temel class kaynakları Play Mode'da kullanılabilir eylemlere ve dinlenme yenilemesine bağlandı.",
    changes:[
      {text:"Rage, Bardic Inspiration, Channel Divinity ve Fighter kaynak eylemleri",category:"Özellik"},
      {text:"Focus/Ki, Lay on Hands, Favored Enemy ve Arcane Recovery kullanımı",category:"Özellik"},
      {text:"Second Wind için otomatik d10 + Fighter level healing",category:"Özellik"},
      {text:"Lay on Hands için 1, 5 ve 10 puanlık healing kontrolleri",category:"Özellik"},
      {text:"Short/Long Rest sırasında class kaynaklarının otomatik yenilenmesi",category:"Düzeltme"},
      {text:"Cleric ve Druid kaynaklarının erken level'da açılması düzeltildi",category:"Düzeltme"},
    ],
  },
  {
    version:"2.14.0",date:"2026-07-16",title:"Beast Master Companion System",
    summary:"Ranger companion seçimi, level ölçekli statlar ve masa modu HP takibi Beast Master akışına eklendi.",
    changes:[
      {text:"2014 için üç classic beast companion seçeneği",category:"Özellik"},
      {text:"2024 için Land, Sea ve Sky primal companion seçenekleri",category:"Özellik"},
      {text:"Level, proficiency ve Wisdom ile ölçeklenen statlar",category:"Özellik"},
      {text:"Builder zorunlu seçim ve ruleset doğrulaması",category:"Düzeltme"},
      {text:"Character Sheet stat özeti ve Play Mode HP yönetimi",category:"Özellik"},
      {text:"Companion kuralları için üç otomatik test",category:"Teknik"},
    ],
  },
  {
    version:"2.13.0",date:"2026-07-16",title:"Battle Master Maneuvers",
    summary:"Battle Master maneuver seçimleri ve Superiority Dice yönetimi karakter oluşturma ile masa moduna bağlandı.",
    changes:[
      {text:"On altı açık kural temelli maneuver ve özgün kısa açıklamalar",category:"Özellik"},
      {text:"Level 3, 7, 10 ve 15 maneuver progression",category:"Özellik"},
      {text:"Level ile büyüyen Superiority Dice sayısı ve die türü",category:"Özellik"},
      {text:"Builder seçim kotası ve kayıt doğrulaması",category:"Düzeltme"},
      {text:"Character Sheet ve Play Mode zar harcama entegrasyonu",category:"Özellik"},
      {text:"Maneuver progression için üç otomatik test",category:"Teknik"},
    ],
  },
  {
    version: "2.12.0", date: "2026-07-16", title: "Druid Wild Shape System",
    summary: "Wild Shape form uygunluğu, bilinen/favori formlar ve masada kullanım takibi Druid akışına eklendi.",
    changes: [
      { text: "On iki açık kural temelli beast formu ve özgün kısa açıklamalar", category: "Özellik" },
      { text: "CR, yüzme ve uçuş limitleri için level/ruleset kontrolü", category: "Düzeltme" },
      { text: "Circle of the Moon 2014 için genişleyen CR progression", category: "Özellik" },
      { text: "2024 bilinen form kotası ve artan Wild Shape kullanımları", category: "Özellik" },
      { text: "Builder, Character Sheet ve Play Mode dönüşüm entegrasyonu", category: "Özellik" },
      { text: "Wild Shape kuralları için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "2.11.0", date: "2026-07-16", title: "Warlock Eldritch Invocations",
    summary: "Warlock Invocation seçimleri level progression, prerequisite kontrolü ve karakter ekranlarına bağlandı.",
    changes: [
      { text: "Yirmi açık kural temelli Invocation ve özgün kısa açıklamalar", category: "Özellik" },
      { text: "2014 ve 2024 için ayrı Level 1–20 seçim progression", category: "Özellik" },
      { text: "Minimum level ve Eldritch Blast prerequisite kontrolü", category: "Düzeltme" },
      { text: "Builder, Character Sheet ve Play Mode entegrasyonu", category: "Özellik" },
      { text: "Eski kayıtlar ve taslaklar için güvenli veri migration", category: "Teknik" },
      { text: "Invocation kuralları için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "2.10.0", date: "2026-07-16", title: "Sorcerer Metamagic System",
    summary: "Sorcerer Metamagic seçimleri level kotası, Sorcery Point maliyeti ve Play Mode kullanımıyla eklendi.",
    changes: [
      { text: "Sekiz açık lisanslı Metamagic seçeneği ve özgün özetler", category: "Özellik" },
      { text: "2014 Level 3, 10, 17 seçim progression", category: "Özellik" },
      { text: "2024 Level 2 başlangıç progression", category: "Özellik" },
      { text: "Sorcery Point maliyet metadata ve Character Sheet özellikleri", category: "Özellik" },
      { text: "Play Mode'da puan kontrollü Metamagic kullanımı", category: "Özellik" },
      { text: "Eksik veya geçersiz seçimde Builder kayıt engeli", category: "Düzeltme" },
      { text: "Metamagic kuralları için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "2.9.0", date: "2026-07-16", title: "Level 1–20 Progression Audit",
    summary: "Tüm class progression tabloları level, ASI/feat, capstone, subclass ve spell slot bütünlüğü açısından otomatik denetleniyor.",
    changes: [
      { text: "12 class için 1–20 level satırı bütünlük kontrolü", category: "Teknik" },
      { text: "Fighter level 6/14 ve Rogue level 10 ilave ASI işaretleri", category: "Düzeltme" },
      { text: "2014 Level 19 ASI ve 2024 Epic Boon ayrımı", category: "Düzeltme" },
      { text: "Boş progression satırlarına kayıpsız ASI/feat enrichment", category: "İyileştirme" },
      { text: "Subclass seçimi, capstone ve spell slot audit kontrolleri", category: "Teknik" },
      { text: "Progression audit için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "2.8.0", date: "2026-07-16", title: "Fighting Style Combat Integration",
    summary: "Fighting Style seçimleri Character Sheet ve Play Mode savaş hesaplarına bağlandı.",
    changes: [
      { text: "Archery ile ranged weapon attack rollarına +2", category: "Özellik" },
      { text: "Defense ile kuşanılmış armor üzerinde +1 otomatik AC", category: "Özellik" },
      { text: "Dueling ile tek elli melee weapon damage bonusu", category: "Özellik" },
      { text: "Thrown Weapon Fighting damage bonusu", category: "Özellik" },
      { text: "Character Sheet ve Play Mode attack/damage özetlerine otomatik yansıma", category: "İyileştirme" },
      { text: "Combat entegrasyonu için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "2.7.0", date: "2026-07-16", title: "Cantrip Expansion & Class Coverage",
    summary: "Caster class cantrip havuzları açık lisanslı seçenekler ve yapılandırılmış mekanik metadata ile genişletildi.",
    changes: [
      { text: "Blade Ward, Dancing Lights, Friends, Message ve True Strike", category: "Özellik" },
      { text: "Warlock için Eldritch Blast; Bard için Vicious Mockery", category: "Özellik" },
      { text: "Damage, save, attack ve character-level scaling metadata", category: "Teknik" },
      { text: "2014 ve 2024 için edition ayrımlı cantrip kayıtları", category: "Teknik" },
      { text: "Caster class kapsamı için otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "2.6.0", date: "2026-07-16", title: "Weapon Mastery System",
    summary: "2024 class progression içindeki Weapon Mastery kotaları Builder ve kalıcı karakter verisine bağlandı.",
    changes: [
      { text: "Class ve level progression tablosundan mastery seçim kotası", category: "Özellik" },
      { text: "Weapon item verisinden Slow, Nick, Topple, Sap, Vex ve Graze eşleştirmeleri", category: "Özellik" },
      { text: "Builder Equipment adımında mastery silah seçimi", category: "Özellik" },
      { text: "Eksik veya geçersiz mastery seçiminde kayıt engeli", category: "Düzeltme" },
      { text: "Eski karakterler için mastered weapon migration", category: "Teknik" },
      { text: "Mastery kotası için otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "2.5.0", date: "2026-07-16", title: "Fighter Fighting Styles & Combat Choices",
    summary: "Fighting Style seçimleri edition, class, level ve subclass kurallarıyla kalıcı karakter verisine bağlandı.",
    changes: [
      { text: "2014 için altı temel Fighting Style", category: "Özellik" },
      { text: "2024 için Blind Fighting, Interception, Thrown Weapon ve Unarmed seçenekleri", category: "Özellik" },
      { text: "Fighter, Paladin ve Ranger level bazlı seçim kotası", category: "Özellik" },
      { text: "Champion level 10 Additional Fighting Style desteği", category: "Özellik" },
      { text: "Eski karakter kayıtları için fighting style migration", category: "Teknik" },
      { text: "Fighting style kuralları için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "2.4.0", date: "2026-07-16", title: "Granted Spell Database Completion",
    summary: "Domain ve oath paketlerinin ihtiyaç duyduğu eksik büyüler 2014 ve 2024 spell veritabanlarına eklendi.",
    changes: [
      { text: "Domain ve oath listeleri için 29 yeni spell kaydı", category: "Özellik" },
      { text: "Spell level, class, school, duration ve temel mekanik metadata", category: "Teknik" },
      { text: "Arcane Eye, Moonbeam, Scrying, Wall of Fire ve Zone of Truth dahil tamamlama", category: "Özellik" },
      { text: "Paladin oath spell listelerinin gerçek veriyle görünür hâle gelmesi", category: "Düzeltme" },
      { text: "Granted spell veri kapsamı için otomatik regresyon testi", category: "Teknik" },
    ],
  },
  {
    version: "2.3.0", date: "2026-07-16", title: "Paladin Oath Spells",
    summary: "Always Prepared sistemi 2014 ve 2024 Paladin yemin büyülerine genişletildi.",
    changes: [
      { text: "2014 ve 2024 Oath of Devotion spell progression", category: "Özellik" },
      { text: "2014 ve 2024 Oath of the Ancients spell progression", category: "Özellik" },
      { text: "Paladin spell slot seviyesine göre otomatik oath spell açılması", category: "Özellik" },
      { text: "Oath büyülerinin normal prepared kotasından bağımsız tutulması", category: "Düzeltme" },
      { text: "Paladin oath spell kapsamı için otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "2.2.0", date: "2026-07-16", title: "Cleric Domain Spells Expansion",
    summary: "Always Prepared altyapısı Life Domain dışındaki Cleric domainlerine genişletildi.",
    changes: [
      { text: "13 genişletilmiş 2014 Cleric domaini için seviye 1–5 bonus spell listeleri", category: "Özellik" },
      { text: "2024 Light, Trickery ve War Domain bonus spell listeleri", category: "Özellik" },
      { text: "Mevcut spell verisinde bulunan domain büyülerinin otomatik eşleştirilmesi", category: "Teknik" },
      { text: "Domain spell kapsamı için otomatik regresyon testi", category: "Teknik" },
    ],
  },
  {
    version: "2.1.0", date: "2026-07-15", title: "Always Prepared Spells",
    summary: "Subclass tarafından verilen büyüler normal prepared kotasını tüketmeden Builder, Editor ve Play Mode akışına bağlandı.",
    changes: [
      { text: "2014 ve 2024 Life Domain bonus spell listeleri", category: "Özellik" },
      { text: "Character level ve erişilebilir spell level bazlı otomatik açılma", category: "Özellik" },
      { text: "Always Prepared büyülerin known ve prepared listelerine otomatik eklenmesi", category: "Özellik" },
      { text: "Normal prepared kotasından subclass büyülerinin çıkarılması", category: "Düzeltme" },
      { text: "Spell Selector içinde ayrı Always Prepared durumu", category: "İyileştirme" },
      { text: "Subclass spell unlock davranışı için otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "2.0.3", date: "2026-07-15", title: "Ability Generation Rules",
    summary: "Character Builder artık tekil skor tavanının yanında Standard Array, Point Buy ve ASI toplam bütçesini de doğruluyor.",
    changes: [
      { text: "Standard Array, Point Buy ve Rolled/Manual oluşturma yöntemleri", category: "Özellik" },
      { text: "Class ve level bazlı ASI puan bütçesi", category: "Özellik" },
      { text: "Feat seçildiğinde ilgili ASI bütçesinin otomatik düşürülmesi", category: "Düzeltme" },
      { text: "Kurala aykırı toplam dağılımda Review kayıt engeli", category: "Düzeltme" },
      { text: "Ability generation bütçeleri için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "2.0.2", date: "2026-07-15", title: "Player Ability Cap Fix",
    summary: "Character Builder ve Editor içindeki oyuncu ability skorları normal 20 tavanıyla sınırlandı.",
    changes: [
      { text: "Builder ability alanlarında maksimum skor 20", category: "Düzeltme" },
      { text: "Character Editor ability alanlarında maksimum skor 20", category: "Düzeltme" },
      { text: "Origin bonusu sonrası nihai skor 20'yi aşarsa kayıt engeli", category: "Düzeltme" },
      { text: "Ability tavanı için otomatik regresyon testi", category: "Teknik" },
    ],
  },
  {
    version: "2.0.1", date: "2026-07-15", title: "Legacy Draft Recovery Fix",
    summary: "Eski sürümlerden kalan Character Builder taslakları yeni alanlarla güvenli biçimde tamamlanarak açılış çökmesi giderildi.",
    changes: [
      { text: "Eski autosave taslakları için geriye uyumlu alan normalizasyonu", category: "Düzeltme" },
      { text: "Eksik feat, skill, spell, inventory ve equipment listelerine güvenli varsayılanlar", category: "Düzeltme" },
      { text: "İç içe ability, death save ve condition verilerini kaybetmeden birleştirme", category: "Teknik" },
      { text: "Legacy draft migration için üç otomatik regresyon testi", category: "Teknik" },
    ],
  },
  {
    version: "2.0.0", date: "2026-07-15", title: "Playable Character Release",
    summary: "Karakter oluşturma, doğrulama, Character Sheet, Play Mode, level-up ve rest akışları oynanabilir tek bir v2 deneyiminde birleşti.",
    changes: [
      { text: "Kayıtlı karakterler için yüzde bazlı Playable Character Check", category: "Özellik" },
      { text: "Kimlik, HP, ability, equipment, spell ve ruleset bütünlük kontrolleri", category: "Özellik" },
      { text: "Dashboard üzerinde oynamaya hazır durum göstergesi", category: "İyileştirme" },
      { text: "Dashboard ve Character Sheet'ten seçili karakterle doğrudan Play Mode açılışı", category: "İyileştirme" },
      { text: "Play Mode içinde eksiklerden Character Editor'a hızlı dönüş", category: "İyileştirme" },
      { text: "Playable readiness motoru için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.35.0", date: "2026-07-15", title: "Character Creation Polish",
    summary: "Character Builder, adım durumları, doğrudan hata yönlendirmesi, ilerleme görünümü ve mobil kullanım iyileştirmeleriyle v2.0 öncesi son hazırlığını tamamladı.",
    changes: [
      { text: "Her Builder adımı için hata, uyarı, tamam ve bekliyor durumu", category: "İyileştirme" },
      { text: "Review hatasından ilgili adıma tek tık dönüş", category: "Özellik" },
      { text: "İlk zorunlu hataya hızlı yönlendirme", category: "Özellik" },
      { text: "Ruleset, subclass, skill, expertise ve feat içeren genişletilmiş Review özeti", category: "İyileştirme" },
      { text: "Taslak kurtarma bildirimi, ilerleme çubuğu ve yatay mobil stepper", category: "İyileştirme" },
      { text: "Builder progress yönlendirmeleri için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.34.0", date: "2026-07-15", title: "Level-Up Automation V2",
    summary: "Level-up akışı class progression, spell slotları, kaynak scaling, class-specific ASI ve geri alma geçmişiyle yenilendi.",
    changes: [
      { text: "Yeni level class ve subclass feature ön izlemesi", category: "Özellik" },
      { text: "Class progression tablosundan full/half/pact spell slot güncellemesi", category: "Özellik" },
      { text: "Level ile artan class resource maksimumlarını güvenli birleştirme", category: "Özellik" },
      { text: "Fighter ve Rogue ilave ASI/feat kilometre taşları", category: "Düzeltme" },
      { text: "Kalıcı level-up geçmişi ve son işlemi geri alma", category: "Özellik" },
      { text: "Level-up history için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.33.0", date: "2026-07-15", title: "Character Sheet V2",
    summary: "Saving throws, skill/expertise rolları, passive skorlar ve birleşik feature/proficiency görünümü oynanabilir Character Sheet'e eklendi.",
    changes: [
      { text: "Altı saving throw için class proficiency hesaplama ve hızlı roll", category: "Özellik" },
      { text: "18 skill için ability, proficiency ve expertise bonusları", category: "Özellik" },
      { text: "Passive Perception, Investigation ve Insight hesapları", category: "Özellik" },
      { text: "Class, subclass ve feat feature'larını tek listede birleştirme", category: "Özellik" },
      { text: "Armor, weapon, tool, language ve speed özeti", category: "İyileştirme" },
      { text: "Character Sheet kuralları için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.32.0", date: "2026-07-15", title: "Spellcasting Rules Engine",
    summary: "Class progression tabanlı spell seçim limitleri, ritual casting ve full/half/pact slot ayrımı Builder'a bağlandı.",
    changes: [
      { text: "Class ve level bazlı cantrip, known ve prepared spell limitleri", category: "Özellik" },
      { text: "Spellcasting ability modifier kullanan prepared spell hesabı", category: "Özellik" },
      { text: "Full caster, half caster ve Pact Magic slot progression ayrımı", category: "Özellik" },
      { text: "Bilinen ritual büyüler için Ritual Ready durumu", category: "İyileştirme" },
      { text: "Limit dolduğunda Builder seçimlerini güvenli engelleme", category: "İyileştirme" },
      { text: "Spellcasting engine için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.31.0", date: "2026-07-15", title: "Spell Database V2",
    summary: "Cleric level 0–9 kapsamı başta olmak üzere 2014 ve 2024 spell havuzları gelişmiş mekanik metadata ile büyütüldü.",
    changes: [
      { text: "Her edition için 32 yeni yüksek seviye spell", category: "Özellik" },
      { text: "Cleric spell seviyeleri 4, 6, 7, 8 ve 9 için geniş paket", category: "Özellik" },
      { text: "Heal, Heroes' Feast, Death Ward, Resurrection ve Mass Heal dahil destek büyüleri", category: "Özellik" },
      { text: "Material cost, consumed material ve reaction trigger veri alanları", category: "Teknik" },
      { text: "Spellbook aramasında material ve reaction metadata desteği", category: "İyileştirme" },
      { text: "Spell Database V2 kapsamı için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.30.0", date: "2026-07-15", title: "Feat Expansion",
    summary: "2014 ve 2024 feat havuzları, prerequisite ve yapılandırılmış seçim metadata'sı ile genişletildi.",
    changes: [
      { text: "2014 için 23 ilave general feat", category: "Özellik" },
      { text: "2024 için 15 ilave general feat", category: "Özellik" },
      { text: "Ability, skill, tool, spell ve fighting style seçim metadata'sı", category: "Teknik" },
      { text: "Repeatable feat ve seçim adedi altyapısı", category: "Teknik" },
      { text: "Feat Catalog içinde ability ve choice metadata görünümü", category: "İyileştirme" },
      { text: "Feat paket kapsamı için üç otomatik test", category: "Teknik" },
    ],
  },
  {
    version: "1.29.0", date: "2026-07-15", title: "Subclass Expansion",
    summary: "Cleric domainleri başta olmak üzere 2014 ve 2024 subclass seçenekleri, özgün feature özetleri ve mekanik metadata ile genişletildi.",
    changes: [
      { text: "2014 Cleric için 13 yeni domain; Life Domain ile toplam 14 seçenek", category: "Özellik" },
      { text: "Light, Trickery ve War dahil genişletilmiş 2024 Cleric seçenekleri", category: "Özellik" },
      { text: "Her ana class için en az bir ilave 2014 ve 2024 subclass", category: "Özellik" },
      { text: "Level bazlı özgün feature özetleri ve resource/proficiency metadata", category: "İyileştirme" },
      { text: "Builder ve Subclass Catalog içinde genişletilmiş metadata görünümü", category: "İyileştirme" },
      { text: "Subclass paket kapsamı için üç otomatik test", category: "Teknik" },
    ],
  },
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
