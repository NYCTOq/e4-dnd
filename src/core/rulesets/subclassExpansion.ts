import type { DndSubclassData } from "./ruleset.types";

type Edition = "dnd_2014" | "dnd_2024";
const make = (id: string, name: string, className: string, ruleset: Edition, selectionLevel: number, features: Array<[number, string, string]>, extras: Partial<DndSubclassData> = {}): DndSubclassData => ({
  id, name, className, ruleset, selectionLevel,
  description: `${name}, ${className} için farklı bir oyun tarzı ve level bazlı subclass özellikleri sunar.`,
  features: features.map(([level, featureName, summary]) => ({ level, name: featureName, summary })),
  ...extras,
});

const cleric2014 = [
  ["knowledge-domain", "Knowledge Domain", "Knowledge of the Ages", "Bilgi, dil ve skill uzmanlığına odaklanır."],
  ["light-domain", "Light Domain", "Radiance of the Dawn", "Işık ve alan hasarıyla karanlığı dağıtır."],
  ["nature-domain", "Nature Domain", "Charm Animals and Plants", "Doğa büyüleri, ağır zırh ve elemental savunma sağlar."],
  ["tempest-domain", "Tempest Domain", "Destructive Wrath", "Thunder ve lightning hasarını güçlendirir."],
  ["trickery-domain", "Trickery Domain", "Invoke Duplicity", "İllüzyon, gizlilik ve aldatıcı konumlandırma sunar."],
  ["war-domain", "War Domain", "Guided Strike", "Silah saldırıları ve isabet desteğine odaklanır."],
  ["death-domain", "Death Domain", "Touch of Death", "Necrotic hasar ve ölüm temalı büyüleri güçlendirir."],
  ["arcana-domain", "Arcana Domain", "Arcane Abjuration", "Cleric yapısına arcane büyü bilgisi ekler."],
  ["forge-domain", "Forge Domain", "Artisan's Blessing", "Zırh, silah ve ateş dayanıklılığı geliştirir."],
  ["grave-domain", "Grave Domain", "Path to the Grave", "Düşmek üzere olan müttefikleri korur ve hedefi savunmasız bırakır."],
  ["order-domain", "Order Domain", "Order's Demand", "Müttefik saldırılarını ve savaş alanı disiplinini yönetir."],
  ["peace-domain", "Peace Domain", "Emboldening Bond", "Parti üyelerini destekleyici bir bağ ile güçlendirir."],
  ["twilight-domain", "Twilight Domain", "Twilight Sanctuary", "Geçici HP ve karanlık görüş desteği sağlayan koruma alanı kurar."],
] as const;

export const SUBCLASS_EXPANSION_2014: DndSubclassData[] = [
  ...cleric2014.map(([id, name, channelName, summary]) => make(id, name, "Cleric", "dnd_2014", 1, [[1, "Domain Training", summary], [2, channelName, `${channelName} Channel Divinity seçeneğini açar.`], [6, "Domain Feature", "Domain temasını geliştiren ikinci aşama özellik."], [8, "Divine Strike / Potent Casting", "Silah veya cantrip hasarını güçlendirir."], [17, "Domain Capstone", "Domain kimliğinin üst seviye sonucunu açar."]], { resourceName: "Channel Divinity" })),
  make("path-of-the-totem-warrior", "Path of the Totem Warrior", "Barbarian", "dnd_2014", 3, [[3,"Totem Spirit","Seçilen hayvan ruhuna göre Rage bonusu."],[6,"Aspect of the Beast","Keşif ve utility niteliği."],[14,"Totemic Attunement","Üst seviye totem savaş etkisi."]]),
  make("college-of-valor", "College of Valor", "Bard", "dnd_2014", 3, [[3,"Combat Inspiration","Inspiration savunma veya hasara katkı sağlar."],[3,"Bonus Proficiencies","Martial ekipman kullanımını genişletir."],[6,"Extra Attack","Attack Action içinde iki saldırı."],[14,"Battle Magic","Spell ve silah saldırısını aynı turda birleştirir."]], { extraProficiencies:["Medium Armor","Shields","Martial Weapons"] }),
  make("circle-of-the-moon", "Circle of the Moon", "Druid", "dnd_2014", 2, [[2,"Combat Wild Shape","Wild Shape savaş kullanımını hızlandırır."],[6,"Primal Strike","Form saldırıları dirençleri aşmaya başlar."],[10,"Elemental Wild Shape","Elemental formlar açılır."],[14,"Thousand Forms","Görünüş değiştirme utility'si."]], { resourceName:"Wild Shape" }),
  make("battle-master", "Battle Master", "Fighter", "dnd_2014", 3, [[3,"Combat Superiority","Maneuver ve Superiority Dice kazanırsın."],[3,"Student of War","Bir artisan tool proficiency."],[7,"Know Your Enemy","Rakibi savaş öncesi analiz edersin."],[15,"Relentless","Kaynak kalmadığında bir die geri kazanırsın."]], { resourceName:"Superiority Dice" }),
  make("way-of-shadow", "Way of Shadow", "Monk", "dnd_2014", 3, [[3,"Shadow Arts","Ki ile karanlık ve gizlilik büyüleri."],[6,"Shadow Step","Gölgeler arasında bonus action hareketi."],[11,"Cloak of Shadows","Karanlıkta görünmezlik."],[17,"Opportunist","Müttefik saldırılarına reaction desteği."]], { resourceName:"Ki Points" }),
  make("oath-of-the-ancients", "Oath of the Ancients", "Paladin", "dnd_2014", 3, [[3,"Channel Divinity","Doğa temalı kontrol seçenekleri."],[7,"Aura of Warding","Yakındaki müttefiklere büyü savunması."],[15,"Undying Sentinel","Dayanıklılık ve yaşlanma koruması."],[20,"Elder Champion","Geçici güçlü dönüşüm."]], { resourceName:"Channel Divinity" }),
  make("beast-master", "Beast Master", "Ranger", "dnd_2014", 3, [[3,"Ranger's Companion","Hayvan yoldaş kazanırsın."],[7,"Exceptional Training","Yoldaşın eylem ekonomisi gelişir."],[11,"Bestial Fury","Yoldaş saldırıları artar."],[15,"Share Spells","Kendine attığın büyüyü yoldaşla paylaşırsın."]]),
  make("assassin", "Assassin", "Rogue", "dnd_2014", 3, [[3,"Assassinate","Hazırlıksız hedeflere güçlü açılış."],[9,"Infiltration Expertise","Uzun süreli sahte kimlik kurarsın."],[13,"Impostor","Başkasının davranışlarını taklit edersin."],[17,"Death Strike","Sürpriz saldırının hasar potansiyelini büyütür."]]),
  make("wild-magic", "Wild Magic", "Sorcerer", "dnd_2014", 1, [[1,"Wild Magic Surge","Spell kullanımı beklenmedik büyü etkileri doğurabilir."],[1,"Tides of Chaos","Bir roll için avantaj üretir."],[6,"Bend Luck","Yakındaki roll sonucunu değiştirirsin."],[18,"Spell Bombardment","Hasar zarlarından birini güçlendirirsin."]]),
  make("great-old-one", "The Great Old One", "Warlock", "dnd_2014", 1, [[1,"Awakened Mind","Telepatik iletişim."],[6,"Entropic Ward","Saldırıya savunma ve karşı avantaj."],[10,"Thought Shield","Zihin okuma ve psychic hasara koruma."],[14,"Create Thrall","Bir humanoid üzerinde uzun süreli bağ."]]),
  make("school-of-abjuration", "School of Abjuration", "Wizard", "dnd_2014", 2, [[2,"Arcane Ward","Abjuration büyülerinden koruyucu ward üretirsin."],[6,"Projected Ward","Ward ile müttefiği korursun."],[10,"Improved Abjuration","Dispel ve Counterspell checklerini güçlendirir."],[14,"Spell Resistance","Büyülere karşı savunma sağlar."]], { resourceName:"Arcane Ward" }),
];

export const SUBCLASS_EXPANSION_2024: DndSubclassData[] = [
  make("light-domain-2024","Light Domain","Cleric","dnd_2024",3,[[3,"Light Domain Spells","Ateş ve ışık odaklı büyüler her zaman hazırdır."],[3,"Radiance of the Dawn","Channel Divinity ile alan hasarı."],[6,"Improved Warding Flare","Müttefikleri reaction ile korur."],[17,"Corona of Light","Yakındaki düşmanları ışık altında zayıflatır."]],{resourceName:"Channel Divinity"}),
  make("trickery-domain-2024","Trickery Domain","Cleric","dnd_2024",3,[[3,"Trickery Domain Spells","İllüzyon ve kontrol büyüleri hazırdır."],[3,"Invoke Duplicity","Sahte bir kopya üzerinden konum avantajı."],[6,"Transposition","Kopya ile yer değiştirirsin."],[17,"Improved Duplicity","Kopya özelliği üst seviyeye çıkar."]],{resourceName:"Channel Divinity"}),
  make("war-domain-2024","War Domain","Cleric","dnd_2024",3,[[3,"War Domain Spells","Savaş odaklı büyüler hazırdır."],[3,"War Priest","Silah ve divine güç eylemlerini birleştirir."],[6,"War God's Blessing","Channel Divinity ile saldırıları destekler."],[17,"Avatar of Battle","Fiziksel hasara karşı dayanıklılık."]],{resourceName:"Channel Divinity"}),
  make("world-tree-2024","Path of the World Tree","Barbarian","dnd_2024",3,[[3,"Vitality of the Tree","Rage çevresinde koruyucu canlılık."],[6,"Branches of the Tree","Reaction ile hedef konumlandırma."],[10,"Battering Roots","Reach ve mastery etkilerini güçlendirir."],[14,"Travel Along the Tree","Parti hareketi ve teleport desteği."]]),
  make("valor-2024","College of Valor","Bard","dnd_2024",3,[[3,"Combat Inspiration","Inspiration savaş savunmasına katkı sağlar."],[3,"Martial Training","Savaş ekipmanı erişimi."],[6,"Extra Attack","Attack Action içinde iki saldırı."],[14,"Battle Magic","Spell ve silah saldırısını birleştirir."]]),
  make("moon-2024","Circle of the Moon","Druid","dnd_2024",3,[[3,"Circle Forms","Wild Shape savaş formları."],[6,"Improved Circle Forms","Form savunması ve saldırısı gelişir."],[10,"Moonlight Step","Bonus action teleport."],[14,"Lunar Form","Form saldırılarına ek güç."]],{resourceName:"Wild Shape"}),
  make("battle-master-2024","Battle Master","Fighter","dnd_2024",3,[[3,"Combat Superiority","Maneuver ve Superiority Dice."],[7,"Know Your Enemy","Hedef analizi."],[10,"Improved Combat Superiority","Maneuver die büyür."],[15,"Relentless","Tur başında sınırlı kaynak yenileme."]],{resourceName:"Superiority Dice"}),
  make("shadow-monk-2024","Warrior of Shadow","Monk","dnd_2024",3,[[3,"Shadow Arts","Focus ile karanlık teknikleri."],[6,"Shadow Step","Gölgeler arası hareket."],[11,"Improved Shadow Step","Teleport sonrasında saldırı desteği."],[17,"Cloak of Shadows","Güçlü görünmezlik hali."]],{resourceName:"Focus Points"}),
  make("ancients-2024","Oath of the Ancients","Paladin","dnd_2024",3,[[3,"Oath Spells","Doğa ve koruma büyüleri."],[3,"Channel Divinity","Doğa temalı kontrol."],[7,"Aura of Warding","Enerji hasarına koruma."],[20,"Elder Champion","Üst seviye dönüşüm."]],{resourceName:"Channel Divinity"}),
  make("beast-master-2024","Beast Master","Ranger","dnd_2024",3,[[3,"Primal Companion","Savaş yoldaşı çağırırsın."],[7,"Exceptional Training","Yoldaş eylemleri gelişir."],[11,"Bestial Fury","Yoldaş saldırıları güçlenir."],[15,"Share Spells","Büyülerini yoldaşla paylaşırsın."]]),
  make("assassin-2024","Assassin","Rogue","dnd_2024",3,[[3,"Assassinate","İnisiyatif ve açılış saldırısı desteği."],[9,"Infiltration Expertise","Kimlik ve taklit becerileri."],[13,"Envenom Weapons","Sneak Attack ile zehir baskısı."],[17,"Death Strike","Açılış hasarını büyütür."]]),
  make("wild-magic-2024","Wild Magic Sorcery","Sorcerer","dnd_2024",3,[[3,"Wild Magic Surge","Kontrollü kaotik büyü etkileri."],[3,"Tides of Chaos","D20 Test avantajı."],[6,"Bend Luck","Yakındaki rolleri değiştirir."],[18,"Tamed Surge","Surge sonucunu daha iyi yönetirsin."]]),
  make("great-old-one-2024","Great Old One Patron","Warlock","dnd_2024",3,[[3,"Awakened Mind","Telepatik bağlantı."],[6,"Clairvoyant Combatant","Zihinsel bağ kurulan hedefe üstünlük."],[10,"Thought Shield","Psychic savunma."],[14,"Create Thrall","Güçlü zihinsel bağ."]]),
  make("abjurer-2024","Abjurer","Wizard","dnd_2024",3,[[3,"Abjuration Savant","Abjuration büyülerinde uzmanlık."],[3,"Arcane Ward","Hasarı emen ward."],[6,"Projected Ward","Ward ile müttefik koruma."],[14,"Spell Resistance","Spell savunması."]],{resourceName:"Arcane Ward"}),
];
